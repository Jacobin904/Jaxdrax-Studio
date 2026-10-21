const { EmbedBuilder } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');

async function sendDevLog(client, embed) {
    const channel = client.channels.cache.get(process.env.DEV_LOGS_CHANNEL_ID);
    if (channel) {
        try {
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error sending dev log:', error);
        }
    }
}

module.exports = { sendDevLog };
