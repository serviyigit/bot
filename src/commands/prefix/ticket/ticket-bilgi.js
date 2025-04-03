import { EmbedBuilder } from 'discord.js';
import TicketManager from '../../../utils/ticketManager.js';
import MessageLogger from '../../../utils/messageLogger.js';

export default {
  name: 'ticket-bilgi',
  description: 'Mevcut ticket hakkında bilgi verir',
  usage: '',
  aliases: ['ticketbilgi', 'bilgi', 'talep-bilgi', 'info'],
  cooldown: 5,
  guildOnly: true,
  args: false,
  category: 'ticket',
  
  async execute(message, args, client) {
    const channel = message.channel;
    
    if (!channel.name.startsWith('ticket-')) {
      return message.reply('Bu komut sadece ticket kanallarında kullanılabilir!');
    }
    
    // Ticket yöneticisini başlat
    const ticketManager = new TicketManager();
    const messageLogger = new MessageLogger();
    
    // Bu kanal bir ticket kanalı mı kontrol et
    const ticket = ticketManager.getTicketByChannelId(channel.id);
    if (!ticket) {
      return message.reply('Bu kanal bir ticket değil veya veritabanında bulunamadı!');
    }
    
    try {
      // Ticket sahibi bilgilerini al
      const ticketUser = await client.users.fetch(ticket.creatorId).catch(() => ({ tag: 'Bilinmiyor', id: 'Bilinmiyor' }));
      
      // Mesaj istatistiklerini al
      const messageStats = messageLogger.getTicketStats(ticket.ticketId);
      
      // Destek ekibi
      const config = ticketManager.getConfig();
      let supportRoleInfo = 'Ayarlanmamış';
      if (config.supportRoleId) {
        const supportRole = await message.guild.roles.fetch(config.supportRoleId).catch(() => null);
        if (supportRole) {
          supportRoleInfo = `${supportRole} (${supportRole.id})`;
        }
      }
      
      // Eklenen kullanıcılar
      let addedUsersInfo = 'Yok';
      if (ticket.addedUsers && ticket.addedUsers.length > 0) {
        const addedUsersList = [];
        for (const userId of ticket.addedUsers) {
          const user = await client.users.fetch(userId).catch(() => null);
          if (user) {
            addedUsersList.push(`${user.tag} (${user.id})`);
          } else {
            addedUsersList.push(`Bilinmeyen Kullanıcı (${userId})`);
          }
        }
        addedUsersInfo = addedUsersList.join('\n');
      }
      
      // Durum bilgisi
      let statusInfo = '🟢 Açık';
      if (ticket.status === 'closed') {
        statusInfo = '🔴 Kapalı';
      } else if (ticket.status === 'deleted') {
        statusInfo = '⚫ Silinmiş';
      }
      
      const infoEmbed = new EmbedBuilder()
        .setColor(config.embedColor || '#0099ff')
        .setTitle(`Ticket Bilgileri: ${ticket.ticketId}`)
        .addFields(
          { name: '📝 Ticket Kanalı', value: channel.name, inline: true },
          { name: '📊 Durum', value: statusInfo, inline: true },
          { name: '👤 Ticket Sahibi', value: `${ticketUser.tag} (${ticketUser.id})`, inline: false },
          { name: '🕒 Oluşturulma Tarihi', value: `<t:${Math.floor(new Date(ticket.createdAt).getTime() / 1000)}:F>`, inline: true }
        )
        .setTimestamp();
      
      // Kapatılma tarihi varsa ekle
      if (ticket.closedAt) {
        infoEmbed.addFields({ 
          name: '🔒 Kapatılma Tarihi', 
          value: `<t:${Math.floor(new Date(ticket.closedAt).getTime() / 1000)}:F>`, 
          inline: true 
        });
      }
      
      // Kapatılma sebebi varsa ekle
      if (ticket.closedBy) {
        const closedByUser = await client.users.fetch(ticket.closedBy).catch(() => ({ tag: 'Bilinmiyor' }));
        infoEmbed.addFields({ 
          name: '🔒 Kapatan Kullanıcı', 
          value: closedByUser.tag, 
          inline: true 
        });
      }
      
      // Mesaj istatistikleri
      infoEmbed.addFields({ 
        name: '💬 Toplam Mesaj', 
        value: `${messageStats.totalMessages || 0}`, 
        inline: true 
      });
      
      // Eklenen kullanıcılar
      infoEmbed.addFields({ name: '👥 Eklenen Kullanıcılar', value: addedUsersInfo });
      
      // Destek ekibi
      infoEmbed.addFields({ name: '👮 Destek Ekibi', value: supportRoleInfo });
      
      await message.channel.send({ embeds: [infoEmbed] });
    } catch (error) {
      console.error('Ticket bilgileri alınırken hata:', error);
      await message.reply('Ticket bilgileri alınırken bir hata oluştu!');
    }
  },
};
