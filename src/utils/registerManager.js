import JsonDatabase from './jsonDatabase.js';

class RegisterManager {
  constructor() {
    this.db = this.initializeDatabase();
  }
  
  initializeDatabase() {
    const db = new JsonDatabase('register');
    
    // Veritabanı şemasını kontrol et ve yoksa oluştur
    if (!db.has('guilds')) {
      db.set('guilds', {});
    }
    
    if (!db.has('users')) {
      db.set('users', {});
    }
    
    if (!db.has('stats')) {
      db.set('stats', {});
    }
    
    return db;
  }
  
  // Guild ayarları
  getGuildConfig(guildId) {
    const defaultConfig = {
      enabled: false,
      welcomeChannel: null,        // Hoşgeldin mesajlarının gönderileceği kanal
      registerChannel: null,       // Kayıtların yapılacağı kanal
      registerLog: null,           // Kayıt loglarının gönderileceği kanal
      staffRole: null,             // Kayıt yetkilisi rolü
      unregisteredRole: null,      // Kayıtsız üye rolü
      memberRole: null,            // Kayıt olduktan sonra verilecek temel üye rolü
      maleRole: null,              // Erkek rolü
      femaleRole: null,            // Kadın rolü
      customRoles: {},             // Özel roller {rolİsmi: rolId}
      welcomeMessage: "Hoş geldin {user}! Kayıt olmak için yetkilileri bekleyin.",
      autoRegister: false,         // Otomatik kayıt
      nameFormat: "{name} | {age}", // İsim formatı
      minAge: 13,                  // Minimum yaş
      requireAge: false            // Yaş zorunlu mu
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
  
  // Kayıt istatistikleri
  getGuildStats(guildId) {
    const defaultStats = {
      totalRegisters: 0,
      maleRegisters: 0,
      femaleRegisters: 0,
      customRegisters: {} // Özel roller için sayaç
    };
    
    const stats = this.db.get('stats');
    
    if (!stats[guildId]) {
      stats[guildId] = defaultStats;
      this.db.set('stats', stats);
    }
    
    return stats[guildId];
  }
  
  updateGuildStats(guildId, updates) {
    const currentStats = this.getGuildStats(guildId);
    const stats = this.db.get('stats');
    
    stats[guildId] = { ...currentStats, ...updates };
    this.db.set('stats', stats);
    
    return stats[guildId];
  }
  
  // Kullanıcı kayıt verisi
  getUserData(userId, guildId) {
    const defaultData = {
      registeredAt: null,
      registeredBy: null,
      name: null,
      age: null,
      gender: null, // 'male', 'female', 'custom'
      customRole: null,
      registerCount: 0, // Bu kullanıcı kaç kez yeniden kaydedildi
      roles: [], // Kayıt öncesi sahip olduğu roller (kayıtsıza atma işlemi için)
      isRegistered: false
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
  
  // Yetkili istatistikleri
  getStaffStats(staffId, guildId) {
    const users = this.db.get('users');
    
    if (!users[guildId]) {
      return {
        totalRegisters: 0,
        maleRegisters: 0,
        femaleRegisters: 0,
        customRegisters: {}
      };
    }
    
    // Bu yetkilinin kaydettiği kullanıcıları bul
    const registeredUsers = Object.values(users[guildId]).filter(
      u => u.registeredBy === staffId && u.isRegistered
    );
    
    const maleCount = registeredUsers.filter(u => u.gender === 'male').length;
    const femaleCount = registeredUsers.filter(u => u.gender === 'female').length;
    const customCounts = {};
    
    // Özel rollere göre sayımı yap
    registeredUsers
      .filter(u => u.gender === 'custom' && u.customRole)
      .forEach(u => {
        customCounts[u.customRole] = (customCounts[u.customRole] || 0) + 1;
      });
    
    return {
      totalRegisters: registeredUsers.length,
      maleRegisters: maleCount,
      femaleRegisters: femaleCount,
      customRegisters: customCounts
    };
  }
  
  // Sunucudaki tüm yetkililerin listesi ve istatistikleri
  getAllStaffStats(guildId) {
    const users = this.db.get('users');
    const staffStats = {};
    
    if (!users[guildId]) {
      return staffStats;
    }
    
    // Tüm kayıtları tara ve her yetkili için istatistik oluştur
    Object.values(users[guildId]).forEach(userData => {
      if (userData.registeredBy && userData.isRegistered) {
        const staffId = userData.registeredBy;
        
        if (!staffStats[staffId]) {
          staffStats[staffId] = {
            totalRegisters: 0,
            maleRegisters: 0,
            femaleRegisters: 0,
            customRegisters: {}
          };
        }
        
        staffStats[staffId].totalRegisters++;
        
        if (userData.gender === 'male') {
          staffStats[staffId].maleRegisters++;
        } else if (userData.gender === 'female') {
          staffStats[staffId].femaleRegisters++;
        } else if (userData.gender === 'custom' && userData.customRole) {
          const role = userData.customRole;
          staffStats[staffId].customRegisters[role] = 
            (staffStats[staffId].customRegisters[role] || 0) + 1;
        }
      }
    });
    
    return staffStats;
  }
  
  // Kullanıcıyı kaydet
  async registerUser(options) {
    const { 
      userId, targetId, guildId, name, age, 
      gender, customRole, guild, reason 
    } = options;
    
    const config = this.getGuildConfig(guildId);
    
    // Yaş kontrolü
    if (config.requireAge && (!age || age < config.minAge)) {
      return {
        success: false,
        message: `Yaş belirtilmedi veya minimum yaş sınırının (${config.minAge}) altında!`
      };
    }
    
    try {
      // Hedef kullanıcıyı bul
      const member = await guild.members.fetch(targetId).catch(() => null);
      
      if (!member) {
        return {
          success: false,
          message: 'Kullanıcı bulunamadı!'
        };
      }
      
      // Roller
      let rolesToAdd = [];
      let rolesToRemove = [config.unregisteredRole];
      
      // Temel üye rolü
      if (config.memberRole) {
        rolesToAdd.push(config.memberRole);
      }
      
      // Cinsiyet rolü
      if (gender === 'male' && config.maleRole) {
        rolesToAdd.push(config.maleRole);
      } else if (gender === 'female' && config.femaleRole) {
        rolesToAdd.push(config.femaleRole);
      } else if (gender === 'custom' && customRole) {
        const roleId = config.customRoles[customRole];
        if (roleId) {
          rolesToAdd.push(roleId);
        }
      }
      
      // Rolleri ekle
      for (const roleId of rolesToAdd) {
        if (roleId) {
          await member.roles.add(roleId, reason || 'Kayıt sistemi tarafından eklendi').catch(() => null);
        }
      }
      
      // Kayıtsız rolünü kaldır
      for (const roleId of rolesToRemove) {
        if (roleId) {
          await member.roles.remove(roleId, reason || 'Kayıt sistemi tarafından kaldırıldı').catch(() => null);
        }
      }
      
      // İsim değiştir
      if (name) {
        const formattedName = config.nameFormat
          .replace('{name}', name)
          .replace('{age}', age || '');
        
        await member.setNickname(formattedName, reason || 'Kayıt sistemi tarafından değiştirildi')
          .catch(() => null);
      }
      
      // Kullanıcı verisini güncelle
      const userData = this.getUserData(targetId, guildId);
      
      this.updateUserData(targetId, guildId, {
        registeredAt: new Date().toISOString(),
        registeredBy: userId,
        name: name,
        age: age,
        gender: gender,
        customRole: customRole,
        registerCount: userData.registerCount + 1,
        isRegistered: true
      });
      
      // Sunucu istatistiklerini güncelle
      const stats = this.getGuildStats(guildId);
      const updates = {
        totalRegisters: stats.totalRegisters + 1
      };
      
      if (gender === 'male') {
        updates.maleRegisters = stats.maleRegisters + 1;
      } else if (gender === 'female') {
        updates.femaleRegisters = stats.femaleRegisters + 1;
      } else if (gender === 'custom' && customRole) {
        const customStats = { ...stats.customRegisters };
        customStats[customRole] = (customStats[customRole] || 0) + 1;
        updates.customRegisters = customStats;
      }
      
      this.updateGuildStats(guildId, updates);
      
      return {
        success: true,
        message: 'Kullanıcı başarıyla kaydedildi!',
        userData: this.getUserData(targetId, guildId)
      };
    } catch (error) {
      console.error('RegisterManager.registerUser error:', error);
      return {
        success: false,
        message: 'Kayıt işlemi sırasında bir hata oluştu!'
      };
    }
  }
  
  // Kullanıcıyı kayıtsıza at
  async unregisterUser(options) {
    const { targetId, guildId, guild, reason } = options;
    
    const config = this.getGuildConfig(guildId);
    
    if (!config.unregisteredRole) {
      return {
        success: false,
        message: 'Kayıtsız rolü ayarlanmamış!'
      };
    }
    
    try {
      // Hedef kullanıcıyı bul
      const member = await guild.members.fetch(targetId).catch(() => null);
      
      if (!member) {
        return {
          success: false,
          message: 'Kullanıcı bulunamadı!'
        };
      }
      
      // Kayıt rollerini çıkar
      let rolesToRemove = [];
      
      if (config.memberRole) {
        rolesToRemove.push(config.memberRole);
      }
      
      if (config.maleRole) {
        rolesToRemove.push(config.maleRole);
      }
      
      if (config.femaleRole) {
        rolesToRemove.push(config.femaleRole);
      }
      
      // Özel roller
      Object.values(config.customRoles).forEach(roleId => {
        if (roleId) rolesToRemove.push(roleId);
      });
      
      // Rolleri kaldır
      for (const roleId of rolesToRemove) {
        if (roleId) {
          await member.roles.remove(roleId, reason || 'Kayıtsıza atıldı').catch(() => null);
        }
      }
      
      // Kayıtsız rolü ekle
      await member.roles.add(config.unregisteredRole, reason || 'Kayıtsıza atıldı').catch(() => null);
      
      // İsmi sıfırla
      await member.setNickname(null, reason || 'Kayıtsıza atıldı').catch(() => null);
      
      // Kullanıcı verisini güncelle (tamamen silmiyoruz, sadece isRegistered'ı false yapıyoruz)
      this.updateUserData(targetId, guildId, {
        isRegistered: false
      });
      
      return {
        success: true,
        message: 'Kullanıcı başarıyla kayıtsıza atıldı!'
      };
    } catch (error) {
      console.error('RegisterManager.unregisterUser error:', error);
      return {
        success: false,
        message: 'Kayıtsıza atma işlemi sırasında bir hata oluştu!'
      };
    }
  }
  
  // İsim geçmişi
  getNameHistory(userId, guildId) {
    const userData = this.getUserData(userId, guildId);
    return userData.nameHistory || [];
  }
  
  // İsim geçmişine kayıt ekle
  addNameToHistory(userId, guildId, name, age) {
    const userData = this.getUserData(userId, guildId);
    const nameHistory = userData.nameHistory || [];
    
    // En son 10 ismi tut
    nameHistory.unshift({
      name,
      age,
      timestamp: new Date().toISOString()
    });
    
    if (nameHistory.length > 10) {
      nameHistory.pop();
    }
    
    this.updateUserData(userId, guildId, {
      nameHistory
    });
    
    return nameHistory;
  }
}

export default RegisterManager; 