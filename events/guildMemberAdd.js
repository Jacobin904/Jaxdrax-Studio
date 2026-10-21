const { EmbedBuilder } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');
const { sendDevLog } = require('../utils/logger');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        const channel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
        if (channel) {
            const accountCreationDate = Math.floor(member.user.createdTimestamp / 1000);
            const embed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Welcome to Your Fish Life!')
                .setDescription(`Hello <@${member.user.id}> and welcome to the official Jaxdrax Studio Discord server! We are thrilled to have you join our growing community of fish enthusiasts.\n\n**Your Account Details:**\n• Username: ${member.user.username}\n• User ID: ${member.user.id}\n• Account Created: <t:${accountCreationDate}:F> (<t:${accountCreationDate}:R>)\n\n**Getting Started:**\n• Please read the rules in the rules channel to ensure a positive experience.\n• Check out the announcements for the latest game updates.\n• Introduce yourself in the general-chat and meet other players!\n\nEnjoy your stay and happy fishing!`)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setFooter({ text: 'Jaxdrax Studio Community', iconURL: LOGO_URL })
                .setTimestamp();
            await channel.send({ embeds: [embed] });
        }

        if (process.env.MEMBER_ROLE_ID) {
            try { await member.roles.add(process.env.MEMBER_ROLE_ID); } catch (e) {}
        }

        const logEmbed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('New Member Joined')
            .setDescription(`A new member has joined the server.\n\n**Member Details:**\n• Mention: <@${member.user.id}>\n• Username: ${member.user.username}\n• User ID: ${member.user.id}\n• Account Age: <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n\n**Action Taken:**\n• Automatically assigned the Member role.\n• Welcome message sent to the welcome channel.`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setFooter({ text: 'Jaxdrax Studio Security Log', iconURL: LOGO_URL })
            .setTimestamp();

        sendDevLog(client, logEmbed);
    }
};
