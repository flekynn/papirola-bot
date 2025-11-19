import { getTwitchEmbed } from './twitchEmbed.js';
import { getKickEmbed } from './kickEmbed.js';
import { getYoutubeEmbed } from './youtubeEmbed.js';
import axios from 'axios';

const {
  STREAM_CHANNEL_ID,
  TWITCH_USER,
  KICK_USER,
  MENTION_ROLE_ID,
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
} = process.env;

let twitchLive = false;
let kickLive = false;
let twitchToken = null;

async function refreshTwitchToken() {
  try {
    const res = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        grant_type: 'client_credentials',
      },
    });
    twitchToken = res.data.access_token;
    console.log(`[${new Date().toLocaleTimeString()}] 🔄 Token Twitch renovado`);
  } catch (err) {
    console.log('Error renovando token Twitch:', err.message);
  }
}

export async function checkAllPlatforms({ skipCache = false } = {}) {
  const twitchEmbed = await getTwitchEmbed({ skipCache, token: twitchToken, user: TWITCH_USER });
  const kickEmbed = await getKickEmbed({ skipCache, user: KICK_USER });
  const youtubeEmbed = await getYoutubeEmbed({ skipCache });

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
    } else if (!twitchEmbed) {
      twitchLive = false;
    }

    if (kickEmbed && !kickLive) {
      await channel.send({ content: `<@&${MENTION_ROLE_ID}>`, embeds: [kickEmbed] });
      kickLive = true;
    } else if (!kickEmbed) {
      kickLive = false;
    }

    if (youtubeEmbed) {
      await channel.send({ content: `<@&${MENTION_ROLE_ID}>`, embeds: [youtubeEmbed] });
    }
  }

  refreshTwitchToken();
  notify();
  setInterval(notify, 60 * 1000);
  setInterval(refreshTwitchToken, 50 * 60 * 1000);
}
