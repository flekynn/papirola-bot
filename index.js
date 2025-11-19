import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { DISCORD_TOKEN, TEST_CHANNEL_ID } = process.env;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Cargar comandos desde la carpeta /commands
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(`file://${filePath}`);
  client.commands.set(command.default.data.name, command.default);
}

client.once('clientReady', async () => {
  console.log(`[clientReady] Conectado como ${client.user.tag}`);
  try {
    const channel = await client.channels.fetch(TEST_CHANNEL_ID);
    await channel.send('Bot iniciado en canal de pruebas.');
  } catch (err) {
    console.error('[startup:error]', err);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(`[${interaction.commandName}:error]`, err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Hubo un error al ejecutar el comando.', ephemeral: true });
    }
  }
});

client.login(DISCORD_TOKEN);
