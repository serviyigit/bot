import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import ModerationManager from '../../../utils/moderationManager.js';

export default {
  name: 'warn',
  description: 'Bir kullanıcıya uyarı verir',
  usage: '<kullanıcı> <sebep>',
  aliases: ['uyarı', 'uyar'],
  cooldown: 5,
  guildOnly: true,
  args: true,
  category: 'moderation',
  
  async execute(message, args, client) {
    const moderationManager = new ModerationManager();
    const config = moderationManager.getConfig();
    const embedColor = config.embedColor || '#0099ff';
    
    // Yetki kontrolü - Kick yetkisi, mute yetkisi veya belirlenen role sahip olma
    const kickPermission = message.member.permissions.has(PermissionFlagsBits.KickMembers);
    const timeoutPermission = message.member.permissions.has(PermissionFlagsBits.ModerateMembers);
    const hasRoleMute = config.muteRoleId && message.member.roles.cache.has(config.muteRoleId);
    const hasRoleKick = config.kickRoleId && message.member.roles.cache.has(config.kickRoleId);
    
    if (!kickPermission && !timeoutPermission && !hasRoleMute && !hasRoleKick && message.member.id !== message.guild.ownerId) {
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
    
    // Kullanıcının uyarılabilir olup olmadığını kontrol et
    if (targetUser.id === message.author.id) {
      return message.reply('Kendinizi uyaramazsınız!');
    }
    
    if (targetUser.id === client.user.id) {
      return message.reply('Beni uyaramazsınız!');
    }
    
    if (targetUser.id === message.guild.ownerId) {
      return message.reply('Sunucu sahibini uyaramazsınız!');
    }
    
    // Moderatörün rolünün uyarılacak kişinin rolünden daha aşağıda olup olmadığını kontrol et
    if (targetMember && message.member.roles.highest.position <= targetMember.roles.highest.position && message.member.id !== message.guild.ownerId) {
      return message.reply('Bu kullanıcıyı uyaramazsınız çünkü sizinle aynı veya daha yüksek bir role sahip!');
    }
    
    // Sebebi belirleme
    const reason = args.slice(1).join(' ');
    
    if (!reason) {
      return message.reply('Lütfen bir uyarı sebebi belirtin!');
    }
    
    try {
      // Uyarı ekle
      const warningResult = moderationManager.addWarning(targetUser.id, message.author.id, reason);
      const { warning, total } = warningResult;
      
      // Kullanıcıya mesaj göndermeye çalış
      const warnEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('Uyarı Bildirimi')
        .setDescription(`**${message.guild.name}** sunucusunda uyarı aldınız`)
        .addFields(
          { name: 'Uyaran Yetkili', value: `${message.author.tag} (${message.author.id})` },
          { name: 'Sebep', value: reason },
          { name: 'Uyarı Sayınız', value: `${total}/${config.maxWarnings}` },
          { name: 'Tarih', value: new Date().toLocaleString('tr-TR') }
        )
        .setFooter({ 
          text: `Maksimum uyarı sayısına ulaşıldığında "${config.warningPunishment}" cezası alacaksınız!`
        })
        .setTimestamp();
      
      // Kullanıcıya DM göndermeye çalış, hata alırsan devam et
      await targetUser.send({ embeds: [warnEmbed] }).catch(() => {});
      
      // Uyarı bilgisini kanala gönder
      const confirmationEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('Kullanıcı Uyarıldı')
        .setDescription(`<@${targetUser.id}> kullanıcısı uyarıldı!`)
        .addFields(
          { name: 'Kullanıcı', value: `${targetUser.tag} (${targetUser.id})` },
          { name: 'Uyaran Yetkili', value: `${message.author.tag} (${message.author.id})` },
          { name: 'Sebep', value: reason },
          { name: 'Uyarı Sayısı', value: `${total}/${config.maxWarnings}` },
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
            .setColor('Yellow')
            .setTitle('Kullanıcı Uyarıldı')
            .addFields(
              { name: 'Kullanıcı', value: `${targetUser.tag} (${targetUser.id})` },
              { name: 'Uyaran Yetkili', value: `${message.author.tag} (${message.author.id})` },
              { name: 'Sebep', value: reason },
              { name: 'Uyarı Sayısı', value: `${total}/${config.maxWarnings}` },
              { name: 'Tarih', value: new Date().toLocaleString('tr-TR') }
            )
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
          
          await logChannel.send({ embeds: [logEmbed] });
        }
      }
      
      // Maksimum uyarı sayısına ulaşıldıysa ceza uygula
      if (total >= config.maxWarnings) {
        const punishmentType = config.warningPunishment;
        let punishmentEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('Uyarı Limiti Aşıldı')
          .setDescription(`<@${targetUser.id}> kullanıcısı maksimum uyarı sayısına ulaştı!`)
          .addFields(
            { name: 'Kullanıcı', value: `${targetUser.tag} (${targetUser.id})` },
            { name: 'Uygulanan Ceza', value: punishmentType },
            { name: 'Tarih', value: new Date().toLocaleString('tr-TR') }
          )
          .setTimestamp()
          .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));
        
        if (punishmentType === 'mute') {
          // Mute cezası uygula
          const muteDuration = 3600000; // 1 saat (milisaniye)
          
          if (targetMember) {
            try {
              // Discord timeout kullan
              await targetMember.timeout(muteDuration, 'Maksimum uyarı sayısına ulaşıldı');
              
              // Veritabanına kaydet
              moderationManager.addMute(
                targetUser.id,
                client.user.id,
                'Maksimum uyarı sayısına ulaşıldı',
                muteDuration
              );
              
              punishmentEmbed.addFields({ 
                name: 'Süre', 
                value: '1 saat' 
              });
            } catch (error) {
              console.error('Otomatik mute hatası:', error);
              
              // Timeout başarısız olursa, muted rolü varsa onu kullan
              if (config.mutedRoleId) {
                try {
                  await targetMember.roles.add(config.mutedRoleId, 'Maksimum uyarı sayısına ulaşıldı');
                  
                  moderationManager.addMute(
                    targetUser.id,
                    client.user.id,
                    'Maksimum uyarı sayısına ulaşıldı',
                    muteDuration
                  );
                  
                  punishmentEmbed.addFields({ 
                    name: 'Süre', 
                    value: '1 saat (Rol ile)' 
                  });
                } catch (roleError) {
                  console.error('Rol ekleme hatası:', roleError);
                  punishmentEmbed = null;
                }
              } else {
                punishmentEmbed = null;
              }
            }
          }
        } else if (punishmentType === 'kick' && targetMember) {
          // Kick cezası uygula
          try {
            await targetMember.kick('Maksimum uyarı sayısına ulaşıldı');
            
            // Veritabanına kaydet
            moderationManager.addKick(
              targetUser.id,
              client.user.id,
              'Maksimum uyarı sayısına ulaşıldı'
            );
          } catch (error) {
            console.error('Otomatik kick hatası:', error);
            punishmentEmbed = null;
          }
        } else if (punishmentType === 'ban') {
          // Ban cezası uygula
          try {
            await message.guild.members.ban(targetUser.id, {
              reason: 'Maksimum uyarı sayısına ulaşıldı'
            });
            
            // Veritabanına kaydet
            moderationManager.addBan(
              targetUser.id,
              client.user.id,
              'Maksimum uyarı sayısına ulaşıldı',
              0 // Kalıcı ban
            );
          } catch (error) {
            console.error('Otomatik ban hatası:', error);
            punishmentEmbed = null;
          }
        }
        
        // Ceza embed'i varsa gönder
        if (punishmentEmbed) {
          await message.channel.send({ embeds: [punishmentEmbed] });
          
          // Log kanalına da gönder
          if (config.modLogChannelId) {
            const logChannel = message.guild.channels.cache.get(config.modLogChannelId);
            if (logChannel) {
              await logChannel.send({ embeds: [punishmentEmbed] });
            }
          }
        }
      }
    } catch (error) {
      console.error('Uyarı hatası:', error);
      return message.reply(`Kullanıcı uyarılırken bir hata oluştu: ${error.message}`);
    }
  },
}; 