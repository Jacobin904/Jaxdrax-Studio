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
        .setDescription('Link your Roblox account to your Discord account'),

    name: 'verify-roblox',
    description: 'Link your Roblox account to your Discord account',

    async execute(interaction) {
        const discordId = interaction.user.id;

        // Vérifier si déjà lié
        const existing = roblox.getRobloxAccount(discordId);
        if (existing && existing.verified) {
            const embed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Account Already Linked')
                .setDescription(
                    'Your Discord account is already linked to a Roblox account.\n\n' +
                    '**Roblox Username:** ' + existing.robloxUsername + '\n' +
                    '**Roblox ID:** ' + existing.robloxId + '\n' +
                    '**Display Name:** ' + existing.displayName + '\n' +
                    '**Linked Since:** <t:' + Math.floor(new Date(existing.linkedAt).getTime() / 1000) + ':R>\n\n' +
                    'If you want to change your Roblox account, use `/unlink-roblox` first.'
                )
                .setImage(BANNER_URL)
                .setFooter({ text: 'Jaxdrax Studio Verification', iconURL: LOGO_URL })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        try {
            // Générer le lien OAuth
            const authUrl = roblox.generateAuthUrl(discordId);

            const embed = new EmbedBuilder()
                .setColor(COLORS.dark)
                .setTitle('Roblox Account Verification')
                .setDescription(
                    'Click the button below to verify your Roblox account.\n\n' +
                    'You will be redirected to Roblox to authorize the connection. ' +
                    'Your Roblox username, ID, and display name will be linked to your Discord account.'
                )
                .addFields(
                    { name: 'What happens next?', value: '1. Click the button below\n2. Log in to your Roblox account\n3. Authorize the connection\n4. You will be redirected back here\n5. Your account will be automatically verified', inline: false }
                )
                .setImage(BANNER_URL)
                .setFooter({ text: 'Jaxdrax Studio Verification', iconURL: LOGO_URL })
                .setTimestamp();

            const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Verify with Roblox')
                    .setURL(authUrl)
                    .setStyle(ButtonStyle.Link)
            );

            await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('[Verify] Error:', error.message);
            const embed = new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Verification Unavailable')
                .setDescription('Roblox verification is not configured yet. Please contact the server administrator.')
                .setImage(BANNER_URL)
                .setFooter({ text: 'Jaxdrax Studio Verification', iconURL: LOGO_URL })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
};
