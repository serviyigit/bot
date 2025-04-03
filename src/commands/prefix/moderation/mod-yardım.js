import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import ModerationManager from '../../../utils/moderationManager.js';

export default {
  name: 'mod-yardım',
  description: 'Moderasyon sistemi komutları ve ayarları hakkında bilgi verir',
  usage: '',
  aliases: ['modyardım', 'modhelp', 'moderasyon-yardım', 'modsystem'],
  cooldown: 10,
  guildOnly: true,
  category: 'moderation',
  
  async execute(message, args, client) {
    // Prefix'i belirle
    const prefix = message.prefix || process.env.PREFIX || '!';
    
    // Moderation Manager'ı başlat ve mevcut ayarları al
    const moderationManager = new ModerationManager();
    const config = moderationManager.getConfig();
    
    // Ana yardım menüsü
    const mainEmbed = new EmbedBuilder()
      .setColor(config.embedColor || '#0099ff')
      .setTitle('📋 Moderasyon Sistemi Yardım')
      .setDescription(`Moderasyon sistemini yapılandırmak ve kullanmak için kapsamlı rehber.\n\nTemel Komut: \`${prefix}mod-ayarla <ayar> <değer>\``)
      .addFields(
        { 
          name: '🛡️ Moderasyon Sistemi Nedir?', 
          value: 'Sunucunuzu korumak, kurallarınızı uygulamak ve üyelerinizi yönetmek için tasarlanmış araçlar bütünüdür. Ban, kick, mute gibi temel moderasyon işlemlerini otomatikleştirir ve kayıt altına alır.'
        },
        { 
          name: '📚 Yardım Kategorileri', 
          value: 
          `**1️⃣ Yetki Ayarları** - Moderasyon yetkililerini belirleme\n` +
          `**2️⃣ Ceza Sistemi** - Susturma, uyarı ve ceza ayarları\n` +
          `**3️⃣ Karşılama Sistemi** - Hoşgeldin/Baybay ve otorol\n` +
          `**4️⃣ Log Ayarları** - Moderasyon ve sunucu logları\n` +
          `**5️⃣ Anti-Spam** - Spam koruması ve önlemleri\n` +
          `**6️⃣ Diğer Ayarlar** - Görünüm ve ek özellikler\n` +
          `**7️⃣ Moderasyon Komutları** - Temel mod komutlarının kullanımı`
        }
      )
      .setFooter({ text: `${message.guild.name} Moderasyon Sistemi • Sayfa 1/8`, iconURL: message.guild.iconURL() })
      .setTimestamp();
    
    // Yetki Ayarları sayfası
    const authoritiesEmbed = new EmbedBuilder()
      .setColor(config.embedColor || '#0099ff')
      .setTitle('1️⃣ Moderasyon Yetki Ayarları')
      .setDescription('Hangi rollerin hangi moderasyon yetkilerine sahip olacağını belirleyin.')
      .addFields(
        { 
          name: '👑 Ban Yetkilisi', 
          value: 
          `\`${prefix}mod-ayarla ban-yetkili <@rol>\`\n` +
          `Kullanıcıları banlama yetkisine sahip rolü ayarlar.\n` +
          `**Mevcut:** ${config.banRoleId ? `<@&${config.banRoleId}>` : 'Ayarlanmamış'}\n` +
          `**Sıfırla:** \`${prefix}mod-ayarla ban-yetkili-sil\``
        },
        { 
          name: '🚪 Kick Yetkilisi', 
          value: 
          `\`${prefix}mod-ayarla kick-yetkili <@rol>\`\n` +
          `Kullanıcıları sunucudan atma yetkisine sahip rolü ayarlar.\n` +
          `**Mevcut:** ${config.kickRoleId ? `<@&${config.kickRoleId}>` : 'Ayarlanmamış'}\n` +
          `**Sıfırla:** \`${prefix}mod-ayarla kick-yetkili-sil\``
        },
        { 
          name: '🔇 Mute Yetkilisi', 
          value: 
          `\`${prefix}mod-ayarla mute-yetkili <@rol>\`\n` +
          `Kullanıcıları susturma yetkisine sahip rolü ayarlar.\n` +
          `**Mevcut:** ${config.muteRoleId ? `<@&${config.muteRoleId}>` : 'Ayarlanmamış'}\n` +
          `**Sıfırla:** \`${prefix}mod-ayarla mute-yetkili-sil\``
        },
        { 
          name: '💡 İpucu', 
          value: 'Eğer bu roller ayarlanmazsa, sadece ilgili Discord izinlerine (Ban Members, Kick Members, Manage Messages) sahip kullanıcılar bu komutları kullanabilir.'
        }
      )
      .setFooter({ text: `${message.guild.name} Moderasyon Sistemi • Sayfa 2/8`, iconURL: message.guild.iconURL() })
      .setTimestamp();
    
    // Ceza Sistemi sayfası
    const punishmentEmbed = new EmbedBuilder()
      .setColor(config.embedColor || '#0099ff')
      .setTitle('2️⃣ Ceza Sistemi Ayarları')
      .setDescription('Ceza sisteminin nasıl işleyeceğini özelleştirin. Susturma rolü, uyarı limitleri ve otomatik cezalar.')
      .addFields(
        { 
          name: '🔕 Susturulmuş Rolü', 
          value: 
          `\`${prefix}mod-ayarla muted-rol <@rol>\`\n` +
          `Susturulan kullanıcılara verilen rolü ayarlar.\n` +
          `**Mevcut:** ${config.mutedRoleId ? `<@&${config.mutedRoleId}>` : 'Ayarlanmamış'}\n` +
          `**Sıfırla:** \`${prefix}mod-ayarla muted-rol-sil\``
        },
        { 
          name: '⚠️ Maksimum Uyarı Sayısı', 
          value: 
          `\`${prefix}mod-ayarla max-uyari <sayı>\`\n` +
          `Kullanıcı bu uyarı sayısına ulaştığında otomatik ceza alır.\n` +
          `**Mevcut:** ${config.maxWarnings || 3}\n` +
          `**Örnek:** \`${prefix}mod-ayarla max-uyari 5\``
        },
        { 
          name: '⛔ Uyarı Limiti Aşıldığında Uygulanacak Ceza', 
          value: 
          `\`${prefix}mod-ayarla uyari-ceza <mute/kick/ban>\`\n` +
          `Kullanıcı maksimum uyarı sayısına ulaştığında uygulanacak ceza.\n` +
          `**Mevcut:** ${config.warningPunishment || 'mute'}\n` +
          `**Geçerli Değerler:** mute, kick, ban`
        },
        { 
          name: '⏱️ Uyarı Süresi', 
          value: 
          `\`${prefix}mod-ayarla uyari-sure <saniye>\`\n` +
          `Uyarıların otomatik silinme süresi (saniye cinsinden, 0 = süresiz).\n` +
          `**Mevcut:** ${Math.floor((config.warningTimeout || 604800000) / 1000)} saniye (${Math.floor((config.warningTimeout || 604800000) / 86400000)} gün)\n` +
          `**Örnek:** \`${prefix}mod-ayarla uyari-sure 86400\` (1 gün)`
        }
      )
      .setFooter({ text: `${message.guild.name} Moderasyon Sistemi • Sayfa 3/8`, iconURL: message.guild.iconURL() })
      .setTimestamp();
    
    // Karşılama Sistemi sayfası
    const welcomeEmbed = new EmbedBuilder()
      .setColor(config.embedColor || '#0099ff')
      .setTitle('3️⃣ Karşılama Sistemi Ayarları')
      .setDescription('Yeni katılan ve ayrılan üyeler için mesajlar ve otomatik rol atamaları.')
      .addFields(
        { 
          name: '👋 Hoşgeldin/Baybay Kanalı', 
          value: 
          `\`${prefix}mod-ayarla hosgeldin-kanal <#kanal>\`\n` +
          `Giriş ve çıkış mesajlarının gönderileceği kanalı ayarlar.\n` +
          `**Mevcut:** ${config.welcomeChannelId ? `<#${config.welcomeChannelId}>` : 'Ayarlanmamış'}\n` +
          `**Sıfırla:** \`${prefix}mod-ayarla hosgeldin-kanal-sil\``
        },
        { 
          name: '💬 Hoşgeldin Mesajı', 
          value: 
          `\`${prefix}mod-ayarla hosgeldin-mesaj <mesaj>\`\n` +
          `Sunucuya yeni katılan üyelere gösterilecek mesaj.\n` +
          `**Mevcut:** \`${config.welcomeMessage || '{user} sunucuya katıldı! Şu anda {memberCount} kişiyiz.'}\`\n` +
          `**Değişkenler:** {user}, {server}, {memberCount}\n` +
          `**Örnek:** \`${prefix}mod-ayarla hosgeldin-mesaj Hoş geldin {user}! {server} sunucusuna hoş geldin. Seninle birlikte {memberCount} kişi olduk.\``
        },
        { 
          name: '👋 Baybay Mesajı', 
          value: 
          `\`${prefix}mod-ayarla baybay-mesaj <mesaj>\`\n` +
          `Sunucudan ayrılan üyeler için gösterilecek mesaj.\n` +
          `**Mevcut:** \`${config.leaveMessage || '{user} sunucudan ayrıldı! {memberCount} kişi kaldık.'}\`\n` +
          `**Değişkenler:** {user}, {server}, {memberCount}`
        },
        { 
          name: '🎭 Otorol', 
          value: 
          `\`${prefix}mod-ayarla otorol <@rol>\`\n` +
          `Sunucuya yeni katılan üyelere otomatik verilecek rolü ayarlar.\n` +
          `**Mevcut:** ${config.autoRoleId ? `<@&${config.autoRoleId}>` : 'Ayarlanmamış'}\n` +
          `**Durum:** ${config.autoRoleEnabled ? '✅ Aktif' : '❌ Devre Dışı'}\n` +
          `**Açma/Kapatma:** \`${prefix}mod-ayarla otorol-ac\` / \`${prefix}mod-ayarla otorol-kapat\`\n` +
          `**Sıfırla:** \`${prefix}mod-ayarla otorol-sil\``
        }
      )
      .setFooter({ text: `${message.guild.name} Moderasyon Sistemi • Sayfa 4/8`, iconURL: message.guild.iconURL() })
      .setTimestamp();
    
    // Log Ayarları sayfası
    const logsEmbed = new EmbedBuilder()
      .setColor(config.embedColor || '#0099ff')
      .setTitle('4️⃣ Log Ayarları')
      .setDescription('Moderasyon işlemlerini ve sunucu olaylarını kaydetmek için log kanalları.')
      .addFields(
        { 
          name: '🔨 Moderasyon Logları', 
          value: 
          `\`${prefix}mod-ayarla mod-log <#kanal>\`\n` +
          `Ban, kick, mute gibi moderasyon işlemlerinin kaydedileceği kanalı ayarlar.\n` +
          `**Mevcut:** ${config.modLogChannelId ? `<#${config.modLogChannelId}>` : 'Ayarlanmamış'}\n` +
          `**Sıfırla:** \`${prefix}mod-ayarla mod-log-sil\``
        },
        { 
          name: '📊 Sunucu Logları', 
          value: 
          `\`${prefix}mod-ayarla server-log <#kanal>\`\n` +
          `Üye giriş-çıkış, rol değişiklikleri gibi sunucu olaylarının kaydedileceği kanalı ayarlar.\n` +
          `**Mevcut:** ${config.serverLogChannelId ? `<#${config.serverLogChannelId}>` : 'Ayarlanmamış'}\n` +
          `**Sıfırla:** \`${prefix}mod-ayarla server-log-sil\``
        },
        { 
          name: '💡 Log Türleri', 
          value: 
          `**Moderasyon Loglarında Kaydedilenler:**\n` +
          `• Ban, unban işlemleri\n` +
          `• Kick işlemleri\n` +
          `• Mute, unmute işlemleri\n` +
          `• Uyarı işlemleri\n\n` +
          `**Sunucu Loglarında Kaydedilenler:**\n` +
          `• Üye giriş/çıkışları\n` +
          `• Rol değişiklikleri\n` +
          `• Kanal oluşturma/silme\n` +
          `• Mesaj silme/düzenleme olayları`
        }
      )
      .setFooter({ text: `${message.guild.name} Moderasyon Sistemi • Sayfa 5/8`, iconURL: message.guild.iconURL() })
      .setTimestamp();
    
    // Anti-Spam sayfası
    const antiSpamEmbed = new EmbedBuilder()
      .setColor(config.embedColor || '#0099ff')
      .setTitle('5️⃣ Anti-Spam Ayarları')
      .setDescription('Hızlı ve tekrarlayan mesajlara karşı koruma sağlayın.')
      .addFields(
        { 
          name: '🔐 Anti-Spam Durumu', 
          value: 
          `\`${prefix}mod-ayarla anti-spam-ac\` / \`${prefix}mod-ayarla anti-spam-kapat\`\n` +
          `Anti-spam sistemini açar veya kapatır.\n` +
          `**Mevcut Durum:** ${config.antiSpamEnabled ? '✅ Aktif' : '❌ Devre Dışı'}`
        },
        { 
          name: '📊 Spam Algılama Eşiği', 
          value: 
          `\`${prefix}mod-ayarla anti-spam-esik <sayı>\`\n` +
          `Belirli süre içinde kaç mesaj atılırsa spam olarak algılanacağını belirler.\n` +
          `**Mevcut:** ${config.antiSpamThreshold || 5} mesaj\n` +
          `**Örnek:** \`${prefix}mod-ayarla anti-spam-esik 4\``
        },
        { 
          name: '⏱️ Spam Algılama Aralığı', 
          value: 
          `\`${prefix}mod-ayarla anti-spam-aralik <milisaniye>\`\n` +
          `Belirtilen mesaj sayısının kaç milisaniye içinde gönderilirse spam olarak algılanacağını belirler.\n` +
          `**Mevcut:** ${config.antiSpamInterval || 3000} milisaniye\n` +
          `**Örnek:** \`${prefix}mod-ayarla anti-spam-aralik 5000\` (5 saniye)`
        },
        { 
          name: '🔨 Spam Cezası', 
          value: 
          `\`${prefix}mod-ayarla anti-spam-ceza <mute/kick>\`\n` +
          `Spam yapan kullanıcılara uygulanacak cezayı belirler.\n` +
          `**Mevcut:** ${config.antiSpamAction || 'mute'}\n` +
          `**Geçerli Değerler:** mute, kick`
        },
        { 
          name: '⏱️ Spam Mute Süresi', 
          value: 
          `\`${prefix}mod-ayarla anti-spam-mute-sure <milisaniye>\`\n` +
          `Spam nedeniyle susturulan kullanıcının ne kadar süre susturulacağını belirler.\n` +
          `**Mevcut:** ${config.antiSpamMuteDuration || 300000} milisaniye (${Math.floor((config.antiSpamMuteDuration || 300000) / 60000)} dakika)\n` +
          `**Örnek:** \`${prefix}mod-ayarla anti-spam-mute-sure 600000\` (10 dakika)`
        }
      )
      .setFooter({ text: `${message.guild.name} Moderasyon Sistemi • Sayfa 6/8`, iconURL: message.guild.iconURL() })
      .setTimestamp();
    
    // Diğer Ayarlar sayfası
    const otherSettingsEmbed = new EmbedBuilder()
      .setColor(config.embedColor || '#0099ff')
      .setTitle('6️⃣ Diğer Ayarlar')
      .setDescription('Moderasyon sisteminin görsel ve ek özelliklerini ayarlayın.')
      .addFields(
        { 
          name: '🎨 Embed Rengi', 
          value: 
          `\`${prefix}mod-ayarla renk <hex_kodu>\`\n` +
          `Moderasyon embedlerinin rengini ayarlar.\n` +
          `**Mevcut:** ${config.embedColor || '#0099ff'}\n` +
          `**Örnek:** \`${prefix}mod-ayarla renk #FF0000\` (Kırmızı)`
        },
        { 
          name: '📜 Ayarları Görüntüleme', 
          value: `Tüm ayarları görüntülemek için: \`${prefix}mod-ayarla liste\``
        },
        { 
          name: '💡 Gelecek Özellikleri', 
          value: 
          `• Özel ceza sebepleri ve şablonları\n` +
          `• Otomatik moderasyon kuralları\n` +
          `• Kara liste kelimeleri\n` +
          `• Rol bazlı komut kullanım izinleri`
        }
      )
      .setFooter({ text: `${message.guild.name} Moderasyon Sistemi • Sayfa 7/8`, iconURL: message.guild.iconURL() })
      .setTimestamp();
    
    // Moderasyon Komutları sayfası
    const commandsEmbed = new EmbedBuilder()
      .setColor(config.embedColor || '#0099ff')
      .setTitle('7️⃣ Moderasyon Komutları')
      .setDescription('Temel moderasyon komutlarının kullanımı.')
      .addFields(
        { 
          name: '🔨 Ban Komutu', 
          value: `\`${prefix}ban <@kullanıcı> [sebep] [süre]\`\nBir kullanıcıyı sunucudan yasaklar.`
        },
        { 
          name: '⏱️ Geçici Ban', 
          value: `\`${prefix}ban <@kullanıcı> [sebep] 7g\`\nSüre formatları: s (saniye), d (dakika), h (saat), g (gün)`
        },
        { 
          name: '🔄 Unban', 
          value: `\`${prefix}unban <kullanıcı_id>\`\nBir kullanıcının yasağını kaldırır.`
        },
        { 
          name: '👢 Kick', 
          value: `\`${prefix}kick <@kullanıcı> [sebep]\`\nBir kullanıcıyı sunucudan atar.`
        },
        { 
          name: '🔇 Mute', 
          value: `\`${prefix}mute <@kullanıcı> [süre] [sebep]\`\nBir kullanıcıyı belirli süre susturur.`
        },
        { 
          name: '🔊 Unmute', 
          value: `\`${prefix}unmute <@kullanıcı>\`\nBir kullanıcının susturmasını kaldırır.`
        },
        { 
          name: '⚠️ Warn', 
          value: `\`${prefix}warn <@kullanıcı> [sebep]\`\nBir kullanıcıya uyarı verir.`
        },
        { 
          name: '📋 Warnings', 
          value: `\`${prefix}warnings <@kullanıcı>\`\nBir kullanıcının uyarılarını görüntüler.`
        },
        { 
          name: '🗑️ Purge', 
          value: `\`${prefix}purge <sayı>\`\nBelirtilen sayıda mesajı siler.`
        },
        { 
          name: '📊 Mod Stats', 
          value: `\`${prefix}mod-stats\`\nModerasyon istatistiklerini görüntüler.`
        }
      )
      .setFooter({ text: `${message.guild.name} Moderasyon Sistemi • Sayfa 8/8`, iconURL: message.guild.iconURL() })
      .setTimestamp();
    
    // Sayfaların bir dizisini oluştur
    const embedPages = [
      mainEmbed,
      authoritiesEmbed,
      punishmentEmbed,
      welcomeEmbed,
      logsEmbed,
      antiSpamEmbed,
      otherSettingsEmbed,
      commandsEmbed
    ];
    
    // Başlangıç sayfası
    let currentPage = 0;
    
    // Navigasyon butonları
    const createButtons = (disabledPrev, disabledNext) => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setEmoji('⬅️')
          .setLabel('Önceki')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(disabledPrev),
        new ButtonBuilder()
          .setCustomId('next')
          .setEmoji('➡️')
          .setLabel('Sonraki')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(disabledNext)
      );
    };
    
    // İlk butonları oluştur
    const buttons = createButtons(currentPage === 0, currentPage === embedPages.length - 1);
    
    // İlk mesajı gönder
    const sentMessage = await message.channel.send({
      embeds: [embedPages[currentPage]],
      components: [buttons]
    });
    
    // Buton koleksiyonunu oluştur
    const collector = sentMessage.createMessageComponentCollector({ 
      time: 300000, // 5 dakika
      filter: i => i.user.id === message.author.id
    });
    
    // Buton basışlarını yönet
    collector.on('collect', async (interaction) => {
      // Etkileşimi ertele
      await interaction.deferUpdate();
      
      // Önceki veya sonraki sayfaya git
      if (interaction.customId === 'prev') {
        currentPage--;
      } else if (interaction.customId === 'next') {
        currentPage++;
      }
      
      // Butonları güncelle
      const updatedButtons = createButtons(
        currentPage === 0, 
        currentPage === embedPages.length - 1
      );
      
      // Mesajı güncelle
      await sentMessage.edit({
        embeds: [embedPages[currentPage]],
        components: [updatedButtons]
      });
    });
    
    // Koleksiyon sona erdiğinde butonları devre dışı bırak
    collector.on('end', () => {
      const disabledButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setEmoji('⬅️')
          .setLabel('Önceki')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next')
          .setEmoji('➡️')
          .setLabel('Sonraki')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true)
      );
      
      sentMessage.edit({ components: [disabledButtons] }).catch(() => {});
    });
  },
}; 