import fs from 'fs/promises';
import { EmbedBuilder } from 'discord.js';

const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_USERNAME } = process.env;
const CACHE_FILE = './twitchCache.json';

let accessToken = null;
let tokenExpiry = 0;

/** Cache del último VOD */
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

/** Token de acceso */
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

  accessToken = data.access_token;
  tokenExpiry = now + (data.expires_in || 3600) * 1000;
  console.log('[twitch:auth] ✅ Token renovado correctamente');
  return accessToken;
}

/** Obtener datos de Twitch (stream o último VOD) */
export async function getTwitchData({ skipCache = false } = {}) {
  try {
    const token = await getAccessToken();

    // Datos de usuario
    const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${TWITCH_USERNAME}`, {
      headers: { 'Client-ID': TWITCH_CLIENT_ID, 'Authorization': `Bearer ${token}` }
    });
    const userData = await userRes.json();
    const userId = userData.data?.[0]?.id;
    if (!userId) return null;

    // Stream actual
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
        enVivo: true,
        username: stream.user_name ?? TWITCH_USERNAME,
        title: stream.title || 'Sin título',
        url: `https://twitch.tv/${TWITCH_USERNAME}`,
        thumbnail: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${TWITCH_USERNAME}-320x180.jpg`,
        gameName,
        viewers: stream.viewer_count ?? 0,
        duration: null,
        publishedAt: null
      };
    }

    // Último VOD
    const vodRes = await fetch(`https://api.twitch.tv/helix/videos?user_id=${userId}&type=archive`, {
      headers: { 'Client-ID': TWITCH_CLIENT_ID, 'Authorization': `Bearer ${token}` }
    });
    const vodData = await vodRes.json();
    const vod = vodData.data?.[0];
    if (!vod) return null;

    if (!skipCache) {
      const lastId = await getLastVodId();
      if (vod.id === lastId) {
        console.log('[twitchData] ⚠️ VOD ya fue publicado, ignorando');
        return null;
      }
      await setLastVodId(vod.id);
    }

    return {
      enVivo: false,
      username: TWITCH_USERNAME,
      title: vod.title || 'Sin título',
      url: vod.url || `https://twitch.tv/${TWITCH_USERNAME}`,
      thumbnail: vod.thumbnail_url
        ? vod.thumbnail_url.replace('{width}', '320').replace('{height}', '180')
        : `https://static-cdn.jtvnw.net/previews-ttv/live_user_${TWITCH_USERNAME}-320x180.jpg`,
      gameName: null,
      viewers: null,
      duration: vod.duration ?? null,
      publishedAt: vod.published_at ?? null
    };
  } catch (err) {
    console.error('[twitchData:error]', err);
    return null;
  }
}

/** Formatear fecha */
function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

/** Construir embed */
export function buildTwitchEmbed({ username, title, url, thumbnail, gameName, viewers, publishedAt, duration, enVivo }) {
  console.log('[twitchEmbed] Datos recibidos:', { username, title, url, thumbnail, gameName, viewers, publishedAt, duration, enVivo });

  // 🔧 Fix: limpiar thumbnail si viene con %320x%180
  const cleanThumb = (thumb) => {
    if (!thumb) return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${TWITCH_USERNAME}-320x180.jpg`;
    return thumb.replace('%320x%180', '320x180');
  };

  const embed = new EmbedBuilder()
    .setColor('#9146FF')
    .setAuthor({ name: username ?? TWITCH_USERNAME, url: `https://twitch.tv/${username ?? TWITCH_USERNAME}` });

  if (enVivo) {
    embed.setTitle(`🟢 ${title ?? 'Sin título'}`);
    embed.setDescription([
      gameName ? `📺 Categoría: ${gameName}` : null,
      `👥 Viewers: ${viewers ?? 0}`,
      `🔗 Ver en vivo: ${url ?? `https://twitch.tv/${TWITCH_USERNAME}`}`
    ].filter(Boolean).join('\n'));
    embed.setFooter({ text: 'En vivo en Twitch' });
  } else {
    embed.setTitle(`📼 ${title ?? 'Sin título'}`);
    embed.setDescription([
      duration ? `⏱️ Duración: ${duration}` : null,
      publishedAt ? `📅 Publicado: ${new Date(publishedAt).toLocaleString('es-AR')}` : null,
      `🔗 Ver el VOD: ${url ?? `https://twitch.tv/${TWITCH_USERNAME}`}`
    ].filter(Boolean).join('\n'));
    embed.setFooter({ text: 'Último VOD en Twitch' });
  }

  embed.setImage(cleanThumb(thumbnail));
  return embed;
}

