require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');

const { startServer, updateStats } = require('./api/server');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

client.commands = new Collection();

// Charger les commandes
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const command = require(path.join(commandsPath, file));
        if (command.name && typeof command.execute === 'function') {
            client.commands.set(command.name, command);
            console.log(`[Command] Loaded: ${command.name}`);
        }
    } catch (error) {
        console.error(`[Command] Failed to load ${file}:`, error.message);
    }
}

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

// Gestion des messages
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    const prefix = '!';
    if (!message.content.startsWith(prefix)) return;
    
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    const command = client.commands.get(commandName);
    if (!command) return;
    
    try {
        const isStaff = message.member?.roles?.cache?.some(role => 
            ['Game Direction', 'Admin', 'Moderator', 'Developer', 'Staff Team'].includes(role.name)
        ) || false;
        
        await command.execute(message, isStaff, { onlinePlayers: 0, serverStatus: 'Unknown' });
    } catch (error) {
        console.error(`[Command] Error executing ${commandName}:`, error.message);
        await message.reply('An error occurred while executing this command.').catch(() => {});
    }
});

// Gestion des interactions
client.on('interactionCreate', async (interaction) => {
    try {
        const reviewCommand = require('./commands/review');
        const modpanel = require('./utils/modpanel');
        
        const customId = interaction.customId || '';
        
        if (customId.startsWith('review_')) {
            await reviewCommand.handleInteraction(interaction);
            return;
        }
        
        if (customId.startsWith('mod_')) {
            await modpanel.handleInteraction(interaction);
            return;
        }
        
        // Tickets et autres interactions
        if (interaction.isButton()) {
            if (customId === 'open_ticket') {
                // Logique de ticket ici
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
