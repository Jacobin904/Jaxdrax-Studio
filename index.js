require('dotenv').config();

const fs = require('fs');
const path = require('path');
const {
    Client,
    Collection,
    GatewayIntentBits,
    Partials,
    Events,
    REST,
    Routes,
    SlashCommandBuilder
} = require('discord.js');

const { STAFF_ROLES } = require('./config/constants');

const GUILD_ID = process.env.GUILD_ID || '1557003074827194458';
const PREFIX = '!';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.GuildMember, Partials.Channel]
});

client.commands = new Collection();
client.legacyCommands = new Collection();

// ---------- Commandes ----------
function loadCommands() {
    const folder = path.join(__dirname, 'commands');
    if (!fs.existsSync(folder)) return;

    const commands = [];

    for (const file of fs.readdirSync(folder).filter(f => f.endsWith('.js'))) {
        try {
            const command = require(path.join(folder, file));

            if (command.data && typeof command.execute === 'function') {
                // Déjà un slash command
                client.commands.set(command.data.name, command);
                client.legacyCommands.set(command.data.name, command);
                commands.push(command.data.toJSON());
                console.log('[Command] Loaded (slash): ' + command.data.name);
            } else if (command.name && typeof command.execute === 'function') {
                // Créer un slash command dynamique
                const builder = new SlashCommandBuilder()
                    .setName(command.name)
                    .setDescription(command.description || 'Commande sans description');

                client.commands.set(command.name, command);
                client.legacyCommands.set(command.name, command);
                commands.push(builder.toJSON());
                console.log('[Command] Loaded (both): ' + command.name);
            }
        } catch (error) {
            console.error('[Command] Failed to load ' + file + ': ' + error.message);
        }
    }

    return commands;
}

const commands = loadCommands();

async function registerSlashCommands() {
    const clientId = process.env.CLIENT_ID;

    if (!clientId) {
        console.error('[Slash] CLIENT_ID is missing in .env');
        return;
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        await rest.put(
            Routes.applicationGuildCommands(clientId, GUILD_ID),
            { body: commands }
        );
        console.log('[Slash] Registered ' + commands.length + ' commands in this server');
    } catch (error) {
        console.error('[Slash] Registration failed: ' + error.message);
    }
}

// ---------- Evenements ----------
function loadEvents() {
    const folder = path.join(__dirname, 'events');
    if (!fs.existsSync(folder)) return;

    for (const file of fs.readdirSync(folder).filter(f => f.endsWith('.js'))) {
        try {
            const event = require(path.join(folder, file));
            if (!event.name || typeof event.execute !== 'function') continue;

            const isReady = event.name === Events.ClientReady || event.name === 'ready';

            const run = (...args) => {
                Promise.resolve(isReady ? event.execute(client) : event.execute(client, ...args))
                    .catch(error => console.error('[Event:' + event.name + ']', error));
            };

            if (event.once) client.once(event.name, run);
            else client.on(event.name, run);

            console.log('[Event] Loaded: ' + event.name);
        } catch (error) {
            console.error('[Event] Failed to load ' + file + ': ' + error.message);
        }
    }
}

loadEvents();

// ---------- Interactions (slash commands + boutons + modals) ----------
client.on(Events.InteractionCreate, async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('[Slash] ' + interaction.commandName + ': ' + error.message);
                const payload = {
                    content: 'An unexpected error occurred. Please try again later.',
                    ephemeral: true
                };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(payload).catch(() => {});
                } else {
                    await interaction.reply(payload).catch(() => {});
                }
            }
            return;
        }

        if (!interaction.isButton() && !interaction.isModalSubmit()) return;

        const id = interaction.customId || '';

        if (id.startsWith('review_')) {
            try {
                const review = require('./commands/review');
                if (typeof review.handleInteraction === 'function') {
                    await review.handleInteraction(interaction);
                }
            } catch (error) {
                console.error('[Review] ' + error.message);
            }
            return;
        }

        if (id.startsWith('mod_')) {
            try {
                const panel = require('./utils/modpanel');
                if (typeof panel.handleInteraction === 'function') {
                    await panel.handleInteraction(interaction);
                }
            } catch (error) {
                console.error('[Modpanel] ' + error.message);
            }
            return;
        }

        if (id.startsWith('info_')) {
            console.log('[Info] Button clicked: ' + id);
        }
    } catch (error) {
        console.error('[Interaction] ' + error.message);
    }
});

// ---------- Commandes avec préfixe ! ----------
client.on(Events.MessageCreate, async message => {
    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const name = args.shift().toLowerCase();
    const command = client.legacyCommands.get(name);
    if (!command) return;

    const isStaff = message.member.roles.cache.some(role => STAFF_ROLES.includes(role.name));

    try {
        await command.execute(message, isStaff, client);
    } catch (error) {
        console.error('[Prefix] ' + name + ': ' + error.message);
        await message.reply('An error occurred while executing this command.').catch(() => {});
    }
});

// ---------- Démarrage ----------
async function start() {
    try {
        try {
            const api = require('./api/server');
            if (typeof api.startServer === 'function') api.startServer();
        } catch (error) {
            console.error('[API] Not started: ' + error.message);
        }

        await client.login(process.env.DISCORD_TOKEN);
        await registerSlashCommands();
    } catch (error) {
        console.error('[Bot] Startup failed: ' + error.message);
        process.exit(1);
    }
}

process.on('unhandledRejection', error => {
    console.error('[Unhandled]', error && error.message ? error.message : error);
});

start();
