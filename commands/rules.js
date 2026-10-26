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
                .setDescription('Official regulations for the Your Fish Life community. All members must comply with these rules at all times. Infractions will result in warnings, mutes, timeouts, or bans depending on severity and frequency of violations.\n\n**Enforcement Guidelines:**\n• First offense: Verbal warning with explanation\n• Second offense: Official warning logged in audit channel\n• Third offense: Timeout (1-24 hours depending on severity)\n• Fourth offense: Kick from the server\n• Severe violations: Immediate ban without warning\n\nAll moderation actions must be logged in the dev-logs channel with full details including the reason, evidence, and duration of any sanctions applied.\n\n**Important Notes for Staff:**\n• Always remain professional and neutral\n• Document all moderation actions\n• Consult with other staff members for ambiguous cases\n• Never moderate while emotionally compromised\n• Follow the escalation path strictly')
                .addFields(
                    { name: '1. Respect Everyone', value: 'Treat all members and staff with respect at all times. Harassment, hate speech, discrimination, bullying, or targeted attacks of any kind will result in an immediate ban. This includes but is not limited to: racial slurs, sexist comments, homophobic remarks, religious discrimination, ableist language, and any other form of hate speech. Sustained negative behavior toward any individual, even if not explicitly hateful, will be considered harassment and dealt with accordingly. Staff members are held to the same standard and will face additional consequences for violations.', inline: false },
                    { name: '2. No Spam or Self Promotion', value: 'Do not spam messages, use excessive caps, post walls of text, or advertise other Discord servers, Roblox games, YouTube channels, social media accounts, or external links without explicit written permission from the management team. This includes direct messages to members promoting external content. Repeated violations will result in escalating timeouts leading to a permanent ban. Legitimate discussions about other games or content are allowed in appropriate channels when relevant to the conversation.', inline: false },
                    { name: '3. Keep Channels Organized', value: 'Post content in the appropriate channels to maintain organization and readability. Use bug-reports for technical issues and game bugs, suggestions for game ideas and feature requests, general-chat for casual conversation, media for screenshots and videos, and fish-talk for game-specific discussions. Off-topic discussions should be moved to the appropriate channel. Repeatedly posting in the wrong channel after being warned will result in a timeout. Staff may delete off-topic messages without warning if they significantly disrupt the channel purpose.', inline: false },
                    { name: '4. No Exploits or Cheating', value: 'Discussing, sharing, promoting, or using exploits, cheats, hacks, mods, or game-breaking glitches is strictly forbidden and will result in a permanent ban from both the Discord server and the Roblox game. This includes sharing tutorial videos, written guides, or direct instructions on how to exploit the game. If you discover an exploit, report it privately to staff immediately through a ticket. Staff members who discover exploits must document them and work with developers to fix them before any public disclosure.', inline: false },
                    { name: '5. Follow Discord Terms of Service', value: 'All users must comply with the official Discord Community Guidelines and Terms of Service at all times without exception. This includes age restrictions (must be 13 or older), content policies regarding explicit material, prohibited activities such as raiding or doxxing, and all other Discord policies. Violations of Discord TOS that result in account suspension will also result in a ban from our server. Staff will not make exceptions for any Discord TOS violations regardless of circumstances.', inline: false },
                    { name: '6. Staff Decisions are Final', value: 'If you disagree with a moderation action, please open a support ticket through the proper channels. Do not argue with staff members in public channels, mention them repeatedly, or attempt to rally other members against staff decisions. Appeals will be reviewed by the management team within 48 hours of submission. Attempting to circumvent sanctions through alternate accounts will result in a permanent ban of all associated accounts. Publicly criticizing staff decisions without using the appeal process is considered harassment.', inline: false },
                    { name: '7. No NSFW Content', value: 'Explicit, adult, or inappropriate content is strictly prohibited in all channels and direct messages between server members. This includes but is not limited to: nudity, sexual content, gore, violence, drug use, and any other mature themes. Violations will result in an immediate permanent ban without warning. This rule applies to images, links, videos, text descriptions, and any other form of content. Even "mild" suggestive content is not allowed. When in doubt, do not post it.', inline: false },
                    { name: '8. Protect Personal Information', value: 'Do not share personal information about yourself or others including real names, home addresses, phone numbers, email addresses, passwords, financial information, or any other sensitive data. Staff will never ask for sensitive information like passwords or payment details. Sharing personal information (doxxing) will result in an immediate permanent ban and may be reported to Discord Trust & Safety. This includes sharing screenshots of private conversations that contain personal information. Always prioritize privacy and security.', inline: false },
                    { name: '9. No Impersonation', value: 'Do not impersonate staff members, other users, celebrities, or any real person. This includes using similar usernames, profile pictures, or display names to confuse other members. Impersonation attempts will result in an immediate ban. If you suspect someone is impersonating another user, report it to staff immediately with evidence. Staff members will never ask you to verify your identity through direct messages or external links.', inline: false },
                    { name: '10. Appropriate Language', value: 'While casual conversation is encouraged, excessive profanity, vulgar language, or offensive slang is not permitted. Context matters, but when language becomes disruptive or makes other members uncomfortable, staff will issue warnings. Repeated violations after warnings will result in timeouts. This rule is enforced to maintain a welcoming environment for all members regardless of age or background.', inline: false }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Management • Last Updated: ' + new Date().toLocaleDateString(), iconURL: LOGO_URL })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } else {
            const rulesChannel = interaction.guild.channels.cache.find(channel => channel.name === 'rules');
            
            if (rulesChannel) {
                await interaction.reply({
                    content: 'Please check the rules in ' + rulesChannel,
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
