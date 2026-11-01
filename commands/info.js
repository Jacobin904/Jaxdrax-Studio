const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const { COLORS, LOGO_URL, BANNER_URL } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Displays information about Your Fish Life, licensing, and support.'),

    name: 'info',
    description: 'Displays information about Your Fish Life, licensing, and support.',

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Your Fish Life')
            .setDescription(
                'Welcome to **Your Fish Life**, an immersive aquarium building simulation developed by **Jaxdrax Studio**.\n\n' +
                'Dive into a relaxing experience where you can collect rare species, customize your tanks, and connect with a growing community of enthusiasts.'
            )
            .addFields(
                {
                    name: '🎮 Core Features',
                    value: 
                        '• **Aquarium Building:** Complete customization with decorations, filters, and lighting.\n' +
                        '• **Species Discovery:** Over 100 unique fish with specific behaviors and requirements.\n' +
                        '• **Genetics & Breeding:** Trait inheritance, mutation rolls, and lineage tracking.\n' +
                        '• **Active Development:** Weekly updates, seasonal events, and community-driven features.',
                    inline: false
                },
                {
                    name: '🔗 Quick Links',
                    value: 
                        '• **Website:** [jaxdrax-studio.canner.app](https://jaxdrax-studio.canner.app/)\n' +
                        '• **Discord:** [Join our Community](https://discord.gg/cmKCK7JJBa)',
                    inline: false
                }
            )
            .setImage(BANNER_URL)
            .setFooter({ text: 'Jaxdrax Studio | Your Fish Life', iconURL: LOGO_URL })
            .setTimestamp();

        // Rangée 1 : Boutons d'action (Licence et Ticket)
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('info_view_license')
                .setLabel('View License')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('info_open_ticket')
                .setLabel('Open Support Ticket')
                .setStyle(ButtonStyle.Primary)
        );

        // Rangée 2 : Lien vers le site web
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Visit Website')
                .setURL('https://jaxdrax-studio.canner.app/')
                .setStyle(ButtonStyle.Link)
        );

        await interaction.reply({ embeds: [embed], components: [row1, row2] });
    }
};
