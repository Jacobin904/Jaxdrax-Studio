const { EmbedBuilder, ChannelType, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');

module.exports = {
    name: 'config',
    async execute(message, isStaff) {
        if (!isStaff) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Access Denied')
                .setDescription('This command is restricted to staff members only. If you believe you should have access, please contact a server administrator.')
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Security', iconURL: LOGO_URL })
                .setTimestamp();
            return message.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const guild = message.guild;
        const processingEmbed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Processing Configuration Dump')
            .setDescription('Gathering comprehensive server configuration data... Please check your DMs for the complete report.')
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Config Tool', iconURL: LOGO_URL })
            .setTimestamp();

        await message.reply({ embeds: [processingEmbed], flags: MessageFlags.Ephemeral });

        const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).map(c => `\`${c.id}\` - ${c.name}`).join('\n') || 'None';
        const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).map(c => `\`${c.id}\` - ${c.name}`).join('\n') || 'None';
        const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).map(c => `\`${c.id}\` - ${c.name}`).join('\n') || 'None';
        const roles = guild.roles.cache.filter(r => r.name !== '@everyone').sort((a, b) => b.position - a.position).map(r => `\`${r.id}\` - ${r.name} (${r.hexColor})`).join('\n') || 'None';

        const configEmbed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Server Configuration Dump - Complete Report')
            .setDescription(`Full configuration data for **${guild.name}** (ID: \`${guild.id}\`).\n\n**Server Overview:**\n• Total Members: ${guild.memberCount}\n• Owner: <@${guild.ownerId}>\n• Created: <t:${Math.floor(guild.createdTimestamp / 1000)}:F>\n• Boost Level: ${guild.premiumTier}\n• Boosts: ${guild.premiumSubscriptionCount}`)
            .addFields(
                { name: `Categories (${guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size})`, value: categories.substring(0, 1024) },
                { name: `Text Channels (${guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size})`, value: textChannels.substring(0, 1024) },
                { name: `Voice Channels (${guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size})`, value: voiceChannels.substring(0, 1024) },
                { name: `Roles (${guild.roles.cache.size - 1})`, value: roles.substring(0, 1024) }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Config Tool', iconURL: LOGO_URL })
            .setTimestamp();

        try {
            await message.author.send({ embeds: [configEmbed] });
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('DM Delivery Failed')
                .setDescription('I could not send you the configuration report via DM. Please ensure that "Allow direct messages from server members" is enabled in your privacy settings for this server.')
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Config Tool', iconURL: LOGO_URL })
                .setTimestamp();
            await message.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        }
    }
};
