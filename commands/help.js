const { EmbedBuilder } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');

module.exports = {
    name: 'help',
    async execute(message) {
        const embed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Jaxdrax Studio Bot - Complete Help Menu')
            .setDescription('Welcome to the official help menu for the Jaxdrax Studio Bot. Below you will find a comprehensive list of all available commands and their functions.\n\n**How to use:** Type the command prefix followed by the command name in any channel where the bot has permission to read messages.')
            .addFields(
                { name: '!ping', value: 'Displays detailed performance metrics including message latency, WebSocket latency, uptime, and memory usage.' },
                { name: '!rules', value: 'Shows the server rules. Staff members see the complete version with detailed sanctions, while regular members see a summary.' },
                { name: '!info', value: 'Provides information about Your Fish Life. Includes buttons to view the license and open a support ticket.' },
                { name: '!config', value: 'Staff only. Runs automatic verification of all bot permissions, roles, and configurations, then sends a complete dump of the server configuration (IDs of all channels, roles, categories) to your DMs.' },
                { name: '!modpanel', value: 'Staff only. Opens a comprehensive moderation panel with member investigation, quick actions (warn, timeout, kick, ban), guides, and statistics.' },
                { name: '!review', value: 'Submit a review for the server or for a specific staff member. Available to all members. Your username is displayed with your review.' }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Support', iconURL: LOGO_URL })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};
