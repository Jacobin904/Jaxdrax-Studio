require('dotenv').config();
const { 
    Client, GatewayIntentBits, Events, EmbedBuilder, ChannelType, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, 
    TextInputBuilder, TextInputStyle, MessageFlags, ActivityType
} = require('discord.js');

process.on('unhandledRejection', error => console.error('Unhandled rejection:', error));
process.on('uncaughtException', error => { console.error('Uncaught exception:', error); process.exit(1); });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ],
});

const staffRoles = ['Game Direction', 'Admin', 'Moderator', 'Developer', 'Staff Team'];
const express = require('express');

const COLORS = { light: '#fbf7f7', gray: '#a49f9e', red: '#cf0d0e', darkRed: '#6c0b0d', dark: '#242120' };
const LOGO_URL = 'https://media.discordapp.net/attachments/1561478676850151638/1561543957790330900/q1401r6.png?ex=6ad6bca3&is=6ad56b23&hm=e061b0defbc9b679db94772c199cdb7e9599ceefdbf1b7107430e2a99ffe8991&animated=true';

let robloxPresence = { onlinePlayers: 0, totalPlayers: 0, serverStatus: 'Unknown' };

async function sendDevLog(embed) {
    const channel = client.channels.cache.get(process.env.DEV_LOGS_CHANNEL_ID);
    if (channel) { 
        try { await channel.send({ embeds: [embed] }); } catch (error) {}
    }
}

let presenceIndex = 0;

function updateBotPresence() {
    const guild = client.guilds.cache.first();
    const memberCount = guild ? guild.memberCount : 0;
    
    const streamingMessages = [
        `Your Fish Life`,
        `${memberCount} members`,
        `!help for commands`,
        `${robloxPresence.onlinePlayers} players in-game`,
        `Jaxdrax Studio`
    ];
    
    const currentMessage = streamingMessages[presenceIndex % streamingMessages.length];
    
    client.user.setPresence({
        activities: [{ 
            name: currentMessage,
            type: ActivityType.Streaming,
            url: 'https://twitch.tv/jaxdraxstudio'
        }],
        status: 'online',
        afk: false
    });
    
    presenceIndex++;
}

setInterval(updateBotPresence, 120000);

client.once(Events.ClientReady, (c) => {
    console.log(`Bot online: ${c.user.tag}`);
    updateBotPresence();
    sendDevLog(new EmbedBuilder().setColor(COLORS.dark).setTitle('Bot Online').setDescription(`Connected as ${c.user.tag}`).setThumbnail(LOGO_URL).setTimestamp());
});

// Logs serveur
client.on(Events.GuildMemberAdd, async (member) => {
    const channel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
    if (channel) {
        await channel.send({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Welcome').setDescription(`Welcome <@${member.user.id}>!`).setThumbnail(member.user.displayAvatarURL()).setTimestamp()] });
    }
    if (process.env.MEMBER_ROLE_ID) { try { await member.roles.add(process.env.MEMBER_ROLE_ID); } catch (e) {} }
    sendDevLog(new EmbedBuilder().setColor(COLORS.dark).setTitle('Member Joined').setDescription(`${member.user.tag} joined`).setTimestamp());
});

client.on(Events.GuildMemberRemove, (member) => {
    sendDevLog(new EmbedBuilder().setColor(COLORS.red).setTitle('Member Left').setDescription(`${member.user.tag} left`).setTimestamp());
});

client.on(Events.MessageDelete, (message) => {
    if (message.author.bot || !message.guild) return;
    sendDevLog(new EmbedBuilder().setColor(COLORS.gray).setTitle('Message Deleted').setDescription(`Author: ${message.author.tag}\nChannel: ${message.channel.name}\nContent: ${message.content || 'No text'}`).setTimestamp());
});

client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
    if (oldMessage.author.bot || !oldMessage.guild || oldMessage.content === newMessage.content) return;
    sendDevLog(new EmbedBuilder().setColor(COLORS.gray).setTitle('Message Edited').setDescription(`Author: ${oldMessage.author.tag}\nChannel: ${oldMessage.channel.name}\nBefore: ${oldMessage.content}\nAfter: ${newMessage.content}`).setTimestamp());
});

