const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Displays detailed information about Your Fish Life'),
    name: 'info',
    description: 'Displays detailed information about Your Fish Life',
    
    async execute(target, isStaff, client) {
        const isInteraction = target.isChatInputCommand !== undefined;
        const member = isInteraction ? target.member : target.member;
        const guild = isInteraction ? target.guild : target.guild;
        const reply = isInteraction ? target.reply.bind(target) : target.reply.bind(target);

        const isStaffMember = member.roles.cache.some(role => STAFF_ROLES.includes(role.name));

        if (isStaffMember) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Your Fish Life - Complete Game Information')
                .setDescription('Your Fish Life is an upcoming Roblox experience developed by Jaxdrax Studio. Dive into a relaxing and immersive aquarium building simulation where you can discover new fish species, customize your tanks, and connect with a growing community of players.')
                .addFields(
                    { 
                        name: 'Developer Information', 
                        value: '**Studio:** Jaxdrax Studio\n**Status:** Active Development\n**Target Platforms:** PC, Mobile, Console (Xbox, PlayStation)\n**Team:** Dedicated remote development and community management team.', 
                        inline: true 
                    },
                    { 
                        name: 'Server Statistics', 
                        value: `**Members:** ${guild.memberCount}\n**Roles:** ${guild.roles.cache.size}\n**Channels:** ${guild.channels.cache.size}\n**Server Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, 
                        inline: true 
                    },
                    { 
                        name: 'Core Features', 
                        value: '• **Aquarium Building:** Complete customization system with decorations and lighting.\n• **Fish Discovery:** Over 100 unique species with distinct behaviors.\n• **Breeding System:** Advanced genetics-based mechanics.\n• **Community Events:** Regular seasonal updates with exclusive content.', 
                        inline: false 
                    },
                    { 
                        name: 'Support and Assistance', 
                        value: '**Ticket System:** Use the "Support Ticket" button below or the `/ticket` command.\n**Response Time:** Usually within 2-4 hours.\n**Common Issues:** Account recovery, bug reports, player reports, and suggestions.\n\n*Note: All support requests must go through the official ticket system. Do not DM staff directly.*', 
                        inline: false 
                    },
                    { 
                        name: 'Legal and Licensing', 
                        value: '**License:** Proprietary - All Rights Reserved\n**Copyright:** © 2024-2027 Jaxdrax Studio\n\nAll game assets, code, designs, and content are the exclusive property of Jaxdrax Studio. Unauthorized use, distribution, or modification is strictly prohibited.', 
                        inline: false 
                    }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Development Team', iconURL: LOGO_URL })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('info_view_license')
                    .setLabel('View License')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('info_open_ticket')
                    .setLabel('Support Ticket')
                    .setStyle(ButtonStyle.Primary)
            );

            await reply({ embeds: [embed], components: [row] });
        } else {
            const infoChannel = guild.channels.cache.find(c => c.name === 'informations');
            if (infoChannel) {
                await reply({ 
                    content: `For more detailed information about Your Fish Life, please check ${infoChannel}`, 
                    flags: MessageFlags.Ephemeral 
                });
            } else {
                await reply({ 
                    content: 'The information channel could not be found. Please contact a staff member for assistance.', 
                    flags: MessageFlags.Ephemeral 
                });
            }
        }
    }
};
