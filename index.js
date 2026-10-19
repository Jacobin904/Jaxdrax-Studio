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

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

const staffRoles = ['Game Direction', 'Admin', 'Moderator', 'Developer'];

const COLORS = {
    light: '#fbf7f7',
    gray: '#a49f9e',
    red: '#cf0d0e',
    darkRed: '#6c0b0d',
    dark: '#242120'
};

const LOGO_URL = 'https://media.discordapp.net/attachments/1561478676850151638/1561543957790330900/q1401r6.png?ex=6ad6bca3&is=6ad56b23&hm=e061b0defbc9b679db94772c199cdb7e9599ceefdbf1b7107430e2a99ffe8991&animated=true';

async function sendDevLog(embed) {
    const channelId = process.env.DEV_LOGS_CHANNEL_ID;
    if (!channelId) return;
    const channel = client.channels.cache.get(channelId);
    if (channel) {
        try { await channel.send({ embeds: [embed] }); } catch (error) {}
    }
}

const originalConsoleError = console.error;
console.error = function(...args) {
    originalConsoleError.apply(console, args);
    const errorEmbed = new EmbedBuilder()
        .setColor(COLORS.darkRed)
        .setTitle('Bot Error Detected')
        .setDescription('```' + args.join(' ').substring(0, 2000) + '```')
        .setThumbnail(LOGO_URL)
        .setTimestamp();
    sendDevLog(errorEmbed);
};

client.once(Events.ClientReady, (c) => {
    originalConsoleError(`Bot is online as ${c.user.tag}`);
    const startupEmbed = new EmbedBuilder()
        .setColor(COLORS.dark)
        .setTitle('Bot Online')
        .setDescription(`Jaxdrax Studio Bot is now online and connected as ${c.user.tag}. Monitoring all channels.`)
        .setThumbnail(LOGO_URL)
        .setFooter({ text: 'Jaxdrax Studio', iconURL: LOGO_URL })
        .setTimestamp();
    sendDevLog(startupEmbed);
});

client.on(Events.GuildMemberAdd, async (member) => {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    const roleId = process.env.MEMBER_ROLE_ID;
    const channel = member.guild.channels.cache.get(channelId);

    if (channel) {
        const welcomeEmbed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Welcome to Your Fish Life')
            .setDescription(`Hello <@${member.user.id}>\n\nName: ${member.user.username}\nID: ${member.user.id}\n\nWelcome to the official Jaxdrax Studio server. Please read the rules in the rules channel and enjoy your stay.`)
            .setThumbnail(member.user.displayAvatarURL())
            .setFooter({ text: 'Jaxdrax Studio', iconURL: LOGO_URL })
            .setTimestamp();
        await channel.send({ embeds: [welcomeEmbed] });
    }

    if (roleId) {
        try { await member.roles.add(roleId); } catch (error) { console.error('Failed to add role:', error); }
    }
    
    const joinEmbed = new EmbedBuilder()
        .setColor(COLORS.dark)
        .setTitle('Member Joined')
        .setDescription(`<@${member.user.id}>\nName: ${member.user.username}\nID: ${member.user.id}\nAction: Joined the server.`)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();
    sendDevLog(joinEmbed);
});

client.on(Events.GuildMemberRemove, (member) => {
    const leaveEmbed = new EmbedBuilder()
        .setColor(COLORS.red)
        .setTitle('Member Left')
        .setDescription(`<@${member.user.id}>\nName: ${member.user.username}\nID: ${member.user.id}\nAction: Left the server or was banned.`)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();
    sendDevLog(leaveEmbed);
});

client.on(Events.MessageDelete, (message) => {
    if (message.author.bot || !message.guild) return;
    const deleteEmbed = new EmbedBuilder()
        .setColor(COLORS.gray)
        .setTitle('Message Deleted')
        .setDescription(`Author: <@${message.author.id}>\nName: ${message.author.username}\nID: ${message.author.id}\nChannel: <#${message.channel.id}>`)
        .addFields({ name: 'Content', value: message.content || 'No text content' })
        .setTimestamp();
    sendDevLog(deleteEmbed);
});

