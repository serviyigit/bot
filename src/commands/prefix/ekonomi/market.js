import { EmbedBuilder } from 'discord.js';
import EconomyManager from '../../../utils/economyManager.js';

export default {
  name: 'market',
  description: 'Eşya alım-satım yapabileceğin market sistemini gösterir',
  usage: '[sat/al/bilgi] [item_id] [miktar]',
  aliases: ['shop', 'mağaza', 'dükkan', 'magaza', 'dukkan'],
  cooldown: 5,
  category: 'ekonomi',
  
  async execute(message, args, client) {
    const economyManager = new EconomyManager();
    const config = economyManager.getConfig();
    
    const userProfile = economyManager.getUserProfile(message.author.id);
    const allItems = economyManager.getAllItems();
    const itemCategories = economyManager.getItemCategories();
    
    // Alt komut kontrolü
    const subCommand = args[0] ? args[0].toLowerCase() : null;
    
    // 1. Alt komut: market (liste)
    if (!subCommand || subCommand === 'liste' || subCommand === 'list') {
      // Kategori bazlı market
      const marketEmbed = new EmbedBuilder()
        .setColor('#9370DB')
        .setTitle('🛒 Sunucu Marketi')
        .setDescription(
          `Merhaba ${message.author}, markete hoş geldin!\n` +
          `Güncel bakiyen: **${userProfile.balance}** ${config.currencyEmoji}\n\n` +
          `Bir eşya satın almak için: \`market al <item_id> [miktar]\`\n` +
          `Eşya hakkında bilgi almak için: \`market bilgi <item_id>\`\n` +
          `Eşya satmak için: \`market sat <item_id> [miktar]\`\n`
        )
        .setThumbnail('https://media.giphy.com/media/xTiTnwi8Azjnva46Fq/giphy.gif')
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      // Her kategori için ayrı bir alan ekle
      const categorizedItems = {};
      
      // Itemleri kategorilere ayır
      for (const [itemId, item] of Object.entries(allItems)) {
        if (!categorizedItems[item.category]) {
          categorizedItems[item.category] = [];
        }
        
        categorizedItems[item.category].push(item);
      }
      
      // Her kategori için ayrı bir alan oluştur
      for (const [categoryId, items] of Object.entries(categorizedItems)) {
        const categoryName = itemCategories[categoryId];
        
        let categoryItems = '';
        
        // Kategori öğelerini listele (en fazla 10 tane göster, sığdırmak için)
        const displayItems = items.slice(0, 10);
        
        for (const item of displayItems) {
          categoryItems += `${item.emoji} **${item.name}** - ${item.price} ${config.currencyEmoji} | ID: \`${item.id}\`\n`;
        }
        
        // Daha fazla item varsa not düş
        if (items.length > 10) {
          categoryItems += `*...ve ${items.length - 10} adet daha eşya*\n`;
        }
        
        marketEmbed.addFields({ name: `${categoryName}`, value: categoryItems });
      }
      
      return message.reply({ embeds: [marketEmbed] });
    }
    // 2. Alt komut: market bilgi <item_id>
    else if (subCommand === 'bilgi' || subCommand === 'info') {
      const itemId = args[1];
      
      if (!itemId) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Market Hatası')
          .setDescription('Bir eşya ID\'si belirtmelisiniz! Örnek: `market bilgi fishing_rod`')
          .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        
        return message.reply({ embeds: [errorEmbed] });
      }
      
      // Eşya bilgisini al
      const item = allItems[itemId];
      
      if (!item) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Market Hatası')
          .setDescription(`\`${itemId}\` ID'li bir eşya bulunamadı!`)
          .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        
        return message.reply({ embeds: [errorEmbed] });
      }
      
      // Nadir bulunan ürün renkleri
      const rarityColors = {
        common: '#AAAAAA', // Gri
        uncommon: '#55FF55', // Yeşil
        rare: '#5555FF', // Mavi
        epic: '#AA00AA', // Mor
        legendary: '#FFAA00', // Turuncu
        mythic: '#FF55FF', // Pembe
        special: '#FF5555' // Kırmızı
      };
      
      const itemColor = rarityColors[item.rarity] || '#FFFFFF';
      
      // Kullanıcının bu eşyaya sahip olup olmadığını kontrol et
      const userInventory = economyManager.getUserInventory(message.author.id);
      const userHasItem = userInventory[itemId] ? userInventory[itemId].quantity : 0;
      
      // Eşya bilgi embedini oluştur
      const itemEmbed = new EmbedBuilder()
        .setColor(itemColor)
        .setTitle(`${item.emoji} ${item.name}`)
        .setDescription(item.description)
        .addFields(
          { name: '💰 Fiyat', value: `${item.price} ${config.currencyEmoji}`, inline: true },
          { name: '💸 Satış Fiyatı', value: `${item.sellPrice} ${config.currencyEmoji}`, inline: true },
          { name: '📦 Kategori', value: itemCategories[item.category], inline: true },
          { name: '🎯 ID', value: `\`${item.id}\``, inline: true },
          { name: '⭐ Nadirlik', value: `${item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}`, inline: true },
          { name: '📦 Envanterinde', value: `${userHasItem} adet`, inline: true }
        )
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      // Eğer efekt varsa detaylarını ekle
      if (item.effect) {
        let effectDescription = '';
        
        switch (item.effect.type) {
          case 'xpBoost':
            effectDescription = `XP kazancını %${(item.effect.value - 1) * 100} artırır.`;
            if (item.effect.duration) {
              effectDescription += ` (${item.effect.duration / 3600000} saat süreli)`;
            }
            break;
            
          case 'fishingBoost':
            effectDescription = `Balık tutma şansını %${(item.effect.value - 1) * 100} artırır.`;
            if (item.effect.duration) {
              effectDescription += ` (${item.effect.duration / 3600000} saat süreli)`;
            }
            break;
            
          case 'luckBoost':
            effectDescription = `Şansını %${(item.effect.value - 1) * 100} artırır.`;
            break;
            
          default:
            effectDescription = 'Bilinmeyen bir etki.';
            break;
        }
        
        itemEmbed.addFields({ name: '✨ Efekt', value: effectDescription });
      }
      
      // Kullanıma yönelik bilgiler
      const usageInfo = [];
      
      if (item.tradeable) {
        usageInfo.push('🔄 Takas edilebilir');
      } else {
        usageInfo.push('❌ Takas edilemez');
      }
      
      if (item.usable) {
        usageInfo.push('✅ Kullanılabilir');
      } else {
        usageInfo.push('❌ Kullanılamaz');
      }
      
      itemEmbed.addFields({ name: '📝 Kullanım', value: usageInfo.join(' | ') });
      
      return message.reply({ embeds: [itemEmbed] });
    }
    // 3. Alt komut: market al <item_id> [miktar]
    else if (subCommand === 'al' || subCommand === 'buy' || subCommand === 'satınal' || subCommand === 'satinal') {
      const itemId = args[1];
      const quantity = args[2] ? parseInt(args[2]) : 1;
      
      if (!itemId) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Market Hatası')
          .setDescription('Bir eşya ID\'si belirtmelisiniz! Örnek: `market al fishing_rod 1`')
          .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        
        return message.reply({ embeds: [errorEmbed] });
      }
      
      // Eşya var mı kontrol et
      const item = allItems[itemId];
      
      if (!item) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Market Hatası')
          .setDescription(`\`${itemId}\` ID'li bir eşya bulunamadı!`)
          .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        
        return message.reply({ embeds: [errorEmbed] });
      }
      
      // Miktar kontrolü
      if (isNaN(quantity) || quantity < 1) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Market Hatası')
          .setDescription('Geçerli bir miktar belirtmelisiniz! Örnek: `market al fishing_rod 1`')
          .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        
        return message.reply({ embeds: [errorEmbed] });
      }
      
      // Satın al
      const buyResult = economyManager.buyItem(message.author.id, itemId, quantity);
      
      if (!buyResult.success) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Satın Alma Hatası')
          .setDescription(buyResult.message)
          .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        
        return message.reply({ embeds: [errorEmbed] });
      }
      
      // Başarılı sonuç
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Satın Alma Başarılı')
        .setDescription(
          `${item.emoji} **${quantity}x ${item.name}** satın aldın!\n` +
          `Toplam ödenen: **${buyResult.cost}** ${config.currencyEmoji}\n\n` +
          `💰 Kalan bakiyen: **${buyResult.newBalance}** ${config.currencyEmoji}`
        )
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      // Satın alınan eşya hakkında ipucu
      if (item.usable) {
        successEmbed.addFields({ 
          name: '💡 İpucu', 
          value: `Bu eşyayı \`kullan ${item.id}\` komutu ile kullanabilirsin!` 
        });
      }
      
      return message.reply({ embeds: [successEmbed] });
    }
    // 4. Alt komut: market sat <item_id> [miktar]
    else if (subCommand === 'sat' || subCommand === 'sell') {
      const itemId = args[1];
      const quantity = args[2] ? parseInt(args[2]) : 1;
      
      if (!itemId) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Market Hatası')
          .setDescription('Bir eşya ID\'si belirtmelisiniz! Örnek: `market sat fishing_rod 1`')
          .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        
        return message.reply({ embeds: [errorEmbed] });
      }
      
      // Miktar kontrolü
      if (isNaN(quantity) || quantity < 1) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Market Hatası')
          .setDescription('Geçerli bir miktar belirtmelisiniz! Örnek: `market sat fishing_rod 1`')
          .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        
        return message.reply({ embeds: [errorEmbed] });
      }
      
      // Sat
      const sellResult = economyManager.sellItem(message.author.id, itemId, quantity);
      
      if (!sellResult.success) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Satış Hatası')
          .setDescription(sellResult.message)
          .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        
        return message.reply({ embeds: [errorEmbed] });
      }
      
      // Başarılı sonuç
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Satış Başarılı')
        .setDescription(
          `${sellResult.item.emoji} **${quantity}x ${sellResult.item.name}** sattın!\n` +
          `Kazanılan para: **${sellResult.earnings}** ${config.currencyEmoji}\n\n` +
          `💰 Güncel bakiyen: **${sellResult.newBalance}** ${config.currencyEmoji}`
        )
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [successEmbed] });
    }
    else {
      // Geçersiz alt komut
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Market Hatası')
        .setDescription(
          'Geçersiz alt komut! Kullanabileceğin alt komutlar:\n' +
          '`market` - Market listesini gösterir\n' +
          '`market bilgi <item_id>` - Eşya hakkında bilgi verir\n' +
          '`market al <item_id> [miktar]` - Eşya satın alır\n' +
          '`market sat <item_id> [miktar]` - Eşya satar'
        )
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [errorEmbed] });
    }
  },
}; 