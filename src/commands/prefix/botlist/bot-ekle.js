import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import BotlistManager from '../../../utils/botlistManager.js';

export default {
  name: 'bot-ekle',
  description: 'Bot listesine yeni bir bot ekler',
  usage: '<bot_id> <önek> <kütüphane> <kategori>',
  aliases: ['botekle', 'addbot', 'botadd'],
  cooldown: 300, // 5 dakika
  guildOnly: true,
  args: true,
  category: 'botlist',
  
  async execute(message, args, client) {
    const botlistManager = new BotlistManager();
    const config = botlistManager.getConfig();
    
    if (!config.enabled) {
      return message.reply('Botlist sistemi şu anda aktif değil!');
    }
    
    if (config.addChannelId && message.channel.id !== config.addChannelId) {
      return message.reply(`Bu komutu sadece <#${config.addChannelId}> kanalında kullanabilirsiniz!`);
    }
    
    if (args.length < 4) {
      return message.reply(`Eksik parametre! Kullanım: \`${message.prefix}${this.name} <bot_id> <önek> <kütüphane> <kategori>\``);
    }
    
    const botId = args[0];
    const prefix = args[1];
    const library = args[2];
    const category = args[3];
    
    if (!/^\d+$/.test(botId)) {
      return message.reply('Geçersiz bot ID! Bot ID sadece rakamlardan oluşmalıdır.');
    }
    
    if (!config.categories.includes(category)) {
      return message.reply(`Geçersiz kategori! Kullanılabilir kategoriler: ${config.categories.join(', ')}`);
    }
    
    let botUser;
    try {
      botUser = await client.users.fetch(botId);
    } catch (error) {
      return message.reply('Belirtilen ID\'ye sahip bir bot bulunamadı! Lütfen geçerli bir bot ID girin.');
    }
    
    if (!botUser.bot) {
      return message.reply('Belirtilen ID bir bota ait değil!');
    }
    
    const existingBot = botlistManager.getBotById(botId);
    if (existingBot) {
      return message.reply('Bu bot zaten botlist sisteminde kayıtlı!');
    }
    
    const messageContent = message.content.split('\n').slice(1).join('\n');
    const descriptionMatch = messageContent.match(/Açıklama:\s*(.*?)(?=\nÖzellikler:|$)/s);
    const featuresMatch = messageContent.match(/Özellikler:\s*(.*?)(?=\n|$)/s);
    
    const description = descriptionMatch ? descriptionMatch[1].trim() : '';
    const features = featuresMatch ? featuresMatch[1].trim() : '';
    
    if (!description) {
      return message.reply('Bot açıklaması belirtilmemiş! Lütfen "Açıklama:" satırı ekleyin.');
    }
    
    if (!features) {
      return message.reply('Bot özellikleri belirtilmemiş! Lütfen "Özellikler:" satırı ekleyin.');
    }
    
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${botId}&scope=bot%20applications.commands&permissions=0`;
    
    const botData = {
      id: botId,
      name: botUser.username,
      avatar: botUser.displayAvatarURL({ size: 512 }),
      ownerId: message.author.id,
      prefix,
      library,
      category,
      description,
      features,
      inviteUrl,
    };
    
    const result = botlistManager.addBot(botData);
    
    if (!result.success) {
      return message.reply(`Bot eklenirken bir hata oluştu: ${result.message}`);
    }
    
    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('✅ Bot Başarıyla Eklendi')
      .setDescription(`Bot başvurunuz alındı! Botunuz incelendikten sonra botlist'e eklenecek.`)
      .addFields(
        { name: 'Bot', value: `${botUser.tag} (${botId})`, inline: true },
        { name: 'Sahibi', value: `${message.author.tag}`, inline: true },
        { name: 'Durum', value: '⏳ İnceleniyor', inline: true },
        { name: 'Kategori', value: category, inline: true },
        { name: 'Kütüphane', value: library, inline: true },
        { name: 'Önek', value: prefix, inline: true }
      )
      .setThumbnail(botUser.displayAvatarURL({ size: 256 }))
      .setFooter({ text: `ID: ${result.bot.id} • ${message.guild.name} Botlist`, iconURL: message.guild.iconURL() })
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
    
    if (config.logChannelId) {
      const logChannel = message.guild.channels.cache.get(config.logChannelId);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor('#3498db')
          .setTitle('📥 Yeni Bot Başvurusu')
          .setDescription(`<@${message.author.id}> bir bot başvurusunda bulundu.`)
          .addFields(
            { name: 'Bot', value: `${botUser.tag} (${botId})`, inline: true },
            { name: 'Sahibi', value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: 'Kategori', value: category, inline: true },
            { name: 'Kütüphane', value: library, inline: true },
            { name: 'Önek', value: prefix, inline: true },
            { name: 'Açıklama', value: description },
            { name: 'Özellikler', value: features },
            { name: 'Davet Linki', value: `[Botu Davet Et](${inviteUrl})` }
          )
          .setThumbnail(botUser.displayAvatarURL({ size: 256 }))
          .setFooter({ text: `ID: ${result.bot.id} • ${message.guild.name} Botlist`, iconURL: message.guild.iconURL() })
          .setTimestamp();
        
        await logChannel.send({ embeds: [logEmbed] });
      }
    }
    
    if (config.reviewChannelId) {
      const reviewChannel = message.guild.channels.cache.get(config.reviewChannelId);
      if (reviewChannel) {
        const reviewEmbed = new EmbedBuilder()
          .setColor('#f39c12')
          .setTitle('🔍 Bot İnceleme')
          .setDescription(`<@${message.author.id}> tarafından eklenen **${botUser.tag}** botu inceleme bekliyor.`)
          .addFields(
            { name: 'Bot', value: `${botUser.tag} (${botId})`, inline: true },
            { name: 'Sahibi', value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: 'Kategori', value: category, inline: true },
            { name: 'Kütüphane', value: library, inline: true },
            { name: 'Önek', value: prefix, inline: true },
            { name: 'Açıklama', value: description },
            { name: 'Özellikler', value: features },
            { name: 'Davet Linki', value: `[Botu Davet Et](${inviteUrl})` }
          )
          .setThumbnail(botUser.displayAvatarURL({ size: 256 }))
          .setFooter({ text: `ID: ${result.bot.id} • İnceleme bekliyor`, iconURL: message.guild.iconURL() })
          .setTimestamp();
        
        await reviewChannel.send({ 
          content: config.reviewerRoleId ? `<@&${config.reviewerRoleId}>` : null,
          embeds: [reviewEmbed] 
        });
      }
    }
    
    if (config.developerRoleId) {
      try {
        const member = await message.guild.members.fetch(message.author.id);
        if (!member.roles.cache.has(config.developerRoleId)) {
          await member.roles.add(config.developerRoleId);
        }
      } catch (error) {
        console.error('Bot sahibine rol verirken hata:', error);
      }
    }
  },
}; 