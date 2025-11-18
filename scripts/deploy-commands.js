import 'dotenv/config';
import {
  REST,
  Routes,
  SlashCommandBuilder
} from 'discord.js';

const {
  DISCORD_TOKEN,
  CLIENT_ID,
  GUILD_ID
} = process.env;

const commands = [
  new SlashCommandBuilder()
    .setName('test_stream')
    .setDescription('Envía un embed de prueba de stream')
    .addStringOption(option =>
      option.setName('plataforma')
        .setDescription('Plataforma a simular')
        .setRequired(true)
        .addChoices(
          { name: 'Twitch', value: 'twitch' },
          { name: 'YouTube', value: 'youtube' },
          { name: 'Kick', value: 'kick' }
        )
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName('force_check')
    .setDescription('Ejecuta manualmente el chequeo de streams')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log('[deploy] Registrando comandos...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('[deploy] Comandos registrados correctamente.');
  } catch (err) {
    console.error('[deploy:error]', err);
  }
})();
