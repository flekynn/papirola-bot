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

function parseDuration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const h = match?.[1] || '0';
  const m = match?.[2] || '0';
  const s = match?.[3] || '0';
  return `${h}h ${m}m ${s}s`;
}

export async function getYoutubeEmbed() {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${YOUTUBE_CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`);
  const data = await res.json();
  const item = data.items?.[0];
  if (!item || item.id.kind !== 'youtube#video') return null;

  const videoId = item.id.videoId;
  const lastId = getLastVideoId();
  if (videoId === lastId) return null;

  setLastVideoId(videoId);

  const detailsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`);
  const detailsData = await detailsRes.json();
  const durationRaw = detailsData.items?.[0]?.contentDetails?.duration || 'PT0M';

  return new EmbedBuilder()
    .setTitle(`📺 Nuevo video en YouTube`)
    .setDescription(item.snippet.title)
    .setURL(`https://youtube.com/watch?v=${videoId}`)
    .setColor(0xFF0000)
    .setThumbnail(item.snippet.thumbnails?.high?.url || null)
    .addFields(
      { name: 'Duración', value: parseDuration(durationRaw), inline: true },
      { name: 'Publicado', value: item.snippet.publishedAt, inline: true }
    )
    .setTimestamp(new Date());
}
