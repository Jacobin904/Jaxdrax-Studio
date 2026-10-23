const { EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');
const reviewCommand = require('../commands/review');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        try {
            // ==================== REVIEW SYSTEM ====================
            if (typeof interaction.customId === 'string' && interaction.customId.startsWith('review_')) {
                return await reviewCommand.handleInteraction(interaction);
            }

            // ==================== BUTTONS ====================
            if (interaction.isButton()) {

                // ---------- TICKET: OPEN ----------
                if (interaction.customId === 'open_ticket') {
                    const ticketChannelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

                    if (interaction.guild.channels.cache.find(c => c.name === ticketChannelName)) {
                        return await interaction.reply({
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.red)
                                .setTitle('Ticket Already Open')
                                .setDescription('You already have an open ticket. Please check your channel list on the left.')
                                .setThumbnail(LOGO_URL)
                                .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                                .setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const permissionOverwrites = [
                        { id: interaction.guild.id, deny: ['ViewChannel'] },
                        { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }
                    ];

                    STAFF_ROLES.forEach(roleName => {
                        const role = interaction.guild.roles.cache.find(r => r.name === roleName);
                        if (role) permissionOverwrites.push({ id: role.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] });
                    });

                    try {
                        const newChannel = await interaction.guild.channels.create({
                            name: ticketChannelName,
                            type: ChannelType.GuildText,
                            parent: interaction.channel.parentId,
                            topic: `Ticket created by ${interaction.user.id}`,
                            permissionOverwrites,
                            reason: `Support ticket created by ${interaction.user.tag}`
                        });

                        const closeBtn = new ButtonBuilder()
                            .setCustomId('close_ticket')
                            .setLabel('Close Ticket')
                            .setStyle(ButtonStyle.Danger);

                        await newChannel.send({
                            content: `<@${interaction.user.id}>`,
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.dark)
                                .setTitle('Support Ticket Opened')
                                .setDescription(`Hello <@${interaction.user.id}>, welcome to your private support ticket.\n\n**Ticket Details:**\n• Created by: ${interaction.user.username}\n• User ID: ${interaction.user.id}\n• Channel: ${newChannel}\n• Created: <t:${Math.floor(Date.now() / 1000)}:F>\n\n**Next Steps:**\n• Please describe your issue in detail\n• Attach screenshots or videos if applicable\n• A staff member will assist you shortly\n\nThank you for your patience!`)
                                .setThumbnail(LOGO_URL)
                                .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                                .setTimestamp()],
                            components: [new ActionRowBuilder().addComponents(closeBtn)]
                        });

                        await interaction.reply({
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.dark)
                                .setTitle('Ticket Created Successfully')
                                .setDescription(`Your support ticket has been created successfully.\n\n**Ticket Details:**\n• Channel: ${newChannel}\n• Created: <t:${Math.floor(Date.now() / 1000)}:F>\n\nPlease check the channel for further instructions. A staff member will assist you shortly.`)
                                .setThumbnail(LOGO_URL)
                                .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                                .setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    } catch (error) {
                        console.error('Error creating ticket:', error);
                        await interaction.reply({
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.red)
                                .setTitle('Error Creating Ticket')
                                .setDescription('An error occurred while creating your ticket. Please try again later.')
                                .setThumbnail(LOGO_URL)
                                .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                                .setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    return;
                }

                // ---------- TICKET: CLOSE ----------
                if (interaction.customId === 'close_ticket') {
                    const modal = new ModalBuilder()
                        .setCustomId('close_ticket_modal')
                        .setTitle('Close Ticket');

                    modal.addComponents(new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('reason')
                            .setLabel('Reason for closing (optional)')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(false)
                            .setPlaceholder('Enter the reason for closing this ticket...')
                    ));

                    await interaction.showModal(modal);
                    return;
                }

                // ---------- TICKET: REOPEN ----------
                if (interaction.customId === 'reopen_ticket') {
                    const creatorId = interaction.channel.topic?.match(/\d{17,19}/)?.[0];
                    if (creatorId) {
                        await interaction.channel.permissionOverwrites.edit(creatorId, {
                            ViewChannel: true,
                            SendMessages: true,
                            ReadMessageHistory: true
                        });
                    }

                    const closeBtn = new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('Close Ticket')
                        .setStyle(ButtonStyle.Danger);

                    await interaction.channel.send({
                        embeds: [new EmbedBuilder()
                            .setColor(COLORS.gray)
                            .setTitle('Ticket Reopened')
                            .setDescription(`This ticket has been reopened by a staff member.\n\n**Reopened by:**\n• Mention: <@${interaction.user.id}>\n• Username: ${interaction.user.username}\n• User ID: ${interaction.user.id}\n• Time: <t:${Math.floor(Date.now() / 1000)}:F>\n\nThe original creator now has access to this channel again.`)
                            .setThumbnail(LOGO_URL)
                            .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                            .setTimestamp()],
                        components: [new ActionRowBuilder().addComponents(closeBtn)]
                    });

                    await interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setColor(COLORS.gray)
                            .setTitle('Ticket Reopened')
                            .setDescription('The ticket has been reopened successfully. The user can now see and interact in this channel.')
                            .setThumbnail(LOGO_URL)
                            .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                            .setTimestamp()],
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                // ---------- TICKET: DELETE ----------
                if (interaction.customId === 'delete_ticket') {
                    await interaction.deferUpdate();
                    try {
                        const messages = await interaction.channel.messages.fetch({ limit: 100 });
                        let transcript = `Transcript for ${interaction.channel.name}\n\n`;
                        Array.from(messages.values())
                            .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
                            .forEach(msg => {
                                transcript += `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content || '(embed/attachment)'}\n`;
                            });

                        const transcriptChannel = interaction.client.channels.cache.get(process.env.TICKET_TRANSCRIPTS_CHANNEL_ID);
                        if (transcriptChannel) {
                            await transcriptChannel.send({
                                embeds: [new EmbedBuilder()
                                    .setColor(COLORS.dark)
                                    .setTitle('Ticket Transcript Saved')
                                    .setDescription(`Transcript for ${interaction.channel.name}\n\n**Details:**\n• Channel Name: ${interaction.channel.name}\n• Messages Saved: ${messages.size}\n• Saved by: <@${interaction.user.id}>\n• Time: <t:${Math.floor(Date.now() / 1000)}:F>`)
                                    .setThumbnail(LOGO_URL)
                                    .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                                    .setTimestamp()],
                                files: [{ attachment: Buffer.from(transcript, 'utf-8'), name: `${interaction.channel.name}.txt` }]
                            });
                        }
                        await interaction.channel.delete('Ticket closed and transcript saved');
                    } catch (error) {
                        console.error('Error deleting ticket:', error);
                        try {
                            await interaction.channel.delete('Ticket closed (transcript failed)');
                        } catch (deleteError) {
                            console.error('Failed to delete channel:', deleteError);
                        }
                    }
                    return;
                }

                // ---------- INFO: VIEW LICENSE ----------
                if (interaction.customId === 'info_view_license') {
                    const licenseEmbed = new EmbedBuilder()
                        .setColor(COLORS.dark)
                        .setTitle('Proprietary Software License')
                        .setDescription('**Copyright (c) 2026 Jaxdrax Studio. All Rights Reserved.**\n\nThis software is the exclusive property of Jaxdrax Studio and is protected by copyright laws and international treaties.\n\n**UNAUTHORIZED USE IS STRICTLY PROHIBITED.**')
                        .addFields(
                            { name: 'No Reproduction', value: 'You may not copy, reproduce, distribute, modify, display, perform, prepare derivative works of, or use the Software, in whole or in part, without explicit written permission from Jaxdrax Studio.', inline: false },
                            { name: 'No Modification', value: 'You may not alter, adapt, translate, or create derivative works based upon the Software or any part thereof.', inline: false },
                            { name: 'No Distribution', value: 'You may not distribute, sublicense, lease, rent, lend, or otherwise transfer the Software or any rights therein to any third party.', inline: false },
                            { name: 'No Commercial Use', value: 'You may not use the Software for any commercial purposes, including but not limited to selling, licensing, or monetizing the Software or any derivative works.', inline: false },
                            { name: 'No Reverse Engineering', value: 'You may not reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code of the Software.', inline: false },
                            { name: 'Ownership', value: 'Jaxdrax Studio retains all right, title, and interest in and to the Software, including all intellectual property rights therein. This license does not grant you any ownership rights.', inline: false },
                            { name: 'Termination', value: 'This license will terminate automatically without notice if you fail to comply with any provision. Upon termination, you must destroy all copies of the Software.', inline: false },
                            { name: 'Legal Notice', value: 'Unauthorized use of this Software is strictly prohibited and may result in severe civil and criminal penalties.\n\nFor licensing inquiries, contact Jaxdrax Studio directly.', inline: false }
                        )
                        .setThumbnail(LOGO_URL)
                        .setFooter({ text: '© 2026 Jaxdrax Studio. All Rights Reserved.', iconURL: LOGO_URL })
                        .setTimestamp();

                    await interaction.reply({ embeds: [licenseEmbed], flags: MessageFlags.Ephemeral });
                    return;
                }

                // ---------- INFO: SUPPORT TICKET (embed d'intro) ----------
                if (interaction.customId === 'info_open_ticket') {
                    const ticketEmbed = new EmbedBuilder()
                        .setColor(COLORS.darkRed)
                        .setTitle('Support Ticket System')
                        .setDescription('Need help? Open a private support ticket to get assistance from the Jaxdrax Studio team.\n\n**How it works:**\n• Click the button below to create a private ticket channel\n• Only you and the staff team will have access\n• Describe your issue in detail\n• A staff member will assist you shortly\n\n**Before opening a ticket:**\n• Ensure you have read the server rules\n• Check if your issue has already been answered\n• Prepare a detailed description of your problem\n\nTickets are for serious inquiries only. Spam or misuse will result in loss of ticket privileges.')
                        .addFields(
                            { name: 'What can you get help with?', value: '• Technical issues and bugs\n• Account problems\n• Game-related questions\n• Suggestions and feedback\n• Any other concerns', inline: false },
                            { name: 'Response Time', value: 'Our team typically responds within 24 hours. Complex issues may take longer to resolve.', inline: false }
                        )
                        .setThumbnail(LOGO_URL)
                        .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                        .setTimestamp();

                    const openTicketButton = new ButtonBuilder()
                        .setCustomId('open_ticket')
                        .setLabel('Open Support Ticket')
                        .setStyle(ButtonStyle.Primary);

                    const row = new ActionRowBuilder().addComponents(openTicketButton);

                    await interaction.reply({
                        embeds: [ticketEmbed],
                        components: [row],
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }
            }

            // ==================== MODALS ====================
            if (interaction.isModalSubmit()) {

                // ---------- CLOSE TICKET MODAL ----------
                if (interaction.customId === 'close_ticket_modal') {
                    const reason = interaction.fields.getTextInputValue('reason') || 'No reason provided.';
                    const creatorId = interaction.channel.topic?.match(/\d{17,19}/)?.[0];

                    if (creatorId) {
                        await interaction.channel.permissionOverwrites.edit(creatorId, {
                            ViewChannel: false,
                            SendMessages: false
                        });
                    }

                    const reopenBtn = new ButtonBuilder()
                        .setCustomId('reopen_ticket')
                        .setLabel('Reopen Ticket')
                        .setStyle(ButtonStyle.Success);
                    const deleteBtn = new ButtonBuilder()
                        .setCustomId('delete_ticket')
                        .setLabel('Delete Permanently')
                        .setStyle(ButtonStyle.Danger);

                    await interaction.channel.send({
                        embeds: [new EmbedBuilder()
                            .setColor(COLORS.red)
                            .setTitle('Ticket Closed')
                            .setDescription(`This ticket has been closed by a staff member.\n\n**Closed by:**\n• Mention: <@${interaction.user.id}>\n• Username: ${interaction.user.username}\n• User ID: ${interaction.user.id}\n• Time: <t:${Math.floor(Date.now() / 1000)}:F>\n\n**Reason:**\n${reason}\n\n**Options:**\n• Reopen Ticket: Restore access for the original creator\n• Delete Permanently: Save transcript and delete the channel`)
                            .setThumbnail(LOGO_URL)
                            .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                            .setTimestamp()],
                        components: [new ActionRowBuilder().addComponents(reopenBtn, deleteBtn)]
                    });

                    await interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setColor(COLORS.red)
                            .setTitle('Ticket Closed Successfully')
                            .setDescription(`The ticket has been closed and the user no longer has access to this channel.\n\n**Reason:**\n${reason}\n\nYou can reopen the ticket or delete it permanently using the buttons below.`)
                            .setThumbnail(LOGO_URL)
                            .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                            .setTimestamp()],
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }
            }
        } catch (error) {
            console.error('Interaction error:', error);

            try {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.red)
                    .setTitle('Error')
                    .setDescription('An error occurred while processing your request. Please try again later.')
                    .setThumbnail(LOGO_URL)
                    .setTimestamp();

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
                }
            } catch (replyError) {
                console.error('Could not send error message:', replyError);
            }
        }
    }
};
