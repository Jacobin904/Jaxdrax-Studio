const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, LOGO_URL, BANNER_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Displays information about Your Fish Life'),
    name: 'info',
    description: 'Displays information about Your Fish Life',
    
    async execute(target, isStaff, client) {
        const isInteraction = target.isChatInputCommand !== undefined;
        const member = isInteraction ? target.member : target.member;
        const guild = isInteraction ? target.guild : target.guild;
        const channel = isInteraction ? target.channel : target.channel;

        const isStaffMember = member.roles.cache.some(role => STAFF_ROLES.includes(role.name));

        if (isStaffMember) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Your Fish Life - Game Information')
                .setDescription('Your Fish Life is an upcoming Roblox experience developed by Jaxdrax Studio. Dive into a relaxing and immersive aquarium building simulation where you can discover new fish species, customize your tanks, and connect with a growing community of players.')
                .addFields(
                    { 
                        name: 'Developer', 
                        value: 'Jaxdrax Studio', 
                        inline: true 
                    },
                    { 
                        name: 'Status', 
                        value: 'Active Development', 
                        inline: true 
                    },
                    { 
                        name: 'Platform', 
                        value: 'Roblox (PC, Mobile, Console)', 
                        inline: true 
                    },
                    { 
                        name: 'Core Features', 
                        value: '• **Aquarium Building:** Complete customization system with decorations, filters, and lighting options.\n• **Fish Discovery:** Over 100 unique species to discover, each with unique behaviors and requirements.\n• **Breeding System:** Advanced genetics-based breeding mechanics.\n• **Community Events:** Regular seasonal events with exclusive content.', 
                        inline: false 
                    },
                    { 
                        name: 'Server Statistics', 
                        value: `**Members:** ${guild.memberCount}\n**Roles:** ${guild.roles.cache.size}\n**Channels:** ${guild.channels.cache.size}\n**Server Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, 
                        inline: false 
                    }
                )
                .setThumbnail(LOGO_URL)
                .setImage(BANNER_URL)
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

            // Envoyer un message séparé (pas de reply)
            const sentMessage = await channel.send({ embeds: [embed], components: [row] });
            
            // Stocker l'ID du message pour pouvoir le modifier plus tard
            if (!client.commandMessages) client.commandMessages = new Map();
            client.commandMessages.set(`info_${member.id}`, sentMessage.id);
        } else {
            const infoChannel = guild.channels.cache.find(c => c.name === 'informations');
            if (infoChannel) {
                await channel.send(`For more information about Your Fish Life, please check ${infoChannel}`);
            } else {
                await channel.send('The information channel could not be found. Please contact a staff member for assistance.');
            }
        }
    }
};
