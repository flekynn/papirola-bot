import { EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import fs from 'fs';

const {
  YOUTUBE_API_KEY,
  YOUTUBE_CHANNEL_ID
} = process.env;

const CACHE_FILE = './youtubeCache.json';

function getLastVideoId() {
  if (!fs.existsSync(CACHE_FILE)) return null;
  const raw = fs.readFileSync(CACHE_FILE);
  try {
    const json = JSON.parse(raw);
    return json.lastVideoId;
  } catch {
    return null;
  }
}

function setLastVideoId(id) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify({ lastVideoId: id }));
}

export async function getYoutubeEmbed(simulate = false) {
  if (simulate) {
    return new EmbedBuilder()
      .setTitle('📺 Nuevo video en YouTube')
      .setDescription('“Aphex Twin y el algoritmo cuántico”')
      .setURL('https://youtube.com/watch?v=dQw4w9WgXcQ')
      .setColor(0xFF0000)
      .setThumbnail('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
      .addFields(
        { name: 'Publicado', value: 'hace 1 hora', inline: true }
      )
      .setTimestamp(new Date());
  }

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${YOUTUBE_CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`);
  const data = await res.json();
  const item = data.items?.[0];
  if (!item || item.id.kind !== 'youtube#video') return null;

  const videoId = item.id.videoId;
  const lastId = getLastVideoId();
  if (videoId === lastId) return null;

  setLastVideoId(videoId);

 return new EmbedBuilder()
  .setTitle(`📺 Nuevo video en YouTube`)
  .setDescription(item.snippet.title)
  .setURL(`https://youtube.com/watch?v=${videoId}`)
  .setColor(0xFF0000)
  .setThumbnail(item.snippet.thumbnails?.high?.url || null)
  .addFields(
    { name: 'Publicado', value: item.snippet.publishedAt, inline: true }
  )
  .setTimestamp(new Date());
}
