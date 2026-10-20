require('dotenv').config();
const { 
    Client, GatewayIntentBits, Events, EmbedBuilder, ChannelType, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, 
    TextInputBuilder, TextInputStyle, MessageFlags, ActivityType
} = require('discord.js');

process.on('unhandledRejection', error => console.error('Unhandled rejection:', error));
process.on('uncaughtException', error => { console.error('Uncaught exception:', error); process.exit(1); });

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildPresences, GatewayIntentBits.DirectMessages],
});

const staffRoles = ['Game Direction', 'Admin', 'Moderator', 'Developer', 'Staff Team'];
const express = require('express');

const COLORS = { light: '#fbf7f7', gray: '#a49f9e', red: '#cf0d0e', darkRed: '#6c0b0d', dark: '#242120' };
const LOGO_URL = 'https://media.discordapp.net/attachments/1561478676850151638/1561543957790330900/q1401r6.png?ex=6ad6bca3&is=6ad56b23&hm=e061b0defbc9b679db94772c199cdb7e9599ceefdbf1b7107430e2a99ffe8991&animated=true';

let robloxPresence = { onlinePlayers: 0, totalPlayers: 0, serverStatus: 'Unknown' };

async function sendDevLog(embed) {
    const channel = client.channels.cache.get(process.env.DEV_LOGS_CHANNEL_ID);
    if (channel) { try { await channel.send({ embeds: [embed] }); } catch (error) {} }
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
    console.log(`Bot is online as ${c.user.tag}`);
    updateBotPresence();
    sendDevLog(new EmbedBuilder().setColor(COLORS.dark).setTitle('Bot Online - System Initialized').setDescription(`The Jaxdrax Studio Bot has successfully connected to Discord and is now fully operational.\n\n**Connection Details:**\n• Tag: ${c.user.tag}\n• ID: ${c.user.id}\n• Servers: ${client.guilds.cache.size}\n• Users: ${client.users.cache.size}\n\nAll monitoring systems are active and ready to track server events.`).setThumbnail(LOGO_URL).setFooter({ text: 'Jaxdrax Studio System Monitor', iconURL: LOGO_URL }).setTimestamp());
});

// ==========================================================
// SYSTÈME DE TICKET VIA DM
// ==========================================================

