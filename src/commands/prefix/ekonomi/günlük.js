import { EmbedBuilder } from 'discord.js';
import EconomyManager from '../../../utils/economyManager.js';

export default {
  name: 'günlük',
  description: 'Günlük ödülünü topla',
  usage: '',
  aliases: ['daily', 'gunluk', 'günlüködül'],
  cooldown: 5,
  category: 'ekonomi',
  
  async execute(message, args, client) {
    const economyManager = new EconomyManager();
    const config = economyManager.getConfig();
    
    // Günlük ödülü al
    const dailyResult = economyManager.claimDailyBonus(message.author.id);
    
    if (!dailyResult.success) {
      // Kalan süreyi hesapla
      const remainingTime = dailyResult.cooldown;
      
      // Saat, dakika, saniye formatına çevir
      const hours = Math.floor(remainingTime / 3600000);
      const minutes = Math.floor((remainingTime % 3600000) / 60000);
      const seconds = Math.floor((remainingTime % 60000) / 1000);
      
      const timeString = `${hours} saat, ${minutes} dakika, ${seconds} saniye`;
      
      // Hata embedini oluştur
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Günlük Ödül Alınamadı')
        .setDescription(`Henüz günlük ödülünü alamazsın!\nKalan süre: **${timeString}**`)
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [errorEmbed] });
    }
    
    // Başarılı sonuç
    // Kullanıcının güncel profilini al
    const userProfile = economyManager.getUserProfile(message.author.id);
    
    // Streak bilgisi
    const streakInfo = `${dailyResult.streak} gün`;
    
    // Bonus varsa
    let bonusInfo = '';
    if (dailyResult.bonus > 0) {
      bonusInfo = `\n**Streak Bonusu:** +${dailyResult.bonus} ${config.currencyEmoji}`;
    }
    
    // Gelecek ödül zamanı
    const nextResetDate = new Date(dailyResult.nextReset);
    
    // Sonuç embedini oluştur
    const successEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ Günlük Ödülün Alındı!')
      .setDescription(
        `**${dailyResult.amount}** ${config.currencyEmoji} ödülünü aldın!\n` +
        `**Günlük Serisi:** ${streakInfo}${bonusInfo}\n\n` +
        `💰 Güncel bakiyen: **${userProfile.balance}** ${config.currencyEmoji}\n` +
        `🏦 Bankadaki paran: **${userProfile.bank}** ${config.currencyEmoji}\n` +
        `🏆 Seviye: **${userProfile.level}** (XP: ${userProfile.experience})`
      )
      .setThumbnail(message.author.displayAvatarURL())
      .addFields({ 
        name: '⏰ Sonraki Ödül', 
        value: `<t:${Math.floor(nextResetDate.getTime() / 1000)}:R>` 
      })
      .setFooter({ text: '💡 İpucu: Her gün giriş yaparak seri oluşturabilirsin! Her 5 günde bir bonus kazanırsın.' })
      .setTimestamp();
    
    // Her 5 günlük streak'te bonus bilgisi göster
    if (userProfile.stats.dailyStreak % 5 === 0) {
      successEmbed.addFields({ 
        name: '🎉 Streak Bonusu!', 
        value: `Her 5 günlük seri için ekstra bonus kazanıyorsun!` 
      });
    }
    
    // Bir sonraki 5'in katına kaç gün kaldığını göster
    if (userProfile.stats.dailyStreak % 5 !== 0) {
      const nextMilestone = 5 - (userProfile.stats.dailyStreak % 5);
      successEmbed.addFields({ 
        name: '🎯 Sonraki Bonus', 
        value: `Bonus için ${nextMilestone} gün daha giriş yap!` 
      });
    }
    
    return message.reply({ embeds: [successEmbed] });
  },
}; 