import { EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

const { KICK_USERNAME } = process.env;

export async function getKickEmbed({ skipCache = false } = {}) {
  const res = await fetch(`https://kick.com/api/v2/channels/${KICK_USERNAME}`);
  const data = await res.json();
  const stream = data.livestream;

  if (stream?.is_live) {
    return new EmbedBuilder()
      .setTitle(`🟢 ${stream.user.username} está transmitiendo en Kick`)
      .setDescription(stream.session_title || 'Stream activo')
      .setURL(`https://kick.com/${KICK_USERNAME}`)
      .setColor(0x00D26A)
      .setThumbnail(stream.thumbnail?.src || null)
      .addFields(
        { name: 'Categoría', value: stream.category?.name || 'Desconocida', inline: true },
        { name: 'Viewers', value: `${stream.viewer_count || 'N/A'}`, inline: true }
      )
      .setTimestamp(new Date());
  }

  const last = data.recent_livestreams?.[0];
  if (!last) return null;

  return new EmbedBuilder()
    .setTitle(`📼 Último stream de ${KICK_USERNAME}`)
    .setDescription(last.session_title || 'Stream anterior')
    .setURL(`https://kick.com/${KICK_USERNAME}`)
    .setColor(0x777777)
    .setThumbnail(last.thumbnail?.src || null)
    .addFields(
      { name: 'Categoría', value: last.category?.name || 'Desconocida', inline: true },
      { name: 'Publicado', value: last.created_at, inline: true }
    )
    .setTimestamp(new Date());
}
