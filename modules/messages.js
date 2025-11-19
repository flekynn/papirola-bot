import { EmbedBuilder } from 'discord.js';

export function buildTwitchEmbed(username, title, url, thumbnail, gameName, viewers) {
  const embed = new EmbedBuilder()
    .setTitle(`🔴 ${username} está en vivo en Twitch`)
    .setDescription(title || 'Stream activo')
    .setURL(url)
    .setColor(0x9146FF)
    .setTimestamp(new Date());

  if (thumbnail) embed.setThumbnail(thumbnail);
  if (gameName) embed.addFields({ name: 'Categoría', value: gameName, inline: true });
  if (viewers !== undefined) embed.addFields({ name: 'Viewers', value: `${viewers}`, inline: true });

  return embed;
}

export function buildKickEmbed(username, title, url, thumbnail, category, viewers) {
  const embed = new EmbedBuilder()
    .setTitle(`🟢 ${username} está transmitiendo en Kick`)
    .setDescription(title || 'Transmisión en vivo')
    .setURL(url)
    .setColor(0x00D26A)
    .setTimestamp(new Date());

  if (thumbnail) embed.setThumbnail(thumbnail);
  if (category) embed.addFields({ name: 'Categoría', value: category, inline: true });
  if (viewers !== undefined) embed.addFields({ name: 'Viewers', value: `${viewers}`, inline: true });

  return embed;
}

export function buildYoutubeEmbed(username, title, url, thumbnail, publishedAt) {
  const embed = new EmbedBuilder()
    .setTitle(`Nuevo video de ${username} en YouTube`)
    .setDescription(title || 'Nuevo contenido')
    .setURL(url)
    .setColor(0xff0000)
    .setTimestamp(new Date(publishedAt));

  if (thumbnail) embed.setThumbnail(thumbnail);

  return embed;
}
