require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    Events, 
    EmbedBuilder, 
    ChannelType, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags
} = require('discord.js');

// FILETS DE SÉCURITÉ
process.on('unhandledRejection', error => console.error('Unhandled rejection:', error));
process.on('uncaughtException', error => { console.error('Uncaught exception:', error); process.exit(1); });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

const staffRoles = ['Game Direction', 'Admin', 'Moderator', 'Developer'];
const express = require('express');

const COLORS = { light: '#fbf7f7', gray: '#a49f9e', red: '#cf0d0e', darkRed: '#6c0b0d', dark: '#242120' };
const LOGO_URL = 'https://media.discordapp.net/attachments/1561478676850151638/1561543957790330900/q1401r6.png?ex=6ad6bca3&is=6ad56b23&hm=e061b0defbc9b679db94772c199cdb7e9599ceefdbf1b7107430e2a99ffe8991&animated=true';

async function sendDevLog(embed) {
    const channelId = process.env.DEV_LOGS_CHANNEL_ID;
    if (!channelId) return;
    const channel = client.channels.cache.get(channelId);
    if (channel) { try { await channel.send({ embeds: [embed] }); } catch (error) {} }
}

client.once(Events.ClientReady, (c) => {
    console.log(`Bot is online as ${c.user.tag}`);
    sendDevLog(new EmbedBuilder().setColor(COLORS.dark).setTitle('Bot Online').setDescription(`Connected as ${c.user.tag}.`).setThumbnail(LOGO_URL).setTimestamp());
});

