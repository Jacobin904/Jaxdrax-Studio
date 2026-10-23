const { EmbedBuilder, MessageFlags, PermissionFlagsBits, ChannelType } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    name: 'config',
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

        const guild = message.guild;
        const results = {
            success: [],
            errors: []
        };

        // ==================== VÉRIFICATIONS AUTOMATIQUES ====================

        // Vérification 1: Permissions du bot
        const botMember = guild.members.me;
        const botPermissions = botMember.permissions;

        const requiredBotPermissions = [
            { name: 'Manage Channels', flag: PermissionFlagsBits.ManageChannels },
            { name: 'Manage Roles', flag: PermissionFlagsBits.ManageRoles },
            { name: 'Manage Messages', flag: PermissionFlagsBits.ManageMessages },
            { name: 'Attach Files', flag: PermissionFlagsBits.AttachFiles },
            { name: 'View Channel', flag: PermissionFlagsBits.ViewChannel },
            { name: 'Send Messages', flag: PermissionFlagsBits.SendMessages },
            { name: 'Read Message History', flag: PermissionFlagsBits.ReadMessageHistory },
            { name: 'Embed Links', flag: PermissionFlagsBits.EmbedLinks },
            { name: 'Use External Emojis', flag: PermissionFlagsBits.UseExternalEmojis }
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
            const role = guild.roles.cache.find(r => r.name === roleName);
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
                const ch = guild.channels.cache.get(channel.id);
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
            const memberRole = guild.roles.cache.get(process.env.MEMBER_ROLE_ID);
            if (memberRole) {
                results.success.push(`Member role "${memberRole.name}" exists`);
            } else {
                results.errors.push(`Member role ID is set but role NOT FOUND`);
            }
        } else {
            results.errors.push(`Member role ID is NOT configured`);
        }

        // ==================== DUMP DE CONFIGURATION ====================

        const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).map(c => `\`${c.id}\` - ${c.name}`).join('\n') || 'None';
        const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).map(c => `\`${c.id}\` - ${c.name}`).join('\n') || 'None';
        const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).map(c => `\`${c.id}\` - ${c.name}`).join('\n') || 'None';
        const roles = guild.roles.cache.filter(r => r.name !== '@everyone').sort((a, b) => b.position - a.position).map(r => `\`${r.id}\` - ${r.name} (${r.hexColor})`).join('\n') || 'None';

        // ==================== PREMIER EMBED: VÉRIFICATIONS ====================

        const successText = results.success.length > 0 
            ? results.success.map(s => `✅ ${s}`).join('\n')
            : 'No successful checks.';

        const errorsText = results.errors.length > 0
            ? results.errors.map(e => `❌ ${e}`).join('\n')
            : 'No errors found. All checks passed!';

        const checksEmbed = new EmbedBuilder()
            .setColor(results.errors.length > 0 ? COLORS.red : '#2ecc71')
            .setTitle('Server Configuration - Automatic Checks')
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
            .setFooter({ text: 'Jaxdrax Studio Configuration Tool', iconURL: LOGO_URL })
            .setTimestamp();

        await message.reply({ embeds: [checksEmbed] });

        // ==================== DEUXIÈME EMBED: DUMP COMPLET EN DM ====================

        const processingEmbed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Sending Full Configuration Dump')
            .setDescription('The complete server configuration is being sent to your DMs. Please check your private messages.')
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Configuration Tool', iconURL: LOGO_URL })
            .setTimestamp();

        await message.reply({ embeds: [processingEmbed], flags: MessageFlags.Ephemeral });

        const configEmbed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Server Configuration Dump - Complete Report')
            .setDescription(`Full configuration data for **${guild.name}** (ID: \`${guild.id}\`).\n\n**Server Overview:**\n• Total Members: ${guild.memberCount}\n• Owner: <@${guild.ownerId}>\n• Created: <t:${Math.floor(guild.createdTimestamp / 1000)}:F>\n• Boost Level: ${guild.premiumTier}\n• Boosts: ${guild.premiumSubscriptionCount}`)
            .addFields(
                { name: `Categories (${guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size})`, value: categories.substring(0, 1024) },
                { name: `Text Channels (${guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size})`, value: textChannels.substring(0, 1024) },
                { name: `Voice Channels (${guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size})`, value: voiceChannels.substring(0, 1024) },
                { name: `Roles (${guild.roles.cache.size - 1})`, value: roles.substring(0, 1024) }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Configuration Tool', iconURL: LOGO_URL })
            .setTimestamp();

        try {
            await message.author.send({ embeds: [configEmbed] });
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('DM Delivery Failed')
                .setDescription('I could not send you the configuration dump via DM. Please ensure that "Allow direct messages from server members" is enabled in your privacy settings for this server.')
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Configuration Tool', iconURL: LOGO_URL })
                .setTimestamp();
            await message.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        }
    }
};
