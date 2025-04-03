import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import VoiceRoomManager from '../../../utils/voiceRoomManager.js';

export default {
  name: 'oda-ayarla',
  description: 'Özel oda sistemini yapılandırır',
  usage: '<ayar> [değer]',
  aliases: ['odaayarla', 'oda-ayar', 'odaayar', 'room-settings', 'roomsettings'],
  cooldown: 5,
  guildOnly: true,
  category: 'odalar',
  
  async execute(message, args, client) {
    // Yönetici izni kontrolü
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ Bu komutu kullanmak için Yönetici iznine sahip olmalısınız!');
    }
    
    const voiceRoomManager = new VoiceRoomManager();
    const config = voiceRoomManager.getGuildConfig(message.guild.id);
    
    // Alt komut kontrolü
    if (args.length === 0) {
      return message.reply({ embeds: [createSettingsEmbed(message, config)] });
    }
    
    const setting = args[0].toLowerCase();
    
    // Durum ayarı
    if (['durum', 'status', 'aktif', 'active', 'enable', 'disable'].includes(setting)) {
      const value = args[1]?.toLowerCase();
      let newStatus;
      
      if (!value) {
        // Değer verilmediyse tersine çevir
        newStatus = !config.enabled;
      } else if (['açık', 'aktif', 'on', 'true', 'yes', 'enable', 'enabled'].includes(value)) {
        newStatus = true;
      } else if (['kapalı', 'deaktif', 'off', 'false', 'no', 'disable', 'disabled'].includes(value)) {
        newStatus = false;
      } else {
        return message.reply('❌ Geçersiz değer! `açık` veya `kapalı` olarak belirtin.');
      }
      
      // Aynı durumdaysa
      if (newStatus === config.enabled) {
        return message.reply(`⚠️ Özel oda sistemi zaten ${newStatus ? 'aktif' : 'deaktif'} durumda!`);
      }
      
      // Güncelle
      voiceRoomManager.updateConfig(message.guild.id, { enabled: newStatus });
      
      return message.reply(`✅ Özel oda sistemi ${newStatus ? 'aktif' : 'deaktif'} duruma getirildi!`);
    }
    
    // Kategori ayarı
    if (['kategori', 'category'].includes(setting)) {
      if (args.length < 2) {
        return message.reply('❌ Lütfen bir kategori ID\'si veya `sıfırla` belirtin!');
      }
      
      // Sıfırlama kontrolü
      if (['sıfırla', 'reset', 'kaldır', 'remove'].includes(args[1].toLowerCase())) {
        voiceRoomManager.updateConfig(message.guild.id, { categoryId: null });
        return message.reply('✅ Özel oda kategori ayarı sıfırlandı! Özel odalar ana sunucuda oluşturulacak.');
      }
      
      // Kategori ID kontrolü
      const categoryId = args[1];
      const category = message.guild.channels.cache.get(categoryId);
      
      if (!category || category.type !== 4) { // ChannelType.GuildCategory = 4
        return message.reply('❌ Geçersiz kategori! Lütfen geçerli bir kategori ID\'si girin.');
      }
      
      // Güncelle
      voiceRoomManager.updateConfig(message.guild.id, { categoryId: categoryId });
      
      return message.reply(`✅ Özel oda kategorisi **${category.name}** (${categoryId}) olarak ayarlandı!`);
    }
    
    // Oluşturma kanalı ayarı
    if (['kanal', 'channel', 'create-channel', 'createchannel', 'oluşturma-kanalı'].includes(setting)) {
      if (args.length < 2) {
        return message.reply('❌ Lütfen bir kanal ID\'si veya `sıfırla` belirtin!');
      }
      
      // Sıfırlama kontrolü
      if (['sıfırla', 'reset', 'kaldır', 'remove'].includes(args[1].toLowerCase())) {
        voiceRoomManager.updateConfig(message.guild.id, { createChannelId: null });
        return message.reply('✅ Özel oda oluşturma kanalı ayarı sıfırlandı! Artık sadece komut ile oda oluşturulabilecek.');
      }
      
      // Kanal ID kontrolü
      const channelId = args[1];
      const channel = message.guild.channels.cache.get(channelId);
      
      if (!channel || channel.type !== 2) { // ChannelType.GuildVoice = 2
        return message.reply('❌ Geçersiz kanal! Lütfen geçerli bir ses kanalı ID\'si girin.');
      }
      
      // Güncelle
      voiceRoomManager.updateConfig(message.guild.id, { createChannelId: channelId });
      
      return message.reply(`✅ Özel oda oluşturma kanalı **${channel.name}** (${channelId}) olarak ayarlandı!`);
    }
    
    // Oda isim limiti
    if (['isim-limiti', 'name-limit', 'char-limit', 'karakter-limiti'].includes(setting)) {
      if (args.length < 2) {
        return message.reply('❌ Lütfen bir karakter limiti (10-100 arası) belirtin!');
      }
      
      const limit = parseInt(args[1]);
      
      if (isNaN(limit) || limit < 10 || limit > 100) {
        return message.reply('❌ Geçersiz karakter limiti! Limit 10 ile 100 arasında olmalıdır.');
      }
      
      // Güncelle
      voiceRoomManager.updateConfig(message.guild.id, { roomNameCharLimit: limit });
      
      return message.reply(`✅ Oda isim karakter limiti **${limit}** olarak ayarlandı!`);
    }
    
    // Oda kullanıcı limiti
    if (['kullanıcı-limiti', 'user-limit', 'max-users', 'max-allowed'].includes(setting)) {
      if (args.length < 2) {
        return message.reply('❌ Lütfen kullanıcı izin limiti (1-20 arası) belirtin!');
      }
      
      const limit = parseInt(args[1]);
      
      if (isNaN(limit) || limit < 1 || limit > 20) {
        return message.reply('❌ Geçersiz kullanıcı izin limiti! Limit 1 ile 20 arasında olmalıdır.');
      }
      
      // Güncelle
      voiceRoomManager.updateConfig(message.guild.id, { maxAllowedUsers: limit });
      
      return message.reply(`✅ Oda başına izin verilebilecek kullanıcı limiti **${limit}** olarak ayarlandı!`);
    }
    
    // Oda limiti
    if (['oda-limiti', 'room-limit', 'max-rooms', 'max-room'].includes(setting)) {
      if (args.length < 2) {
        return message.reply('❌ Lütfen kişi başı oda limiti (1-5 arası) belirtin!');
      }
      
      const limit = parseInt(args[1]);
      
      if (isNaN(limit) || limit < 1 || limit > 5) {
        return message.reply('❌ Geçersiz oda limiti! Limit 1 ile 5 arasında olmalıdır.');
      }
      
      // Güncelle
      voiceRoomManager.updateConfig(message.guild.id, { maxRoomsPerUser: limit });
      
      return message.reply(`✅ Kişi başı oluşturulabilecek oda limiti **${limit}** olarak ayarlandı!`);
    }
    
    // Bekleme süresi
    if (['bekleme', 'cooldown', 'süre', 'time'].includes(setting)) {
      if (args.length < 2) {
        return message.reply('❌ Lütfen oda oluşturma bekleme süresini dakika cinsinden (1-120 arası) belirtin!');
      }
      
      const minutes = parseInt(args[1]);
      
      if (isNaN(minutes) || minutes < 1 || minutes > 120) {
        return message.reply('❌ Geçersiz bekleme süresi! Süre 1 ile 120 dakika arasında olmalıdır.');
      }
      
      // Güncelle (dakikayı milisaniyeye çevir)
      voiceRoomManager.updateConfig(message.guild.id, { createCooldown: minutes * 60000 });
      
      return message.reply(`✅ Oda oluşturma bekleme süresi **${minutes} dakika** olarak ayarlandı!`);
    }
    
    // Otomatik silme süresi
    if (['otomatik-silme', 'auto-delete', 'empty-delete', 'boş-silme'].includes(setting)) {
      if (args.length < 2) {
        return message.reply('❌ Lütfen boş kalan odaların silinme süresini dakika cinsinden (0-120 arası) belirtin! (0 = Devre dışı)');
      }
      
      const minutes = parseInt(args[1]);
      
      if (isNaN(minutes) || minutes < 0 || minutes > 120) {
        return message.reply('❌ Geçersiz otomatik silme süresi! Süre 0 ile 120 dakika arasında olmalıdır.');
      }
      
      // Güncelle (dakikayı milisaniyeye çevir)
      voiceRoomManager.updateConfig(message.guild.id, { autoDeleteTime: minutes * 60000 });
      
      if (minutes === 0) {
        return message.reply('✅ Boş oda otomatik silme devre dışı bırakıldı!');
      }
      
      return message.reply(`✅ Boş kalan odaların otomatik silinme süresi **${minutes} dakika** olarak ayarlandı!`);
    }
    
    // Geçersiz ayar
    return message.reply('❌ Geçersiz ayar! Aşağıdaki ayarları kullanabilirsiniz: `durum`, `kategori`, `kanal`, `isim-limiti`, `kullanıcı-limiti`, `oda-limiti`, `bekleme`, `otomatik-silme`');
  },
};

