import JsonDatabase from './jsonDatabase.js';
import { EmbedBuilder } from 'discord.js';

class BotlistManager {
  constructor() {
    this.db = new JsonDatabase('botlist-system');
    this.initializeDatabase();
  }

  initializeDatabase() {
    if (!this.db.has('bots')) {
      this.db.set('bots', []);
    }
    
    if (!this.db.has('config')) {
      this.db.set('config', {
        enabled: false,
        addChannelId: null,
        logChannelId: null,
        reviewChannelId: null,
        showcaseChannelId: null,
        developerRoleId: null,
        reviewerRoleId: null,
        minUpvotes: 3,
        categories: ['Eğlence', 'Moderasyon', 'Müzik', 'Ekonomi', 'Yardımcı', 'Çok Amaçlı', 'Diğer'],
        requiredFields: ['prefix', 'library', 'category', 'description', 'features'],
        botAddEmbed: {
          title: 'Bot Ekleme',
          description: 'Bot eklemek için aşağıdaki formu doldurun',
          color: '#3498db'
        }
      });
    }
    
    if (!this.db.has('stats')) {
      this.db.set('stats', {
        totalBots: 0,
        approvedBots: 0,
        rejectedBots: 0,
        pendingBots: 0,
        totalVotes: 0
      });
    }
  }
  
  getConfig() {
    return this.db.get('config');
  }
  
  updateConfig(key, value) {
    const config = this.getConfig();
    config[key] = value;
    this.db.set('config', config);
    return config;
  }
  
  getStats() {
    return this.db.get('stats');
  }
  
  updateStats(key, increment = 1) {
    const stats = this.getStats();
    stats[key] = (stats[key] || 0) + increment;
    this.db.set('stats', stats);
    return stats;
  }
  
  getAllBots() {
    return this.db.get('bots');
  }
  
  getBotById(botId) {
    const bots = this.getAllBots();
    return bots.find(bot => bot.id === botId);
  }
  
  getPendingBots() {
    const bots = this.getAllBots();
    return bots.filter(bot => bot.status === 'pending');
  }
  
  getApprovedBots() {
    const bots = this.getAllBots();
    return bots.filter(bot => bot.status === 'approved');
  }
  
  getRejectedBots() {
    const bots = this.getAllBots();
    return bots.filter(bot => bot.status === 'rejected');
  }
  
  getUserBots(userId) {
    const bots = this.getAllBots();
    return bots.filter(bot => bot.ownerId === userId);
  }
  
  addBot(botData) {
    const bots = this.getAllBots();
    const stats = this.getStats();
    
    const existingBot = this.getBotById(botData.id);
    
    if (existingBot) {
      return {
        success: false,
        message: 'Bu bot zaten sistemde kayıtlı!'
      };
    }
    
    const newBot = {
      ...botData,
      status: 'pending',
      addedAt: new Date().toISOString(),
      votes: [],
      reviewers: [],
      reviews: [],
      lastUpdated: new Date().toISOString()
    };
    
    bots.push(newBot);
    this.db.set('bots', bots);
    
    this.updateStats('totalBots');
    this.updateStats('pendingBots');
    
    return {
      success: true,
      bot: newBot
    };
  }
  
  approveBot(botId, reviewerId, reviewNote) {
    const bots = this.getAllBots();
    const botIndex = bots.findIndex(bot => bot.id === botId);
    
    if (botIndex === -1) {
      return {
        success: false,
        message: 'Bot bulunamadı!'
      };
    }
    
    if (bots[botIndex].status === 'approved') {
      return {
        success: false,
        message: 'Bu bot zaten onaylanmış!'
      };
    }
    
    const wasRejected = bots[botIndex].status === 'rejected';
    
    bots[botIndex].status = 'approved';
    bots[botIndex].reviewers.push(reviewerId);
    bots[botIndex].reviews.push({
      reviewerId,
      action: 'approve',
      note: reviewNote || 'Onaylandı',
      timestamp: new Date().toISOString()
    });
    bots[botIndex].approvedAt = new Date().toISOString();
    bots[botIndex].lastUpdated = new Date().toISOString();
    
    this.db.set('bots', bots);
    
    this.updateStats('approvedBots');
    
    if (wasRejected) {
      this.updateStats('rejectedBots', -1);
    } else {
      this.updateStats('pendingBots', -1);
    }
    
    return {
      success: true,
      bot: bots[botIndex]
    };
  }
  
  rejectBot(botId, reviewerId, rejectReason) {
    const bots = this.getAllBots();
    const botIndex = bots.findIndex(bot => bot.id === botId);
    
    if (botIndex === -1) {
      return {
        success: false,
        message: 'Bot bulunamadı!'
      };
    }
    
    if (bots[botIndex].status === 'rejected') {
      return {
        success: false,
        message: 'Bu bot zaten reddedilmiş!'
      };
    }
    
    const wasApproved = bots[botIndex].status === 'approved';
    
    bots[botIndex].status = 'rejected';
    bots[botIndex].reviewers.push(reviewerId);
    bots[botIndex].reviews.push({
      reviewerId,
      action: 'reject',
      reason: rejectReason || 'Belirtilmedi',
      timestamp: new Date().toISOString()
    });
    bots[botIndex].rejectedAt = new Date().toISOString();
    bots[botIndex].lastUpdated = new Date().toISOString();
    
    this.db.set('bots', bots);
    
    this.updateStats('rejectedBots');
    
    if (wasApproved) {
      this.updateStats('approvedBots', -1);
    } else {
      this.updateStats('pendingBots', -1);
    }
    
    return {
      success: true,
      bot: bots[botIndex]
    };
  }
  
