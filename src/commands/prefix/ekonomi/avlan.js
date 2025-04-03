import { EmbedBuilder } from 'discord.js';
import EconomyManager from '../../../utils/economyManager.js';

export default {
  name: 'avlan',
  description: 'OwO! Avlanarak rastgele hayvanlar ve ödüller bulabilirsin',
  usage: '',
  aliases: ['hunt', 'av', 'h'],
  cooldown: 10,
  category: 'ekonomi',
  
  async execute(message, args, client) {
    const economyManager = new EconomyManager();
    const config = economyManager.getConfig();
    const userProfile = economyManager.getUserProfile(message.author.id);
    
    const now = Date.now();
    const huntCooldown = 3 * 60 * 1000;
    const cooldownLeft = (userProfile.cooldowns.hunt + huntCooldown) - now;
    
    if (cooldownLeft > 0) {
      const seconds = Math.ceil(cooldownLeft / 1000);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF9999')
        .setTitle('OwO! Çok yorgunsun!')
        .setDescription(`Enerjini toplamak için **${seconds} saniye** daha dinlenmelisin!`)
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [errorEmbed] });
    }
    
    const users = economyManager.db.get('users');
    userProfile.cooldowns.hunt = now;
    userProfile.stats.huntCount++;
    
    economyManager.db.set('users', users);
    
    const huntMessages = [
      'Ormanda sessizce avlanmaya başladın...',
      'Vahşi hayvanlar için pusudasın...',
      'Ormanın derinliklerine doğru ilerliyorsun...',
      'Avlanmak için mükemmel bir gün!',
      'Bir av hayvanı görmek için çalıların arasına saklandın...'
    ];
    
    const startMessage = huntMessages[Math.floor(Math.random() * huntMessages.length)];
    
    const huntingEmbed = new EmbedBuilder()
      .setColor('#7CFC00')
      .setTitle('🏹 Avlanıyorsun!')
      .setDescription(startMessage)
      .setFooter({ text: 'Bir şeyler bulmanın heyecanını hissediyorsun...', iconURL: message.author.displayAvatarURL() });
    
    const huntMsg = await message.reply({ embeds: [huntingEmbed] });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const foundPet = Math.random() <= 0.15;
    
    if (foundPet) {
      const petResult = economyManager.rollPet(message.author.id);
      
      if (petResult.success) {
        const xpGain = Math.floor(Math.random() * 8) + 3;
        economyManager.addXp(message.author.id, xpGain);
        
        const successEmbed = new EmbedBuilder()
          .setColor('#FFA500')
          .setTitle('🎉 OwO! Bir hayvan buldun!')
          .setDescription(`${petResult.pet.emoji} **${petResult.pet.name}** sana katılmak istiyor!\n\n${petResult.message}`)
          .addFields(
            { name: '📊 Seviye', value: `${petResult.pet.level}`, inline: true },
            { name: '📈 Nadir', value: `${petResult.pet.type}`, inline: true },
            { name: '🔮 XP Kazandın', value: `+${xpGain} XP`, inline: true }
          )
          .setFooter({ text: `Toplam evcil hayvan: ${economyManager.getUserPets(message.author.id).length} • Avlanma sayısı: ${userProfile.stats.huntCount}`, iconURL: message.author.displayAvatarURL() });
        
        return huntMsg.edit({ embeds: [successEmbed] });
      }
    }
    
    const earnedMoney = Math.random() <= 0.7;
    
    if (earnedMoney) {
      const moneyAmount = Math.floor(Math.random() * 50) + 10;
      economyManager.updateUserBalance(message.author.id, moneyAmount, 'cash');
      
      const xpGain = Math.floor(Math.random() * 5) + 1;
      economyManager.addXp(message.author.id, xpGain);
      
      const successMessages = [
        `Avın başarılı oldu ve ${moneyAmount} ${config.currencyEmoji} buldun!`,
        `Bir av hayvanı yakaladın ve sattığında ${moneyAmount} ${config.currencyEmoji} kazandın!`,
        `Ormanda dolaşırken ${moneyAmount} ${config.currencyEmoji} değerinde bir hazine buldun!`,
        `Başarılı bir av sonucunda ${moneyAmount} ${config.currencyEmoji} elde ettin!`,
        `UwU! Şanslısın, değerli bir av yakaladın ve ${moneyAmount} ${config.currencyEmoji} kazandın!`
      ];
      
      const successMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
      
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🎯 Başarılı Avlanma!')
        .setDescription(successMessage)
        .addFields(
          { name: '💰 Kazanç', value: `${moneyAmount} ${config.currencyEmoji}`, inline: true },
          { name: '🔮 XP', value: `+${xpGain} XP`, inline: true },
          { name: '💵 Yeni Bakiye', value: `${economyManager.getUserBalance(message.author.id).cash} ${config.currencyEmoji}`, inline: true }
        )
        .setFooter({ text: `Avlanma sayısı: ${userProfile.stats.huntCount}`, iconURL: message.author.displayAvatarURL() });
      
      return huntMsg.edit({ embeds: [successEmbed] });
    }
    
    const xpGain = Math.floor(Math.random() * 3) + 1;
    economyManager.addXp(message.author.id, xpGain);
    
    const failMessages = [
      'Hiçbir şey bulamadın... Belki bir dahaki sefere daha şanslı olursun!',
      'Çok gürültü yaptın ve tüm hayvanlar kaçtı!',
      'Bugün şansın pek yaver gitmiyor, hiçbir av bulamadın.',
      'Bir şeyler gördüğünü sandın ama sadece rüzgarda sallanan yapraklarmış.',
      'OwO... Av başarısız oldu, ama denemeye devam et!'
    ];
    
    const failMessage = failMessages[Math.floor(Math.random() * failMessages.length)];
    
    const failEmbed = new EmbedBuilder()
      .setColor('#808080')
      .setTitle('🏹 Başarısız Avlanma')
      .setDescription(failMessage)
      .addFields({ name: '🔮 XP', value: `Yine de +${xpGain} XP kazandın!`, inline: true })
      .setFooter({ text: `Avlanma sayısı: ${userProfile.stats.huntCount} • Şansını tekrar dene!`, iconURL: message.author.displayAvatarURL() });
    
    return huntMsg.edit({ embeds: [failEmbed] });
  },
}; 