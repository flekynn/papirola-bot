import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { checkAllPlatforms } from './modules/checkAllPlatforms.js';

const {
  DISCORD_TOKEN,
  DISCORD_CHANNEL_ID,
  CHECK_INTERVAL_MS = '60000'
} = process.env;

if (!DISCORD_TOKEN || !DISCORD_CHANNEL_ID) {
  console.error('[fatal] Faltan variables de entorno');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel]
});

client.once('ready', async () => {
  console.log(`[ready] Conectado como ${client.user.tag}`);
  const channel = await client.channels.fetch(DISCORD_CHANNEL_ID).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    console.error('[fatal] Canal inválido');
    process.exit(1);
  }

  channel.send('🚀 Bot iniciado. Monitoreo activo.');
  startPolling(channel);
});

client.login(DISCORD_TOKEN);

function startPolling(channel) {
  const interval = Number(CHECK_INTERVAL_MS);
  console.log(`[poll] Intervalo: ${interval}ms`);

  setInterval(async () => {
    try {
      const events = await checkAllPlatforms();
      for (const evt of events) {
        await channel.send({ embeds: [evt] });
      }
    } catch (err) {
      console.error('[poll:error]', err);
    }
  }, interval);
}
