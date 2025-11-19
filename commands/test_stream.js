import { getTwitchEmbed } from '../modules/twitchEmbed.js';
import { getKickEmbed } from '../modules/kickEmbed.js';
import { getYoutubeEmbed } from '../modules/youtubeEmbed.js';

export default {
  data: {
    name: 'test_stream',
    description: 'Muestra el contenido activo o el último publicado en una plataforma',
    options: [
      {
        name: 'plataforma',
        description: 'Plataforma a consultar',
        type: 3, // STRING
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
    await interaction.deferReply();

    const plataforma = interaction.options.getString('plataforma');
    let embed;

    if (plataforma === 'twitch') embed = await getTwitchEmbed({ skipCache: true });
    if (plataforma === 'kick') embed = await getKickEmbed({ skipCache: true });
    if (plataforma === 'youtube') embed = await getYoutubeEmbed({ skipCache: true });

    if (!embed) {
      await interaction.editReply('⚠️ No se encontró contenido en esta plataforma.');
    } else {
      await interaction.editReply('✅ Stream detectado, enviando al canal...');
      const channel = await client.channels.fetch(process.env.TEST_CHANNEL_ID);
      await channel.send({ content: `<@&${process.env.MENTION_ROLE_ID}>`, embeds: [embed] });
    }
  },
};
