const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags
} = require('discord.js');

const { COLORS, LOGO_URL, BANNER_URL } = require('../config/constants');
const roblox = require('../utils/roblox');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify-roblox')
        .setDescription('Link your Roblox account to your Discord account')
        .addStringOption(option =>
            option
                .setName('username')
                .setDescription('Your Roblox username')
                .setRequired(true)
        ),

    name: 'verify-roblox',
    description: 'Link your Roblox account to your Discord account',

    async execute(interaction) {
        const robloxUsername = interaction.options.getString('username');
        const discordId = interaction.user.id;

        // Vérifier si déjà lié
        const existing = roblox.getRobloxAccount(discordId);
        if (existing && existing.verified) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Account Already Linked')
                .setDescription(
                    'Your Discord account is already linked to a Roblox account.\n\n' +
                    '**Current Roblox Username:** ' + existing.robloxUsername + '\n' +
                    '**Linked Since:** <t:' + Math.floor(new Date(existing.linkedAt).getTime() / 1000) + ':R>\n\n' +
                    'If you want to change your Roblox account, use `/unlink-roblox` first.'
                )
                .setImage(BANNER_URL)
                .setFooter({ text: 'Jaxdrax Studio Verification', iconURL: LOGO_URL })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Lier le compte (vérification manuelle pour l'instant)
        // Dans le futur, on pourrait utiliser l'API Roblox ou Bloxlink pour une vérification automatique
        const success = roblox.linkRobloxAccount(discordId, robloxUsername, null);

        if (success) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.green || '#2ecc71')
                .setTitle('Roblox Account Linked')
                .setDescription(
                    'Your Roblox account has been successfully linked to your Discord account.\n\n' +
                    '**Roblox Username:** ' + robloxUsername + '\n' +
                    '**Discord User:** ' + interaction.user.tag + '\n\n' +
                    'You can now use `/modpanel` to view your linked Roblox information.'
                )
                .setImage(BANNER_URL)
                .setFooter({ text: 'Jaxdrax Studio Verification', iconURL: LOGO_URL })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

            // Logger dans dev-logs
            try {
                const logger = require('../utils/logger');
                if (typeof logger.logRobloxVerification === 'function') {
                    await logger.logRobloxVerification(interaction.guild, interaction.user, robloxUsername);
                }
            } catch (error) {
                console.error('[Verify] Log failed:', error.message);
            }
        } else {
            const embed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Verification Failed')
                .setDescription('An error occurred while linking your Roblox account. Please try again later.')
                .setImage(BANNER_URL)
                .setFooter({ text: 'Jaxdrax Studio Verification', iconURL: LOGO_URL })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
};
