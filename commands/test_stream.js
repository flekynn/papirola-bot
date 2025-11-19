import { checkAllPlatforms } from '../modules/notifier.js';

export default {
  data: {
    name: 'test_stream',
    description: 'Muestra el contenido activo o el último publicado en una plataforma',
    options: [
      {
        name: 'plataforma',
        description: 'Plataforma a consultar',
        type: 3,
        required: true,
        choices: [
          { name: 'twitch', value: 'twitch' },
          { name: 'kick', value: 'kick' },
          { name: 'youtube', value: 'youtube' },
        ],
      },
    ],
  },
  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const plataforma = interaction.options.getString('plataforma');
      const { twitchEmbed, kickEmbed, youtubeEmbed } = await checkAllPlatforms({ skipCache: true });

      const embed =
        plataforma === 'twitch' ? twitchEmbed :
        plataforma === 'kick' ? kickEmbed :
        plataforma === 'youtube' ? youtubeEmbed : null;

      if (!embed) {
        await interaction.editReply('⚠️ No se encontró contenido en esta plataforma.');
      } else {
        await interaction.editReply('✅ Stream detectado, enviando al canal...');
        const channel = await client.channels.fetch(process.env.TEST_CHANNEL_ID);
        await channel.send({ content: `<@&${process.env.MENTION_ROLE_ID}>`, embeds: [embed] });
      }
    } catch (err) {
      console.error('[test_stream:error]', err);
      if (interaction.deferred) {
        await interaction.editReply('❌ Error al ejecutar test_stream.');
      }
    }
  },
};
