import { EmbedBuilder } from 'discord.js';

export async function checkKickLive() {
  const { KICK_USERNAME } = process.env;
  if (!KICK_USERNAME) return [];

  // 🚧 Kick no tiene API oficial estable, así que acá podés simular o usar scraping.
  // Por ahora devolvemos vacío.
  return [];
}
