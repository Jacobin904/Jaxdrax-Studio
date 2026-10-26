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

const { COLORS, LOGO_URL, STAFF_ROLES } = require('./config/constants');

const GUILD_ID = process.env.GUILD_ID || '1557003074827194458';
const PREFIX = '!';

const PANEL_COMMANDS = new Set(['info', 'rules']);

const DATA_DIR = path.join(__dirname, 'data');
const MESSAGE_FILE = path.join(DATA_DIR, 'command-messages.json');

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

function readRegistry() {
    try {
        if (!fs.existsSync(MESSAGE_FILE)) return {};
        const parsed = JSON.parse(fs.readFileSync(MESSAGE_FILE, 'utf8'));
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        return {};
    }
}

function writeRegistry(data) {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
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
                if (source.replied || source.deferred) {
                    return source.followUp(options);
                }
                return source.reply(options);
            }

            return channel.send(options);
        }

        return postOrEdit(guild, channel, commandName, payload);
    }

    const context = {
        client,
        guild,
        member: source.member,
        user: source.user || source.author,
        commandName,
        options: isSlash ? source.options : null,
        channel: {
            id: channel.id,
            send: payload => deliver(payload),
            messages: channel.messages
        },
        reply: payload => deliver(payload),
        followUp: payload => deliver(payload),
        editReply: payload => deliver(payload)
    };

    if (isSlash) {
        context.isChatInputCommand = () => true;
    }

    return context;
}

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
                const fallback = new SlashCommandBuilder()
                    .setName(name)
                    .setDescription(command.description || 'Runs the ' + name + ' command');

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
        const result = await rest.put(
            Routes.applicationGuildCommands(clientId, GUILD_ID),
            { body: commandsToRegister }
        );
        console.log('[Slash] Registered ' + result.length + ' guild commands');
    } catch (error) {
        console.error('[Slash] Registration failed: ' + error.message);
    }
}

