require('dotenv').config();
const {
    Client, GatewayIntentBits, Events, EmbedBuilder, ChannelType,
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder,
    TextInputBuilder, TextInputStyle, MessageFlags, ActivityType
} = require('discord.js');
const http = require('http');

const COLORS = { dark: '#242120', gray: '#a49f9e', red: '#cf0d0e', darkRed: '#6c0b0d' };
const LOGO_URL = process.env.LOGO_URL || '';
const STAFF = ['Game Direction', 'Admin', 'Moderator', 'Developer', 'Staff Team'];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

const tickets = new Map();
const lastLog = new Map();
let ready = false;

function embed(title, description, color = COLORS.dark) {
    const e = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(String(description).slice(0, 3500))
        .setTimestamp();
    if (LOGO_URL) e.setThumbnail(LOGO_URL);
    return e;
}

async function log(title, description, color = COLORS.dark) {
    if (!ready) return;
    const now = Date.now();
    if (now - (lastLog.get(title) || 0) < 3000) return;
    lastLog.set(title, now);
    const channel = client.channels.cache.get(process.env.DEV_LOGS_CHANNEL_ID);
    if (!channel) return;
    try { await channel.send({ embeds: [embed(title, description, color)] }); } catch {}
}

function getGuild() {
    return client.guilds.cache.get(process.env.GUILD_ID);
}

function ticketButtons(userId) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`dm_reply_${userId}`).setLabel('Reply').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`dm_close_${userId}`).setLabel('Close Ticket').setStyle(ButtonStyle.Danger)
    );
}

client.once(Events.ClientReady, async () => {
    ready = true;
    try {
        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        await guild.channels.fetch();
        await guild.roles.fetch();

        for (const channel of guild.channels.cache.values()) {
            const match = /^DM Ticket for (\d{17,19})$/.exec(channel.topic || '');
            if (match) tickets.set(match[1], channel.id);
        }

        await log('System Ready', `Connected as ${client.user.tag}\nGuild: ${guild.name}\nRestored tickets: ${tickets.size}`);
    } catch (error) {
        console.error('Startup error:', error.message);
    }
});

setInterval(() => {
    if (!ready) return;
    client.user.setPresence({
        activities: [{ name: 'Your Fish Life', type: ActivityType.Streaming, url: 'https://twitch.tv/jaxdraxstudio' }],
        status: 'online'
    });
}, 120000);

