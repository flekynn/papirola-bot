require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const STREAM_CHANNEL_ID = '1411194745715294290'; // Cambialo
const TWITCH_USER = 'papirolafr';
const KICK_USER = 'brunardito';

// Estado de si los streamers están en vivo
let twitchLive = false;
let kickLive = false;

client.once('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
    checkStreams();
    setInterval(checkStreams, 60 * 1000); // Cada 1 minuto
});

async function checkStreams() {
    const channel = client.channels.cache.get(STREAM_CHANNEL_ID);
    if (!channel) return console.log('No se encuentra el canal de Discord');

    // Twitch
    try {
        const twitchRes = await axios.get(`https://api.twitch.tv/helix/streams?user_login=${TWITCH_USER}`, {
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${process.env.TWITCH_ACCESS_TOKEN}`
            }
        });

        const isLiveTwitch = twitchRes.data.data && twitchRes.data.data.length > 0;

        if (isLiveTwitch && !twitchLive) {
            const stream = twitchRes.data.data[0];
            const embed = new EmbedBuilder()
                .setTitle(`${TWITCH_USER} está en vivo en Twitch!`)
                .setDescription(stream.title)
                .setURL(`https://twitch.tv/${TWITCH_USER}`)
                .setColor(0x9146FF)
                .setThumbnail(stream.thumbnail_url.replace('{width}', '320').replace('{height}', '180'));

            channel.send({ embeds: [embed] });
            twitchLive = true; // Marcamos como que ya avisamos
        } else if (!isLiveTwitch) {
            twitchLive = false; // Reiniciamos cuando termina
        }
    } catch (err) {
        console.log('Error Twitch:', err.message);
    }

    // Kick
    try {
        const kickRes = await axios.get(`https://kick.com/api/v1/channels/${KICK_USER}`);
        const isLiveKick = kickRes.data.isLive; // Ajustar según API Kick

        if (isLiveKick && !kickLive) {
            const stream = kickRes.data;
            const embed = new EmbedBuilder()
                .setTitle(`${KICK_USER} está en vivo en Kick!`)
                .setURL(`https://kick.com/${KICK_USER}`)
                .setColor(0xFF4500)
                .setDescription(stream.title || 'Transmisión en vivo');

            channel.send({ embeds: [embed] });
            kickLive = true;
        } else if (!isLiveKick) {
            kickLive = false;
        }
    } catch (err) {
        console.log('Error Kick:', err.message);
    }
}

client.login(process.env.TOKEN);
