import { REST, Routes } from 'discord.js';
import 'dotenv/config';

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

const commands = [
  {
    name: 'test_stream',
    description: 'Muestra el contenido activo o el último publicado en una plataforma',
    options: [
      {
        name: 'plataforma',
        description: 'Plataforma a consultar',
        type: 3,
        required: true,
        choices: [
          { name: 'twitch', value: 'twitch' },
          { name: 'kick', value: 'kick' },
          { name: 'youtube', value: 'youtube' }
        ]
      }
    ]
  },
  {
    name: 'force_check',
    description: 'Fuerza un chequeo en todas las plataformas'
  }
];

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log('🔧 Registrando comandos...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands
    });
    console.log('✅ Comandos registrados correctamente.');
  } catch (err) {
    console.error('❌ Error al registrar comandos:', err);
  }
})();
