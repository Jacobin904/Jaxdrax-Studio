const { EmbedBuilder, MessageFlags, PermissionFlagsBits, ChannelType } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

module.exports = {
    name: 'config',
    async execute(message, isStaff) {
        if (!isStaff) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('<:circlexmarksolid:1563676313770791134> Access Denied')
                .setDescription('This command is restricted to staff members only.')
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Security', iconURL: LOGO_URL })
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const guild = message.guild;
        const me = guild.members.me;
        const botTop = me.roles.highest.position;

        // Check bot permissions
        if (!me.permissions.has(PermissionFlagsBits.ManageChannels) || !me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor(COLORS.red)
                    .setTitle('<:circlexmarksolid:1563676313770791134> Missing Permissions')
                    .setDescription('The bot needs ManageChannels and ManageRoles permissions to configure the server.')
                    .setTimestamp()],
                flags: MessageFlags.Ephemeral
            });
        }

        await message.reply({
            embeds: [new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('<:gearsolid:1563675488222978068> Starting Configuration')
                .setDescription('Configuring all permissions... This may take a few seconds.')
                .setTimestamp()],
            flags: MessageFlags.Ephemeral
        });

        const changes = [];
        const errors = [];

        // Role permissions
        const ROLE_PERMISSIONS = {
            Bot: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles', 'ManageMessages', 'ManageChannels', 'ManageRoles'],
            Member: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles', 'UseExternalEmojis'],
            VIP: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles', 'UseExternalEmojis'],
            'Beta Tester': ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles']
        };

        const STAFF_PERMISSIONS = ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles', 'ManageMessages', 'KickMembers', 'BanMembers', 'TimeoutMembers', 'ManageNicknames', 'ModerateMembers'];

        // Channel overrides
        const CHANNEL_OVERRIDES = {
            public: {
                channels: ['general-chat', 'media', 'fish-talk', 'bot-commands', 'review'],
                roles: ['Member', 'VIP', 'Beta Tester'],
                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles'],
                deny: ['ManageChannels', 'ManageRoles', 'ManageMessages', 'Administrator']
            },
            info: {
                channels: ['rules', 'welcome', 'update', 'informations'],
                roles: ['Member', 'VIP', 'Beta Tester'],
                allow: ['ViewChannel', 'ReadMessageHistory'],
                deny: ['SendMessages', 'ManageChannels', 'ManageRoles', 'ManageMessages', 'Administrator']
            },
            staff: {
                channels: ['staff-chat', 'moderator-only'],
                roles: STAFF_ROLES,
                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                deny: []
            },
            logs: {
                channels: ['dev-logs', 'ticket-transcripts'],
                roles: [...STAFF_ROLES, 'Bot'],
                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles'],
                deny: []
            }
        };

        // Dangerous permissions to remove from non-staff roles
        const DANGEROUS_PERMISSIONS = ['Administrator', 'ManageGuild', 'ManageRoles', 'ManageChannels', 'ManageMessages', 'KickMembers', 'BanMembers', 'ManageNicknames', 'ManageWebhooks', 'ManageEmojisAndStickers', 'ManageEvents', 'ManageThreads'];

        const roleByName = name => guild.roles.cache.find(r => r.name === name && !r.managed) || null;

        // Configure role permissions
        for (const [name, perms] of Object.entries(ROLE_PERMISSIONS)) {
            const role = roleByName(name);
            if (!role) continue;

            if (role.position >= botTop) {
                errors.push(`Role ${name}: hierarchy blocks bot`);
                continue;
            }

            try {
                let newPerms = role.permissions;
                const toAdd = [];
                const toRemove = [];

                for (const perm of perms) {
                    if (PermissionFlagsBits[perm] && !role.permissions.has(PermissionFlagsBits[perm])) {
                        newPerms = newPerms.add(PermissionFlagsBits[perm]);
                        toAdd.push(perm);
                    }
                }

                for (const perm of DANGEROUS_PERMISSIONS) {
                    if (PermissionFlagsBits[perm] && role.permissions.has(PermissionFlagsBits[perm])) {
                        newPerms = newPerms.remove(PermissionFlagsBits[perm]);
                        toRemove.push(perm);
                    }
                }

                if (toAdd.length > 0 || toRemove.length > 0) {
                    await role.edit({ permissions: newPerms.bitfield, reason: 'Automatic configuration' });
                    changes.push(`Role ${name}: +${toAdd.join(', ')} -${toRemove.join(', ')}`);
                }
            } catch (error) {
                errors.push(`Role ${name}: ${error.message}`);
            }
        }

        // Configure staff roles
        for (const name of STAFF_ROLES) {
            const role = roleByName(name);
            if (!role) continue;

            if (role.position >= botTop) {
                errors.push(`Role ${name}: hierarchy blocks bot`);
                continue;
            }

            try {
                let newPerms = role.permissions;
                const toAdd = [];

                for (const perm of STAFF_PERMISSIONS) {
                    if (PermissionFlagsBits[perm] && !role.permissions.has(PermissionFlagsBits[perm])) {
                        newPerms = newPerms.add(PermissionFlagsBits[perm]);
                        toAdd.push(perm);
                    }
                }

                if (toAdd.length > 0) {
                    await role.edit({ permissions: newPerms.bitfield, reason: 'Automatic configuration' });
                    changes.push(`Role ${name}: +${toAdd.join(', ')}`);
                }
            } catch (error) {
                errors.push(`Role ${name}: ${error.message}`);
            }
        }

        // Configure channel overrides
        for (const [type, config] of Object.entries(CHANNEL_OVERRIDES)) {
            const targets = guild.channels.cache.filter(c => c.type === ChannelType.GuildText && config.channels.includes(c.name));

            for (const channel of targets.values()) {
                const canManage = channel.permissionsFor(me.id)?.has(PermissionFlagsBits.ManageChannels);
                if (!canManage) {
                    errors.push(`Channel #${channel.name}: bot lacks ManageChannels`);
                    continue;
                }

                for (const roleName of config.roles) {
                    const role = roleByName(roleName);
                    if (!role) continue;

                    try {
                        const options = {};
                        for (const perm of config.allow) options[perm] = true;
                        for (const perm of config.deny) options[perm] = false;

                        await channel.permissionOverwrites.edit(role.id, options, { reason: 'Automatic configuration' });
                        changes.push(`#${channel.name} -> ${role.name}`);
                    } catch (error) {
                        errors.push(`#${channel.name} -> ${role.name}: ${error.message}`);
                    }
                }
            }
        }

        // Generate full dump
        let fullReport = `═══════════════════════════════════════════\n`;
        fullReport += `SERVER CONFIGURATION DUMP - ${guild.name}\n`;
        fullReport += `Generated: ${new Date().toLocaleString()}\n`;
        fullReport += `═══════════════════════════════════════════\n\n`;

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
            fullReport += `Members: ${role.members.size}\n\n`;
            fullReport += `PERMISSIONS:\n`;
            const permissions = role.permissions.toArray();
            for (const perm of permissions) {
                fullReport += `  ✓ ${perm}\n`;
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
            fullReport += `Type: ${ChannelType[channel.type] || 'Unknown'}\n\n`;
            fullReport += `PERMISSION OVERRIDES:\n`;
            const overwrites = channel.permissionOverwrites?.cache;
            if (!overwrites || overwrites.size === 0) {
                fullReport += `  • No permission overrides\n`;
            } else {
                for (const overwrite of overwrites.values()) {
                    const target = overwrite.type === 0 ? guild.roles.cache.get(overwrite.id) : guild.members.cache.get(overwrite.id);
                    const targetName = target ? (overwrite.type === 0 ? `@role ${target.name}` : `@user ${target.user.tag}`) : `Unknown (${overwrite.id})`;
                    fullReport += `\n  ${targetName}:\n`;
                    const allowed = overwrite.allow.toArray();
                    const denied = overwrite.deny.toArray();
                    if (allowed.length > 0) {
                        fullReport += `    ALLOWED:\n`;
                        for (const perm of allowed) fullReport += `      ✓ ${perm}\n`;
                    }
                    if (denied.length > 0) {
                        fullReport += `    DENIED:\n`;
                        for (const perm of denied) fullReport += `      ✗ ${perm}\n`;
                    }
                }
            }
            fullReport += `\n`;
        }

        const buffer = Buffer.from(fullReport, 'utf-8');

        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        const filename = `server-config-${guild.id}.txt`;
        const filepath = path.join(DATA_DIR, filename);
        fs.writeFileSync(filepath, buffer, 'utf8');

        // Final report
        const report = new EmbedBuilder()
            .setColor(errors.length > 0 ? COLORS.red : '#2ecc71')
            .setTitle('<:gearsolid:1563675488222978068> Configuration Complete')
            .setDescription(`<:circlechecksolid:1563676230224707674> **Changes Applied:** ${changes.length}\n<:circlexmarksolid:1563676313770791134> **Errors:** ${errors.length}\n\nThe complete configuration dump has been sent to your DMs.`)
            .addFields(
                { name: `<:circlechecksolid:1563676230224707674> Changes (${changes.length})`, value: changes.length > 0 ? changes.slice(0, 10).join('\n') : 'None', inline: false },
                { name: `<:circlexmarksolid:1563676313770791134> Errors (${errors.length})`, value: errors.length > 0 ? errors.slice(0, 10).join('\n') : 'None', inline: false }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Configuration Tool', iconURL: LOGO_URL })
            .setTimestamp();

        await message.author.send({ embeds: [report] }).catch(() => null);
        await message.author.send({ files: [{ attachment: filepath, name: filename }] }).catch(() => null);

        await message.reply({ embeds: [report], flags: MessageFlags.Ephemeral });
    }
};
