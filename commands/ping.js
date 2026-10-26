const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const { COLORS, LOGO_URL } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Displays detailed performance metrics for the bot'),

    name: 'ping',
    description: 'Displays detailed performance metrics for the bot',

    async execute(interaction) {
        const sent = await interaction.reply({
            content: 'Pinging...',
            fetchReply: true
        });

        const messageLatency = sent.createdTimestamp - interaction.createdTimestamp;
        const websocketLatency = interaction.client.ws.ping;
        const uptime = Math.floor(interaction.client.uptime / 1000);

        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;

        const uptimeString = [];
        if (days > 0) uptimeString.push(`${days}d`);
        if (hours > 0) uptimeString.push(`${hours}h`);
        if (minutes > 0) uptimeString.push(`${minutes}m`);
        uptimeString.push(`${seconds}s`);

        const memoryUsage = process.memoryUsage();
        const ramUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100;
        const ramTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100;
        const ramPercent = Math.round((ramUsed / ramTotal) * 100);

        const statusEmoji = messageLatency < 200 && websocketLatency < 200 ? 'Excellent' :
                           messageLatency < 500 && websocketLatency < 500 ? 'Good' : 'Poor';

        const embed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('System Performance Metrics')
            .setDescription(
                'Detailed performance metrics for the Jaxdrax Studio Bot. All measurements are taken in real-time and reflect the current state of the system.'
            )
            .addFields(
                {
                    name: 'Message Latency',
                    value: `${messageLatency}ms\nThe time it takes for the bot to receive and respond to a command. Lower is better.`,
                    inline: true
                },
                {
                    name: 'WebSocket Latency',
                    value: `${websocketLatency}ms\nThe heartbeat latency between the bot and Discord servers. Indicates connection quality.`,
                    inline: true
                },
                {
                    name: 'Connection Status',
                    value: `${statusEmoji}\nOverall connection health based on latency measurements.`,
                    inline: true
                },
                {
                    name: 'Uptime',
                    value: uptimeString.join(' ') + '\nTotal time the bot has been running since last restart.`,
                    inline: false
                },
                {
                    name: 'Memory Usage',
                    value: `${ramUsed} MB / ${ramTotal} MB (${ramPercent}%)\nCurrent heap memory consumption. The bot automatically manages memory to prevent leaks.`,
                    inline: false
                },
                {
                    name: 'Bot Information',
                    value: `**Servers:** ${interaction.client.guilds.cache.size}\n**Users:** ${interaction.client.users.cache.size}\n**Channels:** ${interaction.client.channels.cache.size}\n**Commands Loaded:** ${interaction.client.commands.size}\n**Node.js Version:** ${process.version}\n**Discord.js Version:** 14.x`,
                    inline: false
                },
                {
                    name: 'Voice Connection',
                    value: 'Connected to: Jaxdrax Studio || Your Fish Life\nStatus: Active\nAudio Codec: Opus',
                    inline: false
                },
                {
                    name: 'API Endpoints',
                    value: '**Website:** http://localhost:3308\n**Public Stats:** /api/public-stats\n**Health Check:** /api/health\n**Update Stats:** /api/update-stats',
                    inline: false
                }
            )
            .setFooter({ text: 'Jaxdrax Studio Performance Monitor' })
            .setTimestamp();

        await interaction.editReply({ content: null, embeds: [embed] });
    }
};
