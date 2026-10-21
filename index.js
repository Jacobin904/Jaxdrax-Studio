require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

process.on('unhandledRejection', error => console.error('Unhandled rejection:', error));
process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ],
});

client.commands = new Collection();

// Charger les commandes
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.name, command);
}

// Charger les événements
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client, robloxPresence));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// Gestionnaire de messages pour les commandes
const { STAFF_ROLES } = require('./config/constants');

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    
    const isStaff = message.member.roles.cache.some(role => STAFF_ROLES.includes(role.name));
    
    if (!message.content.startsWith('!')) return;
    
    const commandName = message.content.slice(1).split(' ')[0].toLowerCase();
    const command = client.commands.get(commandName);
    
    if (command) {
        try {
            await command.execute(message, isStaff, robloxPresence);
        } catch (error) {
            console.error(`Error executing ${commandName}:`, error);
        }
    }
});

// Variable globale pour Roblox
const robloxPresence = { onlinePlayers: 0, totalPlayers: 0, serverStatus: 'Unknown' };

// Démarrer le bot
client.login(process.env.DISCORD_TOKEN);

// Démarrer l'API
const createApiServer = require('./api/server');
createApiServer(client, robloxPresence, () => {
    const readyEvent = require('./events/ready');
    readyEvent.execute(client, robloxPresence);
});
