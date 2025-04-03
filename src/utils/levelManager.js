import { EmbedBuilder } from 'discord.js';
import JsonDatabase from './jsonDatabase.js';

export default class LevelManager {
  constructor() {
    this.db = new JsonDatabase('level');
    this.initializeDatabase();
  }
  
  initializeDatabase() {
    if (!this.db.has('guilds')) {
      this.db.set('guilds', {});
    }
    
    if (!this.db.has('users')) {
      this.db.set('users', {});
    }
  }
  
  getGuildConfig(guildId) {
    const defaultConfig = {
      enabled: false,
      levelUpChannel: null,
      levelUpMessage: '🎉 Tebrikler {user}! **{level}** seviyesine ulaştın!',
      xpRate: 1.0,
      levelUpNotification: 'channel', // 'channel', 'dm', 'both', 'none'
      ignoredChannels: [],
      ignoredRoles: [],
      noXpRoles: [],
      roleRewards: {},
      cooldown: 60000, // 60 saniye
    };
    
    const guilds = this.db.get('guilds');
    
    if (!guilds[guildId]) {
      guilds[guildId] = defaultConfig;
      this.db.set('guilds', guilds);
    }
    
    return guilds[guildId];
  }
  
  updateGuildConfig(guildId, updates) {
    const config = this.getGuildConfig(guildId);
    const guilds = this.db.get('guilds');
    
    guilds[guildId] = { ...config, ...updates };
    this.db.set('guilds', guilds);
    
    return guilds[guildId];
  }
  
  getUserData(userId, guildId) {
    const defaultData = {
      xp: 0,
      level: 0,
      totalXp: 0,
      messages: 0,
      voiceTime: 0,
      lastMessage: 0,
    };
    
    const users = this.db.get('users');
    
    if (!users[guildId]) {
      users[guildId] = {};
    }
    
    if (!users[guildId][userId]) {
      users[guildId][userId] = defaultData;
      this.db.set('users', users);
    }
    
    return users[guildId][userId];
  }
  
  getAllUserData(guildId) {
    const users = this.db.get('users');
    return users[guildId] || {};
  }
  
  updateUserData(userId, guildId, updates) {
    const userData = this.getUserData(userId, guildId);
    const users = this.db.get('users');
    
    if (!users[guildId]) {
      users[guildId] = {};
    }
    
    users[guildId][userId] = { ...userData, ...updates };
    this.db.set('users', users);
    
    return users[guildId][userId];
  }
  
  calculateXpForNextLevel(level) {
    return 5 * Math.pow(level, 2) + 50 * level + 100;
  }
  
  calculateTotalXpForLevel(level) {
    let totalXp = 0;
    for (let i = 0; i < level; i++) {
      totalXp += this.calculateXpForNextLevel(i);
    }
    return totalXp;
  }
  
  getLevelFromXp(totalXp) {
    let level = 0;
    let xpRequired = 0;
    
    while (totalXp >= (xpRequired += this.calculateXpForNextLevel(level))) {
      level++;
    }
    
    return level;
  }
  
  getRank(userId, guildId) {
    const users = this.getAllUserData(guildId);
    const userIds = Object.keys(users);
    
    // Toplam XP'ye göre kullanıcıları sırala
    const sortedUsers = userIds.sort((a, b) => users[b].totalXp - users[a].totalXp);
    
    return sortedUsers.indexOf(userId) + 1;
  }
  
  getLeaderboard(guildId, page = 1, limit = 10) {
    const users = this.getAllUserData(guildId);
    const userIds = Object.keys(users);
    
    // Toplam XP'ye göre kullanıcıları sırala
    const sortedUsers = userIds
      .filter(id => users[id].totalXp > 0)
      .sort((a, b) => users[b].totalXp - users[a].totalXp);
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const leaderboardUsers = sortedUsers.slice(startIndex, endIndex);
    
    return {
      users: leaderboardUsers.map(id => ({
        id,
        ...users[id],
        rank: sortedUsers.indexOf(id) + 1
      })),
      totalPages: Math.ceil(sortedUsers.length / limit),
      currentPage: page,
      totalUsers: sortedUsers.length
    };
  }
  
