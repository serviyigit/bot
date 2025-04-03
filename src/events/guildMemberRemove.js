import { Events } from 'discord.js';
import RegisterManager from '../utils/registerManager.js';

export default {
  name: Events.GuildMemberRemove,
  once: false,
  
  async execute(member, client) {
    try {
      // Bot kontrolü - botları geç
      if (member.user.bot) return;
      
      // RegisterManager sınıfını başlat
      const registerManager = new RegisterManager();
      const config = registerManager.getGuildConfig(member.guild.id);
      
      // Kayıt sistemi aktif mi?
      if (config.enabled) {
        // Hoşgeldin/Baybay kanalına mesaj gönder
        if (config.welcomeChannel) {
          const channel = member.guild.channels.cache.get(config.welcomeChannel);
          if (channel) {
            try {
              const leaveMessage = config.leaveMessage || '{user} sunucudan ayrıldı! {memberCount} kişi kaldık.';
              const message = leaveMessage
                .replace('{user}', `${member.user.tag}`)
                .replace('{server}', member.guild.name)
                .replace('{memberCount}', member.guild.memberCount);
                
              await channel.send(message);
            } catch (error) {
              console.error('[HATA] Baybay mesajı gönderilirken bir hata oluştu:', error);
            }
          }
        }
        
        // Kayıt log kanalına mesaj gönder
        if (config.registerLog) {
          const logChannel = member.guild.channels.cache.get(config.registerLog);
          if (logChannel) {
            try {
              // Kullanıcının kayıt bilgilerini al
              const userData = registerManager.getUserData(member.id, member.guild.id);
              
              let logMessage = `📤 **Üye Ayrıldı:** ${member.user.tag} (${member.id})`;
              
              // Kullanıcı kayıtlı mıydı?
              if (userData.isRegistered) {
                logMessage += '\n📝 **Kayıt Durumu:** Kayıtlı üye';
                
                if (userData.name) {
                  logMessage += `\n👤 **Kayıtlı İsim:** ${userData.name}`;
                }
                
                if (userData.age) {
                  logMessage += `\n🔞 **Yaş:** ${userData.age}`;
                }
                
                if (userData.gender) {
                  let genderText = "";
                  
                  switch (userData.gender) {
                    case 'male':
                      genderText = "Erkek";
                      break;
                    case 'female':
                      genderText = "Kadın";
                      break;
                    case 'custom':
                      genderText = userData.customRole || 'Özel';
                      break;
                  }
                  
                  logMessage += `\n🧬 **Cinsiyet:** ${genderText}`;
                }
                
                if (userData.registeredBy) {
                  try {
                    const registrar = await client.users.fetch(userData.registeredBy);
                    logMessage += `\n👮 **Kaydeden Yetkili:** ${registrar.tag} (${registrar.id})`;
                  } catch {
                    logMessage += `\n👮 **Kaydeden Yetkili ID:** ${userData.registeredBy}`;
                  }
                }
                
                if (userData.registeredAt) {
                  const registeredTime = Math.floor(new Date(userData.registeredAt).getTime() / 1000);
                  logMessage += `\n⏱️ **Kayıt Tarihi:** <t:${registeredTime}:R>`;
                }
              } else {
                logMessage += '\n📝 **Kayıt Durumu:** Kayıtsız üye';
              }
              
              await logChannel.send(logMessage);
            } catch (error) {
              console.error('[HATA] Kayıt log mesajı gönderilirken bir hata oluştu:', error);
            }
          }
        }
      }
      
      // Server Log
      if (config.serverLogChannelId) {
        const logChannel = member.guild.channels.cache.get(config.serverLogChannelId);
        if (logChannel) {
          try {
            // Hesap oluşturma ve sunucuya katılma zamanı bilgisi
            const createdAt = Math.floor(member.user.createdTimestamp / 1000);
            const joinedAt = member.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;
            
            let logMessage = `📤 **Üye Ayrıldı:** ${member.user.tag} (${member.id})\n` +
                             `📅 **Hesap Oluşturma:** <t:${createdAt}:R>\n`;
                             
            if (joinedAt) {
              const now = Math.floor(Date.now() / 1000);
              const duration = now - joinedAt;
              
              // Süreyi gün, saat, dakika olarak formatla
              const days = Math.floor(duration / 86400);
              const hours = Math.floor((duration % 86400) / 3600);
              const minutes = Math.floor((duration % 3600) / 60);
              
              let durationText = "";
              if (days > 0) durationText += `${days} gün `;
              if (hours > 0) durationText += `${hours} saat `;
              if (minutes > 0) durationText += `${minutes} dakika`;
              
              logMessage += `⏱️ **Sunucuda Kalma Süresi:** ${durationText.trim()}\n`;
              logMessage += `🚪 **Katılma Tarihi:** <t:${joinedAt}:R>\n`;
            }
            
            logMessage += `👥 **Mevcut Üye Sayısı:** ${member.guild.memberCount}`;
            
            await logChannel.send(logMessage);
          } catch (error) {
            console.error('[HATA] Server log mesajı gönderilirken bir hata oluştu:', error);
          }
        }
      }
    } catch (error) {
      console.error('[HATA] GuildMemberRemove event\'inde bir hata oluştu:', error);
    }
  },
}; 