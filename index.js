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
    EmbedBuilder,
    MessageFlags
} = require('discord.js');

const { STAFF_ROLES, COLORS, LOGO_URL } = require('./config/constants');

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

// ---------- 1. Chargement des commandes ----------
function loadCommands() {
    const folder = path.join(__dirname, 'commands');
    if (!fs.existsSync(folder)) return [];

    const commandsToRegister = [];

    for (const file of fs.readdirSync(folder).filter(f => f.endsWith('.js'))) {
        try {
            const command = require(path.join(folder, file));

            if (command.data && typeof command.execute === 'function') {
                client.commands.set(command.data.name, command);
                client.legacyCommands.set(command.data.name, command);
                commandsToRegister.push(command.data.toJSON());
                console.log('[Command] Loaded (slash): ' + command.data.name);
            } else if (command.name && typeof command.execute === 'function') {
                client.legacyCommands.set(command.name, command);
                console.log('[Command] Loaded (prefix): ' + command.name);
            }
        } catch (error) {
            console.error('[Command] Failed to load ' + file + ': ' + error.message);
        }
    }

    return commandsToRegister;
}

const commandsToRegister = loadCommands();

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
            { body: commandsToRegister }
        );
        console.log('[Slash] Registered ' + commandsToRegister.length + ' commands in this server');
    } catch (error) {
        console.error('[Slash] Registration failed: ' + error.message);
    }
}

// ---------- 2. Chargement des événements ----------
function loadEvents() {
    const folder = path.join(__dirname, 'events');
    if (!fs.existsSync(folder)) return;

    for (const file of fs.readdirSync(folder).filter(f => f.endsWith('.js'))) {
        // On ignore interactionCreate.js car il est géré directement ci-dessous
        if (file === 'interactionCreate.js') continue;

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

// ---------- 3. Gestion des interactions (Slash + Boutons + Modals) ----------
client.on(Events.InteractionCreate, async (interaction) => {
    try {
        // A. Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('[Slash] ' + interaction.commandName + ': ' + error.message);
                const payload = {
                    content: 'An unexpected error occurred. Please try again later.',
                    flags: MessageFlags.Ephemeral
                };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(payload).catch(() => {});
                } else {
                    await interaction.reply(payload).catch(() => {});
                }
            }
            return;
        }

        // B. Boutons et Modals
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
            if (id === 'info_view_license') {
                try {
                    await interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setColor(COLORS.dark)
                            .setTitle('License Agreement')
                            .setDescription('**Proprietary License - All Rights Reserved**\n\n© 2024-2027 Jaxdrax Studio\n\nAll game assets, code, designs, and content are the exclusive property of Jaxdrax Studio. Unauthorized use, distribution, or modification is strictly prohibited.\n\n**Terms:**\n• No redistribution without explicit permission\n• No reverse engineering or decompilation\n• No commercial use without licensing agreement\n• All rights reserved by Jaxdrax Studio\n\nFor licensing inquiries, contact: legal@jaxdraxstudio.com')
                            .setThumbnail(LOGO_URL)
                            .setFooter({ text: 'Jaxdrax Studio Legal', iconURL: LOGO_URL })
                            .setTimestamp()],
                        flags: MessageFlags.Ephemeral
                    });
                } catch (error) {
                    console.error('[Info] License error:', error.message);
                }
                return;
            }

            if (id === 'info_open_ticket') {
                try {
                    await interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setColor(COLORS.dark)
                            .setTitle('Support Ticket')
                            .setDescription('To open a support ticket, please use the /ticket command in any channel.\n\n**What you can get help with:**\n• Account issues\n• Bug reports\n• Player reports\n• Suggestions\n• General questions\n\n**Response Time:** Usually within 2-4 hours\n\nIf you need immediate assistance, please contact a staff member in the server.')
                            .setThumbnail(LOGO_URL)
                            .setFooter({ text: 'Jaxdrax Studio Support', iconURL: LOGO_URL })
                            .setTimestamp()],
                        flags: MessageFlags.Ephemeral
                    });
                } catch (error) {
                    console.error('[Info] Ticket error:', error.message);
                }
                return;
            }
        }
    } catch (error) {
        console.error('[Interaction] ' + error.message);
    }
});

// ---------- 4. Commandes avec préfixe ! ----------
client.on(Events.MessageCreate, async (message) => {
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

// ---------- 5. Démarrage ----------
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
