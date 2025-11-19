import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import { getTwitchEmbed } from './modules/twitchEmbed.js';
import { getKickEmbed } from './modules/kickEmbed.js';
import { getYoutubeEmbed } from './modules/youtubeEmbed.js';

const {
  DISCORD_TOKEN,
  TEST_CHANNEL_ID,
  MENTION_ROLE_ID,
  TWITCH_INTERVAL_MS,
  KICK_INTERVAL_MS,
  YOUTUBE_INTERVAL_MS,
} = process.env;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`[clientReady] Conectado como ${client.user.tag}`);

  // Twitch poll
  setInterval(async () => {
    const twitchEmbed = await getTwitchEmbed();
    if (twitchEmbed) {
      const channel = await client.channels.fetch(TEST_CHANNEL_ID);
      await channel.send({ content: `<@&${MENTION_ROLE_ID}>`, embeds: [twitchEmbed] });
    }
  }, Number(TWITCH_INTERVAL_MS));

  // Kick poll
  setInterval(async () => {
    const kickEmbed = await getKickEmbed();
    if (kickEmbed) {
      const channel = await client.channels.fetch(TEST_CHANNEL_ID);
      await channel.send({ content: `<@&${MENTION_ROLE_ID}>`, embeds: [kickEmbed] });
    }
  }, Number(KICK_INTERVAL_MS));

  // YouTube poll
  setInterval(async () => {
    const youtubeEmbed = await getYoutubeEmbed();
    if (youtubeEmbed) {
      const channel = await client.channels.fetch(TEST_CHANNEL_ID);
      await channel.send({ content: `<@&${MENTION_ROLE_ID}>`, embeds: [youtubeEmbed] });
    }
  }, Number(YOUTUBE_INTERVAL_MS));
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // Comando test_stream
  if (interaction.commandName === 'test_stream') {
    try {
      await interaction.deferReply();

      let embed;
      const plataforma = interaction.options.getString('plataforma');

      if (plataforma === 'twitch') embed = await getTwitchEmbed({ skipCache: true });
      if (plataforma === 'kick') embed = await getKickEmbed({ skipCache: true });
      if (plataforma === 'youtube') embed = await getYoutubeEmbed({ skipCache: true });

      if (!embed) {
        await interaction.editReply('⚠️ No se encontró contenido en esta plataforma.');
      } else {
        await interaction.editReply({
          content: `<@&${MENTION_ROLE_ID}>`,
          embeds: [embed],
        });
      }
    } catch (err) {
      console.error('[test_stream:error]', err);
    }
  }

  // Comando force_check
  if (interaction.commandName === 'force_check') {
    try {
      await interaction.deferReply();

      const twitchEmbed = await getTwitchEmbed({ skipCache: true });
      const kickEmbed = await getKickEmbed({ skipCache: true });
      const youtubeEmbed = await getYoutubeEmbed({ skipCache: true });

      const channel = await client.channels.fetch(TEST_CHANNEL_ID);

      if (!twitchEmbed && !kickEmbed && !youtubeEmbed) {
        await interaction.editReply('✅ No hay novedades en Twitch, YouTube ni Kick.');
      } else {
        await interaction.editReply('🔍 Resultados:');
        if (twitchEmbed) await channel.send({ content: `<@&${MENTION_ROLE_ID}>`, embeds: [twitchEmbed] });
        if (kickEmbed) await channel.send({ content: `<@&${MENTION_ROLE_ID}>`, embeds: [kickEmbed] });
        if (youtubeEmbed) await channel.send({ content: `<@&${MENTION_ROLE_ID}>`, embeds: [youtubeEmbed] });
      }
    } catch (err) {
      console.error('[force_check:error]', err);
    }
  }
});

client.login(DISCORD_TOKEN);
