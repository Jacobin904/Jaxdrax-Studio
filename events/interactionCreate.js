const { EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isButton()) {
            if (interaction.customId === 'open_ticket') {
                const ticketChannelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
                
                if (interaction.guild.channels.cache.find(c => c.name === ticketChannelName)) {
                    const embed = new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('Ticket Already Open')
                        .setDescription('You already have an open ticket. Please check your channel list on the left. If you need to close it, use the "Close Ticket" button inside the ticket channel.')
                        .setThumbnail(LOGO_URL)
                        .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
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

                    const embed = new EmbedBuilder()
                        .setColor(COLORS.dark)
                        .setTitle('Support Ticket Opened')
                        .setDescription(`Hello <@${interaction.user.id}>, welcome to your private support ticket.\n\n**Ticket Details:**\n• Created by: ${interaction.user.username}\n• User ID: ${interaction.user.id}\n• Channel: ${newChannel}\n• Created: <t:${Math.floor(Date.now() / 1000)}:F>\n\n**Next Steps:**\n• Please describe your issue in detail\n• Attach screenshots or videos if applicable\n• A staff member will assist you shortly\n\nThank you for your patience!`)
                        .setThumbnail(LOGO_URL)
                        .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                        .setTimestamp();

                    await newChannel.send({
                        content: `<@${interaction.user.id}>`,
                        embeds: [embed],
                        components: [new ActionRowBuilder().addComponents(closeBtn)]
                    });

                    const replyEmbed = new EmbedBuilder()
                        .setColor(COLORS.dark)
                        .setTitle('Ticket Created Successfully')
                        .setDescription(`Your support ticket has been created successfully.\n\n**Ticket Details:**\n• Channel: ${newChannel}\n• Created: <t:${Math.floor(Date.now() / 1000)}:F>\n\nPlease check the channel for further instructions. A staff member will assist you shortly.`)
                        .setThumbnail(LOGO_URL)
                        .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                        .setTimestamp();

                    await interaction.reply({ embeds: [replyEmbed], flags: MessageFlags.Ephemeral });
                    
                } catch (error) {
                    console.error(error);
                    const embed = new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('Error Creating Ticket')
                        .setDescription('An error occurred while creating your ticket. Please try again later or contact a staff member directly.')
                        .setThumbnail(LOGO_URL)
                        .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                        .setTimestamp();
                    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                }
            }

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
            }

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

                const embed = new EmbedBuilder()
                    .setColor(COLORS.gray)
                    .setTitle('Ticket Reopened')
                    .setDescription(`This ticket has been reopened by a staff member.\n\n**Reopened by:**\n• Mention: <@${interaction.user.id}>\n• Username: ${interaction.user.username}\n• User ID: ${interaction.user.id}\n• Time: <t:${Math.floor(Date.now() / 1000)}:F>\n\nThe original creator now has access to this channel again.`)
                    .setThumbnail(LOGO_URL)
                    .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                    .setTimestamp();

                await interaction.channel.send({
                    embeds: [embed],
                    components: [new ActionRowBuilder().addComponents(closeBtn)]
                });
                
                const replyEmbed = new EmbedBuilder()
                    .setColor(COLORS.gray)
                    .setTitle('Ticket Reopened')
                    .setDescription('The ticket has been reopened successfully. The user can now see and interact in this channel.')
                    .setThumbnail(LOGO_URL)
                    .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                    .setTimestamp();

                await interaction.reply({ embeds: [replyEmbed], flags: MessageFlags.Ephemeral });
            }

            if (interaction.customId === 'delete_ticket') {
                await interaction.deferUpdate();
                try {
                    const messages = await interaction.channel.messages.fetch({ limit: 100 });
                    let transcript = `Transcript for ${interaction.channel.name}\n\n`;
                    Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp).forEach(msg => {
                        transcript += `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content || '(embed/attachment)'}\n`;
                    });
                    
                    const transcriptChannel = interaction.client.channels.cache.get(process.env.TICKET_TRANSCRIPTS_CHANNEL_ID);
                    if (transcriptChannel) {
                        const embed = new EmbedBuilder()
                            .setColor(COLORS.dark)
                            .setTitle('Ticket Transcript Saved')
                            .setDescription(`Transcript for ${interaction.channel.name}\n\n**Details:**\n• Channel Name: ${interaction.channel.name}\n• Messages Saved: ${messages.size}\n• Saved by: <@${interaction.user.id}>\n• Time: <t:${Math.floor(Date.now() / 1000)}:F>`)
                            .setThumbnail(LOGO_URL)
                            .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                            .setTimestamp();

                        await transcriptChannel.send({
                            embeds: [embed],
                            files: [{ attachment: Buffer.from(transcript, 'utf-8'), name: `${interaction.channel.name}.txt` }]
                        });
                    }
                    await interaction.channel.delete('Ticket closed and transcript saved');
                } catch (error) {
                    console.error(error);
                    try { await interaction.channel.delete('Ticket closed (transcript failed)'); } catch {}
                }
            }
        }

        if (interaction.isModalSubmit() && interaction.customId === 'close_ticket_modal') {
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

            const embed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Ticket Closed')
                .setDescription(`This ticket has been closed by a staff member.\n\n**Closed by:**\n• Mention: <@${interaction.user.id}>\n• Username: ${interaction.user.username}\n• User ID: ${interaction.user.id}\n• Time: <t:${Math.floor(Date.now() / 1000)}:F>\n\n**Reason:**\n${reason}\n\n**Options:**\n• Reopen Ticket: Restore access for the original creator\n• Delete Permanently: Save transcript and delete the channel`)
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                .setTimestamp();

            await interaction.channel.send({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(reopenBtn, deleteBtn)]
            });
            
            const replyEmbed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Ticket Closed Successfully')
                .setDescription(`The ticket has been closed and the user no longer has access to this channel.\n\n**Reason:**\n${reason}\n\nYou can reopen the ticket or delete it permanently using the buttons below.`)
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                .setTimestamp();

            await interaction.reply({ embeds: [replyEmbed], flags: MessageFlags.Ephemeral });
        }
    }
};
