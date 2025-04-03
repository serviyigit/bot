import { EmbedBuilder } from 'discord.js';
import EconomyManager from '../../../utils/economyManager.js';

export default {
  name: 'balık-tut',
  description: 'OwO! Balık tutarak ödüller ve bazen nadir balıklar yakalayabilirsin',
  usage: '',
  aliases: ['fish', 'balık', 'fishing', 'balik', 'f'],
  cooldown: 10,
  category: 'ekonomi',
  
  async execute(message, args, client) {
    const economyManager = new EconomyManager();
    const config = economyManager.getConfig();
    const userProfile = economyManager.getUserProfile(message.author.id);
    
    const now = Date.now();
    const fishCooldown = 3 * 60 * 1000;
    const cooldownLeft = (userProfile.cooldowns.fish + fishCooldown) - now;
    
    if (cooldownLeft > 0) {
      const seconds = Math.ceil(cooldownLeft / 1000);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#87CEEB')
        .setTitle('OwO! Oltanı yeni attın!')
        .setDescription(`Balıkların toplanması için **${seconds} saniye** daha beklemelisin!`)
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [errorEmbed] });
    }
    
    let fishingRodBonus = 1.0;
    const inventory = economyManager.getUserInventory(message.author.id);
    const hasFishingRod = inventory['fishing_rod'] ? true : false;
    
    if (hasFishingRod) {
      fishingRodBonus = 1.2;
    }
    
    const users = economyManager.db.get('users');
    userProfile.cooldowns.fish = now;
    userProfile.stats.fishCount++;
    
    economyManager.db.set('users', users);
    
    const fishMessages = [
      'Olta suya atıldı, balıkları bekliyorsun...',
      'Sakin bir gölde balık tutuyorsun...',
      'Oltanı denize attın, bir şey yakalamayı umuyorsun...',
      'Su berrak ve balıklar gözüküyor!',
      'Oltanı derin sulara attın...'
    ];
    
    const startMessage = fishMessages[Math.floor(Math.random() * fishMessages.length)];
    
    const fishingEmbed = new EmbedBuilder()
      .setColor('#1E90FF')
      .setTitle('🎣 Balık Tutuyorsun!')
      .setDescription(startMessage)
      .setFooter({ text: hasFishingRod ? 'Balık oltası kullanıyorsun! Bonus şansın var!' : 'İpucu: Balık oltası alarak daha iyi balıklar yakalayabilirsin!', iconURL: message.author.displayAvatarURL() });
    
    const fishMsg = await message.reply({ embeds: [fishingEmbed] });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const fishes = [
      { name: "Hamsi", emoji: "🐟", rarity: "common", value: 10 },
      { name: "Sazan", emoji: "🐟", rarity: "common", value: 15 },
      { name: "Alabalık", emoji: "🐟", rarity: "common", value: 20 },
      { name: "Levrek", emoji: "🐠", rarity: "uncommon", value: 30 },
      { name: "Somon", emoji: "🐟", rarity: "uncommon", value: 40 },
      { name: "Kalamar", emoji: "🦑", rarity: "uncommon", value: 45 },
      { name: "Kılıç Balığı", emoji: "🐡", rarity: "rare", value: 60 },
      { name: "Köpekbalığı", emoji: "🦈", rarity: "rare", value: 80 },
      { name: "İstiridye", emoji: "🦪", rarity: "rare", value: 100 },
      { name: "Altın Balık", emoji: "🐠", rarity: "legendary", value: 200 },
      { name: "Balina", emoji: "🐋", rarity: "legendary", value: 300 }
    ];
    
    const rarityChances = {
      common: 0.60,
      uncommon: 0.25,
      rare: 0.10,
      legendary: 0.05
    };
    
    const foundPet = Math.random() <= 0.05;
    
    if (foundPet) {
      const waterPets = ["fish", "shark", "octopus", "crab", "turtle"];
      
      const randomPetType = waterPets[Math.floor(Math.random() * waterPets.length)];
      
      const xpGain = Math.floor((Math.floor(Math.random() * 8) + 3) * fishingRodBonus);
      economyManager.addXp(message.author.id, xpGain);
      
      const petResult = economyManager.rollPet(message.author.id);
      
      if (petResult.success) {
        const successEmbed = new EmbedBuilder()
          .setColor('#FFA500')
          .setTitle('🎉 OwO! Suda bir şey yakaladın!')
          .setDescription(`${petResult.pet.emoji} **${petResult.pet.name}** suda seni buldu ve arkadaş olmak istiyor!\n\n${petResult.message}`)
          .addFields(
            { name: '📊 Seviye', value: `${petResult.pet.level}`, inline: true },
            { name: '📈 Nadir', value: `${petResult.pet.type}`, inline: true },
            { name: '🔮 XP Kazandın', value: `+${xpGain} XP`, inline: true }
          )
          .setFooter({ text: `Toplam evcil hayvan: ${economyManager.getUserPets(message.author.id).length} • Balık tutma sayısı: ${userProfile.stats.fishCount}`, iconURL: message.author.displayAvatarURL() });
        
        return fishMsg.edit({ embeds: [successEmbed] });
      }
    }
    
    let selectedRarity;
    const rarityRoll = Math.random();
    let cumulativeChance = 0;
    
    for (const [rarity, chance] of Object.entries(rarityChances)) {
      cumulativeChance += chance;
      if (rarityRoll <= cumulativeChance) {
        selectedRarity = rarity;
        break;
      }
    }
    
    const eligibleFishes = fishes.filter(fish => fish.rarity === selectedRarity);
    
    if (hasFishingRod && selectedRarity === "common" && Math.random() <= 0.3) {
      const betterFishes = fishes.filter(fish => fish.rarity === "uncommon");
      const selectedFish = betterFishes[Math.floor(Math.random() * betterFishes.length)];
      
      const moneyAmount = Math.floor(selectedFish.value * fishingRodBonus);
      economyManager.updateUserBalance(message.author.id, moneyAmount, 'cash');
      
      const xpGain = Math.floor((Math.floor(Math.random() * 5) + 1) * fishingRodBonus);
      economyManager.addXp(message.author.id, xpGain);
      
      const successEmbed = new EmbedBuilder()
        .setColor('#00BFFF')
        .setTitle('🎣 Balık Yakaladın!')
        .setDescription(`${selectedFish.emoji} **${selectedFish.name}** yakaladın!\n*Olta kullandığın için daha değerli bir balık yakaladın!*`)
        .addFields(
          { name: '💰 Kazanç', value: `${moneyAmount} ${config.currencyEmoji}`, inline: true },
          { name: '🔮 XP', value: `+${xpGain} XP`, inline: true },
          { name: '💵 Yeni Bakiye', value: `${economyManager.getUserBalance(message.author.id).cash} ${config.currencyEmoji}`, inline: true }
        )
        .setFooter({ text: `${message.author.tag} • Balık tutma sayısı: ${userProfile.stats.fishCount}`, iconURL: message.author.displayAvatarURL() });
      
      return fishMsg.edit({ embeds: [successEmbed] });
    }
    
    const selectedFish = eligibleFishes[Math.floor(Math.random() * eligibleFishes.length)];
    
    const moneyAmount = Math.floor(selectedFish.value * fishingRodBonus);
    economyManager.updateUserBalance(message.author.id, moneyAmount, 'cash');
    
    const xpGain = Math.floor((Math.floor(Math.random() * 5) + 1) * fishingRodBonus);
    economyManager.addXp(message.author.id, xpGain);
    
    const rarityColors = {
      common: '#AAAAAA',
      uncommon: '#55FF55',
      rare: '#5555FF',
      legendary: '#FFAA00'
    };
    
    const catchMessages = [
      `${selectedFish.emoji} **${selectedFish.name}** yakaladın ve ${moneyAmount} ${config.currencyEmoji} kazandın!`,
      `${selectedFish.emoji} Güzel bir **${selectedFish.name}** oltana takıldı! Satarak ${moneyAmount} ${config.currencyEmoji} kazandın.`,
      `${selectedFish.emoji} **${selectedFish.name}** yakaladın! Bu balık pazarda ${moneyAmount} ${config.currencyEmoji} ediyor.`,
      `${selectedFish.emoji} Vay! Bir **${selectedFish.name}** yakaladın ve ${moneyAmount} ${config.currencyEmoji} karşılığında sattın.`,
      `${selectedFish.emoji} **${selectedFish.name}** oltanı zorladı ama başardın! ${moneyAmount} ${config.currencyEmoji} kazandın.`
    ];
    
    const catchMessage = catchMessages[Math.floor(Math.random() * catchMessages.length)];
    
    const successEmbed = new EmbedBuilder()
      .setColor(rarityColors[selectedFish.rarity])
      .setTitle(`🎣 ${selectedFish.rarity === 'legendary' ? 'LEGENDAwY!' : 'Balık Yakaladın!'}`)
      .setDescription(catchMessage)
      .addFields(
        { name: '💰 Kazanç', value: `${moneyAmount} ${config.currencyEmoji}`, inline: true },
        { name: '🔮 XP', value: `+${xpGain} XP`, inline: true },
        { name: '💵 Yeni Bakiye', value: `${economyManager.getUserBalance(message.author.id).cash} ${config.currencyEmoji}`, inline: true }
      )
      .setFooter({ text: hasFishingRod ? 'Balık oltası kullanıyorsun! Bonus kazandın! 🎣' : 'İpucu: Balık oltası satın alarak daha iyi balıklar yakalayabilirsin!', iconURL: message.author.displayAvatarURL() });
    
    return fishMsg.edit({ embeds: [successEmbed] });
  },
}; 