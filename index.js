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
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions
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
        try { 
            await channel.send({ embeds: [embed] }); 
        } catch (error) {
            console.error('Error sending dev log:', error);
        }
    }
}

// ==========================================================
// GESTION DYNAMIQUE DU STATUT DU BOT (TOUJOURS EN STREAMING)
// ==========================================================
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
    console.log(`✅ Bot is online as ${c.user.tag}`);
    console.log(`✅ Guilds: ${client.guilds.cache.size}`);
    console.log(`✅ Users: ${client.users.cache.size}`);
    updateBotPresence();
    sendDevLog(new EmbedBuilder().setColor(COLORS.dark).setTitle('Bot Online - System Initialized').setDescription(`The Jaxdrax Studio Bot has successfully connected to Discord and is now fully operational.\n\n**Connection Details:**\n• Tag: ${c.user.tag}\n• ID: ${c.user.id}\n• Servers: ${client.guilds.cache.size}\n• Users: ${client.users.cache.size}\n\nAll monitoring systems are active and ready to track server events.`).setThumbnail(LOGO_URL).setFooter({ text: 'Jaxdrax Studio System Monitor', iconURL: LOGO_URL }).setTimestamp());
});

// ==========================================================
// SYSTÈME DE TICKET VIA DM
// ==========================================================

const dmTickets = new Map();

