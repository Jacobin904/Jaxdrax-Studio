require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const { startServer, updateStats } = require('./api/server');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

client.commands = new Collection();

// Charger les commandes slash
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const commands = [];

for (const file of commandFiles) {
    try {
        const command = require(path.join(commandsPath, file));
        if (command.data && typeof command.execute === 'function') {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
            console.log(`[Command] Loaded: ${command.data.name}`);
        }
    } catch (error) {
        console.error(`[Command] Failed to load ${file}:`, error.message);
    }
}

// Enregistrer les slash commands
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Error registering slash commands:', error.message);
    }
})();

// Charger les événements
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    try {
        const event = require(path.join(eventsPath, file));
        if (event.name && typeof event.execute === 'function') {
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
            console.log(`[Event] Loaded: ${event.name}`);
        }
    } catch (error) {
        console.error(`[Event] Failed to load ${file}:`, error.message);
    }
}

// Gestion des interactions slash
client.on('interactionCreate', async (interaction) => {
    try {
        // Slash commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`[Command] Error executing ${interaction.commandName}:`, error.message);
                const errorMessage = { content: 'An error occurred while executing this command.', ephemeral: true };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }
        
        // Boutons et modals (review, modpanel, etc.)
        if (interaction.isButton() || interaction.isModalSubmit()) {
            const customId = interaction.customId || '';
            
            if (customId.startsWith('review_')) {
                try {
                    const reviewCommand = require('./commands/review');
                    await reviewCommand.handleInteraction(interaction);
                } catch (error) {
                    console.error('[Review] Interaction error:', error.message);
                }
                return;
            }
            
            if (customId.startsWith('mod_')) {
                try {
                    const modpanel = require('./utils/modpanel');
                    await modpanel.handleInteraction(interaction);
                } catch (error) {
                    console.error('[Modpanel] Interaction error:', error.message);
                }
                return;
            }
            
            // Tickets et autres interactions
            if (customId === 'open_ticket') {
                console.log('[Ticket] Open ticket button clicked');
            }
        }
    } catch (error) {
        console.error('[Interaction] Error:', error.message);
    }
});

// Démarrage
async function start() {
    try {
        console.log('[Bot] Starting...');
        
        // Démarrer le serveur API
        startServer();
        
        // Connecter le bot
        await client.login(process.env.DISCORD_TOKEN);
        console.log('[Bot] Logged in successfully');
        
        // Mettre à jour les stats toutes les 2 minutes
        setInterval(() => {
            const guild = client.guilds.cache.first();
            if (guild) {
                updateStats({
                    memberCount: guild.memberCount,
                    robloxPresence: { onlinePlayers: 0, serverStatus: 'Unknown' }
                });
            }
        }, 120000);
        
    } catch (error) {
        console.error('[Bot] Failed to start:', error.message);
        process.exit(1);
    }
}

start();
