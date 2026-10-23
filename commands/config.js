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

/* ==========================================================
   PLAN DE PERMISSIONS (ADDITIF UNIQUEMENT)
   ========================================================== */

const ROLE_GRANTS = {
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

const STAFF_GRANTS = [
    'ViewChannel', 'SendMessages', 'ReadMessageHistory',
    'EmbedLinks', 'AttachFiles', 'ManageMessages'
];

const CHANNEL_PLAN = [
    {
        channels: ['general-chat', 'media', 'fish-talk', 'bot-commands', 'review'],
        roles: ['Member', 'VIP', 'Beta Tester'],
        perms: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles']
    },
    {
        channels: ['rules', 'welcome', 'update', 'informations'],
        roles: ['Member', 'VIP', 'Beta Tester'],
        perms: ['ViewChannel', 'ReadMessageHistory']
    },
    {
        channels: ['staff-chat', 'moderator-only'],
        roles: STAFF_ROLES,
        perms: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
    },
    {
        channels: ['dev-logs', 'ticket-transcripts'],
        roles: STAFF_ROLES,
        perms: ['ViewChannel', 'ReadMessageHistory']
    },
    {
        channels: ['dev-logs', 'ticket-transcripts'],
        roles: ['Bot'],
        perms: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles']
    }
];

/* ==========================================================
   CONSTRUCTION DU PLAN (AUCUNE ECRITURE ICI)
   ========================================================== */

function buildPlan(guild) {
    const changes = [];
    const blocked = [];
    const missing = [];

    const me = guild.members.me;
    const botTop = me.roles.highest.position;
    const missingRoles = new Set();

    const roleByName = name =>
        guild.roles.cache.find(r => r.name === name && !r.managed) || null;

    // --- Permissions globales des roles ---
    const planRole = (role, perms, label) => {
        if (!role) return;

        if (role.permissions.has(PermissionFlagsBits.Administrator)) {
            blocked.push(`${label}: already has Administrator, left untouched.`);
            return;
        }

        if (role.position >= botTop) {
            blocked.push(`${label}: hierarchy blocks the bot from editing this role.`);
            return;
        }

        const lack = perms.filter(
            p => PermissionFlagsBits[p] && !role.permissions.has(PermissionFlagsBits[p])
        );

        if (lack.length > 0) {
            changes.push({ kind: 'role', id: role.id, label, perms: lack });
        }
    };

    for (const [name, perms] of Object.entries(ROLE_GRANTS)) {
        const role = roleByName(name);
        if (!role) missingRoles.add(name);
        else planRole(role, perms, `Role ${name}`);
    }

    for (const name of STAFF_ROLES) {
        const role = roleByName(name);
        if (!role) missingRoles.add(name);
        else planRole(role, STAFF_GRANTS, `Role ${name}`);
    }

    // --- Overrides par salon ---
    for (const entry of CHANNEL_PLAN) {
        const targets = guild.channels.cache.filter(
            c => c.type === ChannelType.GuildText && entry.channels.includes(c.name)
        );

        for (const channel of targets.values()) {
            const canManage = channel.permissionsFor(me.id)
                ?.has(PermissionFlagsBits.ManageChannels);

            if (!canManage) {
                blocked.push(`#${channel.name}: bot lacks ManageChannels in this channel.`);
                continue;
            }

            for (const roleName of entry.roles) {
                const role = roleByName(roleName);
                if (!role) {
                    missingRoles.add(roleName);
                    continue;
                }

                if (role.permissions.has(PermissionFlagsBits.Administrator)) continue;

                const overwrite = channel.permissionOverwrites?.cache?.get(role.id);
                const lack = entry.perms.filter(
                    p => PermissionFlagsBits[p] && !overwrite?.allow.has(PermissionFlagsBits[p])
                );

                if (lack.length > 0) {
                    changes.push({
                        kind: 'channel',
                        id: channel.id,
                        roleId: role.id,
                        label: `#${channel.name} -> ${role.name}`,
                        perms: lack
                    });
                }
            }
        }
    }

    return {
        changes,
        blocked,
        missing: Array.from(missingRoles)
    };
}

/* ==========================================================
   SAUVEGARDE AVANT APPLICATION
   ========================================================== */

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

/* ==========================================================
   FORMATAGE
   ========================================================== */

function formatList(items, limit = 20) {
    if (items.length === 0) return 'None';
    const shown = items.slice(0, limit).map(item => `- ${item}`).join('\n');
    const remaining = items.length - Math.min(items.length, limit);
    return remaining > 0 ? `${shown}\n... and ${remaining} more.` : shown;
}

/* ==========================================================
   COMMANDE
   ========================================================== */

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

        // Verification des prealables
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

        // --- APERCU (aucune ecriture) ---
        if (!shouldApply) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Permission Setup - Preview Only')
                .setDescription(
                    '**No permission has been modified.**\n\n' +
                    'This is the plan the bot would apply. Review it, then run `!setup apply` to execute.\n\n' +
                    '**Scope:** additive grants only. No permission is removed, no deny rule is added, ' +
                    'no role hierarchy is changed, and @everyone is never touched.'
                )
                .addFields(
                    {
                        name: `Planned Changes (${plan.changes.length})`,
                        value: formatList(
                            plan.changes.map(c => `${c.label}: +${c.perms.join(', ')}`)
                        ),
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

        // --- APPLICATION ---
        if (plan.changes.length === 0) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(COLORS.dark)
                        .setTitle('Nothing To Apply')
                        .setDescription(
                            'All planned permissions are already present.\n\n' +
                            'Note: this tool only adds missing permissions. It does not remove ' +
                            'excessive permissions or create deny rules for private channels.'
                        )
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
                    const bits = change.perms.map(p => PermissionFlagsBits[p]);
                    const updated = role.permissions.add(...bits);

                    await role.edit({
                        permissions: new PermissionsBitField(updated).bitfield,
                        reason
                    });
                } else {
                    const channel = await guild.channels.fetch(change.id);
                    const options = {};
                    for (const perm of change.perms) options[perm] = true;

                    await channel.permissionOverwrites.edit(change.roleId, options, { reason });
                }

                applied.push(`${change.label}: +${change.perms.join(', ')}`);
            } catch (error) {
                failed.push(`${change.label}: ${String(error.message).slice(0, 120)}`);
            }
        }

        // --- RAPPORT ---
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
