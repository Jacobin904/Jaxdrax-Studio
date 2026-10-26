const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');

const fs = require('fs');
const path = require('path');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

const DATA_DIR = path.join(__dirname, '..', 'data');

const MEMBER_ROLES = ['Member', 'VIP', 'Beta Tester', 'Verified'];

const BASIC_PERMISSIONS = [
    'ViewChannel',
    'SendMessages',
    'ReadMessageHistory',
    'EmbedLinks',
    'AttachFiles',
    'UseExternalEmojis'
];

const STAFF_PERMISSIONS = [
    'ViewChannel',
    'SendMessages',
    'ReadMessageHistory',
    'EmbedLinks',
    'AttachFiles',
    'ManageMessages',
    'ModerateMembers',
    'KickMembers',
    'BanMembers',
    'TimeoutMembers',
    'ManageNicknames'
];

const BOT_PERMISSIONS = [
    'ViewChannel',
    'SendMessages',
    'ReadMessageHistory',
    'EmbedLinks',
    'AttachFiles',
    'ManageMessages',
    'ManageChannels',
    'ManageRoles'
];

const DANGEROUS_PERMISSIONS = [
    'Administrator',
    'ManageGuild',
    'ManageRoles',
    'ManageChannels',
    'ManageWebhooks',
    'ManageEmojisAndStickers',
    'ManageEvents',
    'KickMembers',
    'BanMembers'
];

const CHANNEL_PLANS = [
    {
        label: 'Community',
        names: ['general-chat', 'media', 'fish-talk', 'bot-commands', 'review'],
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles'],
        deny: ['ManageChannels', 'ManageRoles', 'ManageMessages'],
        private: false
    },
    {
        label: 'Read Only',
        names: ['rules', 'welcome', 'update', 'informations', 'info'],
        allow: ['ViewChannel', 'ReadMessageHistory'],
        deny: ['SendMessages', 'ManageChannels', 'ManageRoles', 'ManageMessages'],
        private: false
    },
    {
        label: 'Staff Only',
        names: ['staff-chat', 'moderator-only', 'dev-logs', 'ticket-transcripts'],
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles'],
        deny: [],
        private: true
    }
];

function fit(text, max = 1000) {
    const value = String(text || 'None');
    return value.length > max ? value.substring(0, max - 20) + '\n... (truncated)' : value;
}

function runtime(source) {
    const isInteraction = typeof source.deferReply === 'function';
    return {
        isInteraction,
        guild: source.guild,
        channel: source.channel,
        member: source.member,
        user: isInteraction ? source.user : source.author
    };
}

async function sendFinal(source, payload) {
    if (typeof source.deferReply !== 'function') {
        return source.channel.send(payload);
    }

    if (source.replied || source.deferred) {
        return source.editReply(payload).catch(() => source.followUp(payload));
    }

    return source.reply({ ...payload, flags: MessageFlags.Ephemeral });
}

