import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

export default {
  name: 'taskagitmakas',
  description: 'Bot ile taş kağıt makas oyna',
  usage: '',
  aliases: ['tkm', 'rps', 'taşkağıtmakas'],
  cooldown: 10,
  category: 'eglence',
  
  async execute(message, args, client) {
    // Oyun başlangıç mesajı
    const gameEmbed = new EmbedBuilder()
      .setColor('#FF5F9E')
      .setTitle('🎮 Taş Kağıt Makas')
      .setDescription(`${message.author} ben ile Taş Kağıt Makas oynamak istiyor!\nAşağıdaki düğmelerden birini seçin!`)
      .addFields({
        name: 'Nasıl Oynanır?',
        value: '• Taş makası yener ✊ > ✂️\n• Kağıt taşı yener 📄 > ✊\n• Makas kağıdı yener ✂️ > 📄'
      })
      .setFooter({ text: 'Oyun 60 saniye sonra sona erecek', iconURL: message.author.displayAvatarURL() })
      .setTimestamp();
    
    // Butonlar
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('tas')
        .setLabel('Taş')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✊'),
      new ButtonBuilder()
        .setCustomId('kagit')
        .setLabel('Kağıt')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📄'),
      new ButtonBuilder()
        .setCustomId('makas')
        .setLabel('Makas')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✂️'),
      new ButtonBuilder()
        .setCustomId('iptal')
        .setLabel('İptal')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );
    
    // Mesajı gönder
    const gameMessage = await message.channel.send({
      embeds: [gameEmbed],
      components: [row]
    });
    
    // Collector oluştur
    const collector = gameMessage.createMessageComponentCollector({ 
      componentType: ComponentType.Button,
      time: 60000, // 60 saniye
      filter: (i) => i.user.id === message.author.id // Sadece komutu kullanan kişi
    });
    
    // Collector eventi - buton tıklandığında
    collector.on('collect', async (interaction) => {
      // İptal butonu tıklandıysa oyunu bitir
      if (interaction.customId === 'iptal') {
        collector.stop('iptal');
        return;
      }
      
      // Kullanıcının seçimi
      const userChoice = interaction.customId;
      
      // Botun seçimi (rastgele)
      const choices = ['tas', 'kagit', 'makas'];
      const botChoice = choices[Math.floor(Math.random() * choices.length)];
      
      // Seçim emojileri
      const emojis = {
        tas: '✊',
        kagit: '📄',
        makas: '✂️'
      };
      
      // Seçimlerin görünen adları
      const choiceNames = {
        tas: 'Taş',
        kagit: 'Kağıt',
        makas: 'Makas'
      };
      
      // Kazananı belirle
      let result;
      if (userChoice === botChoice) {
        result = 'Berabere!';
      } else if (
        (userChoice === 'tas' && botChoice === 'makas') ||
        (userChoice === 'kagit' && botChoice === 'tas') ||
        (userChoice === 'makas' && botChoice === 'kagit')
      ) {
        result = 'Kazandınız!';
      } else {
        result = 'Kaybettiniz!';
      }
      
      // Sonuç rengini belirle
      const resultColor = 
        result === 'Kazandınız!' ? '#00FF00' : 
        result === 'Kaybettiniz!' ? '#FF0000' : 
        '#FFFF00';
      
      // Sonuç embed'i
      const resultEmbed = new EmbedBuilder()
        .setColor(resultColor)
        .setTitle(`🎮 Taş Kağıt Makas - ${result}`)
        .setDescription(`${message.author} ve ben taş kağıt makas oynadık!`)
        .addFields(
          { name: 'Sizin Seçiminiz', value: `${emojis[userChoice]} ${choiceNames[userChoice]}`, inline: true },
          { name: 'Benim Seçimim', value: `${emojis[botChoice]} ${choiceNames[botChoice]}`, inline: true },
          { name: 'Sonuç', value: result, inline: false }
        )
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      // Butonları devre dışı bırak
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('tas')
          .setLabel('Taş')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('✊')
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('kagit')
          .setLabel('Kağıt')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📄')
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('makas')
          .setLabel('Makas')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('✂️')
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('iptal')
          .setLabel('İptal')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
          .setDisabled(true)
      );
      
      // Mesajı güncelle
      await interaction.update({
        embeds: [resultEmbed],
        components: [disabledRow]
      });
      
      // Collector'ı durdur
      collector.stop();
    });
    
    // Collector sona erdiğinde (zaman aşımı)
    collector.on('end', (collected, reason) => {
      if (reason === 'time' && collected.size === 0) {
        const timeoutEmbed = new EmbedBuilder()
          .setColor('#808080')
          .setTitle('⏱️ Zaman Aşımı')
          .setDescription(`${message.author} 60 saniye içinde bir seçim yapmadı. Oyun iptal edildi.`)
          .setTimestamp();
        
        // Butonları devre dışı bırak
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('tas')
            .setLabel('Taş')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✊')
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('kagit')
            .setLabel('Kağıt')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📄')
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('makas')
            .setLabel('Makas')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✂️')
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('iptal')
            .setLabel('İptal')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
            .setDisabled(true)
        );
        
        gameMessage.edit({
          embeds: [timeoutEmbed],
          components: [disabledRow]
        });
      } else if (reason === 'iptal') {
        const cancelledEmbed = new EmbedBuilder()
          .setColor('#808080')
          .setTitle('❌ İptal Edildi')
          .setDescription(`${message.author} oyunu iptal etti.`)
          .setTimestamp();
        
        // Butonları devre dışı bırak
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('tas')
            .setLabel('Taş')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✊')
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('kagit')
            .setLabel('Kağıt')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📄')
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('makas')
            .setLabel('Makas')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✂️')
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('iptal')
            .setLabel('İptal')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
            .setDisabled(true)
        );
        
        gameMessage.edit({
          embeds: [cancelledEmbed],
          components: [disabledRow]
        });
      }
    });
  },
}; 