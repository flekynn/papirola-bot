import { EmbedBuilder } from 'discord.js';
const { KICK_USERNAME } = process.env;

let lastStreamId = null;

export async function getKickData({ skipCache = false } = {}) {
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${KICK_USERNAME}`);
    const data = await res.json();
    const stream = data.livestream;

    if (stream?.is_live) {
      if (!skipCache && stream.id === lastStreamId) {
        console.log('[kickData] ⚠️ Stream ya fue publicado, ignorando');
        return null;
      }
      lastStreamId = stream.id;

      console.log('[kickData] 🔴 Stream en vivo detectado:', stream.session_title);

      return {
        enVivo: true,
        username: stream.user?.username ?? KICK_USERNAME,
        title: stream.session_title ?? 'Sin título',
        url: `https://kick.com/${KICK_USERNAME}`,
        thumbnail: stream.thumbnail?.src ?? 'https://kick.com/assets/images/kick-logo.png',
        category: stream.category?.name ?? 'Sin categoría',
        viewers: stream.viewer_count ?? 0,
        duration: null,
        publishedAt: null
      };
    }

    const last = data.recent_livestreams?.[0];
    if (!last) {
      console.warn('[kickData] ❌ No se encontró ningún VOD');
      return null;
    }

    if (!skipCache && last.id === lastStreamId) {
      console.log('[kickData] ⚠️ VOD ya fue publicado, ignorando');
      return null;
    }
    lastStreamId = last.id;

    console.log('[kickData] 📼 Último VOD detectado:', last.session_title);

    return {
      enVivo: false,
      username: KICK_USERNAME,
      title: last.session_title ?? 'Sin título',
      url: `https://kick.com/${KICK_USERNAME}`,
      thumbnail: last.thumbnail?.src ?? 'https://kick.com/assets/images/kick-logo.png',
      category: last.category?.name ?? 'Sin categoría',
      viewers: null,
      duration: last.duration ?? null,
      publishedAt: last.created_at ?? null
    };
  } catch (err) {
    console.error('[kickData:error]', err);
    return null;
  }
}

export function buildKickEmbed(username, title, url, thumbnail, category, viewers, publishedAt, duration, enVivo) {
  console.log('[kickEmbed] Datos recibidos:', { username, title, url, thumbnail, category, viewers, publishedAt, duration, enVivo });

  const embed = new EmbedBuilder()
    .setTitle(enVivo ? '🟢 En vivo en Kick' : '📼 Último VOD en Kick')
    .setURL(url ?? `https://kick.com/${KICK_USERNAME}`)
    .setImage(thumbnail ?? 'https://kick.com/assets/images/kick-logo.png')
    .setColor('#00FF00')
    .setAuthor({ name: username ?? KICK_USERNAME });

  embed.setDescription(`**${title}**`);

  const fields = [];

  if (category) fields.push({ name: 'Categoría', value: category, inline: true });
  if (duration) fields.push({ name: 'Duración', value: duration, inline: true });
  if (viewers !== null && viewers !== undefined) fields.push({ name: 'Espectadores', value: `${viewers}`, inline: true });
  if (publishedAt) fields.push({ name: 'Publicado', value: new Date(publishedAt).toLocaleString(), inline: true });

  if (fields.length > 0) embed.addFields(...fields);

  embed.setFooter({ text: enVivo ? 'Ver el stream' : 'Ver el VOD' });

  return embed;
}
