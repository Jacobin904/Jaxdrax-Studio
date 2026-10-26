const { EmbedBuilder, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');
const { skipTrack, getQueue } = require('../utils/voiceManager');

module.exports = {
    name: 'skip',
    async execute(message, isStaff) {
        if (!isStaff) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor(COLORS.red)
                    .setTitle('Access Denied')
                    .setDescription('Only staff members can skip tracks.')
                    .setThumbnail(LOGO_URL)
                    .setTimestamp()],
                flags: MessageFlags.Ephemeral
            });
        }

        skipTrack();
        
        const queueInfo = getQueue();
        
        const embed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Track Skipped')
            .setDescription('Skipped the current track.')
            .addFields({
                name: 'Now Playing',
                value: queueInfo.current ? `${queueInfo.current.title} by ${queueInfo.current.artist}` : 'Nothing playing',
                inline: false
            })
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Music', iconURL: LOGO_URL })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};
