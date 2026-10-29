const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modpanel')
        .setDescription('Opens the moderation control panel')
        .setDefaultMemberPermissions(0),

    name: 'modpanel',
    description: 'Opens the moderation control panel',

    async execute(interaction) {
        const isStaff = interaction.member.roles.cache.some(role => STAFF_ROLES.includes(role.name));

        if (!isStaff) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Access Denied')
                .setDescription('This command is restricted to staff members only.\n\nRequired roles: ' + STAFF_ROLES.join(', '))
                .setFooter({ text: 'Jaxdrax Studio Security' })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const guild = interaction.guild;
        const totalMembers = guild.memberCount;
        const staffMembers = guild.members.cache.filter(m => m.roles.cache.some(r => STAFF_ROLES.includes(r.name))).size;
        const verifiedMembers = guild.members.cache.filter(m => m.roles.cache.some(r => r.name === 'Verified')).size;
        const unverifiedMembers = guild.members.cache.filter(m => m.roles.cache.some(r => r.name === 'Unverified')).size;

        const embed = new EmbedBuilder()
            .setColor(COLORS.darkRed)
            .setTitle('Jaxdrax Studio - Moderation Control Panel')
            .setDescription(
                'Welcome to the complete moderation control panel. This tool provides quick access to all moderation features, member information, situational guides and server statistics.\n\n' +
                '**Server Overview:**\n' +
                'Total Members: ' + totalMembers + '\n' +
                'Staff Members: ' + staffMembers + '\n' +
                'Verified: ' + verifiedMembers + '\n' +
                'Unverified: ' + unverifiedMembers + '\n' +
                'Staff Ratio: ' + ((staffMembers / totalMembers) * 100).toFixed(1) + '%\n\n' +
                'Use the buttons below to access specific moderation tools and resources.'
            )
            .addFields(
                {
                    name: 'Member Investigation',
                    value: 'Use the "Member Info" button to view complete details on any user including join date, roles, message count and moderation history. Essential for understanding context before taking action.',
                    inline: false
                },
                {
                    name: 'Moderation Guides',
                    value: 'Access step-by-step guides for handling spam, harassment, exploits, raids and other common situations. Each guide includes escalation paths and documentation requirements.',
                    inline: false
                },
                {
                    name: 'Statistics and Logs',
                    value: 'View recent moderation actions, warning counters, ticket statistics and server activity metrics. All actions are logged for accountability and pattern analysis.',
                    inline: false
                },
                {
                    name: 'Quick Actions',
                    value: 'Execute common moderation commands with guided workflows. Includes warn, mute, kick, ban and timeout with built-in reason tracking and user notification.',
                    inline: false
                },
                {
                    name: 'Recent Activity',
                    value: 'View the last 50 moderation actions including warnings issued, timeouts applied, bans executed and tickets closed. Filterable by action type and staff member.',
                    inline: false
                }
            )
            .setFooter({ text: 'Jaxdrax Studio Moderation Team' })
            .setTimestamp();

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('mod_member_info').setLabel('Member Info').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('mod_guides').setLabel('Mod Guides').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('mod_stats').setLabel('Statistics').setStyle(ButtonStyle.Success)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('mod_quick_actions').setLabel('Quick Actions').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('mod_recent_logs').setLabel('Recent Logs').setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ embeds: [embed], components: [row1, row2] });
    }
};
