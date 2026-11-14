const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');

const { COLORS, LOGO_URL, BANNER_URL } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Displays information about Your Fish Life, licensing, and support.'),

    name: 'info',
    description: 'Displays information about Your Fish Life, licensing, and support.',

    async execute(interaction) {
        const guild = interaction.guild;
        const createdAt = `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`;

        const embed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Your Fish Life - Game Information')
            .setDescription(
                'Your Fish Life is an upcoming Roblox experience developed by Jaxdrax Studio. ' +
                'Dive into a relaxing and immersive aquarium building simulation where you can ' +
                'discover new fish species, customize your tanks, and connect with a growing community of players.'
            )
            .addFields(
                { name: 'Developer', value: 'Jaxdrax Studio', inline: true },
                { name: 'Status', value: 'Active Development', inline: true },
                { name: 'Platform', value: 'Roblox (PC, Mobile, Console)', inline: true },
                { 
                    name: 'Core Features', 
                    value: 
                        '• Aquarium Building: Complete customization system with decorations, filters, and lighting options.\n' +
                        '• Fish Discovery: Over 100 unique species to discover, each with unique behaviors and requirements.\n' +
                        '• Breeding System: Advanced genetics-based breeding mechanics.\n' +
                        '• Community Events: Regular seasonal events with exclusive content.', 
                    inline: false 
                },
                {
                    name: 'Server Statistics',
                    value: 
                        `Members: ${guild.memberCount}\n` +
                        `Roles: ${guild.roles.cache.size}\n` +
                        `Channels: ${guild.channels.cache.size}\n` +
                        `Server Created: ${createdAt}`,
                    inline: false
                }
            )
            .setImage(BANNER_URL)
            .setFooter({ text: 'Jaxdrax Studio Development Team', iconURL: LOGO_URL })
            .setTimestamp();

        // Ligne 1 : Boutons d'action (Licence et Ticket)
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('info_view_license')
                    .setLabel('View License')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('info_open_ticket')
                    .setLabel('Open Support Ticket')
                    .setStyle(ButtonStyle.Primary)
            );

        // Ligne 2 : Lien vers le site web
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Visit Website')
                    .setURL('https://jaxdrax-studio.canner.app/')
                    .setStyle(ButtonStyle.Link)
            );

        await interaction.reply({ embeds: [embed], components: [row1, row2] });
    }
};
