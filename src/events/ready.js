import { Events, ActivityType } from 'discord.js';
import LevelManager from '../utils/levelManager.js';
import VoiceRoomManager from '../utils/voiceRoomManager.js';

export default {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`[INFO] Bot'a ${client.user.username} İsmiyle Giriş Yapıldı!`);
    
    // Bot durumunu ayarla
    client.user.setPresence({
      activities: [{ name: '!yardım', type: ActivityType.Listening }],
      status: 'idle',
    });
    
    // Seviye sistemi voice XP izleme
    const levelManager = new LevelManager();
    const voiceStates = new Map();
    
    // İlk başta tüm aktif ses bağlantılarını kaydet
    for (const guild of client.guilds.cache.values()) {
      for (const [userId, state] of guild.voiceStates.cache) {
        if (state.channelId && !state.member.user.bot) {
          voiceStates.set(userId, {
            channelId: state.channelId,
            guild: guild.id,
            joinedAt: Date.now()
          });
        }
      }
    }
    
    // Her 5 dakikada bir ses kanallarındaki kullanıcılara XP ver
    setInterval(() => {
      for (const [userId, data] of voiceStates.entries()) {
        const guild = client.guilds.cache.get(data.guild);
        if (!guild) continue;
        
        const member = guild.members.cache.get(userId);
        if (!member) continue;
        
        // Kullanıcı hala ses kanalında mı?
        if (!member.voice.channelId) {
          voiceStates.delete(userId);
          continue;
        }
        
        // AFK kanalında mı?
        if (guild.afkChannelId === member.voice.channelId) continue;
        
        // Tek başına mı?
        const voiceChannel = guild.channels.cache.get(member.voice.channelId);
        if (!voiceChannel) continue;
        
        const members = voiceChannel.members.filter(m => !m.user.bot);
        if (members.size < 2) continue; // Tek başına ise XP verme
        
        // Geçen süreyi hesapla (dakika)
        const now = Date.now();
        const minutesInVoice = Math.floor((now - data.joinedAt) / 60000);
        
        if (minutesInVoice >= 5) {
          // XP ekle ve başlangıç zamanını güncelle
          levelManager.addVoiceXp(member, 5).catch(console.error);
          data.joinedAt = now;
        }
      }
    }, 300000); // 5 dakika (300,000 ms)
    
    // Voice state olaylarını dinle
    client.on(Events.VoiceStateUpdate, (oldState, newState) => {
      const { member } = newState;
      
      // Bot ise işlem yapma
      if (member.user.bot) return;
      
      // Kullanıcı bir ses kanalına katıldı
      if (!oldState.channelId && newState.channelId) {
        voiceStates.set(member.id, {
          channelId: newState.channelId,
          guild: newState.guild.id,
          joinedAt: Date.now()
        });
      }
      // Kullanıcı bir ses kanalından ayrıldı
      else if (oldState.channelId && !newState.channelId) {
        if (voiceStates.has(member.id)) {
          const data = voiceStates.get(member.id);
          const now = Date.now();
          const minutesInVoice = Math.floor((now - data.joinedAt) / 60000);
          
          // En az 1 dakika geçtiyse XP ver
          if (minutesInVoice >= 1) {
            const guild = client.guilds.cache.get(data.guild);
            if (guild) {
              const voiceChannel = guild.channels.cache.get(oldState.channelId);
              if (voiceChannel) {
                // Diğer kullanıcılar var mıydı?
                const otherMembers = oldState.channel?.members.filter(m => !m.user.bot && m.id !== member.id);
                if (otherMembers && otherMembers.size > 0) {
                  levelManager.addVoiceXp(member, minutesInVoice).catch(console.error);
                }
              }
            }
          }
          
          voiceStates.delete(member.id);
        }
      }
      // Kullanıcı ses kanallarını değiştirdi
      else if (oldState.channelId !== newState.channelId) {
        // Eski kanalda geçirilen süre için XP ver
        if (voiceStates.has(member.id)) {
          const data = voiceStates.get(member.id);
          const now = Date.now();
          const minutesInVoice = Math.floor((now - data.joinedAt) / 60000);
          
          // En az 1 dakika geçtiyse XP ver
          if (minutesInVoice >= 1) {
            const guild = client.guilds.cache.get(data.guild);
            if (guild) {
              const voiceChannel = guild.channels.cache.get(oldState.channelId);
              if (voiceChannel) {
                // Diğer kullanıcılar var mıydı?
                const otherMembers = oldState.channel?.members.filter(m => !m.user.bot && m.id !== member.id);
                if (otherMembers && otherMembers.size > 0) {
                  levelManager.addVoiceXp(member, minutesInVoice).catch(console.error);
                }
              }
            }
          }
          
          // Yeni kanal bilgilerini kaydet
          voiceStates.set(member.id, {
            channelId: newState.channelId,
            guild: newState.guild.id,
            joinedAt: Date.now()
          });
        }
      }
    });
    
    // Özel odalar için ses kanalı kontrolcüsü
    const voiceRoomManager = new VoiceRoomManager();
    
    // Her dakikada bir özel odaları kontrol et
    setInterval(() => {
      for (const guild of client.guilds.cache.values()) {
        const config = voiceRoomManager.getConfig(guild.id);
        
        // Sistem aktif değilse veya otomatik silme süresi 0 ise devam et
        if (!config.enabled || config.autoDeleteTime <= 0) continue;
        
        // Tüm özel odaları kontrol et
        const rooms = voiceRoomManager.getAllRooms(guild.id);
        
        for (const room of rooms) {
          const channel = guild.channels.cache.get(room.channelId);
          
          // Kanal yoksa veya silinmişse, kaydı temizle
          if (!channel) {
            voiceRoomManager.deleteRoom(room.ownerId, guild.id, true);
            continue;
          }
          
          // Kanal boş mu kontrol et
          if (channel.members.size === 0) {
            if (!room.emptyTime) {
              // İlk boşalma zamanını kaydet
              voiceRoomManager.updateRoom(room.ownerId, guild.id, { emptyTime: Date.now() });
            } else {
              // Boş kalma süresi, belirlenen süreden fazla mı?
              const emptyDuration = Date.now() - room.emptyTime;
              if (emptyDuration >= config.autoDeleteTime) {
                // Odayı sil
                voiceRoomManager.deleteRoom(room.ownerId, guild.id);
              }
            }
          } else if (room.emptyTime) {
            // Kanal artık boş değil, emptyTime'ı sıfırla
            voiceRoomManager.updateRoom(room.ownerId, guild.id, { emptyTime: null });
          }
        }
      }
    }, 60000); // 1 dakika
    
    // Özel oda oluşturma kanalını kontrol et
    client.on(Events.VoiceStateUpdate, (oldState, newState) => {
      const { guild, member, channelId } = newState;
      
      // Kullanıcı bir ses kanalına katıldı ve öncesinde bir kanalda değildi
      if (channelId && (!oldState.channelId || oldState.channelId !== channelId)) {
        const config = voiceRoomManager.getConfig(guild.id);
        
        // Sistem aktif değilse veya oluşturma kanalı ayarlanmamışsa devam et
        if (!config.enabled || !config.createChannelId) return;
        
        // Katıldığı kanal oluşturma kanalı mı?
        if (channelId === config.createChannelId) {
          // Kullanıcının oda oluşturma iznini kontrol et
          const canCreate = voiceRoomManager.canCreateRoom(member.id, guild);
          
          if (canCreate.allowed) {
            // Kullanıcı adına göre varsayılan oda adı oluştur
            const defaultName = `${member.displayName}'in Odası`;
            
            // Oda oluştur
            voiceRoomManager.createRoom({
              guild,
              user: member.user,
              name: defaultName,
              userLimit: null,
              isPrivate: false
            }).then(result => {
              if (result.success) {
                // Kullanıcıyı yeni odaya taşı
                try {
                  member.voice.setChannel(result.channel);
                } catch (error) {
                  console.error('Error moving member to new voice channel:', error);
                }
              }
            }).catch(error => {
              console.error('Error creating voice room:', error);
            });
          }
        }
      }
    });
  },
}; 