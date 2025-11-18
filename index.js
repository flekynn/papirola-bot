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
  startPolling(channel);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'test_stream') {
    try {
      await interaction.deferReply();
      const plataforma = interaction.options.getString('plataforma');
      let embed;

      if (plataforma === 'twitch') {
        embed = await getTwitchEmbed();
      } else if (plataforma === 'kick') {
        embed = await getKickEmbed();
      } else if (plataforma === 'youtube') {
        embed = await getYoutubeEmbed();
      }

      if (!embed) {
        embed = new EmbedBuilder()
          .setTitle(`⚠️ No hay contenido activo en ${plataforma}`)
          .setDescription(`No se encontró stream o video nuevo para ${plataforma}.`)
          .setColor(0xCCCCCC)
          .setTimestamp(new Date());
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[test_stream:error]', err);
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply('❌ Error al generar el embed.');
      } else {
        await interaction.reply('❌ Error al generar el embed.');
      }
    }
  }

  if (interaction.commandName === 'force_check') {
    try {
      await interaction.deferReply();
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
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply('❌ Error al ejecutar el chequeo.');
      } else {
        await interaction.reply('❌ Error al ejecutar el chequeo.');
      }
    }
  }
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

client.login(DISCORD_TOKEN);
