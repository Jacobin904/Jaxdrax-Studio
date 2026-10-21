const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');

module.exports = {
    name: 'ticket',
    async execute(message, isStaff) {
        if (isStaff) {
            const button = new ButtonBuilder()
                .setCustomId('open_ticket')
                .setLabel('Open Ticket')
                .setStyle(ButtonStyle.Primary);

            const embed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Support Ticket System - Official Panel')
                .setDescription('Welcome to the official support system for Your Fish Life. If you need assistance from the Jaxdrax Studio team, please click the button below to open a private ticket channel.\n\n**How it works:**\n• Click the button to create a private channel\n• Only you and the staff team will have access\n• Describe your issue in detail\n• A staff member will assist you shortly\n\nPlease ensure you have read the rules before opening a ticket.')
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                .setTimestamp();

            await message.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(button)] });
        } else {
            const embed = new EmbedBuilder()
                .setColor(COLORS.gray)
                .setTitle('Ticket Instructions')
                .setDescription('To open a support ticket, please use the "Open Ticket" button in the designated support channel (help-desk).\n\n**Before opening a ticket:**\n• Ensure you have read the server rules\n• Check if your issue has already been answered\n• Prepare a detailed description of your problem\n\nTickets are for serious inquiries only. Spam or misuse will result in loss of ticket privileges.')
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Your Fish Life Support', iconURL: LOGO_URL })
                .setTimestamp();
            await message.reply({ embeds: [embed] });
        }
    }
};
