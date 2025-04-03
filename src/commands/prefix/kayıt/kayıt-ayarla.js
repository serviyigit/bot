import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import RegisterManager from '../../../utils/registerManager.js';

export default {
  name: 'kayıt-ayarla',
  description: 'Kayıt sistemi ayarlarını yapılandırır',
  usage: '<ayar> <değer>',
  aliases: ['kayıtayarla', 'register-settings', 'register-config'],
  cooldown: 3,
  guildOnly: true,
  category: 'kayıt',
  permissions: [PermissionFlagsBits.Administrator],
  
  async execute(message, args, client) {
    // Yetkiyi kontrol et
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply({
        content: '❌ Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısın!'
      });
    }
    
    const registerManager = new RegisterManager();
    const config = registerManager.getGuildConfig(message.guild.id);
    const prefix = message.prefix || process.env.PREFIX || '!';
    
    // Argüman kontrolü
    if (!args[0]) {
      return showSettings(message, registerManager, config, prefix);
    }
    
    const setting = args[0].toLowerCase();
    const value = args.slice(1).join(' ');
    
    switch (setting) {
      case 'aç':
      case 'aktif':
      case 'etkinleştir':
        await updateSetting(registerManager, message.guild.id, { enabled: true });
        return message.reply('✅ Kayıt sistemi başarıyla **etkinleştirildi**!');
      
      case 'kapat':
      case 'devre-dışı':
        await updateSetting(registerManager, message.guild.id, { enabled: false });
        return message.reply('❌ Kayıt sistemi **devre dışı** bırakıldı!');
      
      case 'hoşgeldin-kanal':
      case 'welcome-channel':
        return handleChannelSetting(message, args, registerManager, 'welcomeChannel');
      
      case 'kayıt-kanal':
      case 'register-channel':
        return handleChannelSetting(message, args, registerManager, 'registerChannel');
      
      case 'log-kanal':
      case 'register-log':
        return handleChannelSetting(message, args, registerManager, 'registerLog');
      
      case 'yetkili-rol':
      case 'staff-role':
        return handleRoleSetting(message, args, registerManager, 'staffRole');
      
      case 'kayıtsız-rol':
      case 'unregistered-role':
        return handleRoleSetting(message, args, registerManager, 'unregisteredRole');
      
      case 'üye-rol':
      case 'member-role':
        return handleRoleSetting(message, args, registerManager, 'memberRole');
      
      case 'erkek-rol':
      case 'male-role':
        return handleRoleSetting(message, args, registerManager, 'maleRole');
      
      case 'kadın-rol':
      case 'female-role':
        return handleRoleSetting(message, args, registerManager, 'femaleRole');
      
      case 'özel-rol-ekle':
      case 'custom-role-add':
        return handleCustomRoleAdd(message, args, registerManager);
      
      case 'özel-rol-sil':
      case 'custom-role-remove':
        return handleCustomRoleRemove(message, args, registerManager);
      
      case 'hoşgeldin-mesaj':
      case 'welcome-message':
        return handleWelcomeMessage(message, args, registerManager);
      
      case 'isim-format':
      case 'name-format':
        return handleNameFormat(message, args, registerManager);
      
      case 'min-yaş':
      case 'min-age':
        return handleMinAge(message, args, registerManager);
      
      case 'yaş-zorunlu':
      case 'age-required':
        return handleAgeRequired(message, args, registerManager);
      
      case 'otomatik-kayıt':
      case 'auto-register':
        return handleAutoRegister(message, args, registerManager);
      
      case 'liste':
      case 'list':
        return showSettings(message, registerManager, config, prefix);
      
      case 'sıfırla':
      case 'reset':
        return resetSettings(message, args, registerManager);
      
      default:
        return message.reply({
          content: `❌ Geçersiz ayar: \`${setting}\`\nKullanılabilir ayarları görmek için \`${prefix}kayıt-ayarla liste\` yazın.`
        });
    }
  }
};

