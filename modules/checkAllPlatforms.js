// checkAllPlatforms.js
import fetch from 'node-fetch';
import { buildTwitchEmbed } from './twitchEmbed.js';
import { buildKickEmbed } from './kickEmbed.js';
import { buildYoutubeEmbed } from './youtubeEmbed.js';

// Variables persistentes a nivel de módulo
let twitchToken = null;
let twitchTokenExpiry = 0;
let kickToken = null;
let kickTokenExpiry = 0;
let youtubeToken = null;
let youtubeTokenExpiry = 0;

// Helper para Twitch
async function getTwitchToken() {
  const now = Date.now();
  if (twitchToken && now < twitchTokenExpiry) {
    console.log('[twitch:auth] 🟢 Token vigente, usando cache');
    return twitchToken;
  }

  console.log('[twitch:auth] 🔄 Renovando token de Twitch...');
  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });
  const data = await response.json();

  twitchToken = data.access_token;
  twitchTokenExpiry = now + data.expires_in * 1000; // ojo con el *1000
  console.log('[twitch:auth] ✅ Token renovado correctamente');
  return twitchToken;
}

// Helper para Kick (ajustá endpoint según tu implementación)
async function getKickToken() {
  const now = Date.now();
  if (kickToken && now < kickTokenExpiry) {
    console.log('[kick:auth] 🟢 Token vigente, usando cache');
    return kickToken;
  }

  console.log('[kick:auth] 🔄 Renovando token de Kick...');
  const response = await fetch('https://kick.com/oauth/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.KICK_CLIENT_ID,
      client_secret: process.env.KICK_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });
  const data = await response.json();

  kickToken = data.access_token;
  kickTokenExpiry = now + data.expires_in * 1000;
  console.log('[kick:auth] ✅ Token renovado correctamente');
  return kickToken;
}

// Helper para YouTube (ajustá según tu flujo OAuth)
async function getYoutubeToken() {
  const now = Date.now();
  if (youtubeToken && now < youtubeTokenExpiry) {
    console.log('[youtube:auth] 🟢 Token vigente, usando cache');
    return youtubeToken;
  }

  console.log('[youtube:auth] 🔄 Renovando token de YouTube...');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });
  const data = await response.json();

  youtubeToken = data.access_token;
  youtubeTokenExpiry = now + data.expires_in * 1000;
  console.log('[youtube:auth] ✅ Token renovado correctamente');
  return youtubeToken;
}

// Función principal
export async function checkAllPlatforms() {
  try {
    const twitchToken = await getTwitchToken();
    const kickToken = await getKickToken();
    const youtubeToken = await getYoutubeToken();

    const twitchEmbed = await buildTwitchEmbed(twitchToken);
    const kickEmbed = await buildKickEmbed(kickToken);
    const youtubeEmbed = await buildYoutubeEmbed(youtubeToken);

    return { twitchEmbed, kickEmbed, youtubeEmbed };
  } catch (err) {
    console.error('[notifier:error]', err);
    return { twitchEmbed: null, kickEmbed: null, youtubeEmbed: null };
  }
}
