import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async (client) => {
  const commandsPath = join(__dirname, '../commands/prefix');
  
  try {
    const commandFolders = readdirSync(commandsPath);

    for (const folder of commandFolders) {
      const folderPath = join(commandsPath, folder);
      const commandFiles = readdirSync(folderPath).filter(file => file.endsWith('.js'));
      
      for (const file of commandFiles) {
        const filePath = join(folderPath, file);
        const commandModule = await import(`file://${filePath}`);
        const command = commandModule.default;
        
        if ('name' in command && 'execute' in command) {
          client.commands.set(command.name, command);
          console.log(`[PREFIX] Yüklenen Komut: ${command.name}`);
        } else {
          console.log(`[WARNING] The command at ${filePath} is missing a required "name" or "execute" property.`);
        }
      }
    }
    
    console.log(`[INFO] ${client.commands.size} Adet Prefix Komudu Yüklendi!`);
  } catch (error) {
    console.error('[ERROR] Prefix commands could not be loaded:', error);
  }
}; 