import { PermissionFlagsBits } from 'discord.js';
import TicketManager from '../../../utils/ticketManager.js';

export default {
  name: 'ticket-cikar',
  description: 'Belirtilen kullanıcıyı mevcut ticket\'tan çıkarır',
  usage: '<@kullanıcı/kullanıcı_id>',
  aliases: ['ticketcikar', 'cikar', 'remove'],
  cooldown: 5,
  guildOnly: true,
  args: true,
  category: 'ticket',
  
  async execute(message, args, client) {
    const channel = message.channel;
    
    // Ticket kanalı kontrolü
    if (!channel.name.startsWith('ticket-')) {
      return message.reply('Bu komut sadece ticket kanallarında kullanılabilir!');
    }
    
    // Ticket yöneticisini başlat
    const ticketManager = new TicketManager();
    
    // Bu kanal bir ticket kanalı mı kontrol et
    const ticket = ticketManager.getTicketByChannelId(channel.id);
    if (!ticket) {
      return message.reply('Bu kanal bir ticket değil veya veritabanında bulunamadı!');
    }
    
    // Yetkiyi kontrol et
    const config = ticketManager.getConfig();
    const isSupport = config.supportRoleId && message.member.roles.cache.has(config.supportRoleId);
    const isAdmin = message.member.permissions.has(PermissionFlagsBits.ManageChannels);
    const isTicketCreator = ticket.creatorId === message.author.id;
    
    if (!isSupport && !isAdmin && !isTicketCreator) {
      return message.reply('Bu komutu kullanmak için yeterli yetkiye sahip değilsiniz!');
    }
    
    // Kullanıcıyı etiketleme veya ID girme
    let targetUser;
    
    if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first();
    } else if (args[0]) {
      try {
        targetUser = await client.users.fetch(args[0]);
      } catch (error) {
        return message.reply('Geçerli bir kullanıcı ID\'si belirtmelisiniz!');
      }
    } else {
      return message.reply('Bir kullanıcı etiketleyin veya ID girin!');
    }
    
    // Kullanıcı kendisini çıkaramaz
    if (targetUser.id === message.author.id) {
      return message.reply('Kendinizi ticket\'tan çıkaramazsınız!');
    }
    
    // Ticket sahibini çıkaramazlar (sadece yöneticiler hariç)
    if (targetUser.id === ticket.creatorId && !isAdmin) {
      return message.reply('Ticket sahibini çıkaramazsınız!');
    }
    
    const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
    
    if (!member) {
      return message.reply('Belirtilen kullanıcı bu sunucuda bulunamadı!');
    }
    
    try {
      // Veritabanında da güncelle
      const result = await ticketManager.removeUserFromTicket({
        channelId: channel.id,
        userId: targetUser.id
      });
      
      if (!result.success) {
        return message.reply(result.message);
      }
      
      // Kanal izinlerini güncelle
      await channel.permissionOverwrites.edit(targetUser.id, {
        ViewChannel: false,
        SendMessages: false,
        ReadMessageHistory: false
      });
      
      await message.reply(`✅ ${targetUser} kullanıcısı bu ticket'tan çıkarıldı!`);
    } catch (error) {
      console.error(error);
      await message.reply('Kullanıcı çıkarılırken bir hata oluştu!');
    }
  },
};
