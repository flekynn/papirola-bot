import { getTwitchData, buildTwitchEmbed } from './twitchEmbed.js';
import { getKickData, buildKickEmbed } from './kickEmbed.js';
import { getYoutubeData, buildYoutubeEmbed } from './youtubeEmbed.js';

const { STREAM_CHANNEL_ID, MENTION_ROLE_ID } = process.env;

let twitchLive = false;
let kickLive = false;
let youtubeLive = false;

export async function checkTwitchKick({ skipCache = false } = {}) {
  const twitchData = await getTwitchData({ skipCache });
  const kickData   = await getKickData({ skipCache });

  const twitchEmbed = twitchData ? buildTwitchEmbed(twitchData) : null;
  const kickEmbed   = kickData   ? buildKickEmbed(kickData)     : null;

  return { twitchEmbed, kickEmbed, twitchData, kickData };
}

export async function checkYouTube({ skipCache = false } = {}) {
  const youtubeData = await getYoutubeData({ skipCache });
  const youtubeEmbed = youtubeData ? buildYoutubeEmbed(youtubeData) : null;

  return { youtubeEmbed, youtubeData };
}

export function startNotifier(client) {
  async function notifyTwitchKick() {
    const channel = client.channels.cache.get(STREAM_CHANNEL_ID);
    if (!channel) return console.log('❌ Canal de stream no encontrado');

    const { twitchEmbed, kickEmbed, twitchData, kickData } = await checkTwitchKick();

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
  }

  async function notifyYouTube() {
    const channel = client.channels.cache.get(STREAM_CHANNEL_ID);
    if (!channel) return console.log('❌ Canal de stream no encontrado');

    const { youtubeEmbed, youtubeData } = await checkYouTube();

    if (youtubeEmbed && !youtubeLive) {
      const msg = `📺 **${youtubeData.username} subió un nuevo video a YouTube**\n${youtubeData.url}`;
      await channel.send({ content: `<@&${MENTION_ROLE_ID}>\n${msg}`, embeds: [youtubeEmbed] });
      youtubeLive = true;
    } else if (!youtubeEmbed) youtubeLive = false;
  }

  // Cache inicial
  (async () => {
    await checkTwitchKick({ skipCache: false });
    await checkYouTube({ skipCache: false });
    console.log('[notifier] Cache inicial sembrado, evitando notificaciones en el arranque.');
  })();

  // Intervalos separados
  setInterval(notifyTwitchKick, 60000);   // Twitch y Kick cada 1 min
  setInterval(notifyYouTube, 900000);     // YouTube cada 15 min
}
