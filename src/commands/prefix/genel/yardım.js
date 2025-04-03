import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType } from 'discord.js';
import fs from 'fs';
import path from 'path';

// Aktif komut işlemlerini izlemek için - hem mesaj bazlı hem de global kilitleme
const processedMessages = new Map();
const activeCommandLocks = new Map();

// Kategoriler ve komutlar için önbellek
const categoryCache = new Map();
const commandCache = new Map();

// Debug modu
const DEBUG = true;

// Önbelleği temizle
function clearCaches() {
  categoryCache.clear();
  commandCache.clear();
  console.log('[YARDIM] Önbellekler temizlendi');
}

// DEBUG loglama
function debugLog(...args) {
  if (DEBUG) {
    console.log('[YARDIM DEBUG]', ...args);
  }
}

export default {
  name: 'yardım',
  description: 'Komutlar ve kategoriler hakkında bilgi verir',
  usage: '[komut]',
  aliases: ['help', 'komutlar', 'commands'],
  cooldown: 5,
  category: 'genel',
  
  async execute(message, args, client) {
    // Sunucu bazlı kilit oluştur
    const guildLock = `Sunucu : ${message.guild?.id || 'dm'}`;
    
    // Global kilidi kontrol et - aynı sunucuda aynı anda sadece bir yardım komutu çalışabilir
    if (activeCommandLocks.has(guildLock)) {
      debugLog(`Komut zaten çalışıyor: ${guildLock}`);
      return;
    }
    
    // Mesaj bazlı kilidi kontrol et
    const messageKey = `${message.guild?.id || 'dm'}-${message.channel.id}-${message.id}`;
    if (processedMessages.has(messageKey)) {
      debugLog(`Mesaj zaten işlenmiş: ${messageKey}`);
      return;
    }
    
    try {
      // Kilitleri ayarla
      processedMessages.set(messageKey, Date.now());
      activeCommandLocks.set(guildLock, Date.now());
      
      debugLog(`Komut başlatıldı: ${guildLock}, Mesaj: ${messageKey}`);
    
      const prefix = process.env.PREFIX || '!';
      
      // Admin için önbellek temizleme
      if (args.length && args[0].toLowerCase() === 'temizle' && message.member?.permissions.has('Administrator')) {
        clearCaches();
        await message.reply('✅ Yardım komutu önbellekleri temizlendi!');
        return;
      }
      
      // Belirli bir komutun yardımını göster
      if (args.length) {
        await showCommandHelp(message, args[0], prefix);
        return;
      }
      
      // Kategorileri bul
      const categories = await findCategories();
      
      // Ana yardım mesajını hazırla
      const helpEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🔍 Komut Yardımı')
        .setDescription(`Aşağıdaki kategorilerden birini seçerek komutları görüntüleyebilirsiniz.\n\nKomut kullanımı: \`${prefix}komut <argümanlar>\`\n\n**Mevcut Kategoriler:**\n${
          categories.map(cat => `${getCategoryEmoji(cat)} **${formatCategoryName(cat)}**`).join('\n')
        }`)
        .setThumbnail(client.user.displayAvatarURL())
        .setFooter({ text: `${message.guild?.name || 'Özel Mesaj'} | ${categories.length} kategori bulunuyor`, iconURL: message.guild?.iconURL() })
        .setTimestamp();
      
      // Dropdown menü seçeneklerini oluştur
      const options = categories.map(category => {
        return new StringSelectMenuOptionBuilder()
          .setLabel(formatCategoryName(category))
          .setDescription(`${formatCategoryName(category)} kategorisindeki komutları göster`)
          .setValue(category)
          .setEmoji(getCategoryEmoji(category));
      });
      
      // Dropdown menüyü oluştur
      const select = new StringSelectMenuBuilder()
        .setCustomId('help-category')
        .setPlaceholder('Bir kategori seç')
        .addOptions(options);
      
      const row = new ActionRowBuilder().addComponents(select);
      
      // Mesajı gönder
      const reply = await message.reply({
        embeds: [helpEmbed],
        components: [row]
      });
      
      debugLog(`Yardım mesajı gönderildi: ${reply.id}`);
      
      // Menü etkileşimlerini dinle
      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 120000 // 2 dakika
      });
      
      collector.on('collect', async (interaction) => {
        // Sadece komutu çalıştıran kişi kullanabilir
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({
            content: 'Bu menü sizin için değil!',
            ephemeral: true
          });
        }
        
        try {
          const selectedCategory = interaction.values[0];
          const commands = await findCommandsByCategory(selectedCategory);
          
          if (!commands || commands.length === 0) {
            return interaction.update({
              content: `❌ **${formatCategoryName(selectedCategory)}** kategorisinde komut bulunamadı.`,
              embeds: [helpEmbed],
              components: [row]
            });
          }
          
          // Kategori embed'i oluştur
          const categoryEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`${getCategoryEmoji(selectedCategory)} ${formatCategoryName(selectedCategory)} Komutları`)
            .setDescription(`${formatCategoryDescription(selectedCategory)}\n\nAşağıda bu kategorideki komutların listesi bulunmaktadır:`)
            .setFooter({ text: `${message.guild?.name || 'Özel Mesaj'} | Toplam ${commands.length} komut | Detaylı bilgi: ${prefix}yardım <komut adı>`, iconURL: message.guild?.iconURL() })
            .setTimestamp();
          
          // Maksimum 25 alan göster (Discord sınırı)
          const fieldsPerPage = 25;
          const displayCommands = commands.slice(0, fieldsPerPage);
          
          // Embed alanlarını ekle
          for (const cmd of displayCommands) {
            categoryEmbed.addFields({
              name: `${prefix}${cmd.name}${cmd.usage ? ` ${cmd.usage}` : ''}`,
              value: `${cmd.description}${cmd.aliases && cmd.aliases.length ? `\nDiğer Kullanımlar: ${cmd.aliases.map(a => `\`${prefix}${a}\``).join(', ')}` : ''}`
            });
          }
          
          // Tüm komutlar gösterilemiyorsa bilgi ver
          if (commands.length > fieldsPerPage) {
            categoryEmbed.setDescription(`${formatCategoryDescription(selectedCategory)}\n\nAşağıda bu kategorideki komutların ilk ${fieldsPerPage}/${commands.length} tanesi gösteriliyor:`);
          }
          
          // Yanıtı güncelle
          await interaction.update({ embeds: [categoryEmbed], components: [row] });
        } catch (error) {
          console.error('[YARDIM] Kategori gösterme hatası:', error);
          await interaction.update({
            content: '❌ Bir hata oluştu, lütfen daha sonra tekrar deneyin.',
            components: [row]
          });
        }
      });
      
      // Collector süresi dolduğunda butonları devre dışı bırak
      collector.on('end', () => {
        try {
          const disabledRow = new ActionRowBuilder().addComponents(
            StringSelectMenuBuilder.from(select).setDisabled(true)
          );
          
          reply.edit({ components: [disabledRow] }).catch(e => {
            debugLog('Menü devre dışı bırakılırken hata:', e.message);
          });
        } catch (error) {
          console.error('[YARDIM] Collector end hatası:', error);
        } finally {
          // Kilitleri temizle
          activeCommandLocks.delete(guildLock);
          debugLog(`Kilit kaldırıldı: ${guildLock}`);
        }
      });
    } catch (error) {
      console.error('[YARDIM] Ana komut hatası:', error);
      message.reply('❌ Komut çalıştırılırken bir hata oluştu.').catch(() => {});
      // Hata durumunda da kilitleri temizle
      activeCommandLocks.delete(guildLock);
      debugLog(`Hata nedeniyle kilit kaldırıldı: ${guildLock}`);
    }
  },
};

