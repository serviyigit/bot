import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config();

// ES Modules file path resolving
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Collections for commands
client.commands = new Collection(); // Prefix commands
client.cooldowns = new Collection(); // Cooldowns

// Check command type from environment variables (prefix, slash, or both)
const commandType = process.env.COMMAND_TYPE?.toLowerCase();
console.log(`[CONFIG] Command type: ${commandType}`);

// Load handlers
const handlersDir = join(__dirname, 'handlers');

try {
  const handlerFiles = readdirSync(handlersDir).filter(file => file.endsWith('.js'));

  (async () => {
    // Always load the index handler first
    const indexHandlerPath = join(handlersDir, 'index.js');
    const indexHandlerModule = await import(`file://${indexHandlerPath}`);
    
    // Pass command type to handlers
    await indexHandlerModule.default(client, commandType);
  })();
} catch (err) {
  console.error('Handlers klasörü henüz oluşturulmamış olabilir:', err);
}

// Uyarı mesajı - çift event handler sorunu çözüldü
console.log(`[CONFIG] Mesaj komutları events/messageCreate.js tarafından yönetiliyor.`);

/* 
// Not: Bu blok eski kod idi ve sorunun kaynağıydı.
// Çift MessageCreate event'ine neden olduğu için tamamen kaldırıldı.
// Artık messageCreate.js dosyasından yönetiliyor.

// Prefix command handler - only active if commandType is 'prefix' or 'both'
if (commandType === 'prefix' || commandType === 'both') {
  client.on(Events.MessageCreate, async (message) => {
    // Bu ikinci MessageCreate event listener'ı, komutların iki kez işlenmesine neden oluyordu
    // Tüm mesaj işleme event/messageCreate.js dosyasından yönetilecek
  });
}
*/

// Login to Discord with your client's token
client.login(process.env.TOKEN); 