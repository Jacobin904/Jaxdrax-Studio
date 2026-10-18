require('dotenv').config();
const { Client, GatewayIntentBits, Events, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

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

    if (message.content === '!ping') {
        await message.reply(`Pong! Bot latency is ${Date.now() - message.createdTimestamp}ms.`);
    }

    if (message.content === '!rules') {
        const rulesEmbed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('Server Rules')
            .setDescription('Please make sure to read and follow all rules in the rules channel. Failure to comply may result in a mute or ban.')
            .addFields(
                { name: 'Link', value: 'Please check the rules channel for the full list of regulations.' }
            )
            .setTimestamp();
        await message.reply({ embeds: [rulesEmbed] });
    }

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
