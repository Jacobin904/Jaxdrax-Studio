const { EmbedBuilder, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    name: 'checklist',
    async execute(message, isStaff) {
        if (!isStaff) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Access Denied')
                .setDescription('This command is restricted to staff members only. If you believe you should have access, please contact a server administrator.')
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Security', iconURL: LOGO_URL })
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const embed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Server Configuration and Permissions Checklist')
            .setDescription('Welcome to the official setup checklist for the Jaxdrax Studio Discord server. Please verify that all roles and the bot have the correct permissions to ensure smooth operation of the ticket system, logging, and moderation tools.\n\n**How to use:** Go to Server Settings > Roles, select each role below, and verify that the listed permissions are enabled.')
            .addFields(
                {
                    name: 'Bot Role Permissions (Required)',
                    value: '- View Channels\n- Manage Channels (Required for automatic ticket creation)\n- Manage Roles (Required for assigning Member and VIP roles)\n- Manage Messages (Required for moderation and deletion logs)\n- Attach Files (Required for saving ticket transcripts)\n- Read Message History\n- Send Messages in Threads',
                    inline: false
                },
                {
                    name: 'Staff Roles Permissions (Game Direction, Admin, Moderator, Developer, Staff Team)',
                    value: '- Administrator (Recommended for Game Direction and Admin)\n- Manage Channels\n- Manage Messages\n- Ban Members / Kick Members\n- View Audit Log\n- View Private Channels (Mandatory for staff-chat, dev-logs, and ticket-transcripts)',
                    inline: false
                },
                {
                    name: 'VIP Role Permissions',
                    value: '- View Channels\n- Send Messages\n- Attach Files\n- Use External Emojis\n- Read Message History',
                    inline: false
                },
                {
                    name: 'Member Role Permissions',
                    value: '- View Channels\n- Send Messages\n- Attach Files\n- Read Message History\n- MUST NOT HAVE: Manage Channels, Manage Messages, Mention @everyone, Manage Roles',
                    inline: false
                },
                {
                    name: 'Final Verification Steps',
                    value: '1. Ensure the Bot role is positioned ABOVE the Member and VIP roles in the server role hierarchy.\n2. Ensure Staff roles are positioned ABOVE the Bot role if they need to moderate bot messages or manage tickets.\n3. Verify that DEV_LOGS_CHANNEL_ID, WELCOME_CHANNEL_ID, MEMBER_ROLE_ID, and TICKET_TRANSCRIPTS_CHANNEL_ID are correctly set in the bot environment variables on Canner.\n4. Test the !ticket command to ensure channels are created in the correct category and permissions are applied correctly.',
                    inline: false
                }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Management', iconURL: LOGO_URL })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};
