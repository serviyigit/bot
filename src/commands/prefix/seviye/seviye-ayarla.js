import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import LevelManager from '../../../utils/levelManager.js';

export default {
  name: 'seviye-ayarla',
  description: 'Seviye sistemini yapılandırır',
  usage: '<ayar> [değer]',
  aliases: ['levelconfig', 'levelset', 'levelsettings', 'seviyeayarla', 'seviyeayar'],
  cooldown: 5,
  guildOnly: true,
  category: 'seviye',
  
  async execute(message, args, client) {
    // Yönetici izni kontrolü
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ Bu komutu kullanmak için Yönetici iznine sahip olmalısınız!');
    }
    
    const levelManager = new LevelManager();
    const config = levelManager.getGuildConfig(message.guild.id);
    
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
        return message.reply(`⚠️ Seviye sistemi zaten ${newStatus ? 'aktif' : 'deaktif'} durumda!`);
      }
      
      // Güncelle
      levelManager.updateGuildConfig(message.guild.id, { enabled: newStatus });
      
      return message.reply(`✅ Seviye sistemi ${newStatus ? 'aktif' : 'deaktif'} duruma getirildi!`);
    }
    
    // Bildiri kanalı ayarı
    if (['kanal', 'channel', 'bildirim', 'notification', 'levelup'].includes(setting)) {
      if (args.length < 2) {
        return message.reply('❌ Lütfen bir kanal ID\'si/etiket veya `sıfırla` belirtin!');
      }
      
      // Sıfırlama kontrolü
      if (['sıfırla', 'reset', 'kaldır', 'remove'].includes(args[1].toLowerCase())) {
        levelManager.updateGuildConfig(message.guild.id, { levelUpChannel: null });
        return message.reply('✅ Seviye atlama bildiri kanalı sıfırlandı! Artık bildirimler mesajın gönderildiği kanala yapılacak.');
      }
      
      // Kanal ID kontrolü
      let channelId = args[1].replace(/[<#>]/g, '');
      const channel = message.guild.channels.cache.get(channelId);
      
      if (!channel || !channel.isTextBased()) {
        return message.reply('❌ Geçersiz kanal! Lütfen geçerli bir metin kanalı ID\'si veya etiketi girin.');
      }
      
      // Güncelle
      levelManager.updateGuildConfig(message.guild.id, { levelUpChannel: channel.id });
      
      return message.reply(`✅ Seviye atlama bildiri kanalı ${channel} olarak ayarlandı!`);
    }
    
    // Bildirim türü
    if (['bildirimtipi', 'bildirim-tipi', 'notification-type', 'levelup-type'].includes(setting)) {
      if (args.length < 2) {
        return message.reply('❌ Lütfen bildirim tipini belirtin: `channel`, `dm`, `both` veya `none`');
      }
      
      const value = args[1].toLowerCase();
      let newType;
      
      if (['kanal', 'channel', 'sunucu'].includes(value)) {
        newType = 'channel';
      } else if (['dm', 'özel', 'pm'].includes(value)) {
        newType = 'dm';
      } else if (['both', 'ikisi', 'her-ikisi', 'herikisi'].includes(value)) {
        newType = 'both';
      } else if (['none', 'hiçbiri', 'kapalı', 'devre-dışı'].includes(value)) {
        newType = 'none';
      } else if (['current', 'mevcut', 'şimdiki'].includes(value)) {
        newType = 'current';
      } else {
        return message.reply('❌ Geçersiz bildirim tipi! `channel`, `dm`, `both`, `current` veya `none` olarak belirtin.');
      }
      
      // Güncelle
      levelManager.updateGuildConfig(message.guild.id, { levelUpNotification: newType });
      
      const notificationDesc = {
        'channel': 'belirlenen kanala',
        'dm': 'kullanıcının özel mesajlarına',
        'both': 'hem belirlenen kanala hem de kullanıcının özel mesajlarına',
        'none': 'devre dışı (seviye atlama bildirimi yapılmayacak)',
        'current': 'mesajın yazıldığı kanala'
      };
      
      return message.reply(`✅ Seviye atlama bildirimleri ${notificationDesc[newType]} olarak ayarlandı!`);
    }
    
    // XP oranı
    if (['oran', 'rate', 'xprate', 'xp-rate', 'xporanı', 'xp-oranı'].includes(setting)) {
      if (args.length < 2) {
        return message.reply('❌ Lütfen bir XP oranı (0.1-5.0 arası) belirtin!');
      }
      
      const rate = parseFloat(args[1].replace(',', '.'));
      
      if (isNaN(rate) || rate < 0.1 || rate > 5.0) {
        return message.reply('❌ Geçersiz XP oranı! Oran 0.1 ile 5.0 arasında olmalıdır.');
      }
      
      // Güncelle
      levelManager.updateGuildConfig(message.guild.id, { xpRate: rate });
      
      return message.reply(`✅ XP kazanma oranı **${rate}x** olarak ayarlandı!`);
    }
    
    // Yok sayılan kanallar
    if (['yoksay-kanal', 'ignore-channel', 'ignored-channels', 'yoksayılan-kanallar'].includes(setting)) {
      if (args.length < 2) {
        return message.reply('❌ Lütfen bir işlem ve kanal ID\'si/etiketi belirtin! (`ekle/çıkar/liste/temizle`)');
      }
      
      const action = args[1].toLowerCase();
      
      // Kanal listesini göster
      if (['liste', 'list', 'göster', 'show'].includes(action)) {
        const ignoredChannels = config.ignoredChannels;
        
        if (ignoredChannels.length === 0) {
          return message.reply('ℹ️ Hiç yok sayılan kanal yok.');
        }
        
        const channelList = ignoredChannels.map(id => {
          const channel = message.guild.channels.cache.get(id);
          return channel ? `<#${id}> (${channel.name})` : `Bilinmeyen Kanal (${id})`;
        }).join('\n');
        
        return message.reply(`📋 **Yok Sayılan Kanallar:**\n${channelList}`);
      }
      
      // Listeyi temizle
      if (['temizle', 'clear', 'sıfırla', 'reset', 'tümünü-sil'].includes(action)) {
        levelManager.updateGuildConfig(message.guild.id, { ignoredChannels: [] });
        return message.reply('✅ Yok sayılan kanallar listesi temizlendi!');
      }
      
      if (args.length < 3) {
        return message.reply('❌ Lütfen bir kanal ID\'si veya etiketi belirtin!');
      }
      
      // Kanal ID kontrolü
      let channelId = args[2].replace(/[<#>]/g, '');
      const channel = message.guild.channels.cache.get(channelId);
      
      if (!channel || !channel.isTextBased()) {
        return message.reply('❌ Geçersiz kanal! Lütfen geçerli bir metin kanalı ID\'si veya etiketi girin.');
      }
      
      const ignoredChannels = [...config.ignoredChannels];
      
      // Kanal ekle
      if (['ekle', 'add', 'kaydet', 'save'].includes(action)) {
        if (ignoredChannels.includes(channel.id)) {
          return message.reply(`⚠️ ${channel} kanalı zaten yok sayılıyor!`);
        }
        
        ignoredChannels.push(channel.id);
        levelManager.updateGuildConfig(message.guild.id, { ignoredChannels });
        
        return message.reply(`✅ ${channel} kanalı yok sayılan kanallara eklendi!`);
      }
      
      // Kanal çıkar
      if (['çıkar', 'kaldır', 'remove', 'delete', 'sil'].includes(action)) {
        const index = ignoredChannels.indexOf(channel.id);
        
        if (index === -1) {
          return message.reply(`⚠️ ${channel} kanalı zaten yok sayılmıyor!`);
        }
        
        ignoredChannels.splice(index, 1);
        levelManager.updateGuildConfig(message.guild.id, { ignoredChannels });
        
        return message.reply(`✅ ${channel} kanalı yok sayılan kanallardan çıkarıldı!`);
      }
      
      return message.reply('❌ Geçersiz işlem! `ekle`, `çıkar`, `liste` veya `temizle` olarak belirtin.');
    }
    
    // XP alamayan roller
    if (['xp-yok-rol', 'no-xp-role', 'no-xp-roles', 'xp-alamayan-roller'].includes(setting)) {
      if (args.length < 2) {
        return message.reply('❌ Lütfen bir işlem ve rol ID\'si/etiketi belirtin! (`ekle/çıkar/liste/temizle`)');
      }
      
      const action = args[1].toLowerCase();
      
      // Rol listesini göster
      if (['liste', 'list', 'göster', 'show'].includes(action)) {
        const noXpRoles = config.noXpRoles;
        
        if (noXpRoles.length === 0) {
          return message.reply('ℹ️ Hiç XP alamayan rol yok.');
        }
        
        const roleList = noXpRoles.map(id => {
          const role = message.guild.roles.cache.get(id);
          return role ? `<@&${id}> (${role.name})` : `Bilinmeyen Rol (${id})`;
        }).join('\n');
        
        return message.reply(`📋 **XP Alamayan Roller:**\n${roleList}`);
      }
      
      // Listeyi temizle
      if (['temizle', 'clear', 'sıfırla', 'reset', 'tümünü-sil'].includes(action)) {
        levelManager.updateGuildConfig(message.guild.id, { noXpRoles: [] });
        return message.reply('✅ XP alamayan roller listesi temizlendi!');
      }
      
      if (args.length < 3) {
        return message.reply('❌ Lütfen bir rol ID\'si veya etiketi belirtin!');
      }
      
      // Rol ID kontrolü
      let roleId = args[2].replace(/[<@&>]/g, '');
      const role = message.guild.roles.cache.get(roleId);
      
      if (!role) {
        return message.reply('❌ Geçersiz rol! Lütfen geçerli bir rol ID\'si veya etiketi girin.');
      }
      
      const noXpRoles = [...config.noXpRoles];
      
      // Rol ekle
      if (['ekle', 'add', 'kaydet', 'save'].includes(action)) {
        if (noXpRoles.includes(role.id)) {
          return message.reply(`⚠️ ${role} rolü zaten XP alamayan rollerde!`);
        }
        
        noXpRoles.push(role.id);
        levelManager.updateGuildConfig(message.guild.id, { noXpRoles });
        
        return message.reply(`✅ ${role} rolü XP alamayan rollere eklendi!`);
      }
      
      // Rol çıkar
      if (['çıkar', 'kaldır', 'remove', 'delete', 'sil'].includes(action)) {
        const index = noXpRoles.indexOf(role.id);
        
        if (index === -1) {
          return message.reply(`⚠️ ${role} rolü zaten XP alabiliyor!`);
        }
        
        noXpRoles.splice(index, 1);
        levelManager.updateGuildConfig(message.guild.id, { noXpRoles });
        
        return message.reply(`✅ ${role} rolü XP alamayan rollerden çıkarıldı!`);
      }
      
      return message.reply('❌ Geçersiz işlem! `ekle`, `çıkar`, `liste` veya `temizle` olarak belirtin.');
    }
    
    // Rol ödülleri
    if (['rol-ödülü', 'role-reward', 'rol-ödülleri', 'level-roles'].includes(setting)) {
      if (args.length < 2) {
        return message.reply('❌ Lütfen bir işlem ve seviye/rol belirtin! (`ekle/çıkar/liste/temizle`)');
      }
      
      const action = args[1].toLowerCase();
      
      // Rol ödüllerini göster
      if (['liste', 'list', 'göster', 'show'].includes(action)) {
        const roleRewards = config.roleRewards;
        const levels = Object.keys(roleRewards).sort((a, b) => parseInt(a) - parseInt(b));
        
        if (levels.length === 0) {
          return message.reply('ℹ️ Hiç rol ödülü ayarlanmamış.');
        }
        
        const rewardList = levels.map(level => {
          const roleId = roleRewards[level];
          const role = message.guild.roles.cache.get(roleId);
          return `Seviye **${level}**: ${role ? `<@&${roleId}> (${role.name})` : `Bilinmeyen Rol (${roleId})`}`;
        }).join('\n');
        
        return message.reply(`📋 **Seviye Rol Ödülleri:**\n${rewardList}`);
      }
      
      // Listeyi temizle
      if (['temizle', 'clear', 'sıfırla', 'reset', 'tümünü-sil'].includes(action)) {
        levelManager.updateGuildConfig(message.guild.id, { roleRewards: {} });
        return message.reply('✅ Seviye rol ödülleri temizlendi!');
      }
      
      if (args.length < 4) {
        return message.reply('❌ Lütfen bir seviye ve rol ID\'si/etiketi belirtin! Örnek: `!seviye-ayarla rol-ödülü ekle 10 @Rol`');
      }
      
      // Seviye kontrolü
      const level = parseInt(args[2]);
      
      if (isNaN(level) || level < 1 || level > 100) {
        return message.reply('❌ Geçersiz seviye! Seviye 1 ile 100 arasında olmalıdır.');
      }
      
      // Rol ekle
      if (['ekle', 'add', 'kaydet', 'save'].includes(action)) {
        // Rol ID kontrolü
        let roleId = args[3].replace(/[<@&>]/g, '');
        const role = message.guild.roles.cache.get(roleId);
        
        if (!role) {
          return message.reply('❌ Geçersiz rol! Lütfen geçerli bir rol ID\'si veya etiketi girin.');
        }
        
        // Rol yetkisi kontrolü
        if (role.position >= message.guild.members.me.roles.highest.position) {
          return message.reply('❌ Bu rolü vermek için yetkim yok! Lütfen rolümü bu rolün üzerine taşıyın.');
        }
        
        const roleRewards = { ...config.roleRewards };
        
        roleRewards[level] = role.id;
        levelManager.updateGuildConfig(message.guild.id, { roleRewards });
        
        return message.reply(`✅ Seviye **${level}** için ${role} rolü ödül olarak ayarlandı!`);
      }
      
      // Rol çıkar
      if (['çıkar', 'kaldır', 'remove', 'delete', 'sil'].includes(action)) {
        const roleRewards = { ...config.roleRewards };
        
        if (!roleRewards[level]) {
          return message.reply(`⚠️ Seviye ${level} için zaten bir rol ödülü ayarlanmamış!`);
        }
        
        delete roleRewards[level];
        levelManager.updateGuildConfig(message.guild.id, { roleRewards });
        
        return message.reply(`✅ Seviye **${level}** için ayarlanan rol ödülü kaldırıldı!`);
      }
      
      return message.reply('❌ Geçersiz işlem! `ekle`, `çıkar`, `liste` veya `temizle` olarak belirtin.');
    }
    
    // Bekleme süresi
    if (['bekleme', 'cooldown', 'süre', 'time'].includes(setting)) {
      if (args.length < 2) {
        return message.reply('❌ Lütfen XP kazanma bekleme süresini saniye cinsinden (5-300 arası) belirtin!');
      }
      
      const seconds = parseInt(args[1]);
      
      if (isNaN(seconds) || seconds < 5 || seconds > 300) {
        return message.reply('❌ Geçersiz bekleme süresi! Süre 5 ile 300 saniye arasında olmalıdır.');
      }
      
      // Güncelle (saniyeyi milisaniyeye çevir)
      levelManager.updateGuildConfig(message.guild.id, { cooldown: seconds * 1000 });
      
      return message.reply(`✅ XP kazanma bekleme süresi **${seconds} saniye** olarak ayarlandı!`);
    }
    
    // Seviye mesajı
    if (['mesaj', 'message', 'level-message', 'seviye-mesajı'].includes(setting)) {
      if (args.length < 2) {
        return message.reply('❌ Lütfen yeni seviye atlama mesajını belirtin! Örnek: `!seviye-ayarla mesaj 🎉 {user} seviye {level} oldu!`');
      }
      
      // Değişkenler
      const variables = [
        '{user} - Kullanıcı etiketi',
        '{username} - Kullanıcı adı',
        '{tag} - Kullanıcı etiketi (kullanıcıAdı#0000)',
        '{level} - Yeni seviye',
        '{oldlevel} - Eski seviye',
        '{server} - Sunucu adı'
      ];
      
      // Varsayılan mesaja sıfırla
      if (['sıfırla', 'reset', 'default', 'varsayılan'].includes(args[1].toLowerCase())) {
        levelManager.updateGuildConfig(message.guild.id, { levelUpMessage: '🎉 Tebrikler {user}! **{level}** seviyesine ulaştın!' });
        return message.reply('✅ Seviye atlama mesajı varsayılana sıfırlandı!');
      }
      
      const message_text = args.slice(1).join(' ');
      
      if (message_text.length > 256) {
        return message.reply('❌ Mesaj çok uzun! Maksimum 256 karakter kullanabilirsiniz.');
      }
      
      // Güncelle
      levelManager.updateGuildConfig(message.guild.id, { levelUpMessage: message_text });
      
      // Örnek mesajı hazırla
      const exampleMessage = message_text
        .replace(/{user}/g, `<@${message.author.id}>`)
        .replace(/{username}/g, message.author.username)
        .replace(/{tag}/g, message.author.tag)
        .replace(/{level}/g, '5')
        .replace(/{oldlevel}/g, '4')
        .replace(/{server}/g, message.guild.name);
      
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('✅ Seviye Mesajı Güncellendi')
        .setDescription(`Yeni mesaj ayarlandı. Örnek görünüm:\n\n${exampleMessage}`)
        .addFields({ name: 'Kullanılabilir Değişkenler', value: variables.join('\n') });
      
      return message.reply({ embeds: [embed] });
    }
    
    // Geçersiz ayar
    return message.reply('❌ Geçersiz ayar! Aşağıdaki ayarları kullanabilirsiniz: `durum`, `kanal`, `bildirimtipi`, `oran`, `yoksay-kanal`, `xp-yok-rol`, `rol-ödülü`, `bekleme`, `mesaj`');
  },
};

function createSettingsEmbed(message, config) {
  const embed = new EmbedBuilder()
    .setColor('#3498db')
    .setTitle('⚙️ Seviye Sistemi Ayarları')
    .setDescription(`Aşağıda sunucunuzun seviye sistemi ayarları listelenmektedir. Ayarları değiştirmek için \`${message.prefix}seviye-ayarla <ayar> <değer>\` komutunu kullanabilirsiniz.`)
    .addFields(
      { name: '📊 Durum', value: config.enabled ? '✅ Aktif' : '❌ Deaktif', inline: true },
      { name: '📢 Bildirim Kanalı', value: config.levelUpChannel ? `<#${config.levelUpChannel}>` : '⚠️ Ayarlanmamış', inline: true },
      { name: '🔔 Bildirim Tipi', value: getNotificationType(config.levelUpNotification), inline: true },
      { name: '⚖️ XP Oranı', value: `${config.xpRate}x`, inline: true },
      { name: '⏱️ Bekleme Süresi', value: `${config.cooldown / 1000} saniye`, inline: true },
      { name: '📝 Seviye Mesajı', value: config.levelUpMessage },
      { name: '🚫 Yok Sayılan Kanal Sayısı', value: `${config.ignoredChannels.length} kanal`, inline: true },
      { name: '🚷 XP Alamayan Rol Sayısı', value: `${config.noXpRoles.length} rol`, inline: true },
      { name: '🏆 Rol Ödülü Sayısı', value: `${Object.keys(config.roleRewards).length} ödül`, inline: true }
    )
    .setFooter({ text: 'Seviye Sistemi', iconURL: message.guild.iconURL() });
  
  return embed;
}

function getNotificationType(type) {
  switch (type) {
    case 'channel': return '📢 Kanal';
    case 'dm': return '📨 Özel Mesaj';
    case 'both': return '📢 Kanal + 📨 Özel Mesaj';
    case 'none': return '🔕 Bildirim Yok';
    case 'current': return '💬 Mevcut Kanal';
    default: return 'Bilinmiyor';
  }
} 