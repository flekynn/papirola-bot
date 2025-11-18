import { EmbedBuilder } from 'discord.js';
import { request } from 'undici';

async function getTwitchAppToken() {
  const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } = process.env;
  const res = await request('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials'
    }).toString()
  });
  const data = await res.body.json();
  return data.access_token;
}

export async function checkTwitchLive() {
  const { TWITCH_CLIENT_ID, TWITCH_USERNAME } = process.env;
  if (!TWITCH_CLIENT_ID || !TWITCH_USERNAME) return [];

  const token = await getTwitchAppToken();
  const res = await request(`https://api.twitch.tv/helix/streams?user_login=${TWITCH_USERNAME}`, {
    headers: {
      'Client-Id': TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await res.body.json();
  if (!data.data?.length) return [];

  const stream = data.data[0];
  const embed = new EmbedBuilder()
    .setTitle(`${stream.user_name} está en vivo en Twitch`)
    .setDescription(stream.title)
    .setURL(`https://twitch.tv/${stream.user_name}`)
    .setColor(0x9146FF)
    .setTimestamp(new Date(stream.started_at));

  return [embed];
}
