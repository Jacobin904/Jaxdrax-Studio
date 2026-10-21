const { EmbedBuilder } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');
const { sendDevLog } = require('../utils/logger');

module.exports = {
    name: 'messageDelete',
    execute(message, client) {
        if (message.author.bot || !message.guild) return;

        const embed = new EmbedBuilder()
            .setColor(COLORS.gray)
            .setTitle('Message Deleted')
            .setDescription(`A message was deleted from the server.\n\n**Author Details:**\n• Mention: <@${message.author.id}>\n• Username: ${message.author.username}\n• User ID: ${message.author.id}\n\n**Channel Details:**\n• Channel: <#${message.channel.id}>\n• Channel ID: ${message.channel.id}\n\n**Deleted Content:**\n${message.content || '*No text content (embed or attachment)*'}`)
            .setFooter({ text: 'Jaxdrax Studio Moderation Log', iconURL: LOGO_URL })
            .setTimestamp();

        sendDevLog(client, embed);
    }
};
