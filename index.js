import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { startNotifier, checkAllPlatforms } from './modules/notifier.js';

const { DISCORD_TOKEN } = process.env;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Cargar comandos
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
  console.log(`[clientReady] ✅ Conectado como ${client.user.tag}`);
  startNotifier(client); // activa chequeo automático
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(`[${interaction.commandName}:error]`, err);
    if (interaction.deferred) {
      await interaction.editReply('❌ Hubo un error al ejecutar el comando.');
    } else if (!interaction.replied) {
      await interaction.reply({ content: '❌ Hubo un error al ejecutar el comando.', flags: 64 });
    }
  }
});

client.login(DISCORD_TOKEN);
