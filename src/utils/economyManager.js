import JsonDatabase from './jsonDatabase.js';

class EconomyManager {
  constructor() {
    this.db = new JsonDatabase('economy-system');
    this.itemsDb = new JsonDatabase('economy-items');
    this.petsDb = new JsonDatabase('economy-pets');
    this.initializeDatabase();
  }

  initializeDatabase() {
    if (!this.db.has('users')) {
      this.db.set('users', {});
    }
    
    if (!this.db.has('config')) {
      this.db.set('config', {
        currencyName: "Cowoncy",
        currencyEmoji: "OwO",
        dailyAmount: 250,
        workMinAmount: 50,
        workMaxAmount: 200,
        workCooldown: 3600000,
        dailyCooldown: 86400000,
        minBet: 10,
        maxBet: 50000,
        messageXp: {
          min: 1,
          max: 5
        },
        levelUpBonus: 100,
        levelUpFormula: "level * 100"
      });
    }
    
    this.initializeItems();
    this.initializePets();
  }
  
  initializeItems() {
    const itemCategories = {
      collectible: "Koleksiyon",
      tool: "Alet",
      badge: "Rozet",
      role: "Rol",
      buff: "Güçlendirme",
      weapon: "Silah",
      lootbox: "Sandık"
    };
    
    if (!this.itemsDb.has('categories')) {
      this.itemsDb.set('categories', itemCategories);
    }
    
    if (!this.itemsDb.has('items')) {
      const defaultItems = {
        "fishing_rod": {
          id: "fishing_rod",
          name: "Balık Oltası",
          description: "Balık tutmanı sağlar, para kazanma şansını artırır",
          price: 500,
          sellPrice: 250,
          emoji: "🎣",
          category: "tool",
          effect: {
            type: "fishingBoost",
            value: 1.2
          },
          tradeable: true,
          usable: true,
          rarity: "common"
        },
        "lucky_coin": {
          id: "lucky_coin",
          name: "Şans Parası",
          description: "Şansını artırır, günlük ödüllerde bonus kazanma ihtimali verir",
          price: 1000,
          sellPrice: 500,
          emoji: "🍀",
          category: "collectible",
          effect: {
            type: "luckBoost",
            value: 1.1
          },
          tradeable: true,
          usable: false,
          rarity: "uncommon"
        },
        "golden_badge": {
          id: "golden_badge",
          name: "Altın Rozet",
          description: "Prestijli bir rozet, zenginliğini gösterir",
          price: 10000,
          sellPrice: 5000,
          emoji: "🏅",
          category: "badge",
          effect: null,
          tradeable: false,
          usable: false,
          rarity: "rare"
        },
        "xp_boost": {
          id: "xp_boost",
          name: "XP Takviyesi",
          description: "1 saat boyunca %50 daha fazla XP kazanırsın",
          price: 750,
          sellPrice: 0,
          emoji: "⚡",
          category: "buff",
          effect: {
            type: "xpBoost",
            value: 1.5,
            duration: 3600000
          },
          tradeable: false,
          usable: true,
          rarity: "uncommon"
        },
        "common_lootbox": {
          id: "common_lootbox",
          name: "Sıradan Sandık",
          description: "Rastgele eşyalar içeren sıradan bir sandık",
          price: 100,
          sellPrice: 50,
          emoji: "📦",
          category: "lootbox",
          effect: {
            type: "lootbox",
            tier: "common"
          },
          tradeable: true,
          usable: true,
          rarity: "common"
        },
        "uncommon_lootbox": {
          id: "uncommon_lootbox",
          name: "Nadir Sandık",
          description: "Daha değerli eşyalar içeren nadir bir sandık",
          price: 500,
          sellPrice: 250,
          emoji: "🎁",
          category: "lootbox",
          effect: {
            type: "lootbox",
            tier: "uncommon"
          },
          tradeable: true,
          usable: true,
          rarity: "uncommon"
        },
        "rare_lootbox": {
          id: "rare_lootbox",
          name: "Ender Sandık",
          description: "Çok değerli eşyalar içeren ender bir sandık",
          price: 2000,
          sellPrice: 1000,
          emoji: "💎",
          category: "lootbox",
          effect: {
            type: "lootbox",
            tier: "rare"
          },
          tradeable: true,
          usable: true,
          rarity: "rare"
        },
        "weapon_knife": {
          id: "weapon_knife",
          name: "Bıçak",
          description: "Savaşlarda kullanabileceğin basit bir bıçak",
          price: 300,
          sellPrice: 150,
          emoji: "🔪",
          category: "weapon",
          effect: {
            type: "weapon",
            attackBonus: 5,
            durability: 50
          },
          tradeable: true,
          usable: true,
          rarity: "common"
        },
        "weapon_sword": {
          id: "weapon_sword",
          name: "Kılıç",
          description: "Savaşlarda kullanabileceğin güçlü bir kılıç",
          price: 1500,
          sellPrice: 750,
          emoji: "⚔️",
          category: "weapon",
          effect: {
            type: "weapon",
            attackBonus: 15,
            durability: 70
          },
          tradeable: true,
          usable: true,
          rarity: "uncommon"
        }
      };
      
      this.itemsDb.set('items', defaultItems);
    }
  }
  
