// modules/twitchEmbed.js
import fs from 'fs/promises';
import { EmbedBuilder } from 'discord.js';

const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_USERNAME } = process.env;
const CACHE_FILE = './twitchCache.json';

let accessToken = null;
let tokenExpiry = 0;

async function getLastVodId() {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf8');
    const json = JSON.parse(raw);
    return json.lastVodId;
  } catch {
    return null;
  }
}

async function setLastVodId(id) {
  await fs.writeFile(CACHE_FILE, JSON.stringify({ lastVodId: id }));
}

async function getAccessToken() {
  const now = Date.now();
  if (accessToken && now < tokenExpiry) {
    console.log('[twitch:auth] 🟢 Token vigente, usando cache');
    return accessToken;
  }

  console.log('[twitch:auth] 🔄 Renovando token de Twitch...');
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });
  const data = await res.json();

  console.log('[twitch:auth] expires_in recibido:', data.expires_in);

  accessToken = data.access_token;
  tokenExpiry = now + (data.expires_in || 3600) * 1000;
  console.log('[twitch:auth] ✅ Token renovado correctamente');
  return accessToken;
}

export async function getTwitchData({ skipCache = false } = {}) {
  try {
    const token = await getAccessToken();

    const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${TWITCH_USERNAME}`, {
      headers: { 'Client-ID': TWITCH_CLIENT_ID, 'Authorization': `Bearer ${token}` }
    });
    const userData = await userRes.json();
    console.log('[twitchData] userData:', userData);

    const userId = userData.data?.[0]?.id;
    if (!userId) {
      console.warn('[twitchData] ❌ No se encontró el userId');
      return null;
    }

    const streamRes = await fetch(`https://api.twitch.tv/helix/streams?user_id=${userId}`, {
      headers: { 'Client-ID': TWITCH_CLIENT_ID, 'Authorization': `Bearer ${token}` }
    });
    const streamData = await streamRes.json();
    const stream = streamData.data?.[0];
    console.log('[twitchData] streamData:', streamData);
    console.log('[twitchData] stream:', stream);

    if (stream) {
      const gameRes = await fetch(`https://api.twitch.tv/helix/games?id=${stream.game_id}`, {
        headers: { 'Client-ID': TWITCH_CLIENT_ID, 'Authorization': `Bearer ${token}` }
      });
      const gameData = await gameRes.json();
      console.log('[twitchData] gameData:', gameData);

      const gameName = gameData.data?.[0]?.name || 'Desconocido';

      return {
        username: stream.user_name ?? TWITCH_USERNAME,
        title: stream.title ?? 'Sin título',
        url: `https://twitch.tv/${TWITCH_USERNAME}`,
        thumbnail: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${TWITCH_USERNAME}-320x180.jpg`,
        gameName,
        viewers: stream.viewer_count ?? 0
      };
    }

    const vodRes = await fetch(`https://api.twitch.tv/helix/videos?user_id=${userId}&type=archive`, {
      headers: { 'Client-ID': TWITCH_CLIENT_ID, 'Authorization': `Bearer ${token}` }
    });
    const vodData = await vodRes.json();
    const vod = vodData.data?.[0];
    console.log('[twitchData] vodData:', vodData);
    console.log('[twitchData] vod:', vod);

    if (!vod) {
      console.warn('[twitchData] ❌ No se encontró ningún VOD');
      return null;
    }

    if (!skipCache) {
      const lastId = await getLastVodId();
      console.log('[twitchData] lastVodId cacheado:', lastId);
      if (vod.id === lastId) {
        console.log('[twitchData] ⚠️ VOD ya fue publicado, ignorando');
        return null;
      }
      await setLastVodId(vod.id);
    }

    return {
      username: TWITCH_USERNAME,
      title: vod.title ?? 'Sin título',
      url: vod.url ?? `https://twitch.tv/${TWITCH_USERNAME}`,
      thumbnail: vod.thumbnail_url
        ? vod.thumbnail_url.replace('{width}', '320').replace('{height}', '180')
        : `https://static-cdn.jtvnw.net/previews-ttv/live_user_${TWITCH_USERNAME}-320x180.jpg`,
      gameName: null,
      viewers: null,
      publishedAt: vod.published_at ?? null
    };
  } catch (err) {
    console.error('[twitchData:error]', err);
    return null;
  }
}

export function buildTwitchEmbed(username, title, url, thumbnail, gameName, viewers, publishedAt) {
  console.log('[twitchEmbed] Datos recibidos:', { username, title, url, thumbnail, gameName, viewers, publishedAt });

  const embed = new EmbedBuilder()
    .setTitle(title ?? 'Sin título')
    .setURL(url ?? `https://twitch.tv/${TWITCH_USERNAME}`)
    .setImage(thumbnail ?? `https://static-cdn.jtvnw.net/previews-ttv/live_user_${TWITCH_USERNAME}-320x180.jpg`)
    .setColor('#9146FF')
    .setAuthor({ name: username ?? TWITCH_USERNAME });

  if (gameName) {
    embed.addFields({ name: 'Juego', value: gameName, inline: true });
  }

  if (viewers !== null && viewers !== undefined) {
    embed.setDescription(`🔴 En vivo con ${viewers} espectadores`);
  } else if (publishedAt) {
    embed.setDescription(`Último stream: ${new Date(publishedAt).toLocaleString()}`);
  } else {
    embed.setDescription('Stream finalizado');
  }

  return embed;
}
