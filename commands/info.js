const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Displays information about Your Fish Life'),
    async execute(interaction) {
        const isStaff = interaction.member.roles.cache.some(role => STAFF_ROLES.includes(role.name));

        if (isStaff) {
            const guild = interaction.guild;
            const embed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Your Fish Life - Complete Game Information')
                .setDescription('Comprehensive details regarding the development and status of the Your Fish Life Roblox experience. This information is intended for staff members to provide accurate support to community members.\n\n**Development Status:**\n• Current Phase: Active Development\n• Last Major Update: Ongoing weekly updates\n• Next Milestone: Beta Testing Phase\n• Estimated Beta Release: Q1 2027\n• Development Team: 5 active developers\n• Community Managers: 3 dedicated staff members\n\n**Technical Specifications:**\n• Engine: Roblox Studio with custom scripts\n• Target Platform: PC, Mobile, Console (Xbox, PlayStation)\n• Multiplayer Capacity: Up to 50 players per server\n• Save System: Cloud-based with local backup\n• Anti-Cheat: Custom implementation with server-side validation')
                .addFields(
                    { name: 'Developer Information', value: '**Primary Developer:** Jaxdrax Studio\n**Founded:** 2024\n**Location:** Remote Team\n**Team Size:** 5 developers, 3 community managers\n**Contact:** support@jaxdraxstudio.com\n**Website:** www.jaxdraxstudio.com\n**Social Media:** Twitter, YouTube, Discord', inline: false },
                    { name: 'Core Features', value: '• **Aquarium Building:** Complete customization system with hundreds of decorations, filters, and lighting options\n• **Fish Species Discovery:** Over 100 unique fish species to discover, each with unique behaviors and requirements\n• **Breeding System:** Advanced genetics-based breeding mechanics\n• **Trading System:** Secure player-to-player trading with verification\n• **Quest System:** Daily and weekly challenges with rewards\n• **Achievement System:** Over 200 achievements to unlock\n• **Community Events:** Regular seasonal events with exclusive content\n• **Relaxation Mode:** Ambient music and ASMR-style gameplay options', inline: false },
                    { name: 'Discord Server Statistics', value: '**Total Members:** ' + guild.memberCount + '\n**Total Roles:** ' + guild.roles.cache.size + '\n**Total Channels:** ' + guild.channels.cache.size + '\n**Server Created:** <t:' + Math.floor(guild.createdTimestamp / 1000) + ':R>\n**Boost Level:** ' + guild.premiumTier + '\n**Total Boosts:** ' + guild.premiumSubscriptionCount + '\n**Active Staff:** ' + guild.members.cache.filter(m => m.roles.cache.some(r => STAFF_ROLES.includes(r.name))).size, inline: true },
                    { name: 'Roblox Game Statistics', value: '**Players Online:** Checking...\n**Server Status:** Online\n**Total Visits:** 50,000+\n**Favorites:** 2,500+\n**Likes:** 95% positive\n**Average Session:** 45 minutes\n**Peak Concurrent:** 150 players', inline: true },
                    { name: 'Support Information', value: '**Ticket System:** Use /ticket command or click the Support Ticket button below\n**Response Time:** Usually within 2-4 hours\n**Support Hours:** 24/7 (staff coverage varies)\n**Common Issues:** Account recovery, bug reports, player reports, suggestions\n**Escalation Path:** Support → Moderator → Admin → Game Direction\n\n**Important:** All support requests must go through the official ticket system. Do not DM staff members directly for support.', inline: false },
                    { name: 'Legal Information', value: '**License Type:** Proprietary - All Rights Reserved\n**Copyright:** © 2024-2027 Jaxdrax Studio\n**Terms of Service:** Available on website\n**Privacy Policy:** Available on website\n**Refund Policy:** No refunds on in-game purchases (Roblox policy)\n**Age Rating:** Everyone 10+\n\n**Intellectual Property:** All game assets, code, designs, and content are the exclusive property of Jaxdrax Studio. Unauthorized use, distribution, or modification is strictly prohibited and will result in legal action.', inline: false },
                    { name: 'Upcoming Features', value: '• **Season 2 Content:** New fish species, decorations, and quests (Coming Soon)\n• **Tournament System:** Competitive events with prizes\n• **Guild System:** Create or join player guilds\n• **Custom Aquariums:** Share and visit other players aquariums\n• **Mobile Optimization:** Improved performance on mobile devices\n• **Console Exclusive Content:** Special features for console players\n• **Accessibility Features:** Colorblind modes, subtitles, control customization', inline: false }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Development Team • Confidential Staff Information', iconURL: LOGO_URL })
                .setTimestamp();

            const licenseButton = new ButtonBuilder()
                .setCustomId('info_view_license')
                .setLabel('View License')
                .setStyle(ButtonStyle.Secondary);

            const ticketButton = new ButtonBuilder()
                .setCustomId('info_open_ticket')
                .setLabel('Support Ticket')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(licenseButton, ticketButton);

            await interaction.reply({ embeds: [embed], components: [row] });
        } else {
            const infoChannel = interaction.guild.channels.cache.find(channel => channel.name === 'informations');
            
            if (infoChannel) {
                await interaction.reply({
                    content: 'For more information about Your Fish Life, please check ' + infoChannel,
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.reply({
                    content: 'The information channel could not be found. Please contact a staff member.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
};
