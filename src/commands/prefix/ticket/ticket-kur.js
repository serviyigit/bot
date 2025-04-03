import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import TicketManager from '../../../utils/ticketManager.js';

export default {
    name: 'ticket-kur',
    description: 'Ticket sistemi kurar',
    usage: '',
    aliases: ['ticketkur'],
    cooldown: 10,
    guildOnly: true,
    args: false,
    category: 'ticket',

    async execute(message, args, client) {
        // Yönetici yetkisi kontrolü
        if(!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız!');
        }

        // Ticket yöneticisini başlat
        const ticketManager = new TicketManager();
        const config = ticketManager.getConfig();
        
        // Ayarlar kontrol edilsin
        if (!config.channelId) {
            return message.reply(`Ticket butonunun gönderileceği kanal ayarlanmamış! Önce \`${message.prefix}ticket-ayarla kanal #kanal\` komutu ile ayarlayın.`);
        }
        
        try {
            const channelToSend = config.channelId ? 
                await message.guild.channels.fetch(config.channelId).catch(() => null) : 
                message.channel;
            
            if (!channelToSend) {
                return message.reply('Ticket kanalı bulunamadı! Lütfen geçerli bir kanal ayarlayın.');
            }
            
            const ticketEmbed = new EmbedBuilder()
                .setColor(config.embedColor || '#0099ff')
                .setTitle('📝 Destek Talebi')
                .setDescription('Destek Almak İçin Ticket Açmanız Gerekmektedir Lütfen Aşağıdaki **' + config.buttonLabel + '** Butonuna Tıklayınız.')
                .setTimestamp();
            
            // Eğer sorumlu rol ayarlanmışsa embed'e ekle
            if (config.supportRoleId) {
                const supportRole = await message.guild.roles.fetch(config.supportRoleId).catch(() => null);
                if (supportRole) {
                    ticketEmbed.addFields({ name: 'Destek Ekibi', value: `${supportRole}` });
                }
            }
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel(config.buttonLabel || 'Destek Talebi Oluştur')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎫')
            );
            
            await channelToSend.send({ embeds: [ticketEmbed], components: [row] });
            
            if (channelToSend.id !== message.channel.id) {
                return message.reply(`✅ Ticket sistemi <#${channelToSend.id}> kanalına başarıyla kuruldu!`);
            } else {
                return message.reply('✅ Ticket sistemi başarıyla kuruldu!');
            }
        } catch (error) {
            console.error('Ticket kurulumu sırasında hata:', error);
            return message.reply('Ticket sistemi kurulurken bir hata oluştu!');
        }
    },
};
