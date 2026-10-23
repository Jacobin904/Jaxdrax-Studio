const {
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits,
    PermissionsBitField,
    ChannelType
} = require('discord.js');

const fs = require('fs');
const path = require('path');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Permissions EXACTES pour chaque role (ni plus, ni moins)
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

function buildPlan(guild) {
    const changes = [];
    const blocked = [];
    const missing = [];

    const me = guild.members.me;
    const botTop = me.roles.highest.position;
    const missingRoles = new Set();

    const roleByName = name =>
        guild.roles.cache.find(r => r.name === name && !r.managed) || null;

    // Verification des permissions globales des roles
    const planRole = (role, expectedPerms, label) => {
        if (!role) return;

        if (role.position >= botTop) {
            blocked.push(`${label}: hierarchy blocks the bot from editing this role.`);
            return;
        }

        const currentPerms = role.permissions.toArray();
        const toAdd = [];
        const toRemove = [];

        // Permissions a ajouter
        for (const perm of expectedPerms) {
            if (PermissionFlagsBits[perm] && !role.permissions.has(PermissionFlagsBits[perm])) {
                toAdd.push(perm);
            }
        }

        // Permissions dangereuses a retirer (sauf pour les roles staff)
        const isStaffRole = STAFF_ROLES.includes(role.name);
        if (!isStaffRole) {
            for (const perm of DANGEROUS_PERMISSIONS) {
                if (PermissionFlagsBits[perm] && role.permissions.has(PermissionFlagsBits[perm])) {
                    toRemove.push(perm);
                }
            }
        }

        if (toAdd.length > 0 || toRemove.length > 0) {
            changes.push({ kind: 'role', id: role.id, label, toAdd, toRemove });
        }
    };

    // Planifier les modifications pour chaque role
    for (const [name, perms] of Object.entries(ROLE_PERMISSIONS)) {
        const role = roleByName(name);
        if (!role) missingRoles.add(name);
        else planRole(role, perms, `Role ${name}`);
    }

    for (const name of STAFF_ROLES) {
        const role = roleByName(name);
        if (!role) missingRoles.add(name);
        else planRole(role, STAFF_PERMISSIONS, `Role ${name}`);
    }

    // Overrides par salon
    for (const [type, config] of Object.entries(CHANNEL_OVERRIDES)) {
        const targets = guild.channels.cache.filter(
            c => c.type === ChannelType.GuildText && config.channels.includes(c.name)
        );

        for (const channel of targets.values()) {
            const canManage = channel.permissionsFor(me.id)
                ?.has(PermissionFlagsBits.ManageChannels);

            if (!canManage) {
                blocked.push(`#${channel.name}: bot lacks ManageChannels in this channel.`);
                continue;
            }

            for (const roleName of config.roles) {
                const role = roleByName(roleName);
                if (!role) {
                    missingRoles.add(roleName);
                    continue;
                }

                const overwrite = channel.permissionOverwrites?.cache?.get(role.id);
                const toAllow = [];
                const toDeny = [];

                // Permissions a autoriser
                for (const perm of config.allow) {
                    if (PermissionFlagsBits[perm] && !overwrite?.allow.has(PermissionFlagsBits[perm])) {
                        toAllow.push(perm);
                    }
                }

                // Permissions a refuser
                for (const perm of config.deny) {
                    if (PermissionFlagsBits[perm] && !overwrite?.deny.has(PermissionFlagsBits[perm])) {
                        toDeny.push(perm);
                    }
                }

                if (toAllow.length > 0 || toDeny.length > 0) {
                    changes.push({
                        kind: 'channel',
                        id: channel.id,
                        roleId: role.id,
                        label: `#${channel.name} -> ${role.name}`,
                        toAllow,
                        toDeny
                    });
                }
            }
        }
    }

    return { changes, blocked, missing: Array.from(missingRoles) };
}

