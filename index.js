import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Cargar comandos desde ./commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const commandModule = await import(`./commands/${file}`);
  const { data, execute } = commandModule;

  if (!data || !execute) {
    console.warn(`[discord] ⚠️ El comando ${file} no exporta { data, execute } correctamente`);
    continue;
  }

  client.commands.set(data.name, { data, execute });
}

// Evento de conexión
client.once('clientReady', () => {
  console.log(`[discord] ✅ Bot conectado como ${client.user.tag}`);
});

// Manejo de interacciones
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.warn(`[discord] ⚠️ Comando no encontrado: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
    console.log(`[discord] ▶️ Ejecutado comando: ${interaction.commandName}`);
  } catch (error) {
    console.error('[discord:error]', error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'Hubo un error al ejecutar el comando.', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Hubo un error al ejecutar el comando.', ephemeral: true });
    }
  }
});

// Login con el token
client.login(process.env.DISCORD_TOKEN);

// 🚀 Simular puerto para Railway
if (process.env.PORT) {
  const express = require('express');
  const app = express();
  app.get('/', (_, res) => res.send('Bot activo'));
  app.listen(process.env.PORT, () => {
    console.log(`[railway] Escuchando en puerto ${process.env.PORT}`);
  });
}
