import { EmbedBuilder } from 'discord.js';
import fs from 'node:fs/promises';
import { request } from 'undici';

const cachePath = 'youtubeCache.json';

async function readCache() {
  try {
    const raw = await fs.readFile(cachePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { lastVideoIdByChannel: {} };
  }
}

async function writeCache(cache) {
  await fs.writeFile(cachePath, JSON.stringify(cache, null, 2), 'utf8');
}

export async function checkYouTubeUploads() {
  const { YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID } = process.env;
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) return [];

  const cache = await readCache();
  const res = await request('https://www.googleapis.com/youtube/v3/search?' + new URLSearchParams({
    key: YOUTUBE_API_KEY,
    channelId: YOUTUBE_CHANNEL_ID,
    part: 'snippet',
    order: 'date',
    maxResults: '1'
  }).toString());

  const data = await res.body.json();
  const item = data.items?.[0];
  const videoId = item?.id?.videoId;
  if (!videoId) return [];

  const last = cache.lastVideoIdByChannel[YOUTUBE_CHANNEL_ID];
  if (last === videoId) return [];

  cache.lastVideoIdByChannel[YOUTUBE_CHANNEL_ID] = videoId;
  await writeCache(cache);

  const embed = new EmbedBuilder()
    .setTitle(`Nuevo video: ${item.snippet.title}`)
    .setDescription(item.snippet.description?.slice(0, 200) ?? 'Nuevo upload')
    .setURL(`https://youtu.be/${videoId}`)
    .setColor(0xFF0000)
    .setTimestamp(new Date(item.snippet.publishedAt));

  return [embed];
}