// Belirli bir komutun yardımını göster
async function showCommandHelp(message, commandName, prefix) {
  try {
    commandName = commandName.toLowerCase();
    debugLog(`Komut yardımı gösteriliyor: ${commandName}`);
    
    // Tüm kategorileri tara ve komutu bul
    const categories = await findCategories();
    let command = null;
    
    for (const category of categories) {
      const commands = await findCommandsByCategory(category);
      const found = commands.find(cmd => 
        cmd.name.toLowerCase() === commandName || 
        (cmd.aliases && cmd.aliases.some(alias => alias.toLowerCase() === commandName))
      );
      
      if (found) {
        command = found;
        break;
      }
    }
    
    if (!command) {
      return message.reply(`❌ \`${commandName}\` adında bir komut bulunamadı!`);
    }
    
    // Komut bilgi embed'i
    const commandEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`Komut: ${prefix}${command.name}`)
      .setDescription(command.description || 'Açıklama bulunmuyor')
      .addFields(
        { name: '📝 Kullanım', value: `\`${prefix}${command.name}${command.usage ? ` ${command.usage}` : ''}\``, inline: true },
        { name: '⏱️ Bekleme Süresi', value: command.cooldown ? `${command.cooldown} saniye` : 'Yok', inline: true },
        { name: '📂 Kategori', value: formatCategoryName(command.category), inline: true }
      )
      .setFooter({ text: message.guild?.name || 'Özel Mesaj', iconURL: message.guild?.iconURL() })
      .setTimestamp();
    
    if (command.aliases && command.aliases.length) {
      commandEmbed.addFields({ 
        name: '🔄 Alternatif Kullanımlar', 
        value: command.aliases.map(alias => `\`${prefix}${alias}\``).join(', ')
      });
    }
    
    return message.reply({ embeds: [commandEmbed] });
  } catch (error) {
    console.error('[YARDIM] Komut bilgisi gösterme hatası:', error);
    return message.reply('❌ Komut bilgileri gösterilirken bir hata oluştu.');
  }
}

