import fs from 'fs/promises';
import { EmbedBuilder } from 'discord.js';

const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_USERNAME } = process.env;
const CACHE_FILE = './twitchCache.json';

let accessToken = null;

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
  if (accessToken) return accessToken;
  console.log('[twitch:auth] 🔄 Renovando token de Twitch...');
  const res = await fetch(`https://id.twitch.tv/oauth2/token?...`, { method: 'POST' });
  const data = await res.json();
  accessToken = data.access_token;
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
    const userId = userData.data?.[0]?.id;
    if (!userId) return null;

    const streamRes = await fetch(`https://api.twitch.tv/helix/streams?user_id=${userId}`, {
      headers: { 'Client-ID': TWITCH_CLIENT_ID, 'Authorization': `Bearer ${token}` }
    });
    const streamData = await streamRes.json();
    const stream = streamData.data?.[0];

    if (stream) {
      const gameRes = await fetch(`https://api.twitch.tv/helix/games?id=${stream.game_id}`, {
        headers: { 'Client-ID': TWITCH_CLIENT_ID, 'Authorization': `Bearer ${token}` }
      });
      const gameData = await gameRes.json();
      const gameName = gameData.data?.[0]?.name || 'Desconocido';

      return {
        username: stream.user_name,
        title: stream.title,
        url: `https://twitch.tv/${TWITCH_USERNAME}`,
        thumbnail: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${TWITCH_USERNAME}-320x180.jpg`,
        gameName,
        viewers: stream.viewer_count
      };
    }

    const vodRes = await fetch(`https://api.twitch.tv/helix/videos?user_id=${userId}&type=archive`, {
      headers: { 'Client-ID': TWITCH_CLIENT_ID, 'Authorization': `Bearer ${token}` }
    });
    const vodData = await vodRes.json();
    const vod = vodData.data?.[0];
    if (!vod) return null;

    if (!skipCache) {
      const lastId = await getLastVodId();
      if (vod.id === lastId) return null;
      await setLastVodId(vod.id);
    }

    return {
      username: TWITCH_USERNAME,
      title: vod.title,
      url: vod.url,
      thumbnail: vod.thumbnail_url.replace('{width}', '320').replace('{height}', '180'),
      gameName: null,
      viewers: null,
      publishedAt: vod.published_at
    };
  } catch (err) {
    console.error('[twitchData:error]', err);
    return null;
  }
}

export function buildTwitchEmbed(username, title, url, thumbnail, gameName, viewers, publishedAt) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setURL(url)
    .setImage(thumbnail)
    .setColor('#9146FF') // color oficial de Twitch
    .setAuthor({ name: username });

  if (gameName) {
    embed.addFields({ name: 'Juego', value: gameName, inline: true });
  }

  if (viewers !== null) {
    embed.setDescription(`🔴 En vivo con ${viewers} espectadores`);
  } else if (publishedAt) {
    embed.setDescription(`Último stream: ${new Date(publishedAt).toLocaleString()}`);
  }

  return embed;
}
