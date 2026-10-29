const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, BANNER_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Displays information about Your Fish Life'),

    name: 'info',
    description: 'Displays information about Your Fish Life',

    async execute(interaction) {
        try {
            const isStaff = interaction.member?.roles?.cache?.some(role => STAFF_ROLES.includes(role.name)) || false;

            if (isStaff) {
                const guild = interaction.guild;
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
                        { name: 'Core Features', value: '• **Aquarium Building:** Complete customization system with decorations, filters, and lighting options.\n• **Fish Discovery:** Over 100 unique species to discover, each with unique behaviors and requirements.\n• **Breeding System:** Advanced genetics-based breeding mechanics.\n• **Community Events:** Regular seasonal events with exclusive content.', inline: false },
                        { name: 'Server Statistics', value: '**Members:** ' + guild.memberCount + '\n**Roles:** ' + guild.roles.cache.size + '\n**Channels:** ' + guild.channels.cache.size + '\n**Server Created:** <t:' + Math.floor(guild.createdTimestamp / 1000) + ':R>', inline: false }
                    )
                    .setImage(BANNER_URL)
                    .setFooter({ text: 'Jaxdrax Studio Development Team', iconURL: LOGO_URL })
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('info_view_license').setLabel('View License').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('info_open_ticket').setLabel('Support Ticket').setStyle(ButtonStyle.Primary)
                );

                await interaction.reply({ embeds: [embed], components: [row] });
            } else {
                const infoChannel = guild.channels.cache.find(c => c.name === 'informations');
                if (infoChannel) {
                    await interaction.reply({
                        content: 'For more detailed information about Your Fish Life, please check ' + infoChannel,
                        flags: MessageFlags.Ephemeral
                    });
                } else {
                    await interaction.reply({
                        content: 'The information channel could not be found. Please contact a staff member for assistance.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            }
        } catch (error) {
            console.error('[Info] Error:', error.message, error.stack);
            try {
                const payload = { content: 'An error occurred while running this command.', flags: MessageFlags.Ephemeral };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(payload).catch(() => {});
                } else {
                    await interaction.reply(payload).catch(() => {});
                }
            } catch (e) {}
        }
    }
};
