import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import VoiceRoomManager from '../../../utils/voiceRoomManager.js';

export default {
  name: 'oda-kaldır',
  description: 'Özel odanızdan bir kullanıcıyı çıkarır',
  usage: '<@kullanıcı>',
  aliases: ['odakaldır', 'oda-kaldir', 'odakaldir', 'room-remove', 'roomremove', 'remove-from-room', 'oda-kick', 'odakick'],
  cooldown: 3,
  guildOnly: true,
  args: true,
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
      return message.reply('❌ Kullanıcı çıkarabileceğiniz bir özel odanız bulunmuyor! Önce `oda-oluştur` komutu ile bir oda oluşturun.');
    }
    
    // Bahsedilen kullanıcıyı bul
    const targetUser = message.mentions.members.first();
    
    if (!targetUser) {
      return message.reply('❌ Lütfen bir kullanıcı etiketleyin!');
    }
    
    // Kendisini çıkarmaya çalışıyor mu?
    if (targetUser.id === message.author.id) {
      return message.reply('❌ Kendinizi odadan çıkaramazsınız! Odanızı silmek için `oda-sil` komutunu kullanın.');
    }
    
    // Bot'u çıkarmaya çalışıyor mu?
    if (targetUser.user.bot) {
      return message.reply('❌ Botları odadan çıkaramazsınız!');
    }
    
    // Kullanıcı izinli mi kontrol et
    if (!voiceRoomManager.hasAccess(targetUser.id, message.author.id, message.guild.id)) {
      return message.reply(`❌ ${targetUser.displayName} kullanıcısı zaten odanıza erişim izni bulunmuyor!`);
    }
    
    // Kullanıcıyı çıkar
    const result = await voiceRoomManager.removeUserFromRoom(message.author.id, targetUser.id, message.guild.id);
    
    if (!result.success) {
      return message.reply(`❌ Kullanıcı çıkarılamadı: ${result.message}`);
    }
    
    // Kullanıcı odada mı kontrol et
    const voiceChannel = message.guild.channels.cache.get(userRoom.channelId);
    
    if (voiceChannel && targetUser.voice.channelId === voiceChannel.id) {
      try {
        // Kullanıcıyı kanaldan at
        await targetUser.voice.disconnect('Oda sahibi tarafından çıkarıldı');
      } catch (error) {
        console.error('Error disconnecting user from voice channel:', error);
      }
    }
    
    // Başarı mesajı
    const embed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('✅ Kullanıcı Çıkarıldı')
      .setDescription(`**${targetUser}** kullanıcısı <#${userRoom.channelId}> odanızdan çıkarıldı!`)
      .setFooter({ text: `${message.author.tag} tarafından çıkarıldı`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  },
}; 