function getDMTicketChannel(userId, guild) {
    const channelId = dmTickets.get(userId);
    if (channelId) {
        const channel = guild.channels.cache.get(channelId);
        if (channel) return channel;
    }
    
    const user = client.users.cache.get(userId);
    if (!user) return null;
    
    const ticketChannelName = `ticket-${user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
    return guild.channels.cache.find(c => 
        c.name === ticketChannelName && 
        c.topic?.startsWith(`DM Ticket for ${userId}`)
    );
}

// Écouter TOUS les messages
client.on(Events.MessageCreate, async (message) => {
    // Log pour débogage
    console.log(`📨 Message received from ${message.author.tag} in ${message.channel.type}`);
    
    if (message.author.bot) {
        console.log('⏭️ Ignoring bot message');
        return;
    }
    
    // Gérer les messages en DM
    if (message.channel.type === ChannelType.DM) {
        console.log(`🔔 DM received from ${message.author.tag}`);
        
        const user = message.author;
        const guild = client.guilds.cache.first();
        
        if (!guild) {
            console.error('❌ No guild found');
            return;
        }
        
        console.log(`✅ Guild found: ${guild.name}`);
        
        // Vérifier si l'utilisateur a déjà un ticket ouvert
        const existingTicket = getDMTicketChannel(user.id, guild);
        console.log(`🔍 Existing ticket: ${existingTicket ? existingTicket.name : 'None'}`);
        
        if (existingTicket) {
            // Ticket déjà ouvert, relayer le message
            try {
                console.log('📤 Relaying message to ticket channel');
                
                const messageEmbed = new EmbedBuilder()
                    .setColor(COLORS.dark)
                    .setAuthor({ name: `${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true, size: 1024 }) })
                    .setDescription(message.content || '*No text content*')
                    .setFooter({ text: `User ID: ${user.id}` })
                    .setTimestamp();
                
                if (message.attachments.size > 0) {
                    const attachments = message.attachments.map(a => `[${a.name}](${a.url})`).join('\n');
                    messageEmbed.addFields({ name: 'Attachments', value: attachments });
                }
                
                const replyButton = new ButtonBuilder()
                    .setCustomId(`dm_reply_${user.id}`)
                    .setLabel('Reply')
                    .setStyle(ButtonStyle.Primary);
                
                const closeButton = new ButtonBuilder()
                    .setCustomId(`dm_close_${user.id}`)
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Danger);
                
                const row = new ActionRowBuilder().addComponents(replyButton, closeButton);
                
                await existingTicket.send({ 
                    embeds: [messageEmbed], 
                    components: [row] 
                });
                
                console.log('✅ Message relayed successfully');
                
                try {
                    await message.react('✅');
                    console.log('✅ Reaction added');
                } catch (reactError) {
                    console.error('❌ Could not add reaction:', reactError.message);
                }
                
            } catch (error) {
                console.error('❌ Error relaying DM message:', error);
                try {
                    await message.reply({ 
                        embeds: [new EmbedBuilder()
                            .setColor(COLORS.red)
                            .setTitle('Error')
                            .setDescription('An error occurred while processing your message.')
                            .setTimestamp()]
                    });
                } catch (replyError) {
                    console.error('❌ Could not send error message:', replyError);
                }
            }
        } else {
            // Pas de ticket ouvert, demander confirmation
            console.log('🆕 No existing ticket, showing confirmation');
            
            try {
                const confirmEmbed = new EmbedBuilder()
                    .setColor(COLORS.dark)
                    .setTitle('DM Support System')
                    .setDescription(`Hello <@${user.id}>, welcome to the Jaxdrax Studio support system.\n\nWould you like to open a private support ticket? A staff member will assist you shortly.\n\n**What happens next:**\n• A private channel will be created on the server\n• Only you and the staff team will have access\n• You can continue this conversation via DM\n• All messages will be relayed securely`)
                    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
                    .setFooter({ text: 'Jaxdrax Studio Support', iconURL: LOGO_URL })
                    .setTimestamp();
                
                const openButton = new ButtonBuilder()
                    .setCustomId(`dm_open_${user.id}`)
                    .setLabel('Open Ticket')
                    .setStyle(ButtonStyle.Success);
                
                const cancelButton = new ButtonBuilder()
                    .setCustomId(`dm_cancel_${user.id}`)
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary);
                
                const row = new ActionRowBuilder().addComponents(openButton, cancelButton);
                
                await message.reply({ 
                    embeds: [confirmEmbed], 
                    components: [row] 
                });
                
                console.log('✅ Confirmation message sent');
                
            } catch (error) {
                console.error('❌ Error sending confirmation:', error);
            }
        }
        
        return;
    }
    
    // Gérer les messages du staff dans les salons de tickets DM
    if (message.guild && message.channel.topic?.startsWith('DM Ticket for ')) {
        const userId = message.channel.topic.replace('DM Ticket for ', '');
        const isStaff = message.member.roles.cache.some(role => staffRoles.includes(role.name));
        
        if (isStaff && !message.author.bot) {
            try {
                const user = await client.users.fetch(userId);
                
                const replyEmbed = new EmbedBuilder()
                    .setColor(COLORS.gray)
                    .setAuthor({ name: `${message.author.tag} (Staff)`, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 1024 }) })
                    .setDescription(message.content || '*No text content*')
                    .setFooter({ text: 'Staff Response' })
                    .setTimestamp();
                
                if (message.attachments.size > 0) {
                    const attachments = message.attachments.map(a => `[${a.name}](${a.url})`).join('\n');
                    replyEmbed.addFields({ name: 'Attachments', value: attachments });
                }
                
                await user.send({ embeds: [replyEmbed] });
                
            } catch (error) {
                console.error('Error sending staff reply to user:', error);
                await message.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('Error')
                        .setDescription('Failed to send message to user. They may have DMs disabled.')
                        .setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            }
        }
        
        return;
    }
    
    // Gérer les commandes normales dans les salons du serveur
    if (!message.guild) return;
    const isStaff = message.member.roles.cache.some(role => staffRoles.includes(role.name));

    if (message.content === '!ping') {
        const uptimeSeconds = Math.floor(client.uptime / 1000);
        const days = Math.floor(uptimeSeconds / 86400);
        const hours = Math.floor((uptimeSeconds % 86400) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Bot Performance & Status').setDescription('Detailed performance metrics and system information for the Jaxdrax Studio Bot.').addFields({ name: 'Message Latency', value: `${Date.now() - message.createdTimestamp}ms`, inline: true }, { name: 'WebSocket Latency', value: `${client.ws.ping}ms`, inline: true }, { name: 'Uptime', value: `${days}d ${hours}h ${minutes}m`, inline: true }, { name: 'Memory Usage', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true }, { name: 'Node.js Version', value: process.version, inline: true }, { name: 'Discord.js Version', value: require('discord.js').version, inline: true }, { name: 'Roblox Players Online', value: `${robloxPresence.onlinePlayers}`, inline: true }, { name: 'Roblox Server Status', value: robloxPresence.serverStatus, inline: true }).setThumbnail(LOGO_URL).setFooter({ text: 'Jaxdrax Studio Monitoring System', iconURL: LOGO_URL }).setTimestamp()] });
    }

    if (message.content === '!help') {
        await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Jaxdrax Studio Bot - Complete Help Menu').setDescription('Welcome to the official help menu for the Jaxdrax Studio Bot.\n\n**DM Support:** You can contact the support team by sending a direct message to the bot. A private ticket will be created automatically.').addFields({ name: '!ping', value: 'Displays detailed performance metrics.' }, { name: '!rules', value: 'Shows the server rules.' }, { name: '!info', value: 'Provides information about Your Fish Life.' }, { name: '!config', value: 'Staff only. Sends full server configuration to your DMs.' }, { name: 'Direct Messages', value: 'Send a DM to the bot to open a private support ticket.' }).setThumbnail(LOGO_URL).setFooter({ text: 'Jaxdrax Studio Support', iconURL: LOGO_URL }).setTimestamp()] });
    }

    if (message.content === '!config') {
        if (!isStaff) return message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Access Denied').setDescription('This command is restricted to staff members only.').setThumbnail(LOGO_URL).setTimestamp()], flags: MessageFlags.Ephemeral });

        const guild = message.guild;
        await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Processing Configuration Dump').setDescription('Gathering comprehensive server configuration data... Please check your DMs.').setThumbnail(LOGO_URL).setTimestamp()], flags: MessageFlags.Ephemeral });

        const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).map(c => `\`${c.id}\` - ${c.name}`).join('\n') || 'None';
        const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).map(c => `\`${c.id}\` - ${c.name}`).join('\n') || 'None';
        const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).map(c => `\`${c.id}\` - ${c.name}`).join('\n') || 'None';
        const roles = guild.roles.cache.filter(r => r.name !== '@everyone').sort((a, b) => b.position - a.position).map(r => `\`${r.id}\` - ${r.name} (${r.hexColor})`).join('\n') || 'None';

        const configEmbed = new EmbedBuilder().setColor(COLORS.dark).setTitle('Server Configuration Dump - Complete Report').setDescription(`Full configuration data for **${guild.name}** (ID: \`${guild.id}\`).\n\n**Server Overview:**\n• Total Members: ${guild.memberCount}\n• Owner: <@${guild.ownerId}>\n• Created: <t:${Math.floor(guild.createdTimestamp / 1000)}:F>\n• Boost Level: ${guild.premiumTier}\n• Boosts: ${guild.premiumSubscriptionCount}`).addFields({ name: `Categories (${guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size})`, value: categories.substring(0, 1024) }, { name: `Text Channels (${guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size})`, value: textChannels.substring(0, 1024) }, { name: `Voice Channels (${guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size})`, value: voiceChannels.substring(0, 1024) }, { name: `Roles (${guild.roles.cache.size - 1})`, value: roles.substring(0, 1024) }).setThumbnail(LOGO_URL).setFooter({ text: 'Jaxdrax Studio Config Tool', iconURL: LOGO_URL }).setTimestamp();

        try {
            await message.author.send({ embeds: [configEmbed] });
        } catch (error) {
            await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('DM Delivery Failed').setDescription('I could not send you the configuration report via DM.').setThumbnail(LOGO_URL).setTimestamp()], flags: MessageFlags.Ephemeral });
        }
    }

    if (message.content === '!rules') {
        if (isStaff) {
            await message.channel.send({ embeds: [new EmbedBuilder().setColor(COLORS.darkRed).setTitle('Complete Server Rules - Staff Version').setDescription('Official regulations for the Your Fish Life community.').addFields({ name: '1. Respect Everyone', value: 'Treat all members and staff with respect.' }, { name: '2. No Spam or Self Promotion', value: 'Do not spam messages or advertise without permission.' }, { name: '3. Keep Channels Organized', value: 'Post content in the appropriate channels.' }, { name: '4. No Exploits or Cheating', value: 'Discussing exploits will result in a permanent ban.' }, { name: '5. Follow Discord TOS', value: 'All users must comply with Discord guidelines.' }, { name: '6. Staff Decisions are Final', value: 'Open a ticket to appeal moderation actions.' }).setThumbnail(LOGO_URL).setFooter({ text: 'Jaxdrax Studio Management', iconURL: LOGO_URL }).setTimestamp()] });
        } else {
            await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Server Rules Summary').setDescription('Please read the rules channel for the full regulations.').setThumbnail(LOGO_URL).setTimestamp()] });
        }
    }

    if (message.content === '!info') {
        if (isStaff) {
            const guild = message.guild;
            await message.channel.send({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Your Fish Life - Complete Game Information').setDescription('Comprehensive details regarding the development of Your Fish Life.').addFields({ name: 'Developer', value: 'Jaxdrax Studio' }, { name: 'Core Features', value: 'Aquarium building, fish species discovery, community relaxation.' }, { name: 'Discord Stats', value: `Members: ${guild.memberCount}\nRoles: ${guild.roles.cache.size}\nChannels: ${guild.channels.cache.size}` }, { name: 'Roblox Live Stats', value: `Players Online: ${robloxPresence.onlinePlayers}\nServer Status: ${robloxPresence.serverStatus}` }, { name: 'Support', value: 'Send a DM to the bot for assistance.' }).setThumbnail(LOGO_URL).setFooter({ text: 'Jaxdrax Studio Development Team', iconURL: LOGO_URL }).setTimestamp()] });
        } else {
            await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.gray).setTitle('Your Fish Life - Game Info').setDescription('Your Fish Life is an upcoming Roblox experience developed by Jaxdrax Studio.').addFields({ name: 'Developer', value: 'Jaxdrax Studio' }, { name: 'Status', value: 'Currently in Development' }, { name: 'Platform', value: 'Roblox (PC, Mobile, Console)' }).setThumbnail(LOGO_URL).setTimestamp()] });
        }
    }
});

