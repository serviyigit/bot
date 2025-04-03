import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import RegisterManager from '../../../utils/registerManager.js';

export default {
  name: 'kayıt-yardım',
  description: 'Kayıt sistemi komutları ve kullanımları hakkında bilgi verir',
  usage: '',
  aliases: ['kayıtyardım', 'register-help', 'register-yardım'],
  cooldown: 5,
  guildOnly: true,
  category: 'kayıt',
  
  async execute(message, args, client) {
    const registerManager = new RegisterManager();
    const config = registerManager.getGuildConfig(message.guild.id);
    const prefix = message.prefix || process.env.PREFIX || '!';
    
    // Ana sayfa embedı
    const mainEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📝 Kayıt Sistemi Yardım')
      .setDescription(`Kayıt sistemini kullanmak ve yönetmek için kapsamlı rehber. Bu sistem, sunucuya yeni katılan üyelerin kaydedilmesini ve roller almasını sağlar.`)
      .addFields(
        { 
          name: '📋 Sistem Durumu', 
          value: config.enabled ? '✅ Aktif' : '❌ Devre Dışı', 
          inline: true 
        },
        { 
          name: '🛠️ Komut Prefix', 
          value: `\`${prefix}\``, 
          inline: true 
        },
        { 
          name: '📚 Yardım Kategorileri', 
          value: 
          `**1️⃣ Genel Komutlar** - Temel kayıt komutları\n` +
          `**2️⃣ Ayarlar** - Sistem ayarları ve yapılandırma\n` +
          `**3️⃣ Roller ve İzinler** - Kayıt sistemi için roller\n` +
          `**4️⃣ Örnek Kullanım** - Örnek senaryolar`
        }
      )
      .setFooter({ text: `${message.guild.name} Kayıt Sistemi • Sayfa 1/5`, iconURL: message.guild.iconURL() })
      .setTimestamp();
    
    // Genel Komutlar sayfası
    const commandsEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('1️⃣ Genel Kayıt Komutları')
      .setDescription('Kayıt sistemi için temel komutlar ve kullanımları')
      .addFields(
        { 
          name: `🔹 ${prefix}kayıt`, 
          value: 
          `Kullanıcıyı sunucuya kaydeder.\n` +
          `**Kullanım:** \`${prefix}kayıt @kullanıcı isim [yaş] [cinsiyet]\`\n` +
          `**Örnek:** \`${prefix}kayıt @TurboMx Ahmet 20 erkek\`\n` +
          `**Alternatifler:** \`${prefix}register\`, \`${prefix}k\`, \`${prefix}kaydet\``,
          inline: false 
        },
        { 
          name: `🔹 ${prefix}kayıtsız`, 
          value: 
          `Kullanıcıyı kayıtsıza atar.\n` +
          `**Kullanım:** \`${prefix}kayıtsız @kullanıcı [sebep]\`\n` +
          `**Örnek:** \`${prefix}kayıtsız @TurboMx Yanlış kayıt\`\n` +
          `**Alternatifler:** \`${prefix}unregister\`, \`${prefix}kayıtsıza-at\`, \`${prefix}unreg\``,
          inline: false 
        },
        { 
          name: `🔹 ${prefix}kayıt-bilgi`, 
          value: 
          `Kayıt istatistiklerini ve bilgilerini gösterir.\n` +
          `**Kullanım:** \`${prefix}kayıt-bilgi [kullanıcı]\`\n` +
          `**Örnek:** \`${prefix}kayıt-bilgi @TurboMx\`\n` +
          `**Sunucu istatistikleri:** \`${prefix}kayıt-bilgi sunucu\`\n` +
          `**Alternatifler:** \`${prefix}kayıtbilgi\`, \`${prefix}register-info\`, \`${prefix}kayıt-stat\``,
          inline: false 
        },
        { 
          name: `🔹 ${prefix}kayıt-yardım`, 
          value: 
          `Bu yardım menüsünü gösterir.\n` +
          `**Kullanım:** \`${prefix}kayıt-yardım\`\n` +
          `**Alternatifler:** \`${prefix}kayıtyardım\`, \`${prefix}register-help\``,
          inline: false 
        }
      )
      .setFooter({ text: `${message.guild.name} Kayıt Sistemi • Sayfa 2/5`, iconURL: message.guild.iconURL() })
      .setTimestamp();
    
    // Ayarlar sayfası
    const settingsEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('2️⃣ Kayıt Sistemi Ayarları')
      .setDescription(`Kayıt sistemini yapılandırmak için \`${prefix}kayıt-ayarla\` komutunu kullanabilirsiniz.`)
      .addFields(
        { 
          name: `🔹 ${prefix}kayıt-ayarla`, 
          value: 
          `Kayıt sistemi ayarlarını yapılandırır.\n` +
          `**Kullanım:** \`${prefix}kayıt-ayarla <ayar> <değer>\`\n` +
          `**Örnek:** \`${prefix}kayıt-ayarla yetkili-rol @KayıtYetkilisi\`\n` +
          `**Alternatifler:** \`${prefix}kayıtayarla\`, \`${prefix}register-settings\``,
          inline: false 
        },
        { 
          name: '🔹 Temel Ayarlar', 
          value: 
          `\`${prefix}kayıt-ayarla aç\` - Sistemi etkinleştirir\n` +
          `\`${prefix}kayıt-ayarla kapat\` - Sistemi devre dışı bırakır\n` +
          `\`${prefix}kayıt-ayarla liste\` - Tüm ayarları gösterir\n` +
          `\`${prefix}kayıt-ayarla sıfırla onayla\` - Tüm ayarları sıfırlar`,
          inline: false 
        },
        { 
          name: '🔹 Kanal Ayarları', 
          value: 
          `\`${prefix}kayıt-ayarla hoşgeldin-kanal #kanal\` - Hoşgeldin mesajları kanalı\n` +
          `\`${prefix}kayıt-ayarla kayıt-kanal #kanal\` - Kayıt komutlarının kullanılacağı kanal\n` +
          `\`${prefix}kayıt-ayarla log-kanal #kanal\` - Kayıt loglarının gönderileceği kanal`,
          inline: false 
        },
        { 
          name: '🔹 Rol Ayarları', 
          value: 
          `\`${prefix}kayıt-ayarla yetkili-rol @rol\` - Kayıt yetkilisi rolü\n` +
          `\`${prefix}kayıt-ayarla kayıtsız-rol @rol\` - Kayıtsız üye rolü\n` +
          `\`${prefix}kayıt-ayarla üye-rol @rol\` - Temel üye rolü\n` +
          `\`${prefix}kayıt-ayarla erkek-rol @rol\` - Erkek rolü\n` +
          `\`${prefix}kayıt-ayarla kadın-rol @rol\` - Kadın rolü\n` +
          `\`${prefix}kayıt-ayarla özel-rol-ekle <isim> @rol\` - Özel rol ekler\n` +
          `\`${prefix}kayıt-ayarla özel-rol-sil <isim>\` - Özel rolü siler`,
          inline: false 
        },
        { 
          name: '🔹 Diğer Ayarlar', 
          value: 
          `\`${prefix}kayıt-ayarla hoşgeldin-mesaj <mesaj>\` - Hoşgeldin mesajını ayarlar\n` +
          `\`${prefix}kayıt-ayarla isim-format <format>\` - İsim formatını ayarlar (Örn: {name} | {age})\n` +
          `\`${prefix}kayıt-ayarla min-yaş <sayı>\` - Minimum yaş sınırını ayarlar\n` +
          `\`${prefix}kayıt-ayarla yaş-zorunlu <evet/hayır>\` - Yaş zorunluluğunu ayarlar\n` +
          `\`${prefix}kayıt-ayarla otomatik-kayıt <evet/hayır>\` - Otomatik kayıt özelliğini ayarlar`,
          inline: false 
        }
      )
      .setFooter({ text: `${message.guild.name} Kayıt Sistemi • Sayfa 3/5`, iconURL: message.guild.iconURL() })
      .setTimestamp();
    
    // Roller ve İzinler sayfası
    const rolesEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('3️⃣ Roller ve İzinler')
      .setDescription('Kayıt sistemi için gerekli roller ve izinler')
      .addFields(
        { 
          name: '👑 Yetkili Rolü', 
          value: 
          `Kayıt yetkilisi rolü, kullanıcıları kaydetme yetkisine sahiptir.\n` +
          `**Mevcut:** ${config.staffRole ? `<@&${config.staffRole}>` : 'Ayarlanmamış'}\n` +
          `**Ayarlama:** \`${prefix}kayıt-ayarla yetkili-rol @rol\``,
          inline: false 
        },
        { 
          name: '🔒 Kayıtsız Rolü', 
          value: 
          `Sunucuya yeni katılan kullanıcılara verilen ve kayıt sonrası kaldırılan rol.\n` +
          `**Mevcut:** ${config.unregisteredRole ? `<@&${config.unregisteredRole}>` : 'Ayarlanmamış'}\n` +
          `**Ayarlama:** \`${prefix}kayıt-ayarla kayıtsız-rol @rol\``,
          inline: false 
        },
        { 
          name: '👥 Üye Rolü', 
          value: 
          `Kayıt olduktan sonra tüm kullanıcılara verilen temel rol.\n` +
          `**Mevcut:** ${config.memberRole ? `<@&${config.memberRole}>` : 'Ayarlanmamış'}\n` +
          `**Ayarlama:** \`${prefix}kayıt-ayarla üye-rol @rol\``,
          inline: false 
        },
        { 
          name: '👨 Erkek Rolü', 
          value: 
          `Erkek olarak kaydedilen kullanıcılara verilen rol.\n` +
          `**Mevcut:** ${config.maleRole ? `<@&${config.maleRole}>` : 'Ayarlanmamış'}\n` +
          `**Ayarlama:** \`${prefix}kayıt-ayarla erkek-rol @rol\``,
          inline: false 
        },
        { 
          name: '👩 Kadın Rolü', 
          value: 
          `Kadın olarak kaydedilen kullanıcılara verilen rol.\n` +
          `**Mevcut:** ${config.femaleRole ? `<@&${config.femaleRole}>` : 'Ayarlanmamış'}\n` +
          `**Ayarlama:** \`${prefix}kayıt-ayarla kadın-rol @rol\``,
          inline: false 
        },
        { 
          name: '🎭 Özel Roller', 
          value: 
          `Özel roller, alternatif cinsiyet veya grup rollerini tanımlamak için kullanılır.\n` +
          `**Mevcut Özel Roller:** ${config.customRoles && Object.keys(config.customRoles).length > 0 ? 
            Object.entries(config.customRoles).map(([name, id]) => `**${name}**: <@&${id}>`).join('\n') : 
            'Ayarlanmamış'}\n` +
          `**Ekleme:** \`${prefix}kayıt-ayarla özel-rol-ekle <isim> @rol\`\n` +
          `**Silme:** \`${prefix}kayıt-ayarla özel-rol-sil <isim>\``,
          inline: false 
        }
      )
      .setFooter({ text: `${message.guild.name} Kayıt Sistemi • Sayfa 4/5`, iconURL: message.guild.iconURL() })
      .setTimestamp();
    
    // Örnek Kullanımlar sayfası
    const examplesEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('4️⃣ Örnek Kullanımlar')
      .setDescription('Kayıt sistemi komutlarının örnek kullanımları')
      .addFields(
        { 
          name: '📝 Sistemi Kurma', 
          value: 
          `1. \`${prefix}kayıt-ayarla aç\` - Sistemi etkinleştir\n` +
          `2. \`${prefix}kayıt-ayarla kayıtsız-rol @Kayıtsız\` - Kayıtsız rolünü ayarla\n` +
          `3. \`${prefix}kayıt-ayarla üye-rol @Üye\` - Üye rolünü ayarla\n` +
          `4. \`${prefix}kayıt-ayarla erkek-rol @Erkek\` - Erkek rolünü ayarla\n` +
          `5. \`${prefix}kayıt-ayarla kadın-rol @Kadın\` - Kadın rolünü ayarla\n` +
          `6. \`${prefix}kayıt-ayarla yetkili-rol @KayıtYetkilisi\` - Yetkili rolünü ayarla\n` +
          `7. \`${prefix}kayıt-ayarla kayıt-kanal #kayıt-odası\` - Kayıt kanalını ayarla\n` +
          `8. \`${prefix}kayıt-ayarla log-kanal #kayıt-log\` - Log kanalını ayarla\n` +
          `9. \`${prefix}kayıt-ayarla hoşgeldin-kanal #hoşgeldin\` - Hoşgeldin kanalını ayarla`,
          inline: false 
        },
        { 
          name: '📋 Kullanıcı Kaydetme', 
          value: 
          `• \`${prefix}kayıt @TurboMx Ahmet 20 erkek\` - Kullanıcıyı erkek olarak kaydet\n` +
          `• \`${prefix}kayıt @TurboMx Ayşe 22 kadın\` - Kullanıcıyı kadın olarak kaydet\n` +
          `• \`${prefix}kayıt @TurboMx Ali VIP\` - Kullanıcıyı özel rol ile kaydet (VIP özel rolü tanımlanmışsa)`,
          inline: false 
        },
        { 
          name: '🚪 Kayıtsıza Atma', 
          value: 
          `• \`${prefix}kayıtsız @TurboMx\` - Kullanıcıyı kayıtsıza at\n` +
          `• \`${prefix}kayıtsız @TurboMx Yanlış kayıt\` - Sebep belirterek kayıtsıza at`,
          inline: false 
        },
        { 
          name: '📊 İstatistikleri Görüntüleme', 
          value: 
          `• \`${prefix}kayıt-bilgi\` - Kendi kayıt istatistiklerini görüntüle\n` +
          `• \`${prefix}kayıt-bilgi @TurboMx\` - Belirli bir kullanıcının bilgilerini görüntüle\n` +
          `• \`${prefix}kayıt-bilgi sunucu\` - Sunucunun kayıt istatistiklerini görüntüle`,
          inline: false 
        }
      )
      .setFooter({ text: `${message.guild.name} Kayıt Sistemi • Sayfa 5/5`, iconURL: message.guild.iconURL() })
      .setTimestamp();
    
    // Sayfaları bir diziye ekle
    const pages = [
      mainEmbed,
      commandsEmbed,
      settingsEmbed,
      rolesEmbed,
      examplesEmbed
    ];
    
    // Navigasyon butonları
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('Önceki')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('⬅️'),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('Sonraki')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('➡️')
    );
    
    // İlk sayfayı gönder
    let currentPage = 0;
    const sentMessage = await message.reply({
      embeds: [pages[currentPage]],
      components: [row]
    });
    
    // Buton koleksiyonunu oluştur (sadece mesajı gönderen kullanıcının etkileşimlerine yanıt ver)
    const collector = sentMessage.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 300000 // 5 dakika
    });
    
    collector.on('collect', async interaction => {
      if (interaction.customId === 'prev') {
        currentPage = currentPage > 0 ? currentPage - 1 : pages.length - 1;
      } else if (interaction.customId === 'next') {
        currentPage = currentPage < pages.length - 1 ? currentPage + 1 : 0;
      }
      
      await interaction.update({
        embeds: [pages[currentPage]],
        components: [row]
      });
    });
    
    // Koleksiyon sona erdiğinde butonları devre dışı bırak
    collector.on('end', async () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('Önceki')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('⬅️')
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Sonraki')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('➡️')
          .setDisabled(true)
      );
      
      try {
        await sentMessage.edit({
          components: [disabledRow]
        });
      } catch (error) {
        console.error('Butonları devre dışı bırakma hatası:', error);
      }
    });
  }
}; 