// Kategorileri bul
async function findCategories() {
  // Önbellekte varsa kullan
  if (categoryCache.has('all')) {
    return categoryCache.get('all');
  }
  
  const commandsPath = path.join(process.cwd(), 'src', 'commands', 'prefix');
  const categories = [];
  
  if (!fs.existsSync(commandsPath)) {
    console.log('[YARDIM] Komut klasörü bulunamadı:', commandsPath);
    return categories;
  }
  
  try {
    const entries = fs.readdirSync(commandsPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const categoryPath = path.join(commandsPath, entry.name);
        
        try {
          const files = fs.readdirSync(categoryPath);
          const hasJsFiles = files.some(file => file.endsWith('.js'));
          
          if (hasJsFiles) {
            categories.push(entry.name);
          }
        } catch (error) {
          console.error(`[YARDIM] Kategori okunamadı: ${entry.name}`, error);
        }
      }
    }
    
    // Sıralama: Genel kategorisi ilk, diğerleri alfabetik
    categories.sort((a, b) => {
      if (a === 'genel') return -1;
      if (b === 'genel') return 1;
      return a.localeCompare(b);
    });
    
    // Önbelleğe al
    categoryCache.set('all', categories);
    
    return categories;
  } catch (error) {
    console.error('[YARDIM] Kategori listesi oluşturma hatası:', error);
    return [];
  }
}

