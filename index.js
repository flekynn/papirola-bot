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
  CHECK_INTERVAL_MS = '60000',
  MENTION_ROLE_ID
} = process.env;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// ⚠️ Cambiado a clientReady para evitar el warning
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
      // deferReply solo una vez
      await interaction.deferReply();

      if (plataforma === 'twitch') {
        embed = await getTwitchEmbed({ skipCache: true });
      } else if (plataforma === 'kick') {
        embed = await getKickEmbed({ skipCache: true });
      } else if (plataforma === 'youtube') {
        embed = await getYoutubeEmbed({ skipCache: true });
      }

      if (!embed) {
        return await interaction.editReply('⚠️ No se encontró contenido en esta plataforma.');
      }

      await interaction.editReply({
        content: `<@&${MENTION_ROLE_ID}>`,
        embeds: [embed]
      });
    } catch (err) {
      console.error('[test_stream:error]', err);
      // ❌ No intentamos responder de nuevo aquí, solo logueamos
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
          await interaction.followUp({
            content: `<@&${MENTION_ROLE_ID}>`,
            embeds: [evt]
          });
        }
      }
    } catch (err) {
      console.error('[force_check:error]', err);
      // ❌ Igual que arriba, no respondemos de nuevo en el catch
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
        await channel.send({
          content: `<@&${MENTION_ROLE_ID}>`,
          embeds: [evt]
        });
      }
    } catch (err) {
      console.error('[poll:error]', err);
    }
  }, interval);
}

client.login(DISCORD_TOKEN);