// Commandes
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;
    const isStaff = message.member.roles.cache.some(role => staffRoles.includes(role.name));

    if (message.content === '!ping') {
        await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Pong').setDescription(`${Date.now() - message.createdTimestamp}ms`).setTimestamp()] });
    }

    if (message.content === '!help') {
        await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Help').addFields(
            { name: '!ping', value: 'Check latency' },
            { name: '!rules', value: 'View rules' },
            { name: '!info', value: 'Game info' },
            { name: '!ticket', value: 'Open ticket panel (staff)' },
            { name: '!config', value: 'Server config (staff)' }
        ).setTimestamp()] });
    }

    if (message.content === '!config') {
        if (!isStaff) return message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Access Denied').setDescription('Staff only.').setTimestamp()], flags: MessageFlags.Ephemeral });

        const guild = message.guild;
        const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).map(c => `\`${c.id}\` - ${c.name}`).join('\n') || 'None';
        const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).map(c => `\`${c.id}\` - ${c.name}`).join('\n') || 'None';
        const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).map(c => `\`${c.id}\` - ${c.name}`).join('\n') || 'None';
        const roles = guild.roles.cache.filter(r => r.name !== '@everyone').sort((a, b) => b.position - a.position).map(r => `\`${r.id}\` - ${r.name} (${r.hexColor})`).join('\n') || 'None';

        try {
            await message.author.send({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Config').setDescription(`**${guild.name}** (${guild.id})\n\n**Categories:**\n${categories.substring(0, 1000)}\n\n**Text Channels:**\n${textChannels.substring(0, 1000)}\n\n**Voice Channels:**\n${voiceChannels.substring(0, 1000)}\n\n**Roles:**\n${roles.substring(0, 1000)}`).setTimestamp()] });
            await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Sent').setDescription('Check your DMs.').setTimestamp()], flags: MessageFlags.Ephemeral });
        } catch {
            await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('Enable DMs from server members.').setTimestamp()], flags: MessageFlags.Ephemeral });
        }
    }

    if (message.content === '!rules') {
        if (isStaff) {
            await message.channel.send({ embeds: [new EmbedBuilder().setColor(COLORS.darkRed).setTitle('Rules').setDescription('1. Respect everyone\n2. No spam\n3. Keep channels organized\n4. No exploits\n5. Follow Discord TOS\n6. Staff decisions are final').setTimestamp()] });
        } else {
            await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Rules').setDescription('Read the rules channel.').setTimestamp()] });
        }
    }

    if (message.content === '!info') {
        if (isStaff) {
            await message.channel.send({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Your Fish Life').addFields(
                { name: 'Developer', value: 'Jaxdrax Studio' },
                { name: 'Status', value: 'Active Development' },
                { name: 'Players Online', value: `${robloxPresence.onlinePlayers}` }
            ).setTimestamp()] });
        } else {
            await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.gray).setTitle('Your Fish Life').setDescription('Coming soon!').setTimestamp()] });
        }
    }

    if (message.content === '!ticket') {
        if (isStaff) {
            const button = new ButtonBuilder().setCustomId('open_ticket').setLabel('Open Ticket').setStyle(ButtonStyle.Primary);
            await message.channel.send({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Support').setDescription('Click below to open a ticket.').setTimestamp()], components: [new ActionRowBuilder().addComponents(button)] });
        } else {
            await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.gray).setTitle('Tickets').setDescription('Use the button in help-desk.').setTimestamp()] });
        }
    }
});

