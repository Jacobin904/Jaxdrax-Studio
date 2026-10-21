const { EmbedBuilder } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');
const { sendDevLog } = require('../utils/logger');

module.exports = {
    name: 'messageUpdate',
    execute(oldMessage, newMessage, client) {
        if (oldMessage.author.bot || !oldMessage.guild || oldMessage.content === newMessage.content) return;

        const embed = new EmbedBuilder()
            .setColor(COLORS.gray)
            .setTitle('Message Edited')
            .setDescription(`A message was edited by a user.\n\n**Author Details:**\n• Mention: <@${oldMessage.author.id}>\n• Username: ${oldMessage.author.username}\n• User ID: ${oldMessage.author.id}\n\n**Channel Details:**\n• Channel: <#${oldMessage.channel.id}>\n• Channel ID: ${oldMessage.channel.id}\n\n**Original Content:**\n${oldMessage.content || '*No text content*'}\n\n**New Content:**\n${newMessage.content || '*No text content*'}`)
            .setFooter({ text: 'Jaxdrax Studio Moderation Log', iconURL: LOGO_URL })
            .setTimestamp();

        sendDevLog(client, embed);
    }
};
