// Moderasyon yönetimi için veritabanı işlemleri
import { PermissionFlagsBits } from 'discord.js';
import JsonDatabase from './jsonDatabase.js';
import { Collection } from 'discord.js';

/**
 * Moderasyon sistemi için yönetici sınıf
 */
class ModerationManager {
  constructor() {
    this.db = new JsonDatabase('moderation');
    this.punishments = new Collection();
    this.warnings = new Collection();
    this.mutes = new Collection();
    this.stats = new Collection();
    
    this.loadData();
  }
  
  /**
   * Veritabanından tüm verileri yükler
   */
  loadData() {
    // Yapılandırma yükleme
    const config = this.db.get('config') || this.getDefaultConfig();
    this.db.set('config', config);
    
    // Cezaları yükleme
    const punishments = this.db.get('punishments') || {};
    for (const [userId, userPunishments] of Object.entries(punishments)) {
      this.punishments.set(userId, userPunishments);
    }
    
    // Uyarıları yükleme
    const warnings = this.db.get('warnings') || {};
    for (const [userId, userWarnings] of Object.entries(warnings)) {
      this.warnings.set(userId, userWarnings);
    }
    
    // Muteleri yükleme
    const mutes = this.db.get('mutes') || {};
    for (const [userId, userMute] of Object.entries(mutes)) {
      this.mutes.set(userId, userMute);
    }
    
    // İstatistikleri yükleme
    const stats = this.db.get('stats') || this.getDefaultStats();
    this.stats = stats;
    this.db.set('stats', stats);
  }
  
  /**
   * Veritabanını günceller
   */
  saveData() {
    // Cezaları kaydetme
    const punishments = {};
    for (const [userId, userPunishments] of this.punishments.entries()) {
      punishments[userId] = userPunishments;
    }
    this.db.set('punishments', punishments);
    
    // Uyarıları kaydetme
    const warnings = {};
    for (const [userId, userWarnings] of this.warnings.entries()) {
      warnings[userId] = userWarnings;
    }
    this.db.set('warnings', warnings);
    
    // Muteleri kaydetme
    const mutes = {};
    for (const [userId, userMute] of this.mutes.entries()) {
      mutes[userId] = userMute;
    }
    this.db.set('mutes', mutes);
    
    // İstatistikleri kaydetme
    this.db.set('stats', this.stats);
  }
  
  /**
   * Varsayılan yapılandırmayı döndürür
   * @returns {Object} Varsayılan yapılandırma
   */
  getDefaultConfig() {
    return {
      banRoleId: null,
      kickRoleId: null,
      muteRoleId: null,
      mutedRoleId: null,
      welcomeChannelId: null,
      welcomeMessage: '{user} sunucuya katıldı! Şu anda {memberCount} kişiyiz.',
      leaveMessage: '{user} sunucudan ayrıldı! {memberCount} kişi kaldık.',
      autoRoleId: null,
      autoRoleEnabled: false,
      modLogChannelId: null,
      serverLogChannelId: null,
      embedColor: '#0099ff',
      maxWarnings: 3,
      warningPunishment: 'mute',
      warningTimeout: 604800000, // 7 gün (milisaniye)
      antiSpamEnabled: false,
      antiSpamThreshold: 5, // 5 mesaj
      antiSpamInterval: 3000, // 3 saniye
      antiSpamAction: 'mute', // mute veya kick
      antiSpamMuteDuration: 300000 // 5 dakika (milisaniye)
    };
  }
  
  /**
   * Varsayılan istatistikleri döndürür
   * @returns {Object} Varsayılan istatistikler
   */
  getDefaultStats() {
    return {
      bans: 0,
      kicks: 0,
      mutes: 0,
      warnings: 0,
      messagesSent: 0,
      messagesDeleted: 0,
      joins: 0,
      leaves: 0,
      spamDetected: 0
    };
  }
  
  /**
   * Moderasyon yapılandırmasını alır
   * @returns {Object} Moderasyon yapılandırması
   */
  getConfig() {
    return this.db.get('config');
  }
  
  /**
   * Moderasyon yapılandırmasını günceller
   * @param {string} key - Ayar anahtarı
   * @param {any} value - Ayar değeri
   */
  updateConfig(key, value) {
    const config = this.getConfig();
    config[key] = value;
    this.db.set('config', config);
  }
  
