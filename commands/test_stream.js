import { SlashCommandBuilder } from 'discord.js';
import { checkAllPlatforms } from '../modules/notifier.js';

export const data = new SlashCommandBuilder()
  .setName('test_stream')
  .setDescription('Muestra el contenido activo o el último publicado en una plataforma')
  .addStringOption(option =>
    option.setName('plataforma')
      .setDescription('Plataforma a consultar')
      .setRequired(true)
      .addChoices(
        { name: 'twitch', value: 'twitch' },
        { name: 'kick', value: 'kick' },
        { name: 'youtube', value: 'youtube' },
      )
  );

export async function execute(interaction, client) {
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
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply('❌ Error al ejecutar test_stream.');
    } else {
      await interaction.reply({ content: '❌ Error al ejecutar test_stream.', ephemeral: true });
    }
  }
}
