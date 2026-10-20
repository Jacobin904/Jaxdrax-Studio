require('dotenv').config();
const { 
    Client, GatewayIntentBits, Events, EmbedBuilder, ChannelType
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.DirectMessages
    ],
});

const COLORS = { dark: '#242120', red: '#cf0d0e', green: '#2ecc71' };
const LOGO_URL = 'https://media.discordapp.net/attachments/1561478676850151638/1561543957790330900/q1401r6.png?ex=6ad6bca3&is=6ad56b23&hm=e061b0defbc9b679db94772c199cdb7e9599ceefdbf1b7107430e2a99ffe8991&animated=true';

async function sendDevLog(embed) {
    try {
        const channel = await client.channels.fetch(process.env.DEV_LOGS_CHANNEL_ID);
        if (channel) await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Dev log error:', error);
    }
}

client.once(Events.ClientReady, async (c) => {
    console.log(`Bot online: ${c.user.tag}`);
    await sendDevLog(new EmbedBuilder()
        .setColor(COLORS.green)
        .setTitle('Bot Started')
        .setDescription(`Bot is online as ${c.user.tag}`)
        .setTimestamp()
    );
});

client.on(Events.MessageCreate, async (message) => {
    // ⚠️ CRUCIAL: Ignorer TOUS les messages du bot AVANT de logger
    if (message.author.bot) return;
    
    // Logger uniquement les messages des utilisateurs
    await sendDevLog(new EmbedBuilder()
        .setColor(COLORS.dark)
        .setTitle('Message Received')
        .setDescription(`From: ${message.author.tag}\nChannel: ${message.channel.type}\nContent: ${message.content || 'No content'}`)
        .setTimestamp()
    );
    
    // Si c'est un DM
    if (message.channel.type === ChannelType.DM) {
        try {
            await sendDevLog(new EmbedBuilder()
                .setColor(COLORS.green)
                .setTitle('DM Detected')
                .setDescription(`Processing DM from ${message.author.tag}`)
                .setTimestamp()
            );
            
            // Tenter de répondre
            await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor(COLORS.dark)
                    .setTitle('Test Response')
                    .setDescription('If you see this, DMs are working!')
                    .setThumbnail(LOGO_URL)
                    .setTimestamp()
                ]
            });
            
            await sendDevLog(new EmbedBuilder()
                .setColor(COLORS.green)
                .setTitle('DM Response Sent')
                .setDescription(`Successfully replied to ${message.author.tag}`)
                .setTimestamp()
            );
            
        } catch (error) {
            await sendDevLog(new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('DM Response Failed')
                .setDescription(`Error: ${error.message}`)
                .setTimestamp()
            );
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
