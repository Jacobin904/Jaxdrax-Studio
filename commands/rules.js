const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules')
        .setDescription('Displays the server rules'),
    async execute(interaction) {
        const isStaff = interaction.member.roles.cache.some(role => STAFF_ROLES.includes(role.name));

        if (isStaff) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.darkRed)
                .setTitle('Complete Server Rules - Staff Version')
                .setDescription('Official regulations for the Your Fish Life community. All members must comply. Infractions will result in warnings, mutes, or bans depending on severity.\n\n**Enforcement Guidelines:**\n• First offense: Verbal warning\n• Second offense: Official warning logged\n• Third offense: Timeout (1-24 hours)\n• Severe violations: Immediate ban\n\nAll moderation actions must be logged in the dev-logs channel.')
                .addFields(
                    { name: '1. Respect Everyone', value: 'Treat all members and staff with respect. Harassment, hate speech, or discrimination of any kind will result in an immediate ban. This includes slurs, targeted attacks, and sustained negative behavior toward any individual.', inline: false },
                    { name: '2. No Spam or Self Promotion', value: 'Do not spam messages, excessive caps, or advertise other Discord servers, Roblox games, or external links without explicit permission from the management team. Repeated violations will result in a timeout or ban.', inline: false },
                    { name: '3. Keep Channels Organized', value: 'Post content in the appropriate channels. Use bug-reports for technical issues, suggestions for game ideas, and general-chat for casual conversation. Off-topic discussions should be moved to the appropriate channel.', inline: false },
                    { name: '4. No Exploits or Cheating', value: 'Discussing, sharing, or promoting exploits, cheats, or game-breaking glitches is strictly forbidden and will result in a permanent ban. Report exploits privately to staff instead.', inline: false },
                    { name: '5. Follow Discord Terms of Service', value: 'All users must comply with the official Discord Community Guidelines and Terms of Service at all times. This includes age restrictions, content policies, and prohibited activities.', inline: false },
                    { name: '6. Staff Decisions are Final', value: 'If you disagree with a moderation action, please open a ticket. Do not argue with staff members in public channels. Appeals will be reviewed by the management team within 48 hours.', inline: false },
                    { name: '7. No NSFW Content', value: 'Explicit, adult, or inappropriate content is strictly prohibited. This includes images, links, and discussions. Violations will result in an immediate ban.', inline: false },
                    { name: '8. Protect Personal Information', value: 'Do not share personal information (yours or others) including real names, addresses, phone numbers, or passwords. Staff will never ask for sensitive information.', inline: false }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Management', iconURL: LOGO_URL })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } else {
            const rulesChannel = interaction.guild.channels.cache.find(channel => channel.name === 'rules');
            
            if (rulesChannel) {
                await interaction.reply({
                    content: `Please check the rules in ${rulesChannel}`,
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.reply({
                    content: 'The rules channel could not be found. Please contact a staff member.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
};
