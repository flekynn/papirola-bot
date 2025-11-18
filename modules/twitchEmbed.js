import { EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import fs from 'fs';

const {
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
  TWITCH_USERNAME
} = process.env;

const CACHE_FILE = './twitchCache.json';

function getLastVodId() {
  if (!fs.existsSync(CACHE_FILE)) return null;
  const raw = fs.readFileSync(CACHE_FILE);
  try {
    const json = JSON.parse(raw);
    return json.lastVodId;
  } catch {
    return null;
  }
}

function setLastVodId(id) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify({ lastVodId: id }));
}

let accessToken = null;

async function getAccessToken() {
  if (accessToken) return accessToken;

  const res = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {
    method: 'POST'
  });
  const data = await res.json();
  accessToken = data.access_token;
  return accessToken;
}

export async function getTwitchEmbed({ skipCache = false } = {}) {
  const token = await getAccessToken();

  const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${TWITCH_USERNAME}`, {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${token}`
    }
  });
  const userData = await userRes.json();
  const userId = userData.data?.[0]?.id;
  if (!userId) return null;

  const streamRes = await fetch(`https://api.twitch.tv/helix/streams?user_id=${userId}`, {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${token}`
    }
  });
  const streamData = await streamRes.json();
  const stream = streamData.data?.[0];

  if (stream) {
    const gameRes = await fetch(`https://api.twitch.tv/helix/games?id=${stream.game_id}`, {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`
      }
    });
    const gameData = await gameRes.json();
    const gameName = gameData.data?.[0]?.name || 'Desconocido';

    return new EmbedBuilder()
      .setTitle(`🔴 ${stream.user_name} está en vivo en Twitch`)
      .setDescription(stream.title || 'Stream activo')
      .setURL(`https://twitch.tv/${TWITCH_USERNAME}`)
      .setColor(0x9146FF)
      .setThumbnail(`https://static-cdn.jtvnw.net/previews-ttv/live_user_${TWITCH_USERNAME}-320x180.jpg`)
      .addFields(
        { name: 'Categoría', value: gameName, inline: true },
        { name: 'Viewers', value: `${stream.viewer_count}`, inline: true }
      )
      .setTimestamp(new Date());
  }

  const vodRes = await fetch(`https://api.twitch.tv/helix/videos?user_id=${userId}&type=archive`, {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${token}`
    }
  });
  const vodData = await vodRes.json();
  const vod = vodData.data?.[0];
  if (!vod) return null;

  if (!skipCache) {
    const lastId = getLastVodId();
    if (vod.id === lastId) return null;
    setLastVodId(vod.id);
  }

  return new EmbedBuilder()
    .setTitle(`📼 Último stream de ${TWITCH_USERNAME}`)
    .setDescription(vod.title)
    .setURL(vod.url)
    .setColor(0x777777)
    .setThumbnail(vod.thumbnail_url.replace('%{width}', '320').replace('%{height}', '180'))
    .addFields(
      { name: 'Duración', value: vod.duration, inline: true },
      { name: 'Publicado', value: vod.published_at, inline: true }
    )
    .setTimestamp(new Date());
}
