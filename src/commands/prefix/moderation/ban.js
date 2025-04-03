import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import ModerationManager from '../../../utils/moderationManager.js';
import ms from 'ms';

export default {
  name: 'ban',
  description: 'Bir kullanıcıyı sunucudan yasaklar',
  usage: '<kullanıcı> [süre] [sebep]',
  aliases: ['yasakla', 'banla'],
  cooldown: 5,
  guildOnly: true,
  args: true,
  category: 'moderation',
  
  async execute(message, args, client) {
    const moderationManager = new ModerationManager();
    const config = moderationManager.getConfig();
    const embedColor = config.embedColor || '#0099ff';
    
    // Yetki kontrolü - Ban yetkisi veya belirlenen role sahip olma
    const banPermission = message.member.permissions.has(PermissionFlagsBits.BanMembers);
    const hasRole = config.banRoleId && message.member.roles.cache.has(config.banRoleId);
    
    if (!banPermission && !hasRole && message.member.id !== message.guild.ownerId) {
      return message.reply('Bu komutu kullanmak için gerekli yetkiye sahip değilsin!');
    }
    
    // Kullanıcı belirleme
    const mentionOrId = args[0];
    let userId, targetUser, targetMember;
    
    if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first();
      userId = targetUser.id;
      targetMember = message.guild.members.cache.get(userId);
    } else {
      userId = mentionOrId.replace(/[<@!>]/g, '');
      try {
        targetUser = await client.users.fetch(userId);
        targetMember = await message.guild.members.fetch(userId).catch(() => null);
      } catch (error) {
        return message.reply('Geçerli bir kullanıcı belirtmelisiniz!');
      }
    }
    
    if (!targetUser) {
      return message.reply('Kullanıcı bulunamadı!');
    }
    
    // Kullanıcının yasaklanabilir olup olmadığını kontrol et
    if (targetMember) {
      if (targetMember.id === message.author.id) {
        return message.reply('Kendinizi yasaklayamazsınız!');
      }
      
      if (targetMember.id === client.user.id) {
        return message.reply('Beni yasaklayamazsınız!');
      }
      
      if (targetMember.id === message.guild.ownerId) {
        return message.reply('Sunucu sahibini yasaklayamazsınız!');
      }
      
      if (!targetMember.bannable) {
        return message.reply('Bu kullanıcıyı yasaklayamam! Muhtemelen yetkileri benden yüksek.');
      }
      
      // Moderatörün rolünün yasaklanacak kişinin rolünden daha aşağıda olup olmadığını kontrol et
      if (message.member.roles.highest.position <= targetMember.roles.highest.position && message.member.id !== message.guild.ownerId) {
        return message.reply('Bu kullanıcıyı yasaklayamazsınız çünkü sizinle aynı veya daha yüksek bir role sahip!');
      }
    }
    
    // Süre ve sebep belirleme
    let duration = 0;
    let timeString = 'kalıcı';
    let reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';
    
    // Süre belirleme (opsiyonel)
    if (args[1] && /^([0-9]+)(s|m|h|d|g|w|y)$/i.test(args[1])) {
      const timeArg = args[1];
      try {
        duration = ms(timeArg);
        timeString = timeArg;
        reason = args.slice(2).join(' ') || 'Sebep belirtilmedi';
      } catch (error) {
        // Süre dönüştürülemezse sebep olarak kabul et
        duration = 0;
        timeString = 'kalıcı';
      }
    }
    
    // Yasaklama işlemini gerçekleştir
    try {
      // Kullanıcıya mesaj göndermeye çalış
      const banEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('Yasaklama Bildirimi')
        .setDescription(`**${message.guild.name}** sunucusundan yasaklandınız`)
        .addFields(
          { name: 'Yasaklayan Yetkili', value: `${message.author.tag} (${message.author.id})` },
          { name: 'Sebep', value: reason },
          { name: 'Süre', value: timeString },
          { name: 'Tarih', value: new Date().toLocaleString('tr-TR') }
        )
        .setTimestamp();
      
      // Kullanıcıya DM göndermeye çalış, hata alırsan devam et
      await targetUser.send({ embeds: [banEmbed] }).catch(() => {});
      
      // Sunucudan yasakla
      await message.guild.members.ban(targetUser.id, { 
        reason: `${message.author.tag} tarafından yasaklandı: ${reason}`
      });
      
      // Ceza veritabanına ekle
      const banInfo = moderationManager.addBan(
        targetUser.id,
        message.author.id,
        reason,
        duration
      );
      
      // Ban bilgisini kanala gönder
      const confirmationEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('Kullanıcı Yasaklandı')
        .setDescription(`<@${targetUser.id}> kullanıcısı başarıyla yasaklandı!`)
        .addFields(
          { name: 'Kullanıcı ID', value: targetUser.id },
          { name: 'Yasaklayan Yetkili', value: `${message.author.tag} (${message.author.id})` },
          { name: 'Sebep', value: reason },
          { name: 'Süre', value: timeString },
          { name: 'Tarih', value: new Date().toLocaleString('tr-TR') }
        )
        .setTimestamp()
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));
      
      await message.channel.send({ embeds: [confirmationEmbed] });
      
      // Log kanalına gönder
      if (config.modLogChannelId) {
        const logChannel = message.guild.channels.cache.get(config.modLogChannelId);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Kullanıcı Yasaklandı')
            .addFields(
              { name: 'Kullanıcı', value: `${targetUser.tag} (${targetUser.id})` },
              { name: 'Yasaklayan Yetkili', value: `${message.author.tag} (${message.author.id})` },
              { name: 'Sebep', value: reason },
              { name: 'Süre', value: timeString },
              { name: 'Bitiş', value: duration > 0 ? new Date(Date.now() + duration).toLocaleString('tr-TR') : 'Kalıcı' },
              { name: 'Tarih', value: new Date().toLocaleString('tr-TR') }
            )
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
          
          await logChannel.send({ embeds: [logEmbed] });
        }
      }
    } catch (error) {
      console.error('Ban hatası:', error);
      return message.reply(`Kullanıcı yasaklanırken bir hata oluştu: ${error.message}`);
    }
  },
}; 