client.on(Events.MessageCreate, async (message) => {
    // REGLE CRITIQUE : cette ligne doit rester EN PREMIER
    if (message.author.bot) return;
    if (message.author.id === client.user.id) return;

    const guild = getGuild();
    if (!guild) return;

    // Messages du staff dans un salon de ticket -> relais en DM
    if (message.guild) {
        const match = /^DM Ticket for (\d{17,19})$/.exec(message.channel.topic || '');
        if (!match) return;

        const isStaff = message.member?.roles.cache.some(role => STAFF.includes(role.name));
        if (!isStaff) return;

        try {
            const user = await client.users.fetch(match[1]);
            await user.send({
                embeds: [embed('Staff Response', message.content || 'No text content', COLORS.gray)
                    .setAuthor({ name: `${message.author.tag} (Staff)`, iconURL: message.author.displayAvatarURL() })]
            });
        } catch (error) {
            await message.reply({
                content: `Could not deliver this message: ${error.message}`,
                flags: MessageFlags.Ephemeral
            });
        }
        return;
    }

    // Messages recus en DM
    if (message.channel.type !== ChannelType.DM) return;
    const user = message.author;
    const channelId = tickets.get(user.id);
    const ticketChannel = channelId ? guild.channels.cache.get(channelId) : null;

    if (ticketChannel) {
        try {
            const e = embed('User Message', message.content || 'No text content')
                .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
                .addFields({ name: 'User ID', value: user.id });

            if (message.attachments.size > 0) {
                e.addFields({ name: 'Attachments', value: [...message.attachments.values()].map(a => a.url).join('\n').slice(0, 900) });
            }

            await ticketChannel.send({ embeds: [e], components: [ticketButtons(user.id)] });
            try { await message.react('✅'); } catch {}
        } catch (error) {
            await log('Relay Failed', `${user.tag}: ${error.message}`, COLORS.red);
        }
        return;
    }

    // Aucun ticket ouvert -> proposition avec boutons
    try {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`dm_open_${user.id}`).setLabel('Open Ticket').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`dm_cancel_${user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary)
        );

        await message.reply({
            embeds: [embed('Support Ticket', `Hello ${user.username}. Would you like to open a private support ticket?\n\nClick Open Ticket to create one, or Cancel to dismiss this message.`)],
            components: [row]
        });

        await log('DM Received', `${user.tag} (${user.id}) sent a DM. Ticket prompt delivered.`);
    } catch (error) {
        await log('DM Reply Failed', `${user.tag}\nCode: ${error.code}\n${error.message}`, COLORS.red);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    const id = interaction.customId || '';

    if (interaction.isButton()) {
        if (id.startsWith('dm_open_')) {
            const userId = id.replace('dm_open_', '');
            if (interaction.user.id !== userId) {
                return interaction.reply({ content: 'This button is not for you.', flags: MessageFlags.Ephemeral });
            }

            const guild = getGuild();
            if (!guild) return interaction.reply({ content: 'Server not found.', flags: MessageFlags.Ephemeral });
            if (tickets.has(userId)) {
                return interaction.update({ content: 'You already have an open ticket. Just send your message here.', components: [] });
            }

            try {
                const overwrites = [{ id: guild.id, deny: ['ViewChannel'] }];
                for (const name of STAFF) {
                    const role = guild.roles.cache.find(r => r.name === name);
                    if (role) overwrites.push({ id: role.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] });
                }

                const channel = await guild.channels.create({
                    name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                    type: ChannelType.GuildText,
                    topic: `DM Ticket for ${userId}`,
                    permissionOverwrites: overwrites,
                    parent: process.env.DM_TICKET_CATEGORY_ID || undefined,
                    reason: `DM ticket for ${interaction.user.tag}`
                });

                tickets.set(userId, channel.id);

                await channel.send({
                    embeds: [embed('DM Ticket Opened', `User: ${interaction.user.tag}\nID: ${userId}\n\nThis user cannot see this channel. Type a message here to reply, or use the buttons on their messages.`)]
                });

                await interaction.update({
                    embeds: [embed('Ticket Opened', 'Your ticket is now open. Send your message here and it will be delivered to the staff team.')],
                    components: []
                });
            } catch (error) {
                await log('Ticket Creation Failed', `Code: ${error.code}\n${error.message}`, COLORS.red);
                await interaction.update({ content: `Could not create the ticket: ${error.message}`, components: [] });
            }
            return;
        }

        if (id.startsWith('dm_cancel_')) {
            if (interaction.user.id !== id.replace('dm_cancel_', '')) return;
            return interaction.update({ content: 'Cancelled. Message the bot again if you need help.', components: [] });
        }

        if (id.startsWith('dm_reply_')) {
            const userId = id.replace('dm_reply_', '');
            const modal = new ModalBuilder().setCustomId(`modal_reply_${userId}`).setTitle('Reply to User');
            modal.addComponents(new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('reply_message').setLabel('Your reply').setStyle(TextInputStyle.Paragraph).setRequired(true)
            ));
            return interaction.showModal(modal);
        }

        if (id.startsWith('dm_close_')) {
            const userId = id.replace('dm_close_', '');
            const modal = new ModalBuilder().setCustomId(`modal_close_${userId}`).setTitle('Close Ticket');
            modal.addComponents(new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('close_reason').setLabel('Reason (optional)').setStyle(TextInputStyle.Paragraph).setRequired(false)
            ));
            return interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit()) {
        if (id.startsWith('modal_reply_')) {
            const userId = id.replace('modal_reply_', '');
            const text = interaction.fields.getTextInputValue('reply_message');
            try {
                const user = await client.users.fetch(userId);
                await user.send({
                    embeds: [embed('Staff Response', text, COLORS.gray)
                        .setAuthor({ name: `${interaction.user.tag} (Staff)`, iconURL: interaction.user.displayAvatarURL() })]
                });
                await interaction.reply({ content: 'Reply delivered to the user.', flags: MessageFlags.Ephemeral });
            } catch (error) {
                await interaction.reply({ content: `Delivery failed: ${error.message}`, flags: MessageFlags.Ephemeral });
            }
            return;
        }

        if (id.startsWith('modal_close_')) {
            const userId = id.replace('modal_close_', '');
            const reason = interaction.fields.getTextInputValue('close_reason') || 'No reason provided.';
            try {
                const user = await client.users.fetch(userId);
                await user.send({ embeds: [embed('Ticket Closed', `Closed by ${interaction.user.tag}.\nReason: ${reason}\n\nSend a new message here to open another ticket.`, COLORS.red)] });

                const messages = await interaction.channel.messages.fetch({ limit: 100 });
                const transcript = Array.from(messages.values())
                    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
                    .map(m => `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content || '(embed/attachment)'}`)
                    .join('\n');

                const archive = interaction.client.channels.cache.get(process.env.TICKET_TRANSCRIPTS_CHANNEL_ID);
                if (archive) {
                    await archive.send({
                        embeds: [embed('Ticket Transcript', `User: ${user.tag}\nClosed by: ${interaction.user.tag}\nReason: ${reason}`)],
                        files: [{ attachment: Buffer.from(transcript, 'utf-8'), name: `ticket-${user.username}.txt` }]
                    });
                }
            } catch (error) {
                await log('Ticket Close Failed', error.message, COLORS.red);
            } finally {
                tickets.delete(userId);
                try { await interaction.channel.delete('Ticket closed'); } catch {}
            }
            return;
        }
    }
});

client.login(process.env.DISCORD_TOKEN);

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Jaxdrax Studio Bot is running');
}).listen(process.env.PORT || 3000);
