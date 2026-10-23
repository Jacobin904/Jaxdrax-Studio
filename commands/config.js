const { EmbedBuilder, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');

// Fonction pour trouver un membre
async function findMember(guild, query) {
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
                        .setDescription('Could not find member.')
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
                    { name: '👤 Basic Information', value: `Username: ${user.tag}\nUser ID: ${user.id}\nAccount Created: <t:${Math.floor(user.createdTimestamp / 1000)}:F>\nAccount Age: <t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: false },
                    { name: '📥 Server Information', value: `Joined Server: <t:${Math.floor(member.joinedTimestamp / 1000)}:F>\nTime in Server: <t:${Math.floor(member.joinedTimestamp / 1000)}:R>\nNickname: ${member.nickname || 'None'}`, inline: false },
                    { name: '🎭 Roles', value: member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.name).join(', ') || 'No roles', inline: false },
                    { name: '🔍 Moderation Status', value: `Is Bot: ${user.bot ? 'Yes' : 'No'}\nIs Owner: ${member.id === interaction.guild.ownerId ? 'Yes' : 'No'}\nHighest Role: ${member.roles.highest.name}`, inline: false }
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
                    embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('Could not find member.').setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            }
            
            const devLogsChannel = interaction.guild.channels.cache.get(process.env.DEV_LOGS_CHANNEL_ID);
            if (devLogsChannel) {
                await devLogsChannel.send({ embeds: [new EmbedBuilder().setColor('#f39c12').setTitle('Member Warned').setDescription(`**Member:** ${member.user.tag} (${member.id})\n**Warned by:** ${interaction.user.tag}\n**Reason:** ${reason}`).setThumbnail(member.user.displayAvatarURL()).setTimestamp()] });
            }

            try {
                await member.send({ embeds: [new EmbedBuilder().setColor('#f39c12').setTitle('Official Warning').setDescription(`You have received an official warning.\n\n**Reason:** ${reason}\n\n**Issued by:** ${interaction.user.tag}`).setThumbnail(LOGO_URL).setTimestamp()] });
            } catch (dmError) {}

            await interaction.reply({ 
                embeds: [new EmbedBuilder().setColor('#2ecc71').setTitle('Warning Issued').setDescription(`Successfully warned ${member.user.tag}.\n\n**Reason:** ${reason}`).setTimestamp()],
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
                    embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('Could not find member.').setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            }
            
            if (isNaN(duration) || duration <= 0) {
                return interaction.reply({ 
                    embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('Invalid duration.').setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            }
            
            try {
                await member.timeout(duration * 60 * 1000, reason);
                
                const devLogsChannel = interaction.guild.channels.cache.get(process.env.DEV_LOGS_CHANNEL_ID);
                if (devLogsChannel) {
                    await devLogsChannel.send({ embeds: [new EmbedBuilder().setColor('#e67e22').setTitle('Member Timed Out').setDescription(`**Member:** ${member.user.tag} (${member.id})\n**Duration:** ${duration} minutes\n**Timed out by:** ${interaction.user.tag}\n**Reason:** ${reason}`).setThumbnail(member.user.displayAvatarURL()).setTimestamp()] });
                }

                await interaction.reply({ 
                    embeds: [new EmbedBuilder().setColor('#2ecc71').setTitle('Timeout Applied').setDescription(`Successfully timed out ${member.user.tag} for ${duration} minutes.\n\n**Reason:** ${reason}`).setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            } catch (error) {
                await interaction.reply({ 
                    embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('Could not timeout member.').setTimestamp()],
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
                    embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('Could not find member.').setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            }
            
            try {
                await member.send({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('You Have Been Kicked').setDescription(`You have been kicked.\n\n**Reason:** ${reason}\n\n**Kicked by:** ${interaction.user.tag}`).setThumbnail(LOGO_URL).setTimestamp()] });
            } catch (dmError) {}
            
            try {
                await member.kick(reason);
                
                const devLogsChannel = interaction.guild.channels.cache.get(process.env.DEV_LOGS_CHANNEL_ID);
                if (devLogsChannel) {
                    await devLogsChannel.send({ embeds: [new EmbedBuilder().setColor('#e74c3c').setTitle('Member Kicked').setDescription(`**Member:** ${member.user.tag} (${member.id})\n**Kicked by:** ${interaction.user.tag}\n**Reason:** ${reason}`).setThumbnail(member.user.displayAvatarURL()).setTimestamp()] });
                }

                await interaction.reply({ 
                    embeds: [new EmbedBuilder().setColor('#2ecc71').setTitle('Member Kicked').setDescription(`Successfully kicked ${member.user.tag}.\n\n**Reason:** ${reason}`).setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            } catch (error) {
                await interaction.reply({ 
                    embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('Could not kick member.').setTimestamp()],
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
                    embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('Could not find member.').setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            }
            
            try {
                await member.send({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('You Have Been Banned').setDescription(`You have been permanently banned.\n\n**Reason:** ${reason}\n\n**Banned by:** ${interaction.user.tag}`).setThumbnail(LOGO_URL).setTimestamp()] });
            } catch (dmError) {}
            
            try {
                await member.ban({ reason: reason, deleteMessageSeconds: 0 });
                
                const devLogsChannel = interaction.guild.channels.cache.get(process.env.DEV_LOGS_CHANNEL_ID);
                if (devLogsChannel) {
                    await devLogsChannel.send({ embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Member Banned').setDescription(`**Member:** ${member.user.tag} (${member.id})\n**Banned by:** ${interaction.user.tag}\n**Reason:** ${reason}`).setThumbnail(member.user.displayAvatarURL()).setTimestamp()] });
                }

                await interaction.reply({ 
                    embeds: [new EmbedBuilder().setColor('#2ecc71').setTitle('Member Banned').setDescription(`Successfully banned ${member.user.tag}.\n\n**Reason:** ${reason}`).setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            } catch (error) {
                await interaction.reply({ 
                    embeds: [new EmbedBuilder().setColor(COLORS.red).setTitle('Error').setDescription('Could not ban member.').setTimestamp()],
                    flags: MessageFlags.Ephemeral
                });
            }
            return;
        }
    }
};