  async addXp(message, xpToAdd = null) {
    const { author, guild, channel } = message;
    
    // Bot kontrolü
    if (author.bot) return { success: false, reason: 'bot' };
    
    const config = this.getGuildConfig(guild.id);
    
    // Sistem aktif mi?
    if (!config.enabled) return { success: false, reason: 'disabled' };
    
    // Yok sayılan kanal kontrolü
    if (config.ignoredChannels.includes(channel.id)) {
      return { success: false, reason: 'ignored_channel' };
    }
    
    // Yok sayılan rol kontrolü
    const member = guild.members.cache.get(author.id);
    if (!member) return { success: false, reason: 'member_not_found' };
    
    // Kullanıcının rollerini kontrol et
    const userRoles = member.roles.cache.map(r => r.id);
    
    // XP alamayan rol kontrolü
    if (userRoles.some(roleId => config.noXpRoles.includes(roleId))) {
      return { success: false, reason: 'no_xp_role' };
    }
    
    // Mesajlar arasındaki bekleme süresi
    const userData = this.getUserData(author.id, guild.id);
    const now = Date.now();
    
    // Cooldown kontrolü
    if (now - userData.lastMessage < config.cooldown) {
      return { success: false, reason: 'cooldown' };
    }
    
    // Verilecek XP miktarını hesapla (rastgele 15-25 arası veya belirtilen miktar)
    const earnedXp = xpToAdd || Math.floor(Math.random() * 11 + 15) * config.xpRate;
    
    // XP ekle
    const oldLevel = userData.level;
    const newXp = userData.xp + earnedXp;
    const newTotalXp = userData.totalXp + earnedXp;
    
    // Yeni seviyeyi hesapla
    const xpForNextLevel = this.calculateXpForNextLevel(userData.level);
    let newLevel = userData.level;
    let remainingXp = newXp;
    
    // Seviye atladı mı kontrol et
    if (newXp >= xpForNextLevel) {
      newLevel++;
      remainingXp -= xpForNextLevel;
    }
    
    // Kullanıcı verisini güncelle
    this.updateUserData(author.id, guild.id, {
      xp: remainingXp,
      level: newLevel,
      totalXp: newTotalXp,
      messages: userData.messages + 1,
      lastMessage: now
    });
    
    // Seviye atladı mı?
    const leveledUp = newLevel > oldLevel;
    
    if (leveledUp) {
      this.handleLevelUp(message, newLevel, oldLevel);
    }
    
    return {
      success: true,
      xpEarned: earnedXp,
      oldLevel,
      newLevel,
      leveledUp
    };
  }
  
  async handleLevelUp(message, newLevel, oldLevel) {
    const { author, guild } = message;
    const config = this.getGuildConfig(guild.id);
    
    // Bildirim türünü kontrol et
    if (config.levelUpNotification === 'none') return;
    
    // Level up mesajını hazırla
    const levelUpMessage = config.levelUpMessage
      .replace(/{user}/g, `<@${author.id}>`)
      .replace(/{username}/g, author.username)
      .replace(/{tag}/g, author.tag)
      .replace(/{level}/g, newLevel)
      .replace(/{oldlevel}/g, oldLevel)
      .replace(/{server}/g, guild.name);
    
    // Bildirim kanalına gönder
    if (['channel', 'both'].includes(config.levelUpNotification) && config.levelUpChannel) {
      const channel = guild.channels.cache.get(config.levelUpChannel);
      
      if (channel && channel.permissionsFor(guild.members.me).has(['SendMessages', 'ViewChannel'])) {
        try {
          await channel.send(levelUpMessage);
        } catch (error) {
          console.error(`Level up message could not be sent: ${error}`);
        }
      }
    }
    
    // Kullanıcıya DM gönder
    if (['dm', 'both'].includes(config.levelUpNotification)) {
      try {
        await author.send(`${guild.name} sunucusunda ${levelUpMessage}`);
      } catch (error) {
        console.error(`Level up DM could not be sent: ${error}`);
      }
    }
    
    // Mevcut kanalda bildir
    if (config.levelUpNotification === 'current' || !config.levelUpChannel) {
      try {
        await message.channel.send(levelUpMessage);
      } catch (error) {
        console.error(`Level up message could not be sent: ${error}`);
      }
    }
    
    // Rol ödüllerini kontrol et ve uygula
    this.checkAndApplyRoleRewards(guild, author.id, newLevel);
  }
  
  checkAndApplyRoleRewards(guild, userId, level) {
    const config = this.getGuildConfig(guild.id);
    const member = guild.members.cache.get(userId);
    
    if (!member) return;
    
    // Rol ödüllerini kontrol et
    const roleRewards = config.roleRewards;
    
    for (const [requiredLevel, roleId] of Object.entries(roleRewards)) {
      // Seviye yeterli mi?
      if (level >= parseInt(requiredLevel)) {
        // Kullanıcının bu role sahip olup olmadığını kontrol et
        if (!member.roles.cache.has(roleId)) {
          try {
            // Rolü ekle
            member.roles.add(roleId, 'Seviye ödülü')
              .catch(error => console.error(`Role reward could not be applied: ${error}`));
          } catch (error) {
            console.error(`Error applying role reward: ${error}`);
          }
        }
      }
    }
  }
  
  getProgressBar(xp, requiredXp, size = 20) {
    const progress = Math.round((xp / requiredXp) * size);
    const emptyProgress = size - progress;
    
    const progressBar = '█'.repeat(progress) + '░'.repeat(emptyProgress);
    
    return progressBar;
  }
  
