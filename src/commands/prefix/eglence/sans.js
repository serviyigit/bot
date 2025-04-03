import { EmbedBuilder } from 'discord.js';

export default {
  name: 'sans',
  description: 'Bugün şansın ne kadar iyi?',
  usage: '',
  aliases: ['şans', 'şansım', 'luck'],
  cooldown: 10,
  category: 'eglence',
  
  async execute(message, args, client) {
    // Şans yüzdesi (0-100)
    const luckPercent = Math.floor(Math.random() * 101);
    
    // Şans mesajları
    let luckMessage;
    let color;
    let emoji;
    
    if (luckPercent >= 90) {
      luckMessage = 'İnanılmaz şanslısın! Bugün büyük ikramiye seni bekliyor olabilir!';
      color = '#FFD700'; // Altın
      emoji = '🌟';
    } else if (luckPercent >= 75) {
      luckMessage = 'Çok şanslısın! Bugün her şey yolunda gidecek gibi görünüyor.';
      color = '#00FF00'; // Yeşil
      emoji = '🍀';
    } else if (luckPercent >= 60) {
      luckMessage = 'Şanslısın! Güzel bir gün geçireceksin.';
      color = '#ADFF2F'; // Yeşil-sarı
      emoji = '✨';
    } else if (luckPercent >= 40) {
      luckMessage = 'Şansın normal seviyede. Ortalama bir gün geçireceksin.';
      color = '#FFFF00'; // Sarı
      emoji = '😊';
    } else if (luckPercent >= 25) {
      luckMessage = 'Şansın biraz düşük. Dikkatli olsan iyi olur.';
      color = '#FFA500'; // Turuncu
      emoji = '😐';
    } else if (luckPercent >= 10) {
      luckMessage = 'Şanssız bir gündesin. Bugün riskli işlere girme!';
      color = '#FF4500'; // Turuncu-kırmızı
      emoji = '😔';
    } else {
      luckMessage = 'Çok şanssız bir gündesin! Bugün evden çıkma, yataktan bile kalkma!';
      color = '#FF0000'; // Kırmızı
      emoji = '😱';
    }
    
    // İlerleme çubuğu oluşturma
    const progressBarLength = 20;
    const filledBlocks = Math.round((luckPercent / 100) * progressBarLength);
    const emptyBlocks = progressBarLength - filledBlocks;
    
    const filledBlock = '█';
    const emptyBlock = '░';
    
    const progressBar = filledBlock.repeat(filledBlocks) + emptyBlock.repeat(emptyBlocks);
    
    // Embed oluştur
    const luckEmbed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${emoji} Şans Ölçer ${emoji}`)
      .setDescription(`**${message.author.username}**, bugün şansın: **%${luckPercent}**`)
      .addFields(
        { name: 'Şans Seviyesi', value: `\`\`\`${progressBar}\`\`\``, inline: false },
        { name: 'Şans Yorumu', value: luckMessage, inline: false }
      )
      .setFooter({ text: 'Her gün şansın değişebilir, yarın tekrar dene!' })
      .setTimestamp();
    
    // Rastgele şans önerileri
    const suggestions = [
      'Şansını artırmak için bugün mavi bir şey giy!',
      'Bugün uğurlu sayın 7. Saat 7\'de dilediğin bir dilek gerçekleşebilir!',
      'Bugün şansını denemek için ufak bir piyango bileti alabilirsin.',
      'Şansını artırmak için bugün birine iyilik yap!',
      'Bugün sağ ayakla yataktan kalktıysan şansın daha yüksek olabilir!',
      'Dört yapraklı yonca bulmak şansını artırabilir, dikkatli bak!',
      'Bugün şans getirmesi için bir arkadaşının omzuna dokun!',
      'Bugün kırmızı iç çamaşırı giymen şansını artırabilir!',
      'Şans para biriktirmekle gelir, kumbarana bozuk para at!',
      'Bugün şans için nazar boncuğu taşımayı dene!'
    ];
    
    // Rastgele bir öneri seç
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    
    // Öneriyi embed'e ekle
    luckEmbed.addFields({ name: 'Şans Önerisi', value: randomSuggestion, inline: false });
    
    // Mesaj gönder
    message.reply({ embeds: [luckEmbed] });
  },
}; 