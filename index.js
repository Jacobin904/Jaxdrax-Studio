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
    TextInputStyle
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
        .setColor('#E74C3C')
        .setTitle('Bot Error Detected')
        .setDescription('```' + args.join(' ').substring(0, 2000) + '```')
        .setTimestamp();
    sendDevLog(errorEmbed);
};

client.once(Events.ClientReady, (c) => {
    originalConsoleError(`Bot is online as ${c.user.tag}`);
    const startupEmbed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('Bot Online')
        .setDescription(`Jaxdrax Studio Bot is now online and connected as ${c.user.tag}. Monitoring all channels.`)
        .setTimestamp();
    sendDevLog(startupEmbed);
});

client.on(Events.GuildMemberAdd, async (member) => {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    const roleId = process.env.MEMBER_ROLE_ID;
    const channel = member.guild.channels.cache.get(channelId);

    if (channel) {
        const welcomeEmbed = new EmbedBuilder()
            .setColor('#F9E79F')
            .setTitle('Welcome to Your Fish Life!')
            .setDescription(`Hello <@${member.user.id}> (${member.user.username}, ${member.user.id}), welcome to the official Jaxdrax Studio server! Please read the rules in the rules channel and enjoy your stay.`)
            .setTimestamp();
        await channel.send({ embeds: [welcomeEmbed] });
    }

    if (roleId) {
        try { await member.roles.add(roleId); } catch (error) { console.error('Failed to add role:', error); }
    }
    
    const joinEmbed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('Member Joined')
        .setDescription(`<@${member.user.id}> (${member.user.username}, ${member.user.id}) has joined the server.`)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();
    sendDevLog(joinEmbed);
});

client.on(Events.GuildMemberRemove, (member) => {
    const leaveEmbed = new EmbedBuilder()
        .setColor('#E74C3C')
        .setTitle('Member Left')
        .setDescription(`<@${member.user.id}> (${member.user.username}, ${member.user.id}) has left the server or was banned.`)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();
    sendDevLog(leaveEmbed);
});

client.on(Events.MessageDelete, (message) => {
    if (message.author.bot || !message.guild) return;
    const deleteEmbed = new EmbedBuilder()
        .setColor('#F39C12')
        .setTitle('Message Deleted')
        .setDescription(`A message by <@${message.author.id}> (${message.author.username}, ${message.author.id}) was deleted in <#${message.channel.id}>.`)
        .addFields({ name: 'Content', value: message.content || 'No text content' })
        .setTimestamp();
    sendDevLog(deleteEmbed);
});

