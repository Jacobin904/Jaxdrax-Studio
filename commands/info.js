const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Displays information about Your Fish Life'),
    async execute(interaction) {
        const isStaff = interaction.member.roles.cache.some(role => STAFF_ROLES.includes(role.name));

        if (isStaff) {
            // Staff version: affiche les infos complètes dans le salon pour les membres
            const guild = interaction.guild;
            const embed = new EmbedBuilder()
                .setColor(COLORS.gray)
                .setTitle('Your Fish Life - Game Info')
                .setDescription('Your Fish Life is an upcoming Roblox experience developed by Jaxdrax Studio. Dive into a relaxing and immersive aquarium building simulation where you can discover new fish species, customize your tanks, and connect with a growing community of players.\n\n**Key Features:**\n• Build and customize your own aquarium\n• Discover and collect new fish species\n• Relaxing gameplay with regular updates\n• Active community and support')
                .addFields(
                    { name: 'Developer', value: 'Jaxdrax Studio', inline: true },
                    { name: 'Status', value: 'Currently in Development', inline: true },
                    { name: 'Platform', value: 'Roblox (PC, Mobile, Console)', inline: true },
                    { name: 'Legal', value: 'This project is protected by a proprietary license. All rights reserved by Jaxdrax Studio.', inline: false }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio', iconURL: LOGO_URL })
                .setTimestamp();

            const licenseButton = new ButtonBuilder()
                .setCustomId('info_view_license')
                .setLabel('View License')
                .setStyle(ButtonStyle.Secondary);

            const ticketButton = new ButtonBuilder()
                .setCustomId('info_open_ticket')
                .setLabel('Support Ticket')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(licenseButton, ticketButton);

            await interaction.reply({ embeds: [embed], components: [row] });
        } else {
            // Membre version: redirige vers le salon #informations
            const infoChannel = interaction.guild.channels.cache.find(channel => channel.name === 'informations');
            
            if (infoChannel) {
                await interaction.reply({
                    content: 'For more information about Your Fish Life, please check ' + infoChannel,
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.reply({
                    content: 'The information channel could not be found. Please contact a staff member.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
};
