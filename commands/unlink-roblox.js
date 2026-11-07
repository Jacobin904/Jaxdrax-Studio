const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags
} = require('discord.js');

const { COLORS, LOGO_URL, BANNER_URL } = require('../config/constants');
const roblox = require('../utils/roblox');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlink-roblox')
        .setDescription('Unlink your Roblox account from your Discord account'),

    name: 'unlink-roblox',
    description: 'Unlink your Roblox account from your Discord account',

    async execute(interaction) {
        const discordId = interaction.user.id;
        const existing = roblox.getRobloxAccount(discordId);

        if (!existing || !existing.verified) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('No Linked Account')
                .setDescription('Your Discord account is not linked to any Roblox account.\n\nUse `/verify-roblox` to link your account.')
                .setImage(BANNER_URL)
                .setFooter({ text: 'Jaxdrax Studio Verification', iconURL: LOGO_URL })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const success = roblox.unlinkRobloxAccount(discordId);

        if (success) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.green || '#2ecc71')
                .setTitle('Account Unlinked')
                .setDescription(
                    'Your Roblox account has been successfully unlinked.\n\n' +
                    '**Previous Roblox Username:** ' + existing.robloxUsername + '\n' +
                    '**Previous Roblox ID:** ' + existing.robloxId + '\n\n' +
                    'You can use `/verify-roblox` to link a new account.'
                )
                .setImage(BANNER_URL)
                .setFooter({ text: 'Jaxdrax Studio Verification', iconURL: LOGO_URL })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } else {
            const embed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Unlink Failed')
                .setDescription('An error occurred while unlinking your account. Please try again later.')
                .setImage(BANNER_URL)
                .setFooter({ text: 'Jaxdrax Studio Verification', iconURL: LOGO_URL })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
};
