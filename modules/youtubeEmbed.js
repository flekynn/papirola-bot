import fs from 'fs/promises';
import { EmbedBuilder } from 'discord.js';

const { YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID } = process.env;
const CACHE_FILE = './youtubeCache.json';

let lastVideoId = null;
let quotaBlocked = false;

/** Cache del último video */
async function getLastVideoId() {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf8');
    const json = JSON.parse(raw);
    return json.lastVideoId;
  } catch {
    return null;
  }
}
async function setLastVideoId(id) {
  await fs.writeFile(CACHE_FILE, JSON.stringify({ lastVideoId: id }));
}

/** Obtener datos del último video de YouTube */
export async function getYoutubeData({ skipCache = false } = {}) {
  if (quotaBlocked) return null;

  const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${YOUTUBE_CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error?.errors?.[0]?.reason === 'quotaExceeded') {
      quotaBlocked = true;
      console.warn('[youtube] ⚠️ Cuota de API excedida, bloqueando nuevas consultas');
      return null;
    }

    if (!data.items || data.items.length === 0) return null;

    const video = data.items[0];
    if (video.id.kind !== 'youtube#video') return null;

    const videoId = video.id.videoId;

    if (!skipCache) {
      const lastId = lastVideoId || await getLastVideoId();
      if (videoId === lastId) return null;
      await setLastVideoId(videoId);
    }

    lastVideoId = videoId;

    return {
      username: video.snippet?.channelTitle || 'Canal desconocido',
      title: video.snippet?.title || 'Sin título',
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: video.snippet?.thumbnails?.high?.url || 'https://www.youtube.com/img/branding/youtube-logo.png',
      publishedAt: video.snippet?.publishedAt ?? null,
      duration: null
    };
  } catch (err) {
    console.error('[youtubeData:error]', err);
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

/** Construir embed — firma dual (objeto o posicional) */
export function buildYoutubeEmbed(arg1, title, url, thumbnail, publishedAt) {
  const data = typeof arg1 === 'object' && arg1 !== null
    ? arg1
    : { username: arg1, title, url, thumbnail, publishedAt };

  const {
    username = 'YouTube',
    title: t = 'Sin título',
    url: u = 'https://www.youtube.com',
    thumbnail: th = 'https://www.youtube.com/img/branding/youtube-logo.png',
    publishedAt: p
  } = data;

  console.log('[youtubeEmbed] Datos recibidos:', { username, title: t, url: u, thumbnail: th, publishedAt: p });

  const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setAuthor({ name: username, url: `https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}` })
    .setTitle(`📺 ${t}`);

  embed.setDescription([
    p ? `📅 Publicado: ${formatDate(p)}` : null,
    `🔗 Ver el video: ${u}`
  ].filter(Boolean).join('\n'));

  if (th) embed.setImage(th);
  embed.setFooter({ text: 'Nuevo video en YouTube' });

  return embed;
}
