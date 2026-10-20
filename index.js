require('dotenv').config();
const { 
    Client, GatewayIntentBits, Events, EmbedBuilder, ChannelType, 
    ActivityType
} = require('discord.js');

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

const COLORS = { dark: '#242120', red: '#cf0d0e' };
const LOGO_URL = 'https://media.discordapp.net/attachments/1561478676850151638/1561543957790330900/q1401r6.png?ex=6ad6bca3&is=6ad56b23&hm=e061b0defbc9b679db94772c199cdb7e9599ceefdbf1b7107430e2a99ffe8991&animated=true';

// ==========================================================
// FONCTION DE LOG
// ==========================================================
async function sendDevLog(embed) {
    try {
        const channel = await client.channels.fetch(process.env.DEV_LOGS_CHANNEL_ID);
        if (channel) { 
            await channel.send({ embeds: [embed] }); 
        }
    } catch (error) {
        console.error('Error sending dev log:', error);
    }
}

// ==========================================================
// DÉMARRAGE DU BOT
// ==========================================================
client.once(Events.ClientReady, async (c) => {
    console.log(`✅ Bot is online as ${c.user.tag}`);
    
    // Envoyer un message de test dans dev-logs
    await sendDevLog(new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('✅ Bot Started Successfully')
        .setDescription(`The bot is now online and listening for DMs.\n\n**Tag:** ${c.user.tag}\n**ID:** ${c.user.id}\n**Guilds:** ${client.guilds.cache.size}\n\nSend a DM to the bot to test the ticket system.`)
        .setThumbnail(LOGO_URL)
        .setTimestamp()
    );
});

// ==========================================================
// ÉCOUTER TOUS LES MESSAGES
// ==========================================================
client.on(Events.MessageCreate, async (message) => {
    // Log TOUT dans dev-logs
    await sendDevLog(new EmbedBuilder()
        .setColor(COLORS.dark)
        .setTitle('📨 Message Received')
        .setDescription(`**From:** ${message.author.tag} (${message.author.id})\n**Channel Type:** ${message.channel.type}\n**Content:** ${message.content || '*No content*'}`)
        .setTimestamp()
    );
    
    // Ignorer les bots
    if (message.author.bot) return;
    
    // Si c'est un DM
    if (message.channel.type === ChannelType.DM) {
        await sendDevLog(new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('🔔 DM Detected')
            .setDescription(`DM from ${message.author.tag} detected!\n\n**Content:** ${message.content || '*No content*'}`)
            .setTimestamp()
        );
        
        // Répondre au DM pour confirmer
        await message.reply({
            embeds: [new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Message Received')
                .setDescription('Your message has been received. A staff member will respond shortly.')
                .setThumbnail(LOGO_URL)
                .setTimestamp()
            ]
        });
    }
});

client.login(process.env.DISCORD_TOKEN);
