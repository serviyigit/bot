import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import EconomyManager from '../../../utils/economyManager.js';

export default {
  name: 'sıralama',
  description: 'En zengin oyuncuları, en yüksek seviyedekileri veya en çok evcil hayvana sahip olanları göster',
  usage: '[bakiye/seviye/evcil/kazanım/bahis]',
  aliases: ['leaderboard', 'top', 'lb', 'ranks', 'liderlik', 'en-iyi'],
  cooldown: 10,
  category: 'ekonomi',
  
  async execute(message, args, client) {
    const economyManager = new EconomyManager();
    const config = economyManager.getConfig();
    const users = economyManager.db.get('users');
    
    if (!users || Object.keys(users).length === 0) {
      return message.reply('Henüz hiçbir kullanıcı veri tabanında yok!');
    }
    
    const validTypes = ['bakiye', 'seviye', 'evcil', 'kazanım', 'bahis'];
    let type = (args[0] || 'bakiye').toLowerCase();
    
    // Argüman kontrolü
    if (!validTypes.includes(type) && args[0]) {
      return message.reply(`Geçersiz sıralama türü! Kullanılabilir türler: ${validTypes.join(', ')}`);
    }
    
    // Kullanıcı listesini oluştur ve ID'lerini sakla
    const userArray = Object.entries(users).map(([id, data]) => {
      return {
        id: id,
        ...data
      };
    });
    
    // Türe göre sıralama
    let sortedUsers = [];
    let title = '';
    let fieldName = '';
    let fieldValue = '';
    let emoji = '';
    
    switch (type) {
      case 'bakiye':
        sortedUsers = userArray.sort((a, b) => b.balance - a.balance);
        title = '💰 En Zengin Kullanıcılar';
        fieldName = 'Bakiye';
        fieldValue = user => `${user.balance.toLocaleString()} ${config.currencyName}`;
        emoji = '🏆';
        break;
        
      case 'seviye':
        sortedUsers = userArray.sort((a, b) => b.level - a.level || b.xp - a.xp);
        title = '🌟 En Yüksek Seviyeli Kullanıcılar';
        fieldName = 'Seviye';
        fieldValue = user => `Seviye ${user.level} (${user.xp} XP)`;
        emoji = '⭐';
        break;
        
      case 'evcil':
        sortedUsers = userArray.sort((a, b) => {
          const aPets = a.pets ? Object.keys(a.pets).length : 0;
          const bPets = b.pets ? Object.keys(b.pets).length : 0;
          return bPets - aPets;
        });
        title = '🐾 En Çok Evcil Hayvana Sahip Kullanıcılar';
        fieldName = 'Evcil Hayvanlar';
        fieldValue = user => {
          const petCount = user.pets ? Object.keys(user.pets).length : 0;
          return `${petCount} evcil hayvan`;
        };
        emoji = '🦊';
        break;
        
      case 'kazanım':
        sortedUsers = userArray.sort((a, b) => {
          const aTotal = a.stats && a.stats.totalEarned ? a.stats.totalEarned : 0;
          const bTotal = b.stats && b.stats.totalEarned ? b.stats.totalEarned : 0;
          return bTotal - aTotal;
        });
        title = '💸 En Çok Kazanç Elde Eden Kullanıcılar';
        fieldName = 'Toplam Kazanç';
        fieldValue = user => {
          const totalEarned = user.stats && user.stats.totalEarned ? user.stats.totalEarned : 0;
          return `${totalEarned.toLocaleString()} ${config.currencyName}`;
        };
        emoji = '💹';
        break;
        
      case 'bahis':
        sortedUsers = userArray.sort((a, b) => {
          const aWins = a.stats && a.stats.gamblingWins ? a.stats.gamblingWins : 0;
          const aTotal = aWins + (a.stats && a.stats.gamblingLosses ? a.stats.gamblingLosses : 0);
          const aRate = aTotal > 0 ? (aWins / aTotal) * 100 : 0;
          
          const bWins = b.stats && b.stats.gamblingWins ? b.stats.gamblingWins : 0;
          const bTotal = bWins + (b.stats && b.stats.gamblingLosses ? b.stats.gamblingLosses : 0);
          const bRate = bTotal > 0 ? (bWins / bTotal) * 100 : 0;
          
          return bRate - aRate;
        }).filter(user => {
          const wins = user.stats && user.stats.gamblingWins ? user.stats.gamblingWins : 0;
          const total = wins + (user.stats && user.stats.gamblingLosses ? user.stats.gamblingLosses : 0);
          return total >= 10; // En az 10 oyun oynamış kullanıcıları göster
        });
        title = '🎲 En Şanslı Kumar Oyuncuları';
        fieldName = 'Kazanma Oranı';
        fieldValue = user => {
          const wins = user.stats && user.stats.gamblingWins ? user.stats.gamblingWins : 0;
          const losses = user.stats && user.stats.gamblingLosses ? user.stats.gamblingLosses : 0;
          const total = wins + losses;
          const rate = total > 0 ? (wins / total) * 100 : 0;
          return `%${rate.toFixed(1)} (${wins}/${total} oyun)`;
        };
        emoji = '🎯';
        break;
    }
    
    // Sıralamayı 10 kişiyle sınırla
    const topUsers = sortedUsers.slice(0, 10);
    
    // Kullanıcı bilgilerini oluştur
    const getUserInfo = async (user, index) => {
      try {
        const discordUser = await client.users.fetch(user.id);
        return `${emoji} **${index}.** ${discordUser.username} • ${fieldValue(user)}`;
      } catch (error) {
        return `${emoji} **${index}.** Bilinmeyen Kullanıcı (ID: ${user.id.slice(0, 4)}...) • ${fieldValue(user)}`;
      }
    };
    
    // Tüm kullanıcı bilgilerini al
    const userInfoPromises = topUsers.map((user, index) => getUserInfo(user, index + 1));
    const userInfos = await Promise.all(userInfoPromises);
    
    // Embed oluştur
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(title)
      .setDescription(userInfos.join('\n\n'))
      .setFooter({ text: `${message.author.tag} tarafından istendi`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();
    
    // Kullanıcının kendi sıralamasını bul
    const currentUser = sortedUsers.findIndex(user => user.id === message.author.id);
    
    if (currentUser !== -1) {
      embed.addFields({
        name: '📊 Senin Sıralamanın:',
        value: `**${currentUser + 1}.** ${message.author.username} • ${fieldValue(sortedUsers[currentUser])} (Toplam ${sortedUsers.length} kullanıcı arasında)`
      });
    }
    
    // Kategori seçim butonları
    const balanceButton = new ButtonBuilder()
      .setCustomId('balance')
      .setLabel('Bakiye')
      .setEmoji('💰')
      .setStyle(type === 'bakiye' ? ButtonStyle.Primary : ButtonStyle.Secondary);
    
    const levelButton = new ButtonBuilder()
      .setCustomId('level')
      .setLabel('Seviye')
      .setEmoji('🌟')
      .setStyle(type === 'seviye' ? ButtonStyle.Primary : ButtonStyle.Secondary);
    
    const petButton = new ButtonBuilder()
      .setCustomId('pet')
      .setLabel('Evcil Hayvanlar')
      .setEmoji('🐾')
      .setStyle(type === 'evcil' ? ButtonStyle.Primary : ButtonStyle.Secondary);
    
    const earningButton = new ButtonBuilder()
      .setCustomId('earning')
      .setLabel('Kazanç')
      .setEmoji('💸')
      .setStyle(type === 'kazanım' ? ButtonStyle.Primary : ButtonStyle.Secondary);
    
    const gamblingButton = new ButtonBuilder()
      .setCustomId('gambling')
      .setLabel('Kumar Şansı')
      .setEmoji('🎲')
      .setStyle(type === 'bahis' ? ButtonStyle.Primary : ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder()
      .addComponents(balanceButton, levelButton, petButton, earningButton, gamblingButton);
    
    // Mesajı gönder
    const response = await message.reply({ embeds: [embed], components: [row] });
    
    // Buton etkileşimi için collector
    const collector = response.createMessageComponentCollector({ 
      time: 60000 // 1 dakika boyunca aktif
    });
    
    collector.on('collect', async interaction => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ 
          content: 'Bu butonları sadece komutu kullanan kişi kullanabilir!', 
          ephemeral: true 
        });
      }
      
      // Button ID'sine göre yeni türü belirle
      let newType;
      switch (interaction.customId) {
        case 'balance': newType = 'bakiye'; break;
        case 'level': newType = 'seviye'; break;
        case 'pet': newType = 'evcil'; break;
        case 'earning': newType = 'kazanım'; break;
        case 'gambling': newType = 'bahis'; break;
      }
      
      // Komutu yeni tür ile çalıştır
      await interaction.deferUpdate();
      
      // Komutu yeni türle tekrar çalıştır
      this.execute(message, [newType], client, response);
    });
    
    collector.on('end', () => {
      // Süre dolduğunda butonları devre dışı bırak
      const disabledRow = new ActionRowBuilder()
        .addComponents(
          balanceButton.setDisabled(true),
          levelButton.setDisabled(true),
          petButton.setDisabled(true),
          earningButton.setDisabled(true),
          gamblingButton.setDisabled(true)
        );
      
      response.edit({ components: [disabledRow] }).catch(console.error);
    });
    
    return response;
  },
}; 