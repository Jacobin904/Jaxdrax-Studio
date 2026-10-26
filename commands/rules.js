const { EmbedBuilder, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules')
        .setDescription('Displays the complete server rules and guidelines'),
    name: 'rules',
    description: 'Displays the complete server rules and guidelines',
    
    async execute(target, isStaff, client) {
        const isInteraction = target.isChatInputCommand !== undefined;
        const member = isInteraction ? target.member : target.member;
        const guild = isInteraction ? target.guild : target.guild;
        const reply = isInteraction ? target.reply.bind(target) : target.reply.bind(target);

        const isStaffMember = member.roles.cache.some(role => STAFF_ROLES.includes(role.name));

        if (isStaffMember) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Server Rules and Guidelines')
                .setDescription('Welcome to Your Fish Life. These rules are in place to ensure a safe, respectful, and enjoyable environment for all members. Ignorance of these rules is not an excuse.')
                .addFields(
                    { 
                        name: '1. Respect and Conduct', 
                        value: 'Treat all members and staff with respect. Harassment, hate speech, discrimination, bullying, or targeted attacks of any kind will result in an immediate ban. This includes slurs, sexist comments, and sustained negative behavior toward any individual.', 
                        inline: false 
                    },
                    { 
                        name: '2. No Spam or Self-Promotion', 
                        value: 'Do not spam messages, use excessive caps, or post walls of text. Advertising other Discord servers, Roblox games, YouTube channels, or external links is strictly forbidden without explicit written permission from the management team.', 
                        inline: false 
                    },
                    { 
                        name: '3. Keep Channels Organized', 
                        value: 'Post content in the appropriate channels. Use bug-reports for technical issues, suggestions for game ideas, and general-chat for casual conversation. Repeatedly posting off-topic content after a warning will result in a timeout.', 
                        inline: false 
                    },
                    { 
                        name: '4. Zero Tolerance for Exploits', 
                        value: 'Discussing, sharing, promoting, or using exploits, cheats, hacks, or game-breaking glitches is strictly forbidden and will result in a permanent ban. If you discover a bug, report it privately to staff immediately.', 
                        inline: false 
                    },
                    { 
                        name: '5. Follow Discord Terms of Service', 
                        value: 'All users must comply with the official Discord Community Guidelines and Terms of Service at all times. This includes age restrictions (13+), content policies, and prohibited activities. Violations may be reported to Discord Trust & Safety.', 
                        inline: false 
                    },
                    { 
                        name: '6. Staff Decisions are Final', 
                        value: 'If you disagree with a moderation action, please open a support ticket. Do not argue with staff members in public channels, mention them repeatedly, or attempt to rally others against staff decisions. Appeals are reviewed within 48 hours.', 
                        inline: false 
                    },
                    { 
                        name: '7. No NSFW or Inappropriate Content', 
                        value: 'Explicit, adult, or inappropriate content is strictly prohibited in all channels and direct messages. This includes nudity, gore, violence, or any mature themes. Violations will result in an immediate permanent ban without warning.', 
                        inline: false 
                    },
                    { 
                        name: '8. Protect Personal Information', 
                        value: 'Do not share personal information about yourself or others, including real names, addresses, phone numbers, or passwords. Staff will never ask for sensitive data. Sharing such information (doxxing) will result in an immediate ban.', 
                        inline: false 
                    }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Management', iconURL: LOGO_URL })
                .setTimestamp();
            
            await reply({ embeds: [embed] });
        } else {
            const rulesChannel = guild.channels.cache.find(c => c.name === 'rules');
            if (rulesChannel) {
                await reply({ 
                    content: `Please check the complete server rules in ${rulesChannel}`, 
                    flags: MessageFlags.Ephemeral 
                });
            } else {
                await reply({ 
                    content: 'The rules channel could not be found. Please contact a staff member for assistance.', 
                    flags: MessageFlags.Ephemeral 
                });
            }
        }
    }
};
