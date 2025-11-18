import 'dotenv/config';
import { Client, GatewayIntentBits, Partials, EmbedBuilder } from 'discord.js';
import { checkAllPlatforms } from './modules/checkAllPlatforms.js';

const {
  DISCORD_TOKEN,
  TEST_CHANNEL_ID,
  CHECK_INTERVAL_MS = '60000'
} = process.env;

if (!DISCORD_TOKEN || !TEST_CHANNEL_ID) {
  console.error('[fatal] Faltan variables de entorno DISCORD_TOKEN o TEST_CHANNEL_ID');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once('ready', async () => {
  console.log(`[ready] Conectado como ${client.user.tag}`);
  const channel = await client.channels.fetch(TEST_CHANNEL_ID).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    console.error('[fatal] Canal de pruebas inválido');
    process.exit(1);
  }

  await channel.send('🧪 Bot iniciado en canal de pruebas.');
  startPolling(channel);
});

// Manejo de comandos slash
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'test_stream') {
    const embed = new EmbedBuilder()
      .setTitle('🧪 Stream de prueba')
      .setDescription('Este es un mensaje de prueba para verificar notificaciones.')
      .setColor(0x00ff00)
      .setTimestamp(new Date());

    await interaction.reply({ embeds: [embed] });
  }
});

client.login(DISCORD_TOKEN);

// --- Polling de streams ---
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
