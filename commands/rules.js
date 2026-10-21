const { EmbedBuilder } = require('discord.js');
const { COLORS, LOGO_URL } = require('../config/constants');

module.exports = {
    name: 'rules',
    async execute(message, isStaff) {
        if (isStaff) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.darkRed)
                .setTitle('Complete Server Rules - Staff Version')
                .setDescription('Official regulations for the Your Fish Life community. All members must comply. Infractions will result in warnings, mutes, or bans depending on severity.')
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

            await message.channel.send({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Server Rules Summary')
                .setDescription('Welcome to Your Fish Life! To ensure a safe and enjoyable experience for everyone, please adhere to the following core rules. For the complete and detailed regulations, please visit the rules channel.')
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

            await message.reply({ embeds: [embed] });
        }
    }
};
