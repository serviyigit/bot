// Ticket yönetimi için veritabanı işlemleri
import { ChannelType, PermissionFlagsBits } from 'discord.js';
import JsonDatabase from './jsonDatabase.js';
import MessageLogger from './messageLogger.js';

class TicketManager {
  constructor() {
    this.db = new JsonDatabase('ticket-system');
    this.messageLogger = new MessageLogger();
    this.initializeDatabase();
  }

  // Veritabanı yapısını başlat
  initializeDatabase() {
    if (!this.db.has('config')) {
      this.db.set('config', {
        // Ticket kategorisi (ticket kanalları bu kategoride açılır)
        categoryId: null,
        // Ticket sorumlusu rol ID'si
        supportRoleId: null,
        // Ticketların açılacağı kanal ID'si (buton mesajının gönderileceği kanal)
        channelId: null,
        // Log kanalı ID'si (isteğe bağlı)
        logChannelId: null,
        // Ticket açılışı için mesaj
        welcomeMessage: 'Destek ekibimiz en kısa sürede size yardımcı olacaktır. Lütfen sorununuzu detaylı bir şekilde açıklayın.',
        // Ticket açılırken kullanılacak embed rengi
        embedColor: '#0099ff',
        // Ticket sayacı (otomatik artar)
        ticketCounter: 0,
        // Maksimum açılabilecek ticket sayısı (kullanıcı başına)
        maxTicketsPerUser: 1,
        // Ticket açarken kullanılacak buton etiketi
        buttonLabel: 'Destek Talebi Oluştur',
        // Ticket türleri (opsiyonel)
        ticketTypes: []
      });
    }

    if (!this.db.has('tickets')) {
      this.db.set('tickets', []);
    }

    if (!this.db.has('activeTickets')) {
      this.db.set('activeTickets', {});
    }
  }

  // Yapılandırmayı al
  getConfig() {
    return this.db.get('config');
  }

  // Yapılandırmayı güncelle
  updateConfig(key, value) {
    const config = this.getConfig();
    config[key] = value;
    return this.db.set('config', config);
  }

  // Ticket sayacını artır
  incrementTicketCounter() {
    const config = this.getConfig();
    config.ticketCounter += 1;
    this.db.set('config', config);
    return config.ticketCounter;
  }

  // Yeni bir ticket oluştur
  async createTicket(options) {
    const { guild, user, reason = 'Belirtilmedi', ticketType = null } = options;
    
    // Kullanıcının açık ticket'ı var mı kontrol et
    const activeTickets = this.db.get('activeTickets');
    if (activeTickets[user.id]) {
      const existingTicket = activeTickets[user.id];
      const channel = await guild.channels.fetch(existingTicket.channelId).catch(() => null);
      
      if (channel) {
        return {
          success: false,
          message: `Zaten açık bir talebiniz var: ${channel}`,
          ticketId: existingTicket.ticketId
        };
      }
    }

    const config = this.getConfig();
    const ticketCounter = this.incrementTicketCounter();
    const ticketId = `ticket-${ticketCounter}`;
    
    // Ticket açılacak kategori
    const category = config.categoryId ? await guild.channels.fetch(config.categoryId).catch(() => null) : null;
    
    // Ticket kanalı izinleri
    const permissionOverwrites = [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      }
    ];

