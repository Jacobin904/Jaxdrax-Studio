const { EmbedBuilder, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');
const { addToQueue, getQueue, skipTrack } = require('../utils/voiceManager');

module.exports = {
    name: 'play',
    async execute(message, isStaff) {
        const args = message.content.trim().split(/ +/).slice(1);
        
        if (args.length === 0) {
            const queueInfo = getQueue();
            
            const embed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Music Player')
                .setDescription('Use `!play <spotify_url>` to add music to the queue.\n\n**Current Track:**\n' + 
                    (queueInfo.current ? `${queueInfo.current.title} by ${queueInfo.current.artist}` : 'Nothing playing'))
                .addFields({
                    name: `Queue (${queueInfo.queue.length} tracks)`,
                    value: queueInfo.queue.slice(0, 10).map((t, i) => `${i + 1}. ${t.title} - ${t.artist}`).join('\n') || 'Empty',
                    inline: false
                })
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Music', iconURL: LOGO_URL })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        const url = args[0];
        
        if (!url.includes('spotify.com')) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor(COLORS.red)
                    .setTitle('Invalid URL')
                    .setDescription('Please provide a valid Spotify track or playlist URL.')
                    .setThumbnail(LOGO_URL)
                    .setTimestamp()],
                flags: MessageFlags.Ephemeral
            });
        }

        const count = await addToQueue(url);
        
        if (count === 0) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor(COLORS.red)
                    .setTitle('Error')
                    .setDescription('Could not find the track or playlist. Please check the URL.')
                    .setThumbnail(LOGO_URL)
                    .setTimestamp()],
                flags: MessageFlags.Ephemeral
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

        await message.reply({ embeds: [embed] });

        // Si rien ne joue, commencer la lecture
        if (!queueInfo.current && queueInfo.queue.length > 0) {
            const { playNext } = require('../utils/voiceManager');
            playNext();
        }
    }
};