client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
    if (oldMessage.author.bot || !oldMessage.guild || oldMessage.content === newMessage.content) return;
    const editEmbed = new EmbedBuilder()
        .setColor(COLORS.gray)
        .setTitle('Message Edited')
        .setDescription(`Author: <@${oldMessage.author.id}>\nName: ${oldMessage.author.username}\nID: ${oldMessage.author.id}\nChannel: <#${oldMessage.channel.id}>`)
        .addFields(
            { name: 'Before', value: oldMessage.content || 'No text content' },
            { name: 'After', value: newMessage.content || 'No text content' }
        )
        .setTimestamp();
    sendDevLog(editEmbed);
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;
    const isStaff = message.member.roles.cache.some(role => staffRoles.includes(role.name));

    if (message.content === '!ping') {
        const pingEmbed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Bot Latency')
            .setDescription(`Pong! Bot latency is ${Date.now() - message.createdTimestamp}ms.`)
            .setThumbnail(LOGO_URL)
            .setTimestamp();
        await message.reply({ embeds: [pingEmbed] });
    }

    if (message.content === '!rules') {
        if (isStaff) {
            const fullRulesEmbed = new EmbedBuilder()
                .setColor(COLORS.darkRed)
                .setTitle('Complete Server Rules')
                .setDescription('Official regulations for the Your Fish Life community. All members must comply.')
                .addFields(
                    { name: '1. Respect Everyone', value: 'Treat all members and staff with respect. Harassment, hate speech, or discrimination of any kind will result in an immediate ban.' },
                    { name: '2. No Spam or Self Promotion', value: 'Do not spam messages, excessive caps, or advertise other Discord servers, Roblox games, or external links without explicit permission.' },
                    { name: '3. Keep Channels Organized', value: 'Post content in the appropriate channels. Use bug-reports for technical issues, suggestions for game ideas, and general-chat for casual conversation.' },
                    { name: '4. No Exploits or Cheating', value: 'Discussing, sharing, or promoting exploits, cheats, or game-breaking glitches is strictly forbidden and will result in a permanent ban.' },
                    { name: '5. Follow Discord Terms of Service', value: 'All users must comply with the official Discord Community Guidelines and Terms of Service at all times.' },
                    { name: '6. Staff Decisions are Final', value: 'If you disagree with a moderation action, please open a ticket. Do not argue with staff members in public channels.' }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Management' })
                .setTimestamp();
            await message.channel.send({ embeds: [fullRulesEmbed] });
        } else {
            const basicRulesEmbed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Server Rules')
                .setDescription('Please make sure to read and follow all rules in the rules channel. Failure to comply may result in a mute or ban.')
                .setThumbnail(LOGO_URL)
                .setTimestamp();
            await message.reply({ embeds: [basicRulesEmbed] });
        }
    }

    if (message.content === '!info') {
        if (isStaff) {
            const fullInfoEmbed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Your Fish Life - Complete Game Information')
                .setDescription('Comprehensive details regarding the development and status of the Your Fish Life Roblox experience.')
                .addFields(
                    { name: 'Developer', value: 'Jaxdrax Studio' },
                    { name: 'Current Status', value: 'Active Development' },
                    { name: 'Core Features', value: 'Aquarium building, fish species discovery, community relaxation, and regular content updates.' },
                    { name: 'Support', value: 'Use the !ticket command or visit the help-desk channel for assistance.' }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Development Team' })
                .setTimestamp();
            await message.channel.send({ embeds: [fullInfoEmbed] });
        } else {
            const basicInfoEmbed = new EmbedBuilder()
                .setColor(COLORS.gray)
                .setTitle('Your Fish Life - Game Info')
                .setDescription('Your Fish Life is an upcoming Roblox experience developed by Jaxdrax Studio.')
                .addFields(
                    { name: 'Developer', value: 'Jaxdrax Studio' },
                    { name: 'Status', value: 'Currently in Development' }
                )
                .setThumbnail(LOGO_URL)
                .setTimestamp();
            await message.reply({ embeds: [basicInfoEmbed] });
        }
    }

    if (message.content === '!ticket') {
        if (isStaff) {
            const ticketPanelEmbed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Support Ticket System')
                .setDescription('Welcome to the official support system. If you need assistance from the Jaxdrax Studio team, please click the button below to open a private ticket channel.')
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Your Fish Life Support' })
                .setTimestamp();
            
            const button = new ButtonBuilder()
                .setCustomId('open_ticket')
                .setLabel('Open Ticket')
                .setStyle(ButtonStyle.Primary);
            
            const row = new ActionRowBuilder().addComponents(button);
            await message.channel.send({ embeds: [ticketPanelEmbed], components: [row] });
        } else {
            const instructionEmbed = new EmbedBuilder()
                .setColor(COLORS.gray)
                .setTitle('Ticket Instructions')
                .setDescription('Please use the Open Ticket button in the designated support channel to create a ticket.')
                .setThumbnail(LOGO_URL)
                .setTimestamp();
            await message.reply({ embeds: [instructionEmbed] });
        }
    }

    if (message.content === '!help') {
        const helpEmbed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Jaxdrax Studio Bot - Help Menu')
            .addFields(
                { name: '!ping', value: 'Check bot latency.' },
                { name: '!rules', value: 'View server rules.' },
                { name: '!info', value: 'Game information.' },
                { name: '!ticket', value: 'Display the ticket panel (Staff) or get instructions (Members).' }
            )
            .setThumbnail(LOGO_URL)
            .setTimestamp();
        await message.reply({ embeds: [helpEmbed] });
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'open_ticket') {
            const ticketChannelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
            const existingChannel = interaction.guild.channels.cache.find(c => c.name === ticketChannelName);
            
            if (existingChannel) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.red)
                    .setTitle('Ticket Already Open')
                    .setDescription('You already have an open ticket. Please check your channel list on the left.')
                    .setThumbnail(LOGO_URL);
                return interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
            }

            const modRole = interaction.guild.roles.cache.find(r => r.name === 'Moderator');
            const adminRole = interaction.guild.roles.cache.find(r => r.name === 'Admin');
            const gdRole = interaction.guild.roles.cache.find(r => r.name === 'Game Direction');

            const permissionOverwrites = [
                { id: interaction.guild.id, deny: ['ViewChannel'] },
                { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }
            ];
            if (modRole) permissionOverwrites.push({ id: modRole.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] });
            if (adminRole) permissionOverwrites.push({ id: adminRole.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] });
            if (gdRole) permissionOverwrites.push({ id: gdRole.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] });

            try {
                const newChannel = await interaction.guild.channels.create({
                    name: ticketChannelName,
                    type: ChannelType.GuildText,
                    parent: interaction.channel.parentId,
                    topic: `Ticket created by ${interaction.user.id}`,
                    permissionOverwrites: permissionOverwrites,
                    reason: `Support ticket created by ${interaction.user.tag}`
                });

                const welcomeEmbed = new EmbedBuilder()
                    .setColor(COLORS.dark)
                    .setTitle('Support Ticket Opened')
                    .setDescription(`Hello <@${interaction.user.id}>\nName: ${interaction.user.username}\nID: ${interaction.user.id}\n\nA staff member will assist you shortly. Please describe your issue in detail.`)
                    .setThumbnail(LOGO_URL)
                    .setTimestamp();
                
                const closeBtn = new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Danger);
                const row = new ActionRowBuilder().addComponents(closeBtn);
                
                await newChannel.send({ content: `<@${interaction.user.id}>`, embeds: [welcomeEmbed], components: [row] });

                const dmEmbed = new EmbedBuilder()
                    .setColor(COLORS.dark)
                    .setTitle('Ticket Created')
                    .setDescription(`Your ticket has been created: ${newChannel}`)
                    .setThumbnail(LOGO_URL);

                try {
                    await interaction.user.send({ embeds: [dmEmbed] });
                    const successEmbed = new EmbedBuilder()
                        .setColor(COLORS.dark)
                        .setTitle('Success')
                        .setDescription('Your ticket has been created. A confirmation was sent to your DMs.')
                        .setThumbnail(LOGO_URL);
                    await interaction.reply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });
                } catch (dmError) {
                    const fallbackEmbed = new EmbedBuilder()
                        .setColor(COLORS.dark)
                        .setTitle('Ticket Created')
                        .setDescription(`Your ticket has been created: ${newChannel}`)
                        .setThumbnail(LOGO_URL);
                    await interaction.reply({ embeds: [fallbackEmbed], flags: MessageFlags.Ephemeral });
                }
            } catch (error) {
                console.error('Failed to create ticket channel:', error);
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.red)
                    .setTitle('Error')
                    .setDescription('An error occurred while creating the ticket.')
                    .setThumbnail(LOGO_URL);
                await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
            }
        }

        if (interaction.customId === 'close_ticket') {
            const modal = new ModalBuilder()
                .setCustomId('close_ticket_modal')
                .setTitle('Close Ticket');
            
            const reasonInput = new TextInputBuilder()
                .setCustomId('reason')
                .setLabel('Reason for closing (optional)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false);
            
            const row = new ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(row);
            await interaction.showModal(modal);
        }

        if (interaction.customId === 'reopen_ticket') {
            const creatorId = interaction.channel.topic?.match(/\d{17,19}/)?.[0];
            if (creatorId) {
                await interaction.channel.permissionOverwrites.edit(creatorId, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true
                });
            }
            
            const reopenEmbed = new EmbedBuilder()
                .setColor(COLORS.gray)
                .setTitle('Ticket Reopened')
                .setDescription(`This ticket has been reopened by <@${interaction.user.id}>\nName: ${interaction.user.username}\nID: ${interaction.user.id}`)
                .setThumbnail(LOGO_URL)
                .setTimestamp();
                
            const closeBtn = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Close Ticket')
                .setStyle(ButtonStyle.Danger);
            const row = new ActionRowBuilder().addComponents(closeBtn);
            
            await interaction.channel.send({ embeds: [reopenEmbed], components: [row] });
            
            const dmEmbed = new EmbedBuilder()
                .setColor(COLORS.gray)
                .setTitle('Ticket Reopened')
                .setDescription('The ticket has been reopened by a staff member.')
                .setThumbnail(LOGO_URL);

            try {
                await interaction.user.send({ embeds: [dmEmbed] });
                const successEmbed = new EmbedBuilder()
                    .setColor(COLORS.gray)
                    .setTitle('Success')
                    .setDescription('Confirmation sent to your DMs.')
                    .setThumbnail(LOGO_URL);
                await interaction.reply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });
            } catch (dmError) {
                const fallbackEmbed = new EmbedBuilder()
                    .setColor(COLORS.gray)
                    .setTitle('Ticket Reopened')
                    .setDescription('The ticket has been reopened.')
                    .setThumbnail(LOGO_URL);
                await interaction.reply({ embeds: [fallbackEmbed], flags: MessageFlags.Ephemeral });
            }
        }

        if (interaction.customId === 'delete_ticket') {
            await interaction.deferUpdate();
            
            try {
                const messages = await interaction.channel.messages.fetch({ limit: 100 });
                let transcript = `Transcript for ${interaction.channel.name}\n\n`;
                
                const sortedMessages = Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);
                
                for (const msg of sortedMessages) {
                    transcript += `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content || '(embed/attachment)'}\n`;
                }
                
                const transcriptChannelId = process.env.TICKET_TRANSCRIPTS_CHANNEL_ID;
                if (transcriptChannelId) {
                    const transcriptChannel = interaction.client.channels.cache.get(transcriptChannelId);
                    if (transcriptChannel) {
                        const buffer = Buffer.from(transcript, 'utf-8');
                        const transcriptEmbed = new EmbedBuilder()
                            .setColor(COLORS.dark)
                            .setTitle('Ticket Transcript')
                            .setDescription(`Transcript for ${interaction.channel.name}`)
                            .setThumbnail(LOGO_URL)
                            .setTimestamp();
                        await transcriptChannel.send({ 
                            embeds: [transcriptEmbed],
                            files: [{ attachment: buffer, name: `${interaction.channel.name}.txt` }] 
                        });
                    } else {
                        console.error('Transcript channel not found in cache.');
                    }
                } else {
                    console.error('TICKET_TRANSCRIPTS_CHANNEL_ID is not set in environment variables.');
                }
                
                await interaction.channel.delete('Ticket closed and transcript saved');
            } catch (error) {
                console.error('Error during ticket deletion:', error);
                try {
                    await interaction.channel.delete('Ticket closed (transcript failed)');
                } catch (deleteError) {
                    console.error('Failed to delete channel:', deleteError);
                }
            }
        }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'close_ticket_modal') {
        const reason = interaction.fields.getTextInputValue('reason') || 'No reason provided.';
        
        const creatorId = interaction.channel.topic?.match(/\d{17,19}/)?.[0];
        if (creatorId) {
            await interaction.channel.permissionOverwrites.edit(creatorId, {
                ViewChannel: false,
                SendMessages: false
            });
        }
        
        const closeEmbed = new EmbedBuilder()
            .setColor(COLORS.red)
            .setTitle('Ticket Closed')
            .setDescription(`This ticket has been closed by <@${interaction.user.id}>\nName: ${interaction.user.username}\nID: ${interaction.user.id}`)
            .addFields({ name: 'Reason', value: reason })
            .setThumbnail(LOGO_URL)
            .setTimestamp();
            
        const reopenBtn = new ButtonBuilder()
            .setCustomId('reopen_ticket')
            .setLabel('Reopen Ticket')
            .setStyle(ButtonStyle.Success);
        const deleteBtn = new ButtonBuilder()
            .setCustomId('delete_ticket')
            .setLabel('Delete Permanently')
            .setStyle(ButtonStyle.Danger);
        const row = new ActionRowBuilder().addComponents(reopenBtn, deleteBtn);
        
        await interaction.channel.send({ embeds: [closeEmbed], components: [row] });
        
        const dmEmbed = new EmbedBuilder()
            .setColor(COLORS.red)
            .setTitle('Ticket Closed')
            .setDescription(`The ticket has been closed successfully.\nReason: ${reason}`)
            .setThumbnail(LOGO_URL);

        try {
            await interaction.user.send({ embeds: [dmEmbed] });
            const successEmbed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Success')
                .setDescription('Confirmation sent to your DMs.')
                .setThumbnail(LOGO_URL);
            await interaction.reply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });
        } catch (dmError) {
            const fallbackEmbed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Ticket Closed')
                .setDescription('The ticket has been closed successfully.')
                .setThumbnail(LOGO_URL);
            await interaction.reply({ embeds: [fallbackEmbed], flags: MessageFlags.Ephemeral });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
