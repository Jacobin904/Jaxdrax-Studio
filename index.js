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
            .setDescription(`Hello ${member}, welcome to the official server! Please read the rules and enjoy your stay.`)
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
});

client.login(process.env.DISCORD_TOKEN);
