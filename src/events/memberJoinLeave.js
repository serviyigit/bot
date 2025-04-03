import { Events, EmbedBuilder } from 'discord.js';
import ModerationManager from '../utils/moderationManager.js';

export default {
  name: Events.ClientReady, // İlk başta ClientReady ile bir kez kaydolacak, sonra diğer eventleri dinleyecek
  once: true,
  async execute(client) {
    const moderationManager = new ModerationManager();
    
    // Kullanıcı sunucuya katıldığında
    client.on(Events.GuildMemberAdd, async (member) => {
      try {
        const config = moderationManager.getConfig();
        
        // İstatistikleri güncelle
        moderationManager.updateStat('join');
        
        // Kullanıcının aktif bir ban cezası varsa (database ve Discord ban senkronize değilse)
        const activeBan = moderationManager.getActiveBan(member.id);
        if (activeBan) {
          console.log(`${member.user.tag} kullanıcısı aktif bir ban cezası olmasına rağmen sunucuya katıldı. Yeniden yasaklanıyor.`);
          await member.ban({ reason: `Aktif bir yasaklama cezası: ${activeBan.reason}` });
          return; // İşlemi sonlandır
        }
        
        // Kullanıcının aktif bir mute cezası varsa
        const activeMute = moderationManager.getActiveMute(member.id);
        if (activeMute && config.mutedRoleId) {
          const mutedRole = member.guild.roles.cache.get(config.mutedRoleId);
          if (mutedRole) {
            console.log(`${member.user.tag} kullanıcısına önceki mute cezası yeniden uygulanıyor.`);
            await member.roles.add(mutedRole, `Aktif bir susturulma cezası: ${activeMute.reason}`);
          }
        }
        
        // Otorol sistemi
        if (config.autoRoleEnabled && config.autoRoleId) {
          const autoRole = member.guild.roles.cache.get(config.autoRoleId);
          if (autoRole) {
            await member.roles.add(autoRole, 'Otorol sistemi');
            console.log(`${member.user.tag} kullanıcısına ${autoRole.name} rolü otomatik olarak verildi.`);
          }
        }
        
        // Hoşgeldin mesajı
        if (config.welcomeChannelId) {
          const welcomeChannel = member.guild.channels.cache.get(config.welcomeChannelId);
          if (welcomeChannel && welcomeChannel.isTextBased()) {
            // Varsayılan mesaj veya özel message
            const welcomeMessage = config.welcomeMessage || 'Hoş geldin {user}, sunucumuza katıldığın için teşekkürler!';
            const formattedMessage = welcomeMessage
              .replace('{user}', `${member}`)
              .replace('{username}', member.user.username)
              .replace('{server}', member.guild.name)
              .replace('{memberCount}', member.guild.memberCount);
            
            const welcomeEmbed = new EmbedBuilder()
              .setColor(config.embedColor || '#0099ff')
              .setTitle('Yeni Üye Katıldı!')
              .setDescription(formattedMessage)
              .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
              .addFields(
                { name: 'Kullanıcı', value: `${member.user.tag} (${member.id})`, inline: true },
                { name: 'Hesap Oluşturulma', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Sunucu Üye Sayısı', value: `${member.guild.memberCount}`, inline: true }
              )
              .setTimestamp();
            
            await welcomeChannel.send({ embeds: [welcomeEmbed] });
          }
        }
        
        // Mod log kanalına bildirim
        if (config.serverLogChannelId) {
          const logChannel = member.guild.channels.cache.get(config.serverLogChannelId);
          if (logChannel && logChannel.isTextBased()) {
            const logEmbed = new EmbedBuilder()
              .setColor('#00ff00')
              .setTitle('Üye Katıldı')
              .setDescription(`${member.user.tag} sunucuya katıldı.`)
              .addFields(
                { name: 'Kullanıcı ID', value: member.id, inline: true },
                { name: 'Hesap Oluşturulma', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
              )
              .setTimestamp();
            
            await logChannel.send({ embeds: [logEmbed] });
          }
        }
      } catch (error) {
        console.error(`Kullanıcı katılma olayı işlenirken hata oluştu:`, error);
      }
    });
    
    // Kullanıcı sunucudan ayrıldığında
    client.on(Events.GuildMemberRemove, async (member) => {
      try {
        const config = moderationManager.getConfig();
        
        // İstatistikleri güncelle
        moderationManager.updateStat('leave');
        
        // Hoşçakal mesajı
        if (config.welcomeChannelId) {
          const welcomeChannel = member.guild.channels.cache.get(config.welcomeChannelId);
          if (welcomeChannel && welcomeChannel.isTextBased()) {
            // Varsayılan mesaj veya özel message
            const leaveMessage = config.leaveMessage || 'Görüşürüz {user}, tekrar görüşmek dileğiyle!';
            const formattedMessage = leaveMessage
              .replace('{user}', member.user.tag)
              .replace('{username}', member.user.username)
              .replace('{server}', member.guild.name)
              .replace('{memberCount}', member.guild.memberCount);
            
            const leaveEmbed = new EmbedBuilder()
              .setColor('#ff6347')
              .setTitle('Üye Ayrıldı')
              .setDescription(formattedMessage)
              .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
              .addFields(
                { name: 'Kullanıcı', value: `${member.user.tag} (${member.id})`, inline: true },
                { name: 'Katılma Tarihi', value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Bilinmiyor', inline: true },
                { name: 'Sunucu Üye Sayısı', value: `${member.guild.memberCount}`, inline: true }
              )
              .setTimestamp();
            
            await welcomeChannel.send({ embeds: [leaveEmbed] });
          }
        }
        
        // Mod log kanalına bildirim
        if (config.serverLogChannelId) {
          const logChannel = member.guild.channels.cache.get(config.serverLogChannelId);
          if (logChannel && logChannel.isTextBased()) {
            const logEmbed = new EmbedBuilder()
              .setColor('#ff0000')
              .setTitle('Üye Ayrıldı')
              .setDescription(`${member.user.tag} sunucudan ayrıldı.`)
              .addFields(
                { name: 'Kullanıcı ID', value: member.id, inline: true },
                { name: 'Katılma Tarihi', value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Bilinmiyor', inline: true }
              )
              .setTimestamp();
            
            await logChannel.send({ embeds: [logEmbed] });
          }
        }
      } catch (error) {
        console.error(`Kullanıcı ayrılma olayı işlenirken hata oluştu:`, error);
      }
    });
    
    // Süresi dolan cezaları otomatik kontrol etme (her 5 dakikada bir)
    setInterval(() => {
      try {
        const expiredPunishments = moderationManager.checkExpiredPunishments();
        
        // Süresi dolmuş mute cezaları varsa işle
        if (expiredPunishments.mutes.length > 0) {
          expiredPunishments.mutes.forEach(async (userId) => {
            try {
              // Kullanıcının olduğu tüm sunucuları kontrol et
              client.guilds.cache.forEach(async (guild) => {
                const config = moderationManager.getConfig();
                if (config.mutedRoleId) {
                  const member = await guild.members.fetch(userId).catch(() => null);
                  if (member) {
                    const mutedRole = guild.roles.cache.get(config.mutedRoleId);
                    if (mutedRole && member.roles.cache.has(mutedRole.id)) {
                      await member.roles.remove(mutedRole.id, 'Susturma süresi doldu');
                      console.log(`${member.user.tag} kullanıcısının susturma süresi doldu ve rol kaldırıldı.`);
                      
                      // Mod log
                      if (config.modLogChannelId) {
                        const logChannel = guild.channels.cache.get(config.modLogChannelId);
                        if (logChannel && logChannel.isTextBased()) {
                          const logEmbed = new EmbedBuilder()
                            .setColor('#00ff00')
                            .setTitle('Susturma Sona Erdi')
                            .setDescription(`${member.user.tag} kullanıcısının susturma süresi doldu.`)
                            .addFields(
                              { name: 'Kullanıcı ID', value: member.id, inline: true }
                            )
                            .setTimestamp();
                          
                          await logChannel.send({ embeds: [logEmbed] });
                        }
                      }
                    }
                  }
                }
              });
            } catch (innerError) {
              console.error(`Ceza süresi dolan kullanıcı işlenirken hata oluştu:`, innerError);
            }
          });
        }
        
        // Süresi dolmuş ban cezaları varsa işle
        if (expiredPunishments.bans.length > 0) {
          console.log(`${expiredPunishments.bans.length} kullanıcının ban süresi doldu. Bunlar manuel olarak kaldırılmalı.`);
        }
        
      } catch (error) {
        console.error(`Ceza süresi kontrol edilirken hata oluştu:`, error);
      }
    }, 5 * 60 * 1000); // 5 dakika (300.000 ms)
    
    console.log('Üye giriş/çıkış ve otorol sistemleri başlatıldı!');
  }
}; 