  /**
   * İstatistikleri alır
   * @returns {Object} İstatistikler
   */
  getStats() {
    return this.stats;
  }
  
  /**
   * Belirli bir istatistiği günceller
   * @param {string} key - İstatistik anahtarı
   * @param {number} increment - Artış miktarı (varsayılan: 1)
   */
  updateStat(key, increment = 1) {
    if (this.stats[key] !== undefined) {
      this.stats[key] += increment;
      this.db.set('stats', this.stats);
    }
  }
  
  /**
   * Kullanıcıya ban cezası ekler
   * @param {string} userId - Kullanıcı ID'si
   * @param {string} moderatorId - Moderatör ID'si
   * @param {string} reason - Ban sebebi
   * @param {number} duration - Ban süresi (milisaniye, 0 ise kalıcı)
   * @returns {Object} Ban bilgisi
   */
  addBan(userId, moderatorId, reason, duration = 0) {
    const banInfo = {
      userId,
      moderatorId,
      reason,
      duration,
      timestamp: Date.now(),
      expiresAt: duration > 0 ? Date.now() + duration : 0
    };
    
    if (!this.punishments.has(userId)) {
      this.punishments.set(userId, {
        bans: [],
        kicks: [],
        mutes: []
      });
    }
    
    const userPunishments = this.punishments.get(userId);
    userPunishments.bans.push(banInfo);
    this.updateStat('bans');
    this.saveData();
    
    return banInfo;
  }
  
  /**
   * Kullanıcının aktif ban bilgisini alır
   * @param {string} userId - Kullanıcı ID'si
   * @returns {Object|null} Ban bilgisi veya null
   */
  getActiveBan(userId) {
    if (!this.punishments.has(userId)) return null;
    
    const userPunishments = this.punishments.get(userId);
    const activeBan = userPunishments.bans.find(ban => {
      return ban.expiresAt === 0 || ban.expiresAt > Date.now();
    });
    
    return activeBan || null;
  }
  
  /**
   * Kullanıcıya kick cezası ekler
   * @param {string} userId - Kullanıcı ID'si
   * @param {string} moderatorId - Moderatör ID'si
   * @param {string} reason - Kick sebebi
   * @returns {Object} Kick bilgisi
   */
  addKick(userId, moderatorId, reason) {
    const kickInfo = {
      userId,
      moderatorId,
      reason,
      timestamp: Date.now()
    };
    
    if (!this.punishments.has(userId)) {
      this.punishments.set(userId, {
        bans: [],
        kicks: [],
        mutes: []
      });
    }
    
    const userPunishments = this.punishments.get(userId);
    userPunishments.kicks.push(kickInfo);
    this.updateStat('kicks');
    this.saveData();
    
    return kickInfo;
  }
  
  /**
   * Kullanıcıya mute cezası ekler
   * @param {string} userId - Kullanıcı ID'si
   * @param {string} moderatorId - Moderatör ID'si
   * @param {string} reason - Mute sebebi
   * @param {number} duration - Mute süresi (milisaniye)
   * @returns {Object} Mute bilgisi
   */
  addMute(userId, moderatorId, reason, duration) {
    const muteInfo = {
      userId,
      moderatorId,
      reason,
      duration,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration
    };
    
    if (!this.punishments.has(userId)) {
      this.punishments.set(userId, {
        bans: [],
        kicks: [],
        mutes: []
      });
    }
    
    const userPunishments = this.punishments.get(userId);
    userPunishments.mutes.push(muteInfo);
    
    this.mutes.set(userId, muteInfo);
    this.updateStat('mutes');
    this.saveData();
    
    return muteInfo;
  }
  
  /**
   * Kullanıcının aktif mute bilgisini alır
   * @param {string} userId - Kullanıcı ID'si
   * @returns {Object|null} Mute bilgisi veya null
   */
  getActiveMute(userId) {
    if (!this.mutes.has(userId)) return null;
    
    const muteInfo = this.mutes.get(userId);
    if (muteInfo.expiresAt > Date.now()) {
      return muteInfo;
    }
    
    // Süresi dolmuş ise sil
    this.mutes.delete(userId);
    this.saveData();
    return null;
  }
  
