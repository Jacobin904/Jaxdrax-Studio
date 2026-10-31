require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const {
    Client,
    Collection,
    GatewayIntentBits,
    Partials,
    Events,
    REST,
    Routes,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');

const { COLORS, LOGO_URL, BANNER_URL, STAFF_ROLES } = require('./config/constants');

const GUILD_ID = process.env.GUILD_ID || '1557003074827194458';
const PREFIX = '!';
const PORT = process.env.PORT || 3308;

const PANEL_COMMANDS = new Set(['info', 'rules']);
const DATA_DIR = path.join(__dirname, 'data');
const MESSAGE_FILE = path.join(DATA_DIR, 'command-messages.json');

// ==========================================
// 1. SETUP EXPRESS API
// ==========================================
const app = express();
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

let botClient = null;

// Sert le fichier index.html à la racine
app.get('/', (req, res) => {
    const htmlPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(htmlPath)) {
        res.sendFile(htmlPath);
    } else {
        res.json({ status: 'online', uptime: botClient ? Math.floor((Date.now() - botClient.readyTimestamp) / 1000) : 0 });
    }
});

// API Stats
app.get('/api/stats', (req, res) => {
    if (!botClient) return res.status(503).json({ error: 'Bot not ready' });
    const guild = botClient.guilds.cache.get(GUILD_ID);
    if (!guild) return res.status(404).json({ error: 'Server not found' });
    
    res.json({
        members: guild.memberCount,
        online: guild.members.cache.filter(m => !m.user.bot && m.presence?.status !== 'offline').size,
        ping: botClient.ws.ping
    });
});

// API Staff dynamique
app.get('/api/staff', (req, res) => {
    if (!botClient) return res.status(503).json({ error: 'Bot not ready' });
    const guild = botClient.guilds.cache.get(GUILD_ID);
    if (!guild) return res.status(404).json({ error: 'Server not found' });

    guild.members.fetch().then(members => {
        const staffList = [];
        const staffRoleNames = ['Game Direction', 'Admin', 'Moderator', 'Developer', 'Staff Team', 'Lieutenant'];

        members.forEach(member => {
            const memberStaffRoles = member.roles.cache.filter(role => staffRoleNames.includes(role.name));
            if (memberStaffRoles.size > 0) {
                const highestRole = memberStaffRoles.sort((a, b) => b.position - a.position).first();
                staffList.push({
                    username: member.user.username,
                    displayName: member.displayName || member.user.username,
                    avatarUrl: member.user.displayAvatarURL({ extension: 'webp', size: 1024, forceStatic: false }),
                    profileUrl: `https://discord.com/users/${member.user.id}`,
                    roleName: highestRole.name,
                    roleColor: highestRole.hexColor
                });
            }
        });

        staffList.sort((a, b) => {
            const roleA = guild.roles.cache.find(r => r.name === a.roleName)?.position || 0;
            const roleB = guild.roles.cache.find(r => r.name === b.roleName)?.position || 0;
            return roleB - roleA;
        });

        res.json({ success: true, data: staffList });
    }).catch(err => {
        console.error('[API] Error fetching members:', err);
        res.status(500).json({ error: 'Failed to fetch data' });
    });
});

app.listen(PORT, '0.0.0.0', () => console.log(`[API] Website available at http://localhost:${PORT}`));

// ==========================================
// 2. DISCORD CLIENT SETUP
// ==========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildInvites
    ],
    partials: [Partials.GuildMember, Partials.Channel, Partials.Message, Partials.User]
});

botClient = client;

client.commands = new Collection();
client.legacyCommands = new Collection();

// --- Registry pour les messages modifiables ---
function readRegistry() {
    try {
        if (!fs.existsSync(MESSAGE_FILE)) return {};
        const stats = fs.statSync(MESSAGE_FILE);
        if (stats.size > 1024 * 1024) {
            fs.unlinkSync(MESSAGE_FILE);
            return {};
        }
        const parsed = JSON.parse(fs.readFileSync(MESSAGE_FILE, 'utf8'));
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        return {};
    }
}

function writeRegistry(data) {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(MESSAGE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('[Registry] Save failed:', error.message);
    }
}

