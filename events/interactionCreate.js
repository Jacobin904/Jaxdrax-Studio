const { EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        try {
            if (interaction.isButton()) {
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
