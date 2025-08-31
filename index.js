require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const express = require('express');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ------------------ CONFIG ------------------
const STREAM_CHANNEL_ID = process.env.STREAM_CHANNEL_ID;
const TWITCH_USER = process.env.TWITCH_USER;
const KICK_USER = process.env.KICK_USER;
const MENTION_ROLE_ID = process.env.MENTION_ROLE_ID; // <--- NUEVO

let twitchLive = false;
let kickLive = false;
let twitchToken = process.env.TWITCH_ACCESS_TOKEN || null;
let kickToken = null;

// ------------------ EXPRESS PARA OAUTH KICK ------------------
const app = express();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor OAuth Kick escuchando en http://localhost:${PORT}`));

app.get('/auth', (req, res) => {
    const url = `https://kick.com/oauth2/authorize?client_id=${process.env.KICK_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.KICK_REDIRECT_URI)}&response_type=code&scope=channel:read`;
    res.redirect(url);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const tokenRes = await axios.post('https://kick.com/oauth2/token', null, {
            params: {
                client_id: process.env.KICK_CLIENT_ID,
                client_secret: process.env.KICK_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: process.env.KICK_REDIRECT_URI
            }
        });
        kickToken = tokenRes.data.access_token;
        console.log(`[${new Date().toLocaleTimeString()}] 🔑 Token Kick obtenido`);
        res.send('Kick OAuth completado ✅');
    } catch (err) {
        console.log('Error Kick OAuth:', err.message);
        res.status(500).send('Error en Kick OAuth');
    }
});

// ------------------ FUNCIONES ------------------
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
        console.log('Error renovando token Twitch:', err.message);
    }
}

async function checkStreams() {
    const channel = client.channels.cache.get(STREAM_CHANNEL_ID);
    if (!channel) return console.log('No se encuentra el canal de Discord');

    // -------------- TWITCH -----------------
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

            await channel.send({
                content: `<@&${MENTION_ROLE_ID}> ¡Ven al stream!`,
                embeds: [embed],
                allowedMentions: { roles: [MENTION_ROLE_ID] }
            });
            twitchLive = true;
        } else if (!isLiveTwitch) {
            twitchLive = false;
        }
    } catch (err) {
        console.log('Error Twitch:', err.message);
    }

    // -------------- KICK -----------------
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

                await channel.send({
                    content: `<@&${MENTION_ROLE_ID}> ¡Ven al stream!`,
                    embeds: [embed],
                    allowedMentions: { roles: [MENTION_ROLE_ID] }
                });
                kickLive = true;
            } else if (!isLiveKick) {
                kickLive = false;
            }
        }
    } catch (err) {
        console.log('Error Kick:', err.message);
    }
}

// ------------------ BOT ------------------
client.once('ready', async () => {
    console.log(`[${new Date().toLocaleTimeString()}] ✅ Bot conectado como ${client.user.tag}`);
    await refreshTwitchToken();
    checkStreams();
    setInterval(checkStreams, 60 * 1000); // cada 1 minuto
    setInterval(refreshTwitchToken, 50 * 60 * 1000); // renovar token Twitch
});

client.login(process.env.TOKEN);