// Kanal ayarı işleme
async function handleChannelSetting(message, args, registerManager, settingName) {
  if (!args[1]) {
    return message.reply('❌ Bir kanal belirtmelisin! Örnek: `#kayıt-kanalı` veya `sil`');
  }
  
  if (args[1].toLowerCase() === 'sil') {
    const updates = {};
    updates[settingName] = null;
    await updateSetting(registerManager, message.guild.id, updates);
    return message.reply(`✅ ${settingName} ayarı sıfırlandı!`);
  }
  
  const channelMention = message.mentions.channels.first();
  if (!channelMention) {
    return message.reply('❌ Geçerli bir kanal etiketlemelisin!');
  }
  
  const updates = {};
  updates[settingName] = channelMention.id;
  await updateSetting(registerManager, message.guild.id, updates);
  
  let settingTitle = "";
  switch (settingName) {
    case 'welcomeChannel':
      settingTitle = "Hoşgeldin kanalı";
      break;
    case 'registerChannel':
      settingTitle = "Kayıt kanalı";
      break;
    case 'registerLog':
      settingTitle = "Kayıt log kanalı";
      break;
  }
  
  return message.reply(`✅ ${settingTitle} <#${channelMention.id}> olarak ayarlandı!`);
}

// Rol ayarı işleme
async function handleRoleSetting(message, args, registerManager, settingName) {
  if (!args[1]) {
    return message.reply('❌ Bir rol belirtmelisin! Örnek: `@Kayıt Yetkilisi` veya `sil`');
  }
  
  if (args[1].toLowerCase() === 'sil') {
    const updates = {};
    updates[settingName] = null;
    await updateSetting(registerManager, message.guild.id, updates);
    return message.reply(`✅ ${settingName} ayarı sıfırlandı!`);
  }
  
  const roleMention = message.mentions.roles.first();
  if (!roleMention) {
    return message.reply('❌ Geçerli bir rol etiketlemelisin!');
  }
  
  const updates = {};
  updates[settingName] = roleMention.id;
  await updateSetting(registerManager, message.guild.id, updates);
  
  let settingTitle = "";
  switch (settingName) {
    case 'staffRole':
      settingTitle = "Yetkili rolü";
      break;
    case 'unregisteredRole':
      settingTitle = "Kayıtsız rolü";
      break;
    case 'memberRole':
      settingTitle = "Üye rolü";
      break;
    case 'maleRole':
      settingTitle = "Erkek rolü";
      break;
    case 'femaleRole':
      settingTitle = "Kadın rolü";
      break;
  }
  
  return message.reply(`✅ ${settingTitle} <@&${roleMention.id}> olarak ayarlandı!`);
}

// Özel rol ekleme
async function handleCustomRoleAdd(message, args, registerManager) {
  if (!args[1] || !args[2]) {
    return message.reply('❌ Rol adı ve rol etiketini belirtmelisin! Örnek: `Özel-Rol @ÖzelRol`');
  }
  
  const roleName = args[1];
  const roleMention = message.mentions.roles.first();
  
  if (!roleMention) {
    return message.reply('❌ Geçerli bir rol etiketlemelisin!');
  }
  
  const config = registerManager.getGuildConfig(message.guild.id);
  const customRoles = { ...config.customRoles };
  customRoles[roleName] = roleMention.id;
  
  await updateSetting(registerManager, message.guild.id, { customRoles });
  return message.reply(`✅ Özel rol "${roleName}" <@&${roleMention.id}> olarak eklendi!`);
}

// Özel rol silme
async function handleCustomRoleRemove(message, args, registerManager) {
  if (!args[1]) {
    return message.reply('❌ Silmek istediğin özel rol adını belirtmelisin!');
  }
  
  const roleName = args[1];
  const config = registerManager.getGuildConfig(message.guild.id);
  
  if (!config.customRoles || !config.customRoles[roleName]) {
    return message.reply(`❌ "${roleName}" adında bir özel rol bulunamadı!`);
  }
  
  const customRoles = { ...config.customRoles };
  delete customRoles[roleName];
  
  await updateSetting(registerManager, message.guild.id, { customRoles });
  return message.reply(`✅ Özel rol "${roleName}" başarıyla silindi!`);
}

// Hoşgeldin mesajı ayarı
async function handleWelcomeMessage(message, args, registerManager) {
  if (args.length < 2) {
    return message.reply('❌ Bir hoşgeldin mesajı belirtmelisin!');
  }
  
  const welcomeMessage = args.slice(1).join(' ');
  await updateSetting(registerManager, message.guild.id, { welcomeMessage });
  
  return message.reply({
    content: `✅ Hoşgeldin mesajı ayarlandı!`,
    embeds: [
      new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Yeni Hoşgeldin Mesajı')
        .setDescription(welcomeMessage)
        .addFields({
          name: 'Kullanılabilir Değişkenler',
          value: '`{user}`: Kullanıcı etiketi\n`{server}`: Sunucu adı\n`{memberCount}`: Üye sayısı'
        })
    ]
  });
}

