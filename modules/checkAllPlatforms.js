import { getTwitchEmbed } from './twitchEmbed.js';
import { getKickEmbed } from './kickEmbed.js';
import { getYoutubeEmbed } from './youtubeEmbed.js';

export async function checkAllPlatforms() {
  const embeds = [];

  const twitch = await getTwitchEmbed();
  if (twitch) embeds.push(twitch);

  const kick = await getKickEmbed();
  if (kick) embeds.push(kick);

  const youtube = await getYoutubeEmbed();
  if (youtube) embeds.push(youtube);

  return embeds;
}
