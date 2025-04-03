import { EmbedBuilder } from 'discord.js';
import EconomyManager from '../../../utils/economyManager.js';

export default {
  name: 'gönder',
  description: 'Başka bir kullanıcıya para gönderir',
  usage: '<@kullanıcı/ID> <miktar>',
  aliases: ['transfer', 'havale', 'pay', 'ödeme', 'gonder', 'ver'],
  cooldown: 5,
  category: 'ekonomi',
  args: true,
  
  async execute(message, args, client) {
    const economyManager = new EconomyManager();
    const config = economyManager.getConfig();
    
    // Gönderilecek kullanıcıyı ve miktarı al
    let targetUser;
    let amount;
    
    // Eğer bir kullanıcı etiketlenmişse
    if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first();
      amount = args[1];
    } 
    // Eğer ID belirtilmişse
    else {
      try {
        targetUser = await client.users.fetch(args[0]);
        amount = args[1];
      } catch (error) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Havale Hatası')
          .setDescription('Geçerli bir kullanıcı belirtmelisiniz! Örnek: `gönder @kullanıcı 100` veya `gönder ID 100`')
          .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        
        return message.reply({ embeds: [errorEmbed] });
      }
    }
    
    // Bot kontrolü
    if (targetUser.bot) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Havale Hatası')
        .setDescription('Botlara para gönderemezsiniz!')
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [errorEmbed] });
    }
    
    // Kendine gönderme kontrolü
    if (targetUser.id === message.author.id) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Havale Hatası')
        .setDescription('Kendinize para gönderemezsiniz!')
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [errorEmbed] });
    }
    
    // Miktar kontrolü
    if (!amount) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Havale Hatası')
        .setDescription('Bir miktar belirtmelisiniz! Örnek: `gönder @kullanıcı 100`')
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [errorEmbed] });
    }
    
    const userProfile = economyManager.getUserProfile(message.author.id);
    
    // Tüm parayı gönderme durumu
    if (amount.toLowerCase() === 'tümü' || amount.toLowerCase() === 'hepsi' || amount.toLowerCase() === 'all') {
      amount = userProfile.balance;
    } else {
      // Sayıya çevir
      amount = parseInt(amount);
      
      // Geçerli bir sayı değilse
      if (isNaN(amount) || amount <= 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Havale Hatası')
          .setDescription('Lütfen geçerli bir miktar belirtin! Örnek: `gönder @kullanıcı 100`')
          .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        
        return message.reply({ embeds: [errorEmbed] });
      }
    }
    
    // Minimum gönderme miktarı (botla ekonomi spamını engellemek için)
    const minTransferAmount = 10;
    if (amount < minTransferAmount) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Havale Hatası')
        .setDescription(`En az ${minTransferAmount} ${config.currencyEmoji} gönderebilirsiniz!`)
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [errorEmbed] });
    }
    
    // Para transferi yap
    const transferResult = economyManager.transferMoney(message.author.id, targetUser.id, amount);
    
    if (!transferResult.success) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Havale Hatası')
        .setDescription(transferResult.message)
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [errorEmbed] });
    }
    
    // Başarılı sonuç
    // Kullanıcıların güncel profillerini al
    const senderProfile = economyManager.getUserProfile(message.author.id);
    const receiverProfile = economyManager.getUserProfile(targetUser.id);
    
    // Para emojisi
    const currencyEmoji = config.currencyEmoji || '💰';
    
    // Sonuç embedini oluştur
    const successEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('💸 Para Transferi Başarılı')
      .setDescription(
        `${message.author} ➡️ ${targetUser}\n` +
        `**${amount}** ${currencyEmoji} gönderildi!`
      )
      .addFields(
        { 
          name: `${message.author.username} - Güncel Bakiye`, 
          value: `💰 Cüzdan: **${senderProfile.balance}** ${currencyEmoji}`, 
          inline: true 
        },
        { 
          name: `${targetUser.username} - Güncel Bakiye`, 
          value: `💰 Cüzdan: **${receiverProfile.balance}** ${currencyEmoji}`, 
          inline: true 
        }
      )
      .setThumbnail('https://media.giphy.com/media/l41YaEfCkjCyHl1Oo/giphy.gif')
      .setFooter({ text: `${message.author.tag} • ID: ${message.author.id}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();
    
    return message.reply({ embeds: [successEmbed] });
  },
}; 