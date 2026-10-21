const { EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        try {
            if (interaction.isButton()) {
                // ==================== TICKET BUTTONS ====================
                
                if (interaction.customId === 'open_ticket') {
                    const ticketChannelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    
                    if (interaction.guild.channels.cache.find(c => c.name === ticketChannelName)) {
                        const embed = new EmbedBuilder()
                            .setColor(COLORS.red)
                            .setTitle('Ticket Already Open')
                            .setDescription('You already have an open ticket.')
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
                            .setDescription(`Your support ticket has been created successfully.\n\n**Ticket Details:**\n• Channel: ${newChannel}\n• Created: <t:${Math.floor(Date.now() / 1000)}:F>\n\nPlease check the channel for further instructions.`)
                            .setThumbnail(LOGO_URL)
                            .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                            .setTimestamp();

                        await interaction.reply({ embeds: [replyEmbed], flags: MessageFlags.Ephemeral });
                        
                    } catch (error) {
                        console.error('Error creating ticket:', error);
                        const embed = new EmbedBuilder()
                            .setColor(COLORS.red)
                            .setTitle('Error Creating Ticket')
                            .setDescription('An error occurred while creating your ticket.')
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
                    
                    const reasonInput = new TextInputBuilder()
                        .setCustomId('reason')
                        .setLabel('Reason for closing (optional)')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(false)
                        .setPlaceholder('Enter the reason for closing this ticket...');
                    
                    const row = new ActionRowBuilder().addComponents(reasonInput);
                    modal.addComponents(row);
                    
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
                        .setDescription('The ticket has been reopened successfully.')
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
                        console.error('Error deleting ticket:', error);
                        try { await interaction.channel.delete('Ticket closed (transcript failed)'); } catch {}
                    }
                }

                // ==================== RULES BUTTONS ====================
                
                if (interaction.customId === 'rules_go_to_channel') {
                    const rulesChannel = interaction.guild.channels.cache.find(c => c.name === 'rules');
                    if (rulesChannel) {
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.dark)
                                .setTitle('Rules Channel')
                                .setDescription(`Please read the full rules in ${rulesChannel}.`)
                                .setThumbnail(LOGO_URL)
                                .setFooter({ text: 'Jaxdrax Studio', iconURL: LOGO_URL })
                                .setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    return;
                }

                if (interaction.customId === 'rules_send_to_member') {
                    const modal = new ModalBuilder()
                        .setCustomId('rules_send_modal')
                        .setTitle('Send Rules to Member');
                    
                    const userInput = new TextInputBuilder()
                        .setCustomId('member_id')
                        .setLabel('Member ID, Username, or Mention')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('e.g., @username or 123456789012345678')
                        .setRequired(true);
                    
                    const row = new ActionRowBuilder().addComponents(userInput);
                    modal.addComponents(row);
                    
                    await interaction.showModal(modal);
                    return;
                }

                if (interaction.customId === 'rules_open_ticket') {
                    const ticketChannelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    
                    if (interaction.guild.channels.cache.find(c => c.name === ticketChannelName)) {
                        return interaction.reply({ 
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.red)
                                .setTitle('Ticket Already Open')
                                .setDescription('You already have an open ticket.')
                                .setThumbnail(LOGO_URL)
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
                            topic: `Appeal ticket by ${interaction.user.id}`,
                            permissionOverwrites,
                            reason: `Appeal ticket created by ${interaction.user.tag}`
                        });

                        await interaction.reply({ 
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.dark)
                                .setTitle('Appeal Ticket Created')
                                .setDescription(`Your appeal ticket has been created: ${newChannel}`)
                                .setThumbnail(LOGO_URL)
                                .setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    } catch (error) {
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.red)
                                .setTitle('Error')
                                .setDescription('Failed to create appeal ticket.')
                                .setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    return;
                }

                if (interaction.customId === 'rules_report_violation') {
                    const modal = new ModalBuilder()
                        .setCustomId('rules_report_modal')
                        .setTitle('Report a Violation');
                    
                    const offenderInput = new TextInputBuilder()
                        .setCustomId('offender')
                        .setLabel('Offender (Username or ID)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);
                    
                    const descriptionInput = new TextInputBuilder()
                        .setCustomId('description')
                        .setLabel('Description of Violation')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true);
                    
                    const row1 = new ActionRowBuilder().addComponents(offenderInput);
                    const row2 = new ActionRowBuilder().addComponents(descriptionInput);
                    modal.addComponents(row1, row2);
                    
                    await interaction.showModal(modal);
                    return;
                }

                if (interaction.customId === 'rules_appeal_decision') {
                    await interaction.reply({ 
                        embeds: [new EmbedBuilder()
                            .setColor(COLORS.dark)
                            .setTitle('Appeal Process')
                            .setDescription('To appeal a moderation decision:\n\n**1.** Open a ticket\n**2.** Provide your User ID and reason\n**3.** Wait at least 48 hours\n**4.** Show genuine remorse\n**5.** Be patient')
                            .setThumbnail(LOGO_URL)
                            .setFooter({ text: 'Jaxdrax Studio Appeals', iconURL: LOGO_URL })
                            .setTimestamp()],
                        components: [new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('rules_open_ticket')
                                .setLabel('Open Appeal Ticket')
                                .setStyle(ButtonStyle.Success)
                        )],
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                if (interaction.customId === 'rules_mod_panel') {
                    const isStaff = interaction.member.roles.cache.some(role => STAFF_ROLES.includes(role.name));
                    
                    if (!isStaff) {
                        return interaction.reply({ 
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.red)
                                .setTitle('Access Denied')
                                .setDescription('This feature is restricted to staff members only.')
                                .setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    
                    const modpanelCommand = interaction.client.commands.get('modpanel');
                    if (modpanelCommand) {
                        await modpanelCommand.execute(interaction.message, true);
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.dark)
                                .setTitle('Mod Panel Opened')
                                .setDescription('The moderation panel has been opened above.')
                                .setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    return;
                }

                if (interaction.customId === 'rules_copy_text') {
                    const rulesText = `**Jaxdrax Studio Server Rules**\n\n1. Respect Everyone\n2. No Spam or Self Promotion\n3. Keep Channels Organized\n4. No Exploits or Cheating\n5. Follow Discord TOS\n6. Staff Decisions are Final`;
                    
                    await interaction.reply({ 
                        embeds: [new EmbedBuilder()
                            .setColor(COLORS.dark)
                            .setTitle('Rules Text')
                            .setDescription('```' + rulesText + '```')
                            .setThumbnail(LOGO_URL)
                            .setTimestamp()],
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                // ==================== INFO BUTTONS ====================
                
                if (interaction.customId === 'info_bug_report') {
                    const bugChannel = interaction.guild.channels.cache.find(c => c.name === 'bug-reports');
                    if (bugChannel) {
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.dark)
                                .setTitle('Bug Reports')
                                .setDescription(`Please report bugs in ${bugChannel}.`)
                                .setThumbnail(LOGO_URL)
                                .setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    return;
                }

                if (interaction.customId === 'info_suggestions') {
                    const suggestChannel = interaction.guild.channels.cache.find(c => c.name === 'suggestions');
                    if (suggestChannel) {
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.dark)
                                .setTitle('Suggestions')
                                .setDescription(`Share your ideas in ${suggestChannel}.`)
                                .setThumbnail(LOGO_URL)
                                .setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    return;
                }

                if (interaction.customId === 'info_join_discord') {
                    await interaction.reply({ 
                        embeds: [new EmbedBuilder()
                            .setColor(COLORS.dark)
                            .setTitle('Join Our Discord')
                            .setDescription('You are already in the official Jaxdrax Studio Discord server!')
                            .setThumbnail(LOGO_URL)
                            .setTimestamp()],
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                if (interaction.customId === 'info_support') {
                    const ticketChannelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    
                    if (interaction.guild.channels.cache.find(c => c.name === ticketChannelName)) {
                        return interaction.reply({ 
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.red)
                                .setTitle('Ticket Already Open')
                                .setDescription('You already have an open ticket.')
                                .setThumbnail(LOGO_URL)
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
                            topic: `Support ticket by ${interaction.user.id}`,
                            permissionOverwrites,
                            reason: `Support ticket created by ${interaction.user.tag}`
                        });

                        await interaction.reply({ 
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.dark)
                                .setTitle('Support Ticket Created')
                                .setDescription(`Your support ticket has been created: ${newChannel}`)
                                .setThumbnail(LOGO_URL)
                                .setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    } catch (error) {
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.red)
                                .setTitle('Error')
                                .setDescription('Failed to create support ticket.')
                                .setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    return;
                }

                if (interaction.customId === 'info_dev_logs') {
                    const devLogsChannel = interaction.guild.channels.cache.find(c => c.name === 'dev-logs');
                    if (devLogsChannel) {
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.dark)
                                .setTitle('Development Logs')
                                .setDescription(`Development logs are available in ${devLogsChannel}.`)
                                .setThumbnail(LOGO_URL)
                                .setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    return;
                }

                if (interaction.customId === 'info_roadmap') {
                    const roadmapChannel = interaction.guild.channels.cache.find(c => c.name === 'roadmap');
                    if (roadmapChannel) {
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.dark)
                                .setTitle('Development Roadmap')
                                .setDescription(`Check out our roadmap in ${roadmapChannel}.`)
                                .setThumbnail(LOGO_URL)
                                .setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    return;
                }
            }

            // ==================== MODAL HANDLERS ====================
            
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
                        .setDescription(`This ticket has been closed by a staff member.\n\n**Closed by:**\n• Mention: <@${interaction.user.id}>\n• Username: ${interaction.user.username}\n• User ID: ${interaction.user.id}\n• Time: <t:${Math.floor(Date.now() / 1000)}:F>\n\n**Reason:**\n${reason}`)
                        .setThumbnail(LOGO_URL)
                        .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                        .setTimestamp();

                    await interaction.channel.send({
                        embeds: [embed],
                        components: [new ActionRowBuilder().addComponents(reopenBtn, deleteBtn)]
                    });
                    
                    await interaction.reply({ 
                        embeds: [new EmbedBuilder()
                            .setColor(COLORS.red)
                            .setTitle('Ticket Closed Successfully')
                            .setDescription(`The ticket has been closed.\n\n**Reason:**\n${reason}`)
                            .setThumbnail(LOGO_URL)
                            .setTimestamp()],
                        flags: MessageFlags.Ephemeral
                    });
                }

                if (interaction.customId === 'rules_send_modal') {
                    const query = interaction.fields.getTextInputValue('member_id');
                    const cleanQuery = query.replace(/[<@!>]/g, '').trim();
                    
                    let member = null;
                    
                    if (/^\d{17,19}$/.test(cleanQuery)) {
                        try {
                            member = await interaction.guild.members.fetch(cleanQuery);
                        } catch (error) {}
                    }
                    
                    if (!member) {
                        member = interaction.guild.members.cache.find(m => 
                            m.user.username.toLowerCase() === cleanQuery.toLowerCase() ||
                            m.user.tag.toLowerCase() === cleanQuery.toLowerCase()
                        );
                    }
                    
                    if (!member) {
                        return interaction.reply({ 
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.red)
                                .setTitle('Error')
                                .setDescription('Could not find member.')
                                .setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    
                    try {
                        await member.send({
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.red)
                                .setTitle('Server Rules')
                                .setDescription('Please read and follow the server rules carefully.\n\n**1. Respect Everyone**\n**2. No Spam or Self Promotion**\n**3. Keep Channels Organized**\n**4. No Exploits or Cheating**\n**5. Follow Discord TOS**\n**6. Staff Decisions are Final**')
                                .setThumbnail(LOGO_URL)
                                .setTimestamp()]
                        });
                        
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder()
                                .setColor('#2ecc71')
                                .setTitle('Rules Sent')
                                .setDescription(`Rules have been sent to ${member.user.tag} via DM.`)
                                .setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    } catch (error) {
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder()
                                .setColor(COLORS.red)
                                .setTitle('Error')
                                .setDescription('Could not send rules. The member may have DMs disabled.')
                                .setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }

                if (interaction.customId === 'rules_report_modal') {
                    const offender = interaction.fields.getTextInputValue('offender');
                    const description = interaction.fields.getTextInputValue('description');
                    
                    const devLogsChannel = interaction.guild.channels.cache.get(process.env.DEV_LOGS_CHANNEL_ID);
                    
                    if (devLogsChannel) {
                        const moderatorRole = interaction.guild.roles.cache.find(r => r.name === 'Moderator');
                        const reportEmbed = new EmbedBuilder()
                            .setColor(COLORS.red)
                            .setTitle('Rule Violation Report')
                            .setDescription('A new rule violation has been reported.')
                            .addFields(
                                { name: 'Reported by', value: `${interaction.user.tag} (${interaction.user.id})` },
                                { name: 'Offender', value: offender },
                                { name: 'Description', value: description.substring(0, 1024) },
                                { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
                            )
                            .setThumbnail(LOGO_URL)
                            .setTimestamp();
                        
                        await devLogsChannel.send({ 
                            content: moderatorRole ? `<@&${moderatorRole.id}>` : '',
                            embeds: [reportEmbed] 
                        });
                    }
                    
                    await interaction.reply({ 
                        embeds: [new EmbedBuilder()
                            .setColor('#2ecc71')
                            .setTitle('Report Submitted')
                            .setDescription('Your report has been submitted to the moderation team.')
                            .setThumbnail(LOGO_URL)
                            .setTimestamp()],
                        flags: MessageFlags.Ephemeral
                    });
                }
            }
        } catch (error) {
            console.error('Error in interactionCreate:', error);
            
            try {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.red)
                    .setTitle('Error')
                    .setDescription('An error occurred while processing your request.')
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
