const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isButton()) return;
        
        // Member Info Button
        if (interaction.customId === 'mod_member_info') {
            const modal = new ModalBuilder()
                .setCustomId('mod_member_info_modal')
                .setTitle('Member Investigation');
            
            const userInput = new TextInputBuilder()
                .setCustomId('member_id')
                .setLabel('Enter Member ID or Mention')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., 123456789012345678 or @username')
                .setRequired(true);
            
            const row = new ActionRowBuilder().addComponents(userInput);
            modal.addComponents(row);
            
            await interaction.showModal(modal);
            return;
        }

        // Mod Guides Button
        if (interaction.customId === 'mod_guides') {
            const embed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Moderation Guides - Quick Reference')
                .setDescription('Comprehensive guides for handling common moderation situations. Click the buttons below to access specific guides.')
                .addFields(
                    {
                        name: '🚨 Spam & Flooding',
                        value: '1. Delete offending messages immediately\n2. Issue a warning for first offense\n3. Mute for 1 hour on second offense\n4. Kick on third offense\n5. Document all actions in dev-logs',
                        inline: true
                    },
                    {
                        name: '⚠️ Harassment & Bullying',
                        value: '1. Delete all harassing messages\n2. Issue immediate warning\n3. Mute for 24 hours\n4. If severe, temporary ban (3-7 days)\n5. Contact victim to ensure safety',
                        inline: true
                    },
                    {
                        name: '💀 Exploits & Cheating',
                        value: '1. Gather evidence (screenshots/videos)\n2. Permanent ban immediately\n3. Document in dev-logs with evidence\n4. Report to Roblox if game-related',
                        inline: true
                    },
                    {
                        name: '🔄 Appeals Process',
                        value: '1. User must open a ticket\n2. Wait 48 hours before reviewing\n3. Require genuine remorse\n4. Trial period with monitoring\n5. Document decision in dev-logs',
                        inline: true
                    }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Moderation Guide', iconURL: LOGO_URL })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        // Statistics Button
        if (interaction.customId === 'mod_stats') {
            const guild = interaction.guild;
            const recentLogs = [];
            
            // Récupérer les messages récents de dev-logs
            const devLogsChannel = guild.channels.cache.get(process.env.DEV_LOGS_CHANNEL_ID);
            if (devLogsChannel) {
                const messages = await devLogsChannel.messages.fetch({ limit: 50 });
                messages.forEach(msg => {
                    if (msg.embeds.length > 0) {
                        const embed = msg.embeds[0];
                        if (embed.title && (embed.title.includes('Deleted') || embed.title.includes('Banned') || embed.title.includes('Kicked'))) {
                            recentLogs.push({
                                title: embed.title,
                                timestamp: msg.createdAt
                            });
                        }
                    }
                });
            }

            const embed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Moderation Statistics & Recent Activity')
                .setDescription('Overview of recent moderation actions and server statistics.')
                .addFields(
                    {
                        name: '📊 Server Overview',
                        value: `Total Members: ${guild.memberCount}\nTotal Roles: ${guild.roles.cache.size}\nTotal Channels: ${guild.channels.cache.size}\nServer Created: <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
                        inline: false
                    },
                    {
                        name: '🔍 Recent Moderation Actions',
                        value: recentLogs.length > 0 
                            ? recentLogs.slice(0, 10).map(log => `• **${log.title}** - <t:${Math.floor(log.timestamp / 1000)}:R>`).join('\n')
                            : 'No recent moderation actions found.',
                        inline: false
                    },
                    {
                        name: '⚠️ Active Warnings',
                        value: 'Use the "Recent Logs" button to view detailed warning history and active infractions.',
                        inline: false
                    }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Statistics', iconURL: LOGO_URL })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        // Quick Actions Button
        if (interaction.customId === 'mod_quick_actions') {
            const embed = new EmbedBuilder()
                .setColor(COLORS.darkRed)
                .setTitle('Quick Moderation Actions')
                .setDescription('Execute common moderation commands with guided workflows. Select an action below.')
                .addFields(
                    {
                        name: '⚠️ Warn Member',
                        value: 'Issue an official warning to a member. The warning will be logged and visible to other staff.',
                        inline: false
                    },
                    {
                        name: '🔇 Timeout Member',
                        value: 'Temporarily prevent a member from sending messages. Duration: 1 hour to 28 days.',
                        inline: false
                    },
                    {
                        name: '👢 Kick Member',
                        value: 'Remove a member from the server. They can rejoin with a new invite.',
                        inline: false
                    },
                    {
                        name: '🔨 Ban Member',
                        value: 'Permanently remove a member from the server. They cannot rejoin unless unbanned.',
                        inline: false
                    }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Quick Actions', iconURL: LOGO_URL })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('mod_warn')
                        .setLabel('Warn')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('mod_timeout')
                        .setLabel('Timeout')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('mod_kick')
                        .setLabel('Kick')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('mod_ban')
                        .setLabel('Ban')
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
            return;
        }

        // Recent Logs Button
        if (interaction.customId === 'mod_recent_logs') {
            const devLogsChannel = interaction.guild.channels.cache.get(process.env.DEV_LOGS_CHANNEL_ID);
            
            if (!devLogsChannel) {
                return interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('Error')
                        .setDescription('Dev logs channel not found.')
                        .setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            }

            const messages = await devLogsChannel.messages.fetch({ limit: 20 });
            const logs = [];

            messages.forEach(msg => {
                if (msg.embeds.length > 0) {
                    const embed = msg.embeds[0];
                    logs.push({
                        title: embed.title || 'Unknown',
                        description: embed.description?.substring(0, 100) || 'No details',
                        timestamp: msg.createdAt
                    });
                }
            });

            const embed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Recent Server Logs')
                .setDescription('Last 20 logged events from the server.')
                .addFields(
                    logs.slice(0, 10).map((log, index) => ({
                        name: `${index + 1}. ${log.title}`,
                        value: `${log.description}\n<t:${Math.floor(log.timestamp / 1000)}:R>`,
                        inline: false
                    }))
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Logs', iconURL: LOGO_URL })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        // Warn Button
        if (interaction.customId === 'mod_warn') {
            const modal = new ModalBuilder()
                .setCustomId('mod_warn_modal')
                .setTitle('Warn Member');
            
            const userInput = new TextInputBuilder()
                .setCustomId('member_id')
                .setLabel('Member ID or Mention')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            
            const reasonInput = new TextInputBuilder()
                .setCustomId('reason')
                .setLabel('Reason for Warning')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);
            
            const row1 = new ActionRowBuilder().addComponents(userInput);
            const row2 = new ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(row1, row2);
            
            await interaction.showModal(modal);
            return;
        }

        // Timeout Button
        if (interaction.customId === 'mod_timeout') {
            const modal = new ModalBuilder()
                .setCustomId('mod_timeout_modal')
                .setTitle('Timeout Member');
            
            const userInput = new TextInputBuilder()
                .setCustomId('member_id')
                .setLabel('Member ID or Mention')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            
            const durationInput = new TextInputBuilder()
                .setCustomId('duration')
                .setLabel('Duration (in minutes)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., 60 for 1 hour, 1440 for 1 day')
                .setRequired(true);
            
            const reasonInput = new TextInputBuilder()
                .setCustomId('reason')
                .setLabel('Reason')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);
            
            const row1 = new ActionRowBuilder().addComponents(userInput);
            const row2 = new ActionRowBuilder().addComponents(durationInput);
            const row3 = new ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(row1, row2, row3);
            
            await interaction.showModal(modal);
            return;
        }

        // Kick Button
        if (interaction.customId === 'mod_kick') {
            const modal = new ModalBuilder()
                .setCustomId('mod_kick_modal')
                .setTitle('Kick Member');
            
            const userInput = new TextInputBuilder()
                .setCustomId('member_id')
                .setLabel('Member ID or Mention')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            
            const reasonInput = new TextInputBuilder()
                .setCustomId('reason')
                .setLabel('Reason for Kick')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);
            
            const row1 = new ActionRowBuilder().addComponents(userInput);
            const row2 = new ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(row1, row2);
            
            await interaction.showModal(modal);
            return;
        }

        // Ban Button
        if (interaction.customId === 'mod_ban') {
            const modal = new ModalBuilder()
                .setCustomId('mod_ban_modal')
                .setTitle('Ban Member');
            
            const userInput = new TextInputBuilder()
                .setCustomId('member_id')
                .setLabel('Member ID or Mention')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            
            const reasonInput = new TextInputBuilder()
                .setCustomId('reason')
                .setLabel('Reason for Ban')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);
            
            const row1 = new ActionRowBuilder().addComponents(userInput);
            const row2 = new ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(row1, row2);
            
            await interaction.showModal(modal);
            return;
        }
    }
};
