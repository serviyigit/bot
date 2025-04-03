import { Events, EmbedBuilder } from 'discord.js';
import ModerationManager from '../utils/moderationManager.js';

/**
 * Kullanıcı giriş-çıkış ve otorol sistemi için event handler
 */
export default {
  name: 'memberEvents',
  once: false,
  
  execute(client) {
    // Moderasyon yöneticisini oluştur
    const moderationManager = new ModerationManager();
    
    // Her 5 dakikada bir, süresi dolmuş cezaları kontrol et
    setInterval(() => {
      const expired = moderationManager.checkExpiredPunishments();
      console.log(`Süre kontrolü: ${expired.mutes.length} mute, ${expired.bans.length} ban, ${expired.warnings.length} uyarı süresi doldu.`);
      
      // Sunuculardan süreleri dolan cezaları kaldır
      client.guilds.cache.forEach(async (guild) => {
        // Süreleri dolan ban cezalarını kaldır
        for (const userId of expired.bans) {
          try {
            await guild.bans.remove(userId, 'Ban süresi doldu');
            console.log(`${guild.name} sunucusunda ${userId} ID'li kullanıcının ban cezası kaldırıldı.`);
            
            // Log kanalına bilgi gönder
            const config = moderationManager.getConfig();
            if (config.modLogChannelId) {
              const logChannel = guild.channels.cache.get(config.modLogChannelId);
              if (logChannel) {
                const logEmbed = new EmbedBuilder()
                  .setColor('Green')
                  .setTitle('Ban Süresi Doldu')
                  .setDescription(`<@${userId}> kullanıcısının ban süresi dolduğu için cezası otomatik olarak kaldırıldı.`)
                  .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
              }
            }
          } catch (error) {
            // Hata durumunda atla (zaten kullanıcı banlı değilse)
            console.error(`${guild.name} sunucusunda ${userId} banı kaldırılırken hata: ${error.message}`);
          }
        }
        
        // Süreleri dolan mute cezalarını kaldır
        for (const userId of expired.mutes) {
          try {
            const member = await guild.members.fetch(userId).catch(() => null);
            if (member) {
              // Timeout'ı kaldır
              await member.timeout(null, 'Mute süresi doldu');
              
              // Eğer muted rolü varsa, o da kaldırılır
              const config = moderationManager.getConfig();
              if (config.mutedRoleId && member.roles.cache.has(config.mutedRoleId)) {
                await member.roles.remove(config.mutedRoleId, 'Mute süresi doldu');
              }
              
              console.log(`${guild.name} sunucusunda ${userId} ID'li kullanıcının mute cezası kaldırıldı.`);
              
              // Log kanalına bilgi gönder
              if (config.modLogChannelId) {
                const logChannel = guild.channels.cache.get(config.modLogChannelId);
                if (logChannel) {
                  const logEmbed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('Mute Süresi Doldu')
                    .setDescription(`<@${userId}> kullanıcısının mute süresi dolduğu için cezası otomatik olarak kaldırıldı.`)
                    .setTimestamp();
                  
                  await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
              }
            }
          } catch (error) {
            console.error(`${guild.name} sunucusunda ${userId} muteı kaldırılırken hata: ${error.message}`);
          }
        }
      });
    }, 5 * 60 * 1000); // 5 dakika
    
    // Kullanıcı sunucuya katıldığında
    client.on(Events.GuildMemberAdd, async (member) => {
      const config = moderationManager.getConfig();
      
      // İstatistikleri güncelle
      moderationManager.updateStat('joins');
      
      // Kullanıcı banlanmış mı kontrol et
      const activeBan = moderationManager.getActiveBan(member.id);
      if (activeBan) {
        try {
          // Kullanıcıya DM göndermeye çalış
          const banEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Sunucudan Yasaklandınız')
            .setDescription(`**${member.guild.name}** sunucusundan yasaklısınız ve otomatik olarak yeniden yasaklandınız.`)
            .addFields(
              { name: 'Yasaklanma Sebebi', value: activeBan.reason },
              { name: 'Yasaklanma Tarihi', value: new Date(activeBan.timestamp).toLocaleString('tr-TR') }
            )
            .setTimestamp();
          
          await member.send({ embeds: [banEmbed] }).catch(() => {});
          
          // Kullanıcıyı yeniden banla
          await member.ban({
            reason: `Aktif ban cezası bulunuyor: ${activeBan.reason}`
          });
          
          console.log(`${member.guild.name} sunucusunda ${member.id} ID'li kullanıcı aktif ban olduğu için yeniden yasaklandı.`);
          
          // Log kanalına bilgi gönder
          if (config.modLogChannelId) {
            const logChannel = member.guild.channels.cache.get(config.modLogChannelId);
            if (logChannel) {
              const logEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('Yasaklı Kullanıcı Katılma Girişimi')
                .setDescription(`<@${member.id}> yasaklı olduğu halde sunucuya katılmaya çalıştı ve otomatik olarak yasaklandı.`)
                .addFields(
                  { name: 'Kullanıcı', value: `${member.user.tag} (${member.id})` },
                  { name: 'Yasaklanma Sebebi', value: activeBan.reason },
                  { name: 'Orijinal Yasaklanma Tarihi', value: new Date(activeBan.timestamp).toLocaleString('tr-TR') }
                )
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
              
              await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
          }
          
          return; // Kullanıcı banlandı, diğer işlemleri yapma
        } catch (error) {
          console.error(`${member.guild.name} sunucusunda ${member.id} aktif ban uygulanırken hata: ${error.message}`);
        }
      }
      
      // Kullanıcı mutelenmiş mi kontrol et
      const activeMute = moderationManager.getActiveMute(member.id);
      if (activeMute) {
        try {
          // Kalan süreyi hesapla
          const remainingTime = activeMute.expiresAt - Date.now();
          
          if (remainingTime > 0) {
            // Kullanıcıya DM göndermeye çalış
            const muteEmbed = new EmbedBuilder()
              .setColor('Orange')
              .setTitle('Susturulmuş Durumdasınız')
              .setDescription(`**${member.guild.name}** sunucusunda hala susturulmuş durumdasınız.`)
              .addFields(
                { name: 'Susturulma Sebebi', value: activeMute.reason },
                { name: 'Susturulma Bitiş Tarihi', value: new Date(activeMute.expiresAt).toLocaleString('tr-TR') }
              )
              .setTimestamp();
            
            await member.send({ embeds: [muteEmbed] }).catch(() => {});
            
            // Kullanıcıyı yeniden mutele
            try {
              // Discord timeout kullan
              await member.timeout(remainingTime, `Aktif mute cezası bulunuyor: ${activeMute.reason}`);
              console.log(`${member.guild.name} sunucusunda ${member.id} ID'li kullanıcı timeout ile susturuldu.`);
            } catch (timeoutError) {
              console.error('Timeout hatası:', timeoutError);
              
              // Timeout başarısız olursa, muted rolü varsa onu kullan
              if (config.mutedRoleId) {
                await member.roles.add(config.mutedRoleId, `Aktif mute cezası bulunuyor: ${activeMute.reason}`);
                console.log(`${member.guild.name} sunucusunda ${member.id} ID'li kullanıcı muted rolü ile susturuldu.`);
              }
            }
            
            // Log kanalına bilgi gönder
            if (config.modLogChannelId) {
              const logChannel = member.guild.channels.cache.get(config.modLogChannelId);
              if (logChannel) {
                const logEmbed = new EmbedBuilder()
                  .setColor('Orange')
                  .setTitle('Susturulmuş Kullanıcı Katıldı')
                  .setDescription(`<@${member.id}> susturulmuş olduğu halde sunucuya katıldı ve otomatik olarak yeniden susturuldu.`)
                  .addFields(
                    { name: 'Kullanıcı', value: `${member.user.tag} (${member.id})` },
                    { name: 'Susturulma Sebebi', value: activeMute.reason },
                    { name: 'Susturulma Bitiş Tarihi', value: new Date(activeMute.expiresAt).toLocaleString('tr-TR') }
                  )
                  .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                  .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
              }
            }
          }
        } catch (error) {
          console.error(`${member.guild.name} sunucusunda ${member.id} aktif mute uygulanırken hata: ${error.message}`);
        }
      }
      
      // Otorol
      if (config.autoRoleEnabled && config.autoRoleId) {
        try {
          await member.roles.add(config.autoRoleId, 'Otorol');
          console.log(`${member.guild.name} sunucusunda ${member.user.tag} kullanıcısına otorol verildi.`);
        } catch (error) {
          console.error(`${member.guild.name} sunucusunda ${member.id} otorol verilirken hata: ${error.message}`);
        }
      }
      
      // Hoşgeldin mesajı
      if (config.welcomeChannelId && config.welcomeMessage) {
        const welcomeChannel = member.guild.channels.cache.get(config.welcomeChannelId);
        if (welcomeChannel) {
          try {
            // Mesajdaki değişkenleri değiştir
            let welcomeMessage = config.welcomeMessage
              .replace(/{user}/g, `<@${member.id}>`)
              .replace(/{server}/g, member.guild.name)
              .replace(/{memberCount}/g, member.guild.memberCount);
            
            // Embed veya düz mesaj olarak gönder
            if (welcomeMessage.length > 2000) {
              const welcomeEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${member.user.tag} Sunucuya Katıldı!`)
                .setDescription(welcomeMessage)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
              
              await welcomeChannel.send({ embeds: [welcomeEmbed] });
            } else {
              await welcomeChannel.send(welcomeMessage);
            }
          } catch (error) {
            console.error(`Hoşgeldin mesajı gönderilirken hata: ${error.message}`);
          }
        }
      }
      
      // Server log kanalına bilgi gönder
      if (config.serverLogChannelId) {
        const logChannel = member.guild.channels.cache.get(config.serverLogChannelId);
        if (logChannel) {
          const createdAt = Math.floor(member.user.createdTimestamp / 1000);
          const joinedAt = Math.floor(member.joinedTimestamp / 1000);
          
          const accountAgeDays = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));
          
          const logEmbed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('Kullanıcı Katıldı')
            .setDescription(`<@${member.id}> sunucuya katıldı!`)
            .addFields(
              { name: 'Kullanıcı', value: `${member.user.tag} (${member.id})` },
              { name: 'Hesap Oluşturulma Tarihi', value: `<t:${createdAt}:F> (<t:${createdAt}:R>)` },
              { name: 'Katılma Tarihi', value: `<t:${joinedAt}:F> (<t:${joinedAt}:R>)` },
              { name: 'Hesap Yaşı', value: `${accountAgeDays} gün` }
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
          
          // Yeni hesap uyarısı
          if (accountAgeDays < 7) {
            logEmbed.addFields({ 
              name: '⚠️ Yeni Hesap Uyarısı', 
              value: 'Bu hesap 7 günden daha yeni!'
            });
          }
          
          await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
        }
      }
    });
    
    // Kullanıcı sunucudan ayrıldığında
    client.on(Events.GuildMemberRemove, async (member) => {
      const config = moderationManager.getConfig();
      
      // İstatistikleri güncelle
      moderationManager.updateStat('leaves');
      
      // Baybay mesajı
      if (config.welcomeChannelId && config.leaveMessage) {
        const leaveChannel = member.guild.channels.cache.get(config.welcomeChannelId);
        if (leaveChannel) {
          try {
            // Mesajdaki değişkenleri değiştir
            let leaveMessage = config.leaveMessage
              .replace(/{user}/g, `${member.user.tag}`)
              .replace(/{server}/g, member.guild.name)
              .replace(/{memberCount}/g, member.guild.memberCount);
            
            // Embed veya düz mesaj olarak gönder
            if (leaveMessage.length > 2000) {
              const leaveEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${member.user.tag} Sunucudan Ayrıldı!`)
                .setDescription(leaveMessage)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
              
              await leaveChannel.send({ embeds: [leaveEmbed] });
            } else {
              await leaveChannel.send(leaveMessage);
            }
          } catch (error) {
            console.error(`Baybay mesajı gönderilirken hata: ${error.message}`);
          }
        }
      }
      
      // Server log kanalına bilgi gönder
      if (config.serverLogChannelId) {
        const logChannel = member.guild.channels.cache.get(config.serverLogChannelId);
        if (logChannel) {
          const createdAt = Math.floor(member.user.createdTimestamp / 1000);
          const nowTimestamp = Math.floor(Date.now() / 1000);
          
          let joinedAt = null;
          if (member.joinedTimestamp) {
            joinedAt = Math.floor(member.joinedTimestamp / 1000);
          }
          
          const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('Kullanıcı Ayrıldı')
            .setDescription(`<@${member.id}> sunucudan ayrıldı!`)
            .addFields(
              { name: 'Kullanıcı', value: `${member.user.tag} (${member.id})` },
              { name: 'Hesap Oluşturulma Tarihi', value: `<t:${createdAt}:F> (<t:${createdAt}:R>)` },
              { name: 'Ayrılma Tarihi', value: `<t:${nowTimestamp}:F>` }
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
          
          // Katılma tarihi biliniyorsa, sunucuda kalma süresini ekle
          if (joinedAt) {
            // Sunucuda kalma süresini hesapla
            const durationDays = Math.floor((Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24));
            const durationHours = Math.floor(((Date.now() - member.joinedTimestamp) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const durationMinutes = Math.floor(((Date.now() - member.joinedTimestamp) % (1000 * 60 * 60)) / (1000 * 60));
            
            // Süreyi insan tarafından okunabilir formata dönüştür
            let durationString = '';
            if (durationDays > 0) durationString += `${durationDays} gün `;
            if (durationHours > 0) durationString += `${durationHours} saat `;
            if (durationMinutes > 0) durationString += `${durationMinutes} dakika`;
            
            if (durationString === '') durationString = 'Birkaç saniye';
            
            logEmbed.addFields(
              { name: 'Katılma Tarihi', value: `<t:${joinedAt}:F> (<t:${joinedAt}:R>)` },
              { name: 'Sunucuda Kalma Süresi', value: durationString }
            );
          }
          
          await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
        }
      }
    });
  }
}; 