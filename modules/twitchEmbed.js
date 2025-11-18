import { EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

const {
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
  TWITCH_USERNAME
} = process.env;

let accessToken = null;

async function getAccessToken() {
  if (accessToken) return accessToken;

  const res = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {
    method: 'POST'
  });
  const data = await res.json();
  accessToken = data.access_token;
  return accessToken;
}

export async function getTwitchEmbed(simulate = false) {
  if (simulate) {
    return new EmbedBuilder()
      .setTitle('🔴 flekynn está en vivo en Twitch')
      .setDescription('Jugando Half-Life mientras suena Aphex Twin.')
      .setURL('https://twitch.tv/flekynn')
      .setColor(0x9146FF)
      .setThumbnail('https://static-cdn.jtvnw.net/previews-ttv/live_user_flekynn-320x180.jpg')
      .addFields(
        { name: 'Juego', value: 'Half-Life', inline: true },
        { name: 'Viewers', value: '42', inline: true }
      )
      .setTimestamp(new Date());
  }

  const token = await getAccessToken();
  const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${TWITCH_USERNAME}`, {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${token}`
    }
  });
  const { data } = await res.json();
  if (!data || data.length === 0) return null;

  const stream = data[0];
  return new EmbedBuilder()
    .setTitle(`🔴 ${stream.user_name} está en vivo en Twitch`)
    .setDescription(stream.title || 'Stream activo')
    .setURL(`https://twitch.tv/${TWITCH_USERNAME}`)
    .setColor(0x9146FF)
    .setThumbnail(`https://static-cdn.jtvnw.net/previews-ttv/live_user_${TWITCH_USERNAME}-320x180.jpg`)
    .addFields(
      { name: 'Juego', value: stream.game_name || 'Desconocido', inline: true },
      { name: 'Viewers', value: `${stream.viewer_count}`, inline: true }
    )
    .setTimestamp(new Date());
}
