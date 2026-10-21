const { EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    name: 'checklist',
    async execute(message, isStaff) {
        if (!isStaff) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Access Denied')
                .setDescription('This command is restricted to staff members only.')
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Security', iconURL: LOGO_URL })
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const results = {
            success: [],
            errors: []
        };

        // Vérification 1: Permissions du bot
        const botMember = message.guild.members.me;
        const botPermissions = botMember.permissions;

        const requiredBotPermissions = [
            { name: 'Manage Channels', flag: PermissionFlagsBits.ManageChannels },
            { name: 'Manage Roles', flag: PermissionFlagsBits.ManageRoles },
            { name: 'Manage Messages', flag: PermissionFlagsBits.ManageMessages },
            { name: 'Attach Files', flag: PermissionFlagsBits.AttachFiles },
            { name: 'View Channel', flag: PermissionFlagsBits.ViewChannel },
            { name: 'Send Messages', flag: PermissionFlagsBits.SendMessages },
            { name: 'Read Message History', flag: PermissionFlagsBits.ReadMessageHistory }
        ];

        for (const perm of requiredBotPermissions) {
            if (botPermissions.has(perm.flag)) {
                results.success.push(`Bot has "${perm.name}" permission`);
            } else {
                results.errors.push(`Bot is MISSING "${perm.name}" permission`);
            }
        }

        // Vérification 2: Rôles staff
        for (const roleName of STAFF_ROLES) {
            const role = message.guild.roles.cache.find(r => r.name === roleName);
            if (role) {
                results.success.push(`Staff role "${roleName}" exists`);
            } else {
                results.errors.push(`Staff role "${roleName}" is MISSING`);
            }
        }

        // Vérification 3: Variables d'environnement
        const envVars = [
            { name: 'DEV_LOGS_CHANNEL_ID', value: process.env.DEV_LOGS_CHANNEL_ID },
            { name: 'WELCOME_CHANNEL_ID', value: process.env.WELCOME_CHANNEL_ID },
            { name: 'MEMBER_ROLE_ID', value: process.env.MEMBER_ROLE_ID },
            { name: 'TICKET_TRANSCRIPTS_CHANNEL_ID', value: process.env.TICKET_TRANSCRIPTS_CHANNEL_ID },
            { name: 'DISCORD_TOKEN', value: process.env.DISCORD_TOKEN },
            { name: 'ROBLOX_API_KEY', value: process.env.ROBLOX_API_KEY }
        ];

        for (const env of envVars) {
            if (env.value) {
                results.success.push(`Environment variable "${env.name}" is set`);
            } else {
                results.errors.push(`Environment variable "${env.name}" is MISSING`);
            }
        }

        // Vérification 4: Salons de logs
        const logChannels = [
            { name: 'dev-logs', id: process.env.DEV_LOGS_CHANNEL_ID },
            { name: 'welcome', id: process.env.WELCOME_CHANNEL_ID },
            { name: 'ticket-transcripts', id: process.env.TICKET_TRANSCRIPTS_CHANNEL_ID }
        ];

        for (const channel of logChannels) {
            if (channel.id) {
                const ch = message.guild.channels.cache.get(channel.id);
                if (ch) {
                    results.success.push(`Channel "${channel.name}" exists and is accessible`);
                } else {
                    results.errors.push(`Channel "${channel.name}" ID is set but channel NOT FOUND`);
                }
            } else {
                results.errors.push(`Channel "${channel.name}" ID is NOT configured`);
            }
        }

        // Vérification 5: Rôle Member
        if (process.env.MEMBER_ROLE_ID) {
            const memberRole = message.guild.roles.cache.get(process.env.MEMBER_ROLE_ID);
            if (memberRole) {
                results.success.push(`Member role "${memberRole.name}" exists`);
            } else {
                results.errors.push(`Member role ID is set but role NOT FOUND`);
            }
        } else {
            results.errors.push(`Member role ID is NOT configured`);
        }

        // Premier embed: Tentatives de vérification
        const checkingEmbed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Server Configuration Checklist - Running Checks')
            .setDescription('The bot is now automatically verifying all critical permissions, roles, and configurations. Please wait for the results...\n\n**Checks being performed:**\n• Bot permissions (Manage Channels, Manage Roles, Manage Messages, Attach Files, etc.)\n• Staff roles existence (Game Direction, Admin, Moderator, Developer, Staff Team)\n• Environment variables configuration\n• Log channels accessibility\n• Member role configuration\n\nResults will appear in the next message.')
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Management', iconURL: LOGO_URL })
            .setTimestamp();

        await message.reply({ embeds: [checkingEmbed] });

        // Deuxième embed: Résultats
        const successText = results.success.length > 0 
            ? results.success.map(s => `✅ ${s}`).join('\n')
            : 'No successful checks.';

        const errorsText = results.errors.length > 0
            ? results.errors.map(e => `❌ ${e}`).join('\n')
            : 'No errors found. All checks passed!';

        const resultsEmbed = new EmbedBuilder()
            .setColor(results.errors.length > 0 ? COLORS.red : '#2ecc71')
            .setTitle('Server Configuration Checklist - Results')
            .setDescription(`**Total Checks:** ${results.success.length + results.errors.length}\n**Successful:** ${results.success.length}\n**Failed:** ${results.errors.length}\n\n${results.errors.length > 0 ? '**⚠️ ATTENTION:** Some checks failed. Please fix the issues below to ensure proper bot functionality.' : '**✅ ALL CHECKS PASSED:** Your server is properly configured!'}`)
            .addFields(
                {
                    name: `✅ Successful Checks (${results.success.length})`,
                    value: successText.substring(0, 1024) || 'None',
                    inline: false
                },
                {
                    name: `❌ Failed Checks (${results.errors.length})`,
                    value: errorsText.substring(0, 1024) || 'None',
                    inline: false
                }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Management', iconURL: LOGO_URL })
            .setTimestamp();

        await message.reply({ embeds: [resultsEmbed] });
    }
};
