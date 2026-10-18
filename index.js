require('dotenv').config();
const { Client, GatewayIntentBits, Events, EmbedBuilder, ChannelType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

const staffRoles = ['Game Direction', 'Admin', 'Moderator', 'Developer'];

// Fonction utilitaire pour envoyer les logs dans dev-logs
async function sendDevLog(embed) {
    const channelId = process.env.DEV_LOGS_CHANNEL_ID;
    if (!channelId) return;
    const channel = client.channels.cache.get(channelId);
    if (channel) {
        try {
            await channel.send({ embeds: [embed] });
        } catch (error) {
            // Ignorer les erreurs pour éviter les boucles infinies
        }
    }
}

// Intercepter les erreurs critiques pour les envoyer dans dev-logs
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
        .setDescription(`Jaxdrax Studio Bot is now online and connected as ${c.user.tag}.`)
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
    
    // Log membre qui rejoint
    const joinEmbed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('Member Joined')
        .setDescription(`${member.user.tag} has joined the server.`)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();
    sendDevLog(joinEmbed);
});

client.on(Events.GuildMemberRemove, (member) => {
    // Log membre qui part ou est banni
    const leaveEmbed = new EmbedBuilder()
        .setColor('#E74C3C')
        .setTitle('Member Left')
        .setDescription(`${member.user.tag} has left the server or was banned.`)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();
    sendDevLog(leaveEmbed);
});

client.on(Events.MessageDelete, (message) => {
    if (message.author.bot || !message.guild) return;
    // Log message supprimé
    const deleteEmbed = new EmbedBuilder()
        .setColor('#F39C12')
        .setTitle('Message Deleted')
        .setDescription(`A message by ${message.author.tag} was deleted in ${message.channel}.`)
        .addFields({ name: 'Content', value: message.content || 'No text content' })
        .setTimestamp();
    sendDevLog(deleteEmbed);
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
                .setDescription('1. Respect Everyone\n2. No Spam or Self Promotion\n3. Keep Channels Organized\n4. No Exploits or Cheating\n5. Follow Discord Terms of Service\n6. Staff Decisions are Final')
                .setTimestamp();
            await message.reply({ embeds: [fullRulesEmbed] });
        } else {
            const basicRulesEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('Server Rules')
                .setDescription('Please make sure to read and follow all rules in the rules channel.')
                .setTimestamp();
            await message.reply({ embeds: [basicRulesEmbed] });
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
                { name: '!ticket', value: 'Open a support ticket.' }
            )
            .setTimestamp();
        await message.reply({ embeds: [helpEmbed] });
    }

    if (message.content === '!ticket') {
        if (isStaff) {
            const ticketPanelEmbed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('Support Ticket System')
                .setDescription('Type `!ticket` to create a private support channel.')
                .setTimestamp();
            await message.channel.send({ embeds: [ticketPanelEmbed] });
        } else {
            const ticketChannelName = `ticket-${message.author.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
            const existingChannel = message.guild.channels.cache.find(c => c.name === ticketChannelName);
            if (existingChannel) return message.reply('You already have an open ticket.');

            const modRole = message.guild.roles.cache.find(r => r.name === 'Moderator');
            const adminRole = message.guild.roles.cache.find(r => r.name === 'Admin');
            const gdRole = message.guild.roles.cache.find(r => r.name === 'Game Direction');

            const permissionOverwrites = [
                { id: message.guild.id, deny: ['ViewChannel'] },
                { id: message.author.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }
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
                await message.reply(`Your ticket has been created: ${newChannel}`);
                
                const ticketWelcomeEmbed = new EmbedBuilder()
                    .setColor('#2ECC71')
                    .setTitle('Support Ticket Opened')
                    .setDescription(`Hello ${message.author}, a staff member will assist you shortly.`)
                    .setTimestamp();
                await newChannel.send({ content: `${message.author}`, embeds: [ticketWelcomeEmbed] });
            } catch (error) {
                console.error('Failed to create ticket channel:', error);
                await message.reply('An error occurred while creating the ticket.');
            }
        }
    }

    if (message.content === '!info') {
        const infoEmbed = new EmbedBuilder()
            .setColor('#006064')
            .setTitle('Your Fish Life - Game Info')
            .setDescription('Your Fish Life is an upcoming Roblox experience developed by Jaxdrax Studio.')
            .addFields(
                { name: 'Developer', value: 'Jaxdrax Studio' },
                { name: 'Status', value: 'Currently in Development' }
            )
            .setTimestamp();
        await message.reply({ embeds: [infoEmbed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
