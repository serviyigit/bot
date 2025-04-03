import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import ModerationManager from '../../../utils/moderationManager.js';

export default {
  name: 'mod-ayarla',
  description: 'Moderasyon sistemini ayarlar',
  usage: '<ayar> <değer>',
  aliases: ['modayarla', 'moderasyon', 'moderation-set'],
  cooldown: 10,
  guildOnly: true,
  args: true,
  category: 'moderation',
  
  async execute(message, args, client) {
    // Yönetici yetkisi kontrolü
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız!');
    }
    
    const moderationManager = new ModerationManager();
    const config = moderationManager.getConfig();
    
    // Ayar listesi
    const validSettings = [
      'ban-yetkili',
      'ban-yetkili-sil',
      'kick-yetkili',
      'kick-yetkili-sil',
      'mute-yetkili',
      'mute-yetkili-sil',
      'muted-rol',
      'muted-rol-sil',
      'hosgeldin-kanal',
      'hosgeldin-kanal-sil',
      'hosgeldin-mesaj',
      'baybay-mesaj',
      'otorol',
      'otorol-sil',
      'otorol-ac',
      'otorol-kapat',
      'mod-log',
      'mod-log-sil',
      'server-log',
      'server-log-sil',
      'renk',
      'max-uyari',
      'uyari-ceza',
      'uyari-sure',
      'anti-spam-ac',
      'anti-spam-kapat',
      'anti-spam-esik',
      'anti-spam-aralik',
      'anti-spam-ceza',
      'anti-spam-mute-sure',
      'liste'
    ];
    
    const setting = args[0]?.toLowerCase();
    
    // Ayar listesi gösterme
    if (setting === 'liste' || !validSettings.includes(setting)) {
      const settingsEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('⚙️ Moderasyon Sistemi Ayarları')
        .setDescription('Kullanılabilir ayarlar:')
        .addFields(
          { name: '🛡️ Yetkililer', value: 
            `\`${message.prefix}mod-ayarla ban-yetkili <rol_id/etiket>\`\nBan yetkili rolünü ayarlar.\n` +
            `\`${message.prefix}mod-ayarla kick-yetkili <rol_id/etiket>\`\nKick yetkili rolünü ayarlar.\n` +
            `\`${message.prefix}mod-ayarla mute-yetkili <rol_id/etiket>\`\nMute yetkili rolünü ayarlar.` 
          },
          { name: '🔇 Susturma', value: 
            `\`${message.prefix}mod-ayarla muted-rol <rol_id/etiket>\`\nSusturulan kullanıcılara verilecek rolü ayarlar.` 
          },
          { name: '👋 Hoşgeldin/Baybay', value: 
            `\`${message.prefix}mod-ayarla hosgeldin-kanal <kanal_id/etiket>\`\nHoşgeldin/baybay mesajları kanalını ayarlar.\n` +
            `\`${message.prefix}mod-ayarla hosgeldin-mesaj <mesaj>\`\nHoşgeldin mesajını ayarlar. {user}, {server}, {memberCount} değişkenleri kullanılabilir.\n` +
            `\`${message.prefix}mod-ayarla baybay-mesaj <mesaj>\`\nBaybay mesajını ayarlar. {user}, {server}, {memberCount} değişkenleri kullanılabilir.` 
          },
          { name: '🎖️ Otorol', value: 
            `\`${message.prefix}mod-ayarla otorol <rol_id/etiket>\`\nYeni üyelere otomatik verilecek rolü ayarlar.\n` +
            `\`${message.prefix}mod-ayarla otorol-ac\`\nOtorol sistemini aktifleştirir.\n` +
            `\`${message.prefix}mod-ayarla otorol-kapat\`\nOtorol sistemini devre dışı bırakır.` 
          },
          { name: '📝 Loglar', value: 
            `\`${message.prefix}mod-ayarla mod-log <kanal_id/etiket>\`\nModerasyon logları kanalını ayarlar.\n` +
            `\`${message.prefix}mod-ayarla server-log <kanal_id/etiket>\`\nSunucu logları kanalını ayarlar.` 
          },
          { name: '⚠️ Uyarı Sistemi', value: 
            `\`${message.prefix}mod-ayarla max-uyari <sayı>\`\nMaksimum uyarı sayısını ayarlar.\n` +
            `\`${message.prefix}mod-ayarla uyari-ceza <mute/kick/ban>\`\nUyarı limitine ulaşıldığında uygulanacak cezayı ayarlar.\n` +
            `\`${message.prefix}mod-ayarla uyari-sure <saniye>\`\nUyarıların otomatik silinme süresini ayarlar.` 
          },
          { name: '🚫 Anti-Spam', value: 
            `\`${message.prefix}mod-ayarla anti-spam-ac\`\nAnti-spam sistemini aktifleştirir.\n` +
            `\`${message.prefix}mod-ayarla anti-spam-kapat\`\nAnti-spam sistemini devre dışı bırakır.\n` +
            `\`${message.prefix}mod-ayarla anti-spam-esik <sayı>\`\nSpam algılama eşiğini ayarlar (kaç mesaj).\n` +
            `\`${message.prefix}mod-ayarla anti-spam-aralik <milisaniye>\`\nSpam algılama süresini ayarlar.\n` +
            `\`${message.prefix}mod-ayarla anti-spam-ceza <mute/kick>\`\nSpam yapanlara uygulanacak cezayı ayarlar.\n` +
            `\`${message.prefix}mod-ayarla anti-spam-mute-sure <milisaniye>\`\nSpam durumunda mute süresini ayarlar.` 
          },
          { name: '🎨 Diğer', value: 
            `\`${message.prefix}mod-ayarla renk <hex_kodu>\`\nEmbedlerin rengini ayarlar. Örnek: #FF0000` 
          },
          { name: '❌ Silme Komutları', value: 
            `\`${message.prefix}mod-ayarla <ayar>-sil\`\nBelirtilen ayarı sıfırlar. Örnek: ban-yetkili-sil` 
          }
        )
        .setFooter({ text: `${message.guild.name} Moderasyon Sistemi`, iconURL: message.guild.iconURL() })
        .setTimestamp();
      
      return message.channel.send({ embeds: [settingsEmbed] });
    }
    
    // Ban yetkilisi rolü ayarlama
    if (setting === 'ban-yetkili') {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      
      if (!role) {
        return message.reply('Geçerli bir rol ID\'si veya etiketi belirtin!');
      }
      
      moderationManager.updateConfig('banRoleId', role.id);
      return message.reply(`✅ Ban yetkilisi rolü ${role} olarak ayarlandı!`);
    }
    
    // Ban yetkilisi rolü silme
    if (setting === 'ban-yetkili-sil') {
      moderationManager.updateConfig('banRoleId', null);
      return message.reply('✅ Ban yetkilisi rolü sıfırlandı!');
    }
    
    // Kick yetkilisi rolü ayarlama
    if (setting === 'kick-yetkili') {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      
      if (!role) {
        return message.reply('Geçerli bir rol ID\'si veya etiketi belirtin!');
      }
      
      moderationManager.updateConfig('kickRoleId', role.id);
      return message.reply(`✅ Kick yetkilisi rolü ${role} olarak ayarlandı!`);
    }
    
    // Kick yetkilisi rolü silme
    if (setting === 'kick-yetkili-sil') {
      moderationManager.updateConfig('kickRoleId', null);
      return message.reply('✅ Kick yetkilisi rolü sıfırlandı!');
    }
    
    // Mute yetkilisi rolü ayarlama
    if (setting === 'mute-yetkili') {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      
      if (!role) {
        return message.reply('Geçerli bir rol ID\'si veya etiketi belirtin!');
      }
      
      moderationManager.updateConfig('muteRoleId', role.id);
      return message.reply(`✅ Mute yetkilisi rolü ${role} olarak ayarlandı!`);
    }
    
    // Mute yetkilisi rolü silme
    if (setting === 'mute-yetkili-sil') {
      moderationManager.updateConfig('muteRoleId', null);
      return message.reply('✅ Mute yetkilisi rolü sıfırlandı!');
    }
    
    // Susturulmuş rolü ayarlama
    if (setting === 'muted-rol') {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      
      if (!role) {
        return message.reply('Geçerli bir rol ID\'si veya etiketi belirtin!');
      }
      
      moderationManager.updateConfig('mutedRoleId', role.id);
      return message.reply(`✅ Susturulmuş kullanıcı rolü ${role} olarak ayarlandı!`);
    }
    
    // Susturulmuş rolü silme
    if (setting === 'muted-rol-sil') {
      moderationManager.updateConfig('mutedRoleId', null);
      return message.reply('✅ Susturulmuş kullanıcı rolü sıfırlandı!');
    }
    
    // Hoşgeldin kanalı ayarlama
    if (setting === 'hosgeldin-kanal') {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      
      if (!channel) {
        return message.reply('Geçerli bir kanal ID\'si veya etiketi belirtin!');
      }
      
      moderationManager.updateConfig('welcomeChannelId', channel.id);
      return message.reply(`✅ Hoşgeldin/baybay mesajları kanalı ${channel} olarak ayarlandı!`);
    }
    
    // Hoşgeldin kanalı silme
    if (setting === 'hosgeldin-kanal-sil') {
      moderationManager.updateConfig('welcomeChannelId', null);
      return message.reply('✅ Hoşgeldin/baybay mesajları kanalı sıfırlandı!');
    }
    
    // Hoşgeldin mesajı ayarlama
    if (setting === 'hosgeldin-mesaj') {
      const welcomeMessage = args.slice(1).join(' ');
      
      if (!welcomeMessage) {
        return message.reply('Geçerli bir hoşgeldin mesajı belirtin!');
      }
      
      moderationManager.updateConfig('welcomeMessage', welcomeMessage);
      return message.reply(`✅ Hoşgeldin mesajı ayarlandı: "${welcomeMessage}"`);
    }
    
    // Baybay mesajı ayarlama
    if (setting === 'baybay-mesaj') {
      const leaveMessage = args.slice(1).join(' ');
      
      if (!leaveMessage) {
        return message.reply('Geçerli bir baybay mesajı belirtin!');
      }
      
      moderationManager.updateConfig('leaveMessage', leaveMessage);
      return message.reply(`✅ Baybay mesajı ayarlandı: "${leaveMessage}"`);
    }
    
    // Otorol ayarlama
    if (setting === 'otorol') {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      
      if (!role) {
        return message.reply('Geçerli bir rol ID\'si veya etiketi belirtin!');
      }
      
      moderationManager.updateConfig('autoRoleId', role.id);
      return message.reply(`✅ Otorol ${role} olarak ayarlandı!`);
    }
    
    // Otorol silme
    if (setting === 'otorol-sil') {
      moderationManager.updateConfig('autoRoleId', null);
      return message.reply('✅ Otorol sıfırlandı!');
    }
    
    // Otorol açma
    if (setting === 'otorol-ac') {
      const config = moderationManager.getConfig();
      
      if (!config.autoRoleId) {
        return message.reply(`Otorol açılmadan önce bir otorol ayarlamalısınız! \`${message.prefix}mod-ayarla otorol <rol>\` komutunu kullanın.`);
      }
      
      moderationManager.updateConfig('autoRoleEnabled', true);
      return message.reply('✅ Otorol sistemi aktifleştirildi!');
    }
    
    // Otorol kapatma
    if (setting === 'otorol-kapat') {
      moderationManager.updateConfig('autoRoleEnabled', false);
      return message.reply('✅ Otorol sistemi devre dışı bırakıldı!');
    }
    
    // Moderasyon log kanalı ayarlama
    if (setting === 'mod-log') {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      
      if (!channel) {
        return message.reply('Geçerli bir kanal ID\'si veya etiketi belirtin!');
      }
      
      moderationManager.updateConfig('modLogChannelId', channel.id);
      return message.reply(`✅ Moderasyon log kanalı ${channel} olarak ayarlandı!`);
    }
    
    // Moderasyon log kanalı silme
    if (setting === 'mod-log-sil') {
      moderationManager.updateConfig('modLogChannelId', null);
      return message.reply('✅ Moderasyon log kanalı sıfırlandı!');
    }
    
    // Sunucu log kanalı ayarlama
    if (setting === 'server-log') {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      
      if (!channel) {
        return message.reply('Geçerli bir kanal ID\'si veya etiketi belirtin!');
      }
      
      moderationManager.updateConfig('serverLogChannelId', channel.id);
      return message.reply(`✅ Sunucu log kanalı ${channel} olarak ayarlandı!`);
    }
    
    // Sunucu log kanalı silme
    if (setting === 'server-log-sil') {
      moderationManager.updateConfig('serverLogChannelId', null);
      return message.reply('✅ Sunucu log kanalı sıfırlandı!');
    }
    
    // Embed rengi ayarlama
    if (setting === 'renk') {
      const color = args[1];
      
      if (!color || !/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
        return message.reply('Geçerli bir HEX renk kodu belirtin! Örnek: #FF0000');
      }
      
      moderationManager.updateConfig('embedColor', color);
      
      const colorEmbed = new EmbedBuilder()
        .setColor(color)
        .setTitle('🎨 Embed Rengi Ayarlandı')
        .setDescription(`Moderasyon embed rengi ${color} olarak ayarlandı!`);
      
      return message.channel.send({ embeds: [colorEmbed] });
    }
    
    // Maksimum uyarı sayısı ayarlama
    if (setting === 'max-uyari') {
      const maxWarnings = parseInt(args[1]);
      
      if (isNaN(maxWarnings) || maxWarnings < 1) {
        return message.reply('Geçerli bir sayı belirtin!');
      }
      
      moderationManager.updateConfig('maxWarnings', maxWarnings);
      return message.reply(`✅ Maksimum uyarı sayısı ${maxWarnings} olarak ayarlandı!`);
    }
    
    // Uyarı cezası ayarlama
    if (setting === 'uyari-ceza') {
      const punishmentType = args[1]?.toLowerCase();
      
      if (!punishmentType || !['mute', 'kick', 'ban'].includes(punishmentType)) {
        return message.reply('Geçerli bir ceza türü belirtin! (mute/kick/ban)');
      }
      
      moderationManager.updateConfig('warningPunishment', punishmentType);
      return message.reply(`✅ Uyarı limiti aşıldığında uygulanacak ceza "${punishmentType}" olarak ayarlandı!`);
    }
    
    // Uyarı süresi ayarlama
    if (setting === 'uyari-sure') {
      const timeout = parseInt(args[1]);
      
      if (isNaN(timeout) || timeout < 0) {
        return message.reply('Geçerli bir süre belirtin (saniye cinsinden)!');
      }
      
      const timeoutMs = timeout * 1000; // Saniyeyi milisaniyeye çevir
      moderationManager.updateConfig('warningTimeout', timeoutMs);
      
      // Süreyi okunaklı formata çevir
      const days = Math.floor(timeout / 86400);
      const hours = Math.floor((timeout % 86400) / 3600);
      const minutes = Math.floor((timeout % 3600) / 60);
      const seconds = Math.floor(timeout % 60);
      
      let timeString = '';
      if (days > 0) timeString += `${days} gün `;
      if (hours > 0) timeString += `${hours} saat `;
      if (minutes > 0) timeString += `${minutes} dakika `;
      if (seconds > 0) timeString += `${seconds} saniye `;
      
      return message.reply(`✅ Uyarıların otomatik silinme süresi ${timeString}olarak ayarlandı!`);
    }
    
    // Anti-spam açma
    if (setting === 'anti-spam-ac') {
      moderationManager.updateConfig('antiSpamEnabled', true);
      return message.reply('✅ Anti-spam sistemi aktifleştirildi!');
    }
    
    // Anti-spam kapatma
    if (setting === 'anti-spam-kapat') {
      moderationManager.updateConfig('antiSpamEnabled', false);
      return message.reply('✅ Anti-spam sistemi devre dışı bırakıldı!');
    }
    
    // Anti-spam eşik değeri ayarlama
    if (setting === 'anti-spam-esik') {
      const threshold = parseInt(args[1]);
      
      if (isNaN(threshold) || threshold < 2) {
        return message.reply('Geçerli bir eşik değeri belirtin! (en az 2)');
      }
      
      moderationManager.updateConfig('antiSpamThreshold', threshold);
      return message.reply(`✅ Anti-spam eşik değeri ${threshold} mesaj olarak ayarlandı!`);
    }
    
    // Anti-spam aralık ayarlama
    if (setting === 'anti-spam-aralik') {
      const interval = parseInt(args[1]);
      
      if (isNaN(interval) || interval < 1000) {
        return message.reply('Geçerli bir aralık belirtin! (en az 1000 milisaniye)');
      }
      
      moderationManager.updateConfig('antiSpamInterval', interval);
      return message.reply(`✅ Anti-spam aralığı ${interval} milisaniye olarak ayarlandı!`);
    }
    
    // Anti-spam ceza türü ayarlama
    if (setting === 'anti-spam-ceza') {
      const action = args[1]?.toLowerCase();
      
      if (!action || !['mute', 'kick'].includes(action)) {
        return message.reply('Geçerli bir ceza türü belirtin! (mute/kick)');
      }
      
      moderationManager.updateConfig('antiSpamAction', action);
      return message.reply(`✅ Anti-spam ceza türü "${action}" olarak ayarlandı!`);
    }
    
    // Anti-spam mute süresi ayarlama
    if (setting === 'anti-spam-mute-sure') {
      const duration = parseInt(args[1]);
      
      if (isNaN(duration) || duration < 5000) {
        return message.reply('Geçerli bir süre belirtin! (en az 5000 milisaniye)');
      }
      
      moderationManager.updateConfig('antiSpamMuteDuration', duration);
      
      // Süreyi okunaklı formata çevir
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);
      
      let timeString = '';
      if (minutes > 0) timeString += `${minutes} dakika `;
      if (seconds > 0) timeString += `${seconds} saniye `;
      
      return message.reply(`✅ Anti-spam mute süresi ${timeString}olarak ayarlandı!`);
    }
  },
}; 