import { EmbedBuilder } from 'discord.js';
const { KICK_USERNAME } = process.env;

let lastStreamId = null;

/** Obtener datos de Kick (stream o último VOD) */
export async function getKickData({ skipCache = false } = {}) {
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${KICK_USERNAME}`);
    const data = await res.json();
    const stream = data.livestream;

    // 🟢 Stream en vivo
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
        title: stream.session_title || 'Sin título',
        url: `https://kick.com/${KICK_USERNAME}`,
        thumbnail: stream.thumbnail?.src || 'https://kick.com/assets/images/kick-logo.png',
        category: stream.category?.name || 'Sin categoría',
        viewers: stream.viewer_count ?? 0,
        duration: null,
        publishedAt: null
      };
    }

    // 📼 Último VOD
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
      title: last.session_title || 'Sin título',
      url: `https://kick.com/${KICK_USERNAME}`,
      thumbnail: last.thumbnail?.src || 'https://kick.com/assets/images/kick-logo.png',
      category: last.category?.name || 'Sin categoría',
      viewers: null,
      duration: last.duration ?? null,
      publishedAt: last.created_at ?? null
    };
  } catch (err) {
    console.error('[kickData:error]', err);
    return null;
  }
}

/** Formatear fecha */
function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

/** Construir embed — firma dual (objeto o posicional) */
export function buildKickEmbed(arg1, title, url, thumbnail, category, viewers, publishedAt, duration, enVivo) {
  const data = typeof arg1 === 'object' && arg1 !== null
    ? arg1
    : { username: arg1, title, url, thumbnail, category, viewers, publishedAt, duration, enVivo };

  const {
    username = KICK_USERNAME,
    title: t = 'Sin título',
    url: u = `https://kick.com/${KICK_USERNAME}`,
    thumbnail: th = 'https://kick.com/assets/images/kick-logo.png',
    category: c,
    viewers: v,
    publishedAt: p,
    duration: d,
    enVivo: live = false
  } = data;

  console.log('[kickEmbed] Datos recibidos:', { username, title: t, url: u, thumbnail: th, category: c, viewers: v, publishedAt: p, duration: d, enVivo: live });

  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setAuthor({ name: username, url: `https://kick.com/${username}` });

  if (live) {
    embed.setTitle(`🟢 ${t}`);
    embed.setDescription([
      c ? `📺 Categoría: ${c}` : null,
      `👥 Viewers: ${v ?? 0}`,
      `🔗 Ver en vivo: ${u}`
    ].filter(Boolean).join('\n'));
    embed.setFooter({ text: 'En vivo en Kick' });
  } else {
    embed.setTitle(`📼 ${t}`);
    embed.setDescription([
      d ? `⏱️ Duración: ${d}` : null,
      p ? `📅 Publicado: ${formatDate(p)}` : null,
      `🔗 Ver el VOD: ${u}`
    ].filter(Boolean).join('\n'));
    embed.setFooter({ text: 'Último VOD en Kick' });
  }

  if (th) embed.setImage(th);
  return embed;
}
