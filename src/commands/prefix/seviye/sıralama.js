import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } from 'discord.js';
import LevelManager from '../../../utils/levelManager.js';

export default {
  name: 'sıralama',
  description: 'Sunucunun seviye liderlik tablosunu gösterir',
  usage: '[sayfa]',
  aliases: ['leaderboard', 'top', 'top10', 'levels', 'siralama', 'liderlik'],
  cooldown: 5,
  guildOnly: true,
  category: 'seviye',
  
  async execute(message, args, client) {
    const levelManager = new LevelManager();
    const config = levelManager.getGuildConfig(message.guild.id);
    
    if (!config.enabled) {
      return message.reply('❌ Bu sunucuda seviye sistemi aktif değil!');
    }
    
    // Sayfa numarasını belirle
    let page = 1;
    if (args.length && !isNaN(args[0])) {
      page = parseInt(args[0]);
      if (page < 1) page = 1;
    }
    
    // Liderlik tablosunu göster
    const leaderboard = await showLeaderboard(message, page, levelManager, client);
    
    if (!leaderboard) {
      return message.reply('❌ Hiç kullanıcı bulunamadı veya sıralama oluşturulurken bir hata oluştu.');
    }
  },
};

async function showLeaderboard(message, page, levelManager, client) {
  try {
    const { users, totalPages, currentPage, totalUsers } = levelManager.getLeaderboard(message.guild.id, page, 10);
    
    if (users.length === 0) {
      return message.reply('❌ Henüz hiç kullanıcı XP kazanmamış!');
    }
    
    if (page > totalPages) {
      return message.reply(`❌ Geçersiz sayfa! Toplam ${totalPages} sayfa var.`);
    }
    
    // Liderlik tablosu girdilerini oluştur
    const leaderboardEntries = await Promise.all(users.map(async (userData, index) => {
      // Discord kullanıcısını al
      let username = 'Bilinmeyen Kullanıcı';
      let userAvatar = null;
      
      try {
        const user = await client.users.fetch(userData.id);
        username = user.username;
        userAvatar = user.displayAvatarURL({ size: 16 });
      } catch (error) {
        // Kullanıcı bulunamadı, varsayılan değeri kullan
      }
      
      // Kullanıcının sırasına göre emoji ekle
      let rankEmoji = '🏅';
      if (userData.rank === 1) rankEmoji = '🥇';
      else if (userData.rank === 2) rankEmoji = '🥈';
      else if (userData.rank === 3) rankEmoji = '🥉';
      
      // Mesaj yazarı kendisini tanısın
      const isAuthor = userData.id === message.author.id ? '**' : '';
      
      // XP için ilerleme çubuğu
      const nextLevelXp = levelManager.calculateXpForNextLevel(userData.level);
      const progressBar = levelManager.getProgressBar(userData.xp, nextLevelXp, 10);
      
      return `${rankEmoji} ${isAuthor}${userData.rank}. ${username}${isAuthor} - Seviye **${userData.level}** [${progressBar}] (${userData.totalXp} XP)`;
    }));
    
    // Kullanıcının kendi sıralamasını bul
    const userRank = levelManager.getRank(message.author.id, message.guild.id);
    const userData = levelManager.getUserData(message.author.id, message.guild.id);
    
    // Embed oluştur
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🏆 Seviye Liderlik Tablosu')
      .setDescription(leaderboardEntries.join('\n'))
      .setFooter({ 
        text: `Sayfa ${currentPage}/${totalPages} • Toplam ${totalUsers} Kullanıcı • Senin sıralamanı: #${userRank} (Seviye ${userData.level})`, 
        iconURL: message.author.displayAvatarURL() 
      })
      .setTimestamp();
    
    // Sayfalama butonları ekle
    const backButton = new ButtonBuilder()
      .setCustomId('prev_page')
      .setLabel('◀️ Önceki')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage <= 1);
    
    const nextButton = new ButtonBuilder()
      .setCustomId('next_page')
      .setLabel('Sonraki ▶️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage >= totalPages);
    
    const row = new ActionRowBuilder().addComponents(backButton, nextButton);
    
    // Mesajı gönder
    const reply = await message.reply({ embeds: [embed], components: [row] });
    
    // Buton kollektörü oluştur
    const collector = reply.createMessageComponentCollector({ 
      componentType: ComponentType.Button,
      time: 60000, // 1 dakika
      filter: (i) => i.user.id === message.author.id
    });
    
    // Buton olaylarını dinle
    collector.on('collect', async (interaction) => {
      let newPage = currentPage;
      
      if (interaction.customId === 'prev_page') {
        newPage--;
      } else if (interaction.customId === 'next_page') {
        newPage++;
      }
      
      if (newPage !== currentPage) {
        const newLeaderboard = levelManager.getLeaderboard(message.guild.id, newPage, 10);
        
        // Yeni liderlik tablosu girdilerini oluştur
        const newEntries = await Promise.all(newLeaderboard.users.map(async (userData, index) => {
          let username = 'Bilinmeyen Kullanıcı';
          
          try {
            const user = await client.users.fetch(userData.id);
            username = user.username;
          } catch (error) {
            // Kullanıcı bulunamadı, varsayılan değeri kullan
          }
          
          let rankEmoji = '🏅';
          if (userData.rank === 1) rankEmoji = '🥇';
          else if (userData.rank === 2) rankEmoji = '🥈';
          else if (userData.rank === 3) rankEmoji = '🥉';
          
          const isAuthor = userData.id === message.author.id ? '**' : '';
          
          const nextLevelXp = levelManager.calculateXpForNextLevel(userData.level);
          const progressBar = levelManager.getProgressBar(userData.xp, nextLevelXp, 10);
          
          return `${rankEmoji} ${isAuthor}${userData.rank}. ${username}${isAuthor} - Seviye **${userData.level}** [${progressBar}] (${userData.totalXp} XP)`;
        }));
        
        // Güncelleme butonlarını yenile
        const updatedBackButton = ButtonBuilder.from(backButton)
          .setDisabled(newPage <= 1);
        
        const updatedNextButton = ButtonBuilder.from(nextButton)
          .setDisabled(newPage >= newLeaderboard.totalPages);
        
        const updatedRow = new ActionRowBuilder().addComponents(updatedBackButton, updatedNextButton);
        
        // Yeni embed oluştur
        const updatedEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('🏆 Seviye Liderlik Tablosu')
          .setDescription(newEntries.join('\n'))
          .setFooter({ 
            text: `Sayfa ${newPage}/${newLeaderboard.totalPages} • Toplam ${newLeaderboard.totalUsers} Kullanıcı • Senin sıralamanı: #${userRank} (Seviye ${userData.level})`, 
            iconURL: message.author.displayAvatarURL() 
          })
          .setTimestamp();
        
        // Mesajı güncelle
        await interaction.update({ embeds: [updatedEmbed], components: [updatedRow] });
      } else {
        // Sayfa değişmedi, sadece onaylama bildirimi gönder
        await interaction.deferUpdate();
      }
    });
    
    // Kolektör süresi dolduğunda veya durdurulduğunda
    collector.on('end', () => {
      // Butonları devre dışı bırak
      const disabledBackButton = ButtonBuilder.from(backButton).setDisabled(true);
      const disabledNextButton = ButtonBuilder.from(nextButton).setDisabled(true);
      const disabledRow = new ActionRowBuilder().addComponents(disabledBackButton, disabledNextButton);
      
      // Mesajı güncelle
      reply.edit({ components: [disabledRow] }).catch(console.error);
    });
    
    return true;
  } catch (error) {
    console.error('Error showing leaderboard:', error);
    return false;
  }
} 