  deleteBot(botId) {
    const bots = this.getAllBots();
    const botIndex = bots.findIndex(bot => bot.id === botId);
    
    if (botIndex === -1) {
      return {
        success: false,
        message: 'Bot bulunamadı!'
      };
    }
    
    const botStatus = bots[botIndex].status;
    
    bots.splice(botIndex, 1);
    this.db.set('bots', bots);
    
    this.updateStats('totalBots', -1);
    
    if (botStatus === 'approved') {
      this.updateStats('approvedBots', -1);
    } else if (botStatus === 'rejected') {
      this.updateStats('rejectedBots', -1);
    } else {
      this.updateStats('pendingBots', -1);
    }
    
    return {
      success: true
    };
  }
  
  voteBot(botId, userId) {
    const bots = this.getAllBots();
    const botIndex = bots.findIndex(bot => bot.id === botId);
    
    if (botIndex === -1) {
      return {
        success: false,
        message: 'Bot bulunamadı!'
      };
    }
    
    if (bots[botIndex].status !== 'approved') {
      return {
        success: false,
        message: 'Sadece onaylanmış botlara oy verebilirsiniz!'
      };
    }
    
    const hasVoted = bots[botIndex].votes.some(vote => vote.userId === userId);
    
    if (hasVoted) {
      return {
        success: false,
        message: 'Bu bota zaten oy vermişsiniz! 12 saat sonra tekrar oy verebilirsiniz.'
      };
    }
    
    bots[botIndex].votes.push({
      userId,
      timestamp: new Date().toISOString()
    });
    
    this.db.set('bots', bots);
    this.updateStats('totalVotes');
    
    return {
      success: true,
      bot: bots[botIndex]
    };
  }
  
  updateBot(botId, updateData) {
    const bots = this.getAllBots();
    const botIndex = bots.findIndex(bot => bot.id === botId);
    
    if (botIndex === -1) {
      return {
        success: false,
        message: 'Bot bulunamadı!'
      };
    }
    
    const updatedBot = {
      ...bots[botIndex],
      ...updateData,
      lastUpdated: new Date().toISOString()
    };
    
    bots[botIndex] = updatedBot;
    this.db.set('bots', bots);
    
    return {
      success: true,
      bot: updatedBot
    };
  }
  
  generateBotEmbed(bot, detailed = false) {
    const embed = new EmbedBuilder()
      .setColor(bot.status === 'approved' ? '#2ecc71' : bot.status === 'rejected' ? '#e74c3c' : '#f39c12')
      .setTitle(`${bot.name} ${bot.verified ? '✅' : ''}`)
      .setDescription(bot.description)
      .setThumbnail(bot.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png')
      .addFields(
        { name: 'Önek', value: bot.prefix, inline: true },
        { name: 'Kütüphane', value: bot.library, inline: true },
        { name: 'Kategori', value: bot.category, inline: true },
        { name: 'Sahibi', value: `<@${bot.ownerId}>`, inline: true },
        { name: 'Durum', value: this.formatStatus(bot.status), inline: true },
        { name: 'Davet', value: `[Sunucuya Ekle](${bot.inviteUrl})`, inline: true }
      )
      .setFooter({ text: `Bot ID: ${bot.id}` })
      .setTimestamp(new Date(bot.lastUpdated));
      
    if (detailed) {
      embed.addFields(
        { name: 'Özellikler', value: bot.features || 'Belirtilmemiş' },
        { name: 'Eklenme Tarihi', value: `<t:${Math.floor(new Date(bot.addedAt).getTime() / 1000)}:R>`, inline: true },
        { name: 'Oy Sayısı', value: `${bot.votes.length} 👍`, inline: true }
      );
      
      if (bot.status === 'approved' && bot.approvedAt) {
        embed.addFields({ name: 'Onaylanma Tarihi', value: `<t:${Math.floor(new Date(bot.approvedAt).getTime() / 1000)}:R>`, inline: true });
      }
      
      if (bot.website) {
        embed.addFields({ name: 'Website', value: `[Ziyaret Et](${bot.website})`, inline: true });
      }
      
      if (bot.supportServer) {
        embed.addFields({ name: 'Destek Sunucusu', value: `[Katıl](${bot.supportServer})`, inline: true });
      }
    }
    
    return embed;
  }
  
  formatStatus(status) {
    switch (status) {
      case 'pending': return '⏳ İncelemede';
      case 'approved': return '✅ Onaylandı';
      case 'rejected': return '❌ Reddedildi';
      default: return status;
    }
  }
  
  generateBotAddEmbed() {
    const config = this.getConfig();
    
    return new EmbedBuilder()
      .setColor(config.botAddEmbed.color || '#3498db')
      .setTitle(config.botAddEmbed.title || 'Bot Ekleme')
      .setDescription(config.botAddEmbed.description || 'Bot eklemek için aşağıdaki formu doldurun')
      .addFields(
        { name: 'Nasıl Eklerim?', value: 'Aşağıdaki komutu kullanarak botunuzu ekleyebilirsiniz:' },
        { name: 'Komut', value: `\`\`\`!bot-ekle <bot_id> <önek> <kütüphane> <kategori>\n\nAçıklama: Bot hakkında kısa açıklama\nÖzellikler: Botun öne çıkan özellikleri\`\`\`` },
        { name: 'Kategoriler', value: config.categories.join(', ') },
        { name: 'Gerekli Alanlar', value: config.requiredFields.join(', ') }
      );
  }
}

export default BotlistManager; 