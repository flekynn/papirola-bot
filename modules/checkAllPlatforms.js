import { getTwitchEmbed } from './twitchEmbed.js';
import { getYoutubeEmbed } from './youtubeEmbed.js';
import { getKickEmbed } from './kickEmbed.js';

export async function checkAllPlatforms({ skipCache = false } = {}) {
  const embeds = [];

  const twitch = await getTwitchEmbed({ skipCache });
  if (twitch) embeds.push(twitch);

  const youtube = await getYoutubeEmbed({ skipCache });
  if (youtube) embeds.push(youtube);

  const kick = await getKickEmbed({ skipCache });
  if (kick) embeds.push(kick);

  return embeds;
}
