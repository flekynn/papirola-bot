const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ------------------ LEER COMANDOS ------------------
const commands = [];
const commandsPath = path.join(__dirname, '../commands'); // rutas relativas al script
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    commands.push(command.data.toJSON());
}

// ------------------ CONFIGURAR REST ------------------
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// ------------------ DEPLOY ------------------
(async () => {
    try {
        console.log('🔄 Registrando comandos de slash en Discord...');

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID, // ID del bot desde Railway
                process.env.GUILD_ID   // ID del servidor de pruebas desde Railway
            ),
            { body: commands }
        );

        console.log('✅ Comandos registrados correctamente!');
    } catch (error) {
        console.error('❌ Error registrando comandos:', error);
    }
})();
