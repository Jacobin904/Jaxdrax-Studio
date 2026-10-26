const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the current track'),
    async execute(interaction) {
        const isStaff = interaction.member.roles.cache.some(role => STAFF_ROLES.includes(role.name));
        
        if (!isStaff) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(COLORS.red)
                    .setTitle('Access Denied')
                    .setDescription('Only staff members can skip tracks.')
                    .setThumbnail(LOGO_URL)
                    .setTimestamp()],
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            const { skipTrack, getQueue } = require('../utils/voiceManager');
            skipTrack();
            
            const queueInfo = getQueue();
            
            const embed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Track Skipped')
                .setDescription('The current track has been skipped.')
                .addFields({
                    name: 'Now Playing',
                    value: queueInfo.current ? `${queueInfo.current.title} by ${queueInfo.current.artist}` : 'Nothing playing',
                    inline: false
                })
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Music', iconURL: LOGO_URL })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(COLORS.red)
                    .setTitle('Error')
                    .setDescription('No music is currently playing or an error occurred.')
                    .setThumbnail(LOGO_URL)
                    .setTimestamp()],
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
