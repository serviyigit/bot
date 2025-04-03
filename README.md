# Discord.js v14 Bot Altyapısı (ES Modules)

Bu proje, Discord.js v14 ve ECMAScript Modules (ESM) kullanarak hem prefix hem de slash komutlarını destekleyen boş bir Discord bot altyapısıdır.

## Özellikler

- **Discord.js v14**: En güncel Discord API özellikleri
- **ES Modules**: Modern JavaScript modül sistemi (import/export)
- **Prefix Komutları**: Geleneksel metin tabanlı komutlar (`!komut` şeklinde)
- **Slash Komutları**: Discord'un yeni eğik çizgi komutları (`/komut` şeklinde)
- **Komut Tipi Seçeneği**: "prefix", "slash" veya "both" seçeneği ile istediğiniz komut tipini kullanma
- **Komut Kategorileri**: Komutları kategorilere ayırma
- **Modüler Yapı**: Kolay genişletilebilir yapı
- **Olay Sistemi**: Tüm Discord olaylarını modüler şekilde yönetme

## Kurulum

1. Projeyi klonlayın veya indirin
2. Gerekli paketleri yükleyin: `npm install`
3. `.env.example` dosyasını `.env` olarak kopyalayın
4. `.env` dosyasını düzenleyerek Discord bot token'ınızı ve diğer bilgileri girin
5. Botu başlatın: `npm start`

## Konfigürasyon

`.env` dosyasında aşağıdaki yapılandırmaları ayarlamalısınız:

```env
# Discord Bot Token
TOKEN=your_bot_token_here

# Bot Prefix (for prefix commands)
PREFIX=!

# Client ID (for slash commands)
CLIENT_ID=your_client_id_here

# Guild ID (for development, only register slash commands to specific server)
GUILD_ID=your_guild_id_here

# Command Type (options: "prefix", "slash", "both")
COMMAND_TYPE=both
```

- `COMMAND_TYPE`: Bu değer, hangi komut tipinin etkinleştirileceğini belirler:
  - `prefix`: Sadece prefix komutlarını etkinleştirir (örn. !ping)
  - `slash`: Sadece slash komutlarını etkinleştirir (örn. /ping)
  - `both`: Hem prefix hem de slash komutlarını etkinleştirir (varsayılan)

## Komut Oluşturma

### Prefix Komut Oluşturma

`src/commands/prefix/kategori/komut.js` şeklinde yeni bir dosya oluşturun:

```js
export default {
  name: 'komutadı',
  description: 'Komut açıklaması',
  aliases: ['alternatif1', 'alternatif2'],
  usage: '[argüman]',
  cooldown: 5,
  guildOnly: false,
  args: false,
  // kategori bilgisi için
  category: 'general',
  execute(message, args, client) {
    // Komut kodu buraya
    message.channel.send('Cevap mesajı');
  },
};
```

### Slash Komut Oluşturma

`src/commands/slash/kategori/komut.js` şeklinde yeni bir dosya oluşturun:

```js
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('komutadı')
    .setDescription('Komut açıklaması')
    .addStringOption(option => 
      option.setName('argüman')
        .setDescription('Argüman açıklaması')
        .setRequired(false)),
  // kategori bilgisi için
  category: 'general',
  async execute(interaction, client) {
    // Komut kodu buraya
    await interaction.reply('Cevap mesajı');
  },
};
```

## Olay Oluşturma

`src/events/olayAdı.js` şeklinde yeni bir dosya oluşturun:

```js
import { Events } from 'discord.js';

export default {
  name: Events.InteractionCreate, // Discord.js olay adı
  once: false, // false: her seferinde çalışır, true: sadece bir kez çalışır
  execute(interaction, client) {
    // Olay kodu buraya
  },
};
```

## Not

Bu proje ES Modules (ESM) kullanmaktadır. Tüm JavaScript dosyaları `import/export` sözdizimi ile yazılmalıdır ve dosya yolları belirtilirken `.js` uzantısı dahil edilmelidir.

## Lisans

MIT 