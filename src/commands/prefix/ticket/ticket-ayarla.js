import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import TicketManager from '../../../utils/ticketManager.js';

export default {
  name: 'ticket-ayarla',
  description: 'Ticket sistemini ayarlar',
  usage: '<ayar> <değer>',
  aliases: ['ticketayarla', 'talep-ayarla'],
  cooldown: 10,
  guildOnly: true,
  args: true,
  category: 'ticket',
  
  async execute(message, args, client) {
    // Yönetici yetkisi kontrolü
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız!');
    }
    
    const ticketManager = new TicketManager();
    const config = ticketManager.getConfig();
    
    // Ayar listesi
    const validSettings = [
      'kategori',
      'kategori-sil',
      'sorumlu',
      'sorumlu-sil',
      'kanal',
      'kanal-sil',
      'log',
      'log-sil',
      'mesaj',
      'renk',
      'buton',
      'max-ticket',
      'liste'
    ];
    
    const setting = args[0]?.toLowerCase();
    
    // Ayar listesi gösterme
    if (setting === 'liste' || !validSettings.includes(setting)) {
      const settingsEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🎫 Ticket Sistemi Ayarları')
        .setDescription('Kullanılabilir ayarlar:')
        .addFields(
          { name: '📂 Kategori', value: `\`${message.prefix}ticket-ayarla kategori <kategori_id/etiket>\`\nTicketların açılacağı kategoriyi ayarlar.` },
          { name: '👮 Sorumlu', value: `\`${message.prefix}ticket-ayarla sorumlu <rol_id/etiket>\`\nTicket sorumlusu rolünü ayarlar.` },
          { name: '📢 Kanal', value: `\`${message.prefix}ticket-ayarla kanal <kanal_id/etiket>\`\nTicket butonunun gönderileceği kanalı ayarlar.` },
          { name: '📝 Log', value: `\`${message.prefix}ticket-ayarla log <kanal_id/etiket>\`\nTicket loglarının gönderileceği kanalı ayarlar.` },
          { name: '💬 Mesaj', value: `\`${message.prefix}ticket-ayarla mesaj <mesaj>\`\nTicket açılışında gösterilecek karşılama mesajını ayarlar.` },
          { name: '🎨 Renk', value: `\`${message.prefix}ticket-ayarla renk <hex_kodu>\`\nTicket embedlerinin rengini ayarlar. Örnek: #FF0000` },
          { name: '🔘 Buton', value: `\`${message.prefix}ticket-ayarla buton <metin>\`\nTicket açma butonunun metnini ayarlar.` },
          { name: '🔢 Max Ticket', value: `\`${message.prefix}ticket-ayarla max-ticket <sayı>\`\nKullanıcı başına maksimum açılabilecek ticket sayısını ayarlar.` },
          { name: '❌ Silme Komutları', value: `\`${message.prefix}ticket-ayarla <ayar>-sil\`\nBelirtilen ayarı sıfırlar. Örnek: kategori-sil` }
        )
        .setFooter({ text: `${message.guild.name} Ticket Sistemi`, iconURL: message.guild.iconURL() })
        .setTimestamp();
      
      return message.channel.send({ embeds: [settingsEmbed] });
    }
    
    // Kategori ayarlama
    if (setting === 'kategori') {
      const category = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      
      if (!category) {
        return message.reply('Geçerli bir kategori ID\'si veya etiketi belirtin!');
      }
      
      ticketManager.updateConfig('categoryId', category.id);
      return message.reply(`✅ Ticket kategorisi ${category} olarak ayarlandı!`);
    }
    
    // Kategori silme
    if (setting === 'kategori-sil') {
      ticketManager.updateConfig('categoryId', null);
      return message.reply('✅ Ticket kategorisi sıfırlandı!');
    }
    
    // Sorumlu rol ayarlama
    if (setting === 'sorumlu') {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      
      if (!role) {
        return message.reply('Geçerli bir rol ID\'si veya etiketi belirtin!');
      }
      
      ticketManager.updateConfig('supportRoleId', role.id);
      return message.reply(`✅ Ticket sorumlusu rolü ${role} olarak ayarlandı!`);
    }
    
    // Sorumlu rol silme
    if (setting === 'sorumlu-sil') {
      ticketManager.updateConfig('supportRoleId', null);
      return message.reply('✅ Ticket sorumlusu rolü sıfırlandı!');
    }
    
    // Ticket kanal ayarlama
    if (setting === 'kanal') {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      
      if (!channel) {
        return message.reply('Geçerli bir kanal ID\'si veya etiketi belirtin!');
      }
      
      ticketManager.updateConfig('channelId', channel.id);
      return message.reply(`✅ Ticket butonunun gönderileceği kanal ${channel} olarak ayarlandı!`);
    }
    
    // Ticket kanal silme
    if (setting === 'kanal-sil') {
      ticketManager.updateConfig('channelId', null);
      return message.reply('✅ Ticket buton kanalı sıfırlandı!');
    }
    
    // Log kanal ayarlama
    if (setting === 'log') {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      
      if (!channel) {
        return message.reply('Geçerli bir kanal ID\'si veya etiketi belirtin!');
      }
      
      ticketManager.updateConfig('logChannelId', channel.id);
      return message.reply(`✅ Ticket log kanalı ${channel} olarak ayarlandı!`);
    }
    
    // Log kanal silme
    if (setting === 'log-sil') {
      ticketManager.updateConfig('logChannelId', null);
      return message.reply('✅ Ticket log kanalı sıfırlandı!');
    }
    
    // Karşılama mesajı ayarlama
    if (setting === 'mesaj') {
      const welcomeMessage = args.slice(1).join(' ');
      
      if (!welcomeMessage) {
        return message.reply('Geçerli bir karşılama mesajı belirtin!');
      }
      
      ticketManager.updateConfig('welcomeMessage', welcomeMessage);
      return message.reply(`✅ Ticket karşılama mesajı ayarlandı: "${welcomeMessage}"`);
    }
    
    // Embed rengi ayarlama
    if (setting === 'renk') {
      const color = args[1];
      
      if (!color || !/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
        return message.reply('Geçerli bir HEX renk kodu belirtin! Örnek: #FF0000');
      }
      
      ticketManager.updateConfig('embedColor', color);
      
      const colorEmbed = new EmbedBuilder()
        .setColor(color)
        .setTitle('🎨 Embed Rengi Ayarlandı')
        .setDescription(`Ticket embed rengi ${color} olarak ayarlandı!`);
      
      return message.channel.send({ embeds: [colorEmbed] });
    }
    
    // Buton metni ayarlama
    if (setting === 'buton') {
      const buttonLabel = args.slice(1).join(' ');
      
      if (!buttonLabel) {
        return message.reply('Geçerli bir buton metni belirtin!');
      }
      
      ticketManager.updateConfig('buttonLabel', buttonLabel);
      return message.reply(`✅ Ticket buton metni "${buttonLabel}" olarak ayarlandı!`);
    }
    
    // Maksimum ticket sayısı ayarlama
    if (setting === 'max-ticket') {
      const maxTickets = parseInt(args[1]);
      
      if (isNaN(maxTickets) || maxTickets < 1) {
        return message.reply('Geçerli bir sayı belirtin!');
      }
      
      ticketManager.updateConfig('maxTicketsPerUser', maxTickets);
      return message.reply(`✅ Kullanıcı başına maksimum ticket sayısı ${maxTickets} olarak ayarlandı!`);
    }
  },
}; 