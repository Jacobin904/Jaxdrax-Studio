.const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags
} = require('discord.js');

const { COLORS, LOGO_URL, BANNER_URL, STAFF_ROLES } = require('../config/constants');

async function handleInteraction(interaction) {
    const id = interaction.customId || '';

    try {
        if (interaction.isButton()) {
            if (id === 'mod_member_info') {
                const modal = new ModalBuilder()
                    .setCustomId('mod_member_info_modal')
                    .setTitle('Member Investigation');

                const userInput = new TextInputBuilder()
                    .setCustomId('mod_target')
                    .setLabel('Member (username, mention or ID)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: Username, @User or 123456789012345678')
                    .setMaxLength(100)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(userInput));
                return interaction.showModal(modal);
            }

            if (id === 'mod_guides') {
                const embed = new EmbedBuilder()
                    .setColor(COLORS.darkRed)
                    .setTitle('Moderation Guides')
                    .setDescription('Step-by-step procedures for handling common situations. Always document actions and follow the escalation path.')
                    .addFields(
                        {
                            name: 'Spam Handling',
                            value: '1. Delete the spam messages immediately.\n2. Timeout the user for 1 hour.\n3. Send a warning DM explaining the violation.\n4. Log the action in dev-logs.\n5. If spam continues, escalate to a ban.',
                            inline: false
                        },
                        {
                            name: 'Harassment Response',
                            value: '1. Preserve evidence (screenshots).\n2. Timeout the offender for 24 hours.\n3. Open a support ticket for the victim.\n4. Notify Game Direction or Admin.\n5. Consider a permanent ban based on severity.',
                            inline: false
                        },
                        {
                            name: 'Exploit Reports',
                            value: '1. Ask the reporter for details privately.\n2. Verify the exploit exists.\n3. Document the exploit steps.\n4. Notify the Developer role immediately.\n5. Ban any users who shared the exploit publicly.',
                            inline: false
                        },
                        {
                            name: 'Raid Response',
                            value: '1. Enable raid mode (lock all public channels).\n2. Ban all raid participants.\n3. Delete raid messages.\n4. Notify all staff via @Staff Team.\n5. Reopen channels once safe.',
                            inline: false
                        },
                        {
                            name: 'Appeal Process',
                            value: '1. Open a ticket for the appeal.\n2. Review the original moderation action.\n3. Consult with the moderator who issued it.\n4. Make a decision within 48 hours.\n5. Document the outcome.',
                            inline: false
                        }
                    )
                    .setImage(BANNER_URL)
                    .setFooter({ text: 'Jaxdrax Studio Moderation' })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            if (id === 'mod_stats') {
                const guild = interaction.guild;
                const totalMembers = guild.memberCount;
                const staffCount = guild.members.cache.filter(m => m.roles.cache.some(r => STAFF_ROLES.includes(r.name))).size;
                const verifiedCount = guild.members.cache.filter(m => m.roles.cache.some(r => r.name === 'Verified')).size;
                const unverifiedCount = guild.members.cache.filter(m => m.roles.cache.some(r => r.name === 'Unverified')).size;
                const botCount = guild.members.cache.filter(m => m.user.bot).size;
                const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
                const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
                const rolesCount = guild.roles.cache.size;

                const embed = new EmbedBuilder()
                    .setColor(COLORS.darkRed)
                    .setTitle('Server Statistics')
                    .setDescription('Complete overview of the server activity and composition.')
                    .addFields(
                        {
                            name: 'Member Breakdown',
                            value: '**Total Members:** ' + totalMembers + '\n**Humans:** ' + (totalMembers - botCount) + '\n**Bots:** ' + botCount + '\n**Staff:** ' + staffCount + '\n**Verified:** ' + verifiedCount + '\n**Unverified:** ' + unverifiedCount,
                            inline: true
                        },
                        {
                            name: 'Channel Breakdown',
                            value: '**Text Channels:** ' + textChannels + '\n**Voice Channels:** ' + voiceChannels + '\n**Categories:** ' + guild.channels.cache.filter(c => c.type === 4).size + '\n**Total Channels:** ' + guild.channels.cache.size,
                            inline: true
                        },
                        {
                            name: 'Server Info',
                            value: '**Roles:** ' + rolesCount + '\n**Boost Level:** ' + guild.premiumTier + '\n**Boosts:** ' + guild.premiumSubscriptionCount + '\n**Created:** <t:' + Math.floor(guild.createdTimestamp / 1000) + ':R>',
                            inline: true
                        },
                        {
                            name: 'Activity Metrics',
                            value: '**Staff Ratio:** ' + ((staffCount / totalMembers) * 100).toFixed(1) + '%\n**Verification Rate:** ' + ((verifiedCount / (verifiedCount + unverifiedCount || 1)) * 100).toFixed(1) + '%\n**Average Members Per Role:** ' + (totalMembers / rolesCount).toFixed(1),
                            inline: false
                        }
                    )
                    .setImage(BANNER_URL)
                    .setFooter({ text: 'Jaxdrax Studio Statistics' })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            if (id === 'mod_quick_actions') {
                const embed = new EmbedBuilder()
                    .setColor(COLORS.darkRed)
                    .setTitle('Quick Actions')
                    .setDescription('Use these buttons for common moderation tasks. All actions are logged automatically.')
                    .addFields(
                        {
                            name: 'Available Actions',
                            value: '**Warn Member:** Issue an official warning (logged).\n**Timeout Member:** Temporarily restrict communication.\n**Kick Member:** Remove from server (can rejoin).\n**Ban Member:** Permanent removal from server.\n**Purge Messages:** Delete multiple messages at once.',
                            inline: false
                        },
                        {
                            name: 'How To Use',
                            value: 'Use the corresponding slash command or contact a higher-ranking staff member for actions requiring elevated permissions. All actions require a reason.',
                            inline: false
                        }
                    )
                    .setImage(BANNER_URL)
                    .setFooter({ text: 'Jaxdrax Studio Quick Actions' })
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('mod_action_warn').setLabel('Warn').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('mod_action_timeout').setLabel('Timeout').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('mod_action_kick').setLabel('Kick').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('mod_action_ban').setLabel('Ban').setStyle(ButtonStyle.Danger)
                );

                return interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
            }

            if (id === 'mod_action_warn' || id === 'mod_action_timeout' || id === 'mod_action_kick' || id === 'mod_action_ban') {
                const actionType = id.replace('mod_action_', '');
                const modal = new ModalBuilder()
                    .setCustomId('mod_action_modal_' + actionType)
                    .setTitle('Execute ' + actionType.charAt(0).toUpperCase() + actionType.slice(1));

                const userInput = new TextInputBuilder()
                    .setCustomId('mod_target')
                    .setLabel('Target Member (mention or ID)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: @User or 123456789012345678')
                    .setRequired(true);

                const reasonInput = new TextInputBuilder()
                    .setCustomId('mod_reason')
                    .setLabel('Reason')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Explain why this action is being taken.')
                    .setMaxLength(500)
                    .setRequired(true);

                let durationInput = null;
                if (actionType === 'timeout') {
                    durationInput = new TextInputBuilder()
                        .setCustomId('mod_duration')
                        .setLabel('Duration (e.g. 1h, 24h, 7d)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex: 1h, 24h, 7d')
                        .setRequired(true);
                }

                const rows = [new ActionRowBuilder().addComponents(userInput)];
                if (durationInput) rows.push(new ActionRowBuilder().addComponents(durationInput));
                rows.push(new ActionRowBuilder().addComponents(reasonInput));

                modal.addComponents(...rows);
                return interaction.showModal(modal);
            }

            if (id === 'mod_recent_logs') {
                const embed = new EmbedBuilder()
                    .setColor(COLORS.darkRed)
                    .setTitle('Recent Moderation Logs')
                    .setDescription('The moderation log system is currently in development. All actions are logged in the dev-logs channel automatically.\n\nTo view recent logs, check the #dev-logs channel directly.')
                    .addFields(
                        {
                            name: 'What Gets Logged',
                            value: '**Warnings:** All issued warnings with reasons.\n**Timeouts:** Duration, reason, and target.\n**Kicks/Bans:** Reason and moderator.\n**Message Deletes:** Bulk purge actions.\n**Channel Changes:** Permission and configuration changes.',
                            inline: false
                        },
                        {
                            name: 'Log Retention',
                            value: 'Logs are retained indefinitely in the dev-logs channel. For detailed analysis, use the ticket system to request a full audit.',
                            inline: false
                        }
                    )
                    .setImage(BANNER_URL)
                    .setFooter({ text: 'Jaxdrax Studio Logs' })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }
        }

        if (interaction.isModalSubmit()) {
            if (id === 'mod_member_info_modal') {
                const query = interaction.fields.getTextInputValue('mod_target');
                const clean = String(query).replace(/[<@!>]/g, '').trim();

                let member = null;

                if (/^\d{17,19}$/.test(clean)) {
                    try {
                        member = await interaction.guild.members.fetch(clean);
                    } catch (error) {
                        member = null;
                    }
                }

                if (!member) {
                    try {
                        await interaction.guild.members.fetch();
                    } catch (error) {}

                    member = interaction.guild.members.cache.find(m =>
                        m.user.username.toLowerCase() === clean.toLowerCase() ||
                        m.user.tag.toLowerCase() === clean.toLowerCase() ||
                        (m.nickname && m.nickname.toLowerCase() === clean.toLowerCase())
                    ) || null;
                }

                if (!member) {
                    return interaction.reply({
                        content: 'Member not found. Please check the username, mention, or ID and try again.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                const isStaff = member.roles.cache.some(r => STAFF_ROLES.includes(r.name));
                const roles = member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.name).join(', ') || 'None';

                const embed = new EmbedBuilder()
                    .setColor(isStaff ? COLORS.darkRed : COLORS.dark)
                    .setTitle('Member Investigation')
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { name: 'User', value: member.user.tag + '\n' + member.user.id, inline: true },
                        { name: 'Nickname', value: member.nickname || 'None', inline: true },
                        { name: 'Bot', value: member.user.bot ? 'Yes' : 'No', inline: true },
                        { name: 'Account Created', value: '<t:' + Math.floor(member.user.createdTimestamp / 1000) + ':R>', inline: false },
                        { name: 'Joined Server', value: '<t:' + Math.floor(member.joinedTimestamp / 1000) + ':R>', inline: false },
                        { name: 'Is Staff', value: isStaff ? 'Yes' : 'No', inline: true },
                        { name: 'Roles (' + member.roles.cache.size + ')', value: roles.substring(0, 1000) || 'None', inline: false }
                    )
                    .setImage(BANNER_URL)
                    .setFooter({ text: 'Jaxdrax Studio Investigation' })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            if (id.startsWith('mod_action_modal_')) {
                const actionType = id.replace('mod_action_modal_', '');
                const target = interaction.fields.getTextInputValue('mod_target');
                const reason = interaction.fields.getTextInputValue('mod_reason');

                const clean = String(target).replace(/[<@!>]/g, '').trim();
                let member = null;

                try {
                    member = await interaction.guild.members.fetch(clean);
                } catch (error) {
                    return interaction.reply({
                        content: 'Target member not found. Please check the mention or ID.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                if (!member) {
                    return interaction.reply({
                        content: 'Target member not found.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                try {
                    let resultMessage = '';

                    if (actionType === 'warn') {
                        resultMessage = 'Warning issued to ' + member.user.tag + ' for: ' + reason;
                    } else if (actionType === 'timeout') {
                        const durationStr = interaction.fields.getTextInputValue('mod_duration');
                        const match = durationStr.match(/^(\d+)(m|h|d)$/);
                        if (!match) {
                            return interaction.reply({
                                content: 'Invalid duration format. Use 1h, 24h, or 7d.',
                                flags: MessageFlags.Ephemeral
                            });
                        }
                        const amount = parseInt(match[1]);
                        const unit = match[2];
                        let ms = amount * 60 * 1000;
                        if (unit === 'h') ms *= 60;
                        if (unit === 'd') ms *= 24 * 60 * 60 * 1000;

                        await member.timeout(ms, reason);
                        resultMessage = 'Timeout applied to ' + member.user.tag + ' for ' + durationStr + '. Reason: ' + reason;
                    } else if (actionType === 'kick') {
                        await member.kick(reason);
                        resultMessage = member.user.tag + ' has been kicked. Reason: ' + reason;
                    } else if (actionType === 'ban') {
                        await member.ban({ reason: reason, deleteMessageSeconds: 0 });
                        resultMessage = member.user.tag + ' has been banned. Reason: ' + reason;
                    }

                    const devLogs = interaction.guild.channels.cache.find(c => c.name === 'dev-logs');
                    if (devLogs) {
                        const logEmbed = new EmbedBuilder()
                            .setColor(COLORS.darkRed)
                            .setTitle('Moderation Action')
                            .setDescription(resultMessage)
                            .addFields(
                                { name: 'Moderator', value: interaction.user.tag, inline: true },
                                { name: 'Target', value: member.user.tag + '\n' + member.id, inline: true },
                                { name: 'Action', value: actionType.charAt(0).toUpperCase() + actionType.slice(1), inline: true }
                            )
                            .setImage(BANNER_URL)
                            .setTimestamp();
                        await devLogs.send({ embeds: [logEmbed] }).catch(() => {});
                    }

                    return interaction.reply({
                        content: resultMessage,
                        flags: MessageFlags.Ephemeral
                    });
                } catch (error) {
                    return interaction.reply({
                        content: 'Action failed: ' + error.message,
                        flags: MessageFlags.Ephemeral
                    });
                }
            }
        }
    } catch (error) {
        console.error('[Modpanel] Interaction error:', error.message);
    }
}

module.exports = { handleInteraction };
