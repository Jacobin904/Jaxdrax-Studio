const { EmbedBuilder } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');

module.exports = {
    name: 'ping',
    async execute(message, client) {
        const sent = await message.reply({ 
            content: 'Pinging...',
            fetchReply: true 
        });

        const messageLatency = sent.createdTimestamp - message.createdTimestamp;
        const websocketLatency = client.ws.ping;
        const uptime = Math.floor(client.uptime / 1000);
        
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
        const cpuUsage = process.cpuUsage();

        const embed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('<:gaugesolid:1563675459470884984> System Performance Metrics')
            .setDescription('Detailed performance metrics for the Jaxdrax Studio Bot. All measurements are taken in real-time.')
            .addFields(
                { 
                    name: 'Message Latency', 
                    value: `${messageLatency}ms`,
                    inline: true 
                },
                { 
                    name: 'WebSocket Latency', 
                    value: `${websocketLatency}ms`,
                    inline: true 
                },
                { 
                    name: 'Status', 
                    value: messageLatency < 200 && websocketLatency < 200 ? 'Excellent' : messageLatency < 500 && websocketLatency < 500 ? 'Good' : 'Poor',
                    inline: true 
                },
                { 
                    name: 'Uptime', 
                    value: uptimeString.join(' '),
                    inline: false 
                },
                { 
                    name: 'Memory Usage', 
                    value: `${ramUsed} MB / ${ramTotal} MB`,
                    inline: true 
                },
                { 
                    name: 'CPU Usage', 
                    value: `${Math.round(cpuUsage.user / 1000)}ms user\n${Math.round(cpuUsage.system / 1000)}ms system`,
                    inline: true 
                },
                { 
                    name: 'Bot Information', 
                    value: `Servers: ${client.guilds.cache.size}\nUsers: ${client.users.cache.size}\nChannels: ${client.channels.cache.size}`,
                    inline: false 
                }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Performance Monitor', iconURL: LOGO_URL })
            .setTimestamp();

        await sent.edit({ 
            content: null,
            embeds: [embed] 
        });
    }
};
