import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import VoiceRoomManager from '../../../utils/voiceRoomManager.js';

export default {
  name: 'oda-oluştur',
  description: 'Özel ses odası oluşturur',
  usage: '[isim] [kişi-limiti] [--gizli]',
  aliases: ['odaoluştur', 'oda-olustur', 'odaolustur', 'createroom', 'create-room'],
  cooldown: 10,
  guildOnly: true,
  category: 'odalar',
  
  async execute(message, args, client) {
    const voiceRoomManager = new VoiceRoomManager();
    const config = voiceRoomManager.getConfig();
    
    if (!config.enabled) {
      return message.reply('Özel oda sistemi şu anda aktif değil!');
    }
    
    // Kullanıcının odayı oluşturma iznini kontrol et
    const canCreate = voiceRoomManager.canCreateRoom(message.author.id, message.guild);
    
    if (!canCreate.allowed) {
      return message.reply(`❌ ${canCreate.reason}`);
    }
    
    // Parametreleri işle
    let roomName = null;
    let userLimit = null;
    let isPrivate = false;
    
    const privateFlag = args.find(arg => arg === '--gizli' || arg === '--private');
    
    if (privateFlag) {
      isPrivate = true;
      args = args.filter(arg => arg !== privateFlag);
    }
    
    // Kullanıcı limiti kontrolü (son argüman sayı ise)
    const lastArg = args[args.length - 1];
    if (lastArg && /^\d+$/.test(lastArg)) {
      userLimit = parseInt(lastArg);
      args.pop();
      
      // Geçerli bir limit mi kontrol et
      if (userLimit < 0 || userLimit > 99) {
        return message.reply('Kullanıcı limiti 0 ile 99 arasında olmalıdır!');
      }
    }
    
    // Oda adı
    if (args.length > 0) {
      roomName = args.join(' ');
      
      // Oda adı karakter sınırı kontrolü
      if (roomName.length > config.roomNameCharLimit) {
        roomName = roomName.substring(0, config.roomNameCharLimit);
        message.reply(`⚠️ Oda adı çok uzun! ${config.roomNameCharLimit} karaktere kısaltıldı.`);
      }
    }
    
    // Özel oda oluştur
    const result = await voiceRoomManager.createRoom({
      guild: message.guild,
      user: message.author,
      name: roomName,
      userLimit,
      isPrivate
    });
    
    if (!result.success) {
      return message.reply(`❌ Özel oda oluşturulamadı: ${result.message}`);
    }
    
    // Başarı mesajı
    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('✅ Özel Oda Oluşturuldu')
      .setDescription(`<#${result.channel.id}> odası başarıyla oluşturuldu!`)
      .addFields(
        { name: 'Oda Adı', value: result.channel.name, inline: true },
        { name: 'Limit', value: userLimit ? userLimit.toString() : 'Sınırsız', inline: true },
        { name: 'Gizlilik', value: isPrivate ? 'Özel' : 'Herkese Açık', inline: true }
      )
      .setFooter({ text: `${message.author.tag} tarafından oluşturuldu`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();
    
    // Ekstra bilgiler
    embed.addFields({
      name: '📝 Oda Yönetimi',
      value: [
        `\`${message.prefix}oda-düzenle\` komutu ile odanızı düzenleyebilirsiniz.`,
        `\`${message.prefix}oda-izin <@kullanıcı>\` komutu ile kullanıcılara izin verebilirsiniz.`,
        `\`${message.prefix}oda-kaldır <@kullanıcı>\` komutu ile kullanıcıları odadan çıkarabilirsiniz.`,
        `\`${message.prefix}oda-sil\` komutu ile odanızı silebilirsiniz.`
      ].join('\n')
    });
    
    return message.reply({ embeds: [embed] });
  },
}; 