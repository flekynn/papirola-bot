import fetch from 'node-fetch';
import { EmbedBuilder } from 'discord.js';

const { YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID } = process.env;

let lastVideoId = null;

export async function getYoutubeEmbed({ skipCache = false } = {}) {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${YOUTUBE_CHANNEL_ID}&part=snippet,id&order=date&maxResults=1`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    console.log('[youtubeEmbed] API response:', JSON.stringify(data, null, 2));

    if (!data.items || data.items.length === 0) {
      console.log('[youtubeEmbed] No se encontraron videos.');
      return null;
    }

    const video = data.items[0];

    if (video.id.kind !== 'youtube#video') {
      console.log('[youtubeEmbed] El contenido más reciente no es un video.');
      return null;
    }

    const videoId = video.id.videoId;

    if (!skipCache && videoId === lastVideoId) {
      console.log('[youtubeEmbed] Video ya detectado, ignorando:', videoId);
      return null;
    }

    lastVideoId = videoId;

    const embed = new EmbedBuilder()
      .setTitle(video.snippet.title)
      .setURL(`https://www.youtube.com/watch?v=${videoId}`)
      .setDescription(video.snippet.description || 'Nuevo video en YouTube')
      .setThumbnail(video.snippet.thumbnails.high.url)
      .setTimestamp(new Date(video.snippet.publishedAt))
      .setColor(0xff0000)
      .setAuthor({ name: video.snippet.channelTitle });

    console.log('[youtubeEmbed] Nuevo video detectado:', videoId);
    return embed;
  } catch (err) {
    console.error('[youtubeEmbed:error]', err);
    return null;
  }
}
