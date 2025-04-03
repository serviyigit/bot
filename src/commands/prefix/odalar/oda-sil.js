import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } from 'discord.js';
import VoiceRoomManager from '../../../utils/voiceRoomManager.js';

export default {
  name: 'oda-sil',
  description: 'Özel ses odanızı siler',
  usage: '',
  aliases: ['odasil', 'roomdelete', 'room-delete', 'delete-room', 'oda-kapat', 'odakapat'],
  cooldown: 10,
  guildOnly: true,
  category: 'odalar',
  
  async execute(message, args, client) {
    const voiceRoomManager = new VoiceRoomManager();
    const config = voiceRoomManager.getConfig();
    
    if (!config.enabled) {
      return message.reply('Özel oda sistemi şu anda aktif değil!');
    }
    
    // Kullanıcının bir odası var mı kontrol et
    const userRoom = voiceRoomManager.getUserRoom(message.author.id, message.guild.id);
    
    if (!userRoom) {
      return message.reply('❌ Silinecek bir özel odanız bulunmuyor! Önce `oda-oluştur` komutu ile bir oda oluşturun.');
    }
    
    // Kanal bilgisini al
    const voiceChannel = message.guild.channels.cache.get(userRoom.channelId);
    
    if (!voiceChannel) {
      // Kanal bulunamadı, kayıtları temizle
      await voiceRoomManager.deleteRoom(message.author.id, message.guild.id, true);
      return message.reply('❌ Ses kanalınız bulunamadı, kayıtlar temizlendi. Yeni bir oda oluşturabilirsiniz.');
    }
    
    // Onay butonu oluştur
    const confirmButton = new ButtonBuilder()
      .setCustomId('confirm_delete')
      .setLabel('Odayı Sil')
      .setStyle(ButtonStyle.Danger);
    
    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel_delete')
      .setLabel('İptal')
      .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
    
    // Onay mesajı gönder
    const embed = new EmbedBuilder()
      .setColor('#f39c12')
      .setTitle('⚠️ Oda Silme Onayı')
      .setDescription(`<#${userRoom.channelId}> odanızı silmek istediğinize emin misiniz?`)
      .setFooter({ text: '30 saniye içinde yanıt vermezseniz işlem iptal edilecektir.' });
    
    const reply = await message.reply({
      embeds: [embed],
      components: [row]
    });
    
    // Collector oluştur
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000, // 30 saniye
      filter: (i) => i.user.id === message.author.id
    });
    
    collector.on('collect', async (interaction) => {
      // Componentleri devre dışı bırak
      const disabledRow = new ActionRowBuilder().addComponents(
        confirmButton.setDisabled(true),
        cancelButton.setDisabled(true)
      );
      
      if (interaction.customId === 'confirm_delete') {
        // Odayı sil
        const result = await voiceRoomManager.deleteRoom(message.author.id, message.guild.id);
        
        if (!result.success) {
          await interaction.update({
            embeds: [
              new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('❌ Hata')
                .setDescription(`Oda silinemedi: ${result.message}`)
            ],
            components: [disabledRow]
          });
          return;
        }
        
        // Başarı mesajı
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor('#2ecc71')
              .setTitle('✅ Oda Silindi')
              .setDescription(`${voiceChannel.name} odanız başarıyla silindi!`)
              .setTimestamp()
          ],
          components: [disabledRow]
        });
      } else {
        // İptal edildi
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor('#7f8c8d')
              .setTitle('❌ İptal Edildi')
              .setDescription('Oda silme işlemi iptal edildi.')
              .setTimestamp()
          ],
          components: [disabledRow]
        });
      }
      
      collector.stop();
    });
    
    collector.on('end', async (collected, reason) => {
      if (reason === 'time' && collected.size === 0) {
        // Mesajı güncelle
        const disabledRow = new ActionRowBuilder().addComponents(
          confirmButton.setDisabled(true),
          cancelButton.setDisabled(true)
        );
        
        await reply.edit({
          embeds: [
            new EmbedBuilder()
              .setColor('#7f8c8d')
              .setTitle('⏱️ Zaman Aşımı')
              .setDescription('Oda silme işlemi zaman aşımına uğradı.')
              .setTimestamp()
          ],
          components: [disabledRow]
        }).catch(err => console.error('Mesaj güncellenemedi:', err));
      }
    });
  },
}; 