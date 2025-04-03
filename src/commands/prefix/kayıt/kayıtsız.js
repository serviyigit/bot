import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import RegisterManager from '../../../utils/registerManager.js';

export default {
  name: 'kayıtsız',
  description: 'Kullanıcıyı kayıtsıza atar',
  usage: '<@kullanıcı> [sebep]',
  aliases: ['unregister', 'kayıtsıza-at', 'unreg'],
  cooldown: 3,
  guildOnly: true,
  category: 'kayıt',
  
  async execute(message, args, client) {
    // RegisterManager sınıfını başlat
    const registerManager = new RegisterManager();
    const config = registerManager.getGuildConfig(message.guild.id);
    const prefix = message.prefix || process.env.PREFIX || '!';
    
    // Kayıt sisteminin açık olup olmadığını kontrol et
    if (!config.enabled) {
      return message.reply('❌ Kayıt sistemi aktif değil! Yöneticilerden sistemin açılmasını isteyin.');
    }
    
    // Yetkili rolü kontrolü
    if (config.staffRole && !message.member.roles.cache.has(config.staffRole)) {
      return message.reply('❌ Bu komutu kullanmak için kayıt yetkilisi olmalısın!');
    }
    
    // Eğer yetkili rolü ayarlanmamışsa, en azından yönetici veya Üye Yönet yetkisi ara
    if (!config.staffRole && !message.member.permissions.has([
      PermissionFlagsBits.Administrator, 
      PermissionFlagsBits.ManageRoles, 
      PermissionFlagsBits.ManageGuild
    ])) {
      return message.reply('❌ Bu komutu kullanmak için yeterli yetkin yok!');
    }
    
    // Rollerin ayarlanıp ayarlanmadığını kontrol et
    if (!config.unregisteredRole) {
      return message.reply('❌ Kayıtsız rolü ayarlanmamış! Yöneticilerden bu rolü ayarlamasını isteyin.');
    }
    
    // Argümanları kontrol et
    if (!args[0]) {
      return message.reply(`❌ Bir kullanıcı etiketlemelisin!\nDoğru Kullanım: \`${prefix}${this.name} @kullanıcı [sebep]\``);
    }
    
    // Kullanıcıyı bul
    const targetUser = message.mentions.members.first() || 
                        message.guild.members.cache.get(args[0]);
    
    if (!targetUser) {
      return message.reply('❌ Geçerli bir kullanıcı belirtmelisin!');
    }
    
    // Bot kontrolü
    if (targetUser.user.bot) {
      return message.reply('❌ Botları kayıtsıza atamazsın!');
    }
    
    // Kendini kayıtsıza atma kontrolü
    if (targetUser.id === message.author.id) {
      return message.reply('❌ Kendini kayıtsıza atamazsın!');
    }
    
    // Hedef kullanıcının yetkisini kontrol et
    // Eğer hedef kullanıcı da kayıt yetkilisiyse veya yöneticiyse, engelle
    if (config.staffRole && targetUser.roles.cache.has(config.staffRole)) {
      return message.reply('❌ Kayıt yetkilisini kayıtsıza atamazsın!');
    }
    
    if (targetUser.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ Yönetici yetkisine sahip kullanıcıları kayıtsıza atamazsın!');
    }
    
    // Sebep belirleme
    const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';
    
    // Kayıtsıza atma işlemi
    const result = await registerManager.unregisterUser({
      targetId: targetUser.id,
      guildId: message.guild.id,
      guild: message.guild,
      reason: `${message.author.tag} tarafından kayıtsıza atıldı: ${reason}`
    });
    
    if (!result.success) {
      return message.reply(`❌ ${result.message}`);
    }
    
    // Başarılı kayıtsıza atma mesajı
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('⚠️ Kayıtsıza Atıldı')
      .setDescription(`${targetUser} kullanıcısı başarıyla kayıtsıza atıldı!`)
      .addFields(
        { name: '👤 Kullanıcı', value: `${targetUser} (${targetUser.id})`, inline: true },
        { name: '👮 Yetkili', value: `${message.author} (${message.author.id})`, inline: true },
        { name: '📄 Sebep', value: reason, inline: false }
      )
      .setFooter({ text: `${message.guild.name} Kayıt Sistemi`, iconURL: message.guild.iconURL() })
      .setTimestamp();
    
    // Log kanalına mesaj gönder
    if (config.registerLog) {
      const logChannel = message.guild.channels.cache.get(config.registerLog);
      if (logChannel) {
        try {
          await logChannel.send({ embeds: [embed] });
        } catch (error) {
          console.error('Kayıtsıza atma log mesajı gönderilemedi:', error);
        }
      }
    }
    
    // Mesajı kanala gönder
    await message.reply({ embeds: [embed] });
    return true;
  }
}; 