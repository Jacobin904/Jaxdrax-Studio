const { EmbedBuilder, MessageFlags, PermissionFlagsBits, ChannelType } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    name: 'config',
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

        const guild = message.guild;
        const results = {
            success: [],
            errors: []
        };

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

        for (const roleName of STAFF_ROLES) {
            const role = guild.roles.cache.find(r => r.name === roleName);
            if (role) {
                results.success.push(`Staff role "${roleName}" exists`);
            } else {
                results.errors.push(`Staff role "${roleName}" is MISSING`);
            }
        }

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

        const processingEmbed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Generating Complete Permissions Dump')
            .setDescription('Generating complete dump of all roles, channels, and permissions. This may take a few seconds...')
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Configuration Tool', iconURL: LOGO_URL })
            .setTimestamp();

        await message.reply({ embeds: [processingEmbed] });

        try {
            let fullReport = `═══════════════════════════════════════════\n`;
            fullReport += `SERVER CONFIGURATION DUMP - ${guild.name}\n`;
            fullReport += `Generated: ${new Date().toLocaleString()}\n`;
            fullReport += `═══════════════════════════════════════════\n\n`;

            fullReport += `┌─────────────────────────────────────────┐\n`;
            fullReport += `│ SERVER INFORMATION                    │\n`;
            fullReport += `└─────────────────────────────────────────┘\n`;
            fullReport += `Server Name: ${guild.name}\n`;
            fullReport += `Server ID: ${guild.id}\n`;
            fullReport += `Owner: ${guild.members.cache.get(guild.ownerId)?.user.tag || 'Unknown'} (${guild.ownerId})\n`;
            fullReport += `Members: ${guild.memberCount}\n`;
            fullReport += `Created: ${new Date(guild.createdTimestamp).toLocaleString()}\n`;
            fullReport += `Boost Level: ${guild.premiumTier}\n`;
            fullReport += `Boosts: ${guild.premiumSubscriptionCount}\n\n`;

            fullReport += `┌─────────────────────────────────────────┐\n`;
            fullReport += `│ ROLES AND PERMISSIONS                 │\n`;
            fullReport += `└─────────────────────────────────────────┘\n\n`;

            const roles = guild.roles.cache.filter(r => r.name !== '@everyone').sort((a, b) => b.position - a.position);
            
            for (const role of roles.values()) {
                fullReport += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                fullReport += `ROLE: ${role.name}\n`;
                fullReport += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                fullReport += `Role ID: ${role.id}\n`;
                fullReport += `Color: ${role.hexColor}\n`;
                fullReport += `Position: ${role.position}\n`;
                fullReport += `Members: ${role.members.size}\n`;
                fullReport += `Hoisted: ${role.hoist ? 'Yes' : 'No'}\n`;
                fullReport += `Mentionable: ${role.mentionable ? 'Yes' : 'No'}\n`;
                fullReport += `Managed: ${role.managed ? 'Yes' : 'No'}\n\n`;
                
                fullReport += `PERMISSIONS:\n`;
                const permissions = role.permissions.toArray();
                
                if (permissions.length === 0) {
                    fullReport += `  • No special permissions\n`;
                } else {
                    for (const perm of permissions) {
                        fullReport += `  ✓ ${perm}\n`;
                    }
                }
                fullReport += `\n`;
            }

            fullReport += `┌─────────────────────────────────────────┐\n`;
            fullReport += `│ CHANNELS AND PERMISSION OVERRIDES     │\n`;
            fullReport += `└─────────────────────────────────────────┘\n\n`;

            const channels = guild.channels.cache.sort((a, b) => a.position - b.position);
            
            for (const channel of channels.values()) {
                fullReport += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                fullReport += `CHANNEL: ${channel.name}\n`;
                fullReport += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                fullReport += `Channel ID: ${channel.id}\n`;
                fullReport += `Type: ${ChannelType[channel.type] || 'Unknown'}\n`;
                
                if (channel.parent) {
                    fullReport += `Category: ${channel.parent.name} (${channel.parent.id})\n`;
                }
                
                fullReport += `Position: ${channel.position}\n`;
                fullReport += `NSFW: ${channel.nsfw ? 'Yes' : 'No'}\n`;
                
                if (channel.topic) {
                    fullReport += `Topic: ${channel.topic}\n`;
                }
                
                fullReport += `\nPERMISSION OVERRIDES:\n`;
                
                const overwrites = channel.permissionOverwrites?.cache;
                if (!overwrites || overwrites.size === 0) {
                    fullReport += `  • No permission overrides (inherits from category)\n`;
                } else {
                    for (const overwrite of overwrites.values()) {
                        const target = overwrite.type === 0 
                            ? guild.roles.cache.get(overwrite.id)
                            : guild.members.cache.get(overwrite.id);
                        
                        const targetName = target 
                            ? (overwrite.type === 0 ? `@role ${target.name}` : `@user ${target.user.tag}`)
                            : `Unknown (${overwrite.id})`;
                        
                        fullReport += `\n  ${targetName}:\n`;
                        
                        const allowed = overwrite.allow.toArray();
                        const denied = overwrite.deny.toArray();
                        
                        if (allowed.length > 0) {
                            fullReport += `    ALLOWED:\n`;
                            for (const perm of allowed) {
                                fullReport += `      ✓ ${perm}\n`;
                            }
                        }
                        
                        if (denied.length > 0) {
                            fullReport += `    DENIED:\n`;
                            for (const perm of denied) {
                                fullReport += `      ✗ ${perm}\n`;
                            }
                        }
                    }
                }
                fullReport += `\n`;
            }

            fullReport += `┌─────────────────────────────────────────┐\n`;
            fullReport += `│ BOT PERMISSIONS                       │\n`;
            fullReport += `└─────────────────────────────────────────┘\n\n`;
            
            fullReport += `Bot: ${botMember.user.tag}\n`;
            fullReport += `Bot ID: ${botMember.user.id}\n\n`;
            
            fullReport += `GLOBAL PERMISSIONS:\n`;
            const botPerms = botPermissions.toArray();
            for (const perm of botPerms) {
                fullReport += `  ✓ ${perm}\n`;
            }
            
            fullReport += `\n`;

            fullReport += `┌─────────────────────────────────────────┐\n`;
            fullReport += `│ ENVIRONMENT VARIABLES                 │\n`;
            fullReport += `└─────────────────────────────────────────┘\n\n`;
            
            for (const env of envVars) {
                fullReport += `${env.name}: ${env.value ? '✓ Set' : '✗ Missing'}\n`;
            }

            fullReport += `\n═══════════════════════════════════════════\n`;
            fullReport += `END OF REPORT\n`;
            fullReport += `═══════════════════════════════════════════\n`;

            const buffer = Buffer.from(fullReport, 'utf-8');
            
            const configEmbed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Complete Server Configuration Dump')
                .setDescription(`Full configuration data for **${guild.name}** with ALL permissions.\n\n**Report Contents:**\n• Server information\n• All roles with complete permissions (${roles.size} roles)\n• All channels with permission overrides (${channels.size} channels)\n• Bot permissions\n• Environment variables\n\n**File attached below contains the complete dump.**`)
                .addFields(
                    { name: 'Total Roles', value: roles.size.toString(), inline: true },
                    { name: 'Total Channels', value: channels.size.toString(), inline: true },
                    { name: 'Report Size', value: `${(buffer.length / 1024).toFixed(2)} KB`, inline: true }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Configuration Tool', iconURL: LOGO_URL })
                .setTimestamp();

            await message.author.send({ 
                embeds: [configEmbed],
                files: [{ attachment: buffer, name: `server-config-${guild.id}.txt` }]
            });

            const successEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('Configuration Dump Sent')
                .setDescription('The complete configuration dump has been sent to your DMs. Please check your private messages.')
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Configuration Tool', iconURL: LOGO_URL })
                .setTimestamp();

            await message.reply({ embeds: [successEmbed] });

        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Error Generating Dump')
                .setDescription(`An error occurred while generating the configuration dump:\n\n\`\`\`${error.message}\`\`\`\n\nPlease check the bot permissions and try again.`)
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Configuration Tool', iconURL: LOGO_URL })
                .setTimestamp();

            await message.reply({ embeds: [errorEmbed] });
        }
    }
};