function registryKey(guildId, channelId, commandName) {
    return `${guildId}|${channelId}|${commandName}`;
}

async function postOrEdit(guild, channel, commandName, payload) {
    const registry = readRegistry();
    const key = registryKey(guild.id, channel.id, commandName);
    const messageId = registry[key];

    const content = { ...payload };
    delete content.flags;
    delete content.ephemeral;

    if (messageId) {
        try {
            const previous = await channel.messages.fetch(messageId);
            await previous.edit(content);
            return previous;
        } catch (error) {
            delete registry[key];
            writeRegistry(registry);
        }
    }

    const sent = await channel.send(content);
    const updated = readRegistry();
    updated[key] = sent.id;
    writeRegistry(updated);
    return sent;
}

function wantsEphemeral(payload) {
    if (!payload) return false;
    if (payload.ephemeral === true) return true;
    const flags = payload.flags;
    if (typeof flags === 'number') return (flags & MessageFlags.Ephemeral) !== 0;
    if (Array.isArray(flags)) return flags.includes(MessageFlags.Ephemeral);
    return false;
}

function createContext(source, commandName, isSlash) {
    const guild = source.guild;
    const channel = source.channel;

    async function deliver(payload) {
        if (wantsEphemeral(payload)) {
            const options = { ...payload, flags: MessageFlags.Ephemeral };
            delete options.ephemeral;
            if (isSlash) {
                if (source.replied || source.deferred) return source.followUp(options);
                return source.reply(options);
            }
            return channel.send(options);
        }
        return postOrEdit(guild, channel, commandName, payload);
    }

    return {
        client, guild, member: source.member, user: source.user || source.author, commandName,
        options: isSlash ? source.options : null,
        channel: { id: channel.id, send: payload => deliver(payload), messages: channel.messages },
        reply: payload => deliver(payload),
        followUp: payload => deliver(payload),
        editReply: payload => deliver(payload),
        isChatInputCommand: () => isSlash
    };
}

// --- Load Commands ---
function loadCommands() {
    const folder = path.join(__dirname, 'commands');
    if (!fs.existsSync(folder)) return [];

    const toRegister = [];
    for (const file of fs.readdirSync(folder).filter(f => f.endsWith('.js'))) {
        if (file === 'play.js' || file === 'skip.js') continue;
        try {
            const command = require(path.join(folder, file));
            if (typeof command.execute !== 'function') continue;

            const name = command.data?.name || command.name;
            if (!name) continue;

            if (command.data) {
                client.commands.set(name, command);
                toRegister.push(command.data.toJSON());
                console.log('[Command] Loaded (slash): ' + name);
            } else {
                const fallback = new SlashCommandBuilder().setName(name).setDescription(command.description || 'Runs the ' + name + ' command');
                client.commands.set(name, command);
                toRegister.push(fallback.toJSON());
                console.log('[Command] Loaded (auto slash): ' + name);
            }
            client.legacyCommands.set(name, command);
        } catch (error) {
            console.error('[Command] Failed to load ' + file + ': ' + error.message);
        }
    }
    return toRegister;
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
        const result = await rest.put(Routes.applicationGuildCommands(clientId, GUILD_ID), { body: commandsToRegister });
        console.log('[Slash] Registered ' + result.length + ' guild commands');
    } catch (error) {
        console.error('[Slash] Registration failed: ' + error.message);
    }
}