    // Destek ekibi rolü varsa izinlerini ekle
    if (config.supportRoleId) {
      permissionOverwrites.push({
        id: config.supportRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
        ],
      });
    }

    // Ticket kanalını oluştur
    const channel = await guild.channels.create({
      name: ticketId,
      type: ChannelType.GuildText,
      parent: category?.id,
      permissionOverwrites
    });

    // Ticket verilerini kaydet
    const ticketData = {
      ticketId,
      channelId: channel.id,
      creatorId: user.id,
      creatorTag: user.tag,
      reason,
      type: ticketType,
      status: 'open',
      createdAt: new Date().toISOString(),
      closedAt: null,
      closedBy: null
    };

    // Aktif ticketlara ekle
    activeTickets[user.id] = {
      ticketId,
      channelId: channel.id
    };
    this.db.set('activeTickets', activeTickets);

    // Tüm ticketlar listesine ekle
    const tickets = this.db.get('tickets');
    tickets.push(ticketData);
    this.db.set('tickets', tickets);

    return {
      success: true,
      ticketId,
      channel,
      ticketData
    };
  }

  // Bir ticket'ı kapat
  async closeTicket(options) {
    const { channelId, userId, ticketId = null } = options;
    
    let foundTicketId = ticketId;
    
    // Aktif ticketları kontrol et
    const activeTickets = this.db.get('activeTickets');
    
    // Kanal ID ile ticket bul
    const tickets = this.db.get('tickets');
    const ticketIndex = tickets.findIndex(t => t.channelId === channelId);
    
    if (ticketIndex === -1) {
      return {
        success: false,
        message: 'Bu kanal bir ticket değil veya veritabanında bulunamadı!'
      };
    }
    
    const ticketData = tickets[ticketIndex];
    foundTicketId = ticketData.ticketId;
    
    // Ticket verilerini güncelle
    ticketData.status = 'closed';
    ticketData.closedAt = new Date().toISOString();
    ticketData.closedBy = userId;
    
    tickets[ticketIndex] = ticketData;
    this.db.set('tickets', tickets);
    
    // Aktif ticketlardan kaldır
    if (activeTickets[ticketData.creatorId]) {
      delete activeTickets[ticketData.creatorId];
      this.db.set('activeTickets', activeTickets);
    }
    
    return {
      success: true,
      ticketData
    };
  }

  // Bir ticket'ı sil
  async deleteTicket(options) {
    const { channelId } = options;
    
    // Ticket bul
    const tickets = this.db.get('tickets');
    const ticketIndex = tickets.findIndex(t => t.channelId === channelId);
    
    if (ticketIndex === -1) {
      return {
        success: false,
        message: 'Bu kanal bir ticket değil veya veritabanında bulunamadı!'
      };
    }
    
    const ticketData = tickets[ticketIndex];
    
    // Ticket'ı kapalı olarak işaretle (silmeden önce)
    if (ticketData.status !== 'closed') {
      ticketData.status = 'closed';
      ticketData.closedAt = new Date().toISOString();
    }
    
    // Ticket verilerini güncelle (silindi olarak işaretle)
    ticketData.status = 'deleted';
    tickets[ticketIndex] = ticketData;
    this.db.set('tickets', tickets);
    
    // Aktif ticketlardan kaldır
    const activeTickets = this.db.get('activeTickets');
    if (activeTickets[ticketData.creatorId]) {
      delete activeTickets[ticketData.creatorId];
      this.db.set('activeTickets', activeTickets);
    }
    
    return {
      success: true,
      ticketData
    };
  }

  // Bir ticket'a kullanıcı ekle
  async addUserToTicket(options) {
    const { channelId, userId } = options;
    
    // Ticket bul
    const tickets = this.db.get('tickets');
    const ticket = tickets.find(t => t.channelId === channelId);
    
    if (!ticket) {
      return {
        success: false,
        message: 'Bu kanal bir ticket değil veya veritabanında bulunamadı!'
      };
    }
    
    // Zaten eklenmiş mi kontrol et
    if (ticket.addedUsers && ticket.addedUsers.includes(userId)) {
      return {
        success: false,
        message: 'Bu kullanıcı zaten ticket\'a eklenmiş!'
      };
    }
    
    // Kullanıcıyı ticket'a ekle
    if (!ticket.addedUsers) {
      ticket.addedUsers = [];
    }
    
    ticket.addedUsers.push(userId);
    
    // Veritabanını güncelle
    const ticketIndex = tickets.findIndex(t => t.channelId === channelId);
    tickets[ticketIndex] = ticket;
    this.db.set('tickets', tickets);
    
    return {
      success: true,
      ticket
    };
  }

  // Bir ticket'tan kullanıcı çıkar
  async removeUserFromTicket(options) {
    const { channelId, userId } = options;
    
    // Ticket bul
    const tickets = this.db.get('tickets');
    const ticket = tickets.find(t => t.channelId === channelId);
    
    if (!ticket) {
      return {
        success: false,
        message: 'Bu kanal bir ticket değil veya veritabanında bulunamadı!'
      };
    }
    
    // Kullanıcı eklenmiş mi kontrol et
    if (!ticket.addedUsers || !ticket.addedUsers.includes(userId)) {
      return {
        success: false,
        message: 'Bu kullanıcı ticket\'a eklenmemiş!'
      };
    }
    
    // Kullanıcıyı ticket'tan çıkar
    ticket.addedUsers = ticket.addedUsers.filter(id => id !== userId);
    
    // Veritabanını güncelle
    const ticketIndex = tickets.findIndex(t => t.channelId === channelId);
    tickets[ticketIndex] = ticket;
    this.db.set('tickets', tickets);
    
    return {
      success: true,
      ticket
    };
  }

  // Bir ticket'ı yeniden aç
  async reopenTicket(options) {
    const { channelId, userId } = options;
    
    // Ticket bul
    const tickets = this.db.get('tickets');
    const ticketIndex = tickets.findIndex(t => t.channelId === channelId);
    
    if (ticketIndex === -1) {
      return {
        success: false,
        message: 'Bu kanal bir ticket değil veya veritabanında bulunamadı!'
      };
    }
    
    const ticketData = tickets[ticketIndex];
    
    // Ticket zaten açık mı kontrol et
    if (ticketData.status === 'open') {
      return {
        success: false,
        message: 'Bu ticket zaten açık!'
      };
    }
    
    // Ticket'ı aç
    ticketData.status = 'open';
    ticketData.reopenedBy = userId;
    ticketData.reopenedAt = new Date().toISOString();
    
    // Veritabanını güncelle
    tickets[ticketIndex] = ticketData;
    this.db.set('tickets', tickets);
    
    // Aktif ticketlara ekle
    const activeTickets = this.db.get('activeTickets');
    activeTickets[ticketData.creatorId] = {
      ticketId: ticketData.ticketId,
      channelId
    };
    this.db.set('activeTickets', activeTickets);
    
    return {
      success: true,
      ticketData
    };
  }

  // Kanal ID'ye göre ticket bilgilerini al
  getTicketByChannelId(channelId) {
    const tickets = this.db.get('tickets');
    return tickets.find(t => t.channelId === channelId);
  }

  // Kullanıcı ID'ye göre aktif ticket bilgilerini al
  getActiveTicketByUserId(userId) {
    const activeTickets = this.db.get('activeTickets');
    return activeTickets[userId];
  }

  // Tüm aktif ticketları al
  getAllActiveTickets() {
    return this.db.get('activeTickets');
  }

  // Tüm ticketları al
  getAllTickets() {
    return this.db.get('tickets');
  }

  // Ticket istatistiklerini al
  getTicketStats() {
    const tickets = this.db.get('tickets');
    const activeTickets = this.db.get('activeTickets');
    
    return {
      totalTickets: tickets.length,
      activeTickets: Object.keys(activeTickets).length,
      closedTickets: tickets.filter(t => t.status === 'closed').length,
      deletedTickets: tickets.filter(t => t.status === 'deleted').length
    };
  }
}

export default TicketManager; 