import { EmbedBuilder } from 'discord.js';
import RegisterManager from '../../../utils/registerManager.js';

export default {
  name: 'kayıt-bilgi',
  description: 'Kayıt istatistiklerini ve bilgilerini gösterir',
  usage: '[kullanıcı]',
  aliases: ['kayıtbilgi', 'register-info', 'kayıt-info', 'kayıt-istatistik', 'kayıt-stat'],
  cooldown: 5,
  guildOnly: true,
  category: 'kayıt',
  
  async execute(message, args, client) {
    const registerManager = new RegisterManager();
    const config = registerManager.getGuildConfig(message.guild.id);
    
    // Kayıt sisteminin açık olup olmadığını kontrol et
    if (!config.enabled) {
      return message.reply('❌ Kayıt sistemi aktif değil! Yöneticilerden sistemin açılmasını isteyin.');
    }
    
    let targetUser = message.mentions.users.first() || client.users.cache.get(args[0]);
    let isOwnStats = false;
    
    // Kullanıcı belirtilmemişse kendi istatistiklerini göster
    if (!targetUser) {
      isOwnStats = true;
      targetUser = message.author;
    }
    
    // Kullanıcı ve sunucu istatistiklerini al
    const userData = registerManager.getUserData(targetUser.id, message.guild.id);
    const staffStats = registerManager.getStaffStats(targetUser.id, message.guild.id);
    const guildStats = registerManager.getGuildStats(message.guild.id);
    
    // Sunucu istatistikleri embedı
    if (args[0] === 'sunucu' || args[0] === 'server') {
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`📊 ${message.guild.name} Kayıt İstatistikleri`)
        .setDescription('Sunucunun kayıt istatistikleri ve detayları')
        .addFields(
          { name: '📝 Toplam Kayıt', value: guildStats.totalRegisters.toString(), inline: true },
          { name: '👨 Erkek Kayıtları', value: guildStats.maleRegisters.toString(), inline: true },
          { name: '👩 Kadın Kayıtları', value: guildStats.femaleRegisters.toString(), inline: true }
        )
        .setFooter({ text: `${message.guild.name} Kayıt Sistemi`, iconURL: message.guild.iconURL() })
        .setTimestamp();
      
      // Özel roller istatistikleri
      if (guildStats.customRegisters && Object.keys(guildStats.customRegisters).length > 0) {
        let customStatsText = '';
        
        for (const [role, count] of Object.entries(guildStats.customRegisters)) {
          customStatsText += `**${role}**: ${count}\n`;
        }
        
        embed.addFields({ name: '🎭 Özel Rol Kayıtları', value: customStatsText, inline: false });
      }
      
      // En aktif kayıt yetkilileri
      const allStaffStats = registerManager.getAllStaffStats(message.guild.id);
      const topStaffs = Object.entries(allStaffStats)
        .sort(([, a], [, b]) => b.totalRegisters - a.totalRegisters)
        .slice(0, 5);
      
      if (topStaffs.length > 0) {
        let topStaffsText = '';
        let rank = 1;
        
        for (const [staffId, stats] of topStaffs) {
          // Kullanıcıyı fetch et
          const staffUser = await client.users.fetch(staffId).catch(() => null);
          if (staffUser) {
            topStaffsText += `**${rank}. ${staffUser.tag}**: ${stats.totalRegisters} kayıt\n`;
            rank++;
          }
        }
        
        if (topStaffsText) {
          embed.addFields({ name: '👑 En Çok Kayıt Yapan Yetkililer', value: topStaffsText, inline: false });
        }
      }
      
      return message.reply({ embeds: [embed] });
    }
    
    // Kullanıcı istatistikleri embedı
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`📊 ${targetUser.tag} Kayıt Bilgileri`)
      .setDescription(`${targetUser.toString()} kullanıcısının kayıt bilgileri`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `${message.guild.name} Kayıt Sistemi`, iconURL: message.guild.iconURL() })
      .setTimestamp();
    
    // Eğer hedef kullanıcı kendisiyse veya kaydedilmiş bir kullanıcıysa
    if (isOwnStats || userData.isRegistered) {
      // Kullanıcı kayıt bilgileri
      embed.addFields(
        { name: '📝 Kayıt Durumu', value: userData.isRegistered ? '✅ Kayıtlı' : '❌ Kayıtsız', inline: true },
        { name: '🔄 Yeniden Kayıt Sayısı', value: userData.registerCount.toString(), inline: true }
      );
      
      if (userData.registeredAt) {
        const registeredDate = new Date(userData.registeredAt);
        embed.addFields({ 
          name: '⏱️ Kayıt Tarihi', 
          value: `<t:${Math.floor(registeredDate.getTime() / 1000)}:R>`, 
          inline: true 
        });
      }
      
      if (userData.registeredBy) {
        const registrar = await client.users.fetch(userData.registeredBy).catch(() => null);
        if (registrar) {
          embed.addFields({ 
            name: '👮 Kaydeden Yetkili', 
            value: `${registrar.toString()} (${registrar.tag})`, 
            inline: true 
          });
        }
      }
      
      if (userData.name) {
        embed.addFields({ name: '📝 Kayıtlı İsim', value: userData.name, inline: true });
      }
      
      if (userData.age) {
        embed.addFields({ name: '🔞 Kayıtlı Yaş', value: userData.age.toString(), inline: true });
      }
      
      if (userData.gender) {
        let genderText = "";
        
        switch (userData.gender) {
          case 'male':
            genderText = "👨 Erkek";
            break;
          case 'female':
            genderText = "👩 Kadın";
            break;
          case 'custom':
            genderText = `🎭 ${userData.customRole || 'Özel'}`;
            break;
        }
        
        embed.addFields({ name: '🧬 Cinsiyet', value: genderText, inline: true });
      }
      
      // İsim geçmişi
      const nameHistory = registerManager.getNameHistory(targetUser.id, message.guild.id);
      
      if (nameHistory && nameHistory.length > 0) {
        let historyText = '';
        let count = 1;
        
        for (const record of nameHistory) {
          const date = new Date(record.timestamp);
          const formattedDate = `<t:${Math.floor(date.getTime() / 1000)}:R>`;
          
          historyText += `**${count}.** ${record.name}${record.age ? ` | ${record.age}` : ''} - ${formattedDate}\n`;
          count++;
          
          // Sadece son 5 kaydı göster
          if (count > 5) break;
        }
        
        if (historyText) {
          embed.addFields({ name: '📜 İsim Geçmişi', value: historyText, inline: false });
        }
      }
    }
    
    // Yetkili istatistikleri
    if (staffStats.totalRegisters > 0) {
      embed.addFields({ 
        name: '📊 Yetkili İstatistikleri', 
        value: 
          `Toplam Kayıt: **${staffStats.totalRegisters}**\n` +
          `👨 Erkek: **${staffStats.maleRegisters}**\n` +
          `👩 Kadın: **${staffStats.femaleRegisters}**`, 
        inline: false 
      });
      
      // Özel roller istatistikleri
      if (staffStats.customRegisters && Object.keys(staffStats.customRegisters).length > 0) {
        let customStatsText = '';
        
        for (const [role, count] of Object.entries(staffStats.customRegisters)) {
          customStatsText += `**${role}**: ${count}\n`;
        }
        
        embed.addFields({ name: '🎭 Özel Rol Kayıtları', value: customStatsText, inline: false });
      }
      
      // Yetkilinin tüm yetkililer arasındaki sırası
      const allStaffStats = registerManager.getAllStaffStats(message.guild.id);
      const sortedStaffs = Object.entries(allStaffStats)
        .sort(([, a], [, b]) => b.totalRegisters - a.totalRegisters);
      
      const rank = sortedStaffs.findIndex(([id]) => id === targetUser.id) + 1;
      
      if (rank > 0) {
        embed.addFields({ 
          name: '🏆 Yetkili Sıralaması', 
          value: `${rank}. / ${sortedStaffs.length} yetkili arasında`, 
          inline: true 
        });
      }
    }
    
    return message.reply({ embeds: [embed] });
  }
}; 