import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import BotlistManager from '../../../utils/botlistManager.js';

export default {
  name: 'bot-onayla',
  description: 'Bir botu onaylar ve botlist\'e ekler',
  usage: '<bot_id> [not]',
  aliases: ['botonayla', 'approve', 'approvebot'],
  cooldown: 5,
  guildOnly: true,
  args: true,
  category: 'botlist',
  
  async execute(message, args, client) {
    const botlistManager = new BotlistManager();
    const config = botlistManager.getConfig();
    
    if (!config.enabled) {
      return message.reply('Botlist sistemi şu anda aktif değil!');
    }
    
    // Yetki kontrolü
    const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);
    const isReviewer = config.reviewerRoleId && message.member.roles.cache.has(config.reviewerRoleId);
    
    if (!isAdmin && !isReviewer) {
      return message.reply('Bu komutu kullanmak için yeterli yetkiye sahip değilsiniz!');
    }
    
    if (args.length < 1) {
      return message.reply(`Eksik parametre! Kullanım: \`${message.prefix}${this.name} <bot_id> [not]\``);
    }
    
    const botId = args[0];
    const note = args.slice(1).join(' ') || 'Onaylandı';
    
    if (!/^\d+$/.test(botId)) {
      return message.reply('Geçersiz bot ID! Bot ID sadece rakamlardan oluşmalıdır.');
    }
    
    // Botu bul
    const bot = botlistManager.getBotById(botId);
    if (!bot) {
      return message.reply('Belirtilen ID\'ye sahip bir bot bulunamadı!');
    }
    
    if (bot.status === 'approved') {
      return message.reply('Bu bot zaten onaylanmış!');
    }
    
    // Botu onayla
    const result = botlistManager.approveBot(botId, message.author.id, note);
    
    if (!result.success) {
      return message.reply(`Bot onaylanırken bir hata oluştu: ${result.message}`);
    }
    
    // Bot sahibini bulmaya çalış
    let botOwner;
    try {
      botOwner = await client.users.fetch(bot.ownerId);
    } catch (error) {
      console.error('Bot sahibi bulunamadı:', error);
      botOwner = { tag: 'Bilinmeyen Kullanıcı', id: bot.ownerId };
    }
    
    // Bot kullanıcısını bulmaya çalış
    let botUser;
    try {
      botUser = await client.users.fetch(bot.id);
    } catch (error) {
      console.error('Bot bulunamadı:', error);
      botUser = { tag: 'Bilinmeyen Bot', displayAvatarURL: () => null };
    }
    
    // Onaylama embedini oluştur
    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('✅ Bot Onaylandı')
      .setDescription(`**${bot.name}** botu başarıyla onaylandı ve botlist'e eklendi.`)
      .addFields(
        { name: 'Bot', value: `${botUser.tag || bot.name} (${bot.id})`, inline: true },
        { name: 'Sahibi', value: `<@${bot.ownerId}>`, inline: true },
        { name: 'Onaylayan', value: `${message.author.tag}`, inline: true },
        { name: 'Kategori', value: bot.category, inline: true },
        { name: 'Kütüphane', value: bot.library, inline: true },
        { name: 'Önek', value: bot.prefix, inline: true },
        { name: 'Onay Notu', value: note }
      )
      .setThumbnail(botUser.displayAvatarURL?.() || bot.avatar || null)
      .setFooter({ text: `ID: ${bot.id} • ${message.guild.name} Botlist`, iconURL: message.guild.iconURL() })
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
    
    // Log kanalına bildir
    if (config.logChannelId) {
      const logChannel = message.guild.channels.cache.get(config.logChannelId);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('✅ Bot Onaylandı')
          .setDescription(`<@${message.author.id}> tarafından **${bot.name}** botu onaylandı.`)
          .addFields(
            { name: 'Bot', value: `${botUser.tag || bot.name} (${bot.id})`, inline: true },
            { name: 'Sahibi', value: `<@${bot.ownerId}>`, inline: true },
            { name: 'Onaylayan', value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: 'Kategori', value: bot.category, inline: true },
            { name: 'Kütüphane', value: bot.library, inline: true },
            { name: 'Önek', value: bot.prefix, inline: true },
            { name: 'Onay Notu', value: note }
          )
          .setThumbnail(botUser.displayAvatarURL?.() || bot.avatar || null)
          .setFooter({ text: `ID: ${bot.id} • ${message.guild.name} Botlist`, iconURL: message.guild.iconURL() })
          .setTimestamp();
        
        await logChannel.send({ embeds: [logEmbed] });
      }
    }
    
    // Vitrin kanalına ekle
    if (config.showcaseChannelId) {
      const showcaseChannel = message.guild.channels.cache.get(config.showcaseChannelId);
      if (showcaseChannel) {
        const showcaseEmbed = botlistManager.generateBotEmbed(result.bot, true);
        
        await showcaseChannel.send({ 
          content: `📢 Yeni onaylanan bot: <@${bot.id}>`,
          embeds: [showcaseEmbed] 
        });
      }
    }
    
    // Bot sahibine DM gönder
    try {
      if (botOwner && botOwner.id) {
        const dmEmbed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setTitle('🎉 Botunuz Onaylandı!')
          .setDescription(`**${bot.name}** adlı botunuz ${message.guild.name} sunucusunda onaylandı ve botlist'e eklendi!`)
          .addFields(
            { name: 'Bot', value: `${botUser.tag || bot.name} (${bot.id})`, inline: true },
            { name: 'Onaylayan', value: `${message.author.tag}`, inline: true },
            { name: 'Onay Notu', value: note },
            { name: 'Sunucu', value: `[${message.guild.name}](https://discord.gg/sunucu)` }
          )
          .setThumbnail(message.guild.iconURL())
          .setFooter({ text: `${message.guild.name} Botlist`, iconURL: message.guild.iconURL() })
          .setTimestamp();
        
        await botOwner.send({ embeds: [dmEmbed] }).catch(() => {
          console.log(`${botOwner.tag} kullanıcısına DM gönderilemedi.`);
        });
      }
    } catch (error) {
      console.error('Bot sahibine DM gönderilirken hata:', error);
    }
  },
}; 