client.on(Events.GuildMemberAdd, async (member) => {
    const channel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
    if (channel) {
        await channel.send({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Welcome to Your Fish Life').setDescription(`Hello <@${member.user.id}>\nName: ${member.user.username}\nID: ${member.user.id}`).setThumbnail(member.user.displayAvatarURL()).setFooter({ text: 'Jaxdrax Studio', iconURL: LOGO_URL }).setTimestamp()] });
    }
    if (process.env.MEMBER_ROLE_ID) { try { await member.roles.add(process.env.MEMBER_ROLE_ID); } catch (e) {} }
    sendDevLog(new EmbedBuilder().setColor(COLORS.dark).setTitle('Member Joined').setDescription(`<@${member.user.id}> (${member.user.username}, ${member.user.id})`).setThumbnail(member.user.displayAvatarURL()).setTimestamp());
});

client.on(Events.GuildMemberRemove, (member) => {
    sendDevLog(new EmbedBuilder().setColor(COLORS.red).setTitle('Member Left').setDescription(`<@${member.user.id}> (${member.user.username}, ${member.user.id})`).setThumbnail(member.user.displayAvatarURL()).setTimestamp());
});

client.on(Events.MessageDelete, (message) => {
    if (message.author.bot || !message.guild) return;
    sendDevLog(new EmbedBuilder().setColor(COLORS.gray).setTitle('Message Deleted').setDescription(`Author: <@${message.author.id}> (${message.author.username}, ${message.author.id})\nChannel: <#${message.channel.id}>`).addFields({ name: 'Content', value: message.content || 'No text' }).setTimestamp());
});

client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
    if (oldMessage.author.bot || !oldMessage.guild || oldMessage.content === newMessage.content) return;
    sendDevLog(new EmbedBuilder().setColor(COLORS.gray).setTitle('Message Edited').setDescription(`Author: <@${oldMessage.author.id}> (${oldMessage.author.username}, ${oldMessage.author.id})\nChannel: <#${oldMessage.channel.id}>`).addFields({ name: 'Before', value: oldMessage.content || 'No text' }, { name: 'After', value: newMessage.content || 'No text' }).setTimestamp());
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;
    const isStaff = message.member.roles.cache.some(role => staffRoles.includes(role.name));

    if (message.content === '!ping') {
        await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Bot Latency').setDescription(`Pong! ${Date.now() - message.createdTimestamp}ms`).setThumbnail(LOGO_URL)] });
    }

    if (message.content === '!help') {
        const helpEmbed = new EmbedBuilder().setColor(COLORS.dark).setTitle('Jaxdrax Studio Bot - Help Menu').addFields(
            { name: '!ping', value: 'Check bot latency.' },
            { name: '!rules', value: 'View server rules.' },
            { name: '!info', value: 'Game information.' },
            { name: '!ticket', value: 'Display the ticket panel (Staff) or get instructions (Members).' },
            { name: '!config', value: 'Send full server configuration to your DMs (Staff only).' }
        ).setThumbnail(LOGO_URL).setTimestamp();
        await message.reply({ embeds: [helpEmbed] });
    }

    // NOUVELLE COMMANDE !CONFIG
    if (message.content === '!config') {
        if (!isStaff) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Access Denied').setDescription('This command is restricted to staff members only.').setThumbnail(LOGO_URL)], flags: MessageFlags.Ephemeral });
        }

        const guild = message.guild;
        await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Processing').setDescription('Gathering server configuration... Please check your DMs.').setThumbnail(LOGO_URL)], flags: MessageFlags.Ephemeral });

        const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).map(c => `\`${c.id}\` - ${c.name}`).join('\n') || 'None';
        const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).map(c => `\`${c.id}\` - ${c.name}`).join('\n') || 'None';
        const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).map(c => `\`${c.id}\` - ${c.name}`).join('\n') || 'None';
        const roles = guild.roles.cache.filter(r => r.name !== '@everyone').sort((a, b) => b.position - a.position).map(r => `\`${r.id}\` - ${r.name} (${r.hexColor})`).join('\n') || 'None';

        const configEmbed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Server Configuration Dump')
            .setDescription(`Full configuration data for **${guild.name}** (ID: \`${guild.id}\`).`)
            .addFields(
                { name: 'Server Info', value: `Members: ${guild.memberCount}\nOwner: <@${guild.ownerId}>` },
                { name: `Categories (${guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size})`, value: categories.substring(0, 1024) },
                { name: `Text Channels (${guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size})`, value: textChannels.substring(0, 1024) },
                { name: `Voice Channels (${guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size})`, value: voiceChannels.substring(0, 1024) },
                { name: `Roles (${guild.roles.cache.size - 1})`, value: roles.substring(0, 1024) }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Config Tool' })
            .setTimestamp();

        try {
            await message.author.send({ embeds: [configEmbed] });
        } catch (error) {
            await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('I could not send you a DM. Please enable DMs from server members.').setThumbnail(LOGO_URL)], flags: MessageFlags.Ephemeral });
        }
    }

    // (Le reste des commandes !rules, !info, !ticket reste exactement identique à la version précédente)
    if (message.content === '!rules') {
        if (isStaff) {
            await message.channel.send({ embeds: [new EmbedBuilder().setColor(COLORS.darkRed).setTitle('Complete Server Rules').setDescription('1. Respect Everyone\n2. No Spam or Self Promotion\n3. Keep Channels Organized\n4. No Exploits or Cheating\n5. Follow Discord TOS\n6. Staff Decisions are Final').setThumbnail(LOGO_URL).setFooter({ text: 'Jaxdrax Studio Management' }).setTimestamp()] });
        } else {
            await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Server Rules').setDescription('Please read the rules channel.').setThumbnail(LOGO_URL)] });
        }
    }

    if (message.content === '!info') {
        if (isStaff) {
            await message.channel.send({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Your Fish Life - Complete Info').addFields({ name: 'Developer', value: 'Jaxdrax Studio' }, { name: 'Status', value: 'Active Development' }).setThumbnail(LOGO_URL).setFooter({ text: 'Jaxdrax Studio Development Team' }).setTimestamp()] });
        } else {
            await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.gray).setTitle('Your Fish Life - Game Info').addFields({ name: 'Developer', value: 'Jaxdrax Studio' }, { name: 'Status', value: 'In Development' }).setThumbnail(LOGO_URL)] });
        }
    }

    if (message.content === '!ticket') {
        if (isStaff) {
            const button = new ButtonBuilder().setCustomId('open_ticket').setLabel('Open Ticket').setStyle(ButtonStyle.Primary);
            await message.channel.send({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Support Ticket System').setDescription('Click the button below to open a private ticket channel.').setThumbnail(LOGO_URL).setFooter({ text: 'Your Fish Life Support' }).setTimestamp()], components: [new ActionRowBuilder().addComponents(button)] });
        } else {
            await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.gray).setTitle('Ticket Instructions').setDescription('Please use the Open Ticket button in the support channel.').setThumbnail(LOGO_URL)] });
        }
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'open_ticket') {
            const ticketChannelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
            if (interaction.guild.channels.cache.find(c => c.name === ticketChannelName)) {
                return interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Ticket Already Open').setDescription('You already have an open ticket.').setThumbnail(LOGO_URL)], flags: MessageFlags.Ephemeral });
            }

            const permissionOverwrites = [
                { id: interaction.guild.id, deny: ['ViewChannel'] },
                { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }
            ];
            ['Moderator', 'Admin', 'Game Direction'].forEach(roleName => {
                const role = interaction.guild.roles.cache.find(r => r.name === roleName);
                if (role) permissionOverwrites.push({ id: role.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] });
            });

            try {
                const newChannel = await interaction.guild.channels.create({
                    name: ticketChannelName, type: ChannelType.GuildText, parent: interaction.channel.parentId,
                    topic: `Ticket created by ${interaction.user.id}`, permissionOverwrites, reason: `Ticket by ${interaction.user.tag}`
                });

                const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger);
                await newChannel.send({ content: `<@${interaction.user.id}>`, embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Support Ticket Opened').setDescription(`Hello <@${interaction.user.id}>\nName: ${interaction.user.username}\nID: ${interaction.user.id}`).setThumbnail(LOGO_URL).setTimestamp()], components: [new ActionRowBuilder().addComponents(closeBtn)] });

                try {
                    await interaction.user.send({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Ticket Created').setDescription(`Your ticket has been created: ${newChannel}`).setThumbnail(LOGO_URL)] });
                    await interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Success').setDescription('Confirmation sent to your DMs.').setThumbnail(LOGO_URL)], flags: MessageFlags.Ephemeral });
                } catch {
                    await interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Ticket Created').setDescription(`Your ticket: ${newChannel}`).setThumbnail(LOGO_URL)], flags: MessageFlags.Ephemeral });
                }
            } catch (error) { console.error(error); }
        }

        if (interaction.customId === 'close_ticket') {
            const modal = new ModalBuilder().setCustomId('close_ticket_modal').setTitle('Close Ticket');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reason').setLabel('Reason (optional)').setStyle(TextInputStyle.Paragraph).setRequired(false)));
            await interaction.showModal(modal);
        }

        if (interaction.customId === 'reopen_ticket') {
            const creatorId = interaction.channel.topic?.match(/\d{17,19}/)?.[0];
            if (creatorId) await interaction.channel.permissionOverwrites.edit(creatorId, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
            const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger);
            await interaction.channel.send({ embeds: [new EmbedBuilder().setColor(COLORS.gray).setTitle('Ticket Reopened').setDescription(`Reopened by <@${interaction.user.id}> (${interaction.user.username}, ${interaction.user.id})`).setThumbnail(LOGO_URL).setTimestamp()], components: [new ActionRowBuilder().addComponents(closeBtn)] });
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.gray).setTitle('Success').setDescription('Ticket reopened.').setThumbnail(LOGO_URL)], flags: MessageFlags.Ephemeral });
        }

        if (interaction.customId === 'delete_ticket') {
            await interaction.deferUpdate();
            try {
                const messages = await interaction.channel.messages.fetch({ limit: 100 });
                let transcript = `Transcript for ${interaction.channel.name}\n\n`;
                Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp).forEach(msg => { transcript += `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content || '(embed/attachment)'}\n`; });
                
                const transcriptChannel = interaction.client.channels.cache.get(process.env.TICKET_TRANSCRIPTS_CHANNEL_ID);
                if (transcriptChannel) await transcriptChannel.send({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Ticket Transcript').setDescription(`Transcript for ${interaction.channel.name}`).setThumbnail(LOGO_URL).setTimestamp()], files: [{ attachment: Buffer.from(transcript, 'utf-8'), name: `${interaction.channel.name}.txt` }] });
                await interaction.channel.delete('Transcript saved');
            } catch (error) { console.error(error); try { await interaction.channel.delete('Transcript failed'); } catch {} }
        }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'close_ticket_modal') {
        const reason = interaction.fields.getTextInputValue('reason') || 'No reason provided.';
        const creatorId = interaction.channel.topic?.match(/\d{17,19}/)?.[0];
        if (creatorId) await interaction.channel.permissionOverwrites.edit(creatorId, { ViewChannel: false, SendMessages: false });
        
        const reopenBtn = new ButtonBuilder().setCustomId('reopen_ticket').setLabel('Reopen Ticket').setStyle(ButtonStyle.Success);
        const deleteBtn = new ButtonBuilder().setCustomId('delete_ticket').setLabel('Delete Permanently').setStyle(ButtonStyle.Danger);
        await interaction.channel.send({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Ticket Closed').setDescription(`Closed by <@${interaction.user.id}> (${interaction.user.username}, ${interaction.user.id})\n**Reason:** ${reason}`).setThumbnail(LOGO_URL).setTimestamp()], components: [new ActionRowBuilder().addComponents(reopenBtn, deleteBtn)] });
        
        try {
            await interaction.user.send({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Ticket Closed').setDescription(`Reason: ${reason}`).setThumbnail(LOGO_URL)] });
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Success').setDescription('Confirmation sent to DMs.').setThumbnail(LOGO_URL)], flags: MessageFlags.Ephemeral });
        } catch {
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Ticket Closed').setDescription('Ticket closed.').setThumbnail(LOGO_URL)], flags: MessageFlags.Ephemeral });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);

// API HTTP POUR ROBLOX ET HEALTH CHECK
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

function verifyRobloxKey(req, res, next) {
    if (req.headers['x-roblox-key'] !== process.env.ROBLOX_API_KEY) return res.status(401).json({ error: 'Invalid API key' });
    next();
}

app.get('/', (req, res) => res.status(200).send('Jaxdrax Studio Bot is running smoothly'));

app.post('/api/check-member', verifyRobloxKey, async (req, res) => {
    try {
        const { discordId, guildId } = req.body;
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.json({ isMember: false });
        try { await guild.members.fetch(discordId); res.json({ isMember: true }); } catch { res.json({ isMember: false }); }
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/give-vip', verifyRobloxKey, async (req, res) => {
    try {
        const { discordId, guildId } = req.body;
        const guild = client.guilds.cache.get(guildId);
        const vipRole = guild.roles.cache.find(r => r.name === 'VIP');
        const member = await guild.members.fetch(discordId);
        await member.roles.add(vipRole);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/stats', verifyRobloxKey, (req, res) => {
    const guild = client.guilds.cache.first();
    if (!guild) return res.status(404).json({ error: 'No guild found' });
    res.json({ memberCount: guild.memberCount, onlineCount: guild.members.cache.filter(m => m.presence?.status === 'online').size, botOnline: true });
});

app.listen(PORT, () => console.log(`API and health check server running on port ${PORT}`));