// İsim formatı ayarlama
async function handleNameFormat(message, args, registerManager) {
  if (args.length < 2) {
    return message.reply('❌ Bir isim formatı belirtmelisin! Örnek: `{name} | {age}`');
  }
  
  const nameFormat = args.slice(1).join(' ');
  await updateSetting(registerManager, message.guild.id, { nameFormat });
  
  return message.reply({
    content: `✅ İsim formatı ayarlandı!`,
    embeds: [
      new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Yeni İsim Formatı')
        .setDescription(nameFormat)
        .addFields({
          name: 'Kullanılabilir Değişkenler',
          value: '`{name}`: Kullanıcı ismi\n`{age}`: Kullanıcı yaşı'
        })
        .addFields({
          name: 'Örnek Gösterim',
          value: nameFormat
            .replace('{name}', 'Ahmet')
            .replace('{age}', '22')
        })
    ]
  });
}

// Minimum yaş ayarı
async function handleMinAge(message, args, registerManager) {
  if (!args[1] || isNaN(args[1])) {
    return message.reply('❌ Geçerli bir yaş belirtmelisin! Örnek: `13`');
  }
  
  const minAge = parseInt(args[1]);
  if (minAge < 0) {
    return message.reply('❌ Minimum yaş 0\'dan küçük olamaz!');
  }
  
  await updateSetting(registerManager, message.guild.id, { minAge });
  return message.reply(`✅ Minimum yaş **${minAge}** olarak ayarlandı!`);
}

// Yaş zorunluluğu ayarı
async function handleAgeRequired(message, args, registerManager) {
  if (!args[1]) {
    return message.reply('❌ Yaş zorunluluğunu belirtmelisin! (`evet` veya `hayır`)');
  }
  
  const value = args[1].toLowerCase();
  let requireAge;
  
  if (value === 'evet' || value === 'yes' || value === 'açık' || value === 'true') {
    requireAge = true;
  } else if (value === 'hayır' || value === 'no' || value === 'kapalı' || value === 'false') {
    requireAge = false;
  } else {
    return message.reply('❌ Geçerli bir değer belirtmelisin! (`evet` veya `hayır`)');
  }
  
  await updateSetting(registerManager, message.guild.id, { requireAge });
  return message.reply(`✅ Yaş zorunluluğu **${requireAge ? 'aktif' : 'devre dışı'}** olarak ayarlandı!`);
}

// Otomatik kayıt ayarı
async function handleAutoRegister(message, args, registerManager) {
  if (!args[1]) {
    return message.reply('❌ Otomatik kayıt özelliğini belirtmelisin! (`evet` veya `hayır`)');
  }
  
  const value = args[1].toLowerCase();
  let autoRegister;
  
  if (value === 'evet' || value === 'yes' || value === 'açık' || value === 'true') {
    autoRegister = true;
  } else if (value === 'hayır' || value === 'no' || value === 'kapalı' || value === 'false') {
    autoRegister = false;
  } else {
    return message.reply('❌ Geçerli bir değer belirtmelisin! (`evet` veya `hayır`)');
  }
  
  await updateSetting(registerManager, message.guild.id, { autoRegister });
  return message.reply(`✅ Otomatik kayıt **${autoRegister ? 'aktif' : 'devre dışı'}** olarak ayarlandı!`);
}

