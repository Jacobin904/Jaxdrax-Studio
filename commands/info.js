const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');

module.exports = {
    name: 'info',
    async execute(message, isStaff, robloxPresence) {
        if (isStaff) {
            const guild = message.guild;
            
            // Premier embed : Infos du jeu
            const gameInfoEmbed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Your Fish Life - Complete Game Information')
                .setDescription('Comprehensive details regarding the development and status of the Your Fish Life Roblox experience.\n\n**Development Status:**\n• Current Phase: Active Development\n• Last Update: Ongoing\n• Next Milestone: Beta Testing')
                .addFields(
                    { name: 'Developer', value: 'Jaxdrax Studio' },
                    { name: 'Core Features', value: 'Aquarium building, fish species discovery, community relaxation, and regular content updates.' },
                    { name: 'Discord Stats', value: `Members: ${guild.memberCount}\nRoles: ${guild.roles.cache.size}\nChannels: ${guild.channels.cache.size}` },
                    { name: 'Roblox Live Stats', value: `Players Online: ${robloxPresence.onlinePlayers}\nServer Status: ${robloxPresence.serverStatus}` },
                    { name: 'Support', value: 'Use the ticket system below or visit the help-desk channel for assistance.' }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Development Team', iconURL: LOGO_URL })
                .setTimestamp();

            // Deuxième embed : Système de ticket
            const ticketEmbed = new EmbedBuilder()
                .setColor(COLORS.darkRed)
                .setTitle('Support Ticket System')
                .setDescription('Need help? Open a private support ticket to get assistance from the Jaxdrax Studio team.\n\n**How it works:**\n• Click the button below to create a private ticket channel\n• Only you and the staff team will have access\n• Describe your issue in detail\n• A staff member will assist you shortly\n\n**Before opening a ticket:**\n• Ensure you have read the server rules\n• Check if your issue has already been answered\n• Prepare a detailed description of your problem\n\nTickets are for serious inquiries only. Spam or misuse will result in loss of ticket privileges.')
                .addFields(
                    { name: 'What can you get help with?', value: '• Technical issues and bugs\n• Account problems\n• Game-related questions\n• Suggestions and feedback\n• Any other concerns' },
                    { name: 'Response Time', value: 'Our team typically responds within 24 hours. Complex issues may take longer to resolve.' }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                .setTimestamp();

            const ticketButton = new ButtonBuilder()
                .setCustomId('open_ticket')
                .setLabel('Open Support Ticket')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(ticketButton);

            await message.channel.send({ 
                embeds: [gameInfoEmbed, ticketEmbed], 
                components: [row] 
            });
        } else {
            // Premier embed : Infos du jeu pour les membres
            const gameInfoEmbed = new EmbedBuilder()
                .setColor(COLORS.gray)
                .setTitle('Your Fish Life - Game Info')
                .setDescription('Your Fish Life is an upcoming Roblox experience developed by Jaxdrax Studio. Dive into a relaxing and immersive aquarium building simulation where you can discover new fish species, customize your tanks, and connect with a growing community of players.\n\n**Key Features:**\n• Build and customize your own aquarium\n• Discover and collect new fish species\n• Relaxing gameplay with regular updates\n• Active community and support')
                .addFields(
                    { name: 'Developer', value: 'Jaxdrax Studio' },
                    { name: 'Status', value: 'Currently in Development' },
                    { name: 'Platform', value: 'Roblox (PC, Mobile, Console)' }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio', iconURL: LOGO_URL })
                .setTimestamp();

            // Deuxième embed : Système de ticket pour les membres
            const ticketEmbed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Need Help? Open a Support Ticket')
                .setDescription('If you need assistance from the Jaxdrax Studio team, you can open a private support ticket.\n\n**How it works:**\n• Click the button below to create a private ticket channel\n• Only you and the staff team will have access\n• Describe your issue in detail\n• A staff member will assist you shortly\n\n**Before opening a ticket:**\n• Ensure you have read the server rules\n• Check if your issue has already been answered\n• Prepare a detailed description of your problem')
                .addFields(
                    { name: 'What can you get help with?', value: '• Technical issues and bugs\n• Account problems\n• Game-related questions\n• Suggestions and feedback\n• Any other concerns' },
                    { name: 'Response Time', value: 'Our team typically responds within 24 hours. Complex issues may take longer to resolve.' }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                .setTimestamp();

            const ticketButton = new ButtonBuilder()
                .setCustomId('open_ticket')
                .setLabel('Open Support Ticket')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(ticketButton);

            await message.reply({ 
                embeds: [gameInfoEmbed, ticketEmbed], 
                components: [row] 
            });
        }
    }
};
