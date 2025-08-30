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

// Token Twitch (se renueva automáticamente)
let twitchToken = process.env.TWITCH_ACCESS_TOKEN;

client.once('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
    checkStreams();
    setInterval(checkStreams, 60 * 1000); // Cada 1 minuto
    setInterval(refreshTwitchToken, 50 * 60 * 1000); // Renovar token cada 50 min
});

// Función para renovar token Twitch
async function refreshTwitchToken() {
    try {
        const res = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: process.env.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET,
                grant_type: 'client_credentials'
            }
        });
        twitchToken = res.data.access_token;
        console.log('🔄 Token Twitch renovado');
    } catch (err) {
        console.log('Error renovando token Twitch:', err.message);
    }
}

async function checkStreams() {
    const channel = client.channels.cache.get(STREAM_CHANNEL_ID);
    if (!channel) return console.log('No se encuentra el canal de Discord');

    // ------------------ Twitch ------------------
    try {
        const twitchRes = await axios.get(`https://api.twitch.tv/helix/streams?user_login=${TWITCH_USER}`, {
            headers: {
                'Authorization': `Bearer ${twitchToken}`,
                'Client-Id': process.env.TWITCH_CLIENT_ID
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

            await channel.send({ embeds: [embed] });
            twitchLive = true;
        } else if (!isLiveTwitch) {
            twitchLive = false;
        }
    } catch (err) {
        console.log('Error Twitch:', err.message);
    }

    // ------------------ Kick ------------------
    try {
        const kickRes = await axios.get(`https://kick.com/api/v1/channels/${KICK_USER}`);
        console.log('Kick data:', kickRes.data); // Para debug
        const isLiveKick = kickRes.data.is_live; // Corregido

        if (isLiveKick && !kickLive) {
            const stream = kickRes.data;
            const embed = new EmbedBuilder()
                .setTitle(`${KICK_USER} está en vivo en Kick!`)
                .setURL(`https://kick.com/${KICK_USER}`)
                .setColor(0xFF4500)
                .setDescription(stream.title || 'Transmisión en vivo');

            await channel.send({ embeds: [embed] });
            kickLive = true;
        } else if (!isLiveKick) {
            kickLive = false;
        }
    } catch (err) {
        console.log('Error Kick:', err.message);
    }
}

client.login(process.env.TOKEN);
