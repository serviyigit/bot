import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import ModerationManager from '../../../utils/moderationManager.js';

export default {
  name: 'mod-stats',
  description: 'Moderasyon istatistiklerini gösterir',
  usage: '[kullanıcı]',
  aliases: ['modstats', 'moderasyon-stats', 'modistatistik'],
  cooldown: 10,
  guildOnly: true,
  category: 'moderation',
  
  async execute(message, args, client) {
    const moderationManager = new ModerationManager();
    const config = moderationManager.getConfig();
    const embedColor = config.embedColor || '#0099ff';
    
    // Yetki kontrolü - Kick, ban, mute yetkilerinden birine sahip olma
    const kickPermission = message.member.permissions.has(PermissionFlagsBits.KickMembers);
    const banPermission = message.member.permissions.has(PermissionFlagsBits.BanMembers);
    const timeoutPermission = message.member.permissions.has(PermissionFlagsBits.ModerateMembers);
    const hasRoleBan = config.banRoleId && message.member.roles.cache.has(config.banRoleId);
    const hasRoleKick = config.kickRoleId && message.member.roles.cache.has(config.kickRoleId);
    const hasRoleMute = config.muteRoleId && message.member.roles.cache.has(config.muteRoleId);
    
    const hasModerationPermission = kickPermission || banPermission || timeoutPermission || 
                                   hasRoleBan || hasRoleKick || hasRoleMute || 
                                   message.member.id === message.guild.ownerId;
    
    if (!hasModerationPermission) {
      return message.reply('Bu komutu kullanmak için moderasyon yetkilerine sahip değilsin!');
    }
    
    // İstatistikleri al
    const stats = moderationManager.getStats();
    
    // Moderasyon istatistiklerini göster
    const statsEmbed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle('📊 Moderasyon İstatistikleri')
      .setDescription(`${message.guild.name} sunucusunun moderasyon istatistikleri`)
      .addFields(
        { name: '🔨 Ban Sayısı', value: stats.bans.toString(), inline: true },
        { name: '👢 Kick Sayısı', value: stats.kicks.toString(), inline: true },
        { name: '🔇 Mute Sayısı', value: stats.mutes.toString(), inline: true },
        { name: '⚠️ Uyarı Sayısı', value: stats.warnings.toString(), inline: true },
        { name: '📝 Gönderilen Mesaj Sayısı', value: stats.messagesSent.toString(), inline: true },
        { name: '🗑️ Silinen Mesaj Sayısı', value: stats.messagesDeleted.toString(), inline: true },
        { name: '👋 Katılım Sayısı', value: stats.joins.toString(), inline: true },
        { name: '🚶 Ayrılma Sayısı', value: stats.leaves.toString(), inline: true },
        { name: '🚫 Spam Tespit Sayısı', value: stats.spamDetected.toString(), inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `${message.author.tag} tarafından istendi`, iconURL: message.author.displayAvatarURL() });
    
    // Biçimlendirilmiş tarih bilgisi ekle
    const currentDate = new Date();
    const dateString = currentDate.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    statsEmbed.addFields({ name: '📅 Tarih', value: dateString, inline: false });
    
    // Aktif cezaları hesapla
    let activeBans = 0;
    let activeMutes = 0;
    
    const punishments = moderationManager.punishments;
    punishments.forEach((userPunishments, userId) => {
      // Aktif banları kontrol et
      const activeBan = userPunishments.bans.find(ban => 
        ban.expiresAt === 0 || ban.expiresAt > Date.now()
      );
      if (activeBan) {
        activeBans++;
      }
    });
    
    // Aktif muteleri hesapla
    activeMutes = moderationManager.mutes.size;
    
    // Aktif cezaları ekle
    statsEmbed.addFields(
      { name: '🔒 Aktif Ban Sayısı', value: activeBans.toString(), inline: true },
      { name: '🔕 Aktif Mute Sayısı', value: activeMutes.toString(), inline: true }
    );
    
    // Aktif uyarı sayısını hesapla
    let activeWarnings = 0;
    
    const warnings = moderationManager.warnings;
    warnings.forEach((userWarnings, userId) => {
      userWarnings.forEach(warning => {
        if (warning.expiresAt > Date.now()) {
          activeWarnings++;
        }
      });
    });
    
    statsEmbed.addFields({ name: '⚠️ Aktif Uyarı Sayısı', value: activeWarnings.toString(), inline: true });
    
    return message.channel.send({ embeds: [statsEmbed] });
  },
}; 