function createSettingsEmbed(message, config) {
  const embed = new EmbedBuilder()
    .setColor('#3498db')
    .setTitle('🔧 Özel Oda Sistemi Ayarları')
    .setDescription(`Aşağıda sunucunuzun özel oda sistemi ayarları listelenmektedir. Ayarları değiştirmek için \`${message.prefix}oda-ayarla <ayar> <değer>\` komutunu kullanabilirsiniz.`)
    .addFields(
      { name: '📊 Durum', value: config.enabled ? '✅ Aktif' : '❌ Deaktif', inline: true },
      { name: '📁 Kategori', value: config.categoryId ? `<#${config.categoryId}>` : '⚠️ Ayarlanmamış', inline: true },
      { name: '🔊 Oluşturma Kanalı', value: config.createChannelId ? `<#${config.createChannelId}>` : '⚠️ Ayarlanmamış', inline: true },
      { name: '📝 İsim Karakter Limiti', value: `${config.roomNameCharLimit} karakter`, inline: true },
      { name: '👥 Kullanıcı İzin Limiti', value: `${config.maxAllowedUsers} kullanıcı`, inline: true },
      { name: '🏠 Kişi Başı Oda Limiti', value: `${config.maxRoomsPerUser} oda`, inline: true },
      { name: '⏱️ Oda Oluşturma Bekleme Süresi', value: `${config.createCooldown / 60000} dakika`, inline: true },
      { name: '🗑️ Boş Oda Silme Süresi', value: config.autoDeleteTime > 0 ? `${config.autoDeleteTime / 60000} dakika` : '❌ Devre dışı', inline: true }
    )
    .setFooter({ text: 'Özel Oda Sistemi', iconURL: message.guild.iconURL() });
  
  return embed;
} 