import { Events, Collection } from 'discord.js';
import TicketManager from '../utils/ticketManager.js';
import MessageLogger from '../utils/messageLogger.js';
import LevelManager from '../utils/levelManager.js';

// Komut cooldown'larını tutmak için
const cooldowns = new Collection();

// İşlenmiş mesajları takip etmek için bir Set (global)
const processedMessages = new Set();

// İşlenmiş mesajları belirli bir süre sonra temizleyen fonksiyon
function cleanupProcessedMessages() {
  const TIME_TO_KEEP = 10 * 60 * 1000; // 10 dakika
  setInterval(() => {
    // Çok uzun süre takip etmemek için temizle
    processedMessages.clear();
    console.log('[MESSAGE] İşlenmiş mesaj hafızası temizlendi');
  }, TIME_TO_KEEP);
}

// İlk çalıştırmada temizleme zamanlayıcısını başlat
cleanupProcessedMessages();

export default {
  name: Events.MessageCreate,
  once: false, // Discord.js bu event'i otomatik olarak yönetiyor, değiştirmeyin
  async execute(message, client) {
    // Bot mesajlarını veya DM mesajlarını yoksay
    if (message.author.bot || !message.guild) return;
    
    // Her benzersiz mesajın yalnızca bir kez işlenmesini sağla
    const messageId = `${message.guild.id}-${message.channel.id}-${message.id}`;
    if (processedMessages.has(messageId)) {
      console.log(`[MESSAGE] Bu mesaj zaten işlendi: ${messageId}`);
      return;
    }
    
    // Mesajı işlenmiş olarak işaretle
    processedMessages.add(messageId);
    
    // Ticket kanallarındaki mesajları logla
    if (message.channel.name.startsWith('ticket-')) {
      const ticketManager = new TicketManager();
      const messageLogger = new MessageLogger();
      
      // Bu kanal bir ticket kanalı mı kontrol et
      const ticket = ticketManager.getTicketByChannelId(message.channel.id);
      if (!ticket) return;
      
      // Mesajı logla
      await messageLogger.logMessage({
        ticketId: ticket.ticketId,
        userId: message.author.id,
        username: message.author.tag,
        content: message.content,
        timestamp: message.createdAt,
        attachments: message.attachments.map(a => a.url)
      });
    }

    // Seviye sistemi için XP ekleme
    const levelManager = new LevelManager();
    levelManager.addXp(message).catch(error => {
      console.error('Error adding XP:', error);
    });
    
    // Prefix kontrolü
    let prefix = process.env.PREFIX;

    // Eğer çevresel değişkenden prefix ayarlanmamışsa, mention prefix kontrol et veya varsayılan kullan
    if (!prefix) {
      const prefixMention = new RegExp(`^<@!?${client.user.id}> `);
      const mentionMatch = message.content.match(prefixMention);
      prefix = mentionMatch ? mentionMatch[0] : '!';
    }

    // Prefix ile başlamıyorsa mesajı işleme
    if (!message.content.startsWith(prefix)) return;
    
    // Komut argümanlarını ayırma
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();
    
    message.prefix = prefix;
    
    // Komutu bulma
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    
    if (!command) return;
    
    // DM kullanımı kontrolü
    if (command.guildOnly && !message.guild) {
      return message.reply('Bu Komut Sadece Sunucuda Kullanabilirsin!');
    }
    
    // Argüman kontrolü
    if (command.args && !args.length) {
      let reply = `Eksik argüman! ${message.author}`;
      
      if (command.usage) {
        reply += `\nDoğru kullanım: \`${prefix}${command.name} ${command.usage}\``;
      }
      
      return message.reply(reply);
    }
    
    // Cooldown kontrolü
    if (!cooldowns.has(command.name)) {
      cooldowns.set(command.name, new Collection());
    }
    
    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;
    
    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
      
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return message.reply(`Lütfen \`${command.name}\` komutunu tekrar kullanmak için ${timeLeft.toFixed(1)} saniye bekleyin.`);
      }
    }
    
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    
    // Komutu çalıştırma
    try {
      await command.execute(message, args, client);
    } catch (error) {
      console.error(`[ERROR] Komut çalıştırma hatası (${command.name}):`, error);
      message.reply('Komutu çalıştırırken bir hata oluştu!').catch(() => {});
    }
  },
}; 