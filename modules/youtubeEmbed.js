import fs from 'fs/promises';
import { EmbedBuilder } from 'discord.js';

const { YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID } = process.env;
const CACHE_FILE = './youtubeCache.json';

let lastVideoId = null;
let quotaBlocked = false;

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
      enVivo: false,
      username: video.snippet?.channelTitle ?? 'Canal desconocido',
      title: video.snippet?.title ?? 'Sin título',
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: video.snippet?.thumbnails?.high?.url ?? 'https://www.youtube.com/img/branding/youtube-logo.png',
      publishedAt: video.snippet?.publishedAt ?? null,
      duration: null
    };
  } catch (err) {
    console.error('[youtubeData:error]', err);
    return null;
  }
}

export function buildYoutubeEmbed(username, title, url, thumbnail, publishedAt, duration, enVivo) {
  console.log('[youtubeEmbed] Datos recibidos:', { username, title, url, thumbnail, publishedAt, duration, enVivo });

  const embed = new EmbedBuilder()
    .setTitle('📺 Nuevo video en YouTube')
    .setURL(url ?? 'https://www.youtube.com')
    .setImage(thumbnail ?? 'https://www.youtube.com/img/branding/youtube-logo.png')
    .setColor('#FF0000')
    .setAuthor({ name: username ?? 'YouTube' });

  embed.setDescription(`**${title}**`);

  const fields = [];

  if (publishedAt) fields.push({ name: 'Publicado', value: new Date(publishedAt).toLocaleString(), inline: true });
  if (duration) fields.push({ name: 'Duración', value: duration, inline: true });

  if (fields.length > 0) embed.addFields(...fields);

  embed.setFooter({ text: 'Ver el video' });

  return embed;
}
