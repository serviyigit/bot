import prefixCommands from './prefixCommands.js';
import events from './events.js';

export default async (client, commandType = 'both') => {
  try {
    await events(client);
    console.log('[HANDLER] Events loaded!');
    
    if (commandType === 'prefix') {
      await prefixCommands(client);
      console.log('[HANDLER] Prefix Komutları Yüklendi');
    }
    
    console.log(`[INFO] All handlers loaded successfully! Command type: ${commandType}`);
  } catch (error) {
    console.error('[ERROR] Failed to load handlers:', error);
  }
}; 