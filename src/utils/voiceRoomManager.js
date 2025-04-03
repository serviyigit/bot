import { ChannelType, PermissionFlagsBits, OverwriteType } from 'discord.js';
import JsonDatabase from './jsonDatabase.js';

class VoiceRoomManager {
  constructor() {
    this.db = new JsonDatabase('voice-rooms');
    this.initializeDatabase();
  }
  
  initializeDatabase() {
    if (!this.db.has('rooms')) {
      this.db.set('rooms', {});
    }
    
    if (!this.db.has('config')) {
      this.db.set('config', {
        enabled: false,
        lobbyChannelId: null,
        categoryId: null,
        autoDeleteEmptyRooms: true,
        maxRoomsPerUser: 1,
        cooldown: 60, // saniye cinsinden
        defaultUserLimit: 5,
        roomNameTemplate: '{username} Odası',
        roomSizeOptions: [2, 5, 10, 25, 99],
        roomNameCharLimit: 30,
        allowedPrivateRoles: [],
        adminRoleId: null,
        logChannelId: null
      });
    }
    
    if (!this.db.has('stats')) {
      this.db.set('stats', {
        totalRoomsCreated: 0,
        activeRooms: 0,
        totalUsersJoined: 0,
        maxConcurrentRooms: 0
      });
    }
    
    if (!this.db.has('userSettings')) {
      this.db.set('userSettings', {});
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
    
    if (key === 'activeRooms' && stats.activeRooms > stats.maxConcurrentRooms) {
      stats.maxConcurrentRooms = stats.activeRooms;
    }
    
    this.db.set('stats', stats);
    return stats;
  }
  
  getUserSettings(userId) {
    const userSettings = this.db.get('userSettings');
    if (!userSettings[userId]) {
      userSettings[userId] = {
        roomDefaults: {
          name: null,
          userLimit: null,
          isPrivate: false,
          bitrate: null,
          allowedUsers: []
        },
        lastCreated: 0,
        totalRoomsCreated: 0,
        activeRooms: 0
      };
      this.db.set('userSettings', userSettings);
    }
    return userSettings[userId];
  }
  
  updateUserSettings(userId, settings) {
    const userSettings = this.db.get('userSettings');
    userSettings[userId] = {
      ...this.getUserSettings(userId),
      ...settings
    };
    this.db.set('userSettings', userSettings);
    return userSettings[userId];
  }
  
  getAllRooms() {
    return this.db.get('rooms');
  }
  
  getRoom(channelId) {
    const rooms = this.getAllRooms();
    return rooms[channelId];
  }
  
  getUserRooms(userId) {
    const rooms = this.getAllRooms();
    return Object.values(rooms).filter(room => room.ownerId === userId);
  }
  
  getActiveUserRooms(userId) {
    const rooms = this.getAllRooms();
    return Object.values(rooms).filter(room => room.ownerId === userId && room.active);
  }
  
  isOnCooldown(userId) {
    const userSettings = this.getUserSettings(userId);
    const config = this.getConfig();
    const now = Date.now();
    const cooldownMs = config.cooldown * 1000;
    
    return (now - userSettings.lastCreated) < cooldownMs;
  }
  
  getCooldownRemaining(userId) {
    const userSettings = this.getUserSettings(userId);
    const config = this.getConfig();
    const now = Date.now();
    const cooldownMs = config.cooldown * 1000;
    
    return Math.max(0, cooldownMs - (now - userSettings.lastCreated));
  }
  
  canCreateRoom(userId, guild) {
    const config = this.getConfig();
    
    if (!config.enabled) {
      return { allowed: false, reason: 'Özel oda sistemi şu anda kapalı.' };
    }
    
    if (!config.lobbyChannelId) {
      return { allowed: false, reason: 'Lobi kanalı ayarlanmamış.' };
    }
    
    if (!config.categoryId) {
      return { allowed: false, reason: 'Özel oda kategorisi ayarlanmamış.' };
    }
    
    const activeRooms = this.getActiveUserRooms(userId);
    if (activeRooms.length >= config.maxRoomsPerUser) {
      return { allowed: false, reason: `Maksimum oda sayısına ulaştınız (${config.maxRoomsPerUser}).` };
    }
    
    if (this.isOnCooldown(userId)) {
      const remainingSecs = Math.ceil(this.getCooldownRemaining(userId) / 1000);
      return { allowed: false, reason: `Bekleme süresindesiniz. ${remainingSecs} saniye sonra tekrar deneyin.` };
    }
    
    const category = guild.channels.cache.get(config.categoryId);
    if (!category) {
      return { allowed: false, reason: 'Özel oda kategorisi bulunamadı.' };
    }
    
    return { allowed: true };
  }
  
  async createRoom(options) {
    const { guild, user, name = null, userLimit = null, isPrivate = false, customPermissions = null } = options;
    
    // Kullanıcının oda oluşturma izni var mı kontrol et
    const canCreate = this.canCreateRoom(user.id, guild);
    if (!canCreate.allowed) {
      return { success: false, message: canCreate.reason };
    }
    
    const config = this.getConfig();
    const userSettings = this.getUserSettings(user.id);
    
    // Özel oda kategorisini al
    const category = guild.channels.cache.get(config.categoryId);
    
    try {
      // Oda ismini ayarla
      let roomName = name || userSettings.roomDefaults.name;
      
      if (!roomName) {
        roomName = config.roomNameTemplate.replace('{username}', user.username);
      }
      
      // Karakter sınırını kontrol et
      if (roomName.length > config.roomNameCharLimit) {
        roomName = roomName.substring(0, config.roomNameCharLimit);
      }
      
      // Kişi sınırını ayarla
      const finalUserLimit = userLimit || userSettings.roomDefaults.userLimit || config.defaultUserLimit;
      
      // Kanal izinlerini ayarla
      const permissions = [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.Connect]
        },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.MuteMembers,
            PermissionFlagsBits.DeafenMembers,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.MoveMembers
          ]
        }
      ];
      
      // Bot için izinleri ekle
      if (guild.members.me) {
        permissions.push({
          id: guild.members.me.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.MoveMembers
          ]
        });
      }
      
      // Eğer özel bir oda değilse, herkese bağlanma izni ver
      if (!isPrivate) {
        permissions[0].allow = [PermissionFlagsBits.Connect];
        permissions[0].deny = [];
      }
      
      // Özel izinleri ekle
      if (customPermissions && Array.isArray(customPermissions)) {
        permissions.push(...customPermissions);
      }
      
      // Admin rolü izni
      if (config.adminRoleId) {
        permissions.push({
          id: config.adminRoleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.ManageChannels
          ]
        });
      }
      
      // Ses kanalını oluştur
      const channel = await guild.channels.create({
        name: roomName,
        type: ChannelType.GuildVoice,
        parent: category,
        userLimit: finalUserLimit > 0 ? finalUserLimit : undefined,
        permissionOverwrites: permissions
      });
      
      // Kanal veritabanına kaydet
      const rooms = this.getAllRooms();
      rooms[channel.id] = {
        id: channel.id,
        ownerId: user.id,
        name: roomName,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        userLimit: finalUserLimit,
        isPrivate: isPrivate,
        customPermissions: customPermissions,
        active: true,
        members: [user.id]
      };
      this.db.set('rooms', rooms);
      
      // Kullanıcı ayarlarını güncelle
      userSettings.lastCreated = Date.now();
      userSettings.totalRoomsCreated = (userSettings.totalRoomsCreated || 0) + 1;
      userSettings.activeRooms = (userSettings.activeRooms || 0) + 1;
      this.updateUserSettings(user.id, userSettings);
      
      // İstatistikleri güncelle
      this.updateStats('totalRoomsCreated');
      this.updateStats('activeRooms');
      
      return {
        success: true,
        channel,
        room: rooms[channel.id]
      };
      
    } catch (error) {
      console.error('Özel oda oluşturulurken hata:', error);
      return {
        success: false,
        message: 'Özel oda oluşturulurken bir hata oluştu.'
      };
    }
  }
  
  async deleteRoom(channelId, guild, reason = 'İsteğe bağlı silindi') {
    const rooms = this.getAllRooms();
    const room = rooms[channelId];
    
    if (!room) {
      return {
        success: false,
        message: 'Belirtilen ID ile bir oda bulunamadı.'
      };
    }
    
    try {
      // Kanalı Discord'dan sil
      const channel = guild.channels.cache.get(channelId);
      
      if (channel) {
        await channel.delete(reason);
      }
      
      // Artık aktif olmadığını işaretle ve veritabanını güncelle
      room.active = false;
      room.deletedAt = Date.now();
      room.deletionReason = reason;
      this.db.set('rooms', rooms);
      
      // Kullanıcı ayarlarını güncelle
      const userSettings = this.getUserSettings(room.ownerId);
      userSettings.activeRooms = Math.max(0, (userSettings.activeRooms || 1) - 1);
      this.updateUserSettings(room.ownerId, userSettings);
      
      // İstatistikleri güncelle
      this.updateStats('activeRooms', -1);
      
      return {
        success: true,
        room
      };
      
    } catch (error) {
      console.error('Özel oda silinirken hata:', error);
      return {
        success: false,
        message: 'Özel oda silinirken bir hata oluştu.'
      };
    }
  }
  
  async updateRoom(channelId, updates, guild) {
    const rooms = this.getAllRooms();
    const room = rooms[channelId];
    
    if (!room) {
      return {
        success: false,
        message: 'Belirtilen ID ile bir oda bulunamadı.'
      };
    }
    
    try {
      const channel = guild.channels.cache.get(channelId);
      
      if (!channel) {
        return {
          success: false,
          message: 'Belirtilen ID ile bir kanal bulunamadı.'
        };
      }
      
      // Kanal adını güncelle
      if (updates.name) {
        const config = this.getConfig();
        // Karakter sınırını kontrol et
        if (updates.name.length > config.roomNameCharLimit) {
          updates.name = updates.name.substring(0, config.roomNameCharLimit);
        }
        await channel.setName(updates.name);
        room.name = updates.name;
      }
      
      // Kullanıcı sınırını güncelle
      if (updates.userLimit !== undefined) {
        await channel.setUserLimit(updates.userLimit > 0 ? updates.userLimit : 0);
        room.userLimit = updates.userLimit;
      }
      
      // Gizlilik ayarını güncelle
      if (updates.isPrivate !== undefined && updates.isPrivate !== room.isPrivate) {
        const everyoneRole = guild.roles.everyone;
        
        if (updates.isPrivate) {
          // Özel odaya çevir
          await channel.permissionOverwrites.edit(everyoneRole, {
            Connect: false
          });
        } else {
          // Herkese açık odaya çevir
          await channel.permissionOverwrites.edit(everyoneRole, {
            Connect: true
          });
        }
        
        room.isPrivate = updates.isPrivate;
      }
      
      // İzinleri güncelle
      if (updates.permissions && Array.isArray(updates.permissions)) {
        for (const perm of updates.permissions) {
          if (perm.targetId && (perm.allow !== undefined || perm.deny !== undefined)) {
            const permissionOverwrites = {
              id: perm.targetId,
              allow: perm.allow || [],
              deny: perm.deny || []
            };
            
            await channel.permissionOverwrites.edit(
              perm.targetId,
              permissionOverwrites
            );
          }
        }
        
        room.customPermissions = updates.permissions;
      }
      
      // Son etkinliği güncelle
      room.lastActivity = Date.now();
      
      // Veritabanını güncelle
      this.db.set('rooms', rooms);
      
      return {
        success: true,
        room,
        channel
      };
      
    } catch (error) {
      console.error('Özel oda güncellenirken hata:', error);
      return {
        success: false,
        message: 'Özel oda güncellenirken bir hata oluştu.'
      };
    }
  }
  
  async addUserToRoom(channelId, targetUserId, guild) {
    const rooms = this.getAllRooms();
    const room = rooms[channelId];
    
    if (!room) {
      return {
        success: false,
        message: 'Belirtilen ID ile bir oda bulunamadı.'
      };
    }
    
    try {
      const channel = guild.channels.cache.get(channelId);
      
      if (!channel) {
        return {
          success: false,
          message: 'Belirtilen ID ile bir kanal bulunamadı.'
        };
      }
      
      // Kullanıcıya izin ver
      await channel.permissionOverwrites.edit(targetUserId, {
        Connect: true,
        ViewChannel: true
      });
      
      // Odaya kullanıcı ekle
      if (!room.members.includes(targetUserId)) {
        room.members.push(targetUserId);
      }
      
      // Son etkinliği güncelle
      room.lastActivity = Date.now();
      
      // Veritabanını güncelle
      this.db.set('rooms', rooms);
      
      return {
        success: true,
        room,
        channel
      };
      
    } catch (error) {
      console.error('Kullanıcı odaya eklenirken hata:', error);
      return {
        success: false,
        message: 'Kullanıcı odaya eklenirken bir hata oluştu.'
      };
    }
  }
  
  async removeUserFromRoom(channelId, targetUserId, guild) {
    const rooms = this.getAllRooms();
    const room = rooms[channelId];
    
    if (!room) {
      return {
        success: false,
        message: 'Belirtilen ID ile bir oda bulunamadı.'
      };
    }
    
    try {
      const channel = guild.channels.cache.get(channelId);
      
      if (!channel) {
        return {
          success: false,
          message: 'Belirtilen ID ile bir kanal bulunamadı.'
        };
      }
      
      // Hedef kullanıcı oda sahibi olamaz
      if (room.ownerId === targetUserId) {
        return {
          success: false,
          message: 'Oda sahibi odadan çıkarılamaz.'
        };
      }
      
      // Kullanıcının izinlerini kaldır
      await channel.permissionOverwrites.edit(targetUserId, {
        Connect: false
      });
      
      // Kullanıcıyı odadan at (bağlı ise)
      const member = guild.members.cache.get(targetUserId);
      if (member && member.voice.channelId === channelId) {
        await member.voice.disconnect('Odadan çıkarıldı');
      }
      
      // Odadan kullanıcıyı kaldır
      room.members = room.members.filter(id => id !== targetUserId);
      
      // Son etkinliği güncelle
      room.lastActivity = Date.now();
      
      // Veritabanını güncelle
      this.db.set('rooms', rooms);
      
      return {
        success: true,
        room,
        channel
      };
      
    } catch (error) {
      console.error('Kullanıcı odadan çıkarılırken hata:', error);
      return {
        success: false,
        message: 'Kullanıcı odadan çıkarılırken bir hata oluştu.'
      };
    }
  }
  
  async transferOwnership(channelId, newOwnerId, guild) {
    const rooms = this.getAllRooms();
    const room = rooms[channelId];
    
    if (!room) {
      return {
        success: false,
        message: 'Belirtilen ID ile bir oda bulunamadı.'
      };
    }
    
    try {
      const channel = guild.channels.cache.get(channelId);
      
      if (!channel) {
        return {
          success: false,
          message: 'Belirtilen ID ile bir kanal bulunamadı.'
        };
      }
      
      // Yeni sahibi kontrol et
      const member = guild.members.cache.get(newOwnerId);
      if (!member) {
        return {
          success: false,
          message: 'Belirtilen ID ile bir sunucu üyesi bulunamadı.'
        };
      }
      
      // Eski sahibin izinlerini düzenle
      await channel.permissionOverwrites.edit(room.ownerId, {
        ManageChannels: false,
        MuteMembers: false,
        DeafenMembers: false,
        ManageMessages: false,
        MoveMembers: false
      });
      
      // Yeni sahibin izinlerini düzenle
      await channel.permissionOverwrites.edit(newOwnerId, {
        Connect: true,
        ViewChannel: true,
        ManageChannels: true,
        MuteMembers: true,
        DeafenMembers: true,
        ManageMessages: true,
        MoveMembers: true
      });
      
      // Eski sahibin aktif oda sayısını azalt
      const oldOwnerSettings = this.getUserSettings(room.ownerId);
      oldOwnerSettings.activeRooms = Math.max(0, (oldOwnerSettings.activeRooms || 1) - 1);
      this.updateUserSettings(room.ownerId, oldOwnerSettings);
      
      // Yeni sahibin aktif oda sayısını arttır
      const newOwnerSettings = this.getUserSettings(newOwnerId);
      newOwnerSettings.activeRooms = (newOwnerSettings.activeRooms || 0) + 1;
      this.updateUserSettings(newOwnerId, newOwnerSettings);
      
      // Oda sahibini güncelle
      const oldOwnerId = room.ownerId;
      room.ownerId = newOwnerId;
      room.lastActivity = Date.now();
      
      // Veritabanını güncelle
      this.db.set('rooms', rooms);
      
      return {
        success: true,
        room,
        channel,
        oldOwnerId
      };
      
    } catch (error) {
      console.error('Oda sahipliği devredilirken hata:', error);
      return {
        success: false,
        message: 'Oda sahipliği devredilirken bir hata oluştu.'
      };
    }
  }
  
  isRoomOwner(channelId, userId) {
    const room = this.getRoom(channelId);
    return room && room.ownerId === userId;
  }
  
  hasAdminPermission(member, config = null) {
    if (!config) {
      config = this.getConfig();
    }
    
    // Yönetici yetkisi kontrolü
    if (member.permissions.has(PermissionFlagsBits.Administrator)) {
      return true;
    }
    
    // Admin rolü kontrolü
    if (config.adminRoleId && member.roles.cache.has(config.adminRoleId)) {
      return true;
    }
    
    return false;
  }
  
  cleanInactiveRooms(guild) {
    const config = this.getConfig();
    
    if (!config.autoDeleteEmptyRooms) {
      return { deleted: 0 };
    }
    
    const rooms = this.getAllRooms();
    const deletedRooms = [];
    
    for (const [channelId, room] of Object.entries(rooms)) {
      const channel = guild.channels.cache.get(channelId);
      
      // Kanal yoksa veya boşsa
      if (!channel || (channel.members && channel.members.size === 0)) {
        if (room.active) {
          this.deleteRoom(channelId, guild, 'Boş oda otomatik silindi').then(result => {
            if (result.success) {
              deletedRooms.push(channelId);
            }
          }).catch(console.error);
        }
      }
    }
    
    return { deleted: deletedRooms.length, channelIds: deletedRooms };
  }
  
  handleVoiceStateUpdate(oldState, newState) {
    // Kullanıcı bir kanaldan ayrıldıysa
    if (oldState.channel && !newState.channel) {
      this.updateRoomMemberCount(oldState.channelId, oldState.guild);
    }
    // Kullanıcı bir kanala girdiyse
    else if (!oldState.channel && newState.channel) {
      this.updateRoomMemberCount(newState.channelId, newState.guild);
      
      // Lobi kanalı kontrolü
      const config = this.getConfig();
      if (config.enabled && config.lobbyChannelId === newState.channelId) {
        this.handleLobbyJoin(newState);
      }
    }
    // Kullanıcı kanal değiştirdiyse
    else if (oldState.channel && newState.channel && oldState.channelId !== newState.channelId) {
      this.updateRoomMemberCount(oldState.channelId, oldState.guild);
      this.updateRoomMemberCount(newState.channelId, newState.guild);
      
      // Lobi kanalı kontrolü
      const config = this.getConfig();
      if (config.enabled && config.lobbyChannelId === newState.channelId) {
        this.handleLobbyJoin(newState);
      }
    }
  }
  
  updateRoomMemberCount(channelId, guild) {
    const rooms = this.getAllRooms();
    const room = rooms[channelId];
    
    if (!room || !room.active) return;
    
    const channel = guild.channels.cache.get(channelId);
    
    // Kanal yoksa veya boşsa
    if (!channel || (channel.members && channel.members.size === 0)) {
      // Auto-delete yapılandırmasına bağlı olarak kanalı sil
      const config = this.getConfig();
      if (config.autoDeleteEmptyRooms) {
        setTimeout(() => {
          // Tekrar kontrol et, belki birileri girmiştir
          const updatedChannel = guild.channels.cache.get(channelId);
          if (!updatedChannel || (updatedChannel.members && updatedChannel.members.size === 0)) {
            this.deleteRoom(channelId, guild, 'Boş oda otomatik silindi').catch(console.error);
          }
        }, 60000); // 1 dakika bekle
      }
    }
  }
  
  async handleLobbyJoin(voiceState) {
    const config = this.getConfig();
    
    if (!config.enabled || !config.lobbyChannelId || !config.categoryId) {
      return;
    }
    
    // Kullanıcı bilgilerini al
    const user = voiceState.member.user;
    const guild = voiceState.guild;
    
    // Oda oluşturma iznini kontrol et
    const canCreate = this.canCreateRoom(user.id, guild);
    if (!canCreate.allowed) {
      // İzin yoksa, kullanıcıyı bilgilendir (DM veya geçici mesaj)
      // İsteğe bağlı olarak burası düzenlenebilir
      return;
    }
    
    // Kullanıcı ayarlarını al
    const userSettings = this.getUserSettings(user.id);
    
    // Önceden belirlenmiş oda ismini al veya varsayılan şablonu kullan
    const roomName = userSettings.roomDefaults.name || 
                     config.roomNameTemplate.replace('{username}', user.username);
    
    // Önceden belirlenmiş kullanıcı limitini al veya varsayılanı kullan
    const userLimit = userSettings.roomDefaults.userLimit || config.defaultUserLimit;
    
    // Oda gizliliğini al
    const isPrivate = userSettings.roomDefaults.isPrivate || false;
    
    // Odayı oluştur
    const result = await this.createRoom({
      guild,
      user,
      name: roomName,
      userLimit,
      isPrivate
    });
    
    if (result.success && result.channel) {
      // Kullanıcıyı yeni odaya taşı
      try {
        await voiceState.setChannel(result.channel);
      } catch (error) {
        console.error('Kullanıcı özel odaya taşınırken hata:', error);
      }
    }
  }
}

export default VoiceRoomManager; 