const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a Spotify track or playlist in the voice channel')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Spotify URL (track or playlist)')
                .setRequired(true)),
    async execute(interaction) {
        const url = interaction.options.getString('url');
        
        if (!url.includes('spotify.com')) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(COLORS.red)
                    .setTitle('Invalid URL')
                    .setDescription('Please provide a valid Spotify track or playlist URL.')
                    .setThumbnail(LOGO_URL)
                    .setTimestamp()],
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Adding to Queue')
                .setDescription('Searching for the music...')
                .setThumbnail(LOGO_URL)
                .setTimestamp()],
            flags: MessageFlags.Ephemeral
        });

        try {
            const { addToQueue, getQueue, playNext } = require('../utils/voiceManager');
            const count = await addToQueue(url);
            
            if (count === 0) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('Error')
                        .setDescription('Could not find the track or playlist. Please check the URL.')
                        .setThumbnail(LOGO_URL)
                        .setTimestamp()]
                });
            }

            const queueInfo = getQueue();
            
            const embed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Added to Queue')
                .setDescription(`Added ${count} track${count > 1 ? 's' : ''} to the queue.`)
                .addFields({
                    name: `Queue (${queueInfo.queue.length} tracks)`,
                    value: queueInfo.queue.slice(0, 10).map((t, i) => `${i + 1}. ${t.title} - ${t.artist}`).join('\n') || 'Empty',
                    inline: false
                })
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Music', iconURL: LOGO_URL })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            if (!queueInfo.current && queueInfo.queue.length > 0) {
                playNext();
            }
        } catch (error) {
            console.error('[Play] Error:', error.message);
            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(COLORS.red)
                    .setTitle('Error')
                    .setDescription(`An error occurred: ${error.message}. Please ensure the bot dependencies are correctly installed.`)
                    .setThumbnail(LOGO_URL)
                    .setTimestamp()]
            });
        }
    }
};
