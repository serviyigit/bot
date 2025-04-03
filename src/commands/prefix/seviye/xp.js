import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import LevelManager from '../../../utils/levelManager.js';

export default {
  name: 'xp',
  description: 'Kullanıcıların XP değerlerini yönetir',
  usage: '<ekle|çıkar|sıfırla> <@kullanıcı> [miktar]',
  aliases: ['exp', 'puan', 'xp-yönet', 'xpyönet'],
  cooldown: 3,
  guildOnly: true,
  args: true,
  category: 'seviye',
  
  async execute(message, args, client) {
    // Yönetici izni kontrolü
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ Bu komutu kullanmak için Yönetici iznine sahip olmalısınız!');
    }
    
    const levelManager = new LevelManager();
    const config = levelManager.getGuildConfig(message.guild.id);
    
    if (!config.enabled) {
      return message.reply('❌ Bu sunucuda seviye sistemi aktif değil!');
    }
    
    const action = args[0]?.toLowerCase();
    
    if (!action || !['ekle', 'add', 'çıkar', 'remove', 'sıfırla', 'reset'].includes(action)) {
      return message.reply('❌ Geçersiz işlem! `ekle`, `çıkar` veya `sıfırla` olarak belirtin.');
    }
    
    if (args.length < 2) {
      return message.reply('❌ Lütfen bir kullanıcı belirtin!');
    }
    
    // Hedef kullanıcıyı belirle
    let targetUser = message.mentions.users.first();
    
    // ID belirtildiyse
    if (!targetUser && args[1]) {
      const userId = args[1].replace(/[<@!>]/g, '');
      try {
        targetUser = await client.users.fetch(userId);
      } catch (err) {
        return message.reply('❌ Geçersiz kullanıcı! Lütfen geçerli bir kullanıcı etiketi veya ID\'si girin.');
      }
    }
    
    if (!targetUser) {
      return message.reply('❌ Kullanıcı bulunamadı! Lütfen geçerli bir kullanıcı etiketi veya ID\'si girin.');
    }
    
    if (targetUser.bot) {
      return message.reply('❌ Botların XP değerleriyle oynayamazsınız!');
    }
    
    // Kullanıcı verilerini al
    const userData = levelManager.getUserData(targetUser.id, message.guild.id);
    
    // XP Sıfırlama işlemi
    if (['sıfırla', 'reset'].includes(action)) {
      // Kullanıcı verilerini sıfırla
      levelManager.updateUserData(targetUser.id, message.guild.id, {
        xp: 0,
        level: 0,
        totalXp: 0
      });
      
      const embed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('✅ XP Sıfırlandı')
        .setDescription(`**${targetUser.username}** kullanıcısının XP ve seviye değerleri sıfırlandı!`)
        .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }
    
    // XP Ekleme veya Çıkarma işlemleri
    
    if (args.length < 3) {
      return message.reply('❌ Lütfen eklenecek veya çıkarılacak XP miktarını belirtin!');
    }
    
    const amount = parseInt(args[2]);
    
    if (isNaN(amount) || amount <= 0) {
      return message.reply('❌ Geçersiz XP miktarı! Lütfen pozitif bir sayı girin.');
    }
    
    // XP Ekleme
    if (['ekle', 'add'].includes(action)) {
      // Mevcut değerler
      const oldLevel = userData.level;
      const oldXp = userData.xp;
      const oldTotalXp = userData.totalXp;
      
      // XP ekle ve yeni seviyeyi hesapla
      // Seviye hesaplamasını LevelManager sınıfının ilgili metodu yapacak
      await levelManager.addXp({
        author: targetUser,
        guild: message.guild,
        channel: message.channel
      }, amount);
      
      // Güncellenmiş verileri al
      const updatedData = levelManager.getUserData(targetUser.id, message.guild.id);
      
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('✅ XP Eklendi')
        .setDescription(`**${targetUser.username}** kullanıcısına **${amount} XP** eklendi!`)
        .addFields(
          { name: 'Eski Seviye', value: `${oldLevel}`, inline: true },
          { name: 'Yeni Seviye', value: `${updatedData.level}`, inline: true },
          { name: 'Seviye Değişimi', value: updatedData.level > oldLevel ? `⬆️ +${updatedData.level - oldLevel}` : '⏹️ Değişmedi', inline: true },
          { name: 'Eski Toplam XP', value: `${oldTotalXp}`, inline: true },
          { name: 'Yeni Toplam XP', value: `${updatedData.totalXp}`, inline: true },
          { name: 'XP Değişimi', value: `⬆️ +${amount}`, inline: true }
        )
        .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }
    
    // XP Çıkarma
    if (['çıkar', 'remove'].includes(action)) {
      // Mevcut değerler
      const oldLevel = userData.level;
      const oldXp = userData.xp;
      const oldTotalXp = userData.totalXp;
      
      // Çıkarılacak miktar toplam XP'den fazla olmamalı
      if (amount > oldTotalXp) {
        return message.reply(`❌ Çıkarılmak istenen miktar (${amount} XP), kullanıcının toplam XP'sinden (${oldTotalXp} XP) fazla olamaz!`);
      }
      
      // Yeni toplam XP
      const newTotalXp = oldTotalXp - amount;
      
      // Yeni seviyeyi hesapla
      const newLevel = levelManager.getLevelFromXp(newTotalXp);
      
      // Seviye için gereken toplam XP
      const levelTotalXp = levelManager.calculateTotalXpForLevel(newLevel);
      
      // Kalan XP
      const newXp = newTotalXp - levelTotalXp;
      
      // Kullanıcı verilerini güncelle
      levelManager.updateUserData(targetUser.id, message.guild.id, {
        xp: newXp,
        level: newLevel,
        totalXp: newTotalXp
      });
      
      const embed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('✅ XP Çıkarıldı')
        .setDescription(`**${targetUser.username}** kullanıcısından **${amount} XP** çıkarıldı!`)
        .addFields(
          { name: 'Eski Seviye', value: `${oldLevel}`, inline: true },
          { name: 'Yeni Seviye', value: `${newLevel}`, inline: true },
          { name: 'Seviye Değişimi', value: newLevel < oldLevel ? `⬇️ -${oldLevel - newLevel}` : '⏹️ Değişmedi', inline: true },
          { name: 'Eski Toplam XP', value: `${oldTotalXp}`, inline: true },
          { name: 'Yeni Toplam XP', value: `${newTotalXp}`, inline: true },
          { name: 'XP Değişimi', value: `⬇️ -${amount}`, inline: true }
        )
        .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }
  },
}; 