  async createRankCardEmbed(userId, guildId, client) {
    const userData = this.getUserData(userId, guildId);
    const user = await client.users.fetch(userId).catch(() => null);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const guild = client.guilds.cache.get(guildId);
    const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
    
    const rank = this.getRank(userId, guildId);
    const requiredXp = this.calculateXpForNextLevel(userData.level);
    const percentage = Math.min(100, Math.round((userData.xp / requiredXp) * 100));
    
    // İlerleme çubuğu oluştur (10 birimlik)
    const progressBar = this.getProgressBar(userData.xp, requiredXp);
    
    // Renk belirleme - Kullanıcının rol rengini kullan
    let color = '#5865F2'; // Varsayılan Discord rengi
    if (member && member.displayHexColor && member.displayHexColor !== '#000000') {
      color = member.displayHexColor;
    }
    
    // Embed oluştur
    const embed = new EmbedBuilder()
      .setColor(color)
      .setAuthor({ 
        name: `${user.username} | Seviye ${userData.level}`, 
        iconURL: user.displayAvatarURL({ dynamic: true }) 
      })
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '🏆 Sıralama', value: `#${rank}`, inline: true },
        { name: '⭐ Seviye', value: `${userData.level}`, inline: true },
        { name: '✨ Toplam XP', value: `${userData.totalXp.toLocaleString()} XP`, inline: true },
        { name: `📊 İlerleme (${percentage}%)`, value: `${userData.xp.toLocaleString()}/${requiredXp.toLocaleString()} XP\n${progressBar}` }
      )
      .setFooter({ text: guild.name, iconURL: guild.iconURL() })
      .setTimestamp();
    
    return embed;
  }
  
  async addVoiceXp(member, minutes) {
    if (member.user.bot) return { success: false, reason: 'bot' };
    
    const config = this.getGuildConfig(member.guild.id);
    
    // Sistem aktif mi?
    if (!config.enabled) return { success: false, reason: 'disabled' };
    
    // XP alamayan rol kontrolü
    const userRoles = member.roles.cache.map(r => r.id);
    if (userRoles.some(roleId => config.noXpRoles.includes(roleId))) {
      return { success: false, reason: 'no_xp_role' };
    }
    
    // Verilecek XP miktarını hesapla (dakika başına 5-10 XP)
    const xpPerMinute = Math.floor(Math.random() * 6 + 5) * config.xpRate;
    const earnedXp = xpPerMinute * minutes;
    
    // XP ekle
    const userData = this.getUserData(member.id, member.guild.id);
    const oldLevel = userData.level;
    
    // Toplam XP'yi güncelle
    let newTotalXp = userData.totalXp + earnedXp;
    
    // Mevcut seviye için gereken XP miktarı
    let newXp = userData.xp + earnedXp;
    let newLevel = userData.level;
    
    // Seviye atladı mı kontrol et
    let xpForNextLevel = this.calculateXpForNextLevel(newLevel);
    
    while (newXp >= xpForNextLevel) {
      newXp -= xpForNextLevel;
      newLevel++;
      xpForNextLevel = this.calculateXpForNextLevel(newLevel);
    }
    
    // Kullanıcı verisini güncelle
    this.updateUserData(member.id, member.guild.id, {
      xp: newXp,
      level: newLevel,
      totalXp: newTotalXp,
      voiceTime: userData.voiceTime + (minutes * 60) // saniye cinsinden
    });
    
    // Seviye atladı mı?
    const leveledUp = newLevel > oldLevel;
    
    if (leveledUp) {
      // Rol ödüllerini kontrol et ve uygula
      this.checkAndApplyRoleRewards(member.guild, member.id, newLevel);
      
      // Seviye atlama bildirimi
      const guild = member.guild;
      const config = this.getGuildConfig(guild.id);
      
      // Level up mesajını hazırla
      const levelUpMessage = config.levelUpMessage
        .replace(/{user}/g, `<@${member.id}>`)
        .replace(/{username}/g, member.user.username)
        .replace(/{tag}/g, member.user.tag)
        .replace(/{level}/g, newLevel)
        .replace(/{oldlevel}/g, oldLevel)
        .replace(/{server}/g, guild.name);
      
      // Bildirimi gönder
      if (config.levelUpChannel && ['channel', 'both'].includes(config.levelUpNotification)) {
        const channel = guild.channels.cache.get(config.levelUpChannel);
        
        if (channel && channel.permissionsFor(guild.members.me).has(['SendMessages', 'ViewChannel'])) {
          try {
            channel.send(`🎤 Ses kanalından ${levelUpMessage}`);
          } catch (error) {
            console.error(`Voice level up message could not be sent: ${error}`);
          }
        }
      }
      
      // Kullanıcıya DM gönder
      if (['dm', 'both'].includes(config.levelUpNotification)) {
        try {
          member.user.send(`${guild.name} sunucusunda ses kanalında geçirdiğin süre sayesinde ${levelUpMessage}`);
        } catch (error) {
          console.error(`Voice level up DM could not be sent: ${error}`);
        }
      }
    }
    
    return {
      success: true,
      xpEarned: earnedXp,
      oldLevel,
      newLevel,
      leveledUp
    };
  }
} 