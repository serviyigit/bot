import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import VoiceRoomManager from '../../../utils/voiceRoomManager.js';

export default {
  name: 'oda-düzenle',
  description: 'Özel ses odanızı düzenler',
  usage: '<isim|limit> <değer>',
  aliases: ['odadüzenle', 'oda-duzenle', 'odaduzenle', 'editroom', 'edit-room'],
  cooldown: 5,
  guildOnly: true,
  args: true,
  category: 'odalar',
  
  async execute(message, args, client) {
    const voiceRoomManager = new VoiceRoomManager();
    const config = voiceRoomManager.getConfig();
    
    if (!config.enabled) {
      return message.reply('Özel oda sistemi şu anda aktif değil!');
    }
    
    // Kullanıcının bir odası var mı kontrol et
    const userRoom = voiceRoomManager.getUserRoom(message.author.id, message.guild.id);
    
    if (!userRoom) {
      return message.reply('❌ Düzenlenecek bir özel odanız bulunmuyor! Önce `oda-oluştur` komutu ile bir oda oluşturun.');
    }
    
    // Düzenleme parametrelerini kontrol et
    const setting = args[0]?.toLowerCase();
    
    if (!setting || !['isim', 'ad', 'name', 'limit', 'kişi', 'kişi-limit', 'user-limit', 'gizlilik', 'privacy'].includes(setting)) {
      return message.reply('❌ Geçersiz düzenleme seçeneği! `isim`, `limit` veya `gizlilik` seçeneklerinden birini kullanın.');
    }
    
    // Değeri kontrol et
    if (args.length < 2 && !['gizlilik', 'privacy'].includes(setting)) {
      return message.reply('❌ Lütfen bir değer belirtin!');
    }
    
    // İsim değişikliği
    if (['isim', 'ad', 'name'].includes(setting)) {
      const newName = args.slice(1).join(' ');
      
      if (newName.length > config.roomNameCharLimit) {
        const truncated = newName.substring(0, config.roomNameCharLimit);
        message.reply(`⚠️ Oda adı çok uzun! ${config.roomNameCharLimit} karaktere kısaltıldı.`);
        
        const result = await voiceRoomManager.updateRoom(message.author.id, message.guild.id, { name: truncated });
        
        if (!result.success) {
          return message.reply(`❌ Oda adı güncellenemedi: ${result.message}`);
        }
        
        return message.reply(`✅ Oda adı \`${truncated}\` olarak güncellendi!`);
      }
      
      const result = await voiceRoomManager.updateRoom(message.author.id, message.guild.id, { name: newName });
      
      if (!result.success) {
        return message.reply(`❌ Oda adı güncellenemedi: ${result.message}`);
      }
      
      return message.reply(`✅ Oda adı \`${newName}\` olarak güncellendi!`);
    }
    
    // Limit değişikliği
    if (['limit', 'kişi', 'kişi-limit', 'user-limit'].includes(setting)) {
      const newLimit = parseInt(args[1]);
      
      if (isNaN(newLimit) || newLimit < 0 || newLimit > 99) {
        return message.reply('❌ Geçersiz kullanıcı limiti! Limit 0 ile 99 arasında olmalıdır. (0 = Limitsiz)');
      }
      
      const result = await voiceRoomManager.updateRoom(message.author.id, message.guild.id, { userLimit: newLimit });
      
      if (!result.success) {
        return message.reply(`❌ Oda limiti güncellenemedi: ${result.message}`);
      }
      
      return message.reply(`✅ Oda kullanıcı limiti ${newLimit === 0 ? 'limitsiz' : `\`${newLimit}\` kişi`} olarak güncellendi!`);
    }
    
    // Gizlilik değişikliği
    if (['gizlilik', 'privacy'].includes(setting)) {
      const currentPrivacy = userRoom.isPrivate;
      const newPrivacy = args[1]?.toLowerCase();
      let isPrivate;
      
      if (newPrivacy) {
        if (['açık', 'public', 'herkese-açık', 'herkeseacik'].includes(newPrivacy)) {
          isPrivate = false;
        } else if (['gizli', 'private', 'özel', 'ozel'].includes(newPrivacy)) {
          isPrivate = true;
        } else {
          return message.reply('❌ Geçersiz gizlilik ayarı! `açık` veya `gizli` olarak belirtin.');
        }
      } else {
        // Parametre verilmediyse tersine çevir
        isPrivate = !currentPrivacy;
      }
      
      // Zaten aynı ayarda ise
      if (isPrivate === currentPrivacy) {
        return message.reply(`❌ Odanız zaten ${isPrivate ? 'gizli' : 'herkese açık'} durumda!`);
      }
      
      const result = await voiceRoomManager.updateRoom(message.author.id, message.guild.id, { isPrivate });
      
      if (!result.success) {
        return message.reply(`❌ Oda gizliliği güncellenemedi: ${result.message}`);
      }
      
      return message.reply(`✅ Oda gizliliği ${isPrivate ? '**gizli**' : '**herkese açık**'} olarak güncellendi!`);
    }
  },
}; 