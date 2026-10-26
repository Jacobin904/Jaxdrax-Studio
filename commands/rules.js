const { EmbedBuilder, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules')
        .setDescription('Displays the server rules'),
    name: 'rules',
    description: 'Displays the server rules',
    
    async execute(target, isStaff) {
        // Gère à la fois les interactions (/) et les messages (!)
        const isInteraction = target.isChatInputCommand !== undefined;
        const member = isInteraction ? target.member : target.member;
        const guild = isInteraction ? target.guild : target.guild;
        const reply = isInteraction ? target.reply.bind(target) : target.reply.bind(target);

        const isStaffMember = member.roles.cache.some(role => STAFF_ROLES.includes(role.name));

        if (isStaffMember) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Server Rules')
                .setDescription('Welcome to Your Fish Life! Please adhere to the following core rules to ensure a safe environment.')
                .addFields(
                    { name: '1. Respect Everyone', value: 'Harassment, hate speech, or discrimination will result in an immediate ban.', inline: false },
                    { name: '2. No Spam or Self-Promotion', value: 'Do not spam messages or advertise other servers/games without permission.', inline: false },
                    { name: '3. Keep Channels Organized', value: 'Post content in the appropriate channels to keep discussions relevant.', inline: false },
                    { name: '4. No Exploits or Cheating', value: 'Discussing or promoting exploits will result in a permanent ban.', inline: false },
                    { name: '5. Follow Discord TOS', value: 'All users must comply with the official Discord Community Guidelines.', inline: false },
                    { name: '6. Staff Decisions are Final', value: 'Open a ticket for appeals. Do not argue with staff in public channels.', inline: false }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Management', iconURL: LOGO_URL })
                .setTimestamp();
            
            await reply({ embeds: [embed] });
        } else {
            const rulesChannel = guild.channels.cache.find(c => c.name === 'rules');
            if (rulesChannel) {
                await reply({ content: `Please check the rules in ${rulesChannel}`, flags: MessageFlags.Ephemeral });
            } else {
                await reply({ content: 'The rules channel could not be found. Please contact a staff member.', flags: MessageFlags.Ephemeral });
            }
        }
    }
};
