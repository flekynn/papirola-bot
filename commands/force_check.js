import { SlashCommandBuilder } from 'discord.js';
import { checkAllPlatforms } from '../modules/notifier.js';

export const data = new SlashCommandBuilder()
  .setName('force_check')
  .setDescription('Fuerza un chequeo en todas las plataformas');

export async function execute(interaction) {
  try {
    await interaction.deferReply();
    const { twitchEmbed, kickEmbed, youtubeEmbed } = await checkAllPlatforms({ skipCache: true });
    const channel = await interaction.client.channels.fetch(process.env.TEST_CHANNEL_ID);

    if (!twitchEmbed && !kickEmbed && !youtubeEmbed) {
      await interaction.editReply('✅ No hay novedades en Twitch, YouTube ni Kick.');
    } else {
      await interaction.editReply('🔍 Se encontraron novedades, enviando al canal...');
      if (twitchEmbed) await channel.send({ content: `<@&${process.env.MENTION_ROLE_ID}>`, embeds: [twitchEmbed] });
      if (kickEmbed) await channel.send({ content: `<@&${process.env.MENTION_ROLE_ID}>`, embeds: [kickEmbed] });
      if (youtubeEmbed) await channel.send({ content: `<@&${process.env.MENTION_ROLE_ID}>`, embeds: [youtubeEmbed] });
    }
  } catch (err) {
    console.error('[force_check:error]', err);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply('❌ Error al ejecutar force_check.');
    } else {
      await interaction.reply({ content: '❌ Error al ejecutar force_check.', ephemeral: true });
    }
  }
}
