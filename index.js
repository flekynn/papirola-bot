import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder
} from 'discord.js';
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

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'test_stream') {
    const plataforma = interaction.options.getString('plataforma');

    const embed = new EmbedBuilder()
      .setTitle(`📡 Simulación de stream en ${plataforma}`)
      .setDescription(`Este es un mensaje de prueba para la plataforma **${plataforma}**.`)
      .setColor(plataforma === 'twitch' ? 0x9146FF : plataforma === 'youtube' ? 0xFF0000 : 0x00D26A)
      .setTimestamp(new Date());

    await interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'force_check') {
    await interaction.reply('🔍 Ejecutando chequeo manual...');
    try {
      const events = await checkAllPlatforms();
      if (events.length === 0) {
        await interaction.followUp('✅ No hay novedades en Twitch, YouTube ni Kick.');
      } else {
        for (const evt of events) {
          await interaction.followUp({ embeds: [evt] });
        }
      }
    } catch (err) {
      console.error('[force_check:error]', err);
      await interaction.followUp('❌ Error al ejecutar el chequeo.');
    }
  }
});

client.on('error', (err) => console.error('[discord:error]', err));
client.on('shardError', (err) => console.error('[discord:shard]', err));

client.login(DISCORD_TOKEN).catch((err) => {
  console.error('[fatal] Login fallido', err);
  process.exit(1);
});

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