function buildReport(guild, changes, errors, preview) {
    let report = '===========================================\n';
    report += 'JAXDRAX STUDIO - SERVER CONFIGURATION DUMP\n';
    report += 'Server: ' + guild.name + '\n';
    report += 'Server ID: ' + guild.id + '\n';
    report += 'Generated: ' + new Date().toISOString() + '\n';
    report += 'Mode: ' + (preview ? 'PREVIEW (no changes applied)' : 'LIVE (changes applied)') + '\n';
    report += '===========================================\n\n';

    report += '-------------------------------------------\n';
    report += 'APPLIED CHANGES (' + changes.length + ')\n';
    report += '-------------------------------------------\n';
    report += (changes.length ? changes.join('\n') : 'No changes required.') + '\n\n';

    report += '-------------------------------------------\n';
    report += 'ERRORS / SKIPPED (' + errors.length + ')\n';
    report += '-------------------------------------------\n';
    report += (errors.length ? errors.join('\n') : 'None.') + '\n\n';

    report += '-------------------------------------------\n';
    report += 'ROLES AND PERMISSIONS\n';
    report += '-------------------------------------------\n';

    const roles = guild.roles.cache.filter(r => r.name !== '@everyone').sort((a, b) => b.position - a.position);

    for (const role of roles.values()) {
        report += '\nROLE: ' + role.name + '\n';
        report += 'ID: ' + role.id + ' | Position: ' + role.position + ' | Members: ' + role.members.size + '\n';
        report += 'Managed: ' + (role.managed ? 'yes' : 'no') + ' | Color: ' + role.hexColor + '\n';
        report += 'Permissions: ' + (role.permissions.toArray().join(', ') || 'none') + '\n';
    }

    report += '\n-------------------------------------------\n';
    report += 'CHANNELS AND OVERRIDES\n';
    report += '-------------------------------------------\n';

    const channels = guild.channels.cache.sort((a, b) => a.position - b.position);

    for (const channel of channels.values()) {
        report += '\nCHANNEL: ' + channel.name + '\n';
        report += 'ID: ' + channel.id + ' | Type: ' + channel.type + ' | Category: ' + (channel.parentId || 'none') + '\n';

        const overwrites = channel.permissionOverwrites?.cache;

        if (!overwrites || overwrites.size === 0) {
            report += 'Overrides: none\n';
            continue;
        }

        for (const overwrite of overwrites.values()) {
            const target = overwrite.type === 0
                ? guild.roles.cache.get(overwrite.id)
                : guild.members.cache.get(overwrite.id);

            const name = target
                ? (overwrite.type === 0 ? '@role ' + target.name : '@user ' + (target.user?.tag || target.id))
                : overwrite.id;

            report += '  ' + name + '\n';
            report += '    ALLOW: ' + (overwrite.allow.toArray().join(', ') || 'none') + '\n';
            report += '    DENY: ' + (overwrite.deny.toArray().join(', ') || 'none') + '\n';
        }
    }

    return report;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Audits and configures server roles, channels and permissions')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addBooleanOption(option =>
            option
                .setName('preview')
                .setDescription('Show what would change without applying anything')
                .setRequired(false)
        ),

    name: 'config',
    description: 'Audits and configures server roles, channels and permissions',

    async execute(source, isStaffFlag, client) {
        const ctx = runtime(source);
        const guild = ctx.guild;
        const user = ctx.user;

        if (!guild) {
            return sendFinal(source, {
                content: 'This command can only be used inside the server.',
                flags: MessageFlags.Ephemeral
            });
        }

        const isStaff = ctx.member?.roles?.cache?.some(r => STAFF_ROLES.includes(r.name)) || isStaffFlag;

        if (!isStaff) {
            return sendFinal(source, {
                embeds: [
                    new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('Access Denied')
                        .setDescription(
                            'This command is restricted to the staff team.\n\n' +
                            'Required roles: ' + STAFF_ROLES.join(', ') + '.\n' +
                            'If you believe you should have access, open a support ticket from the information panel.'
                        )
                        .setFooter({ text: 'Jaxdrax Studio Security' })
                        .setTimestamp()
                ],
                flags: MessageFlags.Ephemeral
            });
        }

        const me = guild.members.me;
        const botTop = me.roles.highest?.position || 0;

        const missing = [];
        if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) missing.push('Manage Roles');
        if (!me.permissions.has(PermissionFlagsBits.ManageChannels)) missing.push('Manage Channels');

        if (missing.length > 0) {
            return sendFinal(source, {
                embeds: [
                    new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('Missing Bot Permissions')
                        .setDescription('The bot cannot run the configuration without the following permissions:\n' + missing.map(p => '- ' + p).join('\n'))
                        .addFields({
                            name: 'How To Fix',
                            value: 'Move the bot role above the roles it needs to manage in Server Settings, then enable the missing permissions and run the command again.'
                        })
                        .setFooter({ text: 'Jaxdrax Studio Configuration' })
                        .setTimestamp()
                ],
                flags: MessageFlags.Ephemeral
            });
        }

        let preview = false;

        if (ctx.isInteraction && source.options) {
            preview = source.options.getBoolean('preview') || false;
        } else {
            preview = String(source.content || '').toLowerCase().includes('--preview');
        }

        if (ctx.isInteraction) {
            await source.deferReply({ flags: MessageFlags.Ephemeral });
        }

        const changes = [];
        const errors = [];

        const roleByName = name => guild.roles.cache.find(r => r.name === name && !r.managed) || null;

        const rolePlans = [];

        for (const name of MEMBER_ROLES) {
            rolePlans.push({ name, permissions: BASIC_PERMISSIONS, stripDangerous: true });
        }

        rolePlans.push({ name: 'Bot', permissions: BOT_PERMISSIONS, stripDangerous: false });

        for (const name of STAFF_ROLES) {
            rolePlans.push({ name, permissions: STAFF_PERMISSIONS, stripDangerous: false });
        }

        for (const plan of rolePlans) {
            const role = roleByName(plan.name);
            if (!role) continue;

            if (role.position >= botTop || role.id === guild.roles.everyone.id) {
                errors.push('Role "' + plan.name + '": skipped (higher than or equal to the bot role).');
                continue;
            }

            try {
                let bits = role.permissions;
                const added = [];
                const removed = [];

                for (const perm of plan.permissions) {
                    const bit = PermissionFlagsBits[perm];
                    if (bit && !role.permissions.has(bit)) {
                        bits = bits.add(bit);
                        added.push(perm);
                    }
                }

                if (plan.stripDangerous) {
                    for (const perm of DANGEROUS_PERMISSIONS) {
                        const bit = PermissionFlagsBits[perm];
                        if (bit && role.permissions.has(bit)) {
                            bits = bits.remove(bit);
                            removed.push(perm);
                        }
                    }
                }

                if (added.length === 0 && removed.length === 0) continue;

                if (!preview) {
                    await role.edit({ permissions: bits.bitfield, reason: 'Jaxdrax Studio configuration' });
                }

                changes.push(
                    (preview ? '[PREVIEW] ' : '') + 'Role ' + plan.name +
                    (added.length ? ' | added: ' + added.join(', ') : '') +
                    (removed.length ? ' | removed: ' + removed.join(', ') : '')
                );
            } catch (error) {
                errors.push('Role "' + plan.name + '": ' + error.message);
            }
        }

        for (const plan of CHANNEL_PLANS) {
            const targets = guild.channels.cache.filter(
                c => c.type === ChannelType.GuildText && plan.names.includes(c.name)
            );

            for (const channel of targets.values()) {
                if (!channel.permissionsFor(me)?.has(PermissionFlagsBits.ManageChannels)) {
                    errors.push('#' + channel.name + ': skipped (bot cannot manage this channel).');
                    continue;
                }

                const allowedRoles = plan.private ? [...STAFF_ROLES, 'Bot'] : [...MEMBER_ROLES, ...STAFF_ROLES, 'Bot'];

                if (plan.private) {
                    try {
                        const everyoneOptions = { ViewChannel: false, SendMessages: false };

                        if (!preview) {
                            await channel.permissionOverwrites.edit(guild.roles.everyone.id, everyoneOptions, { reason: 'Jaxdrax Studio configuration' });
                        }

                        changes.push((preview ? '[PREVIEW] ' : '') + '#' + channel.name + ' | locked to staff');
                    } catch (error) {
                        errors.push('#' + channel.name + ' (everyone): ' + error.message);
                    }
                }

                for (const roleName of allowedRoles) {
                    const role = roleByName(roleName);
                    if (!role) continue;

                    try {
                        const options = {};

                        for (const perm of plan.allow) options[perm] = true;
                        for (const perm of plan.deny) options[perm] = false;

                        if (plan.private && !STAFF_ROLES.includes(roleName) && roleName !== 'Bot') {
                            continue;
                        }

                        if (!preview) {
                            await channel.permissionOverwrites.edit(role.id, options, { reason: 'Jaxdrax Studio configuration' });
                        }

                        changes.push((preview ? '[PREVIEW] ' : '') + '#' + channel.name + ' -> ' + role.name);
                    } catch (error) {
                        errors.push('#' + channel.name + ' -> ' + role.name + ': ' + error.message);
                    }
                }
            }
        }

        const report = buildReport(guild, changes, errors, preview);

        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        const fileName = 'config-' + guild.id + '-' + Date.now() + '.txt';
        const filePath = path.join(DATA_DIR, fileName);
        fs.writeFileSync(filePath, Buffer.from(report, 'utf8'));

        let delivered = false;
        try {
            await user.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(COLORS.dark)
                        .setTitle('Configuration Report')
                        .setDescription('Full server configuration dump attached below.\nServer: ' + guild.name + '\nMode: ' + (preview ? 'Preview' : 'Live'))
                        .setTimestamp()
                ]
            });

            await user.send({ files: [{ attachment: filePath, name: fileName }] });
            delivered = true;
        } catch (error) {
            delivered = false;
        }

        const resultEmbed = new EmbedBuilder()
            .setColor(errors.length > 0 ? COLORS.darkRed : COLORS.dark)
            .setTitle(preview ? 'Configuration Preview Complete' : 'Configuration Complete')
            .setDescription(
                'The server audit has finished.\n\n' +
                (preview
                    ? 'Preview mode was used. No roles, channels or permissions were modified.'
                    : 'All supported roles and channels have been synchronized with the Jaxdrax Studio permission structure.') +
                '\n\nA full text dump of every role, channel and permission override is attached to your DMs.'
            )
            .addFields(
                { name: 'Server', value: guild.name + '\n' + guild.id, inline: true },
                { name: 'Mode', value: preview ? 'Preview' : 'Live', inline: true },
                { name: 'Executed By', value: user.tag + '\n' + user.id, inline: true },
                { name: 'Changes (' + changes.length + ')', value: fit(changes.slice(0, 12).join('\n') || 'No changes required.'), inline: false },
                { name: 'Issues (' + errors.length + ')', value: fit(errors.slice(0, 10).join('\n') || 'None. Everything applied successfully.'), inline: false },
                { name: 'Report Delivery', value: delivered ? 'Sent to your direct messages with the .txt attachment.' : 'Direct messages are closed or blocked. Enable DMs from server members and run the command again.', inline: false },
                { name: 'Next Steps', value: '1. Review the attached report.\n2. Move the bot role above Member, VIP and Beta Tester if anything was skipped.\n3. Run the command again without preview to apply the remaining changes.', inline: false }
            )
            .setFooter({ text: 'Jaxdrax Studio Configuration Tool' })
            .setTimestamp();

        await sendFinal(source, { embeds: [resultEmbed] });

        if (!delivered) {
            await sendFinal(source, { files: [{ attachment: filePath, name: fileName }] });
        }
    }
};