function createBackup(guild) {
    const backup = {
        guildId: guild.id,
        guildName: guild.name,
        createdAt: new Date().toISOString(),
        roles: Array.from(guild.roles.cache.values()).map(role => ({
            id: role.id,
            name: role.name,
            permissions: role.permissions.toArray()
        })),
        channels: Array.from(guild.channels.cache.values()).map(channel => ({
            id: channel.id,
            name: channel.name,
            type: channel.type,
            overwrites: Array.from(channel.permissionOverwrites?.cache?.values() || []).map(o => ({
                id: o.id,
                type: o.type,
                allow: o.allow.toArray(),
                deny: o.deny.toArray()
            }))
        }))
    };

    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const filename = `permissions-backup-${Date.now()}.json`;
    const filepath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf8');

    return { filepath, filename };
}

function formatList(items, limit = 20) {
    if (items.length === 0) return 'None';
    const shown = items.slice(0, limit).map(item => `- ${item}`).join('\n');
    const remaining = items.length - Math.min(items.length, limit);
    return remaining > 0 ? `${shown}\n... and ${remaining} more.` : shown;
}

module.exports = {
    name: 'setup',

    async execute(message) {
        const isStaff = message.member?.roles.cache.some(
            role => STAFF_ROLES.includes(role.name)
        ) || false;

        if (!isStaff) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('Access Denied')
                        .setDescription('This command modifies server permissions and is restricted to staff.')
                        .setTimestamp()
                ],
                flags: MessageFlags.Ephemeral
            });
        }

        const guild = message.guild;
        const me = guild.members.me;

        const args = message.content.trim().split(/\s+/).slice(1).map(a => a.toLowerCase());
        const shouldApply = args.includes('apply');

        const globalProblems = [];
        if (!me.permissions.has(PermissionFlagsBits.ManageChannels)) {
            globalProblems.push('ManageChannels');
        }
        if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            globalProblems.push('ManageRoles');
        }

        if (globalProblems.length > 0) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('Setup Cannot Run')
                        .setDescription(
                            `The bot is missing required global permissions: **${globalProblems.join(', ')}**.\n\n` +
                            'Grant these to the Bot role first, then run !setup again.\n' +
                            'Nothing has been modified.'
                        )
                        .setTimestamp()
                ],
                flags: MessageFlags.Ephemeral
            });
        }

        const plan = buildPlan(guild);

        if (!shouldApply) {
            const addList = plan.changes
                .filter(c => (c.toAdd?.length || 0) + (c.toAllow?.length || 0) > 0)
                .map(c => {
                    const adds = [...(c.toAdd || []), ...(c.toAllow || [])];
                    return `${c.label}: +${adds.join(', ')}`;
                });

            const removeList = plan.changes
                .filter(c => (c.toRemove?.length || 0) + (c.toDeny?.length || 0) > 0)
                .map(c => {
                    const removes = [...(c.toRemove || []), ...(c.toDeny || [])];
                    return `${c.label}: -${removes.join(', ')}`;
                });

            const embed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Permission Setup - Preview Only')
                .setDescription(
                    '**No permission has been modified.**\n\n' +
                    'This is the plan the bot would apply. Review it, then run `!setup apply` to execute.\n\n' +
                    '**Scope:** The bot will add missing permissions AND remove dangerous permissions from non-staff roles.'
                )
                .addFields(
                    {
                        name: `Permissions to Add (${addList.length})`,
                        value: formatList(addList),
                        inline: false
                    },
                    {
                        name: `Permissions to Remove (${removeList.length})`,
                        value: formatList(removeList),
                        inline: false
                    },
                    {
                        name: `Blocked (${plan.blocked.length})`,
                        value: formatList(plan.blocked, 10),
                        inline: false
                    },
                    {
                        name: `Missing Roles (${plan.missing.length})`,
                        value: plan.missing.length > 0 ? plan.missing.join(', ') : 'None',
                        inline: false
                    }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Preview only - run !setup apply to execute', iconURL: LOGO_URL })
                .setTimestamp();

            return message.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (plan.changes.length === 0) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(COLORS.dark)
                        .setTitle('Nothing To Apply')
                        .setDescription('All permissions are already correctly configured.')
                        .setTimestamp()
                ],
                flags: MessageFlags.Ephemeral
            });
        }

        await message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(COLORS.dark)
                    .setTitle('Applying Permission Plan')
                    .setDescription(`Backing up current permissions, then applying ${plan.changes.length} changes...`)
                    .setTimestamp()
            ],
            flags: MessageFlags.Ephemeral
        });

        let backupInfo = null;
        try {
            backupInfo = createBackup(guild);
        } catch (error) {
            backupInfo = null;
        }

        const applied = [];
        const failed = [];
        const reason = `Permission setup requested by ${message.author.tag} (${message.author.id})`;

        for (const change of plan.changes) {
            try {
                if (change.kind === 'role') {
                    const role = await guild.roles.fetch(change.id);
                    let newPerms = role.permissions;

                    for (const perm of change.toAdd) {
                        newPerms = newPerms.add(PermissionFlagsBits[perm]);
                    }

                    for (const perm of change.toRemove) {
                        newPerms = newPerms.remove(PermissionFlagsBits[perm]);
                    }

                    await role.edit({
                        permissions: newPerms.bitfield,
                        reason
                    });

                    const adds = change.toAdd.length > 0 ? `+${change.toAdd.join(', ')}` : '';
                    const removes = change.toRemove.length > 0 ? `-${change.toRemove.join(', ')}` : '';
                    applied.push(`${change.label}: ${adds} ${removes}`.trim());
                } else {
                    const channel = await guild.channels.fetch(change.id);
                    const options = {};

                    for (const perm of change.toAllow) {
                        options[perm] = true;
                    }

                    for (const perm of change.toDeny) {
                        options[perm] = false;
                    }

                    await channel.permissionOverwrites.edit(change.roleId, options, { reason });

                    const allows = change.toAllow.length > 0 ? `+${change.toAllow.join(', ')}` : '';
                    const denies = change.toDeny.length > 0 ? `-${change.toDeny.join(', ')}` : '';
                    applied.push(`${change.label}: ${allows} ${denies}`.trim());
                }
            } catch (error) {
                failed.push(`${change.label}: ${String(error.message).slice(0, 120)}`);
            }
        }

        const report = new EmbedBuilder()
            .setColor(failed.length > 0 ? COLORS.red : '#2ecc71')
            .setTitle('Permission Setup - Results')
            .setDescription(
                `**Applied:** ${applied.length}\n` +
                `**Failed:** ${failed.length}\n` +
                `**Blocked during preview:** ${plan.blocked.length}\n\n` +
                (backupInfo
                    ? `Backup saved on the server: \`${backupInfo.filename}\``
                    : 'Backup could not be written. Check the storage permission of the host.')
            )
            .addFields(
                { name: `Applied (${applied.length})`, value: formatList(applied), inline: false },
                { name: `Failed (${failed.length})`, value: formatList(failed, 10), inline: false }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Permission Setup', iconURL: LOGO_URL })
            .setTimestamp();

        await message.author.send({ embeds: [report] }).catch(() => null);

        if (backupInfo) {
            await message.author.send({
                content: 'Permission backup taken before the changes.',
                files: [{ attachment: backupInfo.filepath, name: backupInfo.filename }]
            }).catch(() => null);
        }

        const logChannel = guild.channels.cache.get(process.env.DEV_LOGS_CHANNEL_ID);
        if (logChannel) {
            await logChannel.send({ embeds: [report] }).catch(() => null);
        }

        await message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(failed.length > 0 ? COLORS.red : '#2ecc71')
                    .setTitle('Setup Finished')
                    .setDescription(
                        `${applied.length} permission changes applied, ${failed.length} failed.\n` +
                        'The full report and the backup file were sent to your DMs.'
                    )
                    .setTimestamp()
            ],
            flags: MessageFlags.Ephemeral
        });
    }
};
