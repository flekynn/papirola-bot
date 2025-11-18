require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const express = require('express');
const { twitchEmbed, kickEmbed, youtubeEmbed } = require('./messages');

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
const MENTION_ROLE_ID = process.env.MENTION_ROLE_ID;

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
            await channel.send({
                content: `<@&${MENTION_ROLE_ID}>`,
                embeds: [twitchEmbed(
                    TWITCH_USER,
                    stream.title,
                    `https://twitch.tv/${TWITCH_USER}`,
                    stream.thumbnail_url.replace('{width}','320').replace('{height}','180')
                )],
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
                await channel.send({
                    content: `<@&${MENTION_ROLE_ID}>`,
                    embeds: [kickEmbed(KICK_USER, stream.title, `https://kick.com/${KICK_USER}`)],
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

    // -------------- YOUTUBE -----------------
    const YOUTUBE_CHANNELS = [
        { username: 'papirolafr', lastVideoId: null } // agregar más si se quiere
    ];

    for (const ytChannel of YOUTUBE_CHANNELS) {
        try {
            const res = await axios.get(`https://www.googleapis.com/youtube/v3/channels`, {
                params: {
                    part: 'contentDetails',
                    forUsername: ytChannel.username,
                    key: process.env.YOUTUBE_API_KEY
                }
            });

            const uploadsPlaylistId = res.data.items[0].contentDetails.relatedPlaylists.uploads;

            const videosRes = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
                params: {
                    part: 'snippet',
                    playlistId: uploadsPlaylistId,
                    maxResults: 1,
                    key: process.env.YOUTUBE_API_KEY
                }
            });

            const latestVideo = videosRes.data.items[0].snippet;
            const videoId = latestVideo.resourceId.videoId;

            if (ytChannel.lastVideoId !== videoId) {
                ytChannel.lastVideoId = videoId;

                await channel.send({
                    content: `<@&${MENTION_ROLE_ID}>`,
                    embeds: [youtubeEmbed(
                        ytChannel.username,
                        latestVideo.title,
                        `https://www.youtube.com/watch?v=${videoId}`,
                        latestVideo.thumbnails.medium.url
                    )],
                    allowedMentions: { roles: [MENTION_ROLE_ID] }
                });
            }
        } catch (err) {
            console.log('Error YouTube:', err.message);
        }
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