// --- Load Events ---
function loadEvents() {
    const folder = path.join(__dirname, 'events');
    if (!fs.existsSync(folder)) return;

    for (const file of fs.readdirSync(folder).filter(f => f.endsWith('.js'))) {
        if (file === 'interactionCreate.js' || file === 'modpanelInteractions.js' || file === 'modpanelModalHandler.js') {
            console.log('[Event] Skipped (managed in index.js): ' + file);
            continue;
        }
        try {
            const event = require(path.join(folder, file));
            if (!event.name || typeof event.execute !== 'function') continue;

            const isReady = event.name === Events.ClientReady || event.name === 'ready';
            const run = (...args) => {
                Promise.resolve(isReady ? event.execute(client) : event.execute(client, ...args))
                    .catch(error => console.error('[Event:' + event.name + ']', error.message));
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

// ==========================================
// 3. INTERACTION HANDLERS
// ==========================================
async function handleInfoButton(interaction) {
    if (interaction.customId === 'info_view_license') {
        const embed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Proprietary License Agreement')
            .setDescription('Your Fish Life and all associated assets are the exclusive property of Jaxdrax Studio.\n\nThis license defines what you may and may not do with the game, its code, and its content.')
            .setImage(BANNER_URL)
            .setFooter({ text: 'Jaxdrax Studio | Effective 2026', iconURL: LOGO_URL })
            .setTimestamp();
        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    if (interaction.customId === 'info_open_ticket') {
        const ticketEmbed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Support Ticket Center')
            .setDescription('Our team handles support requests through tickets so every case is documented and reviewed by the right person.')
            .setImage(BANNER_URL)
            .setFooter({ text: 'Jaxdrax Studio Support Team', iconURL: LOGO_URL })
            .setTimestamp();

        const ticketButton = new ButtonBuilder().setCustomId('ticket_create').setLabel('Open A Ticket').setStyle(ButtonStyle.Primary);
        return interaction.reply({ embeds: [ticketEmbed], components: [new ActionRowBuilder().addComponents(ticketButton)], flags: MessageFlags.Ephemeral });
    }
    return false;
}

async function handleTicketCreate(interaction) {
    const guild = interaction.guild;
    const existing = guild.channels.cache.find(c => c.name.startsWith('ticket-') && c.topic && c.topic.includes('Creator: ' + interaction.user.id));

    if (existing) {
        return interaction.reply({ content: 'You already have an open ticket: ' + existing, flags: MessageFlags.Ephemeral });
    }

    const modal = new ModalBuilder().setCustomId('ticket_modal').setTitle('Open A Support Ticket');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ticket_category').setLabel('Category').setStyle(TextInputStyle.Short).setPlaceholder('Account, Bug Report, Player Report, Appeal, Licensing').setMaxLength(50).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ticket_description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setPlaceholder('Describe your issue in detail.').setMaxLength(1000).setRequired(true))
    );
    return interaction.showModal(modal);
}

async function handleTicketModal(interaction) {
    try {
        const category = String(interaction.fields.getTextInputValue('ticket_category') || 'Unknown').substring(0, 50);
        const description = String(interaction.fields.getTextInputValue('ticket_description') || 'No description').substring(0, 1000);
        const guild = interaction.guild;

        const infoChannel = guild.channels.cache.find(c => c.name === 'info' || c.name === 'informations');
        const targetCategoryId = infoChannel ? infoChannel.parentId : null;

        if (!targetCategoryId) {
            return interaction.reply({ content: 'Could not find the category for the informations channel.', flags: MessageFlags.Ephemeral });
        }

        const safeUsername = String(interaction.user.username || 'user').substring(0, 40).replace(/[^a-zA-Z0-9_-]/g, '') || 'user';
        const overwrites = [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages] }
        ];

        for (const roleName of STAFF_ROLES) {
            const role = guild.roles.cache.find(r => r.name === roleName);
            if (role) overwrites.push({ id: role.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] });
        }

        const ticketChannel = await guild.channels.create({
            name: 'ticket-' + safeUsername,
            type: ChannelType.GuildText,
            parent: targetCategoryId,
            topic: 'Ticket by ' + interaction.user.tag + ' | Category: ' + category + ' | Creator: ' + interaction.user.id,
            permissionOverwrites: overwrites
        });

        const ticketEmbed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Support Ticket Opened')
            .setDescription('**User:** ' + interaction.user.tag + '\n**ID:** ' + interaction.user.id + '\n**Category:** ' + category + '\n\n**Description:**\n' + description)
            .setImage(BANNER_URL)
            .setFooter({ text: 'Jaxdrax Studio Support', iconURL: LOGO_URL })
            .setTimestamp();

        const closeButton = new ButtonBuilder().setCustomId('ticket_close').setLabel('Close Ticket').setStyle(ButtonStyle.Danger);
        await ticketChannel.send({ content: interaction.user.toString() + ' | Staff will be with you shortly.', embeds: [ticketEmbed], components: [new ActionRowBuilder().addComponents(closeButton)] });

        return interaction.reply({ content: 'Your ticket has been created: ' + ticketChannel, flags: MessageFlags.Ephemeral });
    } catch (error) {
        console.error('[Ticket] Create error:', error.message);
        return interaction.reply({ content: 'An error occurred while creating your ticket.', flags: MessageFlags.Ephemeral });
    }
}

function extractCreatorId(channel) {
    if (!channel.topic) return null;
    const part = channel.topic.split('|').find(p => p.includes('Creator:'));
    return part ? part.replace('Creator:', '').trim() : null;
}

async function handleTicketClose(interaction) {
    try {
        const channel = interaction.channel;
        if (!channel || channel.type !== ChannelType.GuildText) return;
        const creatorId = extractCreatorId(channel);
        await interaction.deferReply();

        if (creatorId) {
            await channel.permissionOverwrites.edit(creatorId, { ViewChannel: false, SendMessages: false, ReadMessageHistory: false });
        }

        const closeEmbed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Ticket Closed')
            .setDescription('Closed by ' + interaction.user.tag + '.\n\nThe ticket creator can no longer see this channel.\n\n**Reopen Ticket** restores access.\n**Close Permanently** archives the transcript and deletes this channel.')
            .setImage(BANNER_URL)
            .setFooter({ text: 'Jaxdrax Studio Support', iconURL: LOGO_URL })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_reopen').setLabel('Reopen Ticket').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('ticket_delete').setLabel('Close Permanently').setStyle(ButtonStyle.Danger)
        );
        await interaction.editReply({ embeds: [closeEmbed], components: [row] });
    } catch (error) {
        console.error('[Ticket] Close error:', error.message);
    }
}

