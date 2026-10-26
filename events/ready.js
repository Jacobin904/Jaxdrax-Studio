const { EmbedBuilder, ActivityType, Events, PermissionFlagsBits } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');

let presenceIndex = 0;
let voiceStarted = false;

function updatePresence(client) {
    if (!client.user) return;

    const guild = client.guilds.cache.first();
    const members = guild ? guild.memberCount : 0;

    const messages = [
        'Your Fish Life',
        members + ' members',
        '/help for commands',
        'Jaxdrax Studio'
    ];

    client.user.setPresence({
        status: 'online',
        activities: [{
            name: messages[presenceIndex % messages.length],
            type: ActivityType.Watching
        }]
    });

    presenceIndex++;
}

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        console.log('[Bot] Online as ' + client.user.tag);

        updatePresence(client);
        setInterval(() => updatePresence(client), 120000);

        if (!voiceStarted) {
            voiceStarted = true;

            setTimeout(() => {
                try {
                    const { joinVoice } = require('../utils/voiceManager');
                    joinVoice(client).catch(error => {
                        console.error('[Voice] ' + error.message);
                    });
                } catch (error) {
                    console.error('[Voice] Module unavailable: ' + error.message);
                }
            }, 4000);
        }

        const channelId = process.env.DEV_LOGS_CHANNEL_ID;
        if (!channelId) return;

        const channel = client.channels.cache.get(channelId);
        if (!channel) return;

        const permissions = channel.permissionsFor(client.user);
        if (!permissions || !permissions.has(PermissionFlagsBits.SendMessages)) return;

        const embed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Bot Online - System Initialized')
            .setDescription(
                'The Jaxdrax Studio Bot has connected to Discord and is fully operational.\n\n' +
                '**Connection Details**\n' +
                'Tag: ' + client.user.tag + '\n' +
                'ID: ' + client.user.id + '\n' +
                'Servers: ' + client.guilds.cache.size + '\n\n' +
                '**Voice Status**\n' +
                'The bot connects automatically to the Jaxdrax Studio || Your Fish Life voice channel and stays connected.\n\n' +
                '**Commands**\n' +
                'Use /help to list all available slash commands.'
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio System Monitor', iconURL: LOGO_URL })
            .setTimestamp();

        await channel.send({ embeds: [embed] }).catch(() => {});
    }
};