// Fonction pour trouver ou créer un salon de ticket DM pour un utilisateur
async function getOrCreateDMTicketChannel(user, guild) {
    const ticketChannelName = `dm-ticket-${user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    // Vérifier si le salon existe déjà
    const existingChannel = guild.channels.cache.find(c => 
        c.name === ticketChannelName && 
        c.topic === `DM Ticket for ${user.id}`
    );
    
    if (existingChannel) return existingChannel;
    
    // Créer un nouveau salon privé
    const permissionOverwrites = [
        { id: guild.id, deny: ['ViewChannel'] },
    ];
    
    // Donner accès à tous les rôles staff
    staffRoles.forEach(roleName => {
        const role = guild.roles.cache.find(r => r.name === roleName);
        if (role) permissionOverwrites.push({ id: role.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] });
    });
    
    const newChannel = await guild.channels.create({
        name: ticketChannelName,
        type: ChannelType.GuildText,
        parent: process.env.DM_TICKET_CATEGORY_ID, // Catégorie optionnelle
        topic: `DM Ticket for ${user.id}`,
        permissionOverwrites: permissionOverwrites,
        reason: `DM Ticket created for ${user.tag}`
    });
    
    // Envoyer un message d'accueil dans le salon
    const welcomeEmbed = new EmbedBuilder()
        .setColor(COLORS.dark)
        .setTitle('DM Ticket Opened')
        .setDescription(`This is a private ticket channel for **${user.tag}** (${user.id}).\n\nAll messages sent by this user via DM will appear here. Use the buttons below to respond or close the ticket.`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .setFooter({ text: 'Jaxdrax Studio DM Support', iconURL: LOGO_URL })
        .setTimestamp();
    
    await newChannel.send({ embeds: [welcomeEmbed] });
    
    return newChannel;
}

// Écouter les messages en DM
client.on(Events.MessageCreate, async (message) => {
    // Ignorer les messages du bot
    if (message.author.bot) return;
    
    // Gérer les messages en DM
    if (message.channel.type === ChannelType.DM) {
        const user = message.author;
        const guild = client.guilds.cache.first();
        
        if (!guild) return;
        
        try {
            // Obtenir ou créer le salon de ticket
            const ticketChannel = await getOrCreateDMTicketChannel(user, guild);
            
            // Créer l'embed du message
            const messageEmbed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setAuthor({ name: `${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true, size: 1024 }) })
                .setDescription(message.content || '*No text content*')
                .setFooter({ text: `User ID: ${user.id}` })
                .setTimestamp();
            
            // Ajouter les pièces jointes si présentes
            if (message.attachments.size > 0) {
                const attachments = message.attachments.map(a => a.url).join('\n');
                messageEmbed.addFields({ name: 'Attachments', value: attachments });
            }
            
            // Créer les boutons
            const replyButton = new ButtonBuilder()
                .setCustomId(`dm_reply_${user.id}`)
                .setLabel('Reply to User')
                .setStyle(ButtonStyle.Primary);
            
            const closeButton = new ButtonBuilder()
                .setCustomId(`dm_close_${user.id}`)
                .setLabel('Close Ticket')
                .setStyle(ButtonStyle.Danger);
            
            const row = new ActionRowBuilder().addComponents(replyButton, closeButton);
            
            // Envoyer le message dans le salon de ticket
            const sentMessage = await ticketChannel.send({ 
                embeds: [messageEmbed], 
                components: [row] 
            });
            
            // Ajouter une réaction de confirmation (crochet)
            await sentMessage.react('✅');
            
            // Confirmer à l'utilisateur en DM que le message a été envoyé
            const confirmationEmbed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Message Sent')
                .setDescription('Your message has been sent to the support team. A staff member will respond shortly.')
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Support', iconURL: LOGO_URL })
                .setTimestamp();
            
            await message.reply({ embeds: [confirmationEmbed] });
            
        } catch (error) {
            console.error('Error handling DM ticket:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Error')
                .setDescription('An error occurred while processing your message. Please try again later.')
                .setThumbnail(LOGO_URL)
                .setTimestamp();
            
            await message.reply({ embeds: [errorEmbed] });
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
        await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Jaxdrax Studio Bot - Complete Help Menu').setDescription('Welcome to the official help menu for the Jaxdrax Studio Bot.\n\n**DM Support:** You can also contact the support team by sending a direct message to the bot. A private ticket will be created automatically.').addFields({ name: '!ping', value: 'Displays detailed performance metrics.' }, { name: '!rules', value: 'Shows the server rules.' }, { name: '!info', value: 'Provides information about Your Fish Life.' }, { name: '!ticket', value: 'Displays the ticket panel (Staff) or instructions (Members).' }, { name: '!config', value: 'Staff only. Sends full server configuration to your DMs.' }, { name: 'Direct Messages', value: 'Send a DM to the bot to open a private support ticket.' }).setThumbnail(LOGO_URL).setFooter({ text: 'Jaxdrax Studio Support', iconURL: LOGO_URL }).setTimestamp()] });
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
            await message.channel.send({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Your Fish Life - Complete Game Information').setDescription('Comprehensive details regarding the development of Your Fish Life.').addFields({ name: 'Developer', value: 'Jaxdrax Studio' }, { name: 'Core Features', value: 'Aquarium building, fish species discovery, community relaxation.' }, { name: 'Discord Stats', value: `Members: ${guild.memberCount}\nRoles: ${guild.roles.cache.size}\nChannels: ${guild.channels.cache.size}` }, { name: 'Roblox Live Stats', value: `Players Online: ${robloxPresence.onlinePlayers}\nServer Status: ${robloxPresence.serverStatus}` }, { name: 'Support', value: 'Use the !ticket command or send a DM to the bot for assistance.' }).setThumbnail(LOGO_URL).setFooter({ text: 'Jaxdrax Studio Development Team', iconURL: LOGO_URL }).setTimestamp()] });
        } else {
            await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.gray).setTitle('Your Fish Life - Game Info').setDescription('Your Fish Life is an upcoming Roblox experience developed by Jaxdrax Studio.').addFields({ name: 'Developer', value: 'Jaxdrax Studio' }, { name: 'Status', value: 'Currently in Development' }, { name: 'Platform', value: 'Roblox (PC, Mobile, Console)' }).setThumbnail(LOGO_URL).setTimestamp()] });
        }
    }

    if (message.content === '!ticket') {
        if (isStaff) {
            const button = new ButtonBuilder().setCustomId('open_ticket').setLabel('Open Ticket').setStyle(ButtonStyle.Primary);
            await message.channel.send({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Support Ticket System - Official Panel').setDescription('Welcome to the official support system. Click the button below to open a private ticket channel.\n\n**Alternative:** You can also send a direct message to the bot to open a private DM ticket.').setThumbnail(LOGO_URL).setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL }).setTimestamp()], components: [new ActionRowBuilder().addComponents(button)] });
        } else {
            await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.gray).setTitle('Ticket Instructions').setDescription('To open a support ticket, you have two options:\n\n**Option 1:** Use the "Open Ticket" button in the help-desk channel.\n**Option 2:** Send a direct message to the bot to open a private DM ticket.\n\n**Before opening a ticket:**\n• Ensure you have read the server rules\n• Check if your issue has already been answered\n• Prepare a detailed description of your problem').setThumbnail(LOGO_URL).setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL }).setTimestamp()] });
        }
    }
});

