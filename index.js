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
    sendDevLog(new EmbedBuilder()
        .setColor(COLORS.dark)
        .setTitle('Bot Online - System Initialized')
        .setDescription('The Jaxdrax Studio Bot has successfully connected to Discord and is now fully operational.\n\n**Connection Details:**\n• Tag: ' + c.user.tag + '\n• ID: ' + c.user.id + '\n• Servers: ' + client.guilds.cache.size + '\n• Users: ' + client.users.cache.size + '\n\nAll monitoring systems are active and ready to track server events.')
        .setThumbnail(LOGO_URL)
        .setFooter({ text: 'Jaxdrax Studio System Monitor', iconURL: LOGO_URL })
        .setTimestamp()
    );
});

// Logs serveur
client.on(Events.GuildMemberAdd, async (member) => {
    const channel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
    if (channel) {
        const accountCreationDate = Math.floor(member.user.createdTimestamp / 1000);
        await channel.send({ embeds: [new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Welcome to Your Fish Life!')
            .setDescription('Hello <@' + member.user.id + '> and welcome to the official Jaxdrax Studio Discord server! We are thrilled to have you join our growing community of fish enthusiasts.\n\n**Your Account Details:**\n• Username: ' + member.user.username + '\n• User ID: ' + member.user.id + '\n• Account Created: <t:' + accountCreationDate + ':F> (<t:' + accountCreationDate + ':R>)\n\n**Getting Started:**\n• Please read the rules in the rules channel to ensure a positive experience.\n• Check out the announcements for the latest game updates.\n• Introduce yourself in the general-chat and meet other players!\n\nEnjoy your stay and happy fishing!')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setFooter({ text: 'Jaxdrax Studio Community', iconURL: LOGO_URL })
            .setTimestamp()
        ] });
    }
    if (process.env.MEMBER_ROLE_ID) { try { await member.roles.add(process.env.MEMBER_ROLE_ID); } catch (e) {} }
    sendDevLog(new EmbedBuilder()
        .setColor(COLORS.dark)
        .setTitle('New Member Joined')
        .setDescription('A new member has joined the server.\n\n**Member Details:**\n• Mention: <@' + member.user.id + '>\n• Username: ' + member.user.username + '\n• User ID: ' + member.user.id + '\n• Account Age: <t:' + Math.floor(member.user.createdTimestamp / 1000) + ':R>\n\n**Action Taken:**\n• Automatically assigned the Member role.\n• Welcome message sent to the welcome channel.')
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .setFooter({ text: 'Jaxdrax Studio Security Log', iconURL: LOGO_URL })
        .setTimestamp()
    );
});

client.on(Events.GuildMemberRemove, (member) => {
    sendDevLog(new EmbedBuilder()
        .setColor(COLORS.red)
        .setTitle('Member Left Server')
        .setDescription('A member has left the server or was removed.\n\n**Member Details:**\n• Mention: <@' + member.user.id + '>\n• Username: ' + member.user.username + '\n• User ID: ' + member.user.id + '\n• Account Age: <t:' + Math.floor(member.user.createdTimestamp / 1000) + ':R>\n\n**Possible Reasons:**\n• Voluntary departure\n• Kick by a moderator\n• Ban by a moderator\n\nPlease check the audit log for more details if necessary.')
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .setFooter({ text: 'Jaxdrax Studio Security Log', iconURL: LOGO_URL })
        .setTimestamp()
    );
});

client.on(Events.MessageDelete, (message) => {
    if (message.author.bot || !message.guild) return;
    sendDevLog(new EmbedBuilder()
        .setColor(COLORS.gray)
        .setTitle('Message Deleted')
        .setDescription('A message was deleted from the server.\n\n**Author Details:**\n• Mention: <@' + message.author.id + '>\n• Username: ' + message.author.username + '\n• User ID: ' + message.author.id + '\n\n**Channel Details:**\n• Channel: <#' + message.channel.id + '>\n• Channel ID: ' + message.channel.id + '\n\n**Deleted Content:**\n' + (message.content || '*No text content (embed or attachment)*'))
        .setFooter({ text: 'Jaxdrax Studio Moderation Log', iconURL: LOGO_URL })
        .setTimestamp()
    );
});

