import { getTwitchEmbed } from '../modules/twitchEmbed.js';
import { getKickEmbed } from '../modules/kickEmbed.js';
import { getYoutubeEmbed } from '../modules/youtubeEmbed.js';

export default {
  data: {
    name: 'force_check',
    description: 'Fuerza un chequeo en todas las plataformas',
  },
  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const twitchEmbed = await getTwitchEmbed({ skipCache: true });
      const kickEmbed = await getKickEmbed({ skipCache: true });
      const youtubeEmbed = await getYoutubeEmbed({ skipCache: true });

      const channel = await client.channels.fetch(process.env.TEST_CHANNEL_ID);

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
      if (interaction.deferred) {
        await interaction.editReply('❌ Error al ejecutar force_check.');
      }
    }
  },
};
