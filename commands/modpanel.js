const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, BANNER_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modpanel')
        .setDescription('Opens the moderation control panel')
        .setDefaultMemberPermissions(0),

    name: 'modpanel',
    description: 'Opens the moderation control panel',

    async execute(interaction) {
        try {
            const isStaff = interaction.member.roles.cache.some(role => STAFF_ROLES.includes(role.name));

            if (!isStaff) {
                const embed = new EmbedBuilder()
                    .setColor(COLORS.red)
                    .setTitle('Access Denied')
                    .setDescription('This command is restricted to staff members only.\n\nRequired roles: ' + STAFF_ROLES.join(', '))
                    .setFooter({ text: 'Jaxdrax Studio Security', iconURL: LOGO_URL })
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
                    'Welcome to the complete moderation control panel. Use the selector below to access a specific tool.\n\n' +
                    '**Server Overview:**\n' +
                    'Total Members: ' + totalMembers + '\n' +
                    'Staff Members: ' + staffMembers + '\n' +
                    'Verified: ' + verifiedMembers + '\n' +
                    'Unverified: ' + unverifiedMembers + '\n' +
                    'Staff Ratio: ' + ((staffMembers / totalMembers) * 100).toFixed(1) + '%'
                )
                .setImage(BANNER_URL)
                .setFooter({ text: 'Jaxdrax Studio Moderation Team', iconURL: LOGO_URL })
                .setTimestamp();

            const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

            const menu = new StringSelectMenuBuilder()
                .setCustomId('modpanel_menu')
                .setPlaceholder('Select a moderation tool...')
                .addOptions(
                    { label: 'Member Investigation', value: 'mod_member_info', description: 'Search and view complete details on any member' },
                    { label: 'Moderation Guides', value: 'mod_guides', description: 'Step-by-step procedures for common situations' },
                    { label: 'Server Statistics', value: 'mod_stats', description: 'Complete overview of the server activity' },
                    { label: 'Recent Logs', value: 'mod_recent_logs', description: 'View recent moderation actions in dev-logs' }
                );

            const row = new ActionRowBuilder().addComponents(menu);

            await interaction.reply({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error('[Modpanel] Error:', error.message, error.stack);
        }
    }
};
