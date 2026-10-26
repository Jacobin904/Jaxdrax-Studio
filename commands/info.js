const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Displays information about Your Fish Life'),
    name: 'info',
    description: 'Displays information about Your Fish Life',
    
    async execute(target, isStaff) {
        const isInteraction = target.isChatInputCommand !== undefined;
        const member = isInteraction ? target.member : target.member;
        const guild = isInteraction ? target.guild : target.guild;
        const reply = isInteraction ? target.reply.bind(target) : target.reply.bind(target);

        const isStaffMember = member.roles.cache.some(role => STAFF_ROLES.includes(role.name));

        if (isStaffMember) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Your Fish Life - Game Information')
                .setDescription('Your Fish Life is an upcoming Roblox experience developed by Jaxdrax Studio. Dive into a relaxing and immersive aquarium building simulation.')
                .addFields(
                    { name: 'Developer', value: 'Jaxdrax Studio', inline: true },
                    { name: 'Status', value: 'Active Development', inline: true },
                    { name: 'Platform', value: 'Roblox (PC, Mobile, Console)', inline: true },
                    { name: 'Core Features', value: 'Aquarium building, fish species discovery, community relaxation, and regular content updates.', inline: false },
                    { name: 'Legal', value: 'This project is protected by a proprietary license. All rights reserved by Jaxdrax Studio.', inline: false }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio', iconURL: LOGO_URL })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('info_view_license').setLabel('View License').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('info_open_ticket').setLabel('Support Ticket').setStyle(ButtonStyle.Primary)
            );

            await reply({ embeds: [embed], components: [row] });
        } else {
            const infoChannel = guild.channels.cache.find(c => c.name === 'informations');
            if (infoChannel) {
                await reply({ content: `For more information about Your Fish Life, please check ${infoChannel}`, flags: MessageFlags.Ephemeral });
            } else {
                await reply({ content: 'The information channel could not be found. Please contact a staff member.', flags: MessageFlags.Ephemeral });
            }
        }
    }
};
