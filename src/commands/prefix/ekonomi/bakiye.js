import { EmbedBuilder } from 'discord.js';
import EconomyManager from '../../../utils/economyManager.js';

export default {
  name: 'bakiye',
  description: 'OwO! Senin Cowoncy bakiyeni gösterir',
  usage: '[@kullanıcı]',
  aliases: ['para', 'cüzdan', 'bal', 'balance', 'money', 'owo', 'cowoncy'],
  cooldown: 5,
  category: 'ekonomi',
  
  async execute(message, args, client) {
    const economyManager = new EconomyManager();
    const config = economyManager.getConfig();
    
    let targetUser = message.author;
    
    if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first();
    }
    else if (args[0]) {
      try {
        targetUser = await client.users.fetch(args[0]);
      } catch (error) {
        targetUser = message.author;
      }
    }
    
    const balanceInfo = economyManager.getUserBalance(targetUser.id);
    
    const userProfile = economyManager.getUserProfile(targetUser.id);
    
    const dogEmojis = ["🐶", "🐕", "🦮", "🐩", "🐕‍🦺"];
    const randomDog = dogEmojis[Math.floor(Math.random() * dogEmojis.length)];
    
    const balanceEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`${randomDog} ${targetUser.username}'in Cowoncy'si!`)
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        { 
          name: `${config.currencyEmoji} Cüzdan`, 
          value: `${balanceInfo.cash.toLocaleString()} ${config.currencyName}`, 
          inline: true 
        },
        { 
          name: '🏦 Banka', 
          value: `${balanceInfo.bank.toLocaleString()} ${config.currencyName}`, 
          inline: true 
        },
        { 
          name: '💵 Toplam', 
          value: `${balanceInfo.total.toLocaleString()} ${config.currencyName}`, 
          inline: true 
        }
      )
      .setFooter({ text: `OwO! 🏆 Seviye: ${userProfile.level} | 📊 XP: ${userProfile.experience}` })
      .setTimestamp();
    
    if (targetUser.id === message.author.id) {
      const pets = economyManager.getUserPets(targetUser.id);
      const petCount = pets.length;
      
      balanceEmbed.addFields(
        { 
          name: `${randomDog} OwO İpuçları`, 
          value: 
          `• \`günlük\` yazarak günlük ödülünü alabilirsin UwU\n` +
          `• \`çalış\` yazarak Cowoncy kazanabilirsin OwO\n` +
          `• Banka için \`yatır/çek <miktar>\` kullanabilirsin\n` +
          `• \`avlan\` veya \`balık-tut\` yazarak hayvanlar bulabilirsin!\n` + 
          `• Şu anda **${petCount}** evcil hayvanın var! \`evcilim\` yazarak onları görebilirsin`
        }
      );
    }
    
    return message.reply({ embeds: [balanceEmbed] });
  },
}; 