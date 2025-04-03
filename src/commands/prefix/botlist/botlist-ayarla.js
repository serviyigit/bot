import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import BotlistManager from '../../../utils/botlistManager.js';

export default {
  name: 'botlist-ayarla',
  description: 'Botlist sisteminin ayarlarını yapılandırır',
  usage: '<ayar> <değer>',
  aliases: ['botlistayarla', 'bl-set', 'bl-ayarla'],
  cooldown: 10,
  guildOnly: true,
  args: true,
  category: 'botlist',
  
  async execute(message, args, client) {
    // Yönetici yetkisi kontrolü
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız!');
    }
    
    const botlistManager = new BotlistManager();
    
    if (args.length < 1) {
      return message.reply(`Eksik parametre! Kullanım: \`${message.prefix}${this.name} <ayar> <değer>\``);
    }
    
    const settingName = args[0].toLowerCase();
    
    // Ayarları listele
    if (settingName === 'list' || settingName === 'liste') {
      const config = botlistManager.getConfig();
      
      const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('🔧 Botlist Sistemi Ayarları')
        .setDescription('Botlist sisteminin mevcut ayarları:')
        .addFields(
          { name: 'Durum', value: config.enabled ? '✅ Aktif' : '❌ Devre Dışı', inline: true },
          { name: 'Ekleme Kanalı', value: config.addChannelId ? `<#${config.addChannelId}>` : 'Ayarlanmamış', inline: true },
          { name: 'Log Kanalı', value: config.logChannelId ? `<#${config.logChannelId}>` : 'Ayarlanmamış', inline: true },
          { name: 'İnceleme Kanalı', value: config.reviewChannelId ? `<#${config.reviewChannelId}>` : 'Ayarlanmamış', inline: true },
          { name: 'Vitrin Kanalı', value: config.showcaseChannelId ? `<#${config.showcaseChannelId}>` : 'Ayarlanmamış', inline: true },
          { name: 'Geliştirici Rolü', value: config.developerRoleId ? `<@&${config.developerRoleId}>` : 'Ayarlanmamış', inline: true },
          { name: 'İnceleyici Rolü', value: config.reviewerRoleId ? `<@&${config.reviewerRoleId}>` : 'Ayarlanmamış', inline: true },
          { name: 'Min. Oy Sayısı', value: config.minUpvotes.toString(), inline: true },
          { name: 'Kategoriler', value: config.categories.join(', '), inline: false }
        )
        .setFooter({ text: `${message.guild.name} Botlist Sistemi`, iconURL: message.guild.iconURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }
    
    // Botlist sistemini aç/kapat
    if (settingName === 'durum' || settingName === 'status') {
      const value = args[1]?.toLowerCase();
      
      if (!value || (value !== 'aç' && value !== 'ac' && value !== 'kapat' && value !== 'on' && value !== 'off')) {
        return message.reply(`Geçersiz değer! Kullanım: \`${message.prefix}${this.name} durum <aç/kapat>\``);
      }
      
      const enabled = (value === 'aç' || value === 'ac' || value === 'on');
      botlistManager.updateConfig('enabled', enabled);
      
      return message.reply(`✅ Botlist sistemi başarıyla ${enabled ? 'aktif edildi' : 'devre dışı bırakıldı'}!`);
    }
    
    // Kanal veya rol ayarları
    const validSettings = [
      { name: 'kanal', configKey: 'addChannelId', type: 'channel', description: 'Bot ekleme kanalı' },
      { name: 'log', configKey: 'logChannelId', type: 'channel', description: 'Log kanalı' },
      { name: 'inceleme', configKey: 'reviewChannelId', type: 'channel', description: 'İnceleme kanalı' },
      { name: 'vitrin', configKey: 'showcaseChannelId', type: 'channel', description: 'Vitrin kanalı' },
      { name: 'geliştirici', configKey: 'developerRoleId', type: 'role', description: 'Geliştirici rolü' },
      { name: 'inceleyici', configKey: 'reviewerRoleId', type: 'role', description: 'İnceleyici rolü' },
      { name: 'minoy', configKey: 'minUpvotes', type: 'number', description: 'Minimum oy sayısı' }
    ];
    
    // Ayarı bul
    const setting = validSettings.find(s => s.name === settingName);
    
    if (!setting) {
      // Geçerli ayarları listele
      const validSettingsStr = validSettings.map(s => s.name).join(', ');
      return message.reply(`Geçersiz ayar! Geçerli ayarlar: durum, ${validSettingsStr}, liste`);
    }
    
    // Değer kontrolü
    if (args.length < 2) {
      return message.reply(`Eksik değer! Kullanım: \`${message.prefix}${this.name} ${settingName} <değer>\``);
    }
    
    // Kanal veya rol ayarlarını sıfırlama
    if (args[1].toLowerCase() === 'sıfırla' || args[1].toLowerCase() === 'reset') {
      botlistManager.updateConfig(setting.configKey, null);
      return message.reply(`✅ ${setting.description} başarıyla sıfırlandı!`);
    }
    
    let value;
    
    if (setting.type === 'channel') {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      
      if (!channel) {
        return message.reply(`Geçersiz kanal! Lütfen bir kanal etiketleyin veya ID belirtin.`);
      }
      
      value = channel.id;
    } else if (setting.type === 'role') {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      
      if (!role) {
        return message.reply(`Geçersiz rol! Lütfen bir rol etiketleyin veya ID belirtin.`);
      }
      
      value = role.id;
    } else if (setting.type === 'number') {
      const num = parseInt(args[1]);
      
      if (isNaN(num) || num < 0) {
        return message.reply(`Geçersiz sayı! Lütfen pozitif bir sayı belirtin.`);
      }
      
      value = num;
    } else {
      value = args.slice(1).join(' ');
    }
    
    // Ayarı güncelle
    botlistManager.updateConfig(setting.configKey, value);
    
    // Başarı mesajı
    let successMessage;
    
    if (setting.type === 'channel') {
      successMessage = `✅ ${setting.description} başarıyla <#${value}> olarak ayarlandı!`;
    } else if (setting.type === 'role') {
      successMessage = `✅ ${setting.description} başarıyla <@&${value}> olarak ayarlandı!`;
    } else {
      successMessage = `✅ ${setting.description} başarıyla \`${value}\` olarak ayarlandı!`;
    }
    
    return message.reply(successMessage);
  },
}; 