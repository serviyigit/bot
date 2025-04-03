import { EmbedBuilder } from 'discord.js';
import EconomyManager from '../../../utils/economyManager.js';

export default {
  name: 'çek',
  description: 'Bankadan para çeker',
  usage: '<miktar/tümü>',
  aliases: ['withdraw', 'with', 'cek', 'çekme'],
  cooldown: 5,
  category: 'ekonomi',
  args: true,
  
  async execute(message, args, client) {
    const economyManager = new EconomyManager();
    const config = economyManager.getConfig();
    
    const userProfile = economyManager.getUserProfile(message.author.id);
    
    // Miktar parametresi
    let amount = args[0].toLowerCase();
    
    // Tüm parayı çekme durumu
    if (amount === 'tümü' || amount === 'hepsi' || amount === 'all' || amount === 'tum' || amount === 'hep') {
      amount = userProfile.bank;
    } else {
      // Sayıya çevir
      amount = parseInt(amount);
      
      // Geçerli bir sayı değilse
      if (isNaN(amount) || amount <= 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Para Çekme Hatası')
          .setDescription('Lütfen geçerli bir miktar belirtin! Örnek: `çek 100` veya `çek tümü`')
          .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        
        return message.reply({ embeds: [errorEmbed] });
      }
    }
    
    // Parayı çek
    const withdrawResult = economyManager.withdrawMoney(message.author.id, amount);
    
    if (!withdrawResult.success) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Para Çekme Hatası')
        .setDescription(withdrawResult.message)
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [errorEmbed] });
    }
    
    // Başarılı sonuç
    // Para emojisi
    const currencyEmoji = config.currencyEmoji || '💰';
    
    // Sonuç embedini oluştur
    const successEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('💰 Para Çekme İşlemi Başarılı')
      .setDescription(
        `**${amount}** ${currencyEmoji} başarıyla bankadan çekildi!\n\n` +
        `💰 Cüzdan: **${withdrawResult.balance}** ${currencyEmoji}\n` +
        `🏦 Banka: **${withdrawResult.bank}** ${currencyEmoji}\n` +
        `💵 Toplam: **${withdrawResult.balance + withdrawResult.bank}** ${currencyEmoji}`
      )
      .setThumbnail('https://media.giphy.com/media/LdOyjZ7io5Msw/giphy.gif')
      .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();
    
    // İpucu: Hırsızlık uyarısı
    if (withdrawResult.balance > 5000) {
      successEmbed.addFields({ 
        name: '⚠️ Dikkat', 
        value: `Cebinde çok fazla para var. Diğer oyuncular senden para çalabilir! Fazla parayı bankada tutmanı öneririz.` 
      });
    }
    
    return message.reply({ embeds: [successEmbed] });
  },
}; 