const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Displays information about Your Fish Life'),
    async execute(interaction) {
        const isStaff = interaction.member.roles.cache.some(role => STAFF_ROLES.includes(role.name));

        if (isStaff) {
            const guild = interaction.guild;
            const embed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('<:filecirclequestionsolid:1563659444066328768> Your Fish Life - Complete Game Information')
                .setDescription('Comprehensive details regarding the development and status of the Your Fish Life Roblox experience.\n\n<:cloudarrowupsolid:1563659464588927046> **Development Status:**\n• Current Phase: Active Development\n• Last Update: Ongoing\n• Next Milestone: Beta Testing')
                .addFields(
                    { name: '<:buildingsolid:1563676609146396853> Developer', value: 'Jaxdrax Studio', inline: true },
                    { name: '<:chartlinesolid:1563675843287453706> Core Features', value: 'Aquarium building, fish species discovery, community relaxation, and regular content updates.', inline: false },
                    { name: '<:buildingsolid:1563676609146396853> Discord Stats', value: `Members: ${guild.memberCount}\nRoles: ${guild.roles.cache.size}\nChannels: ${guild.channels.cache.size}`, inline: true },
                    { name: '<:chartlinesolid:1563675843287453706> Roblox Live Stats', value: 'Players Online: Checking...\nServer Status: Online', inline: true },
                    { name: '<:ticketsolid:1563675536008417400> Support', value: 'Use the ticket system or visit the help-desk channel for assistance.', inline: false },
                    { name: '<:scalebalancedsolid:1563676794194759790> Legal', value: 'This project is protected by a proprietary license. All rights reserved by Jaxdrax Studio.', inline: false }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Development Team', iconURL: LOGO_URL })
                .setTimestamp();

            const licenseButton = new ButtonBuilder()
                .setCustomId('info_view_license')
                .setLabel('View License')
                .setStyle(ButtonStyle.Secondary);

            const ticketButton = new ButtonBuilder()
                .setCustomId('info_open_ticket')
                .setLabel('Support Ticket')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(licenseButton, ticketButton);

            await interaction.reply({ embeds: [embed], components: [row] });
        } else {
            const embed = new EmbedBuilder()
                .setColor(COLORS.gray)
                .setTitle('<:filecirclequestionsolid:1563659444066328768> Your Fish Life - Game Info')
                .setDescription('Your Fish Life is an upcoming Roblox experience developed by Jaxdrax Studio. Dive into a relaxing and immersive aquarium building simulation where you can discover new fish species, customize your tanks, and connect with a growing community of players.\n\n<:cloudarrowupsolid:1563659464588927046> **Key Features:**\n• Build and customize your own aquarium\n• Discover and collect new fish species\n• Relaxing gameplay with regular updates\n• Active community and support')
                .addFields(
                    { name: '<:buildingsolid:1563676609146396853> Developer', value: 'Jaxdrax Studio', inline: true },
                    { name: '<:chartlinesolid:1563675843287453706> Status', value: 'Currently in Development', inline: true },
                    { name: '<:buildingsolid:1563676609146396853> Platform', value: 'Roblox (PC, Mobile, Console)', inline: true },
                    { name: '<:scalebalancedsolid:1563676794194759790> Legal', value: 'This project is protected by a proprietary license. All rights reserved by Jaxdrax Studio.', inline: false }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio', iconURL: LOGO_URL })
                .setTimestamp();

            const licenseButton = new ButtonBuilder()
                .setCustomId('info_view_license')
                .setLabel('View License')
                .setStyle(ButtonStyle.Secondary);

            const ticketButton = new ButtonBuilder()
                .setCustomId('info_open_ticket')
                .setLabel('Support Ticket')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(licenseButton, ticketButton);

            await interaction.reply({ embeds: [embed], components: [row] });
        }
    }
};
