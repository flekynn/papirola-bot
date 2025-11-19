import { getTwitchData } from './twitchEmbed.js';
import { getKickData } from './kickEmbed.js';
import { getYoutubeData } from './youtubeEmbed.js';
import { buildTwitchEmbed, buildKickEmbed, buildYoutubeEmbed } from './messages.js';

const {
  STREAM_CHANNEL_ID,
  MENTION_ROLE_ID
} = process.env;

let twitchLive = false;
let kickLive = false;
let youtubeLive = false;

export async function checkAllPlatforms({ skipCache = false } = {}) {
  const twitchData = await getTwitchData({ skipCache });
  const kickData = await getKickData({ skipCache });
  const youtubeData = await getYoutubeData({ skipCache });

  const twitchEmbed = twitchData ? buildTwitchEmbed(
    twitchData.username,
    twitchData.title,
    twitchData.url,
    twitchData.thumbnail,
    twitchData.gameName,
    twitchData.viewers
  ) : null;

  const kickEmbed = kickData ? buildKickEmbed(
    kickData.username,
    kickData.title,
    kickData.url,
    kickData.thumbnail,
    kickData.category,
    kickData.viewers
  ) : null;

  const youtubeEmbed = youtubeData ? buildYoutubeEmbed(
    youtubeData.username,
    youtubeData.title,
    youtubeData.url,
    youtubeData.thumbnail,
    youtubeData.publishedAt
  ) : null;

  return { twitchEmbed, kickEmbed, youtubeEmbed };
}

export function startNotifier(client) {
  async function notify() {
    const channel = client.channels.cache.get(STREAM_CHANNEL_ID);
    if (!channel) return console.log('❌ Canal de stream no encontrado');

    const { twitchEmbed, kickEmbed, youtubeEmbed } = await checkAllPlatforms();

    if (twitchEmbed && !twitchLive) {
      await channel.send({ content: `<@&${MENTION_ROLE_ID}>`, embeds: [twitchEmbed] });
      twitchLive = true;
    } else if (!twitchEmbed) twitchLive = false;

    if (kickEmbed && !kickLive) {
      await channel.send({ content: `<@&${MENTION_ROLE_ID}>`, embeds: [kickEmbed] });
      kickLive = true;
    } else if (!kickEmbed) kickLive = false;

    if (youtubeEmbed && !youtubeLive) {
      await channel.send({ content: `<@&${MENTION_ROLE_ID}>`, embeds: [youtubeEmbed] });
      youtubeLive = true;
    } else if (!youtubeEmbed) youtubeLive = false;
  }

  // 👉 Sembrar cache inicial sin enviar notificaciones
  (async () => {
    await checkAllPlatforms({ skipCache: false });
    console.log('[notifier] Cache inicial sembrado, evitando notificaciones en el arranque.');
  })();

  // 👉 Intervalos fijos
  setInterval(notify, 60000);   // Twitch cada 1 min
  setInterval(notify, 60000);   // Kick cada 1 min
  setInterval(notify, 900000);  // YouTube cada 15 min
}
