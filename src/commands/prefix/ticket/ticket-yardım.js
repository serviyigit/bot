import { EmbedBuilder } from 'discord.js';

export default {
  name: 'ticket-yardım',
  description: 'Ticket komutları hakkında bilgi verir',
  usage: '',
  aliases: ['ticketyardım', 'ticketyardim', 'talep-yardım', 'talep-yardim', 'ticket-help'],
  cooldown: 5,
  guildOnly: true,
  args: false,
  category: 'ticket',
  
  async execute(message, args, client) {
    const prefix = process.env.PREFIX || '!';
    
    const helpEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🎫 Ticket Sistemi Yardım')
      .setDescription('Ticket sistemi komutları:')
      .addFields(
        { name: `${prefix}ticket-ayarla`, value: 'Ticket sistemini ayarlar (Yönetici gerektirir)' },
        { name: `${prefix}ticket-kur`, value: 'Ticket oluşturma sistemini kurar (Yönetici gerektirir)' },
        { name: `${prefix}ticket-kapat`, value: 'Mevcut ticket\'ı kapatır' },
        { name: `${prefix}ticket-sil`, value: 'Mevcut ticket\'ı siler (Kanal yönetme yetkisi gerektirir)' },
        { name: `${prefix}ticket-ekle <@kullanıcı/ID>`, value: 'Belirtilen kullanıcıyı ticket\'a ekler' },
        { name: `${prefix}ticket-cikar <@kullanıcı/ID>`, value: 'Belirtilen kullanıcıyı ticket\'tan çıkarır' },
        { name: `${prefix}ticket-bilgi`, value: 'Mevcut ticket hakkında bilgi verir' }
      )
      .setFooter({ text: `${message.guild.name} Ticket Sistemi`, iconURL: message.guild.iconURL() })
      .setTimestamp();
      
    // Ayarlar bilgileri
    const settingsHelp = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('⚙️ Ticket Ayarları Yardım')
      .setDescription(`${prefix}ticket-ayarla komutu ile aşağıdaki ayarları yapabilirsiniz:`)
      .addFields(
        { name: '📂 Kategori', value: `\`${prefix}ticket-ayarla kategori <kategori_id/etiket>\`\nTicketların açılacağı kategoriyi ayarlar.` },
        { name: '👮 Sorumlu', value: `\`${prefix}ticket-ayarla sorumlu <rol_id/etiket>\`\nTicket sorumlusu rolünü ayarlar.` },
        { name: '📢 Kanal', value: `\`${prefix}ticket-ayarla kanal <kanal_id/etiket>\`\nTicket butonunun gönderileceği kanalı ayarlar.` },
        { name: '📝 Log', value: `\`${prefix}ticket-ayarla log <kanal_id/etiket>\`\nTicket loglarının gönderileceği kanalı ayarlar.` },
        { name: '💬 Mesaj', value: `\`${prefix}ticket-ayarla mesaj <mesaj>\`\nTicket açılışında gösterilecek karşılama mesajını ayarlar.` },
        { name: '🎨 Renk', value: `\`${prefix}ticket-ayarla renk <hex_kodu>\`\nTicket embedlerinin rengini ayarlar. Örnek: #FF0000` },
        { name: '❌ Silme Komutları', value: `\`${prefix}ticket-ayarla <ayar>-sil\`\nBelirtilen ayarı sıfırlar. Örnek: kategori-sil` }
      )
      .setFooter({ text: `${message.guild.name} Ticket Sistemi`, iconURL: message.guild.iconURL() })
      .setTimestamp();
      
    await message.channel.send({ embeds: [helpEmbed] });
    await message.channel.send({ embeds: [settingsHelp] });
  },
};
