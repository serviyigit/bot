import { EmbedBuilder } from 'discord.js';

export default {
  name: 'saril',
  description: 'Bir kullanıcıya sanal olarak sarıl',
  usage: '<@kullanıcı/kullanıcı_id>',
  aliases: ['hug', 'sarıl'],
  cooldown: 5,
  category: 'eglence',
  
  async execute(message, args, client) {
    // Sarılma GIF URL'leri
    const hugGifs = [
      'https://media.giphy.com/media/lrr9rHuoJOE0w/giphy.gif',
      'https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif',
      'https://media.giphy.com/media/PHZ7v9tfQu0VG/giphy.gif',
      'https://media.giphy.com/media/3oEjI72YdcYarva98I/giphy.gif',
      'https://media.giphy.com/media/kvKFq3FMbquVy/giphy.gif',
      'https://media.giphy.com/media/IRUb7GTCaPU8E/giphy.gif',
      'https://media.giphy.com/media/VGACXbkf0AeGs/giphy.gif',
      'https://media.giphy.com/media/ZQN9jsRWp1M76/giphy.gif',
      'https://media.giphy.com/media/BXrwTdoho6hkQ/giphy.gif',
      'https://media.giphy.com/media/16bJmyPvRbCDu/giphy.gif'
    ];
    
    // Rastgele bir GIF seç
    const randomGif = hugGifs[Math.floor(Math.random() * hugGifs.length)];
    
    // Sarılma mesajları
    const hugMessages = [
      'sımsıkı sarıldı! 🤗',
      'büyük bir sevgiyle sarıldı! ❤️',
      'tatlı bir sarılma hediye etti! 🧸',
      'sıcacık bir sarılmayla moral verdi! ✨',
      'dostça sarıldı! 🌈',
      'sevgi dolu bir sarılma gönderdi! 💕',
      'sıkı sıkı sarılarak mutluluk aşıladı! 😊',
      'neşeli bir sarılma paylaştı! 🎉',
      'içten bir sarılmayla gününü güzelleştirdi! 🌞',
      'samimi bir sarılmayla yakınlaştı! 💫'
    ];
    
    // Rastgele bir mesaj seç
    const randomMessage = hugMessages[Math.floor(Math.random() * hugMessages.length)];
    
    // Hedef kullanıcı kontrolü
    if (!args[0]) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Hata')
        .setDescription('Sarılmak istediğin kullanıcıyı etiketlemen veya ID\'sini yazman gerekiyor!')
        .setFooter({ text: `${message.author.tag} tarafından kullanıldı`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [errorEmbed] });
    }
    
    // Hedef kullanıcıyı bul
    let targetUser;
    
    // Etiket kontrolü
    if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first();
    } else {
      // ID ile kullanıcı arama
      try {
        targetUser = await client.users.fetch(args[0]);
      } catch (error) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Hata')
          .setDescription('Belirtilen kullanıcı bulunamadı! Lütfen geçerli bir kullanıcı etiketi veya ID\'si girin.')
          .setFooter({ text: `${message.author.tag} tarafından kullanıldı`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        
        return message.reply({ embeds: [errorEmbed] });
      }
    }
    
    // Kendine sarılma kontrolü
    if (targetUser.id === message.author.id) {
      const selfHugEmbed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('🤗 Kendine Sarılma')
        .setDescription(`${message.author}, kendine sarıldı! Bazen kendimize de sarılmaya ihtiyacımız olur. ❤️`)
        .setImage('https://media.giphy.com/media/ZBQhoZC0nqknSviPqT/giphy.gif')
        .setFooter({ text: `${message.author.tag} tarafından kullanıldı`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [selfHugEmbed] });
    }
    
    // Botlara sarılma kontrolü
    if (targetUser.bot) {
      // Eğer sarılınan bot, bu komutu kullanan bot ise
      if (targetUser.id === client.user.id) {
        const botHugEmbed = new EmbedBuilder()
          .setColor('#9370DB')
          .setTitle('🤖 Teşekkürler!')
          .setDescription(`Bana sarıldığın için teşekkür ederim, ${message.author}! Ben de sana sarılıyorum! 🤗`)
          .setImage('https://media.giphy.com/media/Y8cdPle4eIyPu/giphy.gif')
          .setFooter({ text: `${message.author.tag} tarafından kullanıldı`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        
        return message.reply({ embeds: [botHugEmbed] });
      }
      
      // Diğer botlara sarılma
      const botHugEmbed = new EmbedBuilder()
        .setColor('#9370DB')
        .setTitle('🤖 Bot Sarılması')
        .setDescription(`${message.author}, ${targetUser}'a sarıldı! Botlar da sarılmayı hak eder! 🤗`)
        .setImage(randomGif)
        .setFooter({ text: `${message.author.tag} tarafından kullanıldı`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [botHugEmbed] });
    }
    
    // Normal sarılma
    const hugEmbed = new EmbedBuilder()
      .setColor('#FF69B4')
      .setTitle('🤗 Sarılma Vakti!')
      .setDescription(`${message.author}, ${targetUser}'a ${randomMessage}`)
      .setImage(randomGif)
      .setFooter({ text: `${message.author.tag} tarafından kullanıldı`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();
    
    message.reply({ embeds: [hugEmbed] });
  },
}; 