// Kategoriye göre komutları bul
async function findCommandsByCategory(category) {
  // Önbellekte varsa kullan
  if (commandCache.has(category)) {
    return commandCache.get(category);
  }
  
  const commands = [];
  const commandsPath = path.join(process.cwd(), 'src', 'commands', 'prefix', category);
  
  if (!fs.existsSync(commandsPath)) {
    console.log(`[YARDIM] Kategori klasörü bulunamadı: ${category}`);
    return commands;
  }
  
  try {
    const files = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of files) {
      try {
        const filePath = path.join(commandsPath, file);
        
        if (!fs.existsSync(filePath)) {
          continue;
        }
        
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Komut objesi
        const command = {
          name: file.replace('.js', ''),
          description: 'Komut açıklaması bulunamadı',
          usage: '',
          aliases: [],
          cooldown: 3,
          category: category
        };
        
        // Metadata çıkar
        const nameMatch = fileContent.match(/name:\s*['"](.+?)['"]/);
        if (nameMatch) command.name = nameMatch[1];
        
        const descMatch = fileContent.match(/description:\s*['"](.+?)['"]/);
        if (descMatch) command.description = descMatch[1];
        
        const usageMatch = fileContent.match(/usage:\s*['"](.+?)['"]/);
        if (usageMatch) command.usage = usageMatch[1];
        
        const cooldownMatch = fileContent.match(/cooldown:\s*(\d+)/);
        if (cooldownMatch) command.cooldown = parseInt(cooldownMatch[1]);
        
        // Alias'ları çıkar
        const aliasesMatch = fileContent.match(/aliases:\s*\[(.*?)\]/s);
        if (aliasesMatch) {
          try {
            const aliasesStr = aliasesMatch[1];
            const stringPattern = /'([^']*)'|"([^"]*)"/g;
            const aliases = [];
            let match;
            
            while ((match = stringPattern.exec(aliasesStr)) !== null) {
              aliases.push(match[1] || match[2]);
            }
            
            command.aliases = aliases;
          } catch (error) {
            console.error(`[YARDIM] Alias çıkarma hatası: ${file}`, error);
          }
        }
        
        commands.push(command);
      } catch (error) {
        console.error(`[YARDIM] Komut yükleme hatası: ${file}`, error);
      }
    }
    
    // Alfabetik sırala
    commands.sort((a, b) => a.name.localeCompare(b.name));
    
    // Önbelleğe al
    commandCache.set(category, commands);
    
    return commands;
  } catch (error) {
    console.error(`[YARDIM] Kategori komutları yükleme hatası: ${category}`, error);
    return [];
  }
}

// Kategori adını formatla
function formatCategoryName(category) {
  // Türkçe karakter düzeltmeleri
  const turkishReplacements = {
    'ekonomi': 'Ekonomi',
    'eglence': 'Eğlence',
    'seviye': 'Seviye',
    'botlist': 'Bot Listesi',
    'odalar': 'Özel Odalar',
    'ticket': 'Destek Talepleri',
    'moderation': 'Moderasyon',
    'genel': 'Genel',
    'kayıt': "Kayitlar"
  };
  
  if (turkishReplacements[category]) {
    return turkishReplacements[category];
  }
  
  // Tire/alt çizgi -> boşluk
  const formatted = category.replace(/[-_]/g, ' ');
  
  // İlk harfleri büyüt
  return formatted.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Kategori açıklaması
function formatCategoryDescription(category) {
  const descriptions = {
    'ticket': 'Destek talebi oluşturma ve yönetme komutları',
    'ekonomi': 'Para kazanma, harcama ve oyun komutları',
    'moderation': 'Sunucu yönetimi ve moderasyon komutları',
    'seviye': 'Seviye sistemi ve XP yönetimi komutları',
    'eglence': 'Eğlence ve oyun komutları',
    'odalar': 'Özel ses odaları oluşturma ve yönetme komutları',
    'botlist': 'Bot listesi ve yönetim komutları',
    'genel': 'Genel kullanım komutları'
  };
  
  return descriptions[category] || `${formatCategoryName(category)} kategorisindeki komutlar`;
}

// Kategori emojisi
function getCategoryEmoji(category) {
  const emojiMap = {
    'ticket': '🎫',
    'ekonomi': '💰',
    'moderation': '🛡️',
    'seviye': '📊',
    'eglence': '🎮',
    'odalar': '🔊',
    'botlist': '🤖',
    'genel': '📌'
  };
  
  return emojiMap[category] || '📁';
}

// Periyodik önbellek temizleme - geliştirme sırasında yardımcı olur
if (DEBUG) {
  const CACHE_CLEAR_INTERVAL = 5 * 60 * 1000; // 5 dakika
  setInterval(() => {
    clearCaches();
  }, CACHE_CLEAR_INTERVAL);
  
  // Uzun süre açık kalan kilitleri temizle
  setInterval(() => {
    const now = Date.now();
    const MAX_LOCK_TIME = 5 * 60 * 1000; // 5 dakika
    
    for (const [key, time] of activeCommandLocks.entries()) {
      if (now - time > MAX_LOCK_TIME) {
        debugLog(`Takılı kilit temizlendi: ${key}, ${Math.floor((now - time) / 1000)}s`);
        activeCommandLocks.delete(key);
      }
    }
    
    for (const [key, time] of processedMessages.entries()) {
      if (now - time > MAX_LOCK_TIME) {
        processedMessages.delete(key);
      }
    }
  }, 60 * 1000); // Her 1 dakikada bir kontrol et
} 