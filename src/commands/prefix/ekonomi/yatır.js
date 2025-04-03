import { EmbedBuilder } from 'discord.js';
import EconomyManager from '../../../utils/economyManager.js';

export default {
  name: 'yatır',
  description: 'Paranı bankaya yatırır',
  usage: '<miktar/tümü>',
  aliases: ['deposit', 'dep', 'yatir'],
  cooldown: 5,
  category: 'ekonomi',
  args: true,
  
  async execute(message, args, client) {
    const economyManager = new EconomyManager();
    const config = economyManager.getConfig();
    
    const userProfile = economyManager.getUserProfile(message.author.id);
    
    // Miktar parametresi
    let amount = args[0].toLowerCase();
    
    // Tüm parayı yatırma durumu
    if (amount === 'tümü' || amount === 'hepsi' || amount === 'all' || amount === 'tum' || amount === 'hep') {
      amount = userProfile.balance;
    } else {
      // Sayıya çevir
      amount = parseInt(amount);
      
      // Geçerli bir sayı değilse
      if (isNaN(amount) || amount <= 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Yatırma Hatası')
          .setDescription('Lütfen geçerli bir miktar belirtin! Örnek: `yatır 100` veya `yatır tümü`')
          .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        
        return message.reply({ embeds: [errorEmbed] });
      }
    }
    
    // Parayı yatır
    const depositResult = economyManager.depositMoney(message.author.id, amount);
    
    if (!depositResult.success) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Yatırma Hatası')
        .setDescription(depositResult.message)
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [errorEmbed] });
    }
    
    // Başarılı sonuç
    // Kullanıcının güncel profilini al
    const updatedProfile = economyManager.getUserProfile(message.author.id);
    
    // Para emojisi
    const currencyEmoji = config.currencyEmoji || '💰';
    
    // Sonuç embedini oluştur
    const successEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🏦 Para Yatırma İşlemi Başarılı')
      .setDescription(
        `**${amount}** ${currencyEmoji} başarıyla bankaya yatırıldı!\n\n` +
        `💰 Cüzdan: **${depositResult.balance}** ${currencyEmoji}\n` +
        `🏦 Banka: **${depositResult.bank}** ${currencyEmoji}\n` +
        `💵 Toplam: **${depositResult.balance + depositResult.bank}** ${currencyEmoji}`
      )
      .setThumbnail('https://media.giphy.com/media/VTjMuV5o8r4eA/giphy.gif')
      .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();
    
    // İpucu: Bankadaki para güvende
    if (depositResult.bank > depositResult.balance * 2) {
      successEmbed.addFields({ 
        name: '💡 İpucu', 
        value: `Bankadaki paranı kimse çalamaz! Paranın çoğunu bankada tutman güvenli olur.` 
      });
    }
    
    return message.reply({ embeds: [successEmbed] });
  },
}; 