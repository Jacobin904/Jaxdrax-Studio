const { EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');
const reviewCommand = require('../commands/review');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        try {
            // Review system (gere en autonomie)
            if (typeof interaction.customId === 'string' && interaction.customId.startsWith('review_')) {
                return await reviewCommand.handleInteraction(interaction);
            }

            if (interaction.isButton()) {

                                // INFO LICENSE BUTTON
                if (interaction.customId === 'info_view_license') {
                    const licenseEmbed = new EmbedBuilder()
                        .setColor(COLORS.dark)
                        .setTitle('Proprietary Software License')
                        .setDescription('**Copyright (c) 2026 Jaxdrax Studio. All Rights Reserved.**\n\nThis software is the exclusive property of Jaxdrax Studio and is protected by copyright laws and international treaties.\n\n**UNAUTHORIZED USE IS STRICTLY PROHIBITED.**')
                        .addFields(
                            {
                                name: 'No Reproduction',
                                value: 'You may not copy, reproduce, distribute, modify, display, perform, prepare derivative works of, or use the Software, in whole or in part, without explicit written permission from Jaxdrax Studio.',
                                inline: false
                            },
                            {
                                name: 'No Modification',
                                value: 'You may not alter, adapt, translate, or create derivative works based upon the Software or any part thereof.',
                                inline: false
                            },
                            {
                                name: 'No Distribution',
                                value: 'You may not distribute, sublicense, lease, rent, lend, or otherwise transfer the Software or any rights therein to any third party.',
                                inline: false
                            },
                            {
                                name: 'No Commercial Use',
                                value: 'You may not use the Software for any commercial purposes, including but not limited to selling, licensing, or monetizing the Software or any derivative works.',
                                inline: false
                            },
                            {
                                name: 'No Reverse Engineering',
                                value: 'You may not reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code of the Software.',
                                inline: false
                            },
                            {
                                name: 'Ownership',
                                value: 'Jaxdrax Studio retains all right, title, and interest in and to the Software, including all intellectual property rights therein. This license does not grant you any ownership rights.',
                                inline: false
                            },
                            {
                                name: 'Termination',
                                value: 'This license will terminate automatically without notice if you fail to comply with any provision. Upon termination, you must destroy all copies of the Software.',
                                inline: false
                            },
                            {
                                name: 'Legal Notice',
                                value: 'Unauthorized use of this Software is strictly prohibited and may result in severe civil and criminal penalties.\n\nFor licensing inquiries, contact Jaxdrax Studio directly.',
                                inline: false
                            }
                        )
                        .setThumbnail(LOGO_URL)
                        .setFooter({ text: '© 2026 Jaxdrax Studio. All Rights Reserved.', iconURL: LOGO_URL })
                        .setTimestamp();

                    await interaction.reply({ embeds: [licenseEmbed], flags: MessageFlags.Ephemeral });
                }

                                // INFO TICKET BUTTON - Affiche l'embed ticket
                if (interaction.customId === 'info_open_ticket') {
                    const ticketEmbed = new EmbedBuilder()
                        .setColor(COLORS.darkRed)
                        .setTitle('Support Ticket System')
                        .setDescription('Need help? Open a private support ticket to get assistance from the Jaxdrax Studio team.\n\n**How it works:**\n• Click the button below to create a private ticket channel\n• Only you and the staff team will have access\n• Describe your issue in detail\n• A staff member will assist you shortly\n\n**Before opening a ticket:**\n• Ensure you have read the server rules\n• Check if your issue has already been answered\n• Prepare a detailed description of your problem\n\nTickets are for serious inquiries only. Spam or misuse will result in loss of ticket privileges.')
                        .addFields(
                            { name: 'What can you get help with?', value: '• Technical issues and bugs\n• Account problems\n• Game-related questions\n• Suggestions and feedback\n• Any other concerns' },
                            { name: 'Response Time', value: 'Our team typically responds within 24 hours. Complex issues may take longer to resolve.' }
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
                }
                
                // ... le reste de ton code existant, inchange
                // OPEN TICKET
                if (interaction.customId === 'open_ticket') {
                    const ticketChannelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    
                    if (interaction.guild.channels.cache.find(c => c.name === ticketChannelName)) {
                        return await interaction.reply({ 
                            embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Ticket Already Open').setDescription('You already have an open ticket.').setTimestamp()],
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
                                .setDescription(`Welcome ${interaction.user.tag}!`)
                                .setThumbnail(LOGO_URL)
                                .setTimestamp()],
                            components: [new ActionRowBuilder().addComponents(closeBtn)]
                        });

                        await interaction.reply({ 
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.dark)
                                .setTitle('Ticket Created')
                                .setDescription(`Your ticket: ${newChannel}`)
                                .setThumbnail(LOGO_URL)
                                .setTimestamp()],
                            flags: MessageFlags.Ephemeral 
                        });
                    } catch (error) {
                        console.error(error);
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.red)
                                .setTitle('Error')
                                .setDescription('Failed to create ticket.')
                                .setTimestamp()],
                            flags: MessageFlags.Ephemeral 
                        });
                    }
                }

                // CLOSE TICKET
                if (interaction.customId === 'close_ticket') {
                    const modal = new ModalBuilder()
                        .setCustomId('close_ticket_modal')
                        .setTitle('Close Ticket');
                    
                    modal.addComponents(new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('reason')
                            .setLabel('Reason (optional)')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(false)
                    ));
                    
                    await interaction.showModal(modal);
                }

                // REOPEN TICKET
                if (interaction.customId === 'reopen_ticket') {
                    const creatorId = interaction.channel.topic?.match(/\d{17,19}/)?.[0];
                    if (creatorId) {
                        await interaction.channel.permissionOverwrites.edit(creatorId, {
                            ViewChannel: true,
                            SendMessages: true,
                            ReadMessageHistory: true
                        });
                    }
                    
                    await interaction.channel.send({
                        embeds: [new EmbedBuilder()
                            .setColor(COLORS.gray)
                            .setTitle('Ticket Reopened')
                            .setDescription(`Reopened by ${interaction.user.tag}`)
                            .setTimestamp()],
                        components: [new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('close_ticket')
                                .setLabel('Close Ticket')
                                .setStyle(ButtonStyle.Danger)
                        )]
                    });
                    
                    await interaction.reply({ 
                        embeds: [new EmbedBuilder()
                            .setColor(COLORS.gray)
                            .setTitle('Success')
                            .setDescription('Ticket reopened.')
                            .setTimestamp()],
                        flags: MessageFlags.Ephemeral 
                    });
                }

                // DELETE TICKET
                if (interaction.customId === 'delete_ticket') {
                    await interaction.deferUpdate();
                    try {
                        const messages = await interaction.channel.messages.fetch({ limit: 100 });
                        let transcript = `Transcript for ${interaction.channel.name}\n\n`;
                        Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp).forEach(msg => {
                            transcript += `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content || '(embed)'}\n`;
                        });
                        
                        const transcriptChannel = interaction.client.channels.cache.get(process.env.TICKET_TRANSCRIPTS_CHANNEL_ID);
                        if (transcriptChannel) {
                            await transcriptChannel.send({
                                embeds: [new EmbedBuilder()
                                    .setColor(COLORS.dark)
                                    .setTitle('Transcript Saved')
                                    .setDescription(`Transcript for ${interaction.channel.name}`)
                                    .setTimestamp()],
                                files: [{ attachment: Buffer.from(transcript, 'utf-8'), name: `${interaction.channel.name}.txt` }]
                            });
                        }
                        await interaction.channel.delete('Closed');
                    } catch (error) {
                        console.error(error);
                    }
                }
            }

            // MODAL SUBMIT
            if (interaction.isModalSubmit()) {
                if (interaction.customId === 'close_ticket_modal') {
                    const reason = interaction.fields.getTextInputValue('reason') || 'No reason provided.';
                    const creatorId = interaction.channel.topic?.match(/\d{17,19}/)?.[0];
                    
                    if (creatorId) {
                        await interaction.channel.permissionOverwrites.edit(creatorId, {
                            ViewChannel: false,
                            SendMessages: false
                        });
                    }
                    
                    await interaction.channel.send({
                        embeds: [new EmbedBuilder()
                            .setColor(COLORS.red)
                            .setTitle('Ticket Closed')
                            .setDescription(`Closed by ${interaction.user.tag}\nReason: ${reason}`)
                            .setTimestamp()],
                        components: [new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('reopen_ticket').setLabel('Reopen').setStyle(ButtonStyle.Success),
                            new ButtonBuilder().setCustomId('delete_ticket').setLabel('Delete').setStyle(ButtonStyle.Danger)
                        )]
                    });
                    
                    await interaction.reply({ 
                        embeds: [new EmbedBuilder()
                            .setColor(COLORS.red)
                            .setTitle('Closed')
                            .setDescription(`Reason: ${reason}`)
                            .setTimestamp()],
                        flags: MessageFlags.Ephemeral 
                    });
                }
            }
        } catch (error) {
            console.error('Interaction error:', error);
        }
    }
};
