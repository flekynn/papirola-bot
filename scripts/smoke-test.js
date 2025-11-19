import 'dotenv/config';
import { getTwitchData, buildTwitchEmbed } from '../modules/twitchEmbed.js';
import { getKickData, buildKickEmbed } from '../modules/kickEmbed.js';
import { getYoutubeData, buildYoutubeEmbed } from '../modules/youtubeEmbed.js';

function logEmbedInfo(tag, embed) {
  const data = embed.data || embed; // discord.js v14
  console.log(`\n[${tag}] title:`, data.title);
  console.log(`[${tag}] description:\n${data.description}`);
  console.log(`[${tag}] author:`, data.author?.name, data.author?.url);
  console.log(`[${tag}] image:`, data.image?.url);
  console.log(`[${tag}] footer:`, data.footer?.text);
}

(async () => {
  const twitch = await getTwitchData({ skipCache: true });
  console.log('[twitchData]', twitch);
  if (twitch) logEmbedInfo('Twitch', buildTwitchEmbed(twitch));

  const kick = await getKickData({ skipCache: true });
  console.log('[kickData]', kick);
  if (kick) logEmbedInfo('Kick', buildKickEmbed(kick));

  const yt = await getYoutubeData({ skipCache: true });
  console.log('[youtubeData]', yt);
  if (yt) logEmbedInfo('YouTube', buildYoutubeEmbed(yt));
})();