function loadEvents() {
    const folder = path.join(__dirname, 'events');
    if (!fs.existsSync(folder)) return;

    for (const file of fs.readdirSync(folder).filter(f => f.endsWith('.js'))) {
        if (file === 'interactionCreate.js') continue;

        try {
            const event = require(path.join(folder, file));
            if (!event.name || typeof event.execute !== 'function') continue;

            const isReady = event.name === Events.ClientReady || event.name === 'ready';

            const run = (...args) => {
                Promise.resolve(
                    isReady ? event.execute(client) : event.execute(client, ...args)
                ).catch(error => console.error('[Event:' + event.name + ']', error));
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

async function handleInfoButton(interaction) {
    if (interaction.customId === 'info_view_license') {
        const embed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Proprietary License Agreement')
            .setDescription(
                'Your Fish Life and all associated assets are the exclusive property of Jaxdrax Studio.\n\n' +
                'This license defines what you may and may not do with the game, its code, and its content. ' +
                'Accessing or playing the game does not grant ownership of any asset.'
            )
            .addFields(
                {
                    name: 'Copyright And Ownership',
                    value:
                        'Copyright (c) 2026 Jaxdrax Studio. All rights reserved.\n' +
                        'All code, scripts, models, textures, audio, artwork, branding and game design ' +
                        'remain the property of Jaxdrax Studio.',
                    inline: false
                },
                {
                    name: 'Permitted Use',
                    value:
                        'Personal, non-commercial play of Your Fish Life.\n' +
                        'Sharing the official game link and inviting other players.\n' +
                        'Posting screenshots or clips for personal, non-monetized community use.',
                    inline: false
                },
                {
                    name: 'Prohibited Use',
                    value:
                        'Redistributing, reselling or sublicensing any game asset.\n' +
                        'Reverse engineering, decompiling or extracting game files.\n' +
                        'Reuploading the game or claiming it as your own work.\n' +
                        'Commercial use, monetized reposts or paid access without a written agreement.',
                    inline: false
                },
                {
                    name: 'Intellectual Property',
                    value:
                        'All trademarks, logos, game mechanics, artwork, music, and other creative elements ' +
                        'are protected under international copyright law. Any unauthorized use will be pursued ' +
                        'to the fullest extent of the law.',
                    inline: false
                },
                {
                    name: 'Enforcement',
                    value:
                        'Violations may result in a DMCA takedown, a permanent server ban and, ' +
                        'where applicable, legal action. Exceptions require written approval from Jaxdrax Studio.',
                    inline: false
                },
                {
                    name: 'Licensing Inquiries',
                    value:
                        'For partnership, press or commercial licensing requests, open a support ticket ' +
                        'and select the Licensing category.',
                    inline: false
                }
            )
            .setFooter({ text: 'Jaxdrax Studio | Effective 2026' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    if (interaction.customId === 'info_open_ticket') {
        const ticketEmbed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Support Ticket Center')
            .setDescription(
                'Our team handles support requests through tickets so every case is documented and ' +
                'reviewed by the right person. Please read the guide below before opening one.'
            )
            .addFields(
                {
                    name: 'Before Opening A Ticket',
                    value:
                        '1. Check the rules and information channels.\n' +
                        '2. Search previous tickets if you have opened one before.\n' +
                        '3. Gather your user ID, a description and any screenshots.\n' +
                        '4. Open one ticket per issue instead of spamming several.',
                    inline: false
                },
                {
                    name: 'Ticket Categories',
                    value:
                        '**Account:** login problems, verification, linked accounts.\n' +
                        '**Bug Report:** crashes, broken features, unexpected behavior.\n' +
                        '**Player Report:** harassment, exploits, rule violations.\n' +
                        '**Appeal:** review of a warning, timeout, kick or ban.\n' +
                        '**Licensing:** permission requests and partnerships.',
                    inline: false
                },
                {
                    name: 'What To Include',
                    value:
                        'Your Discord user ID, your Roblox username, a clear description of the issue, ' +
                        'steps to reproduce it if it is a bug, and the date it happened. ' +
                        'Never include passwords or payment information.',
                    inline: false
                },
                {
                    name: 'Response And Conduct',
                    value:
                        'Typical first response: 2 to 4 hours.\n' +
                        'Appeals are reviewed within 48 hours.\n' +
                        'Keep the conversation in the ticket. Do not ping staff repeatedly or ' +
                        'open duplicate tickets to speed things up.',
                    inline: false
                }
            )
            .setFooter({ text: 'Jaxdrax Studio Support Team' })
            .setTimestamp();

        const ticketButton = new ButtonBuilder()
            .setCustomId('ticket_create')
            .setLabel('Open A Ticket')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(ticketButton);

        return interaction.reply({ embeds: [ticketEmbed], components: [row], flags: MessageFlags.Ephemeral });
    }

    return false;
}

async function handleTicketCreate(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('ticket_modal')
        .setTitle('Open A Support Ticket');

    const categoryInput = new TextInputBuilder()
        .setCustomId('ticket_category')
        .setLabel('Category')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Account, Bug Report, Player Report, Appeal, Licensing')
        .setRequired(true);

    const descriptionInput = new TextInputBuilder()
        .setCustomId('ticket_description')
        .setLabel('Description')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Describe your issue in detail. Include your Discord ID, Roblox username, and any relevant information.')
        .setMaxLength(2000)
        .setRequired(true);

    const firstRow = new ActionRowBuilder().addComponents(categoryInput);
    const secondRow = new ActionRowBuilder().addComponents(descriptionInput);

    modal.addComponents(firstRow, secondRow);

    return interaction.showModal(modal);
}

async function handleTicketModal(interaction) {
    const category = interaction.fields.getTextInputValue('ticket_category');
    const description = interaction.fields.getTextInputValue('ticket_description');

    const guild = interaction.guild;
    const ticketCategory = guild.channels.cache.find(c => c.name === 'ticket-transcripts' && c.type === ChannelType.GuildCategory);
    
    if (!ticketCategory) {
        return interaction.reply({
            content: 'The ticket category could not be found. Please contact a staff member.',
            flags: MessageFlags.Ephemeral
        });
    }

    const staffRole = guild.roles.cache.find(r => STAFF_ROLES.includes(r.name));

    const ticketChannel = await guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: ticketCategory.id,
        topic: `Ticket by ${interaction.user.tag} | Category: ${category}`,
        permissionOverwrites: [
            {
                id: guild.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: interaction.user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
            },
            {
                id: staffRole ? staffRole.id : guild.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages]
            }
        ]
    });

    const ticketEmbed = new EmbedBuilder()
        .setColor(COLORS.dark)
        .setTitle('Support Ticket Opened')
        .setDescription(
            `**User:** ${interaction.user.tag}\n` +
            `**ID:** ${interaction.user.id}\n` +
            `**Category:** ${category}\n\n` +
            `**Description:**\n${description}`
        )
        .setFooter({ text: 'Jaxdrax Studio Support' })
        .setTimestamp();

    await ticketChannel.send({
        content: `${interaction.user} | Staff will be with you shortly.`,
        embeds: [ticketEmbed]
    });

    return interaction.reply({
        content: `Your ticket has been created: ${ticketChannel}`,
        flags: MessageFlags.Ephemeral
    });
}

client.on(Events.InteractionCreate, async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            const isStaff = interaction.member
                ? interaction.member.roles.cache.some(r => STAFF_ROLES.includes(r.name))
                : false;

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
                console.error('[Slash] ' + interaction.commandName + ': ' + error.message);

                const payload = {
                    content: 'An unexpected error occurred while running this command.',
                    flags: MessageFlags.Ephemeral
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(payload).catch(() => {});
                } else {
                    await interaction.reply(payload).catch(() => {});
                }
            } finally {
                if (isPanel && interaction.deferred) {
                    await interaction.deleteReply().catch(() => {});
                }
            }

            return;
        }

        if (!interaction.isButton() && !interaction.isModalSubmit()) return;

        const id = interaction.customId || '';

        if (id === 'ticket_create') {
            await handleTicketCreate(interaction);
            return;
        }

        if (id === 'ticket_modal') {
            await handleTicketModal(interaction);
            return;
        }

        if (id.startsWith('info_')) {
            await handleInfoButton(interaction);
            return;
        }

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
    } catch (error) {
        console.error('[Interaction] ' + error.message);
    }
});

client.on(Events.MessageCreate, async message => {
    try {
        if (message.author.bot || !message.guild) return;
        if (!message.content.startsWith(PREFIX)) return;

        const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
        const name = args.shift().toLowerCase();

        const command = client.legacyCommands.get(name);
        if (!command) return;

        const isStaff = message.member
            ? message.member.roles.cache.some(r => STAFF_ROLES.includes(r.name))
            : false;

        if (PANEL_COMMANDS.has(name)) {
            const context = createContext(message, name, false);
            await command.execute(context, isStaff, client);
        } else {
            await command.execute(message, isStaff, client);
        }
    } catch (error) {
        console.error('[Prefix] ' + error.message);
    }
});

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
