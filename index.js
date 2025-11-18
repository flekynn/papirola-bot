import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Partials
} from 'discord.js';
import { checkAllPlatforms } from './modules/checkAllPlatforms.js';
import { getTwitchEmbed } from './modules/twitchEmbed.js';
import { getKickEmbed } from './modules/kickEmbed.js';
import { getYoutubeEmbed } from './modules/youtubeEmbed.js';

const {
  DISCORD_TOKEN,
  TEST_CHANNEL_ID,
  CHECK_INTERVAL_MS = '60000'
} = process.env;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// ⚡ Evento actualizado: clientReady
client.once('clientReady', async () => {
  console.log(`[clientReady] Conectado como ${client.user.tag}`);
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

  // 🔧 Comando de prueba
  if (interaction.commandName === 'test_stream') {
    await interaction.deferReply();
    const plataforma = interaction.options.getString('plataforma');
    let embed;

    if (plataforma === 'twitch') {
      embed = await getTwitchEmbed(true);
    } else if (plataforma === 'kick') {
      embed = await getKickEmbed(true);
    } else if (plataforma === 'youtube') {
      embed = await getYoutubeEmbed(true);
    }

    if (!embed) {
      await interaction.editReply('⚠️ No se pudo generar el embed de prueba.');
    } else {
      await interaction.editReply({ embeds: [embed] });
    }
  }

  // 🔧 Comando de chequeo manual
  if (interaction.commandName === 'force_check') {
    await interaction.deferReply();
    try {
      const events = await checkAllPlatforms();
      if (events.length === 0) {
        await interaction.editReply('✅ No hay novedades en Twitch, YouTube ni Kick.');
      } else {
        await interaction.editReply('🔍 Resultados:');
        for (const evt of events) {
          await interaction.followUp({ embeds: [evt] });
        }
      }
    } catch (err) {
      console.error('[force_check:error]', err);
      await interaction.editReply('❌ Error al ejecutar el chequeo.');
    }
  }
});

// 🌀 Polling automático
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

client.login(DISCORD_TOKEN);
