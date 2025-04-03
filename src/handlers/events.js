import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async (client) => {
  const eventsPath = join(__dirname, '../events');
  
  try {
    const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
      const filePath = join(eventsPath, file);
      const eventModule = await import(`file://${filePath}`);
      const event = eventModule.default;
      
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      
      console.log(`[EVENT] Loaded event: ${event.name}`);
    }
    
    console.log(`[INFO] Loaded ${eventFiles.length} events!`);
  } catch (error) {
    console.error('[ERROR] Events could not be loaded:', error);
  }
}; 