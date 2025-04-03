// Mesaj logları için yardımcı modül
import { EmbedBuilder } from 'discord.js';
import JsonDatabase from './jsonDatabase.js';

class MessageLogger {
  constructor() {
    this.db = new JsonDatabase('message-logs');
  }

  /**
   * Bir mesajı loglar
   * @param {Object} options - Log seçenekleri
   * @param {string} options.ticketId - Ticket ID
   * @param {string} options.userId - Kullanıcı ID
   * @param {string} options.username - Kullanıcı adı
   * @param {string} options.content - Mesaj içeriği
   * @param {Date} options.timestamp - Zaman damgası
   * @param {Array} options.attachments - Eklenti URL'leri dizisi
   */
  async logMessage(options) {
    const { ticketId, userId, username, content, timestamp = new Date(), attachments = [] } = options;

    const messageData = {
      ticketId,
      userId,
      username,
      content,
      timestamp: timestamp.toISOString(),
      attachments
    };

    // Ticket için mesaj koleksiyonuna ekle
    const ticketMessages = this.db.get(ticketId) || [];
    ticketMessages.push(messageData);
    this.db.set(ticketId, ticketMessages);
    
    return messageData;
  }

  /**
   * Bir ticket'ın tüm mesajlarını alır
   * @param {string} ticketId - Ticket ID
   * @returns {Array} - Mesajlar dizisi
   */
  getTicketMessages(ticketId) {
    return this.db.get(ticketId) || [];
  }

  /**
   * Bir ticket'ın mesaj loglarını transcript olarak oluşturur
   * @param {string} ticketId - Ticket ID
   * @param {Object} ticketData - Ticket bilgileri
   * @returns {EmbedBuilder} - Log embedini döndürür
   */
  createTranscript(ticketId, ticketData) {
    const messages = this.getTicketMessages(ticketId);
    
    const embed = new EmbedBuilder()
      .setColor('#2F3136')
      .setTitle(`Ticket Kaydı: ${ticketId}`)
      .setDescription(`Bu ticket ${ticketData.createdAt ? new Date(ticketData.createdAt).toLocaleString() : 'bilinmeyen tarihte'} oluşturuldu ve ${new Date().toLocaleString()} tarihinde kapatıldı.`);

    if (messages.length === 0) {
      embed.addFields({ name: 'Mesaj Bulunamadı', value: 'Bu ticket için kaydedilmiş mesaj bulunmamaktadır.' });
    } else {
      // Özet bilgileri ekle
      embed.addFields(
        { name: 'Mesaj Sayısı', value: `${messages.length}`, inline: true },
        { name: 'Ticket Sahibi', value: `<@${ticketData.creatorId}>`, inline: true }
      );
      
      // Her bir mesajı embed olarak eklemek yerine, önemli mesajları veya bir özet ekleyebiliriz
      embed.addFields({ 
        name: 'Not', 
        value: 'Tüm mesaj içerikleri kayıtlara alınmıştır. Ayrıntılı döküm için yöneticinize başvurun.' 
      });
    }

    return embed;
  }

  /**
   * Bir log kanalına transcript gönderir
   * @param {TextChannel} logChannel - Log kanalı
   * @param {string} ticketId - Ticket ID
   * @param {Object} ticketData - Ticket bilgileri
   */
  async sendTranscriptToChannel(logChannel, ticketId, ticketData) {
    if (!logChannel) return;
    
    const transcriptEmbed = this.createTranscript(ticketId, ticketData);
    await logChannel.send({ embeds: [transcriptEmbed] });
  }

  /**
   * Bir ticket için mesaj istatistiklerini alır
   * @param {string} ticketId - Ticket ID
   * @returns {Object} - İstatistikler
   */
  getTicketStats(ticketId) {
    const messages = this.getTicketMessages(ticketId);
    
    // Kullanıcı başına mesaj sayısı
    const userMessageCounts = {};
    messages.forEach(msg => {
      userMessageCounts[msg.userId] = (userMessageCounts[msg.userId] || 0) + 1;
    });
    
    // İlk ve son mesaj
    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];
    
    return {
      totalMessages: messages.length,
      userMessageCounts,
      firstMessage,
      lastMessage,
      duration: firstMessage && lastMessage ? 
        new Date(lastMessage.timestamp) - new Date(firstMessage.timestamp) : 
        0
    };
  }
}

export default MessageLogger; 