// ==========================================================
// GESTION DES INTERACTIONS (BOUTONS ET MODALS)
// ==========================================================
client.on(Events.InteractionCreate, async (interaction) => {
    console.log(`🔘 Interaction received: ${interaction.customId || 'unknown'} from ${interaction.user.tag}`);
    
    if (interaction.isButton()) {
        // Bouton pour ouvrir un ticket DM
        if (interaction.customId.startsWith('dm_open_')) {
            const userId = interaction.customId.replace('dm_open_', '');
            
            if (interaction.user.id !== userId) {
                return interaction.reply({ 
                    embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Access Denied').setDescription('This button is not for you.').setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            }
            
            const guild = client.guilds.cache.first();
            const user = await client.users.fetch(userId);
            
            const ticketChannelName = `ticket-${user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
            
            const permissionOverwrites = [
                { id: guild.id, deny: ['ViewChannel'] },
            ];
            
            staffRoles.forEach(roleName => {
                const role = guild.roles.cache.find(r => r.name === roleName);
                if (role) permissionOverwrites.push({ id: role.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] });
            });
            
            try {
                const newChannel = await guild.channels.create({
                    name: ticketChannelName,
                    type: ChannelType.GuildText,
                    topic: `DM Ticket for ${userId}`,
                    permissionOverwrites: permissionOverwrites,
                    reason: `DM Ticket created for ${user.tag}`
                });
                
                dmTickets.set(userId, newChannel.id);
                
                const welcomeEmbed = new EmbedBuilder()
                    .setColor(COLORS.dark)
                    .setTitle('DM Ticket Opened')
                    .setDescription(`This is a private ticket channel for **${user.tag}** (${userId}).\n\nAll messages sent by this user via DM will appear here. You can:\n• Click "Reply" on any message to respond via modal\n• Write directly in this channel to send a message to the user\n• Click "Close Ticket" to end the conversation`)
                    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
                    .setFooter({ text: 'Jaxdrax Studio DM Support', iconURL: LOGO_URL })
                    .setTimestamp();
                
                await newChannel.send({ embeds: [welcomeEmbed] });
                
                await interaction.update({ 
                    embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Ticket Opened').setDescription(`Your ticket has been opened. A staff member will assist you shortly.\n\nYou can continue this conversation via DM.`).setThumbnail(LOGO_URL).setTimestamp()],
                    components: []
                });
                
                await user.send({ 
                    embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Ticket Confirmed').setDescription('Your support ticket has been opened. You can now send messages here and they will be relayed to the support team.').setThumbnail(LOGO_URL).setTimestamp()]
                });
                
                console.log(`✅ DM ticket created for ${user.tag}`);
                
            } catch (error) {
                console.error('❌ Error creating DM ticket:', error);
                await interaction.update({ 
                    embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('An error occurred while creating the ticket.').setTimestamp()],
                    components: []
                });
            }
            return;
        }
        
        // Bouton pour annuler
        if (interaction.customId.startsWith('dm_cancel_')) {
            const userId = interaction.customId.replace('dm_cancel_', '');
            
            if (interaction.user.id !== userId) {
                return interaction.reply({ 
                    embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Access Denied').setDescription('This button is not for you.').setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            }
            
            await interaction.update({ 
                embeds: [new EmbedBuilder().setColor(COLORS.gray).setTitle('Cancelled').setDescription('Ticket creation cancelled. If you need support later, feel free to message the bot again.').setTimestamp()],
                components: []
            });
            return;
        }
        
        // Bouton pour répondre
        if (interaction.customId.startsWith('dm_reply_')) {
            const userId = interaction.customId.replace('dm_reply_', '');
            
            const modal = new ModalBuilder()
                .setCustomId(`dm_reply_modal_${userId}`)
                .setTitle('Reply to User');
            
            const messageInput = new TextInputBuilder()
                .setCustomId('reply_message')
                .setLabel('Your reply message')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setPlaceholder('Type your response to the user...');
            
            const row = new ActionRowBuilder().addComponents(messageInput);
            modal.addComponents(row);
            
            await interaction.showModal(modal);
            return;
        }
        
        // Bouton pour fermer
        if (interaction.customId.startsWith('dm_close_')) {
            const userId = interaction.customId.replace('dm_close_', '');
            
            const modal = new ModalBuilder()
                .setCustomId(`dm_close_modal_${userId}`)
                .setTitle('Close DM Ticket');
            
            const reasonInput = new TextInputBuilder()
                .setCustomId('close_reason')
                .setLabel('Reason for closing (optional)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false)
                .setPlaceholder('Enter the reason for closing this ticket...');
            
            const row = new ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(row);
            
            await interaction.showModal(modal);
            return;
        }
    }

    // Gestion des modals
    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('dm_reply_modal_')) {
            const userId = interaction.customId.replace('dm_reply_modal_', '');
            const replyMessage = interaction.fields.getTextInputValue('reply_message');
            
            try {
                const user = await client.users.fetch(userId);
                
                const replyEmbed = new EmbedBuilder()
                    .setColor(COLORS.gray)
                    .setAuthor({ name: `${interaction.user.tag} (Staff)`, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 1024 }) })
                    .setDescription(replyMessage)
                    .setFooter({ text: 'Staff Response' })
                    .setTimestamp();
                
                await user.send({ embeds: [replyEmbed] });
                
                await interaction.reply({ 
                    embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Reply Sent').setDescription(`Your response has been sent to <@${userId}>.`).setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
                
            } catch (error) {
                console.error('Error sending DM reply:', error);
                await interaction.reply({ 
                    embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('Failed to send the reply. The user may have DMs disabled.').setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            }
            return;
        }
        
        if (interaction.customId.startsWith('dm_close_modal_')) {
            const userId = interaction.customId.replace('dm_close_modal_', '');
            const reason = interaction.fields.getTextInputValue('close_reason') || 'No reason provided.';
            
            try {
                const user = await client.users.fetch(userId);
                
                const closeEmbed = new EmbedBuilder()
                    .setColor(COLORS.red)
                    .setTitle('Ticket Closed')
                    .setDescription(`Your support ticket has been closed by a staff member.\n\n**Reason:**\n${reason}\n\nIf you need further assistance, feel free to send another message.`)
                    .setFooter({ text: `Closed by: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 1024 }) })
                    .setTimestamp();
                
                await user.send({ embeds: [closeEmbed] });
                
                const messages = await interaction.channel.messages.fetch({ limit: 100 });
                let transcript = `DM Ticket Transcript for ${user.tag} (${userId})\n\n`;
                Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp).forEach(msg => { 
                    transcript += `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content || '(embed/attachment)'}\n`; 
                });
                
                const transcriptChannel = interaction.client.channels.cache.get(process.env.TICKET_TRANSCRIPTS_CHANNEL_ID);
                if (transcriptChannel) {
                    await transcriptChannel.send({ 
                        embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('DM Ticket Closed').setDescription(`DM Ticket for ${user.tag} (${userId}) has been closed.\n\n**Closed by:** ${interaction.user.tag}\n**Reason:** ${reason}\n**Messages:** ${messages.size}`).setThumbnail(LOGO_URL).setTimestamp()],
                        files: [{ attachment: Buffer.from(transcript, 'utf-8'), name: `dm-ticket-${user.username}.txt` }] 
                    });
                }
                
                dmTickets.delete(userId);
                await interaction.channel.delete('DM Ticket closed');
                
            } catch (error) {
                console.error('Error closing DM ticket:', error);
                try {
                    await interaction.channel.delete('DM Ticket closed (error)');
                } catch {}
            }
            return;
        }
    }
});

client.login(process.env.DISCORD_TOKEN);

// ==========================================================
// API HTTP POUR ROBLOX ET HEALTH CHECK
// ==========================================================
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
        robloxPresence = {
            onlinePlayers: onlinePlayers || 0,
            totalPlayers: totalPlayers || 0,
            serverStatus: serverStatus || 'Unknown'
        };
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
    res.json({ 
        memberCount: guild.memberCount, 
        onlineCount: guild.members.cache.filter(m => m.presence?.status === 'online').size, 
        botOnline: true,
        robloxPresence: robloxPresence
    });
});

app.listen(PORT, () => console.log(`API and health check server running on port ${PORT}`));
