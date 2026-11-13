const {
    SlashCommandBuilder,
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ThumbnailBuilder,
    MediaGalleryBuilder,
    ActionsRowBuilder,
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

        // Build the Components V2 layout
        const container = new ContainerBuilder()
            .setAccentColor(parseInt(COLORS.dark.replace('#', ''), 16));

        // Header section with logo
        const headerSection = new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('# Your Fish Life - Game Information')
            )
            .setThumbnailAccessory(
                new ThumbnailBuilder().setURL(LOGO_URL)
            );

        container.addSectionComponents(headerSection);

        // Main description
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                'Your Fish Life is an upcoming Roblox experience developed by **Jaxdrax Studio**. ' +
                'Dive into a relaxing and immersive aquarium building simulation where you can ' +
                'discover new fish species, customize your tanks, and connect with a growing community of players.'
            )
        );

        // Separator
        container.addSeparatorComponents(new SeparatorBuilder());

        // Game info section
        const infoSection = new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Developer:** Jaxdrax Studio\n` +
                    `**Status:** Active Development\n` +
                    `**Platform:** Roblox (PC, Mobile, Console)`
                )
            );

        container.addSectionComponents(infoSection);

        // Separator
        container.addSeparatorComponents(new SeparatorBuilder());

        // Core Features
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                '## Core Features\n' +
                '- **Aquarium Building:** Complete customization system with decorations, filters, and lighting options.\n' +
                '- **Fish Discovery:** Over 100 unique species to discover, each with unique behaviors and requirements.\n' +
                '- **Breeding System:** Advanced genetics-based breeding mechanics.\n' +
                '- **Community Events:** Regular seasonal events with exclusive content.'
            )
        );

        // Separator
        container.addSeparatorComponents(new SeparatorBuilder());

        // Server Statistics
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `## Server Statistics\n` +
                `**Members:** ${guild.memberCount}\n` +
                `**Roles:** ${guild.roles.cache.size}\n` +
                `**Channels:** ${guild.channels.cache.size}\n` +
                `**Server Created:** ${createdAt}`
            )
        );

        // Separator
        container.addSeparatorComponents(new SeparatorBuilder());

        // Image banner
        container.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
                { url: BANNER_URL }
            )
        );

        // Footer text
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('*Jaxdrax Studio Development Team*')
        );

        // Buttons in ActionsRow (Components V2)
        const actionsRow = new ActionsRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('info_view_license')
                    .setLabel('View License')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('info_open_ticket')
                    .setLabel('Open Support Ticket')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setLabel('Visit Website')
                    .setURL('https://jaxdrax-studio.canner.app/')
                    .setStyle(ButtonStyle.Link)
            );

        await interaction.reply({
            components: [container, actionsRow],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
