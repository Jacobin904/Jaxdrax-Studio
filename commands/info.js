const {
    SlashCommandBuilder,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SeparatorSpacingSize
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
        
        // Conversion de la couleur hexadécimale en entier pour setAccentColor
        const accentColor = parseInt(COLORS.dark.replace('#', ''), 16);

        const container = new ContainerBuilder()
            .setAccentColor(accentColor)
            
            // 1. Titre principal
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent('# Your Fish Life - Game Information')
            )
            
            // 2. Description
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        'Your Fish Life is an upcoming Roblox experience developed by **Jaxdrax Studio**. ' +
                        'Dive into a relaxing and immersive aquarium building simulation where you can ' +
                        'discover new fish species, customize your tanks, and connect with a growing community of players.'
                    )
            )

            // 3. Séparateur
            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing(SeparatorSpacingSize.Large)
                    .setDivider(true)
            )

            // 4. Informations de base
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `**Developer:** Jaxdrax Studio\n` +
                        `**Status:** Active Development\n` +
                        `**Platform:** Roblox (PC, Mobile, Console)`
                    )
            )

            // 5. Séparateur
            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing(SeparatorSpacingSize.Small)
                    .setDivider(false)
            )

            // 6. Fonctionnalités
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        '## Core Features\n' +
                        '• **Aquarium Building:** Complete customization system with decorations, filters, and lighting options.\n' +
                        '• **Fish Discovery:** Over 100 unique species to discover, each with unique behaviors and requirements.\n' +
                        '• **Breeding System:** Advanced genetics-based breeding mechanics.\n' +
                        '• **Community Events:** Regular seasonal events with exclusive content.'
                    )
            )

            // 7. Séparateur
            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing(SeparatorSpacingSize.Small)
                    .setDivider(false)
            )

            // 8. Statistiques
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        `## Server Statistics\n` +
                        `**Members:** ${guild.memberCount}\n` +
                        `**Roles:** ${guild.roles.cache.size}\n` +
                        `**Channels:** ${guild.channels.cache.size}\n` +
                        `**Server Created:** ${createdAt}`
                    )
            )

            // 9. Séparateur avant les boutons
            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing(SeparatorSpacingSize.Large)
                    .setDivider(true)
            )

            // 10. Boutons d'action (intégrés directement DANS le conteneur)
            .addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('info_view_license')
                        .setLabel('View License')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('info_open_ticket')
                        .setLabel('Open Support Ticket')
                        .setStyle(ButtonStyle.Primary)
                )
            )

            // 11. Bouton Lien (deuxième rangée, aussi dans le conteneur)
            .addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('Visit Website')
                        .setURL('https://jaxdrax-studio.canner.app/')
                        .setStyle(ButtonStyle.Link)
                )
            )

            // 12. Footer
            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing(SeparatorSpacingSize.Small)
                    .setDivider(false)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`-# Jaxdrax Studio Development Team • ${new Date().getFullYear()}`)
            );

        // Envoi du message en utilisant strictement le format Components V2
        await interaction.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [container]
        });
    }
};
