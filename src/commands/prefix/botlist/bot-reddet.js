import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import BotlistManager from '../../../utils/botlistManager.js';

export default {
  name: 'bot-reddet',
  description: 'Bir bot başvurusunu reddeder',
  usage: '<bot_id> <sebep>',
  aliases: ['botreddet', 'reject', 'rejectbot'],
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
    
    if (args.length < 2) {
      return message.reply(`Eksik parametre! Kullanım: \`${message.prefix}${this.name} <bot_id> <sebep>\``);
    }
    
    const botId = args[0];
    const reason = args.slice(1).join(' ');
    
    if (!/^\d+$/.test(botId)) {
      return message.reply('Geçersiz bot ID! Bot ID sadece rakamlardan oluşmalıdır.');
    }
    
    // Botu bul
    const bot = botlistManager.getBotById(botId);
    if (!bot) {
      return message.reply('Belirtilen ID\'ye sahip bir bot bulunamadı!');
    }
    
    if (bot.status === 'rejected') {
      return message.reply('Bu bot zaten reddedilmiş!');
    }
    
    // Botu reddet
    const result = botlistManager.rejectBot(botId, message.author.id, reason);
    
    if (!result.success) {
      return message.reply(`Bot reddedilirken bir hata oluştu: ${result.message}`);
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
    
    // Reddetme embedini oluştur
    const embed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('❌ Bot Reddedildi')
      .setDescription(`**${bot.name}** botu reddedildi.`)
      .addFields(
        { name: 'Bot', value: `${botUser.tag || bot.name} (${bot.id})`, inline: true },
        { name: 'Sahibi', value: `<@${bot.ownerId}>`, inline: true },
        { name: 'Reddeden', value: `${message.author.tag}`, inline: true },
        { name: 'Kategori', value: bot.category, inline: true },
        { name: 'Kütüphane', value: bot.library, inline: true },
        { name: 'Önek', value: bot.prefix, inline: true },
        { name: 'Red Sebebi', value: reason }
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
          .setColor('#e74c3c')
          .setTitle('❌ Bot Reddedildi')
          .setDescription(`<@${message.author.id}> tarafından **${bot.name}** botu reddedildi.`)
          .addFields(
            { name: 'Bot', value: `${botUser.tag || bot.name} (${bot.id})`, inline: true },
            { name: 'Sahibi', value: `<@${bot.ownerId}>`, inline: true },
            { name: 'Reddeden', value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: 'Kategori', value: bot.category, inline: true },
            { name: 'Kütüphane', value: bot.library, inline: true },
            { name: 'Önek', value: bot.prefix, inline: true },
            { name: 'Red Sebebi', value: reason }
          )
          .setThumbnail(botUser.displayAvatarURL?.() || bot.avatar || null)
          .setFooter({ text: `ID: ${bot.id} • ${message.guild.name} Botlist`, iconURL: message.guild.iconURL() })
          .setTimestamp();
        
        await logChannel.send({ embeds: [logEmbed] });
      }
    }
    
    // Bot sahibine DM gönder
    try {
      if (botOwner && botOwner.id) {
        const dmEmbed = new EmbedBuilder()
          .setColor('#e74c3c')
          .setTitle('❌ Botunuz Reddedildi')
          .setDescription(`**${bot.name}** adlı botunuz ${message.guild.name} sunucusunda reddedildi.`)
          .addFields(
            { name: 'Bot', value: `${botUser.tag || bot.name} (${bot.id})`, inline: true },
            { name: 'Reddeden', value: `${message.author.tag}`, inline: true },
            { name: 'Red Sebebi', value: reason },
            { name: 'Ne Yapmalıyım?', value: 'Botunuzu düzenleyip tekrar başvurabilirsiniz. Reddetme sebebini düzelttikten sonra tekrar başvurunuzu değerlendireceğiz.' }
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