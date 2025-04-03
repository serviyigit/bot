import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import RegisterManager from '../../../utils/registerManager.js';

export default {
  name: 'kayıt',
  description: 'Kullanıcıyı sunucuya kaydeder',
  usage: '<@kullanıcı> <isim> [yaş] [cinsiyet]',
  aliases: ['register', 'k', 'kaydet'],
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
    
    // Kayıt kanalı kontrolü
    if (config.registerChannel && message.channel.id !== config.registerChannel) {
      return message.reply(`❌ Bu komut sadece <#${config.registerChannel}> kanalında kullanılabilir!`);
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
      return message.reply(`❌ Bir kullanıcı etiketlemelisin!\nDoğru Kullanım: \`${prefix}${this.name} @kullanıcı isim [yaş] [cinsiyet]\``);
    }
    
    if (!args[1]) {
      return message.reply(`❌ Bir isim belirtmelisin!\nDoğru Kullanım: \`${prefix}${this.name} @kullanıcı isim [yaş] [cinsiyet]\``);
    }
    
    // Kullanıcıyı bul
    const targetUser = message.mentions.members.first() || 
                        message.guild.members.cache.get(args[0]);
    
    if (!targetUser) {
      return message.reply('❌ Geçerli bir kullanıcı belirtmelisin!');
    }
    
    // Bot kontrolü
    if (targetUser.user.bot) {
      return message.reply('❌ Botları kayıt edemezsin!');
    }
    
    // Kendini kaydetme kontrolü
    if (targetUser.id === message.author.id) {
      return message.reply('❌ Kendini kayıt edemezsin!');
    }
    
    // İsmi al
    const name = args[1];
    
    // Yaş ve cinsiyet argümanlarını kontrol et
    let age = null;
    let gender = null;
    let customRole = null;
    
    // İkinci argüman sayıysa, yaş olarak değerlendir
    if (args[2] && !isNaN(args[2])) {
      age = parseInt(args[2]);
      
      // Üçüncü argüman varsa, cinsiyet olarak değerlendir
      if (args[3]) {
        const genderArg = args[3].toLowerCase();
        
        if (genderArg === 'e' || genderArg === 'erkek' || genderArg === 'male' || genderArg === 'boy' || genderArg === 'm') {
          gender = 'male';
        } else if (genderArg === 'k' || genderArg === 'kadın' || genderArg === 'kız' || genderArg === 'female' || genderArg === 'girl' || genderArg === 'f') {
          gender = 'female';
        } else {
          // Özel bir rol adı olabilir
          customRole = args[3];
          gender = 'custom';
        }
      }
    } else if (args[2]) {
      // İkinci argüman sayı değilse, cinsiyet olarak değerlendir
      const genderArg = args[2].toLowerCase();
      
      if (genderArg === 'e' || genderArg === 'erkek' || genderArg === 'male' || genderArg === 'boy' || genderArg === 'm') {
        gender = 'male';
      } else if (genderArg === 'k' || genderArg === 'kadın' || genderArg === 'kız' || genderArg === 'female' || genderArg === 'girl' || genderArg === 'f') {
        gender = 'female';
      } else {
        // Özel bir rol adı olabilir
        customRole = args[2];
        gender = 'custom';
      }
    }
    
    // Eğer cinsiyet belirtilmediyse ve erkek/kadın rolleri ayarlanmışsa, hata ver
    if (!gender && (config.maleRole || config.femaleRole)) {
      return message.reply(`❌ Cinsiyet belirtmelisin!\nDoğru Kullanım: \`${prefix}${this.name} @kullanıcı isim [yaş] [erkek/kadın]\``);
    }
    
    // Eğer yaş zorunluysa ve belirtilmediyse, hata ver
    if (config.requireAge && !age) {
      return message.reply(`❌ Yaş belirtmelisin!\nDoğru Kullanım: \`${prefix}${this.name} @kullanıcı isim yaş [cinsiyet]\``);
    }
    
    // Eğer minimum yaş sınırı varsa ve belirtilen yaş bundan küçükse, hata ver
    if (age && config.minAge && age < config.minAge) {
      return message.reply(`❌ Minimum yaş sınırı ${config.minAge}! Bu yaşın altındaki kullanıcıları kaydedemezsin.`);
    }
    
    // Özel rol kontrolleri
    if (gender === 'custom' && customRole) {
      // Özel rol adı, kaydedilmiş özel rollerden biri mi kontrol et
      if (!config.customRoles || !config.customRoles[customRole]) {
        // Özel rol kaydedilmemiş, listeyi göster
        let availableRoles = 'Erkek, Kadın';
        
        if (config.customRoles && Object.keys(config.customRoles).length > 0) {
          availableRoles += ', ' + Object.keys(config.customRoles).join(', ');
        }
        
        return message.reply(`❌ Belirttiğin rol ("${customRole}") kayıtlı değil!\nKullanılabilir roller: ${availableRoles}`);
      }
    }
    
    // Kayıt işlemi
    const result = await registerManager.registerUser({
      userId: message.author.id,
      targetId: targetUser.id,
      guildId: message.guild.id,
      name: name,
      age: age,
      gender: gender,
      customRole: customRole,
      guild: message.guild,
      reason: `${message.author.tag} tarafından kayıt edildi`
    });
    
    if (!result.success) {
      return message.reply(`❌ ${result.message}`);
    }
    
    // Başarılı kayıt mesajı
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ Kayıt Başarılı')
      .setDescription(`${targetUser} kullanıcısı başarıyla kaydedildi!`)
      .addFields(
        { name: '👤 Kullanıcı', value: `${targetUser} (${targetUser.id})`, inline: true },
        { name: '📝 İsim', value: name, inline: true },
        { name: '👮 Yetkili', value: `${message.author} (${message.author.id})`, inline: true }
      )
      .setFooter({ text: `${message.guild.name} Kayıt Sistemi`, iconURL: message.guild.iconURL() })
      .setTimestamp();
    
    if (age) {
      embed.addFields({ name: '🔞 Yaş', value: age.toString(), inline: true });
    }
    
    if (gender) {
      let genderText = "";
      
      switch (gender) {
        case 'male':
          genderText = "👨 Erkek";
          break;
        case 'female':
          genderText = "👩 Kadın";
          break;
        case 'custom':
          genderText = `🎭 ${customRole}`;
          break;
      }
      
      embed.addFields({ name: '🧬 Cinsiyet', value: genderText, inline: true });
    }
    
    // İstatistik bilgilerini ekle
    const staffStats = registerManager.getStaffStats(message.author.id, message.guild.id);
    
    embed.addFields({ 
      name: '📊 Yetkili İstatistikleri', 
      value: `Toplam Kayıt: ${staffStats.totalRegisters}\n👨 Erkek: ${staffStats.maleRegisters}\n👩 Kadın: ${staffStats.femaleRegisters}`, 
      inline: false 
    });
    
    // Log kanalına mesaj gönder
    if (config.registerLog) {
      const logChannel = message.guild.channels.cache.get(config.registerLog);
      if (logChannel) {
        try {
          await logChannel.send({ embeds: [embed] });
        } catch (error) {
          console.error('Kayıt log mesajı gönderilemedi:', error);
        }
      }
    }
    
    // Mesajı kanal ve DM olarak gönder
    await message.reply({ embeds: [embed] });
    
    // Hoş geldin mesajını gönder
    if (config.welcomeChannel) {
      const welcomeChannel = message.guild.channels.cache.get(config.welcomeChannel);
      if (welcomeChannel) {
        try {
          const welcomeMessage = config.welcomeMessage
            .replace('{user}', targetUser.toString())
            .replace('{server}', message.guild.name)
            .replace('{memberCount}', message.guild.memberCount);
            
          await welcomeChannel.send(welcomeMessage);
        } catch (error) {
          console.error('Hoşgeldin mesajı gönderilemedi:', error);
        }
      }
    }
    
    // İsim geçmişine ekle
    registerManager.addNameToHistory(targetUser.id, message.guild.id, name, age);
    
    return true;
  }
}; 