async function handleTicketReopen(interaction) {
    try {
        const channel = interaction.channel;
        if (!channel || channel.type !== ChannelType.GuildText) return;
        const creatorId = extractCreatorId(channel);
        await interaction.deferReply();

        if (creatorId) {
            await channel.permissionOverwrites.edit(creatorId, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
        }

        const reopenEmbed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Ticket Reopened')
            .setDescription('**Reopened by:** ' + interaction.user.tag + '\n\nThe ticket creator can now see and interact in this channel again.')
            .setImage(BANNER_URL)
            .setFooter({ text: 'Jaxdrax Studio Support', iconURL: LOGO_URL })
            .setTimestamp();

        const closeButton = new ButtonBuilder().setCustomId('ticket_close').setLabel('Close Ticket').setStyle(ButtonStyle.Danger);
        await interaction.editReply({ embeds: [reopenEmbed], components: [new ActionRowBuilder().addComponents(closeButton)] });
    } catch (error) {
        console.error('[Ticket] Reopen error:', error.message);
    }
}

async function generateTranscript(channel) {
    try {
        const messages = await channel.messages.fetch({ limit: 100 });
        const sorted = Array.from(messages.values()).reverse();
        let transcript = '===========================================\nTICKET TRANSCRIPT\nChannel: #' + channel.name + '\nTopic: ' + (channel.topic || 'None') + '\nCreated: ' + channel.createdAt.toUTCString() + '\nClosed: ' + new Date().toUTCString() + '\n===========================================\n\n';
        for (const msg of sorted) {
            transcript += '[' + msg.createdAt.toUTCString() + '] ' + msg.author.tag + ': ' + (msg.content || '[Embed or attachment]') + '\n';
        }
        return transcript;
    } catch (error) {
        return 'Error generating transcript.';
    }
}

async function handleTicketDelete(interaction) {
    try {
        const channel = interaction.channel;
        if (!channel || channel.type !== ChannelType.GuildText) return;
        await interaction.deferReply();

        const transcript = await generateTranscript(channel);
        const guild = interaction.guild;
        const transcriptChannel = guild.channels.cache.find(c => c.name === 'ticket-transcripts');

        if (transcriptChannel) {
            const creatorId = extractCreatorId(channel) || 'Unknown';
            const categoryPart = channel.topic ? channel.topic.split('|').find(p => p.includes('Category:')) : null;
            const category = categoryPart ? categoryPart.replace('Category:', '').trim() : 'Unknown';

            const transcriptEmbed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Ticket Closed Permanently')
                .setDescription('**Channel:** #' + channel.name + '\n**Creator:** <@' + creatorId + '>\n**Category:** ' + category + '\n**Closed by:** ' + interaction.user.tag + '\n**Closed at:** ' + new Date().toUTCString())
                .setImage(BANNER_URL)
                .setFooter({ text: 'Jaxdrax Studio Support', iconURL: LOGO_URL })
                .setTimestamp();

            await transcriptChannel.send({ embeds: [transcriptEmbed], files: [{ attachment: Buffer.from(transcript, 'utf-8'), name: 'transcript-' + channel.name + '.txt' }] });
        }

        await interaction.editReply({ content: 'Ticket closed permanently. Transcript saved.', components: [] });
        setTimeout(() => { channel.delete('Ticket closed permanently').catch(() => {}); }, 3000);
    } catch (error) {
        console.error('[Ticket] Delete error:', error.message);
    }
}

// --- Main Interaction Listener ---
client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            const isStaff = interaction.member ? interaction.member.roles.cache.some(r => STAFF_ROLES.includes(r.name)) : false;
            const isPanel = PANEL_COMMANDS.has(interaction.commandName);

            try {
                if (isPanel) {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    const context = createContext(interaction, interaction.commandName, true);
                    await command.execute(context, isStaff, client);
                } else {
                    await command.execute(interaction, isStaff, client);
                }
            } catch (error) {
                console.error('[Slash] ' + interaction.commandName + ':', error.message);
                const payload = { content: 'An unexpected error occurred while running this command.', flags: MessageFlags.Ephemeral };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(payload).catch(() => {});
                } else {
                    await interaction.reply(payload).catch(() => {});
                }
            } finally {
                if (isPanel && interaction.deferred) await interaction.deleteReply().catch(() => {});
            }
            return;
        }

        const isComponent = interaction.isButton() || interaction.isModalSubmit() || interaction.isStringSelectMenu() || interaction.isUserSelectMenu();
        if (!isComponent) return;

        const id = interaction.customId || '';

        if (id === 'ticket_create') { await handleTicketCreate(interaction); return; }
        if (id === 'ticket_modal') { await handleTicketModal(interaction); return; }
        if (id === 'ticket_close') { await handleTicketClose(interaction); return; }
        if (id === 'ticket_reopen') { await handleTicketReopen(interaction); return; }
        if (id === 'ticket_delete') { await handleTicketDelete(interaction); return; }
        if (id.startsWith('info_')) { await handleInfoButton(interaction); return; }

        if (id.startsWith('mod_') || id === 'modpanel_menu') {
            try {
                const panel = require('./utils/modpanel');
                if (typeof panel.handleInteraction === 'function') await panel.handleInteraction(interaction);
            } catch (error) {
                console.error('[Modpanel]', error.message);
            }
            return;
        }

        if (id.startsWith('review_')) {
            try {
                const review = require('./commands/review');
                if (typeof review.handleInteraction === 'function') await review.handleInteraction(interaction);
            } catch (error) {
                console.error('[Review]', error.message);
            }
            return;
        }
    } catch (error) {
        console.error('[Interaction]', error.message);
    }
});

// --- Prefix Commands ---
client.on(Events.MessageCreate, async (message) => {
    try {
        if (!message || !message.author || message.author.bot || !message.guild) return;
        if (!message.content || !message.content.startsWith(PREFIX)) return;

        const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
        const name = args.shift().toLowerCase();
        const command = client.legacyCommands.get(name);
        if (!command) return;

        const isStaff = message.member ? message.member.roles.cache.some(r => STAFF_ROLES.includes(r.name)) : false;

        if (PANEL_COMMANDS.has(name)) {
            const context = createContext(message, name, false);
            await command.execute(context, isStaff, client);
        } else {
            await command.execute(message, isStaff, client);
        }
    } catch (error) {
        console.error('[Prefix]', error.message);
    }
});

// --- Startup ---
async function start() {
    try {
        await client.login(process.env.DISCORD_TOKEN);
        await registerSlashCommands();
    } catch (error) {
        console.error('[Bot] Startup failed:', error.message);
        process.exit(1);
    }
}

process.on('unhandledRejection', error => {
    console.error('[Unhandled]', error && error.message ? error.message : error);
});

start();
