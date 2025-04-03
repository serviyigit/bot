// src/events/ticketButtonInteraction.js
import { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } from 'discord.js';
import TicketManager from '../utils/ticketManager.js';
import MessageLogger from '../utils/messageLogger.js';

export default {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    if (!interaction.isButton()) return;
    
    const ticketManager = new TicketManager();
    const messageLogger = new MessageLogger();
    const config = ticketManager.getConfig();
    
    // Ticket oluşturma butonu
    if (interaction.customId === 'create_ticket') {
      await interaction.deferReply({ ephemeral: true });
      
      // Kullanıcının zaten açık bir ticket'ı var mı kontrol et
      const activeTicket = ticketManager.getActiveTicketByUserId(interaction.user.id);
      
      if (activeTicket) {
        const existingChannel = await interaction.guild.channels.fetch(activeTicket.channelId).catch(() => null);
        
        if (existingChannel) {
          return interaction.editReply({ 
            content: `Zaten açık bir talebiniz var: ${existingChannel}`,
            ephemeral: true 
          });
        }
      }
      
      try {
        // Yeni ticket oluştur
        const result = await ticketManager.createTicket({
          guild: interaction.guild,
          user: interaction.user,
          reason: 'Kullanıcı tarafından talep edildi'
        });
        
        if (!result.success) {
          return interaction.editReply({ 
            content: result.message,
            ephemeral: true 
          });
        }
        
        const { channel, ticketData } = result;
        
        // Karşılama mesajı gönder
        const ticketEmbed = new EmbedBuilder()
          .setColor(config.embedColor || '#0099ff')
          .setTitle('Yeni Destek Talebi')
          .setDescription(`${interaction.user} Tarafından Açıldı!`)
          .addFields(
            { name: 'Talep Sahibi', value: `${interaction.user.tag}` },
            { name: 'Talep ID', value: ticketData.ticketId }
          )
          .setTimestamp();
        
        const closeButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Talebi Kapat')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒')
        );
        
        await channel.send({ embeds: [ticketEmbed], components: [closeButton] });
        
        // Karşılama mesajı
        if (config.welcomeMessage) {
          await channel.send({ content: `${interaction.user}, ${config.welcomeMessage}` });
        }
        
        // Destek ekibi mentionlama
        if (config.supportRoleId) {
          await channel.send({ content: `Hey, <@&${config.supportRoleId}> Yeni Bir Destek Talebi Açıldı!` });
        }
        
        return interaction.editReply({ 
          content: `Talebiniz oluşturuldu: ${channel}`,
          ephemeral: true 
        });
      } catch (error) {
        console.error('Ticket oluşturulurken hata:', error);
        return interaction.editReply({ 
          content: 'Talep oluşturulurken bir hata oluştu!',
          ephemeral: true 
        });
      }
    }
    
    // Ticket kapatma butonu
    if (interaction.customId === 'close_ticket') {
      await interaction.deferReply();
      
      const channel = interaction.channel;
      
      if (!channel.name.startsWith('ticket-')) {
        return interaction.editReply('Bu komut sadece ticket kanallarında kullanılabilir!');
      }
      
      try {
        // Ticket bilgilerini al
        const ticket = ticketManager.getTicketByChannelId(channel.id);
        if (!ticket) {
          return interaction.editReply('Bu kanal bir ticket değil veya veritabanında bulunamadı!');
        }
        
        // Ticket'ı kapat
        const result = await ticketManager.closeTicket({
          channelId: channel.id,
          userId: interaction.user.id
        });
        
        if (!result.success) {
          return interaction.editReply(result.message);
        }
        
        const closeEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('Talep Kapatıldı')
          .setDescription(`Talep ${interaction.user.tag} tarafından kapatıldı.`)
          .setTimestamp();
        
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
        
        await interaction.editReply({ embeds: [closeEmbed], components: [reopenButton] });
        
        // Ticket kanalı izinlerini güncelle
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
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
        
        // Eklenen diğer kullanıcıların izinlerini de kaldır
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
          const logChannel = await interaction.guild.channels.fetch(config.logChannelId).catch(() => null);
          if (logChannel) {
            await messageLogger.sendTranscriptToChannel(logChannel, ticket.ticketId, ticket);
          }
        }
      } catch (error) {
        console.error('Ticket kapatılırken hata:', error);
        await interaction.editReply('Ticket kapatılırken bir hata oluştu!');
      }
    }
    
    // Ticket yeniden açma butonu
    if (interaction.customId === 'reopen_ticket') {
      await interaction.deferReply();
      
      const channel = interaction.channel;
      
      if (!channel.name.startsWith('ticket-')) {
        return interaction.editReply('Bu komut sadece ticket kanallarında kullanılabilir!');
      }
      
      try {
        // Ticket bilgilerini al
        const ticket = ticketManager.getTicketByChannelId(channel.id);
        if (!ticket) {
          return interaction.editReply('Bu kanal bir ticket değil veya veritabanında bulunamadı!');
        }
        
        // Ticket'ı yeniden aç
        const result = await ticketManager.reopenTicket({
          channelId: channel.id,
          userId: interaction.user.id
        });
        
        if (!result.success) {
          return interaction.editReply(result.message);
        }
        
        const reopenEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('Talep Yeniden Açıldı')
          .setDescription(`Talep ${interaction.user.tag} tarafından yeniden açıldı.`)
          .setTimestamp();
        
        const closeButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Talebi Kapat')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒')
        );
        
        await interaction.editReply({ embeds: [reopenEmbed], components: [closeButton] });
        
        // Ticket sahibinin izinlerini geri ver
        if (ticket.creatorId) {
          await channel.permissionOverwrites.edit(ticket.creatorId, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
          });
        }
        
        // Eklenen diğer kullanıcıların izinlerini de geri ver
        if (ticket.addedUsers && ticket.addedUsers.length > 0) {
          for (const userId of ticket.addedUsers) {
            await channel.permissionOverwrites.edit(userId, {
              ViewChannel: true,
              SendMessages: true,
              ReadMessageHistory: true
            });
          }
        }
      } catch (error) {
        console.error('Ticket yeniden açılırken hata:', error);
        await interaction.editReply('Ticket yeniden açılırken bir hata oluştu!');
      }
    }
    
    // Ticket silme butonu
    if (interaction.customId === 'delete_ticket') {
      await interaction.deferReply();
      
      const channel = interaction.channel;
      
      if (!channel.name.startsWith('ticket-')) {
        return interaction.editReply('Bu komut sadece ticket kanallarında kullanılabilir!');
      }
      
      // Yetkiyi kontrol et
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.editReply('Bu komutu kullanmak için kanal yönetme yetkisine sahip olmalısınız!');
      }
      
      try {
        // Ticket bilgilerini al
        const ticket = ticketManager.getTicketByChannelId(channel.id);
        if (!ticket) {
          return interaction.editReply('Bu kanal bir ticket değil veya veritabanında bulunamadı!');
        }
        
        // Ticket'ı veritabanında sil olarak işaretle
        await ticketManager.deleteTicket({
          channelId: channel.id
        });
        
        const deleteEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('Talep Siliniyor')
          .setDescription('Bu talep 5 saniye içinde silinecek...')
          .setTimestamp();
        
        await interaction.editReply({ embeds: [deleteEmbed], components: [] });
        
        // Ticket logları oluştur ve gönder
        if (config.logChannelId) {
          const logChannel = await interaction.guild.channels.fetch(config.logChannelId).catch(() => null);
          if (logChannel) {
            await messageLogger.sendTranscriptToChannel(logChannel, ticket.ticketId, {
              ...ticket,
              deletedBy: interaction.user.id,
              deletedAt: new Date().toISOString()
            });
          }
        }
        
        // 5 saniye bekle ve kanalı sil
        setTimeout(() => {
          channel.delete().catch(error => console.error('Kanal silinirken hata oluştu:', error));
        }, 5000);
      } catch (error) {
        console.error('Ticket silinirken hata:', error);
        await interaction.editReply('Ticket silinirken bir hata oluştu!');
      }
    }
  },
};

                    
