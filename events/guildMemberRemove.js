const { EmbedBuilder } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');
const { sendDevLog } = require('../utils/logger');

module.exports = {
    name: 'guildMemberRemove',
    execute(member, client) {
        const embed = new EmbedBuilder()
            .setColor(COLORS.red)
            .setTitle('Member Left Server')
            .setDescription(`A member has left the server or was removed.\n\n**Member Details:**\n• Mention: <@${member.user.id}>\n• Username: ${member.user.username}\n• User ID: ${member.user.id}\n• Account Age: <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n\n**Possible Reasons:**\n• Voluntary departure\n• Kick by a moderator\n• Ban by a moderator\n\nPlease check the audit log for more details if necessary.`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setFooter({ text: 'Jaxdrax Studio Security Log', iconURL: LOGO_URL })
            .setTimestamp();

        sendDevLog(client, embed);
    }
};
