const { EmbedBuilder, ActivityType } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');
const { sendDevLog } = require('../utils/logger');
const { joinVoice, refreshSpotifyToken } = require('../utils/voiceManager');

let presenceIndex = 0;

function updateBotPresence(client, robloxPresence) {
    const guild = client.guilds.cache.first();
    const memberCount = guild ? guild.memberCount : 0;
    
    const streamingMessages = [
        'Your Fish Life',
        `${memberCount} members`,
        '!help for commands',
        `${robloxPresence.onlinePlayers} players in-game`,
        'Jaxdrax Studio'
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

module.exports = {
    name: 'clientReady',
    once: true,
    async execute(client, robloxPresence) {
        console.log(`Bot online: ${client.user.tag}`);
        updateBotPresence(client, robloxPresence);
        setInterval(() => updateBotPresence(client, robloxPresence), 120000);

        // Rafraîchir le token Spotify
        await refreshSpotifyToken();
        setInterval(refreshSpotifyToken, 3500000); // Toutes les heures

        // Rejoindre le salon vocal
        const joined = await joinVoice(client);
        if (joined) {
            console.log('[Voice] Successfully joined voice channel');
        } else {
            console.error('[Voice] Failed to join voice channel');
        }

        const embed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Bot Online - System Initialized')
            .setDescription(`The Jaxdrax Studio Bot has successfully connected to Discord and is now fully operational.\n\n**Connection Details:**\n• Tag: ${client.user.tag}\n• ID: ${client.user.id}\n• Servers: ${client.guilds.cache.size}\n• Users: ${client.users.cache.size}\n• Voice: ${joined ? 'Connected' : 'Failed'}\n\nAll monitoring systems are active and ready to track server events.`)
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio System Monitor', iconURL: LOGO_URL })
            .setTimestamp();

        await sendDevLog(client, embed);
    }
};
