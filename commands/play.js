const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');
const { addToQueue, getQueue, playNext } = require('../utils/voiceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Joue de la musique Spotify dans le salon vocal')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('URL Spotify (piste ou playlist)')
                .setRequired(true)),
    async execute(interaction) {
        const url = interaction.options.getString('url');
        
        if (!url.includes('spotify.com')) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(COLORS.red)
                    .setTitle('URL invalide')
                    .setDescription('Veuillez fournir une URL Spotify valide (piste ou playlist).')
                    .setThumbnail(LOGO_URL)
                    .setTimestamp()],
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Ajout à la file d\'attente')
                .setDescription('Recherche de la musique en cours...')
                .setThumbnail(LOGO_URL)
                .setTimestamp()],
            flags: MessageFlags.Ephemeral
        });

        try {
            const count = await addToQueue(url);
            
            if (count === 0) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(COLORS.red)
                        .setTitle('Erreur')
                        .setDescription('Impossible de trouver la piste ou la playlist. Vérifie l\'URL.')
                        .setThumbnail(LOGO_URL)
                        .setTimestamp()]
                });
            }

            const queueInfo = getQueue();
            
            const embed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Ajouté à la file d\'attente')
                .setDescription(`${count} piste${count > 1 ? 's' : ''} ajoutée${count > 1 ? 's' : ''} à la file d'attente.`)
                .addFields({
                    name: `File d'attente (${queueInfo.queue.length} pistes)`,
                    value: queueInfo.queue.slice(0, 10).map((t, i) => `${i + 1}. ${t.title} - ${t.artist}`).join('\n') || 'Vide',
                    inline: false
                })
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Musique Jaxdrax Studio', iconURL: LOGO_URL })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            if (!queueInfo.current && queueInfo.queue.length > 0) {
                playNext();
            }
        } catch (error) {
            console.error('[Play] Erreur:', error.message);
            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor(COLORS.red)
                    .setTitle('Erreur')
                    .setDescription(`Une erreur est survenue: ${error.message}`)
                    .setThumbnail(LOGO_URL)
                    .setTimestamp()]
            });
        }
    }
};
