const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');
const { skipTrack, getQueue } = require('../utils/voiceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Passe à la piste suivante'),
    async execute(interaction) {
        const isStaff = interaction.member.roles.cache.some(role => STAFF_ROLES.includes(role.name));
        
        if (!isStaff) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(COLORS.red)
                    .setTitle('Accès refusé')
                    .setDescription('Seuls les membres du staff peuvent passer des pistes.')
                    .setThumbnail(LOGO_URL)
                    .setTimestamp()],
                flags: MessageFlags.Ephemeral
            });
        }

        skipTrack();
        
        const queueInfo = getQueue();
        
        const embed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Piste passée')
            .setDescription('La piste actuelle a été passée.')
            .addFields({
                name: 'En cours de lecture',
                value: queueInfo.current ? `${queueInfo.current.title} par ${queueInfo.current.artist}` : 'Rien en lecture',
                inline: false
            })
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Musique Jaxdrax Studio', iconURL: LOGO_URL })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
