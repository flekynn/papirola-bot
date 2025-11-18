import { EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

const { KICK_USERNAME } = process.env;

export async function getKickEmbed(simulate = false) {
  if (simulate) {
    return new EmbedBuilder()
      .setTitle('🟢 flekynn está transmitiendo en Kick')
      .setDescription('Stream experimental: glitch art + física cuántica en tiempo real.')
      .setURL('https://kick.com/flekynn')
      .setColor(0x00D26A)
      .setThumbnail('https://kick.com/assets/images/stream-preview.jpg')
      .addFields(
        { name: 'Categoría', value: 'Just Chatting', inline: true },
        { name: 'Viewers', value: '17', inline: true }
      )
      .setTimestamp(new Date());
  }

  const res = await fetch(`https://kick.com/api/v2/channels/${KICK_USERNAME}`);
  const data = await res.json();
  if (!data || !data.livestream || !data.livestream.is_live) return null;

  const stream = data.livestream;
  return new EmbedBuilder()
    .setTitle(`🟢 ${KICK_USERNAME} está transmitiendo en Kick`)
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
