const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Joue de la musique Spotify dans le salon vocal')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('URL Spotify (piste ou playlist)')
                .setRequired(true)),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(COLORS.red)
            .setTitle('Fonctionnalité en maintenance')
            .setDescription('La fonctionnalité de lecture de musique est temporairement désactivée pour maintenance. Elle sera bientôt disponible à nouveau.')
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio', iconURL: LOGO_URL })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
