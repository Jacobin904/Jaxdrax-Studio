require('dotenv').config();
const { Client, GatewayIntentBits, Events, EmbedBuilder, ChannelType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Liste des rôles considérés comme "Staff" pour les vérifications
const staffRoles = ['Game Direction', 'Admin', 'Moderator', 'Developer'];

client.once(Events.ClientReady, (c) => {
    console.log(`Bot is online as ${c.user.tag}`);
});

client.on(Events.GuildMemberAdd, async (member) => {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    const roleId = process.env.MEMBER_ROLE_ID;
    const channel = member.guild.channels.cache.get(channelId);

    if (channel) {
        const welcomeEmbed = new EmbedBuilder()
            .setColor('#F9E79F')
            .setTitle('Welcome to Your Fish Life!')
            .setDescription(`Hello ${member}, welcome to the official Jaxdrax Studio server! Please read the rules in the rules channel and enjoy your stay.`)
            .setTimestamp();
        await channel.send({ embeds: [welcomeEmbed] });
    }

    if (roleId) {
        try {
            await member.roles.add(roleId);
        } catch (error) {
            console.error('Failed to add role:', error);
        }
    }
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    const isStaff = message.member.roles.cache.some(role => staffRoles.includes(role.name));

    // Commande !ping
    if (message.content === '!ping') {
        await message.reply(`Pong! Bot latency is ${Date.now() - message.createdTimestamp}ms.`);
    }

    // Commande !rules (Intelligente)
    if (message.content === '!rules') {
        if (isStaff) {
            const fullRulesEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('Complete Server Rules')
                .setDescription('1. Respect Everyone: Treat all members and staff with respect. Harassment or discrimination will result in an immediate ban.\n\n2. No Spam or Self Promotion: Do not spam messages or advertise other servers/games without permission.\n\n3. Keep Channels Organized: Post content in the appropriate channels.\n\n4. No Exploits or Cheating: Discussing or promoting exploits is strictly forbidden.\n\n5. Follow Discord Terms of Service: All users must comply with official Discord guidelines.\n\n6. Staff Decisions are Final: Open a ticket for appeals. Do not argue in public channels.')
                .setTimestamp();
            await message.reply({ embeds: [fullRulesEmbed] });
        } else {
            const basicRulesEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('Server Rules')
                .setDescription('Please make sure to read and follow all rules in the rules channel. Failure to comply may result in a mute or ban.')
                .addFields({ name: 'Action Required', value: 'Please check the rules channel for the full list of regulations.' })
                .setTimestamp();
            await message.reply({ embeds: [basicRulesEmbed] });
        }
    }

    // Commande !help
    if (message.content === '!help') {
        const helpEmbed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('Jaxdrax Studio Bot - Help Menu')
            .setDescription('Here is a list of available commands to help you navigate the server.')
            .addFields(
                { name: '!ping', value: 'Check the bot response time.' },
                { name: '!rules', value: 'View the server rules (full version for staff, summary for members).' },
                { name: '!info', value: 'Get general information about Your Fish Life and Jaxdrax Studio.' },
                { name: '!ticket', value: 'Open a private support channel with the staff team, or display the ticket panel (staff only).' }
            )
            .setFooter({ text: 'Your Fish Life Support' })
            .setTimestamp();
        await message.reply({ embeds: [helpEmbed] });
    }

    // Commande !ticket (Intelligente)
    if (message.content === '!ticket') {
        if (isStaff) {
            const ticketPanelEmbed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('Support Ticket System')
                .setDescription('Welcome to the support panel. Members can type `!ticket` in this channel to automatically create a private support channel with the staff team.')
                .setFooter({ text: 'Jaxdrax Studio Support' })
                .setTimestamp();
            await message.channel.send({ embeds: [ticketPanelEmbed] });
        } else {
            const ticketChannelName = `ticket-${message.author.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
            
            // Vérifier si un ticket existe déjà
            const existingChannel = message.guild.channels.cache.find(c => c.name === ticketChannelName);
            if (existingChannel) {
                return message.reply('You already have an open ticket. Please check your channel list on the left.');
            }

            // Récupérer les rôles du staff pour leur donner accès
            const modRole = message.guild.roles.cache.find(r => r.name === 'Moderator');
            const adminRole = message.guild.roles.cache.find(r => r.name === 'Admin');
            const gdRole = message.guild.roles.cache.find(r => r.name === 'Game Direction');

            const permissionOverwrites = [
                { id: message.guild.id, deny: ['ViewChannel'] }, // Refuser l'accès à @everyone
                { id: message.author.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] } // Autoriser le créateur
            ];

            if (modRole) permissionOverwrites.push({ id: modRole.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] });
            if (adminRole) permissionOverwrites.push({ id: adminRole.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] });
            if (gdRole) permissionOverwrites.push({ id: gdRole.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] });

            try {
                const newChannel = await message.guild.channels.create({
                    name: ticketChannelName,
                    type: ChannelType.GuildText,
                    permissionOverwrites: permissionOverwrites,
                    reason: `Support ticket created by ${message.author.tag}`
                });

                await message.reply(`Your ticket has been created! Please check the channel: ${newChannel}`);
                
                const ticketWelcomeEmbed = new EmbedBuilder()
                    .setColor('#2ECC71')
                    .setTitle('Support Ticket Opened')
                    .setDescription(`Hello ${message.author}, thank you for contacting Jaxdrax Studio support. Please describe your issue in detail, and a staff member will assist you shortly.\n\nTo close this ticket, a staff member will delete the channel.`)
                    .setTimestamp();
                
                await newChannel.send({ content: `${message.author}`, embeds: [ticketWelcomeEmbed] });

            } catch (error) {
                console.error('Failed to create ticket channel:', error);
                await message.reply('An error occurred while creating the ticket. Please contact an administrator directly.');
            }
        }
    }

    // Commande !info
    if (message.content === '!info') {
        const infoEmbed = new EmbedBuilder()
            .setColor('#006064')
            .setTitle('Your Fish Life - Game Info')
            .setDescription('Your Fish Life is an upcoming Roblox experience developed by Jaxdrax Studio. Build your aquarium, discover new species, and relax with the community.')
            .addFields(
                { name: 'Developer', value: 'Jaxdrax Studio' },
                { name: 'Status', value: 'Currently in Development' }
            )
            .setTimestamp();
        await message.reply({ embeds: [infoEmbed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