// Ayarları göster
async function showSettings(message, registerManager, config, prefix) {
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('📝 Kayıt Sistemi Ayarları')
    .setDescription(`Kayıt sistemi ayarlarını yapılandırmak için \`${prefix}kayıt-ayarla <ayar> <değer>\` komutunu kullanabilirsiniz.`)
    .addFields(
      { name: '⚙️ Sistem Durumu', value: config.enabled ? '✅ Aktif' : '❌ Devre Dışı', inline: true },
      { name: '🤖 Otomatik Kayıt', value: config.autoRegister ? '✅ Aktif' : '❌ Devre Dışı', inline: true },
      { name: '📋 Yaş Zorunluluğu', value: config.requireAge ? '✅ Aktif' : '❌ Devre Dışı', inline: true },
      { name: '🔞 Minimum Yaş', value: `${config.minAge || 'Ayarlanmamış'}`, inline: true },
      { name: '📝 İsim Formatı', value: `\`${config.nameFormat || '{name} | {age}'}\``, inline: true },
      { name: '\u200B', value: '\u200B', inline: true },
      { name: '👋 Hoşgeldin Kanalı', value: config.welcomeChannel ? `<#${config.welcomeChannel}>` : 'Ayarlanmamış', inline: true },
      { name: '📝 Kayıt Kanalı', value: config.registerChannel ? `<#${config.registerChannel}>` : 'Ayarlanmamış', inline: true },
      { name: '📊 Kayıt Log Kanalı', value: config.registerLog ? `<#${config.registerLog}>` : 'Ayarlanmamış', inline: true },
      { name: '👑 Yetkili Rolü', value: config.staffRole ? `<@&${config.staffRole}>` : 'Ayarlanmamış', inline: true },
      { name: '📝 Kayıtsız Rolü', value: config.unregisteredRole ? `<@&${config.unregisteredRole}>` : 'Ayarlanmamış', inline: true },
      { name: '👥 Üye Rolü', value: config.memberRole ? `<@&${config.memberRole}>` : 'Ayarlanmamış', inline: true },
      { name: '👨 Erkek Rolü', value: config.maleRole ? `<@&${config.maleRole}>` : 'Ayarlanmamış', inline: true },
      { name: '👩 Kadın Rolü', value: config.femaleRole ? `<@&${config.femaleRole}>` : 'Ayarlanmamış', inline: true }
    )
    .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
    .setTimestamp();
  
  // Özel rolleri ekle
  if (config.customRoles && Object.keys(config.customRoles).length > 0) {
    let customRolesText = '';
    
    for (const [name, id] of Object.entries(config.customRoles)) {
      customRolesText += `**${name}**: <@&${id}>\n`;
    }
    
    embed.addFields({ name: '🎭 Özel Roller', value: customRolesText, inline: false });
  }
  
  // Hoşgeldin mesajını ekle
  embed.addFields({ 
    name: '👋 Hoşgeldin Mesajı', 
    value: `\`\`\`${config.welcomeMessage || "Hoş geldin {user}! Kayıt olmak için yetkilileri bekleyin."}\`\`\``, 
    inline: false 
  });
  
  embed.addFields({ 
    name: '📚 Kullanılabilir Ayarlar', 
    value: 
      '`aç`, `kapat` - Sistemi açar/kapatır\n' +
      '`hoşgeldin-kanal`, `kayıt-kanal`, `log-kanal` - Kanal ayarları\n' +
      '`yetkili-rol`, `kayıtsız-rol`, `üye-rol`, `erkek-rol`, `kadın-rol` - Rol ayarları\n' +
      '`özel-rol-ekle`, `özel-rol-sil` - Özel roller ekler/kaldırır\n' +
      '`hoşgeldin-mesaj` - Hoşgeldin mesajını ayarlar\n' +
      '`isim-format` - İsim formatını ayarlar\n' +
      '`min-yaş` - Minimum yaşı ayarlar\n' +
      '`yaş-zorunlu` - Yaş zorunluluğunu açar/kapatır\n' +
      '`otomatik-kayıt` - Otomatik kayıt özelliğini açar/kapatır\n' +
      '`sıfırla` - Tüm ayarları sıfırlar',
    inline: false 
  });
  
  return message.reply({ embeds: [embed] });
}

// Ayarları güncelle
async function updateSetting(registerManager, guildId, updates) {
  return registerManager.updateGuildConfig(guildId, updates);
}

// Ayarları sıfırla
async function resetSettings(message, args, registerManager) {
  // Onaylama kontrolü
  if (!args[1] || args[1].toLowerCase() !== 'onayla') {
    return message.reply('⚠️ Bu işlem tüm kayıt ayarlarını sıfırlayacak! Onaylıyorsanız `!kayıt-ayarla sıfırla onayla` yazın.');
  }
  
  const defaultConfig = {
    enabled: false,
    welcomeChannel: null,
    registerChannel: null,
    registerLog: null,
    staffRole: null,
    unregisteredRole: null,
    memberRole: null,
    maleRole: null,
    femaleRole: null,
    customRoles: {},
    welcomeMessage: "Hoş geldin {user}! Kayıt olmak için yetkilileri bekleyin.",
    autoRegister: false,
    nameFormat: "{name} | {age}",
    minAge: 13,
    requireAge: false
  };
  
  await updateSetting(registerManager, message.guild.id, defaultConfig);
  return message.reply('✅ Tüm kayıt sistemi ayarları başarıyla sıfırlandı!');
} 