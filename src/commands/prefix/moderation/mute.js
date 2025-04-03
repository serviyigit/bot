import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import ModerationManager from '../../../utils/moderationManager.js';
import ms from 'ms';

export default {
  name: 'mute',
  description: 'Bir kullanıcıyı belirli bir süre susturur',
  usage: '<kullanıcı> <süre> [sebep]',
  aliases: ['sustur', 'timeout'],
  cooldown: 5,
  guildOnly: true,
  args: true,
  category: 'moderation',
  
  async execute(message, args, client) {
    const moderationManager = new ModerationManager();
    const config = moderationManager.getConfig();
    const embedColor = config.embedColor || '#0099ff';
    
    // Yetki kontrolü - Zaman aşımı yetkisi veya belirlenen role sahip olma
    const timeoutPermission = message.member.permissions.has(PermissionFlagsBits.ModerateMembers);
    const hasRole = config.muteRoleId && message.member.roles.cache.has(config.muteRoleId);
    
    if (!timeoutPermission && !hasRole && message.member.id !== message.guild.ownerId) {
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
    
    if (!targetUser || !targetMember) {
      return message.reply('Kullanıcı bulunamadı veya sunucuda değil!');
    }
    
    // Kullanıcının susturulabilir olup olmadığını kontrol et
    if (targetMember.id === message.author.id) {
      return message.reply('Kendinizi susturamazsınız!');
    }
    
    if (targetMember.id === client.user.id) {
      return message.reply('Beni susturamazsınız!');
    }
    
    if (targetMember.id === message.guild.ownerId) {
      return message.reply('Sunucu sahibini susturamazsınız!');
    }
    
    if (!targetMember.moderatable) {
      return message.reply('Bu kullanıcıyı susturamam! Muhtemelen yetkileri benden yüksek.');
    }
    
    // Moderatörün rolünün susturulacak kişinin rolünden daha aşağıda olup olmadığını kontrol et
    if (message.member.roles.highest.position <= targetMember.roles.highest.position && message.member.id !== message.guild.ownerId) {
      return message.reply('Bu kullanıcıyı susturamazsınız çünkü sizinle aynı veya daha yüksek bir role sahip!');
    }
    
    // Süreyi belirleme (zorunlu)
    if (!args[1]) {
      return message.reply('Lütfen bir süre belirtin. Örnek: 1h, 10m, 30s');
    }
    
    const timeArg = args[1];
    let duration;
    
    try {
      duration = ms(timeArg);
      
      if (!duration || duration < 5000 || duration > 2419200000) {
        return message.reply('Geçerli bir süre belirtin. En az 5 saniye, en fazla 28 gün olabilir.');
      }
    } catch (error) {
      return message.reply('Geçerli bir süre formatı belirtin. Örnek: 1h, 10m, 30s');
    }
    
    // Sebebi belirleme
    const reason = args.slice(2).join(' ') || 'Sebep belirtilmedi';
    
    // Susturma yöntemi - Discord'un zaman aşımı özelliği ile
    try {
      // Kullanıcıya mesaj göndermeye çalış
      const muteEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('Susturma Bildirimi')
        .setDescription(`**${message.guild.name}** sunucusunda susturuldunuz`)
        .addFields(
          { name: 'Susturan Yetkili', value: `${message.author.tag} (${message.author.id})` },
          { name: 'Sebep', value: reason },
          { name: 'Süre', value: timeArg },
          { name: 'Bitiş', value: new Date(Date.now() + duration).toLocaleString('tr-TR') },
          { name: 'Tarih', value: new Date().toLocaleString('tr-TR') }
        )
        .setTimestamp();
      
      // Kullanıcıya DM göndermeye çalış, hata alırsan devam et
      await targetUser.send({ embeds: [muteEmbed] }).catch(() => {});
      
      let muteSuccess = false;
      let muteType = 'timeout';
      
      // Önce Discord'un timeout özelliğini kullanmaya çalış
      try {
        await targetMember.timeout(duration, `${message.author.tag} tarafından susturuldu: ${reason}`);
        muteSuccess = true;
      } catch (timeoutError) {
        console.error('Timeout hatası:', timeoutError);
        
        // Timeout başarısız olursa, muted rolü varsa onu kullan
        if (config.mutedRoleId) {
          try {
            await targetMember.roles.add(config.mutedRoleId, `${message.author.tag} tarafından susturuldu: ${reason}`);
            muteSuccess = true;
            muteType = 'role';
          } catch (roleError) {
            console.error('Rol ekleme hatası:', roleError);
          }
        }
      }
      
      if (!muteSuccess) {
        return message.reply('Kullanıcı susturulurken bir hata oluştu. Bot yetkilerini kontrol edin.');
      }
      
      // Ceza veritabanına ekle
      const muteInfo = moderationManager.addMute(
        targetUser.id,
        message.author.id,
        reason,
        duration
      );
      
      // Mute bilgisini kanala gönder
      const confirmationEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('Kullanıcı Susturuldu')
        .setDescription(`<@${targetUser.id}> kullanıcısı başarıyla susturuldu!`)
        .addFields(
          { name: 'Kullanıcı', value: `${targetUser.tag} (${targetUser.id})` },
          { name: 'Susturan Yetkili', value: `${message.author.tag} (${message.author.id})` },
          { name: 'Sebep', value: reason },
          { name: 'Süre', value: timeArg },
          { name: 'Bitiş', value: new Date(Date.now() + duration).toLocaleString('tr-TR') },
          { name: 'Susturma Türü', value: muteType === 'timeout' ? 'Discord Zaman Aşımı' : 'Muted Rolü' },
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
            .setColor('Orange')
            .setTitle('Kullanıcı Susturuldu')
            .addFields(
              { name: 'Kullanıcı', value: `${targetUser.tag} (${targetUser.id})` },
              { name: 'Susturan Yetkili', value: `${message.author.tag} (${message.author.id})` },
              { name: 'Sebep', value: reason },
              { name: 'Süre', value: timeArg },
              { name: 'Bitiş', value: new Date(Date.now() + duration).toLocaleString('tr-TR') },
              { name: 'Susturma Türü', value: muteType === 'timeout' ? 'Discord Zaman Aşımı' : 'Muted Rolü' },
              { name: 'Tarih', value: new Date().toLocaleString('tr-TR') }
            )
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
          
          await logChannel.send({ embeds: [logEmbed] });
        }
      }
    } catch (error) {
      console.error('Mute hatası:', error);
      return message.reply(`Kullanıcı susturulurken bir hata oluştu: ${error.message}`);
    }
  },
}; 