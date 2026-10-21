const { EmbedBuilder } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');

module.exports = {
    name: 'info',
    async execute(message, isStaff, robloxPresence) {
        if (isStaff) {
            const guild = message.guild;
            const embed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Your Fish Life - Complete Game Information')
                .setDescription('Comprehensive details regarding the development and status of the Your Fish Life Roblox experience.\n\n**Development Status:**\n• Current Phase: Active Development\n• Last Update: Ongoing\n• Next Milestone: Beta Testing')
                .addFields(
                    { name: 'Developer', value: 'Jaxdrax Studio' },
                    { name: 'Core Features', value: 'Aquarium building, fish species discovery, community relaxation, and regular content updates.' },
                    { name: 'Discord Stats', value: `Members: ${guild.memberCount}\nRoles: ${guild.roles.cache.size}\nChannels: ${guild.channels.cache.size}` },
                    { name: 'Roblox Live Stats', value: `Players Online: ${robloxPresence.onlinePlayers}\nServer Status: ${robloxPresence.serverStatus}` },
                    { name: 'Support', value: 'Use the !ticket command or visit the help-desk channel for assistance.' }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Development Team', iconURL: LOGO_URL })
                .setTimestamp();
            await message.channel.send({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor(COLORS.gray)
                .setTitle('Your Fish Life - Game Info')
                .setDescription('Your Fish Life is an upcoming Roblox experience developed by Jaxdrax Studio. Dive into a relaxing and immersive aquarium building simulation where you can discover new fish species, customize your tanks, and connect with a growing community of players.\n\n**Key Features:**\n• Build and customize your own aquarium\n• Discover and collect new fish species\n• Relaxing gameplay with regular updates\n• Active community and support')
                .addFields(
                    { name: 'Developer', value: 'Jaxdrax Studio' },
                    { name: 'Status', value: 'Currently in Development' },
                    { name: 'Platform', value: 'Roblox (PC, Mobile, Console)' }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio', iconURL: LOGO_URL })
                .setTimestamp();
            await message.reply({ embeds: [embed] });
        }
    }
};