client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
    if (oldMessage.author.bot || !oldMessage.guild || oldMessage.content === newMessage.content) return;
    sendDevLog(new EmbedBuilder()
        .setColor(COLORS.gray)
        .setTitle('Message Edited')
        .setDescription('A message was edited by a user.\n\n**Author Details:**\n• Mention: <@' + oldMessage.author.id + '>\n• Username: ' + oldMessage.author.username + '\n• User ID: ' + oldMessage.author.id + '\n\n**Channel Details:**\n• Channel: <#' + oldMessage.channel.id + '>\n• Channel ID: ' + oldMessage.channel.id + '\n\n**Original Content:**\n' + (oldMessage.content || '*No text content*') + '\n\n**New Content:**\n' + (newMessage.content || '*No text content*'))
        .setFooter({ text: 'Jaxdrax Studio Moderation Log', iconURL: LOGO_URL })
        .setTimestamp()
    );
});

// Commandes
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;
    const isStaff = message.member.roles.cache.some(role => staffRoles.includes(role.name));

    if (message.content === '!ping') {
        const uptimeSeconds = Math.floor(client.uptime / 1000);
        const days = Math.floor(uptimeSeconds / 86400);
        const hours = Math.floor((uptimeSeconds % 86400) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        await message.reply({ embeds: [new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Bot Performance & Status')
            .setDescription('Detailed performance metrics and system information for the Jaxdrax Studio Bot.')
            .addFields(
                { name: 'Message Latency', value: Date.now() - message.createdTimestamp + 'ms', inline: true },
                { name: 'WebSocket Latency', value: client.ws.ping + 'ms', inline: true },
                { name: 'Uptime', value: days + 'd ' + hours + 'h ' + minutes + 'm', inline: true },
                { name: 'Memory Usage', value: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB', inline: true },
                { name: 'Node.js Version', value: process.version, inline: true },
                { name: 'Discord.js Version', value: require('discord.js').version, inline: true },
                { name: 'Roblox Players Online', value: robloxPresence.onlinePlayers.toString(), inline: true },
                { name: 'Roblox Server Status', value: robloxPresence.serverStatus, inline: true }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Monitoring System', iconURL: LOGO_URL })
            .setTimestamp()
        ] });
    }

    if (message.content === '!help') {
        await message.reply({ embeds: [new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Jaxdrax Studio Bot - Complete Help Menu')
            .setDescription('Welcome to the official help menu for the Jaxdrax Studio Bot. Below you will find a comprehensive list of all available commands and their functions.\n\n**How to use:** Type the command prefix followed by the command name in any channel where the bot has permission to read messages.')
            .addFields(
                { name: '!ping', value: 'Displays detailed performance metrics including message latency, WebSocket latency, uptime, and memory usage.' },
                { name: '!rules', value: 'Shows the server rules. Staff members see the complete version with detailed sanctions, while regular members see a summary with a link to the full rules.' },
                { name: '!info', value: 'Provides information about Your Fish Life. Staff members get development details and stats, while members get a general overview.' },
                { name: '!ticket', value: 'For staff: displays the ticket panel with a button. For members: shows instructions on how to open a support ticket.' },
                { name: '!config', value: 'Staff only. Sends a complete dump of the server configuration (IDs of all channels, roles, categories) to your DMs.' }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Support', iconURL: LOGO_URL })
            .setTimestamp()
        ] });
    }

    if (message.content === '!config') {
        if (!isStaff) return message.reply({ embeds: [new EmbedBuilder()
            .setColor(COLORS.red)
            .setTitle('Access Denied')
            .setDescription('This command is restricted to staff members only. If you believe you should have access, please contact a server administrator.')
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Security', iconURL: LOGO_URL })
            .setTimestamp()
        ], flags: MessageFlags.Ephemeral });

        const guild = message.guild;
        await message.reply({ embeds: [new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Processing Configuration Dump')
            .setDescription('Gathering comprehensive server configuration data... Please check your DMs for the complete report.')
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Config Tool', iconURL: LOGO_URL })
            .setTimestamp()
        ], flags: MessageFlags.Ephemeral });

        const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).map(c => '`' + c.id + '` - ' + c.name).join('\n') || 'None';
        const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).map(c => '`' + c.id + '` - ' + c.name).join('\n') || 'None';
        const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).map(c => '`' + c.id + '` - ' + c.name).join('\n') || 'None';
        const roles = guild.roles.cache.filter(r => r.name !== '@everyone').sort((a, b) => b.position - a.position).map(r => '`' + r.id + '` - ' + r.name + ' (' + r.hexColor + ')').join('\n') || 'None';

        const configEmbed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Server Configuration Dump - Complete Report')
            .setDescription('Full configuration data for **' + guild.name + '** (ID: `' + guild.id + '`).\n\n**Server Overview:**\n• Total Members: ' + guild.memberCount + '\n• Owner: <@' + guild.ownerId + '>\n• Created: <t:' + Math.floor(guild.createdTimestamp / 1000) + ':F>\n• Boost Level: ' + guild.premiumTier + '\n• Boosts: ' + guild.premiumSubscriptionCount)
            .addFields(
                { name: 'Categories (' + guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size + ')', value: categories.substring(0, 1024) },
                { name: 'Text Channels (' + guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size + ')', value: textChannels.substring(0, 1024) },
                { name: 'Voice Channels (' + guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size + ')', value: voiceChannels.substring(0, 1024) },
                { name: 'Roles (' + (guild.roles.cache.size - 1) + ')', value: roles.substring(0, 1024) }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Config Tool', iconURL: LOGO_URL })
            .setTimestamp();

        try {
            await message.author.send({ embeds: [configEmbed] });
        } catch (error) {
            await message.reply({ embeds: [new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('DM Delivery Failed')
                .setDescription('I could not send you the configuration report via DM. Please ensure that "Allow direct messages from server members" is enabled in your privacy settings for this server.')
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Config Tool', iconURL: LOGO_URL })
                .setTimestamp()
            ], flags: MessageFlags.Ephemeral });
        }
    }

    if (message.content === '!rules') {
        if (isStaff) {
            await message.channel.send({ embeds: [new EmbedBuilder()
                .setColor(COLORS.darkRed)
                .setTitle('Complete Server Rules - Staff Version')
                .setDescription('Official regulations for the Your Fish Life community. All members must comply. Infractions will result in warnings, mutes, or bans depending on severity.')
                .addFields(
                    { name: '1. Respect Everyone', value: 'Treat all members and staff with respect. Harassment, hate speech, or discrimination of any kind will result in an immediate ban.' },
                    { name: '2. No Spam or Self Promotion', value: 'Do not spam messages, excessive caps, or advertise other Discord servers, Roblox games, or external links without explicit permission.' },
                    { name: '3. Keep Channels Organized', value: 'Post content in the appropriate channels. Use bug-reports for technical issues, suggestions for game ideas, and general-chat for casual conversation.' },
                    { name: '4. No Exploits or Cheating', value: 'Discussing, sharing, or promoting exploits, cheats, or game-breaking glitches is strictly forbidden and will result in a permanent ban.' },
                    { name: '5. Follow Discord Terms of Service', value: 'All users must comply with the official Discord Community Guidelines and Terms of Service at all times.' },
                    { name: '6. Staff Decisions are Final', value: 'If you disagree with a moderation action, please open a ticket. Do not argue with staff members in public channels.' }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Management', iconURL: LOGO_URL })
                .setTimestamp()
            ] });
        } else {
            await message.reply({ embeds: [new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Server Rules Summary')
                .setDescription('Welcome to Your Fish Life! To ensure a safe and enjoyable experience for everyone, please adhere to the following core rules. For the complete and detailed regulations, please visit the rules channel.')
                .addFields(
                    { name: '1. Respect Everyone', value: 'Treat all members and staff with respect. Harassment or discrimination is strictly forbidden.' },
                    { name: '2. No Spam or Self-Promotion', value: 'Do not spam messages or advertise other servers/games without permission.' },
                    { name: '3. Keep Channels Organized', value: 'Post content in the appropriate channels to keep discussions relevant.' },
                    { name: '4. No Exploits or Cheating', value: 'Discussing or promoting exploits will result in a permanent ban.' },
                    { name: '5. Follow Discord TOS', value: 'All users must comply with the official Discord Community Guidelines.' },
                    { name: '6. Staff Decisions are Final', value: 'If you disagree with a moderation action, please open a ticket.' }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Management', iconURL: LOGO_URL })
                .setTimestamp()
            ] });
        }
    }

    if (message.content === '!info') {
        if (isStaff) {
            const guild = message.guild;
            await message.channel.send({ embeds: [new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Your Fish Life - Complete Game Information')
                .setDescription('Comprehensive details regarding the development and status of the Your Fish Life Roblox experience.\n\n**Development Status:**\n• Current Phase: Active Development\n• Last Update: Ongoing\n• Next Milestone: Beta Testing')
                .addFields(
                    { name: 'Developer', value: 'Jaxdrax Studio' },
                    { name: 'Core Features', value: 'Aquarium building, fish species discovery, community relaxation, and regular content updates.' },
                    { name: 'Discord Stats', value: 'Members: ' + guild.memberCount + '\nRoles: ' + guild.roles.cache.size + '\nChannels: ' + guild.channels.cache.size },
                    { name: 'Roblox Live Stats', value: 'Players Online: ' + robloxPresence.onlinePlayers + '\nServer Status: ' + robloxPresence.serverStatus },
                    { name: 'Support', value: 'Use the !ticket command or visit the help-desk channel for assistance.' }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Development Team', iconURL: LOGO_URL })
                .setTimestamp()
            ] });
        } else {
            await message.reply({ embeds: [new EmbedBuilder()
                .setColor(COLORS.gray)
                .setTitle('Your Fish Life - Game Info')
                .setDescription('Your Fish Life is an upcoming Roblox experience developed by Jaxdrax Studio. Dive into a relaxing and immersive aquarium building simulation where you can discover new fish species, customize your tanks, and connect with a growing community of players.\n\n**Key Features:**\n• Build and customize your own aquarium\n• Discover and collect new fish species\n• Relaxing gameplay with regular updates\n• Active community and support')
                .addFields(
                    { name: 'Developer', value: 'Jaxdrax Studio' },
                    { name: 'Status', value: 'Currently in Development' },
                    { name: 'Platform', value: 'Roblox (PC, Mobile, Console)' }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio', iconURL: LOGO_URL })
                .setTimestamp()
            ] });
        }
    }

    if (message.content === '!ticket') {
        if (isStaff) {
            const button = new ButtonBuilder().setCustomId('open_ticket').setLabel('Open Ticket').setStyle(ButtonStyle.Primary);
            await message.channel.send({ embeds: [new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Support Ticket System - Official Panel')
                .setDescription('Welcome to the official support system for Your Fish Life. If you need assistance from the Jaxdrax Studio team, please click the button below to open a private ticket channel.\n\n**How it works:**\n• Click the button to create a private channel\n• Only you and the staff team will have access\n• Describe your issue in detail\n• A staff member will assist you shortly\n\nPlease ensure you have read the rules before opening a ticket.')
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                .setTimestamp()
            ], components: [new ActionRowBuilder().addComponents(button)] });
        } else {
            await message.reply({ embeds: [new EmbedBuilder()
                .setColor(COLORS.gray)
                .setTitle('Ticket Instructions')
                .setDescription('To open a support ticket, please use the "Open Ticket" button in the designated support channel (help-desk).\n\n**Before opening a ticket:**\n• Ensure you have read the server rules\n• Check if your issue has already been answered\n• Prepare a detailed description of your problem\n\nTickets are for serious inquiries only. Spam or misuse will result in loss of ticket privileges.')
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                .setTimestamp()
            ] });
        }
    }
});

// Tickets
client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'open_ticket') {
            const ticketChannelName = 'ticket-' + interaction.user.username.toLowerCase().replace(/[^a-z0-9-]/g, '');
            
            if (interaction.guild.channels.cache.find(c => c.name === ticketChannelName)) {
                return interaction.reply({ embeds: [new EmbedBuilder()
                    .setColor(COLORS.red)
                    .setTitle('Ticket Already Open')
                    .setDescription('You already have an open ticket. Please check your channel list on the left. If you need to close it, use the "Close Ticket" button inside the ticket channel.')
                    .setThumbnail(LOGO_URL)
                    .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                    .setTimestamp()
                ], flags: MessageFlags.Ephemeral });
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
                    topic: 'Ticket created by ' + interaction.user.id,
                    permissionOverwrites: permissionOverwrites,
                    reason: 'Support ticket created by ' + interaction.user.tag
                });

                const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger);
                await newChannel.send({ 
                    content: '<@' + interaction.user.id + '>',
                    embeds: [new EmbedBuilder()
                        .setColor(COLORS.dark)
                        .setTitle('Support Ticket Opened')
                        .setDescription('Hello <@' + interaction.user.id + '>, welcome to your private support ticket.\n\n**Ticket Details:**\n• Created by: ' + interaction.user.username + '\n• User ID: ' + interaction.user.id + '\n• Channel: ' + newChannel + '\n• Created: <t:' + Math.floor(Date.now() / 1000) + ':F>\n\n**Next Steps:**\n• Please describe your issue in detail\n• Attach screenshots or videos if applicable\n• A staff member will assist you shortly\n\nThank you for your patience!')
                        .setThumbnail(LOGO_URL)
                        .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                        .setTimestamp()
                    ],
                    components: [new ActionRowBuilder().addComponents(closeBtn)]
                });

                await interaction.reply({ embeds: [new EmbedBuilder()
                    .setColor(COLORS.dark)
                    .setTitle('Ticket Created Successfully')
                    .setDescription('Your support ticket has been created successfully.\n\n**Ticket Details:**\n• Channel: ' + newChannel + '\n• Created: <t:' + Math.floor(Date.now() / 1000) + ':F>\n\nPlease check the channel for further instructions. A staff member will assist you shortly.')
                    .setThumbnail(LOGO_URL)
                    .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                    .setTimestamp()
                ], flags: MessageFlags.Ephemeral });
                
            } catch (error) {
                console.error(error);
                await interaction.reply({ embeds: [new EmbedBuilder()
                    .setColor(COLORS.red)
                    .setTitle('Error Creating Ticket')
                    .setDescription('An error occurred while creating your ticket. Please try again later or contact a staff member directly.')
                    .setThumbnail(LOGO_URL)
                    .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                    .setTimestamp()
                ], flags: MessageFlags.Ephemeral });
            }
        }

        if (interaction.customId === 'close_ticket') {
            const modal = new ModalBuilder().setCustomId('close_ticket_modal').setTitle('Close Ticket');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
                .setCustomId('reason')
                .setLabel('Reason for closing (optional)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false)
                .setPlaceholder('Enter the reason for closing this ticket...')
            ));
            await interaction.showModal(modal);
        }

        if (interaction.customId === 'reopen_ticket') {
            const creatorId = interaction.channel.topic?.match(/\d{17,19}/)?.[0];
            if (creatorId) {
                await interaction.channel.permissionOverwrites.edit(creatorId, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
            }
            
            const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger);
            await interaction.channel.send({ 
                embeds: [new EmbedBuilder()
                    .setColor(COLORS.gray)
                    .setTitle('Ticket Reopened')
                    .setDescription('This ticket has been reopened by a staff member.\n\n**Reopened by:**\n• Mention: <@' + interaction.user.id + '>\n• Username: ' + interaction.user.username + '\n• User ID: ' + interaction.user.id + '\n• Time: <t:' + Math.floor(Date.now() / 1000) + ':F>\n\nThe original creator now has access to this channel again.')
                    .setThumbnail(LOGO_URL)
                    .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                    .setTimestamp()
                ],
                components: [new ActionRowBuilder().addComponents(closeBtn)]
            });
            
            await interaction.reply({ embeds: [new EmbedBuilder()
                .setColor(COLORS.gray)
                .setTitle('Ticket Reopened')
                .setDescription('The ticket has been reopened successfully. The user can now see and interact in this channel.')
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                .setTimestamp()
            ], flags: MessageFlags.Ephemeral });
        }

        if (interaction.customId === 'delete_ticket') {
            await interaction.deferUpdate();
            try {
                const messages = await interaction.channel.messages.fetch({ limit: 100 });
                let transcript = 'Transcript for ' + interaction.channel.name + '\n\n';
                Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp).forEach(msg => { 
                    transcript += '[' + msg.createdAt.toISOString() + '] ' + msg.author.tag + ': ' + (msg.content || '(embed/attachment)') + '\n'; 
                });
                
                const transcriptChannel = interaction.client.channels.cache.get(process.env.TICKET_TRANSCRIPTS_CHANNEL_ID);
                if (transcriptChannel) {
                    await transcriptChannel.send({ 
                        embeds: [new EmbedBuilder()
                            .setColor(COLORS.dark)
                            .setTitle('Ticket Transcript Saved')
                            .setDescription('Transcript for ' + interaction.channel.name + '\n\n**Details:**\n• Channel Name: ' + interaction.channel.name + '\n• Messages Saved: ' + messages.size + '\n• Saved by: <@' + interaction.user.id + '>\n• Time: <t:' + Math.floor(Date.now() / 1000) + ':F>')
                            .setThumbnail(LOGO_URL)
                            .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                            .setTimestamp()
                        ],
                        files: [{ attachment: Buffer.from(transcript, 'utf-8'), name: interaction.channel.name + '.txt' }] 
                    });
                }
                await interaction.channel.delete('Ticket closed and transcript saved');
            } catch (error) {
                console.error(error);
                try { await interaction.channel.delete('Ticket closed (transcript failed)'); } catch {}
            }
        }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'close_ticket_modal') {
        const reason = interaction.fields.getTextInputValue('reason') || 'No reason provided.';
        const creatorId = interaction.channel.topic?.match(/\d{17,19}/)?.[0];
        
        if (creatorId) {
            await interaction.channel.permissionOverwrites.edit(creatorId, { ViewChannel: false, SendMessages: false });
        }
        
        const reopenBtn = new ButtonBuilder().setCustomId('reopen_ticket').setLabel('Reopen Ticket').setStyle(ButtonStyle.Success);
        const deleteBtn = new ButtonBuilder().setCustomId('delete_ticket').setLabel('Delete Permanently').setStyle(ButtonStyle.Danger);
        
        await interaction.channel.send({ 
            embeds: [new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Ticket Closed')
                .setDescription('This ticket has been closed by a staff member.\n\n**Closed by:**\n• Mention: <@' + interaction.user.id + '>\n• Username: ' + interaction.user.username + '\n• User ID: ' + interaction.user.id + '\n• Time: <t:' + Math.floor(Date.now() / 1000) + ':F>\n\n**Reason:**\n' + reason + '\n\n**Options:**\n• Reopen Ticket: Restore access for the original creator\n• Delete Permanently: Save transcript and delete the channel')
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                .setTimestamp()
            ],
            components: [new ActionRowBuilder().addComponents(reopenBtn, deleteBtn)]
        });
        
        await interaction.reply({ embeds: [new EmbedBuilder()
            .setColor(COLORS.red)
            .setTitle('Ticket Closed Successfully')
            .setDescription('The ticket has been closed and the user no longer has access to this channel.\n\n**Reason:**\n' + reason + '\n\nYou can reopen the ticket or delete it permanently using the buttons below.')
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
            .setTimestamp()
        ], flags: MessageFlags.Ephemeral });
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

app.get('/', (req, res) => res.status(200).send('Jaxdrax Studio Bot is running smoothly'));

app.post('/api/update-presence', verifyRobloxKey, (req, res) => {
    try {
        const { onlinePlayers, totalPlayers, serverStatus } = req.body;
        robloxPresence = { onlinePlayers: onlinePlayers || 0, totalPlayers: totalPlayers || 0, serverStatus: serverStatus || 'Unknown' };
        updateBotPresence();
        res.json({ success: true, message: 'Presence updated', data: robloxPresence });
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

app.post('/api/give-vip', verifyRobloxKey, async (req, res) => {
    try {
        const { discordId, guildId } = req.body;
        const guild = client.guilds.cache.get(guildId);
        const vipRole = guild.roles.cache.find(r => r.name === 'VIP');
        const member = await guild.members.fetch(discordId);
        await member.roles.add(vipRole);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/stats', verifyRobloxKey, (req, res) => {
    const guild = client.guilds.cache.first();
    if (!guild) return res.status(404).json({ error: 'No guild found' });
    res.json({ 
        memberCount: guild.memberCount, 
        onlineCount: guild.members.cache.filter(m => m.presence?.status === 'online').size, 
        botOnline: true,
        robloxPresence: robloxPresence
    });
});

app.listen(PORT, () => console.log('API and health check server running on port ' + PORT));
