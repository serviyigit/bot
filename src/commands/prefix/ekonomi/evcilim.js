import { EmbedBuilder } from 'discord.js';
import EconomyManager from '../../../utils/economyManager.js';

export default {
  name: 'evcilim',
  description: 'OwO! Evcil hayvanlarını ve istatistiklerini gösterir',
  usage: '[besle/oyna/bilgi/liste] [hayvan-id]',
  aliases: ['pet', 'pets', 'hayvan', 'hayvanlar', 'evcil'],
  cooldown: 5,
  category: 'ekonomi',
  
  async execute(message, args, client) {
    const economyManager = new EconomyManager();
    const config = economyManager.getConfig();
    const userProfile = economyManager.getUserProfile(message.author.id);
    
    const subCommand = args[0] ? args[0].toLowerCase() : null;
    const targetPetId = args[1] || null;
    
    if (!subCommand || subCommand === 'liste' || subCommand === 'list') {
      const pets = economyManager.getUserPets(message.author.id);
      
      if (pets.length === 0) {
        const noPetsEmbed = new EmbedBuilder()
          .setColor('#FF9999')
          .setTitle('OwO! Hiç evcil hayvanın yok!')
          .setDescription(
            'Henüz hiç evcil hayvanın yok!\n\n' +
            '💡 **Nasıl hayvan bulunur?**\n' +
            '• `avlan` komutuyla ormanlardan hayvanlar bulabilirsin!\n' +
            '• `balık-tut` komutuyla su hayvanları bulabilirsin!\n' +
            '• Market\'ten bir kafes satın alarak doğrudan hayvan bulabilirsin!'
          )
          .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        
        return message.reply({ embeds: [noPetsEmbed] });
      }
      
      const activePetId = userProfile.activePet;
      const activePet = activePetId ? pets.find(p => p.id === activePetId) : null;
      
      const petEmbed = new EmbedBuilder()
        .setColor('#9370DB')
        .setTitle('🐾 Evcil Hayvanların!')
        .setDescription(
          `${message.author} toplamda **${pets.length}** evcil hayvana sahipsin!\n\n` +
          (activePet ? 
            `**Aktif Evcil Hayvan:**\n${activePet.emoji} ${activePet.name} (Lvl ${activePet.level})\n` :
            '*Henüz aktif bir evcil hayvanın yok! `evcilim aktif [id]` komutu ile bir tanesini aktif edebilirsin!*') +
          '\n\n**Tüm Evcil Hayvanlar:**'
        )
        .setThumbnail(message.author.displayAvatarURL())
        .setFooter({ text: 'Evcil hayvanını beslemek için: evcilim besle [id]', iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      const petList = pets.slice(0, 10).map((pet, index) => {
        const isActive = pet.id === activePetId;
        const hungerEmoji = pet.hunger > 70 ? '🟢' : (pet.hunger > 30 ? '🟡' : '🔴');
        const loveEmoji = pet.affection > 70 ? '❤️' : (pet.affection > 30 ? '💛' : '💔');
        
        return `${isActive ? '▶️ ' : `${index + 1}. `}${pet.emoji} **${pet.name}** (ID: \`${pet.id}\`)\n` +
               `   Lvl ${pet.level} • ${hungerEmoji} Açlık: ${pet.hunger}/100 • ${loveEmoji} Sevgi: ${pet.affection}/100`;
      }).join('\n\n');
      
      petEmbed.setDescription(petEmbed.data.description + '\n\n' + petList);
      
      petEmbed.addFields({
        name: '🐾 Evcil Hayvan Komutları',
        value:
          '• `evcilim besle [id]` - Hayvanını besler\n' +
          '• `evcilim oyna [id]` - Hayvanınla oynar\n' +
          '• `evcilim bilgi [id]` - Hayvanın detaylı bilgilerini gösterir\n' +
          '• `evcilim aktif [id]` - Bir hayvanı aktif evcil hayvan yapar'
      });
      
      return message.reply({ embeds: [petEmbed] });
    }
    else if (subCommand === 'bilgi' || subCommand === 'info' || subCommand === 'i') {
      if (!targetPetId) {
        return message.reply('OwO! Hangi evcil hayvanın bilgisini görmek istediğini belirtmelisin! Örnek: `evcilim bilgi [hayvan-id]`');
      }
      
      const petResult = economyManager.getPetDetails(message.author.id, targetPetId);
      
      if (!petResult.success) {
        return message.reply(petResult.message);
      }
      
      const pet = petResult.pet;
      const template = petResult.template;
      
      const visualizeBar = (value, max, length = 10) => {
        const filled = Math.round((value / max) * length);
        return '█'.repeat(filled) + '░'.repeat(length - filled);
      };
      
      const hungerBar = visualizeBar(pet.hunger, template.maxHunger);
      const affectionBar = visualizeBar(pet.affection, template.maxAffection);
      
      const rarityColors = {
        common: '#AAAAAA',
        uncommon: '#55FF55',
        rare: '#5555FF',
        epic: '#AA00AA',
        legendary: '#FFAA00'
      };
      
      const petInfoEmbed = new EmbedBuilder()
        .setColor(rarityColors[template.rarity] || '#FFFFFF')
        .setTitle(`${pet.emoji} ${pet.name} • Lvl ${pet.level}`)
        .setDescription(
          `**Tür:** ${template.name}\n` +
          `**Nadirlik:** ${template.rarity.charAt(0).toUpperCase() + template.rarity.slice(1)}\n` +
          `**Seviye:** ${pet.level} (XP: ${pet.experience}/${pet.level * 25})\n\n` +
          `**Açlık:** ${pet.hunger}/${template.maxHunger} ${hungerBar}\n` +
          `**Sevgi:** ${pet.affection}/${template.maxAffection} ${affectionBar}\n\n` +
          `**Saldırı:** ${pet.stats.attack}\n` +
          `**Savunma:** ${pet.stats.defense}\n` +
          `**Hız:** ${pet.stats.speed}\n\n` +
          (template.evolutionPaths && template.evolutionPaths.length > 0 ? 
            `**Evrim Yolları:** ${template.evolutionPaths.join(', ')}\n*Seviye 10'a ulaşınca evrimleşebilir!*\n\n` : 
            '*Bu evcil hayvan evrimleşemez.*\n\n') +
          `Son Beslenme: <t:${Math.floor(pet.lastFed / 1000)}:R>\n` +
          `Son Oynanma: <t:${Math.floor(pet.lastPlayed / 1000)}:R>\n` +
          `Bulunma Tarihi: <t:${Math.floor(pet.createdAt / 1000)}:D>`
        )
        .setFooter({ text: `ID: ${pet.id}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [petInfoEmbed] });
    }
    else if (subCommand === 'besle' || subCommand === 'feed' || subCommand === 'f') {
      if (!targetPetId) {
        return message.reply('OwO! Hangi evcil hayvanı beslemek istediğini belirtmelisin! Örnek: `evcilim besle [hayvan-id]`');
      }
      
      const feedResult = economyManager.feedPet(message.author.id, targetPetId);
      
      if (!feedResult.success) {
        return message.reply(feedResult.message);
      }
      
      const feedEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle(`${feedResult.pet.emoji} Evcil Hayvan Beslendi!`)
        .setDescription(feedResult.message)
        .addFields(
          { name: '🍖 Yeni Açlık', value: `${feedResult.pet.hunger}/100`, inline: true },
          { name: '❤️ Sevgi', value: `${feedResult.pet.affection}/100`, inline: true },
          { name: '✨ XP Kazancı', value: `+${feedResult.xpGain} XP`, inline: true }
        )
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [feedEmbed] });
    }
    else if (subCommand === 'oyna' || subCommand === 'play' || subCommand === 'p') {
      if (!targetPetId) {
        return message.reply('OwO! Hangi evcil hayvanla oynamak istediğini belirtmelisin! Örnek: `evcilim oyna [hayvan-id]`');
      }
      
      const playResult = economyManager.playWithPet(message.author.id, targetPetId);
      
      if (!playResult.success) {
        return message.reply(playResult.message);
      }
      
      const playEmbed = new EmbedBuilder()
        .setColor('#FF69B4')
        .setTitle(`${playResult.pet.emoji} Evcil Hayvanla Oynandı!`)
        .setDescription(playResult.message)
        .addFields(
          { name: '❤️ Yeni Sevgi', value: `${playResult.pet.affection}/100`, inline: true },
          { name: '🍖 Açlık', value: `${playResult.pet.hunger}/100`, inline: true },
          { name: '✨ XP Kazancı', value: `+${playResult.xpGain} XP`, inline: true }
        )
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [playEmbed] });
    }
    else if (subCommand === 'aktif' || subCommand === 'active' || subCommand === 'a') {
      if (!targetPetId) {
        return message.reply('OwO! Hangi evcil hayvanı aktif yapmak istediğini belirtmelisin! Örnek: `evcilim aktif [hayvan-id]`');
      }
      
      const pets = economyManager.getUserPets(message.author.id);
      const targetPet = pets.find(p => p.id === targetPetId);
      
      if (!targetPet) {
        return message.reply(`Bu ID'ye sahip bir evcil hayvanın yok! Evcil hayvanlarını görmek için \`evcilim\` yazabilirsin.`);
      }
      
      const users = economyManager.db.get('users');
      userProfile.activePet = targetPetId;
      economyManager.db.set('users', users);
      
      const activeEmbed = new EmbedBuilder()
        .setColor('#00FFFF')
        .setTitle(`${targetPet.emoji} Aktif Evcil Hayvan Değiştirildi!`)
        .setDescription(`**${targetPet.name}** artık aktif evcil hayvanın! Sana savaşlarda ve diğer etkinliklerde yardımcı olacak.`)
        .addFields(
          { name: '📊 Seviye', value: `${targetPet.level}`, inline: true },
          { name: '🍖 Açlık', value: `${targetPet.hunger}/100`, inline: true },
          { name: '❤️ Sevgi', value: `${targetPet.affection}/100`, inline: true }
        )
        .setFooter({ text: `ID: ${targetPet.id}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [activeEmbed] });
    }
    else if (subCommand === 'evrim' || subCommand === 'evolve' || subCommand === 'e') {
      if (!targetPetId) {
        return message.reply('OwO! Hangi evcil hayvanı evrimleştirmek istediğini belirtmelisin! Örnek: `evcilim evrim [hayvan-id]`');
      }
      
      const evolveResult = economyManager.evolvePet(message.author.id, targetPetId);
      
      if (!evolveResult.success) {
        return message.reply(evolveResult.message);
      }
      
      const evolveEmbed = new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle('✨ EVRİM! ✨')
        .setDescription(evolveResult.message)
        .addFields(
          { name: '📊 Seviye', value: `${evolveResult.newPet.level}`, inline: true },
          { name: '⚔️ Saldırı', value: `${evolveResult.newPet.stats.attack}`, inline: true },
          { name: '🛡️ Savunma', value: `${evolveResult.newPet.stats.defense}`, inline: true },
          { name: '⚡ Hız', value: `${evolveResult.newPet.stats.speed}`, inline: true }
        )
        .setFooter({ text: `ID: ${evolveResult.newPet.id}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [evolveEmbed] });
    }
    else {
      const helpEmbed = new EmbedBuilder()
        .setColor('#FF9999')
        .setTitle('OwO! Geçersiz Evcil Hayvan Komutu')
        .setDescription(
          'Evcil hayvan komutları:\n\n' +
          '• `evcilim` - Evcil hayvanlarını listeler\n' +
          '• `evcilim bilgi [id]` - Hayvanın detaylı bilgilerini gösterir\n' +
          '• `evcilim besle [id]` - Hayvanını besler\n' +
          '• `evcilim oyna [id]` - Hayvanınla oynar\n' +
          '• `evcilim aktif [id]` - Bir hayvanı aktif evcil hayvan yapar\n' +
          '• `evcilim evrim [id]` - Bir hayvanı evrimleştirir (lvl 10+ gerekir)'
        )
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      
      return message.reply({ embeds: [helpEmbed] });
    }
  },
}; 