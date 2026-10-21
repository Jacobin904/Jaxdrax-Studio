const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');

module.exports = {
    name: 'rules',
    async execute(message, isStaff) {
        if (isStaff) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.darkRed)
                .setTitle('Complete Server Rules - Staff Version')
                .setDescription('Official regulations for the Your Fish Life community. All members must comply. Infractions will result in warnings, mutes, or bans depending on severity.\n\n**Use the buttons below to take action based on these rules.**')
                .addFields(
                    { name: '1. Respect Everyone', value: 'Treat all members and staff with respect. Harassment, hate speech, or discrimination of any kind will result in an immediate ban.' },
                    { name: '2. No Spam or Self Promotion', value: 'Do not spam messages, excessive caps, or advertise other Discord servers, Roblox games, or external links without explicit permission.' },
                    { name: '3. Keep Channels Organized', value: 'Post content in the appropriate channels. Use bug-reports for technical issues, suggestions for game ideas, and general-chat for casual conversation.' },
                    { name: '4. No Exploits or Cheating', value: 'Discussing, sharing, or promoting exploits, cheats, or game-breaking glitches is strictly forbidden and will result in a permanent ban.' },
                    { name: '5. Follow Discord Terms of Service', value: 'All users must comply with the official Discord Community Guidelines and Terms of Service at all times.' },
                    { name: '6. Staff Decisions are Final', value: 'If you disagree with a moderation action, please open a ticket. Do not argue with staff members in public channels.' }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Management', iconURL: LOGO_URL })
                .setTimestamp();

            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('rules_go_to_channel')
                        .setLabel('Go to Rules Channel')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('rules_send_to_member')
                        .setLabel('Send to Member')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('rules_open_ticket')
                        .setLabel('Open Appeal Ticket')
                        .setStyle(ButtonStyle.Success)
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('rules_mod_panel')
                        .setLabel('Open Mod Panel')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('rules_copy_text')
                        .setLabel('Copy Rules Text')
                        .setStyle(ButtonStyle.Secondary)
                );

            await message.channel.send({ 
                embeds: [embed], 
                components: [row1, row2] 
            });
        } else {
            const embed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Server Rules Summary')
                .setDescription('Welcome to Your Fish Life! To ensure a safe and enjoyable experience for everyone, please adhere to the following core rules. For the complete and detailed regulations, please visit the rules channel.\n\n**Use the buttons below to navigate and take action.**')
                .addFields(
                    { name: '1. Respect Everyone', value: 'Treat all members and staff with respect. Harassment or discrimination is strictly forbidden.' },
                    { name: '2. No Spam or Self-Promotion', value: 'Do not spam messages or advertise other servers/games without permission.' },
                    { name: '3. Keep Channels Organized', value: 'Post content in the appropriate channels to keep discussions relevant.' },
                    { name: '4. No Exploits or Cheating', value: 'Discussing or promoting exploits will result in a permanent ban.' },
                    { name: '5. Follow Discord TOS', value: 'All users must comply with the official Discord Community Guidelines.' },
                    { name: '6. Staff Decisions are Final', value: 'If you disagree with a moderation action, please open a ticket.' }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Management', iconURL: LOGO_URL })
                .setTimestamp();

            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('rules_go_to_channel')
                        .setLabel('Read Full Rules')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('rules_report_violation')
                        .setLabel('Report Violation')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('rules_appeal_decision')
                        .setLabel('Appeal Decision')
                        .setStyle(ButtonStyle.Secondary)
                );

            await message.reply({ 
                embeds: [embed], 
                components: [row1] 
            });
        }
    }
};
