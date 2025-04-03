import { EmbedBuilder } from 'discord.js';

export default {
  name: 'zar',
  description: 'Zar atar',
  usage: '[miktar]',
  aliases: ['dice', 'roll'],
  cooldown: 3,
  category: 'eglence',
  
  async execute(message, args, client) {
    // Kaç zar atılacak (varsayılan: 1)
    let miktar = 1;
    
    if (args[0]) {
      miktar = parseInt(args[0]);
      
      // Geçerli miktar değil ise
      if (isNaN(miktar) || miktar < 1 || miktar > 10) {
        return message.reply('Lütfen 1 ile 10 arasında bir miktar belirtin!');
      }
    }
    
    // Zar emojileri
    const zarEmojileri = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    
    // "Zar atılıyor..." mesajı
    const atiliyorEmbed = new EmbedBuilder()
      .setColor('#4169E1')
      .setTitle('🎲 Zar atılıyor...')
      .setDescription(`${message.author} ${miktar} adet zar atıyor!`)
      .setTimestamp();
    
    const atiliyorMesaj = await message.channel.send({ embeds: [atiliyorEmbed] });
    
    // Animasyon hissi için 1.5 saniye bekle
    setTimeout(async () => {
      const zarlar = [];
      let toplam = 0;
      
      // Belirtilen miktar kadar zar at
      for (let i = 0; i < miktar; i++) {
        const zar = Math.floor(Math.random() * 6) + 1;
        zarlar.push(zar);
        toplam += zar;
      }
      
      // Zarları görselleştir
      const zarGorunumleri = zarlar.map(zar => zarEmojileri[zar - 1]);
      
      // Sonuç embed'i
      const sonucEmbed = new EmbedBuilder()
        .setColor('#4169E1')
        .setTitle('🎲 Zar Sonucu')
        .setDescription(`${message.author} ${miktar} adet zar attı!`)
        .addFields(
          { name: 'Zarlar', value: zarGorunumleri.join(' '), inline: false },
          { name: 'Sonuç', value: zarlar.join(' + '), inline: true },
          { name: 'Toplam', value: toplam.toString(), inline: true }
        )
        .setFooter({ text: `${message.author.tag} tarafından atıldı`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      await atiliyorMesaj.edit({ embeds: [sonucEmbed] });
    }, 1500);
  },
}; 