  initializePets() {
    if (!this.petsDb.has('petTypes')) {
      const petTypes = {
        "cat": {
          name: "Kedi",
          emoji: "🐱",
          rarity: "common",
          baseStats: {
            attack: 5,
            defense: 3,
            speed: 8
          },
          hungerDecay: 5,
          maxHunger: 100,
          maxAffection: 100,
          evolutionPaths: ["tiger", "lion"]
        },
        "dog": {
          name: "Köpek",
          emoji: "🐶",
          rarity: "common",
          baseStats: {
            attack: 6,
            defense: 5,
            speed: 7
          },
          hungerDecay: 6,
          maxHunger: 100,
          maxAffection: 100,
          evolutionPaths: ["wolf"]
        },
        "bunny": {
          name: "Tavşan",
          emoji: "🐰",
          rarity: "uncommon",
          baseStats: {
            attack: 3,
            defense: 2,
            speed: 10
          },
          hungerDecay: 4,
          maxHunger: 100,
          maxAffection: 100,
          evolutionPaths: []
        },
        "tiger": {
          name: "Kaplan",
          emoji: "🐯",
          rarity: "rare",
          baseStats: {
            attack: 15,
            defense: 10,
            speed: 13
          },
          hungerDecay: 8,
          maxHunger: 150,
          maxAffection: 150,
          evolutionPaths: []
        },
        "lion": {
          name: "Aslan",
          emoji: "🦁",
          rarity: "rare",
          baseStats: {
            attack: 14,
            defense: 12,
            speed: 12
          },
          hungerDecay: 7,
          maxHunger: 150,
          maxAffection: 150,
          evolutionPaths: []
        },
        "wolf": {
          name: "Kurt",
          emoji: "🐺",
          rarity: "rare",
          baseStats: {
            attack: 12,
            defense: 8,
            speed: 14
          },
          hungerDecay: 7,
          maxHunger: 130,
          maxAffection: 150,
          evolutionPaths: []
        },
        "dragon": {
          name: "Ejderha",
          emoji: "🐉",
          rarity: "epic",
          baseStats: {
            attack: 25,
            defense: 20,
            speed: 18
          },
          hungerDecay: 10,
          maxHunger: 200,
          maxAffection: 200,
          evolutionPaths: []
        }
      };
      
      this.petsDb.set('petTypes', petTypes);
    }
    
    if (!this.petsDb.has('petAccessories')) {
      const petAccessories = {
        "simple_collar": {
          name: "Basit Tasma",
          emoji: "🧶",
          price: 100,
          statBonus: {
            defense: 1
          },
          rarity: "common"
        },
        "bow": {
          name: "Fiyonk",
          emoji: "🎀",
          price: 150,
          statBonus: {
            speed: 1
          },
          rarity: "common"
        },
        "sunglasses": {
          name: "Güneş Gözlüğü",
          emoji: "😎",
          price: 300,
          statBonus: {
            attack: 2
          },
          rarity: "uncommon"
        },
        "party_hat": {
          name: "Parti Şapkası",
          emoji: "🥳",
          price: 500,
          statBonus: {
            attack: 1,
            defense: 1,
            speed: 1
          },
          rarity: "rare"
        }
      };
      
      this.petsDb.set('petAccessories', petAccessories);
    }
  }
  