client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
    if (oldMessage.author.bot || !oldMessage.guild || oldMessage.content === newMessage.content) return;
    const editEmbed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setTitle('Message Edited')
        .setDescription(`A message by <@${oldMessage.author.id}> (${oldMessage.author.username}, ${oldMessage.author.id}) was edited in <#${oldMessage.channel.id}>.`)
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
        await message.reply(`Pong! Bot latency is ${Date.now() - message.createdTimestamp}ms.`);
    }

    if (message.content === '!rules') {
        if (isStaff) {
            const fullRulesEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
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
                .setFooter({ text: 'Jaxdrax Studio Management' })
                .setTimestamp();
            await message.channel.send({ embeds: [fullRulesEmbed] });
        } else {
            const basicRulesEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('Server Rules')
                .setDescription('Please make sure to read and follow all rules in the rules channel. Failure to comply may result in a mute or ban.')
                .setTimestamp();
            await message.reply({ embeds: [basicRulesEmbed] });
        }
    }

    if (message.content === '!info') {
        if (isStaff) {
            const fullInfoEmbed = new EmbedBuilder()
                .setColor('#006064')
                .setTitle('Your Fish Life - Complete Game Information')
                .setDescription('Comprehensive details regarding the development and status of the Your Fish Life Roblox experience.')
                .addFields(
                    { name: 'Developer', value: 'Jaxdrax Studio' },
                    { name: 'Current Status', value: 'Active Development' },
                    { name: 'Core Features', value: 'Aquarium building, fish species discovery, community relaxation, and regular content updates.' },
                    { name: 'Support', value: 'Use the !ticket command or visit the help-desk channel for assistance.' }
                )
                .setFooter({ text: 'Jaxdrax Studio Development Team' })
                .setTimestamp();
            await message.channel.send({ embeds: [fullInfoEmbed] });
        } else {
            const basicInfoEmbed = new EmbedBuilder()
                .setColor('#006064')
                .setTitle('Your Fish Life - Game Info')
                .setDescription('Your Fish Life is an upcoming Roblox experience developed by Jaxdrax Studio.')
                .addFields(
                    { name: 'Developer', value: 'Jaxdrax Studio' },
                    { name: 'Status', value: 'Currently in Development' }
                )
                .setTimestamp();
            await message.reply({ embeds: [basicInfoEmbed] });
        }
    }

    if (message.content === '!ticket') {
        if (isStaff) {
            const ticketPanelEmbed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('Support Ticket System')
                .setDescription('Welcome to the official support system. If you need assistance from the Jaxdrax Studio team, please click the button below to open a private ticket channel.')
                .setFooter({ text: 'Your Fish Life Support' })
                .setTimestamp();
            
            const button = new ButtonBuilder()
                .setCustomId('open_ticket')
                .setLabel('Open Ticket')
                .setStyle(ButtonStyle.Primary);
            
            const row = new ActionRowBuilder().addComponents(button);
            await message.channel.send({ embeds: [ticketPanelEmbed], components: [row] });
        } else {
            await message.reply('Please use the "Open Ticket" button in the designated support channel to create a ticket.');
        }
    }

    if (message.content === '!help') {
        const helpEmbed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('Jaxdrax Studio Bot - Help Menu')
            .addFields(
                { name: '!ping', value: 'Check bot latency.' },
                { name: '!rules', value: 'View server rules.' },
                { name: '!info', value: 'Game information.' },
                { name: '!ticket', value: 'Display the ticket panel (Staff) or get instructions (Members).' }
            )
            .setTimestamp();
        await message.reply({ embeds: [helpEmbed] });
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    // Gestion des boutons
    if (interaction.isButton()) {
        if (interaction.customId === 'open_ticket') {
            const ticketChannelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
            const existingChannel = interaction.guild.channels.cache.find(c => c.name === ticketChannelName);
            
            if (existingChannel) {
                return interaction.reply({ content: 'You already have an open ticket. Please check your channel list on the left.', ephemeral: true });
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

                await interaction.reply({ content: `Your ticket has been created: ${newChannel}`, ephemeral: true });
                
                const ticketWelcomeEmbed = new EmbedBuilder()
                    .setColor('#2ECC71')
                    .setTitle('Support Ticket Opened')
                    .setDescription(`Hello <@${interaction.user.id}> (${interaction.user.username}, ${interaction.user.id}), a staff member will assist you shortly. Please describe your issue in detail.`)
                    .setTimestamp();
                
                const closeBtn = new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Danger);
                const row = new ActionRowBuilder().addComponents(closeBtn);
                
                await newChannel.send({ content: `<@${interaction.user.id}>`, embeds: [ticketWelcomeEmbed], components: [row] });
            } catch (error) {
                console.error('Failed to create ticket channel:', error);
                await interaction.reply({ content: 'An error occurred while creating the ticket.', ephemeral: true });
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
                .setColor('#2ECC71')
                .setTitle('Ticket Reopened')
                .setDescription(`This ticket has been reopened by <@${interaction.user.id}> (${interaction.user.username}, ${interaction.user.id}).`)
                .setTimestamp();
                
            const closeBtn = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Close Ticket')
                .setStyle(ButtonStyle.Danger);
            const row = new ActionRowBuilder().addComponents(closeBtn);
            
            await interaction.channel.send({ embeds: [reopenEmbed], components: [row] });
            await interaction.reply({ content: 'The ticket has been reopened.', ephemeral: true });
        }

        if (interaction.customId === 'delete_ticket') {
            await interaction.deferUpdate();
            
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            let transcript = `Transcript for ${interaction.channel.name}\n\n`;
            messages.reverse().forEach(msg => {
                transcript += `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content || '(embed/attachment)'}\n`;
            });
            
            const transcriptChannelId = process.env.TICKET_TRANSCRIPTS_CHANNEL_ID;
            if (transcriptChannelId) {
                const transcriptChannel = interaction.client.channels.cache.get(transcriptChannelId);
                if (transcriptChannel) {
                    const buffer = Buffer.from(transcript, 'utf-8');
                    await transcriptChannel.send({ 
                        content: `Transcript for ${interaction.channel.name}`,
                        files: [{ attachment: buffer, name: `${interaction.channel.name}.txt` }] 
                    });
                }
            }
            
            await interaction.channel.delete('Ticket closed and transcript saved');
        }
    }

    // Gestion des fenêtres pop-up (Modals)
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
            .setColor('#E74C3C')
            .setTitle('Ticket Closed')
            .setDescription(`This ticket has been closed by <@${interaction.user.id}> (${interaction.user.username}, ${interaction.user.id}).`)
            .addFields({ name: 'Reason', value: reason })
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
        await interaction.reply({ content: 'The ticket has been closed successfully.', ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);
