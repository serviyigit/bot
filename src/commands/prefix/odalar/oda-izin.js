import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import VoiceRoomManager from '../../../utils/voiceRoomManager.js';

export default {
  name: 'oda-izin',
  description: 'Özel odanıza kullanıcı ekler',
  usage: '<@kullanıcı>',
  aliases: ['odaizin', 'oda-izni', 'odaizni', 'room-add', 'roomadd', 'add-to-room'],
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
      return message.reply('❌ İzin verebileceğiniz bir özel odanız bulunmuyor! Önce `oda-oluştur` komutu ile bir oda oluşturun.');
    }
    
    // Bahsedilen kullanıcıyı bul
    const targetUser = message.mentions.members.first();
    
    if (!targetUser) {
      return message.reply('❌ Lütfen bir kullanıcı etiketleyin!');
    }
    
    // Kendisine izin vermeye çalışıyor mu?
    if (targetUser.id === message.author.id) {
      return message.reply('❌ Kendinize izin veremezsiniz, zaten odanın sahibisiniz!');
    }
    
    // Bot'a izin vermeye çalışıyor mu?
    if (targetUser.user.bot) {
      return message.reply('❌ Botlara izin veremezsiniz!');
    }
    
    // Kullanıcı zaten izinli mi kontrol et
    if (voiceRoomManager.hasAccess(targetUser.id, message.author.id, message.guild.id)) {
      return message.reply(`❌ ${targetUser.displayName} kullanıcısı zaten odanıza erişebiliyor!`);
    }
    
    // Kullanıcı limitini kontrol et
    const allowedUsers = voiceRoomManager.getAllowedUsers(message.author.id, message.guild.id);
    
    if (allowedUsers.length >= config.maxAllowedUsers) {
      return message.reply(`❌ En fazla ${config.maxAllowedUsers} kullanıcıya izin verebilirsiniz!`);
    }
    
    // Kullanıcıya izin ver
    const result = await voiceRoomManager.addUserToRoom(message.author.id, targetUser.id, message.guild.id);
    
    if (!result.success) {
      return message.reply(`❌ Kullanıcı eklenemedi: ${result.message}`);
    }
    
    // Başarı mesajı
    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('✅ Kullanıcı Eklendi')
      .setDescription(`**${targetUser}** kullanıcısı <#${userRoom.channelId}> odanıza eklendi!`)
      .setFooter({ text: `${message.author.tag} tarafından eklendi`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  },
}; 