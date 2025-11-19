import { getTwitchData, buildTwitchEmbed } from './twitchEmbed.js';
import { getKickData, buildKickEmbed } from './kickEmbed.js';
import { getYoutubeData, buildYoutubeEmbed } from './youtubeEmbed.js';

const { STREAM_CHANNEL_ID, MENTION_ROLE_ID } = process.env;

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
    twitchData.viewers,
    twitchData.publishedAt,
    twitchData.duration,
    twitchData.enVivo
  ) : null;

  const kickEmbed = kickData ? buildKickEmbed(
    kickData.username,
    kickData.title,
    kickData.url,
    kickData.thumbnail,
    kickData.category,
    kickData.viewers,
    kickData.publishedAt,
    kickData.duration,
    kickData.enVivo
  ) : null;

  const youtubeEmbed = youtubeData ? buildYoutubeEmbed(
    youtubeData.username,
    youtubeData.title,
    youtubeData.url,
    youtubeData.thumbnail,
    youtubeData.publishedAt,
    youtubeData.duration,
    youtubeData.enVivo
  ) : null;

  return { twitchEmbed, kickEmbed, youtubeEmbed, twitchData, kickData, youtubeData };
}

export function startNotifier(client) {
  async function notify() {
    const channel = client.channels.cache.get(STREAM_CHANNEL_ID);
    if (!channel) return console.log('❌ Canal de stream no encontrado');

    const { twitchEmbed, kickEmbed, youtubeEmbed, twitchData, kickData, youtubeData } = await checkAllPlatforms();

    if (twitchEmbed && !twitchLive) {
      const msg = twitchData.enVivo
        ? `🔴 **${twitchData.username} está en vivo en Twitch**\n${twitchData.url}`
        : `📼 **${twitchData.username} hizo un directo en Twitch**\n${twitchData.url}`;
      await channel.send({ content: `<@&${MENTION_ROLE_ID}>\n${msg}`, embeds: [twitchEmbed] });
      twitchLive = true;
    } else if (!twitchEmbed) twitchLive = false;

    if (kickEmbed && !kickLive) {
      const msg = kickData.enVivo
        ? `🟢 **${kickData.username} está en vivo en Kick**\n${kickData.url}`
        : `📼 **${kickData.username} hizo un directo en Kick**\n${kickData.url}`;
      await channel.send({ content: `<@&${MENTION_ROLE_ID}>\n${msg}`, embeds: [kickEmbed] });
      kickLive = true;
    } else if (!kickEmbed) kickLive = false;

    if (youtubeEmbed && !youtubeLive) {
      const msg = `📺 **${youtubeData.username} subió un nuevo video a YouTube**\n${youtubeData.url}`;
      await channel.send({ content: `<@&${MENTION_ROLE_ID}>\n${msg}`, embeds: [youtubeEmbed] });
      youtubeLive = true;
    } else if (!youtubeEmbed) youtubeLive = false;
  }

  (async () => {
    await checkAllPlatforms({ skipCache: false });
    console.log('[notifier] Cache inicial sembrado, evitando notificaciones en el arranque.');
  })();

  setInterval(notify, 60000);   // Twitch cada 1 min
  setInterval(notify, 60000);   // Kick cada 1 min
  setInterval(notify, 900000);  // YouTube cada 15 min
}
