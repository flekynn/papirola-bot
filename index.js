import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder
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

client.once('clientReady', async () => {
  console.log(`[clientReady] Conectado como ${client.user.tag}`);
  const channel = await client.channels.fetch(TEST_CHANNEL_ID).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    console.error('[fatal] Canal de pruebas inválido');
    process.exit(1);
  }

  await channel.send('🧪 Bot iniciado en canal de pruebas.');

  // Precargar cache sin anunciar
  await getTwitchEmbed({ skipCache: true });
  await getYoutubeEmbed({ skipCache: true });
  await getKickEmbed({ skipCache: true });

  startPolling(channel);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'test_stream') {
    const plataforma = interaction.options.getString('plataforma');
    let embed;

    try {
      await interaction.deferReply();

      if (plataforma === 'twitch') {
        embed = await getTwitchEmbed({ skipCache: true });
      } else if (plataforma === 'kick') {
        embed = await getKickEmbed({ skipCache: true });
      } else if (plataforma === 'youtube') {
        embed = await getYoutubeEmbed({ skipCache: true });
      }

      if (!embed) {
        await interaction.editReply('⚠️ No se encontró contenido en esta plataforma.');
        return;
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[test_stream:error]', err);
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply('❌ Error al generar el embed.');
        }
      } catch (nestedErr) {
        console.error('[test_stream:editReply fallback]', nestedErr);
      }
    }
  }

  if (interaction.commandName === 'force_check') {
    try {
      await interaction.deferReply();
      const events = await checkAllPlatforms({ skipCache: false });
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
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply('❌ Error al ejecutar el chequeo.');
        }
      } catch (nestedErr) {
        console.error('[force_check:editReply fallback]', nestedErr);
      }
    }
  }
});

function startPolling(channel) {
  const interval = Number(CHECK_INTERVAL_MS);
  console.log(`[poll] Intervalo: ${interval}ms`);

  setInterval(async () => {
    try {
      const events = await checkAllPlatforms({ skipCache: false });
      for (const evt of events) {
        await channel.send({ embeds: [evt] });
      }
    } catch (err) {
      console.error('[poll:error]', err);
    }
  }, interval);
}

client.login(DISCORD_TOKEN);