  getUserProfile(userId) {
    const users = this.db.get('users');
    
    if (!users[userId]) {
      const newProfile = {
        userId: userId,
        balance: 0,
        bank: 0,
        experience: 0,
        level: 1,
        inventory: {},
        pets: [],
        activePet: null,
        stats: {
          commandsUsed: 0,
          messagesCount: 0,
          workCount: 0,
          fishCount: 0,
          huntCount: 0,
          gamblingWins: 0,
          gamblingLosses: 0,
          robSuccess: 0,
          robFailed: 0,
          robbed: 0,
          dailyStreak: 0,
          highestDailyStreak: 0,
          itemsBought: 0,
          itemsSold: 0,
          petsFound: 0,
          petsEvolved: 0,
          battleWins: 0,
          battleLosses: 0
        },
        cooldowns: {
          daily: 0,
          work: 0,
          fish: 0,
          hunt: 0,
          rob: 0,
          battle: 0
        },
        buffs: {},
        lastMessageDate: Date.now()
      };
      
      users[userId] = newProfile;
      this.db.set('users', users);
      
      return newProfile;
    }
    
    return users[userId];
  }
  
  getUserBalance(userId) {
    const profile = this.getUserProfile(userId);
    return {
      cash: profile.balance,
      bank: profile.bank,
      total: profile.balance + profile.bank
    };
  }
  
  updateUserBalance(userId, amount, type = 'cash') {
    const users = this.db.get('users');
    const profile = this.getUserProfile(userId);
    
    if (type === 'cash') {
      profile.balance += amount;
      if (profile.balance < 0) profile.balance = 0;
    } else if (type === 'bank') {
      profile.bank += amount;
      if (profile.bank < 0) profile.bank = 0;
    }
    
    users[userId] = profile;
    this.db.set('users', users);
    
    return profile;
  }

