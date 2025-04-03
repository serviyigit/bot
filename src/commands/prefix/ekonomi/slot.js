import { EmbedBuilder } from 'discord.js';
import EconomyManager from '../../../utils/economyManager.js';

export default {
  name: 'slot',
  description: 'OwO! Slot makinesinde şansını dene',
  usage: '<bahis_miktarı>',
  aliases: ['slots', 'slotmachine', 'kumar', 'bet'],
  cooldown: 10,
  category: 'ekonomi',
  args: true,
  
  async execute(message, args, client) {
    const economyManager = new EconomyManager();
    const config = economyManager.getConfig();
    const userProfile = economyManager.getUserProfile(message.author.id);
    
    // Bahis miktarını belirle
    let betAmount;
    
    if (args[0].toLowerCase() === 'tümü' || args[0].toLowerCase() === 'all' || args[0].toLowerCase() === 'hepsi') {
      betAmount = userProfile.balance;
    } else {
      betAmount = parseInt(args[0]);
    }
    
    // Bahis miktarı kontrolü
    if (isNaN(betAmount) || betAmount <= 0) {
      return message.reply(`Geçerli bir bahis miktarı belirtmelisin! Örnek: \`${process.env.PREFIX || '!'}slot 100\` veya \`${process.env.PREFIX || '!'}slot tümü\``);
    }
    
    // Bahis limitleri
    const minBet = config.minBet || 10;
    const maxBet = config.maxBet || 50000;
    
    if (betAmount < minBet) {
      return message.reply(`En az ${minBet} ${config.currencyName} bahis yapmalısın!`);
    }
    
    if (betAmount > maxBet) {
      return message.reply(`En fazla ${maxBet} ${config.currencyName} bahis yapabilirsin!`);
    }
    
    // Yeterli para kontrolü
    if (userProfile.balance < betAmount) {
      return message.reply(`Yeterli ${config.currencyName} yok! Bakiyen: ${userProfile.balance} ${config.currencyName}`);
    }
    
    // Slot sembolleri ve kazanç çarpanları
    const symbols = [
      { emoji: "🍒", name: "kiraz", multiplier: 2, weight: 25 },   // En yaygın, düşük ödeme
      { emoji: "🍊", name: "portakal", multiplier: 2.5, weight: 20 },
      { emoji: "🍋", name: "limon", multiplier: 3, weight: 15 },
      { emoji: "🍉", name: "karpuz", multiplier: 5, weight: 10 },
      { emoji: "🍇", name: "üzüm", multiplier: 7, weight: 7 },
      { emoji: "🍓", name: "çilek", multiplier: 10, weight: 5 },
      { emoji: "🔔", name: "çan", multiplier: 15, weight: 3 },
      { emoji: "💎", name: "elmas", multiplier: 20, weight: 2 },   // En nadir, yüksek ödeme
      { emoji: "🌈", name: "gökkuşağı", multiplier: 50, weight: 1 } // Jackpot!
    ];
    
    // Slot makinesi başlangıç mesajı
    const loadingEmbed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('🎰 Slot Makinesi Dönüyor...')
      .setDescription('*Makinenin kolunu çekiyorsun...*')
      .addFields({ name: 'Bahis', value: `${betAmount} ${config.currencyName}`, inline: true })
      .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
    
    const slotMsg = await message.reply({ embeds: [loadingEmbed] });
    
    // Animasyon efekti için bekle
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Ağırlıklı rastgele sembolleri seç
    function getRandomSymbol() {
      // Toplam ağırlık
      const totalWeight = symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
      // Rastgele sayı
      const random = Math.random() * totalWeight;
      
      // Ağırlığa göre sembol seç
      let weightSum = 0;
      for (const symbol of symbols) {
        weightSum += symbol.weight;
        if (random <= weightSum) {
          return symbol;
        }
      }
      
      // Varsayılan olarak ilk sembolü döndür (buraya hiç ulaşılmamalı)
      return symbols[0];
    }
    
    // 3x3 slot makinesi oluştur
    const slotGrid = [];
    
    for (let row = 0; row < 3; row++) {
      const rowSymbols = [];
      for (let col = 0; col < 3; col++) {
        rowSymbols.push(getRandomSymbol());
      }
      slotGrid.push(rowSymbols);
    }
    
    // Kazanç hatlarını kontrol et
    let winningLines = [];
    
    // 1) Yatay satırlar
    for (let row = 0; row < 3; row++) {
      if (slotGrid[row][0].emoji === slotGrid[row][1].emoji && slotGrid[row][1].emoji === slotGrid[row][2].emoji) {
        winningLines.push({
          type: 'yatay',
          row: row,
          symbol: slotGrid[row][0]
        });
      }
    }
    
    // 2) Dikey sütunlar
    for (let col = 0; col < 3; col++) {
      if (slotGrid[0][col].emoji === slotGrid[1][col].emoji && slotGrid[1][col].emoji === slotGrid[2][col].emoji) {
        winningLines.push({
          type: 'dikey',
          col: col,
          symbol: slotGrid[0][col]
        });
      }
    }
    
    // 3) Çapraz hatlar
    // Sol üstten sağ alta
    if (slotGrid[0][0].emoji === slotGrid[1][1].emoji && slotGrid[1][1].emoji === slotGrid[2][2].emoji) {
      winningLines.push({
        type: 'çapraz',
        direction: 'sol-sağ',
        symbol: slotGrid[0][0]
      });
    }
    
    // Sağ üstten sol alta
    if (slotGrid[0][2].emoji === slotGrid[1][1].emoji && slotGrid[1][1].emoji === slotGrid[2][0].emoji) {
      winningLines.push({
        type: 'çapraz',
        direction: 'sağ-sol',
        symbol: slotGrid[0][2]
      });
    }
    
    // Slot makinesini görsel olarak göster
    const slotVisual = slotGrid.map(row => row.map(s => s.emoji).join(' | ')).join('\n─────────────\n');
    
    // Kazanç hesapla
    let multiplier = 0;
    let winningSymbols = [];
    
    winningLines.forEach(line => {
      multiplier += line.symbol.multiplier;
      winningSymbols.push(line.symbol.emoji);
    });
    
    // Ortadaki satır kontrolü (ana hat)
    const middleRow = slotGrid[1];
    const isMiddleRowWinning = middleRow[0].emoji === middleRow[1].emoji && middleRow[1].emoji === middleRow[2].emoji;
    
    if (isMiddleRowWinning) {
      multiplier *= 1.5; // Orta satır kazancı daha değerli
    }
    
    // Özel jackpot kontrolü - Tüm gökkuşağı sembolleri
    const allRainbows = slotGrid.flat().every(s => s.emoji === '🌈');
    if (allRainbows) {
      multiplier = 100; // Büyük jackpot!
    }
    
    // Kazanç miktarı hesapla
    const winAmount = Math.floor(betAmount * multiplier);
    const netProfit = winAmount - betAmount;
    
    // Parayı güncelle
    if (winAmount > 0) {
      // Kazandı
      economyManager.updateUserBalance(message.author.id, netProfit, 'cash');
      userProfile.stats.gamblingWins++;
    } else {
      // Kaybetti
      economyManager.updateUserBalance(message.author.id, -betAmount, 'cash');
      userProfile.stats.gamblingLosses++;
    }
    
    // Kullanıcı istatistiklerini güncelle
    const users = economyManager.db.get('users');
    economyManager.db.set('users', users);
    
    // XP kazancı/kaybı
    const xpChange = winAmount > 0 
      ? Math.floor(Math.random() * 10) + 5  // Kazandığında 5-15 XP
      : Math.floor(Math.random() * 3) + 1; // Kaybettiğinde 1-3 XP
    
    economyManager.addXp(message.author.id, xpChange);
    
    // Sonuç embed'i
    let resultEmbed;
    
    if (winAmount > 0) {
      resultEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle(allRainbows ? '🌟 BÜYÜK JACKPOT! 🌟' : '🎰 Kazandın!')
        .setDescription(
          `**${slotVisual}**\n\n` +
          `${winningLines.length} hat eşleşti! ${winningSymbols.join(', ')} = x${multiplier.toFixed(1)} çarpan\n` +
          `**${betAmount}** ${config.currencyName} bahise karşılık **${winAmount}** ${config.currencyName} kazandın!`
        )
        .addFields(
          { name: '💰 Bahis', value: `${betAmount} ${config.currencyName}`, inline: true },
          { name: '💵 Kazanç', value: `${winAmount} ${config.currencyName}`, inline: true },
          { name: '💹 Net Kar', value: `+${netProfit} ${config.currencyName}`, inline: true },
          { name: '🔮 XP', value: `+${xpChange} XP`, inline: true },
          { name: '🏦 Yeni Bakiye', value: `${economyManager.getUserBalance(message.author.id).cash} ${config.currencyName}`, inline: true }
        )
        .setFooter({ text: `${message.author.tag} • Kazanma Oranı: %${Math.floor((userProfile.stats.gamblingWins / (userProfile.stats.gamblingWins + userProfile.stats.gamblingLosses)) * 100) || 0}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
    } else {
      resultEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🎰 Kaybettin!')
        .setDescription(
          `**${slotVisual}**\n\n` +
          `Eşleşen hat yok!\n` +
          `**${betAmount}** ${config.currencyName} bahis kaybettin.`
        )
        .addFields(
          { name: '💰 Bahis', value: `${betAmount} ${config.currencyName}`, inline: true },
          { name: '💸 Kayıp', value: `-${betAmount} ${config.currencyName}`, inline: true },
          { name: '🔮 XP', value: `+${xpChange} XP`, inline: true },
          { name: '🏦 Kalan Bakiye', value: `${economyManager.getUserBalance(message.author.id).cash} ${config.currencyName}`, inline: true }
        )
        .setFooter({ text: `${message.author.tag} • Kazanma Oranı: %${Math.floor((userProfile.stats.gamblingWins / (userProfile.stats.gamblingWins + userProfile.stats.gamblingLosses)) * 100) || 0}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
    }
    
    // Bahisler hakkında ipuçları
    if (userProfile.balance < minBet) {
      resultEmbed.addFields({ 
        name: '⚠️ Dikkat', 
        value: `Bakiyen minimum bahis miktarının altına düştü! Daha fazla ${config.currencyName} kazanmak için \`çalış\` veya \`günlük\` komutlarını kullanabilirsin.` 
      });
    }
    
    // Sonuç mesajını gönder
    return slotMsg.edit({ embeds: [resultEmbed] });
  },
}; 