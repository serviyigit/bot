import { EmbedBuilder } from 'discord.js';

export default {
  name: 'ping',
  description: 'Botun gecikme süresini gösterir',
  usage: '',
  aliases: ['gecikme', 'ms', 'latency'],
  cooldown: 5,
  category: 'genel',
  
  async execute(message, args, client) {
    // Başlangıç mesajını oluştur
    const sentMessage = await message.channel.send('🏓 Ping Ölçülüyor...');
    
    // Gecikme değerlerini hesapla
    const apiLatency = Math.round(client.ws.ping);
    const botLatency = sentMessage.createdTimestamp - message.createdTimestamp;
    
    // Mesaj rengini belirleme
    let color;
    if (botLatency < 100) color = '#00FF00'; // Mükemmel
    else if (botLatency < 200) color = '#FFFF00'; // İyi
    else color = '#FF0000'; // Kötü
    
    // Durum emojisi seç
    let statusEmoji;
    if (botLatency < 100) statusEmoji = '🟢';
    else if (botLatency < 200) statusEmoji = '🟡';
    else statusEmoji = '🔴';
    
    // Embed mesajını oluştur
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'Bot Gecikmesi', value: `${statusEmoji} ${botLatency}ms`, inline: true },
        { name: 'API Gecikmesi', value: `${statusEmoji} ${apiLatency}ms`, inline: true }
      )
      .setFooter({ text: `${message.author.tag} tarafından istendi`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();
    
    // Mesajı güncelle
    await sentMessage.edit({ content: null, embeds: [embed] });
  },
}; 