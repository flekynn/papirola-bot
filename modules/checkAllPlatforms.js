// modules/checkAllPlatforms.js
import { getTwitchData } from './twitchEmbed.js';
import { getKickData } from './kickEmbed.js';
import { getYoutubeData } from './youtubeEmbed.js';
import { buildTwitchEmbed } from './twitchEmbed.js';
import { buildKickEmbed } from './kickEmbed.js';
import { buildYoutubeEmbed } from './youtubeEmbed.js';

export async function checkAllPlatforms({ skipCache = false } = {}) {
  try {
    console.log('[checkAllPlatforms] Iniciando chequeo en todas las plataformas...');

    const twitchData = await getTwitchData({ skipCache });
    const kickData = await getKickData({ skipCache });
    const youtubeData = await getYoutubeData({ skipCache });

    console.log('[checkAllPlatforms] twitchData:', twitchData);
    console.log('[checkAllPlatforms] kickData:', kickData);
    console.log('[checkAllPlatforms] youtubeData:', youtubeData);

    const twitchEmbed =
      twitchData
        ? buildTwitchEmbed(
            twitchData.username,
            twitchData.title,
            twitchData.url,
            twitchData.thumbnail,
            twitchData.gameName,
            twitchData.viewers,
            twitchData.publishedAt
          )
        : null;

    const kickEmbed =
      kickData
        ? buildKickEmbed(
            kickData.username,
            kickData.title,
            kickData.url,
            kickData.thumbnail,
            kickData.category,
            kickData.viewers,
            kickData.publishedAt
          )
        : null;

    const youtubeEmbed =
      youtubeData
        ? buildYoutubeEmbed(
            youtubeData.username,
            youtubeData.title,
            youtubeData.url,
            youtubeData.thumbnail,
            youtubeData.publishedAt
          )
        : null;

    return { twitchEmbed, kickEmbed, youtubeEmbed };
  } catch (err) {
    console.error('[checkAllPlatforms:error]', err);
    return { twitchEmbed: null, kickEmbed: null, youtubeEmbed: null };
  }
}
