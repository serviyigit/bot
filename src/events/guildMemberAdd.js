import { Events } from 'discord.js';
import RegisterManager from '../utils/registerManager.js';

export default {
  name: Events.GuildMemberAdd,
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
        // Kayıtsız rolünü ver
        if (config.unregisteredRole) {
          try {
            await member.roles.add(config.unregisteredRole, 'Yeni üye - Kayıtsız rolü otomatik verildi');
            console.log(`[KAYIT] ${member.user.tag} kullanıcısına kayıtsız rolü verildi.`);
          } catch (error) {
            console.error(`[HATA] ${member.user.tag} kullanıcısına kayıtsız rolü verilirken bir hata oluştu:`, error);
          }
        }
        
        // Hoşgeldin mesajı
        if (config.welcomeChannel) {
          const welcomeChannel = member.guild.channels.cache.get(config.welcomeChannel);
          if (welcomeChannel) {
            try {
              const welcomeMessage = config.welcomeMessage
                .replace('{user}', member.toString())
                .replace('{server}', member.guild.name)
                .replace('{memberCount}', member.guild.memberCount);
                
              await welcomeChannel.send(welcomeMessage);
            } catch (error) {
              console.error('[HATA] Hoşgeldin mesajı gönderilirken bir hata oluştu:', error);
            }
          }
        }
        
        // Otomatik kayıt özelliği aktif mi?
        if (config.autoRegister) {
          // Kayıt için gerekli roller ayarlanmış mı?
          if (config.memberRole && (config.maleRole || config.femaleRole)) {
            // Varsayılan olarak ilk rolü kullan (erkek/kadın)
            const genderRole = config.maleRole || config.femaleRole;
            const gender = config.maleRole ? 'male' : 'female';
            
            try {
              // Otomatik kayıt işlemi
              const result = await registerManager.registerUser({
                userId: client.user.id, // Bot ID'si
                targetId: member.id,
                guildId: member.guild.id,
                name: member.user.username,
                gender: gender,
                guild: member.guild,
                reason: 'Otomatik kayıt sistemi'
              });
              
              if (result.success) {
                console.log(`[KAYIT] ${member.user.tag} kullanıcısı otomatik kaydedildi.`);
                
                // Log kanalına bilgi gönder
                if (config.registerLog) {
                  const logChannel = member.guild.channels.cache.get(config.registerLog);
                  if (logChannel) {
                    await logChannel.send(`📝 **Otomatik Kayıt:** ${member.user.tag} (${member.id}) kullanıcısı otomatik olarak kaydedildi.`);
                  }
                }
              } else {
                console.error(`[HATA] ${member.user.tag} kullanıcısı otomatik kaydedilirken bir hata oluştu:`, result.message);
              }
            } catch (error) {
              console.error(`[HATA] ${member.user.tag} kullanıcısı otomatik kaydedilirken bir hata oluştu:`, error);
            }
          }
        }
      }
      
      // Server Log 
      if (config.serverLogChannelId) {
        const logChannel = member.guild.channels.cache.get(config.serverLogChannelId);
        if (logChannel) {
          try {
            // Hesap oluşturma zamanı bilgisi
            const createdAt = Math.floor(member.user.createdTimestamp / 1000);
            
            await logChannel.send({
              content: `📥 **Üye Katıldı:** ${member.user.tag} (${member.id})\n` +
                       `📅 **Hesap Oluşturma:** <t:${createdAt}:R>\n` +
                       `👥 **Mevcut Üye Sayısı:** ${member.guild.memberCount}`
            });
          } catch (error) {
            console.error('[HATA] Server log mesajı gönderilirken bir hata oluştu:', error);
          }
        }
      }
    } catch (error) {
      console.error('[HATA] GuildMemberAdd event\'inde bir hata oluştu:', error);
    }
  },
}; 