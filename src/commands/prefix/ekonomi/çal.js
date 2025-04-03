import { EmbedBuilder } from 'discord.js';
import EconomyManager from '../../../utils/economyManager.js';

export default {
  name: 'çal',
  description: 'Başka bir kullanıcıdan Cowoncy çal! Dikkat et, başarısız olursan ceza ödersin.',
  usage: '<@kullanıcı/kullanıcı_id>',
  aliases: ['rob', 'steal', 'hırsızlık', 'soy'],
  cooldown: 30, // 30 saniye komut cooldown
  category: 'ekonomi',
  args: true,
  
  async execute(message, args, client) {
    const economyManager = new EconomyManager();
    const config = economyManager.getConfig();
    
    // Hedef kullanıcı kontrolü
    const target = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
    
    if (!target) {
      return message.reply('Geçerli bir kullanıcı belirtmelisin! Örnek: `çal @kullanıcı`');
    }
    
    // Kendinden çalma kontrolü
    if (target.id === message.author.id) {
      return message.reply('Kendinden para çalamazsın!');
    }
    
    // Bot kontrolü
    if (target.bot) {
      return message.reply('Botlardan para çalamazsın!');
    }
    
    // Çalma cooldown kontrolü (30 dakika)
    const userProfile = economyManager.getUserProfile(message.author.id);
    const targetProfile = economyManager.getUserProfile(target.id);
    
    const now = Date.now();
    const lastRobTime = userProfile.cooldowns?.rob || 0;
    const robCooldown = 30 * 60 * 1000; // 30 dakika
    
    if (now - lastRobTime < robCooldown) {
      const remainingTime = (lastRobTime + robCooldown - now) / 1000;
      const minutes = Math.floor(remainingTime / 60);
      const seconds = Math.floor(remainingTime % 60);
      
      return message.reply(`Çok sık soygun yapıyorsun! Tekrar soygun yapmak için **${minutes} dakika ${seconds} saniye** beklemelisin.`);
    }
    
    // Hedef bakiye kontrolü
    const minRobBalance = 100;
    
    if (targetProfile.balance < minRobBalance) {
      return message.reply(`Bu kullanıcının çalınacak kadar parası yok! Hedefin en az ${minRobBalance} ${config.currencyName} olmalı.`);
    }
    
    // Minimum bakiye kontrolü
    const minThiefBalance = 50;
    
    if (userProfile.balance < minThiefBalance) {
      return message.reply(`Soygun yapabilmek için en az ${minThiefBalance} ${config.currencyName} gerekli.`);
    }
    
    // Başarı şansı hesapla
    let successChance = 0.30; // Baz %30 şans
    
    // Seviye faktörü
    const levelFactor = Math.min(0.10, userProfile.level * 0.01); // Her seviye %1 artış, maksimum %10
    successChance += levelFactor;
    
    // Item bonusları (gelecekte eklenebilir)
    // if (userProfile.items?.includes('thief_gloves')) successChance += 0.05;
    
    // Çalınacak miktarı hesapla (hedefin bakiyesinin %15-25'i)
    const minPercent = 15;
    const maxPercent = 25;
    const stealPercent = (Math.random() * (maxPercent - minPercent) + minPercent) / 100;
    const maxStealAmount = Math.floor(targetProfile.balance * stealPercent);
    const stealAmount = Math.min(maxStealAmount, 1000); // Maksimum 1000 çalınabilir
    
    // Ceza hesapla (çalma miktarının %50-80'i)
    const minPenaltyPercent = 50;
    const maxPenaltyPercent = 80;
    const penaltyPercent = (Math.random() * (maxPenaltyPercent - minPenaltyPercent) + minPenaltyPercent) / 100;
    const penaltyAmount = Math.floor(stealAmount * penaltyPercent);
    
    // Çalma başarılı mı kontrolü
    const isSuccessful = Math.random() < successChance;
    
    // Çalma cooldown'unu güncelle
    userProfile.cooldowns = userProfile.cooldowns || {};
    userProfile.cooldowns.rob = now;
    
    // İstatistikleri başlat
    userProfile.stats = userProfile.stats || { robberyAttempts: 0, robberySuccess: 0, robberyFailed: 0 };
    userProfile.stats.robberyAttempts = (userProfile.stats.robberyAttempts || 0) + 1;
    
    const users = economyManager.db.get('users');
    
    if (isSuccessful) {
      // Başarılı çalma
      userProfile.stats.robberySuccess = (userProfile.stats.robberySuccess || 0) + 1;
      
      // Para transferi
      economyManager.updateUserBalance(message.author.id, stealAmount, 'cash');
      economyManager.updateUserBalance(target.id, -stealAmount, 'cash');
      
      // XP kazancı
      const xpGain = Math.floor(Math.random() * 15) + 10; // 10-25 XP
      economyManager.addXp(message.author.id, xpGain);
      
      // Kullanıcı verilerini güncelle
      economyManager.db.set('users', users);
      
      // Başarılı mesajlar
      const successMessages = [
        `${target.username}'nin cebinden ${stealAmount} ${config.currencyName} aşırdın!`,
        `${target.username} uyurken ${stealAmount} ${config.currencyName} çalmayı başardın!`,
        `Hızlı parmaklarınla ${target.username}'den ${stealAmount} ${config.currencyName} çaldın!`,
        `${target.username} dalgınken ${stealAmount} ${config.currencyName} çaldın ve kaçtın!`,
        `${stealAmount} ${config.currencyName} ile birlikte ${target.username}'in cüzdanını hafiflettin!`,
        `Profesyonel bir hırsız gibi ${target.username}'den ${stealAmount} ${config.currencyName} çaldın!`
      ];
      
      const randomSuccessMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
      
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🦝 Soygun Başarılı!')
        .setDescription(randomSuccessMessage)
        .addFields(
          { name: '💰 Çalınan Miktar', value: `${stealAmount} ${config.currencyName}`, inline: true },
          { name: '🔮 Kazanılan XP', value: `${xpGain} XP`, inline: true },
          { name: '👛 Yeni Bakiyen', value: `${economyManager.getUserBalance(message.author.id).cash} ${config.currencyName}`, inline: true }
        )
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [successEmbed] });
      
    } else {
      // Başarısız çalma
      userProfile.stats.robberyFailed = (userProfile.stats.robberyFailed || 0) + 1;
      
      // Ceza kesme
      economyManager.updateUserBalance(message.author.id, -penaltyAmount, 'cash');
      
      // Az miktar XP kazancı
      const xpGain = Math.floor(Math.random() * 5) + 1; // 1-5 XP
      economyManager.addXp(message.author.id, xpGain);
      
      // Kullanıcı verilerini güncelle
      economyManager.db.set('users', users);
      
      // Başarısız mesajlar
      const failMessages = [
        `${target.username} seni yakaladı ve ${penaltyAmount} ${config.currencyName} ceza ödedin!`,
        `Soygun sırasında alarm çaldı! ${penaltyAmount} ${config.currencyName} para cezası ödedin.`,
        `${target.username}'in cebinden para çalarken yakalandın ve ${penaltyAmount} ${config.currencyName} ödemek zorunda kaldın!`,
        `Polis seni suçüstü yakaladı ve ${penaltyAmount} ${config.currencyName} ceza kesti!`,
        `Beceriksizce soygun yapmaya çalışırken ${penaltyAmount} ${config.currencyName} kaybettin!`,
        `${target.username} seni fark etti ve ${penaltyAmount} ${config.currencyName} ceza ödedin!`
      ];
      
      const randomFailMessage = failMessages[Math.floor(Math.random() * failMessages.length)];
      
      const failEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🚨 Soygun Başarısız!')
        .setDescription(randomFailMessage)
        .addFields(
          { name: '💸 Ceza', value: `${penaltyAmount} ${config.currencyName}`, inline: true },
          { name: '🔮 Kazanılan XP', value: `${xpGain} XP`, inline: true },
          { name: '👛 Kalan Bakiyen', value: `${economyManager.getUserBalance(message.author.id).cash} ${config.currencyName}`, inline: true }
        )
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [failEmbed] });
    }
  },
}; 