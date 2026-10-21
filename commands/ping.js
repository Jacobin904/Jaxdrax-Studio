const { EmbedBuilder } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');

module.exports = {
    name: 'ping',
    async execute(message, robloxPresence) {
        const uptimeSeconds = Math.floor(message.client.uptime / 1000);
        const days = Math.floor(uptimeSeconds / 86400);
        const hours = Math.floor((uptimeSeconds % 86400) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);

        const embed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Bot Performance & Status')
            .setDescription('Detailed performance metrics and system information for the Jaxdrax Studio Bot.')
            .addFields(
                { name: 'Message Latency', value: `${Date.now() - message.createdTimestamp}ms`, inline: true },
                { name: 'WebSocket Latency', value: `${message.client.ws.ping}ms`, inline: true },
                { name: 'Uptime', value: `${days}d ${hours}h ${minutes}m`, inline: true },
                { name: 'Memory Usage', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
                { name: 'Node.js Version', value: process.version, inline: true },
                { name: 'Discord.js Version', value: require('discord.js').version, inline: true },
                { name: 'Roblox Players Online', value: robloxPresence.onlinePlayers.toString(), inline: true },
                { name: 'Roblox Server Status', value: robloxPresence.serverStatus, inline: true }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Monitoring System', iconURL: LOGO_URL })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};
