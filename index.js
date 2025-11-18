require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const axios = require('axios');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { twitchEmbed, kickEmbed, youtubeEmbed } = require('./modules/messages');

// ------------------ CLIENTE DISCORD ------------------
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Colección de comandos
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath).forEach(file => {
    if (file.endsWith('.js')) {
        const command = require(path.join(commandsPath, file));
        client.commands.set(command.data.name, command);
    }
});

// ------------------ CONFIG ------------------
const STREAM_CHANNEL_ID = process.env.STREAM_CHANNEL_ID;
const TWITCH_USER = process.env.TWITCH_USER;
const KICK_USER = process.env.KICK_USER;
const MENTION_ROLE_ID = process.env.MENTION_ROLE_ID;
const TEST_CHANNEL_ID = process.env.TEST_CHANNEL_ID;

let twitchLive = false;
let kickLive = false;
let twitchToken = process.env.TWITCH_ACCESS_TOKEN || null;
let kickToken = null;

// ------------------ YOUTUBE CACHE ------------------
const YOUTUBE_CACHE_FILE = './youtubeCache.json';
let youtubeCache = {};
if (fs.existsSync(YOUTUBE_CACHE_FILE)) {
    try {
        youtubeCache = JSON.parse(fs.readFileSync(YOUTUBE_CACHE_FILE, 'utf-8'));
    } catch {
        console.log('[⚠️] youtubeCache.json vacío o corrupto, se inicializa vacío');
        youtubeCache = {};
    }
}

function saveYouTubeCache() {
    fs.writeFileSync(YOUTUBE_CACHE_FILE, JSON.stringify(youtubeCache, null, 4));
}

// ------------------ EXPRESS PARA OAUTH KICK ------------------
const app = express();
const PORT = process.env.PORT || 8080;
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
    const YOUTUBE_CHANNELS = process.env.YOUTUBE_CHANNELS
        ? process.env.YOUTUBE_CHANNELS.split(',').map(ch => ch.trim())
        : [];

    for (const username of YOUTUBE_CHANNELS) {
        try {
            const res = await axios.get(`https://www.googleapis.com/youtube/v3/channels`, {
                params: {
                    part: 'contentDetails',
                    forUsername: username,
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

            if (youtubeCache[username] !== videoId) {
                youtubeCache[username] = videoId;
                saveYouTubeCache();

                await channel.send({
                    content: `<@&${MENTION_ROLE_ID}>`,
                    embeds: [youtubeEmbed(
                        username,
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

// ------------------ EVENTOS ------------------
client.once('ready', async () => {
    console.log(`[${new Date().toLocaleTimeString()}] ✅ Bot conectado como ${client.user.tag}`);
    await refreshTwitchToken();
    checkStreams();
    setInterval(checkStreams, 60 * 1000); // cada 1 minuto
    setInterval(refreshTwitchToken, 50 * 60 * 1000); // renovar token Twitch
});

// Ejecutar comandos de slash
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (err) {
        console.error(err);
        interaction.reply({ content: 'Ocurrió un error ejecutando el comando.', ephemeral: true });
    }
});

// ------------------ LOGIN ------------------
client.login(process.env.TOKEN);
