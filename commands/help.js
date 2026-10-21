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
                { name: '!rules', value: 'Shows the server rules. Staff members see the complete version with detailed sanctions, while regular members see a summary with a link to the full rules.' },
                { name: '!info', value: 'Provides information about Your Fish Life. Staff members get development details and stats, while members get a general overview.' },
                { name: '!ticket', value: 'For staff: displays the ticket panel with a button. For members: shows instructions on how to open a support ticket.' },
                { name: '!config', value: 'Staff only. Sends a complete dump of the server configuration (IDs of all channels, roles, categories) to your DMs.' }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Support', iconURL: LOGO_URL })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};
