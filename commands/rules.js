const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules')
        .setDescription('Displays the server rules'),
    async execute(interaction) {
        const isStaff = interaction.member.roles.cache.some(role => STAFF_ROLES.includes(role.name));

        if (isStaff) {
            // Staff version: affiche les règles complètes dans le salon pour les membres
            const embed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Server Rules')
                .setDescription('Welcome to Your Fish Life! To ensure a safe and enjoyable experience for everyone, please adhere to the following core rules.\n\n**Important:** Ignorance of the rules is not an excuse. All members are expected to read and follow these guidelines.')
                .addFields(
                    { name: '1. Respect Everyone', value: 'Treat all members and staff with respect. Harassment or discrimination is strictly forbidden and will result in immediate action.', inline: false },
                    { name: '2. No Spam or Self-Promotion', value: 'Do not spam messages or advertise other servers/games without permission. Keep the chat clean and relevant.', inline: false },
                    { name: '3. Keep Channels Organized', value: 'Post content in the appropriate channels to keep discussions relevant and helpful for everyone.', inline: false },
                    { name: '4. No Exploits or Cheating', value: 'Discussing or promoting exploits will result in a permanent ban. Report bugs responsibly instead.', inline: false },
                    { name: '5. Follow Discord TOS', value: 'All users must comply with the official Discord Community Guidelines and Terms of Service at all times.', inline: false },
                    { name: '6. Staff Decisions are Final', value: 'If you disagree with a moderation action, please open a ticket. Do not argue with staff in public channels.', inline: false },
                    { name: '7. No NSFW Content', value: 'Explicit or inappropriate content is strictly prohibited and will result in an immediate ban.', inline: false },
                    { name: '8. Protect Personal Information', value: 'Do not share personal information. Staff will never ask for sensitive data like passwords or addresses.', inline: false }
                )
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Management', iconURL: LOGO_URL })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } else {
            // Membre version: redirige vers le salon #rules
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
