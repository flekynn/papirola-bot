const { SlashCommandBuilder } = require('discord.js');
const { twitchEmbed, kickEmbed, youtubeEmbed } = require('../messages');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test_stream')
        .setDescription('Simula un aviso de transmisión o video nuevo')
        .addStringOption(option =>
            option.setName('plataforma')
                .setDescription('Plataforma a simular: twitch, kick, youtube')
                .setRequired(true)
        ),
    async execute(interaction, client) {
        const plataforma = interaction.options.getString('plataforma');

        // Usar canal de prueba del .env
        const channel = client.channels.cache.get(process.env.TEST_CHANNEL_ID);
        if (!channel) return interaction.reply('No se encuentra el canal de prueba.');

        try {
            switch(plataforma.toLowerCase()) {
                case 'twitch':
                    await channel.send({
                        embeds: [twitchEmbed(
                            'TwitchUser',
                            'Transmisión de prueba',
                            'https://twitch.tv/TwitchUser',
                            'https://placehold.it/320x180'
                        )]
                    });
                    break;
                case 'kick':
                    await channel.send({
                        embeds: [kickEmbed(
                            'KickUser',
                            'Transmisión de prueba',
                            'https://kick.com/KickUser'
                        )]
                    });
                    break;
                case 'youtube':
                    await channel.send({
                        embeds: [youtubeEmbed(
                            'YouTubeUser',
                            'Video de prueba',
                            'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                            'https://placehold.it/320x180'
                        )]
                    });
                    break;
                default:
                    return interaction.reply('Plataforma no válida. Debe ser: twitch, kick o youtube.');
            }

            interaction.reply(`Simulación de ${plataforma} enviada ✅`);
        } catch (err) {
            console.error('Error simulando aviso:', err);
            interaction.reply('Ocurrió un error al enviar la simulación.');
        }
    }
};
