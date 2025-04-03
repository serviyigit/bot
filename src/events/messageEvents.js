import { Events, EmbedBuilder, Collection } from 'discord.js';
import ModerationManager from '../utils/moderationManager.js';

/**
 * Anti-spam ve mesaj sayacı event handler
 */
export default {
  name: 'messageEvents',
  once: false,
  
  execute(client) {
    // Moderasyon yöneticisini oluştur
    const moderationManager = new ModerationManager();
    
    // Anti-spam için kullanıcıların mesajlarını tutan map
    const usersMap = new Collection();
    
    // Mesaj oluşturulduğunda
    client.on(Events.MessageCreate, async (message) => {
      // Bot mesajlarını veya DM'leri yoksay
      if (message.author.bot || !message.guild) return;
      
      // İstatistikleri güncelle
      moderationManager.updateStat('messagesSent');
      
      // Anti-spam
      const config = moderationManager.getConfig();
      if (config.antiSpamEnabled) {
        // Sunucu sahibi veya yöneticiler için spam kontrolü yapma
        if (message.member.permissions.has('Administrator') || message.author.id === message.guild.ownerId) {
          return;
        }
        
        // Yetkililere göre anti-spam muafiyeti
        if (config.banRoleId && message.member.roles.cache.has(config.banRoleId)) return;
        if (config.kickRoleId && message.member.roles.cache.has(config.kickRoleId)) return;
        if (config.muteRoleId && message.member.roles.cache.has(config.muteRoleId)) return;
        
        // Kullanıcının verileri mevcut mudur?
        if (usersMap.has(message.author.id)) {
          const userData = usersMap.get(message.author.id);
          const { lastMessage, timer, messageCount, warningIssued } = userData;
          const timeDifference = message.createdTimestamp - lastMessage.createdTimestamp;
          
          // Eğer zaman aralığı (varsayılan: 3 saniye) içerisinde değilse, sayaçları sıfırla
          if (timeDifference > config.antiSpamInterval) {
            clearTimeout(timer);
            userData.messageCount = 1;
            userData.lastMessage = message;
            userData.warningIssued = false;
            userData.timer = setTimeout(() => {
              usersMap.delete(message.author.id);
            }, config.antiSpamInterval * 4);
            
            usersMap.set(message.author.id, userData);
          } else {
            // Spam olabilir, mesaj sayısını artır
            userData.messageCount++;
            userData.lastMessage = message;
            
            // Spam eşiğine yaklaştıysa uyarı ver (eşiğin 1 altı)
            if (messageCount === config.antiSpamThreshold - 1 && !warningIssued) {
              userData.warningIssued = true;
              message.reply(`⚠️ Lütfen mesaj spam yapmayın! Eşiğe ulaşırsanız ceza alacaksınız.`);
            }
            
            // Spam eşiğini aşıldıysa ceza uygula
            if (messageCount >= config.antiSpamThreshold) {
              // Spam yapanın son mesajlarını sil
              try {
                // Mesajları topla
                const messages = await message.channel.messages.fetch({ limit: 20 });
                const userMessages = messages.filter(msg => msg.author.id === message.author.id);
                
                // Son mesajları sil
                await message.channel.bulkDelete(
                  userMessages.first(Math.min(messageCount, 10)), 
                  true
                ).catch(() => {});
              } catch (error) {
                console.error('Spam mesajları silinirken hata:', error);
              }
              
              // İstatistikleri güncelle
              moderationManager.updateStat('spamDetected');
              
              // Spam cezası
              const action = config.antiSpamAction;
              if (action === 'mute') {
                // Mute cezası uygula
                const duration = config.antiSpamMuteDuration;
                
                try {
                  // Discord timeout kullan
                  await message.member.timeout(duration, 'Anti-spam: Çok fazla mesaj gönderildi');
                  
                  // Veritabanına kaydet
                  moderationManager.addMute(
                    message.author.id,
                    client.user.id,
                    'Anti-spam: Çok fazla mesaj gönderildi',
                    duration
                  );
                  
                  const minutes = Math.floor(duration / 60000);
                  const seconds = Math.floor((duration % 60000) / 1000);
                  let timeString = '';
                  if (minutes > 0) timeString += `${minutes} dakika `;
                  if (seconds > 0) timeString += `${seconds} saniye`;
                  
                  // Kullanıcıya bildir
                  message.channel.send(`🔇 ${message.author} spam yaptığınız için **${timeString}** boyunca susturuldunuz.`);
                  
                  // Log kanalına gönder
                  if (config.modLogChannelId) {
                    const logChannel = message.guild.channels.cache.get(config.modLogChannelId);
                    if (logChannel) {
                      const logEmbed = new EmbedBuilder()
                        .setColor('Orange')
                        .setTitle('Anti-Spam Mute')
                        .setDescription(`${message.author} spam yaptığı için susturuldu.`)
                        .addFields(
                          { name: 'Kullanıcı', value: `${message.author.tag} (${message.author.id})` },
                          { name: 'Kanal', value: `${message.channel.name} (${message.channel.id})` },
                          { name: 'Süre', value: timeString },
                          { name: 'Mesaj Sayısı', value: messageCount.toString() },
                          { name: 'Tarih', value: new Date().toLocaleString('tr-TR') }
                        )
                        .setTimestamp();
                      
                      await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                    }
                  }
                } catch (error) {
                  console.error('Anti-spam mute hatası:', error);
                  
                  // Timeout başarısız olursa, muted rolü varsa onu kullan
                  if (config.mutedRoleId) {
                    try {
                      await message.member.roles.add(config.mutedRoleId, 'Anti-spam: Çok fazla mesaj gönderildi');
                      
                      moderationManager.addMute(
                        message.author.id,
                        client.user.id,
                        'Anti-spam: Çok fazla mesaj gönderildi',
                        config.antiSpamMuteDuration
                      );
                      
                      // Kullanıcıya bildir
                      message.channel.send(`🔇 ${message.author} spam yaptığınız için susturuldunuz.`);
                    } catch (roleError) {
                      console.error('Rol ekleme hatası:', roleError);
                    }
                  }
                }
              } else if (action === 'kick') {
                // Kick cezası uygula
                try {
                  // Kullanıcıya DM göndermeye çalış
                  const kickEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Sunucudan Atılma Bildirimi')
                    .setDescription(`**${message.guild.name}** sunucusundan spam yaptığınız için atıldınız.`)
                    .setTimestamp();
                  
                  await message.author.send({ embeds: [kickEmbed] }).catch(() => {});
                  
                  // Kullanıcıyı at
                  await message.member.kick('Anti-spam: Çok fazla mesaj gönderildi');
                  
                  // Veritabanına kaydet
                  moderationManager.addKick(
                    message.author.id,
                    client.user.id,
                    'Anti-spam: Çok fazla mesaj gönderildi'
                  );
                  
                  // Kullanıcıya bildir
                  message.channel.send(`👢 ${message.author.tag} spam yaptığı için sunucudan atıldı.`);
                  
                  // Log kanalına gönder
                  if (config.modLogChannelId) {
                    const logChannel = message.guild.channels.cache.get(config.modLogChannelId);
                    if (logChannel) {
                      const logEmbed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Anti-Spam Kick')
                        .setDescription(`${message.author.tag} spam yaptığı için sunucudan atıldı.`)
                        .addFields(
                          { name: 'Kullanıcı', value: `${message.author.tag} (${message.author.id})` },
                          { name: 'Kanal', value: `${message.channel.name} (${message.channel.id})` },
                          { name: 'Mesaj Sayısı', value: messageCount.toString() },
                          { name: 'Tarih', value: new Date().toLocaleString('tr-TR') }
                        )
                        .setTimestamp();
                      
                      await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                    }
                  }
                } catch (error) {
                  console.error('Anti-spam kick hatası:', error);
                }
              }
              
              // Map'ten kullanıcıyı sil
              usersMap.delete(message.author.id);
            } else {
              // Eşiğe ulaşılmadıysa, veriyi güncelle
              usersMap.set(message.author.id, userData);
            }
          }
        } else {
          // Kullanıcı verisi yoksa, yeni oluştur
          const timer = setTimeout(() => {
            usersMap.delete(message.author.id);
          }, config.antiSpamInterval * 4);
          
          usersMap.set(message.author.id, {
            messageCount: 1,
            lastMessage: message,
            timer,
            warningIssued: false
          });
        }
      }
      
      // İsteğe bağlı: Uzun mesaj kontrolü (log tutma veya moderasyon amaçlı)
      if (message.content.length > 1000) {
        // Log mesajı için kanala gönder
        if (config.serverLogChannelId) {
          const logChannel = message.guild.channels.cache.get(config.serverLogChannelId);
          if (logChannel) {
            // Mesajı kısalt
            let content = message.content;
            if (content.length > 1500) {
              content = content.substring(0, 1500) + "...";
            }
            
            const logEmbed = new EmbedBuilder()
              .setColor('Blue')
              .setTitle('Uzun Mesaj')
              .setDescription(`${message.author} uzun bir mesaj gönderdi.`)
              .addFields(
                { name: 'Kullanıcı', value: `${message.author.tag} (${message.author.id})` },
                { name: 'Kanal', value: `${message.channel.name} (${message.channel.id})` },
                { name: 'Karakter Sayısı', value: message.content.length.toString() },
                { name: 'İçerik', value: content },
                { name: 'Mesaj Linki', value: `[Tıkla](${message.url})` }
              )
              .setTimestamp();
            
            await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
          }
        }
      }
    });
    
    // Mesaj silindiğinde
    client.on(Events.MessageDelete, async (message) => {
      // Bot mesajlarını veya DM'leri yoksay
      if (!message.guild || message.author?.bot) return;
      
      // İstatistikleri güncelle
      moderationManager.updateStat('messagesDeleted');
      
      // İsteğe bağlı: Silinen mesajları logla
      const config = moderationManager.getConfig();
      if (config.serverLogChannelId) {
        const logChannel = message.guild.channels.cache.get(config.serverLogChannelId);
        if (logChannel) {
          // Mesaj içeriği varsa
          if (message.content) {
            // Mesajı kısalt
            let content = message.content;
            if (content.length > 1500) {
              content = content.substring(0, 1500) + "...";
            }
            
            const logEmbed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('Mesaj Silindi')
              .setDescription(`${message.author} tarafından gönderilen bir mesaj silindi.`)
              .addFields(
                { name: 'Kullanıcı', value: `${message.author.tag} (${message.author.id})` },
                { name: 'Kanal', value: `${message.channel.name} (${message.channel.id})` },
                { name: 'İçerik', value: content || 'İçerik alınamadı' },
                { name: 'Tarih', value: new Date().toLocaleString('tr-TR') }
              )
              .setTimestamp();
            
            // Eğer mesajda eklenti varsa bilgi ver
            if (message.attachments.size > 0) {
              let attachmentList = '';
              message.attachments.forEach(attachment => {
                attachmentList += `${attachment.name}: ${attachment.url}\n`;
              });
              logEmbed.addFields({ name: 'Dosyalar', value: attachmentList });
            }
            
            await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
          }
        }
      }
    });
  }
}; 