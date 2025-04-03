import { EmbedBuilder } from 'discord.js';
import LevelManager from '../../../utils/levelManager.js';

export default {
  name: 'rank',
  description: 'Sizin veya belirtilen kullanıcının seviye bilgilerini gösterir',
  usage: '[@kullanıcı]',
  aliases: ['level', 'seviye', 'xp', 'rankcard'],
  cooldown: 5,
  guildOnly: true,
  category: 'seviye',
  
  async execute(message, args, client) {
    const levelManager = new LevelManager();
    const config = levelManager.getGuildConfig(message.guild.id);
    
    if (!config.enabled) {
      return message.reply('❌ Bu sunucuda seviye sistemi aktif değil!');
    }
    
    // Hedef kullanıcıyı belirle
    let targetUser = message.mentions.users.first() || message.author;
    
    // ID belirtildiyse
    if (!message.mentions.users.size && args.length) {
      const userId = args[0];
      try {
        const fetchedUser = await client.users.fetch(userId);
        targetUser = fetchedUser;
      } catch (err) {
        // Kullanıcı bulunamadı, varsayılan olarak mesaj yazarını kullan
      }
    }
    
    try {
      // Kullanıcı verilerini al
      const userData = levelManager.getUserData(targetUser.id, message.guild.id);
      const rank = levelManager.getRank(targetUser.id, message.guild.id);
      const nextLevelXp = levelManager.calculateXpForNextLevel(userData.level);
      
      // Seviye kartı olarak embed oluştur
      const rankEmbed = await levelManager.createRankCardEmbed(targetUser.id, message.guild.id, client);
      
      // Ek detayları göstermek için yeni bir embed oluştur
      const detailsEmbed = new EmbedBuilder()
        .setColor(rankEmbed.data.color)
        .addFields(
          { name: 'Mesaj Sayısı', value: `${userData.messages || 0}`, inline: true },
          { name: 'Ses Süresi', value: formatTime(userData.voiceTime || 0), inline: true }
        );
      
      // Mesajı gönder
      await message.reply({ embeds: [rankEmbed, detailsEmbed] });
      
    } catch (error) {
      console.error('Error creating rank card:', error);
      message.reply('❌ Seviye bilgileri oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  },
};

function formatTime(seconds) {
  if (seconds < 60) return `${seconds} saniye`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dakika`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    if (remainingMinutes === 0) return `${hours} saat`;
    return `${hours} saat ${remainingMinutes} dakika`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (remainingHours === 0) return `${days} gün`;
  return `${days} gün ${remainingHours} saat`;
} 