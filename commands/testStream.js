const { SlashCommandBuilder } = require('discord.js');
const { twitchEmbed, kickEmbed, youtubeEmbed } = require('../modules/messages');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test_stream')
        .setDescription('Simula un aviso de transmisión o video nuevo en el canal de prueba')
        .addStringOption(option =>
            option.setName('plataforma')
                .setDescription('Plataforma a simular: twitch, kick, youtube')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('canal')
                .setDescription('Para YouTube: selecciona un canal de prueba')
                .setRequired(false)
        ),
    async execute(interaction, client) {
        const plataforma = interaction.options.getString('plataforma').toLowerCase();

        // Canal de prueba
        const channel = client.channels.cache.get(process.env.TEST_CHANNEL_ID);
        if (!channel) return interaction.reply('No se encuentra el canal de prueba.');

        try {
            switch(plataforma) {
                case 'twitch': {
                    const twitchUser = process.env.TWITCH_USER || 'TwitchUser';
                    await channel.send({
                        embeds: [twitchEmbed(
                            twitchUser,
                            'Transmisión de prueba',
                            `https://twitch.tv/${twitchUser}`,
                            'https://placehold.it/320x180'
                        )]
                    });
                    break;
                }
                case 'kick': {
                    const kickUser = process.env.KICK_USER || 'KickUser';
                    await channel.send({
                        embeds: [kickEmbed(
                            kickUser,
                            'Transmisión de prueba',
                            `https://kick.com/${kickUser}`
                        )]
                    });
                    break;
                }
                case 'youtube': {
                    const ytChannels = process.env.YOUTUBE_CHANNELS
                        ? process.env.YOUTUBE_CHANNELS.split(',').map(ch => ch.trim())
                        : ['YouTubeUser'];

                    let selectedChannel = interaction.options.getString('canal');
                    if (!selectedChannel || !ytChannels.includes(selectedChannel)) {
                        selectedChannel = ytChannels[0];
                    }

                    await channel.send({
                        embeds: [youtubeEmbed(
                            selectedChannel,
                            'Video de prueba',
                            'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                            'https://placehold.it/320x180'
                        )]
                    });
                    break;
                }
                default:
                    return interaction.reply('Plataforma no válida. Debe ser: twitch, kick o youtube.');
            }

            interaction.reply({ content: `Simulación de ${plataforma} enviada ✅`, ephemeral: true });
        } catch (err) {
            console.error('Error simulando aviso:', err);
            interaction.reply({ content: 'Ocurrió un error al enviar la simulación.', ephemeral: true });
        }
    }
};