// ==========================================================
// GESTION DES INTERACTIONS (BOUTONS ET MODALS)
// ==========================================================
client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
        // Bouton pour répondre à un ticket DM
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
        
        // Bouton pour fermer un ticket DM
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
        
        // Boutons de ticket normaux (serveur)
        if (interaction.customId === 'open_ticket') {
            const ticketChannelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
            if (interaction.guild.channels.cache.find(c => c.name === ticketChannelName)) {
                return interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Ticket Already Open').setDescription('You already have an open ticket.').setThumbnail(LOGO_URL).setTimestamp()], flags: MessageFlags.Ephemeral });
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
                    name: ticketChannelName, type: ChannelType.GuildText, parent: interaction.channel.parentId,
                    topic: `Ticket created by ${interaction.user.id}`, permissionOverwrites, reason: `Ticket by ${interaction.user.tag}`
                });

                const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger);
                await newChannel.send({ content: `<@${interaction.user.id}>`, embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Support Ticket Opened').setDescription(`Hello <@${interaction.user.id}>, welcome to your private support ticket.\n\n**Ticket Details:**\n• Created by: ${interaction.user.username}\n• User ID: ${interaction.user.id}\n• Channel: ${newChannel}\n\n**Next Steps:**\n• Please describe your issue in detail\n• Attach screenshots or videos if applicable\n• A staff member will assist you shortly`).setThumbnail(LOGO_URL).setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL }).setTimestamp()], components: [new ActionRowBuilder().addComponents(closeBtn)] });

                try {
                    await interaction.user.send({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Ticket Created Successfully').setDescription(`Your support ticket has been created: ${newChannel}`).setThumbnail(LOGO_URL).setTimestamp()] });
                    await interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Success').setDescription('Confirmation sent to your DMs.').setThumbnail(LOGO_URL).setTimestamp()], flags: MessageFlags.Ephemeral });
                } catch {
                    await interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Ticket Created').setDescription(`Your ticket: ${newChannel}`).setThumbnail(LOGO_URL).setTimestamp()], flags: MessageFlags.Ephemeral });
                }
            } catch (error) { console.error(error); }
        }

        if (interaction.customId === 'close_ticket') {
            const modal = new ModalBuilder().setCustomId('close_ticket_modal').setTitle('Close Ticket');
            modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reason').setLabel('Reason for closing (optional)').setStyle(TextInputStyle.Paragraph).setRequired(false)));
            await interaction.showModal(modal);
        }

        if (interaction.customId === 'reopen_ticket') {
            const creatorId = interaction.channel.topic?.match(/\d{17,19}/)?.[0];
            if (creatorId) await interaction.channel.permissionOverwrites.edit(creatorId, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
            const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger);
            await interaction.channel.send({ embeds: [new EmbedBuilder().setColor(COLORS.gray).setTitle('Ticket Reopened').setDescription(`Reopened by <@${interaction.user.id}> (${interaction.user.username}, ${interaction.user.id})`).setThumbnail(LOGO_URL).setTimestamp()], components: [new ActionRowBuilder().addComponents(closeBtn)] });
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.gray).setTitle('Success').setDescription('Ticket reopened.').setThumbnail(LOGO_URL).setTimestamp()], flags: MessageFlags.Ephemeral });
        }

        if (interaction.customId === 'delete_ticket') {
            await interaction.deferUpdate();
            try {
                const messages = await interaction.channel.messages.fetch({ limit: 100 });
                let transcript = `Transcript for ${interaction.channel.name}\n\n`;
                Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp).forEach(msg => { transcript += `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content || '(embed/attachment)'}\n`; });
                
                const transcriptChannel = interaction.client.channels.cache.get(process.env.TICKET_TRANSCRIPTS_CHANNEL_ID);
                if (transcriptChannel) await transcriptChannel.send({ embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Ticket Transcript Saved').setDescription(`Transcript for ${interaction.channel.name}\n\n**Details:**\n• Messages Saved: ${messages.size}\n• Saved by: <@${interaction.user.id}>`).setThumbnail(LOGO_URL).setTimestamp()], files: [{ attachment: Buffer.from(transcript, 'utf-8'), name: `${interaction.channel.name}.txt` }] });
                await interaction.channel.delete('Transcript saved');
            } catch (error) { console.error(error); try { await interaction.channel.delete('Transcript failed'); } catch {} }
        }
    }

    // Gestion des modals
    if (interaction.isModalSubmit()) {
        // Modal de réponse à un ticket DM
        if (interaction.customId.startsWith('dm_reply_modal_')) {
            const userId = interaction.customId.replace('dm_reply_modal_', '');
            const replyMessage = interaction.fields.getTextInputValue('reply_message');
            
            try {
                const user = await client.users.fetch(userId);
                
                // Envoyer le message en DM à l'utilisateur
                const replyEmbed = new EmbedBuilder()
                    .setColor(COLORS.dark)
                    .setTitle('Staff Response')
                    .setDescription(replyMessage)
                    .setFooter({ text: `Response from: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 1024 }) })
                    .setTimestamp();
                
                await user.send({ embeds: [replyEmbed] });
                
                // Confirmer dans le salon de ticket
                const confirmationEmbed = new EmbedBuilder()
                    .setColor(COLORS.dark)
                    .setTitle('Reply Sent')
                    .setDescription(`Your response has been sent to <@${userId}> (${user.tag}).\n\n**Message:**\n${replyMessage}`)
                    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 1024 }))
                    .setFooter({ text: `Sent by: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 1024 }) })
                    .setTimestamp();
                
                await interaction.reply({ embeds: [confirmationEmbed], flags: MessageFlags.Ephemeral });
                
            } catch (error) {
                console.error('Error sending DM reply:', error);
                await interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('Failed to send the reply. The user may have DMs disabled.').setThumbnail(LOGO_URL).setTimestamp()], flags: MessageFlags.Ephemeral });
            }
            return;
        }
        
        // Modal de fermeture d'un ticket DM
        if (interaction.customId.startsWith('dm_close_modal_')) {
            const userId = interaction.customId.replace('dm_close_modal_', '');
            const reason = interaction.fields.getTextInputValue('close_reason') || 'No reason provided.';
            
            try {
                const user = await client.users.fetch(userId);
                
                // Informer l'utilisateur en DM
                const closeEmbed = new EmbedBuilder()
                    .setColor(COLORS.red)
                    .setTitle('Ticket Closed')
                    .setDescription(`Your support ticket has been closed by a staff member.\n\n**Reason:**\n${reason}\n\nIf you need further assistance, feel free to send another message.`)
                    .setFooter({ text: `Closed by: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 1024 }) })
                    .setTimestamp();
                
                await user.send({ embeds: [closeEmbed] });
                
                // Sauvegarder le transcript
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
                
                // Supprimer le salon
                await interaction.channel.delete('DM Ticket closed');
                
            } catch (error) {
                console.error('Error closing DM ticket:', error);
                try {
                    await interaction.channel.delete('DM Ticket closed (error)');
                } catch {}
            }
            return;
        }
        
        // Modal de fermeture d'un ticket normal
        if (interaction.customId === 'close_ticket_modal') {
            const reason = interaction.fields.getTextInputValue('reason') || 'No reason provided.';
            const creatorId = interaction.channel.topic?.match(/\d{17,19}/)?.[0];
            if (creatorId) await interaction.channel.permissionOverwrites.edit(creatorId, { ViewChannel: false, SendMessages: false });
            
            const reopenBtn = new ButtonBuilder().setCustomId('reopen_ticket').setLabel('Reopen Ticket').setStyle(ButtonStyle.Success);
            const deleteBtn = new ButtonBuilder().setCustomId('delete_ticket').setLabel('Delete Permanently').setStyle(ButtonStyle.Danger);
            await interaction.channel.send({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Ticket Closed').setDescription(`Closed by <@${interaction.user.id}> (${interaction.user.username}, ${interaction.user.id})\n\n**Reason:** ${reason}`).setThumbnail(LOGO_URL).setTimestamp()], components: [new ActionRowBuilder().addComponents(reopenBtn, deleteBtn)] });
            
            try {
                await interaction.user.send({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Ticket Closed').setDescription(`Reason: ${reason}`).setThumbnail(LOGO_URL).setTimestamp()] });
                await interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Success').setDescription('Confirmation sent to DMs.').setThumbnail(LOGO_URL).setTimestamp()], flags: MessageFlags.Ephemeral });
            } catch {
                await interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Ticket Closed').setDescription('Ticket closed.').setThumbnail(LOGO_URL).setTimestamp()], flags: MessageFlags.Ephemeral });
            }
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