  /**
   * Kullanıcıya uyarı ekler
   * @param {string} userId - Kullanıcı ID'si
   * @param {string} moderatorId - Moderatör ID'si
   * @param {string} reason - Uyarı sebebi
   * @returns {Object} Uyarı bilgisi ve toplam sayı
   */
  addWarning(userId, moderatorId, reason) {
    const warningInfo = {
      userId,
      moderatorId,
      reason,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.getConfig().warningTimeout
    };
    
    if (!this.warnings.has(userId)) {
      this.warnings.set(userId, []);
    }
    
    const userWarnings = this.warnings.get(userId);
    userWarnings.push(warningInfo);
    this.updateStat('warnings');
    this.saveData();
    
    const activeWarnings = this.getActiveWarnings(userId).length;
    return { warning: warningInfo, total: activeWarnings };
  }
  
  /**
   * Kullanıcının aktif uyarılarını alır
   * @param {string} userId - Kullanıcı ID'si
   * @returns {Array} Aktif uyarılar
   */
  getActiveWarnings(userId) {
    if (!this.warnings.has(userId)) return [];
    
    const userWarnings = this.warnings.get(userId);
    const activeWarnings = userWarnings.filter(warning => {
      return warning.expiresAt > Date.now();
    });
    
    // Süresi dolmuş uyarıları temizle
    if (activeWarnings.length !== userWarnings.length) {
      this.warnings.set(userId, activeWarnings);
      this.saveData();
    }
    
    return activeWarnings;
  }
  
  /**
   * Kullanıcının uyarı sayısını alır
   * @param {string} userId - Kullanıcı ID'si
   * @returns {number} Aktif uyarı sayısı
   */
  getWarningCount(userId) {
    return this.getActiveWarnings(userId).length;
  }
  
  /**
   * Kullanıcının belirli bir uyarısını siler
   * @param {string} userId - Kullanıcı ID'si
   * @param {number} index - Uyarı indeksi
   * @returns {boolean} Başarılı ise true
   */
  removeWarning(userId, index) {
    if (!this.warnings.has(userId)) return false;
    
    const userWarnings = this.warnings.get(userId);
    if (index < 0 || index >= userWarnings.length) return false;
    
    userWarnings.splice(index, 1);
    this.saveData();
    return true;
  }
  
  /**
   * Kullanıcının tüm uyarılarını siler
   * @param {string} userId - Kullanıcı ID'si
   * @returns {boolean} Başarılı ise true
   */
  clearWarnings(userId) {
    if (!this.warnings.has(userId)) return false;
    
    this.warnings.delete(userId);
    this.saveData();
    return true;
  }
  
  /**
   * Zamanı geçmiş cezaları kontrol eder ve temizler
   * @returns {Object} Temizleme sonuçları
   */
  checkExpiredPunishments() {
    const now = Date.now();
    const expired = {
      mutes: [],
      bans: [],
      warnings: []
    };
    
    // Süresi dolan muteleri kontrol et
    for (const [userId, muteInfo] of this.mutes.entries()) {
      if (muteInfo.expiresAt <= now) {
        this.mutes.delete(userId);
        expired.mutes.push(userId);
      }
    }
    
    // Süresi dolan banları kontrol et (sunucu tarafında işlenmesi gerekiyor)
    for (const [userId, userPunishments] of this.punishments.entries()) {
      const activeBan = userPunishments.bans.find(ban => {
        return ban.expiresAt !== 0 && ban.expiresAt <= now;
      });
      
      if (activeBan) {
        expired.bans.push(userId);
      }
    }
    
    // Süresi dolan uyarıları kontrol et
    for (const [userId, userWarnings] of this.warnings.entries()) {
      const expiredWarnings = userWarnings.filter(warning => warning.expiresAt <= now);
      
      if (expiredWarnings.length > 0) {
        // Süresi dolan uyarıları sil
        this.warnings.set(userId, userWarnings.filter(warning => warning.expiresAt > now));
        expired.warnings.push({ userId, count: expiredWarnings.length });
      }
    }
    
    if (expired.mutes.length > 0 || expired.bans.length > 0 || expired.warnings.length > 0) {
      this.saveData();
    }
    
    return expired;
  }
}

export default ModerationManager; 