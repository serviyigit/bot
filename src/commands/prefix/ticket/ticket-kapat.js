import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import TicketManager from '../../../utils/ticketManager.js';
import MessageLogger from '../../../utils/messageLogger.js';
import { PermissionFlagsBits } from 'discord.js';

export default {
    name: 'ticket-kapat',
    description: 'Mevcut ticket talebini kapatır',
    usage: '',
    aliases: ['ticketkapat', 'kapat', 'talep-kapat'],
    cooldown: 5,
    guildOnly: true,
    args: false,
    category: 'ticket',

    async execute(message, args, client) {
        const channel = message.channel;
        
        // Ticket kanalı kontrolü
        if (!channel.name.startsWith('ticket-')) {
            return message.reply('Bu komut sadece ticket kanallarında kullanılabilir!');
        }
        
        // Ticket yöneticisini başlat
        const ticketManager = new TicketManager();
        
        // Bu kanal bir ticket kanalı mı kontrol et
        const ticket = ticketManager.getTicketByChannelId(channel.id);
        if (!ticket) {
            return message.reply('Bu kanal bir ticket değil veya veritabanında bulunamadı!');
        }
        
        // Yetkiyi kontrol et
        const config = ticketManager.getConfig();
        const isSupport = config.supportRoleId && message.member.roles.cache.has(config.supportRoleId);
        const isAdmin = message.member.permissions.has(PermissionFlagsBits.ManageChannels);
        const isTicketCreator = ticket.creatorId === message.author.id;
        
        if (!isSupport && !isAdmin && !isTicketCreator) {
            return message.reply('Bu komutu kullanmak için yeterli yetkiye sahip değilsiniz!');
        }
        
        try {
            // Ticket'ı kapat
            const result = await ticketManager.closeTicket({
                channelId: channel.id,
                userId: message.author.id
            });
            
            if (!result.success) {
                return message.reply(result.message);
            }
            
            // Kapatma embed'i
            const closeEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Talep Kapatıldı')
                .setDescription(`Talep ${message.author.tag} tarafından kapatıldı.`)
                .setTimestamp();
            
            // Yeniden açma ve silme butonları
            const reopenButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('reopen_ticket')
                    .setLabel('Talebi Yeniden Aç')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🔓'),
                new ButtonBuilder()
                    .setCustomId('delete_ticket')
                    .setLabel('Talebi Sil')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⛔')
            );
            
            await message.channel.send({ embeds: [closeEmbed], components: [reopenButton] });
            
            // Kanal izinlerini güncelle
            await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                ViewChannel: false,
                SendMessages: false
            });
            
            // Ticket sahibinin izinlerini kaldır
            if (ticket.creatorId) {
                await channel.permissionOverwrites.edit(ticket.creatorId, {
                    ViewChannel: false,
                    SendMessages: false
                });
            }
            
            // Eklenen diğer kullanıcıların da izinlerini kaldır
            if (ticket.addedUsers && ticket.addedUsers.length > 0) {
                for (const userId of ticket.addedUsers) {
                    await channel.permissionOverwrites.edit(userId, {
                        ViewChannel: false,
                        SendMessages: false
                    });
                }
            }
            
            // Ticket logları oluştur ve gönder
            if (config.logChannelId) {
                const logChannel = await message.guild.channels.fetch(config.logChannelId).catch(() => null);
                if (logChannel) {
                    const messageLogger = new MessageLogger();
                    await messageLogger.sendTranscriptToChannel(logChannel, ticket.ticketId, ticket);
                }
            }
        } catch (error) {
            console.error('Ticket kapatılırken hata:', error);
            return message.reply('Ticket kapatılırken bir hata oluştu!');
        }
    },
};
