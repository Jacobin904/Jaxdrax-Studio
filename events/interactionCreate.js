const { EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        try {
            if (interaction.isButton()) {
                // TICKET BUTTONS
                if (interaction.customId === 'open_ticket') {
                    const ticketChannelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    
                    if (interaction.guild.channels.cache.find(c => c.name === ticketChannelName)) {
                        return interaction.reply({ 
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

                        const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger);

                        await newChannel.send({
                            content: `<@${interaction.user.id}>`,
                            embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Support Ticket Opened').setDescription(`Hello <@${interaction.user.id}>, welcome to your private support ticket.\n\n**Ticket Details:**\n• Created by: ${interaction.user.username}\n• User ID: ${interaction.user.id}\n• Channel: ${newChannel}\n• Created: <t:${Math.floor(Date.now() / 1000)}:F>\n\n**Next Steps:**\n• Please describe your issue in detail\n• Attach screenshots or videos if applicable\n• A staff member will assist you shortly`).setThumbnail(LOGO_URL).setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL }).setTimestamp()],
                            components: [new ActionRowBuilder().addComponents(closeBtn)]
                        });

                        await interaction.reply({ 
                            embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Ticket Created').setDescription(`Your ticket has been created: ${newChannel}`).setThumbnail(LOGO_URL).setTimestamp()],
                            flags: MessageFlags.Ephemeral 
                        });
                    } catch (error) {
                        console.error(error);
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('Failed to create ticket.').setTimestamp()],
                            flags: MessageFlags.Ephemeral 
                        });
                    }
                }

                if (interaction.customId === 'close_ticket') {
                    const modal = new ModalBuilder().setCustomId('close_ticket_modal').setTitle('Close Ticket');
                    modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reason').setLabel('Reason (optional)').setStyle(TextInputStyle.Paragraph).setRequired(false)));
                    await interaction.showModal(modal);
                }

                if (interaction.customId === 'reopen_ticket') {
                    const creatorId = interaction.channel.topic?.match(/\d{17,19}/)?.[0];
                    if (creatorId) {
                        await interaction.channel.permissionOverwrites.edit(creatorId, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
                    }
                    
                    const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger);
                    await interaction.channel.send({ 
                        embeds: [new EmbedBuilder().setColor(COLORS.gray).setTitle('Ticket Reopened').setDescription(`Reopened by <@${interaction.user.id}>`).setTimestamp()],
                        components: [new ActionRowBuilder().addComponents(closeBtn)]
                    });
                    await interaction.reply({ 
                        embeds: [new EmbedBuilder().setColor(COLORS.gray).setTitle('Success').setDescription('Ticket reopened.').setTimestamp()],
                        flags: MessageFlags.Ephemeral 
                    });
                }

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
                                embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Transcript Saved').setDescription(`Transcript for ${interaction.channel.name}`).setTimestamp()],
                                files: [{ attachment: Buffer.from(transcript, 'utf-8'), name: `${interaction.channel.name}.txt` }] 
                            });
                        }
                        await interaction.channel.delete('Closed');
                    } catch (error) {
                        console.error(error);
                    }
                }

                // RULES BUTTONS
                if (interaction.customId === 'rules_go_to_channel') {
                    const rulesChannel = interaction.guild.channels.cache.find(c => c.name === 'rules');
                    if (rulesChannel) {
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Rules Channel').setDescription(`Please read the full rules in ${rulesChannel}.`).setThumbnail(LOGO_URL).setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }

                if (interaction.customId === 'rules_send_to_member') {
                    const modal = new ModalBuilder().setCustomId('rules_send_modal').setTitle('Send Rules to Member');
                    modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('member_id').setLabel('Member ID or Mention').setStyle(TextInputStyle.Short).setRequired(true)));
                    await interaction.showModal(modal);
                }

                if (interaction.customId === 'rules_open_ticket') {
                    const ticketChannelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    
                    if (interaction.guild.channels.cache.find(c => c.name === ticketChannelName)) {
                        return interaction.reply({ 
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
                            topic: `Appeal ticket by ${interaction.user.id}`,
                            permissionOverwrites,
                            reason: `Appeal ticket created by ${interaction.user.tag}`
                        });

                        await interaction.reply({ 
                            embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Appeal Ticket Created').setDescription(`Your appeal ticket: ${newChannel}`).setThumbnail(LOGO_URL).setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    } catch (error) {
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('Failed to create ticket.').setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }

                if (interaction.customId === 'rules_report_violation') {
                    const modal = new ModalBuilder().setCustomId('rules_report_modal').setTitle('Report Violation');
                    modal.addComponents(
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('offender').setLabel('Offender').setStyle(TextInputStyle.Short).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(true))
                    );
                    await interaction.showModal(modal);
                }

                if (interaction.customId === 'rules_mod_panel') {
                    const isStaff = interaction.member.roles.cache.some(role => STAFF_ROLES.includes(role.name));
                    if (!isStaff) {
                        return interaction.reply({ 
                            embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Access Denied').setDescription('Staff only.').setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    
                    const modpanelCommand = interaction.client.commands.get('modpanel');
                    if (modpanelCommand) {
                        await modpanelCommand.execute(interaction.message, true);
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Mod Panel Opened').setDescription('Check above.').setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }

                if (interaction.customId === 'rules_copy_text') {
                    await interaction.reply({ 
                        embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Rules').setDescription('1. Respect Everyone\n2. No Spam\n3. Keep Channels Organized\n4. No Exploits\n5. Follow Discord TOS\n6. Staff Decisions are Final').setThumbnail(LOGO_URL).setTimestamp()],
                        flags: MessageFlags.Ephemeral
                    });
                }

                // INFO BUTTONS
                if (interaction.customId === 'info_bug_report') {
                    const bugChannel = interaction.guild.channels.cache.find(c => c.name === 'bug-reports');
                    if (bugChannel) {
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Bug Reports').setDescription(`Report bugs in ${bugChannel}.`).setThumbnail(LOGO_URL).setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }

                if (interaction.customId === 'info_suggestions') {
                    const suggestChannel = interaction.guild.channels.cache.find(c => c.name === 'suggestions');
                    if (suggestChannel) {
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Suggestions').setDescription(`Share ideas in ${suggestChannel}.`).setThumbnail(LOGO_URL).setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }

                if (interaction.customId === 'info_support') {
                    const ticketChannelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    
                    if (interaction.guild.channels.cache.find(c => c.name === ticketChannelName)) {
                        return interaction.reply({ 
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
                            topic: `Support ticket by ${interaction.user.id}`,
                            permissionOverwrites,
                            reason: `Support ticket created by ${interaction.user.tag}`
                        });

                        await interaction.reply({ 
                            embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Support Ticket Created').setDescription(`Your ticket: ${newChannel}`).setThumbnail(LOGO_URL).setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    } catch (error) {
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('Failed to create ticket.').setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }

                if (interaction.customId === 'info_dev_logs') {
                    const devLogsChannel = interaction.guild.channels.cache.find(c => c.name === 'dev-logs');
                    if (devLogsChannel) {
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Dev Logs').setDescription(`Logs in ${devLogsChannel}.`).setThumbnail(LOGO_URL).setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }

                if (interaction.customId === 'info_roadmap') {
                    const roadmapChannel = interaction.guild.channels.cache.find(c => c.name === 'roadmap');
                    if (roadmapChannel) {
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder().setColor(COLORS.dark).setTitle('Roadmap').setDescription(`Check ${roadmapChannel}.`).setThumbnail(LOGO_URL).setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }
            }

            // MODAL SUBMIT
            if (interaction.isModalSubmit()) {
                if (interaction.customId === 'close_ticket_modal') {
                    const reason = interaction.fields.getTextInputValue('reason') || 'No reason provided.';
                    const creatorId = interaction.channel.topic?.match(/\d{17,19}/)?.[0];
                    
                    if (creatorId) {
                        await interaction.channel.permissionOverwrites.edit(creatorId, { ViewChannel: false, SendMessages: false });
                    }
                    
                    const reopenBtn = new ButtonBuilder().setCustomId('reopen_ticket').setLabel('Reopen').setStyle(ButtonStyle.Success);
                    const deleteBtn = new ButtonBuilder().setCustomId('delete_ticket').setLabel('Delete').setStyle(ButtonStyle.Danger);
                    
                    await interaction.channel.send({ 
                        embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Ticket Closed').setDescription(`Closed by ${interaction.user.tag}\nReason: ${reason}`).setTimestamp()],
                        components: [new ActionRowBuilder().addComponents(reopenBtn, deleteBtn)]
                    });
                    
                    await interaction.reply({ 
                        embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Closed').setDescription(`Reason: ${reason}`).setTimestamp()],
                        flags: MessageFlags.Ephemeral
                    });
                }

                if (interaction.customId === 'rules_send_modal') {
                    const query = interaction.fields.getTextInputValue('member_id');
                    const cleanQuery = query.replace(/[<@!>]/g, '').trim();
                    
                    let member = null;
                    
                    if (/^\d{17,19}$/.test(cleanQuery)) {
                        try { member = await interaction.guild.members.fetch(cleanQuery); } catch (error) {}
                    }
                    
                    if (!member) {
                        member = interaction.guild.members.cache.find(m => 
                            m.user.username.toLowerCase() === cleanQuery.toLowerCase() ||
                            m.user.tag.toLowerCase() === cleanQuery.toLowerCase()
                        );
                    }
                    
                    if (!member) {
                        return interaction.reply({ 
                            embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('Member not found.').setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    
                    try {
                        await member.send({
                            embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Server Rules').setDescription('1. Respect Everyone\n2. No Spam\n3. Keep Channels Organized\n4. No Exploits\n5. Follow Discord TOS\n6. Staff Decisions are Final').setThumbnail(LOGO_URL).setTimestamp()]
                        });
                        
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder().setColor('#2ecc71').setTitle('Sent').setDescription(`Rules sent to ${member.user.tag}`).setTimestamp()],
                            flags: MessageFlags.Ephemeral
                        });
                    } catch (error) {
                        await interaction.reply({ 
                            embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('Could not send DM.').setTimestamp()],
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
                        await devLogsChannel.send({ 
                            content: moderatorRole ? `<@&${moderatorRole.id}>` : '',
                            embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Violation Report').addFields({ name: 'Reported by', value: `${interaction.user.tag}` }, { name: 'Offender', value: offender }, { name: 'Description', value: description.substring(0, 1024) }).setTimestamp()]
                        });
                    }
                    
                    await interaction.reply({ 
                        embeds: [new EmbedBuilder().setColor('#2ecc71').setTitle('Reported').setDescription('Report submitted.').setThumbnail(LOGO_URL).setTimestamp()],
                        flags: MessageFlags.Ephemeral
                    });
                }
            }
        } catch (error) {
            console.error('Interaction error:', error);
            
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ 
                        embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('An error occurred.').setTimestamp()],
                        flags: MessageFlags.Ephemeral
                    });
                } else {
                    await interaction.reply({ 
                        embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('An error occurred.').setTimestamp()],
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (replyError) {
                console.error('Could not send error:', replyError);
            }
        }
    }
};
