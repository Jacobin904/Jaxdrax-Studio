const { EmbedBuilder } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');

module.exports = {
    name: 'help',
    async execute(message) {
        const embed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('<:filecirclequestionsolid:1563659444066328768> Jaxdrax Studio Bot - Complete Help Menu')
            .setDescription('Welcome to the official help menu for the Jaxdrax Studio Bot. Below you will find a comprehensive list of all available commands and their functions.\n\n**How to use:** Type the command prefix followed by the command name in any channel where the bot has permission to read messages.')
            .addFields(
                { name: '<:gaugesolid:1563675459470884984> !ping', value: 'Displays detailed performance metrics including message latency, WebSocket latency, uptime, and memory usage.' },
                { name: '<:filecirclechecksolid:1563658714320207932> !rules', value: 'Shows the server rules. Staff members see the complete version with detailed sanctions, while regular members see a summary.' },
                { name: '<:filecirclequestionsolid:1563659444066328768> !info', value: 'Provides information about Your Fish Life. Includes buttons to view the license and open a support ticket.' },
                { name: '<:gearsolid:1563675488222978068> !config', value: 'Staff only. Configures all server permissions automatically and sends a complete dump to your DMs.' },
                { name: '<:usershieldsolid:1563675514042974288> !modpanel', value: 'Staff only. Opens a comprehensive moderation panel with member investigation, quick actions, guides, and statistics.' },
                { name: '<:starhalfstrokesolid:1563659482528088225> !review', value: 'Submit a review for the server or for a specific staff member. Available to all members.' }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Support', iconURL: LOGO_URL })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};
