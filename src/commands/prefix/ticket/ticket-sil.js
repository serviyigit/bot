import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import TicketManager from '../../../utils/ticketManager.js';
import MessageLogger from '../../../utils/messageLogger.js';

export default {
  name: 'ticket-sil',
  description: 'Mevcut ticket talebini siler',
  usage: '',
  aliases: ['ticketsil', 'sil', 'talep-sil'],
  cooldown: 5,
  guildOnly: true,
  args: false,
  category: 'ticket',
  
  async execute(message, args, client) {
    // Yalnızca kanal yönetme yetkisi olanlar kullanabilir
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply('Bu komutu kullanmak için kanal yönetme yetkisine sahip olmalısınız!');
    }
    
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
    
    try {
      // Önce kapalı değilse kapat
      if (ticket.status !== 'closed') {
        await ticketManager.closeTicket({
          channelId: channel.id,
          userId: message.author.id
        });
      }
      
      // Ticket'ı veritabanında sil olarak işaretle
      await ticketManager.deleteTicket({
        channelId: channel.id
      });
      
      // Silme bildirimi
      const deleteEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Talep Siliniyor')
        .setDescription('Bu talep 5 saniye içinde silinecek...')
        .setTimestamp();
      
      await message.channel.send({ embeds: [deleteEmbed] });
      
      // Ticket logları oluştur ve gönder
      const config = ticketManager.getConfig();
      if (config.logChannelId) {
        const logChannel = await message.guild.channels.fetch(config.logChannelId).catch(() => null);
        if (logChannel) {
          const messageLogger = new MessageLogger();
          await messageLogger.sendTranscriptToChannel(logChannel, ticket.ticketId, {
            ...ticket,
            deletedBy: message.author.id,
            deletedAt: new Date().toISOString()
          });
        }
      }
      
      // 5 saniye bekle ve kanalı sil
      setTimeout(() => {
        channel.delete().catch(error => console.error('Kanal silinirken hata oluştu:', error));
      }, 5000);
    } catch (error) {
      console.error('Ticket silinirken hata:', error);
      return message.reply('Ticket silinirken bir hata oluştu!');
    }
  },
};
