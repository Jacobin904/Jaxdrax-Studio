const { EmbedBuilder, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');

// Fonction helper pour trouver un membre par ID, mention ou username
async function findMember(guild, query) {
    // Nettoyer la requête
    const cleanQuery = query.replace(/[<@!>]/g, '').trim();
    
    // Essayer par ID d'abord
    if (/^\d{17,19}$/.test(cleanQuery)) {
        try {
            return await guild.members.fetch(cleanQuery);
        } catch (error) {
            // ID invalide ou membre non trouvé
        }
    }
    
    // Essayer par username dans le cache
    const cachedMember = guild.members.cache.find(m => 
        m.user.username.toLowerCase() === cleanQuery.toLowerCase() ||
        m.user.tag.toLowerCase() === cleanQuery.toLowerCase() ||
        m.nickname?.toLowerCase() === cleanQuery.toLowerCase()
    );
    
    if (cachedMember) return cachedMember;
    
    // Chercher dans tous les membres
    try {
        const members = await guild.members.fetch({ query: cleanQuery, limit: 10 });
        if (members.size > 0) {
            return members.first();
        }
    } catch (error) {
        // Erreur de recherche
    }
    
    return null;
}

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isModalSubmit()) return;

        // Member Info Modal
        if (interaction.customId === 'mod_member_info_modal') {
            const query = interaction.fields.getTextInputValue('member_id');
            const member = await findMember(interaction.guild, query);
            
            if (!member) {
                return interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('Error')
                        .setDescription('Could not find member. Please check the ID, username, or mention.')
                        .setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            }
            
            const user = member.user;
            
            const embed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle(`Member Investigation: ${user.tag}`)
                .setDescription(`Comprehensive information about the selected member.`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
                .addFields(
                    {
                        name: '👤 Basic Information',
                        value: `Username: ${user.tag}\nUser ID: ${user.id}\nAccount Created: <t:${Math.floor(user.createdTimestamp / 1000)}:F>\nAccount Age: <t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
                        inline: false
                    },
                    {
                        name: '📥 Server Information',
                        value: `Joined Server: <t:${Math.floor(member.joinedTimestamp / 1000)}:F>\nTime in Server: <t:${Math.floor(member.joinedTimestamp / 1000)}:R>\nNickname: ${member.nickname || 'None'}`,
                        inline: false
                    },
                    {
                        name: '🎭 Roles',
                        value: member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.name).join(', ') || 'No roles',
                        inline: false
                    },
                    {
                        name: '🔍 Moderation Status',
                        value: `Is Bot: ${user.bot ? 'Yes' : 'No'}\nIs Owner: ${member.id === interaction.guild.ownerId ? 'Yes' : 'No'}\nHighest Role: ${member.roles.highest.name}`,
                        inline: false
                    }
                )
                .setFooter({ text: `Investigated by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        // Warn Modal
        if (interaction.customId === 'mod_warn_modal') {
            const query = interaction.fields.getTextInputValue('member_id');
            const reason = interaction.fields.getTextInputValue('reason');
            const member = await findMember(interaction.guild, query);
            
            if (!member) {
                return interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('Error')
                        .setDescription('Could not find member. Please check the ID, username, or mention.')
                        .setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            }
            
            // Log dans dev-logs
            const devLogsChannel = interaction.guild.channels.cache.get(process.env.DEV_LOGS_CHANNEL_ID);
            if (devLogsChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#f39c12')
                    .setTitle('Member Warned')
                    .setDescription(`**Member:** ${member.user.tag} (${member.id})\n**Warned by:** ${interaction.user.tag}\n**Reason:** ${reason}`)
                    .setThumbnail(member.user.displayAvatarURL())
                    .setTimestamp();
                await devLogsChannel.send({ embeds: [logEmbed] });
            }

            // DM le membre
            try {
                await member.send({
                    embeds: [new EmbedBuilder()
                        .setColor('#f39c12')
                        .setTitle('Official Warning')
                        .setDescription(`You have received an official warning in the Jaxdrax Studio Discord server.\n\n**Reason:** ${reason}\n\n**Issued by:** ${interaction.user.tag}\n\nFurther violations may result in more severe actions including timeout, kick, or ban.`)
                        .setThumbnail(LOGO_URL)
                        .setTimestamp()]
                });
            } catch (dmError) {
                // Ignore si DM désactivés
            }

            await interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle('Warning Issued')
                    .setDescription(`Successfully warned ${member.user.tag}.\n\n**Reason:** ${reason}\n\nThe action has been logged and the member has been notified via DM.`)
                    .setTimestamp()],
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        // Timeout Modal
        if (interaction.customId === 'mod_timeout_modal') {
            const query = interaction.fields.getTextInputValue('member_id');
            const duration = parseInt(interaction.fields.getTextInputValue('duration'));
            const reason = interaction.fields.getTextInputValue('reason');
            const member = await findMember(interaction.guild, query);
            
            if (!member) {
                return interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('Error')
                        .setDescription('Could not find member. Please check the ID, username, or mention.')
                        .setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            }
            
            if (isNaN(duration) || duration <= 0) {
                return interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('Error')
                        .setDescription('Invalid duration. Please enter a positive number of minutes.')
                        .setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            }
            
            try {
                await member.timeout(duration * 60 * 1000, reason);
                
                // Log dans dev-logs
                const devLogsChannel = interaction.guild.channels.cache.get(process.env.DEV_LOGS_CHANNEL_ID);
                if (devLogsChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#e67e22')
                        .setTitle('Member Timed Out')
                        .setDescription(`**Member:** ${member.user.tag} (${member.id})\n**Duration:** ${duration} minutes\n**Timed out by:** ${interaction.user.tag}\n**Reason:** ${reason}`)
                        .setThumbnail(member.user.displayAvatarURL())
                        .setTimestamp();
                    await devLogsChannel.send({ embeds: [logEmbed] });
                }

                await interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor('#2ecc71')
                        .setTitle('Timeout Applied')
                        .setDescription(`Successfully timed out ${member.user.tag} for ${duration} minutes.\n\n**Reason:** ${reason}`)
                        .setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
                
            } catch (error) {
                await interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('Error')
                        .setDescription('Could not timeout member. The member may have higher permissions or the duration is invalid.')
                        .setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            }
            return;
        }

        // Kick Modal
        if (interaction.customId === 'mod_kick_modal') {
            const query = interaction.fields.getTextInputValue('member_id');
            const reason = interaction.fields.getTextInputValue('reason');
            const member = await findMember(interaction.guild, query);
            
            if (!member) {
                return interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('Error')
                        .setDescription('Could not find member. Please check the ID, username, or mention.')
                        .setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            }
            
            // DM le membre avant de kick
            try {
                await member.send({
                    embeds: [new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('You Have Been Kicked')
                        .setDescription(`You have been kicked from the Jaxdrax Studio Discord server.\n\n**Reason:** ${reason}\n\n**Kicked by:** ${interaction.user.tag}\n\nYou may rejoin with a new invite if the staff team allows it.`)
                        .setThumbnail(LOGO_URL)
                        .setTimestamp()]
                });
            } catch (dmError) {
                // Ignore si DM désactivés
            }
            
            try {
                await member.kick(reason);
                
                // Log dans dev-logs
                const devLogsChannel = interaction.guild.channels.cache.get(process.env.DEV_LOGS_CHANNEL_ID);
                if (devLogsChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#e74c3c')
                        .setTitle('Member Kicked')
                        .setDescription(`**Member:** ${member.user.tag} (${member.id})\n**Kicked by:** ${interaction.user.tag}\n**Reason:** ${reason}`)
                        .setThumbnail(member.user.displayAvatarURL())
                        .setTimestamp();
                    await devLogsChannel.send({ embeds: [logEmbed] });
                }

                await interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor('#2ecc71')
                        .setTitle('Member Kicked')
                        .setDescription(`Successfully kicked ${member.user.tag}.\n\n**Reason:** ${reason}`)
                        .setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
                
            } catch (error) {
                await interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('Error')
                        .setDescription('Could not kick member. The member may have higher permissions.')
                        .setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            }
            return;
        }

        // Ban Modal
        if (interaction.customId === 'mod_ban_modal') {
            const query = interaction.fields.getTextInputValue('member_id');
            const reason = interaction.fields.getTextInputValue('reason');
            const member = await findMember(interaction.guild, query);
            
            if (!member) {
                return interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('Error')
                        .setDescription('Could not find member. Please check the ID, username, or mention.')
                        .setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            }
            
            // DM le membre avant de ban
            try {
                await member.send({
                    embeds: [new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('You Have Been Banned')
                        .setDescription(`You have been permanently banned from the Jaxdrax Studio Discord server.\n\n**Reason:** ${reason}\n\n**Banned by:** ${interaction.user.tag}\n\nTo appeal this ban, please open a ticket in the server or contact the staff team via email.`)
                        .setThumbnail(LOGO_URL)
                        .setTimestamp()]
                });
            } catch (dmError) {
                // Ignore si DM désactivés
            }
            
            try {
                await member.ban({ reason: reason, deleteMessageSeconds: 0 });
                
                // Log dans dev-logs
                const devLogsChannel = interaction.guild.channels.cache.get(process.env.DEV_LOGS_CHANNEL_ID);
                if (devLogsChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('Member Banned')
                        .setDescription(`**Member:** ${member.user.tag} (${member.id})\n**Banned by:** ${interaction.user.tag}\n**Reason:** ${reason}`)
                        .setThumbnail(member.user.displayAvatarURL())
                        .setTimestamp();
                    await devLogsChannel.send({ embeds: [logEmbed] });
                }

                await interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor('#2ecc71')
                        .setTitle('Member Banned')
                        .setDescription(`Successfully banned ${member.user.tag}.\n\n**Reason:** ${reason}`)
                        .setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
                
            } catch (error) {
                await interaction.reply({ 
                    embeds: [new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('Error')
                        .setDescription('Could not ban member. The member may have higher permissions.')
                        .setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            }
            return;
        }
    }
};

        // Rules Send Modal
        if (interaction.customId === 'rules_send_modal') {
            const query = interaction.fields.getTextInputValue('member_id');
            
            // Importer la fonction findMember
            const findMember = async (guild, query) => {
                const cleanQuery = query.replace(/[<@!>]/g, '').trim();
                
                if (/^\d{17,19}$/.test(cleanQuery)) {
                    try {
                        return await guild.members.fetch(cleanQuery);
                    } catch (error) {}
                }
                
                const cachedMember = guild.members.cache.find(m => 
                    m.user.username.toLowerCase() === cleanQuery.toLowerCase() ||
                    m.user.tag.toLowerCase() === cleanQuery.toLowerCase() ||
                    m.nickname?.toLowerCase() === cleanQuery.toLowerCase()
                );
                
                if (cachedMember) return cachedMember;
                
                try {
                    const members = await guild.members.fetch({ query: cleanQuery, limit: 10 });
                    if (members.size > 0) return members.first();
                } catch (error) {}
                
                return null;
            };
            
            const member = await findMember(interaction.guild, query);
            
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
                        .setDescription('Please read and follow the server rules carefully.\n\n**1. Respect Everyone**\n**2. No Spam or Self Promotion**\n**3. Keep Channels Organized**\n**4. No Exploits or Cheating**\n**5. Follow Discord TOS**\n**6. Staff Decisions are Final**\n\nFor the complete rules, please visit the rules channel in the server.')
                        .setThumbnail(LOGO_URL)
                        .setFooter({ text: 'Jaxdrax Studio', iconURL: LOGO_URL })
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
            return;
        }

        // Rules Report Modal
        if (interaction.customId === 'rules_report_modal') {
            const offender = interaction.fields.getTextInputValue('offender');
            const description = interaction.fields.getTextInputValue('description');
            
            const devLogsChannel = interaction.guild.channels.cache.get(process.env.DEV_LOGS_CHANNEL_ID);
            
            if (devLogsChannel) {
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
                    .setFooter({ text: 'Jaxdrax Studio Reports', iconURL: LOGO_URL })
                    .setTimestamp();
                
                await devLogsChannel.send({ 
                    content: '<@&' + interaction.guild.roles.cache.find(r => r.name === 'Moderator')?.id + '>',
                    embeds: [reportEmbed] 
                });
            }
            
            await interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle('Report Submitted')
                    .setDescription('Your report has been submitted to the moderation team. A staff member will review it shortly.\n\nThank you for helping keep the community safe!')
                    .setThumbnail(LOGO_URL)
                    .setTimestamp()],
                flags: MessageFlags.Ephemeral
            });
            return;
        }
