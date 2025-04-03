import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } from 'discord.js';
import BotlistManager from '../../../utils/botlistManager.js';

export default {
  name: 'botlist',
  description: 'Onaylanmış botları listeler',
  usage: '[kategori]',
  aliases: ['bots', 'botlar', 'bot-liste'],
  cooldown: 5,
  guildOnly: true,
  category: 'botlist',
  
  async execute(message, args, client) {
    const botlistManager = new BotlistManager();
    const config = botlistManager.getConfig();
    
    if (!config.enabled) {
      return message.reply('Botlist sistemi şu anda aktif değil!');
    }
    
    const approvedBots = botlistManager.getApprovedBots();
    
    if (approvedBots.length === 0) {
      return message.reply('Sistemde henüz onaylanmış bot bulunmuyor!');
    }
    
    // Kategoriye göre filtreleme
    let filteredBots = approvedBots;
    let selectedCategory = args[0] || 'tümü';
    
    if (selectedCategory !== 'tümü' && config.categories.includes(selectedCategory)) {
      filteredBots = approvedBots.filter(bot => bot.category.toLowerCase() === selectedCategory.toLowerCase());
      
      if (filteredBots.length === 0) {
        return message.reply(`"${selectedCategory}" kategorisinde henüz onaylanmış bot bulunmuyor!`);
      }
    } else {
      selectedCategory = 'tümü';
    }
    
    // Botları sıralama (oy sayısına göre)
    filteredBots.sort((a, b) => b.votes.length - a.votes.length);
    
    // Sayfalama için ayarlar
    const botsPerPage = 5;
    const totalPages = Math.ceil(filteredBots.length / botsPerPage);
    let currentPage = 0;
    
    // Kategori butonları
    const categoryButtons = [];
    
    // Tümü butonu
    const allButton = new ButtonBuilder()
      .setCustomId('all')
      .setLabel('Tümü')
      .setStyle(selectedCategory === 'tümü' ? ButtonStyle.Primary : ButtonStyle.Secondary);
    
    categoryButtons.push(allButton);
    
    // Her kategori için bir buton
    for (const category of config.categories) {
      const button = new ButtonBuilder()
        .setCustomId(`category_${category}`)
        .setLabel(category)
        .setStyle(selectedCategory === category ? ButtonStyle.Primary : ButtonStyle.Secondary);
      
      categoryButtons.push(button);
      
      // Discord bir satırda maksimum 5 buton izin veriyor, bu nedenle 4 buton ekledikten sonra duruyoruz
      if (categoryButtons.length >= 5) break;
    }
    
    const categoryRow = new ActionRowBuilder().addComponents(...categoryButtons);
    
    // Sayfalama butonları
    const generatePageButtons = (currentPage) => {
      const buttons = [];
      
      // İlk sayfa butonu
      buttons.push(
        new ButtonBuilder()
          .setCustomId('first')
          .setLabel('⏪ İlk')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 0)
      );
      
      // Önceki sayfa butonu
      buttons.push(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('◀️ Önceki')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 0)
      );
      
      // Sayfa bilgisi butonu
      buttons.push(
        new ButtonBuilder()
          .setCustomId('page')
          .setLabel(`Sayfa ${currentPage + 1}/${totalPages}`)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true)
      );
      
      // Sonraki sayfa butonu
      buttons.push(
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('▶️ Sonraki')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === totalPages - 1)
      );
      
      // Son sayfa butonu
      buttons.push(
        new ButtonBuilder()
          .setCustomId('last')
          .setLabel('⏩ Son')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === totalPages - 1)
      );
      
      return new ActionRowBuilder().addComponents(...buttons);
    };
    
    // Sayfa embedini oluşturma fonksiyonu
    const generatePageEmbed = (page) => {
      const startIdx = page * botsPerPage;
      const endIdx = Math.min(startIdx + botsPerPage, filteredBots.length);
      const pageItems = filteredBots.slice(startIdx, endIdx);
      
      const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle(`${message.guild.name} Bot Listesi`)
        .setDescription(`**${selectedCategory === 'tümü' ? 'Tüm' : selectedCategory} Kategorisindeki Botlar**\n(Toplam ${filteredBots.length} bot)`)
        .setThumbnail(message.guild.iconURL())
        .setFooter({ text: `Sayfa ${page + 1}/${totalPages} • ${message.author.tag} tarafından istendi`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      // Her bot için alan ekleme
      for (const bot of pageItems) {
        // Bot ismini ve bilgilerini ekle
        let botOwner;
        try {
          botOwner = client.users.cache.get(bot.ownerId)?.tag || `<@${bot.ownerId}>`;
        } catch (error) {
          botOwner = `<@${bot.ownerId}>`;
        }
        
        embed.addFields({
          name: `${bot.name} ${bot.verified ? '✅' : ''}`,
          value: `**ID:** \`${bot.id}\`\n` +
                `**Sahibi:** ${botOwner}\n` +
                `**Önek:** \`${bot.prefix}\`\n` +
                `**Kategori:** ${bot.category}\n` +
                `**Oy:** 👍 ${bot.votes.length}\n` +
                `**Davet:** [Ekle](${bot.inviteUrl}) ${bot.website ? `• [Website](${bot.website})` : ''} ${bot.supportServer ? `• [Destek](${bot.supportServer})` : ''}`
        });
      }
      
      if (pageItems.length === 0) {
        embed.setDescription(`**${selectedCategory}** kategorisinde bot bulunamadı!`);
      }
      
      return embed;
    };
    
    // İlk sayfayı göster
    const pageEmbed = generatePageEmbed(currentPage);
    const pageButtons = generatePageButtons(currentPage);
    
    const reply = await message.reply({ 
      embeds: [pageEmbed], 
      components: [categoryRow, pageButtons] 
    });
    
    // Buton koleksiyonunu oluştur
    const collector = reply.createMessageComponentCollector({ 
      componentType: ComponentType.Button,
      time: 120000 // 2 dakika
    });
    
    collector.on('collect', async interaction => {
      // Sadece komutu kullanan kişi butonları kullanabilir
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ 
          content: 'Bu butonları sadece komutu kullanan kişi kullanabilir!', 
          ephemeral: true 
        });
      }
      
      await interaction.deferUpdate();
      
      // Buton işlemleri
      const customId = interaction.customId;
      
      // Kategori değişikliği
      if (customId === 'all' || customId.startsWith('category_')) {
        // Kategoriyi ayarla
        if (customId === 'all') {
          selectedCategory = 'tümü';
          filteredBots = approvedBots;
        } else {
          selectedCategory = customId.replace('category_', '');
          filteredBots = approvedBots.filter(bot => bot.category.toLowerCase() === selectedCategory.toLowerCase());
        }
        
        // Yeni sayfa bilgilerini hesapla
        currentPage = 0;
        const totalPages = Math.ceil(filteredBots.length / botsPerPage);
        
        // Kategori butonlarını güncelle
        for (const button of categoryRow.components) {
          if (button.data.custom_id === 'all') {
            button.data.style = selectedCategory === 'tümü' ? ButtonStyle.Primary : ButtonStyle.Secondary;
          } else if (button.data.custom_id.startsWith('category_')) {
            const category = button.data.custom_id.replace('category_', '');
            button.data.style = selectedCategory === category ? ButtonStyle.Primary : ButtonStyle.Secondary;
          }
        }
        
        // Embedler ve butonları güncelle
        const newEmbed = generatePageEmbed(currentPage);
        const newButtons = generatePageButtons(currentPage);
        
        await interaction.message.edit({ 
          embeds: [newEmbed], 
          components: [categoryRow, newButtons] 
        });
        
        return;
      }
      
      // Sayfalama işlemleri
      switch (customId) {
        case 'first':
          currentPage = 0;
          break;
        case 'prev':
          currentPage = Math.max(0, currentPage - 1);
          break;
        case 'next':
          currentPage = Math.min(totalPages - 1, currentPage + 1);
          break;
        case 'last':
          currentPage = totalPages - 1;
          break;
      }
      
      // Embedler ve butonları güncelle
      const newEmbed = generatePageEmbed(currentPage);
      const newButtons = generatePageButtons(currentPage);
      
      await interaction.message.edit({ 
        embeds: [newEmbed], 
        components: [categoryRow, newButtons] 
      });
    });
    
    collector.on('end', async () => {
      // Butonları devre dışı bırak
      for (const row of [categoryRow, pageButtons]) {
        for (const button of row.components) {
          button.setDisabled(true);
        }
      }
      
      await reply.edit({ 
        components: [categoryRow, pageButtons] 
      }).catch(() => {});
    });
  },
}; 