// modules/kickEmbed.js
const { KICK_USERNAME } = process.env;
import { EmbedBuilder } from 'discord.js';

let lastStreamId = null;

export async function getKickData({ skipCache = false } = {}) {
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${KICK_USERNAME}`);
    const data = await res.json();
    const stream = data.livestream;

    if (stream?.is_live) {
      if (!skipCache && stream.id === lastStreamId) return null;
      lastStreamId = stream.id;

      console.log(`[kick] 🔴 Stream en vivo detectado: ${stream.session_title}`);

      return {
        username: stream.user?.username ?? KICK_USERNAME,
        title: stream.session_title ?? 'Sin título',
        url: `https://kick.com/${KICK_USERNAME}`,
        thumbnail: stream.thumbnail?.src ?? 'https://kick.com/assets/images/kick-logo.png',
        category: stream.category?.name ?? 'Sin categoría',
        viewers: stream.viewer_count ?? 0
      };
    }

    const last = data.recent_livestreams?.[0];
    if (!last) return null;

    if (!skipCache && last.id === lastStreamId) return null;
    lastStreamId = last.id;

    console.log(`[kick] 📺 Último stream detectado: ${last.session_title}`);

    return {
      username: KICK_USERNAME,
      title: last.session_title ?? 'Sin título',
      url: `https://kick.com/${KICK_USERNAME}`,
      thumbnail: last.thumbnail?.src ?? 'https://kick.com/assets/images/kick-logo.png',
      category: last.category?.name ?? 'Sin categoría',
      viewers: null,
      publishedAt: last.created_at ?? null
    };
  } catch (err) {
    console.error('[kickData:error]', err);
    return null;
  }
}

export function buildKickEmbed(username, title, url, thumbnail, category, viewers, publishedAt) {
  const embed = new EmbedBuilder()
    .setTitle(title ?? 'Sin título')
    .setURL(url ?? `https://kick.com/${KICK_USERNAME}`)
    .setColor('#00FF00')
    .setAuthor({ name: username ?? KICK_USERNAME })
    .setImage(thumbnail ?? 'https://kick.com/assets/images/kick-logo.png')
    .setFooter({ text: category ? `Categoría: ${category}` : 'Kick Stream' });

  if (viewers !== null && viewers !== undefined) {
    embed.setDescription(`🔴 En vivo con ${viewers} espectadores`);
  } else if (publishedAt) {
    embed.setDescription(`Último stream: ${new Date(publishedAt).toLocaleString()}`);
  } else {
    embed.setDescription('Stream finalizado');
  }

  return embed;
}
