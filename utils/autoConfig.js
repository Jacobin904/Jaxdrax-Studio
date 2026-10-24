const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

// Permissions EXACTES pour chaque role
const ROLE_PERMISSIONS = {
    Bot: [
        'ViewChannel', 'SendMessages', 'ReadMessageHistory',
        'EmbedLinks', 'AttachFiles', 'ManageMessages',
        'ManageChannels', 'ManageRoles'
    ],
    Member: [
        'ViewChannel', 'SendMessages', 'ReadMessageHistory',
        'EmbedLinks', 'AttachFiles', 'UseExternalEmojis'
    ],
    VIP: [
        'ViewChannel', 'SendMessages', 'ReadMessageHistory',
        'EmbedLinks', 'AttachFiles', 'UseExternalEmojis'
    ],
    'Beta Tester': [
        'ViewChannel', 'SendMessages', 'ReadMessageHistory',
        'EmbedLinks', 'AttachFiles'
    ]
};

// Permissions pour les roles staff
const STAFF_PERMISSIONS = [
    'ViewChannel', 'SendMessages', 'ReadMessageHistory',
    'EmbedLinks', 'AttachFiles', 'ManageMessages',
    'KickMembers', 'BanMembers', 'TimeoutMembers',
    'ManageNicknames', 'ModerateMembers'
];

// Overrides EXACTS pour chaque type de salon
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

// Permissions dangereuses a RETIRER des roles non-staff
const DANGEROUS_PERMISSIONS = [
    'Administrator', 'ManageGuild', 'ManageRoles', 'ManageChannels',
    'ManageMessages', 'KickMembers', 'BanMembers', 'ManageNicknames',
    'ManageWebhooks', 'ManageEmojisAndStickers', 'ManageEvents',
    'ManageThreads', 'CreatePublicThreads', 'CreatePrivateThreads'
];

async function autoConfigure(client) {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    const me = guild.members.me;
    const botTop = me.roles.highest.position;
    const changes = [];
    const errors = [];

    console.log('[AutoConfig] Starting automatic configuration...');

    // Configuration des permissions globales des roles
    const roleByName = name =>
        guild.roles.cache.find(r => r.name === name && !r.managed) || null;

    // Configurer les roles standards
    for (const [name, perms] of Object.entries(ROLE_PERMISSIONS)) {
        const role = roleByName(name);
        if (!role) continue;

        if (role.position >= botTop) {
            errors.push(`Role ${name}: hierarchy blocks bot from editing`);
            continue;
        }

        try {
            let newPerms = role.permissions;
            const toAdd = [];
            const toRemove = [];

            // Ajouter les permissions manquantes
            for (const perm of perms) {
                if (PermissionFlagsBits[perm] && !role.permissions.has(PermissionFlagsBits[perm])) {
                    newPerms = newPerms.add(PermissionFlagsBits[perm]);
                    toAdd.push(perm);
                }
            }

            // Retirer les permissions dangereuses
            for (const perm of DANGEROUS_PERMISSIONS) {
                if (PermissionFlagsBits[perm] && role.permissions.has(PermissionFlagsBits[perm])) {
                    newPerms = newPerms.remove(PermissionFlagsBits[perm]);
                    toRemove.push(perm);
                }
            }

            if (toAdd.length > 0 || toRemove.length > 0) {
                await role.edit({
                    permissions: newPerms.bitfield,
                    reason: 'Automatic configuration by Jaxdrax Studio Bot'
                });

                const adds = toAdd.length > 0 ? `+${toAdd.join(', ')}` : '';
                const removes = toRemove.length > 0 ? `-${toRemove.join(', ')}` : '';
                changes.push(`Role ${name}: ${adds} ${removes}`.trim());
            }
        } catch (error) {
            errors.push(`Role ${name}: ${error.message}`);
        }
    }

    // Configurer les roles staff
    for (const name of STAFF_ROLES) {
        const role = roleByName(name);
        if (!role) continue;

        if (role.position >= botTop) {
            errors.push(`Role ${name}: hierarchy blocks bot from editing`);
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
                await role.edit({
                    permissions: newPerms.bitfield,
                    reason: 'Automatic configuration by Jaxdrax Studio Bot'
                });
                changes.push(`Role ${name}: +${toAdd.join(', ')}`);
            }
        } catch (error) {
            errors.push(`Role ${name}: ${error.message}`);
        }
    }

    // Configuration des overrides de salons
    for (const [type, config] of Object.entries(CHANNEL_OVERRIDES)) {
        const targets = guild.channels.cache.filter(
            c => c.type === ChannelType.GuildText && config.channels.includes(c.name)
        );

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

                    // Autoriser les permissions
                    for (const perm of config.allow) {
                        options[perm] = true;
                    }

                    // Refuser les permissions
                    for (const perm of config.deny) {
                        options[perm] = false;
                    }

                    await channel.permissionOverwrites.edit(role.id, options, {
                        reason: 'Automatic configuration by Jaxdrax Studio Bot'
                    });

                    const allows = config.allow.length > 0 ? `+${config.allow.join(', ')}` : '';
                    const denies = config.deny.length > 0 ? `-${config.deny.join(', ')}` : '';
                    changes.push(`#${channel.name} -> ${role.name}: ${allows} ${denies}`.trim());
                } catch (error) {
                    errors.push(`#${channel.name} -> ${role.name}: ${error.message}`);
                }
            }
        }
    }

    // Logger les resultats
    const devLogsChannel = guild.channels.cache.get(process.env.DEV_LOGS_CHANNEL_ID);
    if (devLogsChannel) {
        const report = new EmbedBuilder()
            .setColor(errors.length > 0 ? COLORS.red : '#2ecc71')
            .setTitle('Automatic Configuration Complete')
            .setDescription(`The bot has automatically configured all permissions on startup.\n\n**Changes Applied:** ${changes.length}\n**Errors:** ${errors.length}`)
            .addFields(
                { name: `Changes (${changes.length})`, value: changes.length > 0 ? changes.slice(0, 20).join('\n') : 'None', inline: false },
                { name: `Errors (${errors.length})`, value: errors.length > 0 ? errors.slice(0, 20).join('\n') : 'None', inline: false }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Auto Configuration', iconURL: LOGO_URL })
            .setTimestamp();

        await devLogsChannel.send({ embeds: [report] });
    }

    console.log(`[AutoConfig] Configuration complete: ${changes.length} changes, ${errors.length} errors`);
}

module.exports = { autoConfigure };
