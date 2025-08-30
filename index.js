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

let twitchLive = false;
let kickLive = false;
let twitchToken = process.env.TWITCH_ACCESS_TOKEN;
let kickToken = null;

// ---------------- Funciones de tokens ----------------
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
        console.log(`[${new Date().toLocaleTimeString()}] 🔄 Token Twitch renovado`);
    } catch (err) {
        console.log(`[${new Date().toLocaleTimeString()}] Error renovando token Twitch:`, err.message);
    }
}

async function refreshKickToken() {
    try {
        const res = await axios.post('https://kick.com/oauth2/token', null, {
            params: {
                client_id: process.env.KICK_CLIENT_ID,
                client_secret: process.env.KICK_CLIENT_SECRET,
                grant_type: 'client_credentials'
            }
        });
        kickToken = res.data.access_token;
        console.log(`[${new Date().toLocaleTimeString()}] 🔄 Token Kick renovado`);
    } catch (err) {
        kickToken = null;
        console.log(`[${new Date().toLocaleTimeString()}] ⚠️ Error obteniendo token Kick:`, err.message);
    }
}

// ---------------- Revisar streams ----------------
async function checkStreams() {
    const channel = client.channels.cache.get(STREAM_CHANNEL_ID);
    if (!channel) return console.log(`[${new Date().toLocaleTimeString()}] No se encuentra el canal de Discord`);

    // -------- Twitch --------
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
            console.log(`[${new Date().toLocaleTimeString()}] Twitch LIVE: ${stream.title}`);
        } else if (!isLiveTwitch) {
            twitchLive = false;
        }
    } catch (err) {
        if (err.response && err.response.status === 429) {
            console.log(`[${new Date().toLocaleTimeString()}] ⚠️ Twitch rate limit, esperar 1 min`);
        } else {
            console.log(`[${new Date().toLocaleTimeString()}] Error Twitch:`, err.message);
        }
    }

    // -------- Kick --------
    if (!kickToken) return;

    try {
        const kickRes = await axios.get(`https://kick.com/api/v1/channels/${KICK_USER}`, {
            headers: { 'Authorization': `Bearer ${kickToken}` }
        });

        if (kickRes.status === 200) {
            const isLiveKick = kickRes.data.is_live;

            if (isLiveKick && !kickLive) {
                const stream = kickRes.data;
                const embed = new EmbedBuilder()
                    .setTitle(`${KICK_USER} está en vivo en Kick!`)
                    .setURL(`https://kick.com/${KICK_USER}`)
                    .setColor(0xFF4500)
                    .setDescription(stream.title || 'Transmisión en vivo');

                await channel.send({ embeds: [embed] });
                kickLive = true;
                console.log(`[${new Date().toLocaleTimeString()}] Kick LIVE: ${stream.title || 'sin título'}`);
            } else if (!isLiveKick) {
                kickLive = false;
            }
        } else {
            console.log(`[${new Date().toLocaleTimeString()}] Kick responded with status ${kickRes.status}`);
        }
    } catch (err) {
        if (err.response && (err.response.status === 403 || err.response.status === 404)) {
            console.log(`[${new Date().toLocaleTimeString()}] ⚠️ Kick API inaccesible o token inválido (${err.response.status})`);
        } else {
            console.log(`[${new Date().toLocaleTimeString()}] Error Kick:`, err.message);
        }
    }
}

// ---------------- Bot listo ----------------
client.once('ready', async () => {
    console.log(`[${new Date().toLocaleTimeString()}] ✅ Bot conectado como ${client.user.tag}`);

    // Generar tokens iniciales
    await refreshTwitchToken();
    await refreshKickToken();

    // Revisar streams cada minuto
    checkStreams();
    setInterval(checkStreams, 60 * 1000);

    // Renovar tokens automáticamente
    setInterval(refreshTwitchToken, 50 * 60 * 1000);
    setInterval(refreshKickToken, 50 * 60 * 1000);
});

client.login(process.env.TOKEN);
