import { EmbedBuilder } from 'discord.js';
import EconomyManager from '../../../utils/economyManager.js';

export default {
  name: 'çalış',
  description: 'Çalışarak para kazanmayı sağlar',
  usage: '',
  aliases: ['work', 'calis', 'çaliş', 'iş', 'is'],
  cooldown: 10,
  category: 'ekonomi',
  
  async execute(message, args, client) {
    const economyManager = new EconomyManager();
    const config = economyManager.getConfig();
    
    // Çalışma komutunu çalıştır
    const workResult = economyManager.workCommand(message.author.id);
    
    if (!workResult.success) {
      // Kalan süreyi hesapla
      const remainingTime = workResult.cooldown;
      
      // Saat, dakika, saniye formatına çevir
      const hours = Math.floor(remainingTime / 3600000);
      const minutes = Math.floor((remainingTime % 3600000) / 60000);
      const seconds = Math.floor((remainingTime % 60000) / 1000);
      
      const timeString = `${hours} saat, ${minutes} dakika, ${seconds} saniye`;
      
      // Hata embedini oluştur
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Çalışma Hatası')
        .setDescription(`${workResult.message}\nKalan süre: **${timeString}**`)
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [errorEmbed] });
    }
    
    // Başarılı sonuç
    // Kullanıcının güncel profilini al
    const userProfile = economyManager.getUserProfile(message.author.id);
    
    // İş gifleri
    const workGifs = [
      'https://media.giphy.com/media/LHZyixOnHwDDy/giphy.gif', // Para sayma
      'https://media.giphy.com/media/l3V0B6ICVWbg8Xi5q/giphy.gif', // Klavye
      'https://media.giphy.com/media/xT5LMuQroxQi36Hwys/giphy.gif', // Bilgisayarda çalışma
      'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif', // Kedi klavye
      'https://media.giphy.com/media/XIqCQx02E1U9W/giphy.gif', // Para
      'https://media.giphy.com/media/3o7TKMfn35NL1llPig/giphy.gif', // Market kasası
      'https://media.giphy.com/media/o0vwzuFwCGAFO/giphy.gif' // Süpürme
    ];
    
    // Rastgele bir gif seç
    const randomGif = workGifs[Math.floor(Math.random() * workGifs.length)];
    
    // Gelecek çalışma zamanı
    const nextWorkDate = new Date(workResult.nextWork);
    
    // Sonuç embedini oluştur
    const successEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('💼 Çalışma Tamamlandı!')
      .setDescription(
        `${workResult.message}\n\n` +
        `💰 Güncel bakiyen: **${userProfile.balance}** ${config.currencyEmoji}\n` +
        `🏆 Seviye: **${userProfile.level}** (XP: ${userProfile.experience})`
      )
      .setImage(randomGif)
      .addFields({ 
        name: '⏰ Sonraki Çalışma', 
        value: `<t:${Math.floor(nextWorkDate.getTime() / 1000)}:R>` 
      })
      .setFooter({ text: `${message.author.tag} • Toplam Çalışma: ${userProfile.stats.workCount}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();
    
    // Ekstra XP ver
    const xpGain = Math.floor(Math.random() * 5) + 5; // 5-10 arası XP
    const xpResult = economyManager.addXp(message.author.id, xpGain);
    
    // Seviye atladıysa bilgi ver
    if (xpResult.levelUp) {
      successEmbed.addFields({ 
        name: '🎉 Seviye Atladın!', 
        value: `**${xpResult.oldLevel} → ${xpResult.newLevel}** seviyesine ulaştın!\n` +
               `Seviye ödülü: **${xpResult.levelUpBonus}** ${config.currencyEmoji}` 
      });
    }
    
    return message.reply({ embeds: [successEmbed] });
  },
}; 