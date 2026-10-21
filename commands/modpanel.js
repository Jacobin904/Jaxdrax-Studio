const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    name: 'modpanel',
    async execute(message, isStaff) {
        if (!isStaff) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Access Denied')
                .setDescription('This command is restricted to staff members only. Moderation tools are confidential and should only be accessed by authorized personnel.')
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Security', iconURL: LOGO_URL })
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const embed = new EmbedBuilder()
            .setColor(COLORS.darkRed)
            .setTitle('Jaxdrax Studio - Moderation Panel')
            .setDescription('Welcome to the comprehensive moderation control panel. This tool provides quick access to all moderation features, member information, and situational guides.\n\n**Available Actions:**\n• View detailed member information and history\n• Access moderation guides for common situations\n• View recent moderation logs and statistics\n• Execute quick moderation actions\n• Manage warnings and infractions\n\n**Important:** All moderation actions are logged in the dev-logs channel for accountability and transparency.')
            .addFields(
                {
                    name: '🔍 Member Investigation',
                    value: 'Use the "Member Info" button to view comprehensive details about any user including join date, roles, recent messages, and moderation history.',
                    inline: false
                },
                {
                    name: '📋 Moderation Guides',
                    value: 'Access step-by-step guides for handling spam, harassment, exploits, appeals, and other common situations.',
                    inline: false
                },
                {
                    name: '📊 Statistics & Logs',
                    value: 'View recent moderation actions, warning counts, and server activity metrics.',
                    inline: false
                },
                {
                    name: '⚡ Quick Actions',
                    value: 'Execute common moderation commands with guided workflows.',
                    inline: false
                }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Moderation Team', iconURL: LOGO_URL })
            .setTimestamp();

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('mod_member_info')
                    .setLabel('Member Info')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('mod_guides')
                    .setLabel('Mod Guides')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('mod_stats')
                    .setLabel('Statistics')
                    .setStyle(ButtonStyle.Success)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('mod_quick_actions')
                    .setLabel('Quick Actions')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('mod_recent_logs')
                    .setLabel('Recent Logs')
                    .setStyle(ButtonStyle.Secondary)
            );

        await message.reply({ 
            embeds: [embed], 
            components: [row1, row2]
        });
    }
};