// Tickets
client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'open_ticket') {
            const ticketChannelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
            
            if (interaction.guild.channels.cache.find(c => c.name === ticketChannelName)) {
                return interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('You already have a ticket.').setTimestamp()], flags: MessageFlags.Ephemeral });
            }

            const permissionOverwrites = [
                { id: interaction.guild.id, deny: ['ViewChannel'] },
                { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }
            ];
            
            staffRoles.forEach(roleName => {
                const role = interaction.guild.roles.cache.find(r => r.name === roleName);
                if (role) permissionOverwrites.push({ id: role.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] });
            });

            try {
                const newChannel = await interaction.guild.channels.create({
                    name: ticketChannelName,
                    type: ChannelType.GuildText,
                    parent: interaction.channel.parentId,
                    topic: `Ticket by ${interaction.user.id}`,
                    permissionOverwrites,
                    reason: `Ticket by ${interaction.user.tag}`
                });

                const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setStyle(ButtonStyle.Danger);
                await newChannel.send({ 
                    content: `<@${interaction.user.id}>`,
                    embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Ticket Opened').setDescription(`Welcome ${interaction.user.tag}!`).setTimestamp()],
                    components: [new ActionRowBuilder().addComponents(closeBtn)]
                });

                await interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Created').setDescription(`Ticket: ${newChannel}`).setTimestamp()], flags: MessageFlags.Ephemeral });
                
            } catch (error) {
                console.error(error);
                await interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('Failed to create ticket.').setTimestamp()], flags: MessageFlags.Ephemeral });
            }
        }

        if (interaction.customId === 'close_ticket') {
            const modal = new ModalBuilder().setCustomId('close_ticket_modal').setTitle('Close Ticket');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reason').setLabel('Reason').setStyle(TextInputStyle.Paragraph).setRequired(false)));
            await interaction.showModal(modal);
        }

        if (interaction.customId === 'delete_ticket') {
            await interaction.deferUpdate();
            try {
                const messages = await interaction.channel.messages.fetch({ limit: 100 });
                let transcript = `Transcript for ${interaction.channel.name}\n\n`;
                Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp).forEach(msg => { 
                    transcript += `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content || '(embed)'}\n`; 
                });
                
                const transcriptChannel = interaction.client.channels.cache.get(process.env.TICKET_TRANSCRIPTS_CHANNEL_ID);
                if (transcriptChannel) {
                    await transcriptChannel.send({ 
                        embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Transcript').setDescription(`${interaction.channel.name}`).setTimestamp()],
                        files: [{ attachment: Buffer.from(transcript, 'utf-8'), name: `${interaction.channel.name}.txt` }] 
                    });
                }
                await interaction.channel.delete('Closed');
            } catch (error) {
                console.error(error);
            }
        }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'close_ticket_modal') {
        const reason = interaction.fields.getTextInputValue('reason') || 'No reason';
        const creatorId = interaction.channel.topic?.match(/\d{17,19}/)?.[0];
        
        if (creatorId) {
            await interaction.channel.permissionOverwrites.edit(creatorId, { ViewChannel: false, SendMessages: false });
        }
        
        const reopenBtn = new ButtonBuilder().setCustomId('reopen_ticket').setLabel('Reopen').setStyle(ButtonStyle.Success);
        const deleteBtn = new ButtonBuilder().setCustomId('delete_ticket').setLabel('Delete').setStyle(ButtonStyle.Danger);
        
        await interaction.channel.send({ 
            embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Closed').setDescription(`By: ${interaction.user.tag}\nReason: ${reason}`).setTimestamp()],
            components: [new ActionRowBuilder().addComponents(reopenBtn, deleteBtn)]
        });
        
        await interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Done').setDescription('Ticket closed.').setTimestamp()], flags: MessageFlags.Ephemeral });
    }

    if (interaction.isButton() && interaction.customId === 'reopen_ticket') {
        const creatorId = interaction.channel.topic?.match(/\d{17,19}/)?.[0];
        if (creatorId) {
            await interaction.channel.permissionOverwrites.edit(creatorId, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
        }
        
        const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setStyle(ButtonStyle.Danger);
        await interaction.channel.send({ 
            embeds: [new EmbedBuilder().setColor(COLORS.gray).setTitle('Reopened').setDescription(`By: ${interaction.user.tag}`).setTimestamp()],
            components: [new ActionRowBuilder().addComponents(closeBtn)]
        });
        
        await interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.gray).setTitle('Done').setDescription('Ticket reopened.').setTimestamp()], flags: MessageFlags.Ephemeral });
    }
});

client.login(process.env.DISCORD_TOKEN);

// API
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

function verifyRobloxKey(req, res, next) {
    if (req.headers['x-roblox-key'] !== process.env.ROBLOX_API_KEY) return res.status(401).json({ error: 'Invalid API key' });
    next();
}

app.get('/', (req, res) => res.status(200).send('OK'));

app.post('/api/update-presence', verifyRobloxKey, (req, res) => {
    try {
        const { onlinePlayers, totalPlayers, serverStatus } = req.body;
        robloxPresence = { onlinePlayers: onlinePlayers || 0, totalPlayers: totalPlayers || 0, serverStatus: serverStatus || 'Unknown' };
        updateBotPresence();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/check-member', verifyRobloxKey, async (req, res) => {
    try {
        const { discordId, guildId } = req.body;
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.json({ isMember: false });
        try { await guild.members.fetch(discordId); res.json({ isMember: true }); } catch { res.json({ isMember: false }); }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/stats', verifyRobloxKey, (req, res) => {
    const guild = client.guilds.cache.first();
    if (!guild) return res.status(404).json({ error: 'No guild' });
    res.json({ memberCount: guild.memberCount, botOnline: true, robloxPresence });
});

app.listen(PORT, () => console.log(`API on port ${PORT}`));