  getUserInventory(userId) {
    const profile = this.getUserProfile(userId);
    return profile.inventory || {};
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

  addXp(userId, amount) {
    const users = this.db.get('users');
    const profile = this.getUserProfile(userId);
    const oldLevel = profile.level;
    
    profile.experience += amount;
    
    const levelUpFormula = this.getConfig().levelUpFormula;
    const xpNeeded = eval(levelUpFormula.replace('level', profile.level));
    
    let levelUpBonus = 0;
    
    if (profile.experience >= xpNeeded) {
      profile.level += 1;
      profile.experience -= xpNeeded;
      
      levelUpBonus = this.getConfig().levelUpBonus;
      profile.balance += levelUpBonus;
    }
    
    users[userId] = profile;
    this.db.set('users', users);
    
    return {
      success: true,
      levelUp: oldLevel !== profile.level,
      oldLevel: oldLevel,
      newLevel: profile.level,
      levelUpBonus: levelUpBonus
    };
  }
  
  createPet(userId, petType) {
    const petTypes = this.petsDb.get('petTypes');
    if (!petTypes[petType]) return null;
    
    const template = petTypes[petType];
    const newPet = {
      id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: petType,
      name: template.name,
      emoji: template.emoji,
      level: 1,
      experience: 0,
      hunger: template.maxHunger,
      affection: 50,
      stats: { ...template.baseStats },
      equipment: {},
      lastFed: Date.now(),
      lastPlayed: Date.now(),
      createdAt: Date.now()
    };
    
    return newPet;
  }
  
  addPetToUser(userId, petType) {
    const users = this.db.get('users');
    const userProfile = this.getUserProfile(userId);
    
    const newPet = this.createPet(userId, petType);
    if (!newPet) {
      return {
        success: false,
        message: "Geçersiz evcil hayvan türü!"
      };
    }
    
    if (!userProfile.pets) {
      userProfile.pets = [];
    }
    
    userProfile.pets.push(newPet);
    
    userProfile.stats.petsFound += 1;
    
    if (userProfile.pets.length === 1) {
      userProfile.activePet = newPet.id;
    }
    
    users[userId] = userProfile;
    this.db.set('users', users);
    
    return {
      success: true,
      message: `Yeni bir ${newPet.emoji} ${newPet.name} buldun!`,
      pet: newPet
    };
  }
  
  getUserPets(userId) {
    const userProfile = this.getUserProfile(userId);
    return userProfile.pets || [];
  }
  
  getPetDetails(userId, petId) {
    const userProfile = this.getUserProfile(userId);
    const pet = userProfile.pets ? userProfile.pets.find(p => p.id === petId) : null;
    
    if (!pet) {
      return {
        success: false,
        message: "Evcil hayvan bulunamadı!"
      };
    }
    
    const currentTime = Date.now();
    const petTypes = this.petsDb.get('petTypes');
    const petTemplate = petTypes[pet.type];
    
    const hoursSinceLastFed = (currentTime - pet.lastFed) / 3600000;
    let currentHunger = Math.max(0, pet.hunger - (hoursSinceLastFed * petTemplate.hungerDecay));
    
    const hoursSinceLastPlayed = (currentTime - pet.lastPlayed) / 3600000;
    let currentAffection = Math.max(0, pet.affection - (hoursSinceLastPlayed * 2));
    
    const users = this.db.get('users');
    pet.hunger = Math.floor(currentHunger);
    pet.affection = Math.floor(currentAffection);
    
    users[userId] = userProfile;
    this.db.set('users', users);
    
    return {
      success: true,
      pet: pet,
      template: petTemplate
    };
  }
  
  feedPet(userId, petId) {
    const userProfile = this.getUserProfile(userId);
    const petIndex = userProfile.pets ? userProfile.pets.findIndex(p => p.id === petId) : -1;
    
    if (petIndex === -1) {
      return {
        success: false,
        message: "Evcil hayvan bulunamadı!"
      };
    }
    
    const pet = userProfile.pets[petIndex];
    const petTypes = this.petsDb.get('petTypes');
    const petTemplate = petTypes[pet.type];
    
    if (pet.hunger >= petTemplate.maxHunger) {
      return {
        success: false,
        message: `${pet.emoji} ${pet.name} zaten tok!`
      };
    }
    
    const feedAmount = Math.floor(petTemplate.maxHunger * 0.3);
    pet.hunger = Math.min(petTemplate.maxHunger, pet.hunger + feedAmount);
    pet.lastFed = Date.now();
    
    pet.affection = Math.min(petTemplate.maxAffection, pet.affection + 5);
    
    const xpGain = Math.floor(Math.random() * 3) + 1;
    pet.experience += xpGain;
    
    this.checkPetLevelUp(pet, petTemplate);
    
    const users = this.db.get('users');
    userProfile.pets[petIndex] = pet;
    users[userId] = userProfile;
    this.db.set('users', users);
    
    return {
      success: true,
      message: `${pet.emoji} ${pet.name} beslendi! Açlık: ${pet.hunger}/${petTemplate.maxHunger}`,
      feedAmount: feedAmount,
      xpGain: xpGain,
      pet: pet
    };
  }
  
  playWithPet(userId, petId) {
    const userProfile = this.getUserProfile(userId);
    const petIndex = userProfile.pets ? userProfile.pets.findIndex(p => p.id === petId) : -1;
    
    if (petIndex === -1) {
      return {
        success: false,
        message: "Evcil hayvan bulunamadı!"
      };
    }
    
    const pet = userProfile.pets[petIndex];
    const petTypes = this.petsDb.get('petTypes');
    const petTemplate = petTypes[pet.type];
    
    const affectionGain = Math.floor(Math.random() * 10) + 10;
    pet.affection = Math.min(petTemplate.maxAffection, pet.affection + affectionGain);
    pet.lastPlayed = Date.now();
    
    const xpGain = Math.floor(Math.random() * 5) + 3;
    pet.experience += xpGain;
    
    this.checkPetLevelUp(pet, petTemplate);
    
    const users = this.db.get('users');
    userProfile.pets[petIndex] = pet;
    users[userId] = userProfile;
    this.db.set('users', users);
    
    const playMessages = [
      `${pet.name} ile top oynadın!`,
      `${pet.name} ile koşu yaptın!`,
      `${pet.name} ile saklambaç oynadın!`,
      `${pet.name} ile birlikte güneşlendin!`,
      `${pet.name} ile tüylü oyuncaklarla oynadın!`
    ];
    
    const randomMessage = playMessages[Math.floor(Math.random() * playMessages.length)];
    
    return {
      success: true,
      message: `${pet.emoji} ${randomMessage} Sevgi: ${pet.affection}/${petTemplate.maxAffection}`,
      affectionGain: affectionGain,
      xpGain: xpGain,
      pet: pet
    };
  }
  
  checkPetLevelUp(pet, petTemplate) {
    const xpNeeded = pet.level * 25;
    
    if (pet.experience >= xpNeeded) {
      pet.level += 1;
      pet.experience -= xpNeeded;
      
      pet.stats.attack += Math.floor(Math.random() * 2) + 1;
      pet.stats.defense += Math.floor(Math.random() * 2) + 1;
      pet.stats.speed += Math.floor(Math.random() * 2) + 1;
      
      return true;
    }
    
    return false;
  }
  
  evolvePet(userId, petId) {
    const userProfile = this.getUserProfile(userId);
    const petIndex = userProfile.pets ? userProfile.pets.findIndex(p => p.id === petId) : -1;
    
    if (petIndex === -1) {
      return {
        success: false,
        message: "Evcil hayvan bulunamadı!"
      };
    }
    
    const pet = userProfile.pets[petIndex];
    const petTypes = this.petsDb.get('petTypes');
    const petTemplate = petTypes[pet.type];
    
    const evolutionPaths = petTemplate.evolutionPaths;
    
    if (!evolutionPaths || evolutionPaths.length === 0) {
      return {
        success: false,
        message: `${pet.emoji} ${pet.name} evrimleşemiyor!`
      };
    }
    
    if (pet.level < 10) {
      return {
        success: false,
        message: `Evrimleşmek için evcil hayvanın en az seviye 10 olmalı! (Şu anki: ${pet.level})`
      };
    }
    
    const newType = evolutionPaths[Math.floor(Math.random() * evolutionPaths.length)];
    const newTemplate = petTypes[newType];
    
    pet.type = newType;
    pet.name = newTemplate.name;
    pet.emoji = newTemplate.emoji;
    
    const statMultiplier = 1.5;
    pet.stats = {
      attack: Math.floor(pet.stats.attack * statMultiplier),
      defense: Math.floor(pet.stats.defense * statMultiplier),
      speed: Math.floor(pet.stats.speed * statMultiplier)
    };
    
    userProfile.stats.petsEvolved += 1;
    
    const users = this.db.get('users');
    userProfile.pets[petIndex] = pet;
    users[userId] = userProfile;
    this.db.set('users', users);
    
    return {
      success: true,
      message: `🌟 **EVRİM!** ${petTemplate.emoji} ${petTemplate.name} ➡️ ${pet.emoji} ${pet.name}`,
      oldPet: {
        name: petTemplate.name,
        emoji: petTemplate.emoji
      },
      newPet: pet
    };
  }
  
  petBattle(userId1, petId1, userId2, petId2) {
    const user1Profile = this.getUserProfile(userId1);
    const user2Profile = this.getUserProfile(userId2);
    
    const pet1 = user1Profile.pets ? user1Profile.pets.find(p => p.id === petId1) : null;
    const pet2 = user2Profile.pets ? user2Profile.pets.find(p => p.id === petId2) : null;
    
    if (!pet1 || !pet2) {
      return {
        success: false,
        message: "Evcil hayvanlardan biri veya her ikisi bulunamadı!"
      };
    }
    
    const rounds = [];
    let hp1 = 50 + (pet1.level * 5);
    let hp2 = 50 + (pet2.level * 5);
    
    let turn = 0;
    let winner = null;
    
    let firstPet = pet1.stats.speed >= pet2.stats.speed ? pet1 : pet2;
    let secondPet = firstPet === pet1 ? pet2 : pet1;
    
    while (hp1 > 0 && hp2 > 0 && turn < 10) {
      turn++;
      
      let damage1 = Math.max(1, Math.floor(firstPet.stats.attack * (Math.random() * 0.4 + 0.8) - secondPet.stats.defense * 0.5));
      
      const isFirstPetPet1 = firstPet === pet1;
      if (isFirstPetPet1) {
        hp2 -= damage1;
      } else {
        hp1 -= damage1;
      }
      
      rounds.push({
        turn: turn,
        attacker: firstPet.name,
        defender: secondPet.name,
        damage: damage1,
        attackerHp: isFirstPetPet1 ? hp1 : hp2,
        defenderHp: isFirstPetPet1 ? hp2 : hp1
      });
      
      if (hp1 <= 0 || hp2 <= 0) {
        break;
      }
      
      let damage2 = Math.max(1, Math.floor(secondPet.stats.attack * (Math.random() * 0.4 + 0.8) - firstPet.stats.defense * 0.5));
      
      if (isFirstPetPet1) {
        hp1 -= damage2;
      } else {
        hp2 -= damage2;
      }
      
      rounds.push({
        turn: turn,
        attacker: secondPet.name,
        defender: firstPet.name,
        damage: damage2,
        attackerHp: isFirstPetPet1 ? hp2 : hp1,
        defenderHp: isFirstPetPet1 ? hp1 : hp2
      });
    }
    
    if (hp1 <= 0 && hp2 <= 0) {
      winner = "berabere";
    } else if (hp1 <= 0) {
      winner = userId2;
      user2Profile.stats.battleWins += 1;
      user1Profile.stats.battleLosses += 1;
    } else if (hp2 <= 0) {
      winner = userId1;
      user1Profile.stats.battleWins += 1;
      user2Profile.stats.battleLosses += 1;
    } else {
      if (hp1 > hp2) {
        winner = userId1;
        user1Profile.stats.battleWins += 1;
        user2Profile.stats.battleLosses += 1;
      } else if (hp2 > hp1) {
        winner = userId2;
        user2Profile.stats.battleWins += 1;
        user1Profile.stats.battleLosses += 1;
      } else {
        winner = "berabere";
      }
    }
    
    const xpGain1 = Math.floor(Math.random() * 5) + 5;
    const xpGain2 = Math.floor(Math.random() * 5) + 5;
    
    pet1.experience += xpGain1;
    pet2.experience += xpGain2;
    
    const petTypes = this.petsDb.get('petTypes');
    this.checkPetLevelUp(pet1, petTypes[pet1.type]);
    this.checkPetLevelUp(pet2, petTypes[pet2.type]);
    
    if (winner === userId1) {
      pet1.experience += 3;
    } else if (winner === userId2) {
      pet2.experience += 3;
    }
    
    const users = this.db.get('users');
    users[userId1] = user1Profile;
    users[userId2] = user2Profile;
    this.db.set('users', users);
    
    return {
      success: true,
      winner: winner,
      rounds: rounds,
      finalHp: {
        pet1: hp1,
        pet2: hp2
      },
      xpGain: {
        pet1: xpGain1,
        pet2: xpGain2
      },
      pets: {
        pet1: pet1,
        pet2: pet2
      }
    };
  }
  
  rollPet(userId) {
    const userProfile = this.getUserProfile(userId);
    
    const rarityChances = {
      common: 70,
      uncommon: 20,
      rare: 8,
      epic: 2
    };
    
    const randomValue = Math.random() * 100;
    let selectedRarity;
    let cumulativeChance = 0;
    
    for (const [rarity, chance] of Object.entries(rarityChances)) {
      cumulativeChance += chance;
      
      if (randomValue <= cumulativeChance) {
        selectedRarity = rarity;
        break;
      }
    }
    
    const petTypes = this.petsDb.get('petTypes');
    const eligiblePets = Object.keys(petTypes).filter(
      petType => petTypes[petType].rarity === selectedRarity
    );
    
    const randomPetType = eligiblePets[Math.floor(Math.random() * eligiblePets.length)];
    
    return this.addPetToUser(userId, randomPetType);
  }
}

export default EconomyManager; 