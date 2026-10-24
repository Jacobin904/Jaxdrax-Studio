const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags
} = require('discord.js');

const { COLORS, LOGO_URL, STAFF_ROLES } = require('../config/constants');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'reviews.json');

function loadReviews() {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function saveReview(review) {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        const reviews = loadReviews();
        reviews.push(review);
        fs.writeFileSync(DATA_FILE, JSON.stringify(reviews, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('[review] Impossible de sauvegarder:', error.message);
        return false;
    }
}

function parseRating(raw) {
    const value = Number(String(raw).trim());
    if (!Number.isInteger(value) || value < 1 || value > 5) return null;
    return value;
}

function getReviewChannel(guild) {
    const configuredId = process.env.REVIEW_CHANNEL_ID;

    if (configuredId) {
        const configured = guild.channels.cache.get(configuredId);
        if (configured && configured.isTextBased()) return configured;
    }

    return guild.channels.cache.find(
        channel => channel.name === 'review' && channel.isTextBased()
    ) || null;
}

async function findStaffMember(guild, query) {
    const clean = String(query).replace(/[<@!>]/g, '').trim();
    if (!clean) return null;

    let member = null;

    if (/^\d{17,19}$/.test(clean)) {
        try {
            member = await guild.members.fetch(clean);
        } catch (error) {
            member = null;
        }
    }

    if (!member) {
        try {
            await guild.members.fetch();
        } catch (error) {
            // On continue avec le cache disponible
        }

        member = guild.members.cache.find(m =>
            m.user.username.toLowerCase() === clean.toLowerCase() ||
            m.user.tag.toLowerCase() === clean.toLowerCase() ||
            (m.nickname && m.nickname.toLowerCase() === clean.toLowerCase())
        ) || null;
    }

    if (!member) return null;

    const isStaff = member.roles.cache.some(role => STAFF_ROLES.includes(role.name));
    return isStaff ? member : null;
}

async function replyError(interaction, description) {
    const payload = {
        embeds: [
            new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle('Review Not Submitted')
                .setDescription(description)
                .setThumbnail(LOGO_URL)
                .setFooter({ text: 'Jaxdrax Studio Community Feedback', iconURL: LOGO_URL })
                .setTimestamp()
        ],
        flags: MessageFlags.Ephemeral
    };

    if (interaction.replied || interaction.deferred) {
        return interaction.followUp(payload);
    }
    return interaction.reply(payload);
}

function buildReviewModal(kind) {
    const modal = new ModalBuilder()
        .setCustomId(`review_${kind}_modal`)
        .setTitle(kind === 'server' ? 'Review the Server' : 'Review a Staff Member');

    const rows = [];

    if (kind === 'staff') {
        rows.push(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('staff')
                    .setLabel('Staff member (username, mention or ID)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ex: ModeratorName or @ModeratorName')
                    .setMaxLength(100)
                    .setRequired(true)
            )
        );
    }

    rows.push(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('rating')
                .setLabel('Your rating (1 to 5)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 5')
                .setMinLength(1)
                .setMaxLength(1)
                .setRequired(true)
        )
    );

    rows.push(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('comment')
                .setLabel('Your comment')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Tell us about your experience. Be honest and constructive.')
                .setMaxLength(1000)
                .setRequired(true)
        )
    );

    modal.addComponents(...rows);
    return modal;
}

async function publishReview(guild, review) {
    const channel = getReviewChannel(guild);
    if (!channel) return null;

    const isServer = review.type === 'server';

    const fields = [
        { name: 'Rating', value: `${review.rating} / 5`, inline: true },
        { name: 'Review Type', value: isServer ? 'Server' : 'Staff Member', inline: true }
    ];

    if (!isServer) {
        fields.push({
            name: 'Staff Member Reviewed',
            value: `<@${review.staffId}>\nUsername: ${review.staffTag}\nID: ${review.staffId}`,
            inline: false
        });
    }

    fields.push({
        name: 'Comment',
        value: review.comment.substring(0, 1024),
        inline: false
    });

    const embed = new EmbedBuilder()
        .setColor(isServer ? COLORS.dark : COLORS.darkRed)
        .setTitle(isServer ? '<:buildingsolid:1563676609146396853> New Server Review' : '<:usertiesolid:1563676703019114506> New Staff Review')
        .setDescription(
            `A new review has been submitted by <@${review.reviewerId}>.\n\n` +
            `**Reviewer:** ${review.reviewerTag}\n` +
            `**Reviewer ID:** ${review.reviewerId}\n` +
            `**Submitted:** <t:${Math.floor(new Date(review.createdAt).getTime() / 1000)}:F>`
        )
        .addFields(...fields)
        .setThumbnail(LOGO_URL)
        .setFooter({
            text: `Review by ${review.reviewerTag} | Jaxdrax Studio`,
            iconURL: LOGO_URL
        })
        .setTimestamp(new Date(review.createdAt));

    try {
        await channel.send({
            content: `New review posted by **${review.reviewerTag}**`,
            embeds: [embed]
        });
        return channel;
    } catch (error) {
        console.error('[review] Publication impossible:', error.message);
        return null;
    }
}

module.exports = {
    name: 'review',

    async execute(message) {
        const reviews = loadReviews();
        const serverReviews = reviews.filter(r => r.type === 'server');

        const average = serverReviews.length > 0
            ? (serverReviews.reduce((total, r) => total + Number(r.rating), 0) / serverReviews.length).toFixed(2)
            : 'No ratings yet';

        const embed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('<:starsolid:1563676498182021130> Community Review System')
            .setDescription(
                'Your feedback helps Jaxdrax Studio improve Your Fish Life and the way our staff supports the community.\n\n' +
                'Choose below what you want to review. Both options require a rating out of 5 and a written comment.\n\n' +
                '**Please note:** your Discord username, your user ID and the date will be displayed with your review. Please stay respectful and constructive.'
            )
            .addFields(
                {
                    name: '<:buildingsolid:1563676609146396853> Option 1 - Review the Server',
                    value: 'Rate Your Fish Life, the community, the channels and the overall experience. One rating out of 5 plus one comment.',
                    inline: false
                },
                {
                    name: '<:usertiesolid:1563676703019114506> Option 2 - Review a Staff Member',
                    value: 'Rate a specific staff member on their help, attitude and efficiency. You must provide their username, mention or ID, plus a rating and a comment.',
                    inline: false
                },
                {
                    name: '<:starhalfstrokesolid:1563659482528088225> Current Server Rating',
                    value: `${average}${serverReviews.length > 0 ? ' / 5' : ''}\nTotal server reviews: ${serverReviews.length}`,
                    inline: false
                }
            )
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Jaxdrax Studio Community Feedback', iconURL: LOGO_URL })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('review_server')
                .setLabel('Review the Server')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('review_staff')
                .setLabel('Review a Staff Member')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('review_cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

        await message.reply({
            embeds: [embed],
            components: [row],
            flags: MessageFlags.Ephemeral
        });
    },

    async handleInteraction(interaction) {
        const id = interaction.customId || '';
        if (!id.startsWith('review_')) return false;

        try {
            if (interaction.isButton()) {
                if (id === 'review_server' || id === 'review_staff') {
                    const kind = id === 'review_server' ? 'server' : 'staff';
                    await interaction.showModal(buildReviewModal(kind));
                    return true;
                }

                if (id === 'review_cancel') {
                    await interaction.update({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(COLORS.gray)
                                .setTitle('Review Cancelled')
                                .setDescription('You cancelled the review. You can run !review again whenever you want to share your feedback.')
                                .setThumbnail(LOGO_URL)
                                .setTimestamp()
                        ],
                        components: []
                    });
                    return true;
                }

                return false;
            }

            if (interaction.isModalSubmit() && id === 'review_server_modal') {
                const rating = parseRating(interaction.fields.getTextInputValue('rating'));
                const comment = interaction.fields.getTextInputValue('comment').trim();

                if (rating === null) {
                    await replyError(interaction, 'Invalid rating. Please enter a whole number between 1 and 5.');
                    return true;
                }

                if (!comment) {
                    await replyError(interaction, 'Your comment is empty. Please write a few words about your experience.');
                    return true;
                }

                const review = {
                    id: `review_${Date.now()}_${interaction.user.id}`,
                    type: 'server',
                    rating: rating,
                    comment: comment.substring(0, 1000),
                    reviewerId: interaction.user.id,
                    reviewerTag: interaction.user.tag,
                    createdAt: new Date().toISOString()
                };

                saveReview(review);
                const channel = await publishReview(interaction.guild, review);

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(COLORS.dark)
                            .setTitle('<:starsolid:1563676498182021130> Server Review Submitted')
                            .setDescription(
                                channel
                                    ? `Thank you <@${interaction.user.id}>. Your review has been posted in ${channel} and your name has been announced with it.`
                                    : `Thank you <@${interaction.user.id}>. Your review has been recorded, but it could not be published because no review channel is available.`
                            )
                            .addFields(
                                { name: 'Your Rating', value: `${rating} / 5`, inline: true },
                                { name: 'Submitted By', value: `${interaction.user.tag}\n${interaction.user.id}`, inline: true }
                            )
                            .setThumbnail(LOGO_URL)
                            .setFooter({ text: 'Jaxdrax Studio Community Feedback', iconURL: LOGO_URL })
                            .setTimestamp()
                    ],
                    flags: MessageFlags.Ephemeral
                });

                return true;
            }

            if (interaction.isModalSubmit() && id === 'review_staff_modal') {
                const staffQuery = interaction.fields.getTextInputValue('staff');
                const rating = parseRating(interaction.fields.getTextInputValue('rating'));
                const comment = interaction.fields.getTextInputValue('comment').trim();

                if (rating === null) {
                    await replyError(interaction, 'Invalid rating. Please enter a whole number between 1 and 5.');
                    return true;
                }

                if (!comment) {
                    await replyError(interaction, 'Your comment is empty. Please explain your experience with this staff member.');
                    return true;
                }

                const staffMember = await findStaffMember(interaction.guild, staffQuery);

                if (!staffMember) {
                    await replyError(
                        interaction,
                        'No staff member found with that name, mention or ID.\n\n' +
                        'Make sure the person is in this server and has one of these roles: ' + STAFF_ROLES.join(', ') + '.'
                    );
                    return true;
                }

                if (staffMember.id === interaction.user.id) {
                    await replyError(interaction, 'You cannot review yourself. Please choose another staff member.');
                    return true;
                }

                const review = {
                    id: `review_${Date.now()}_${interaction.user.id}`,
                    type: 'staff',
                    rating: rating,
                    comment: comment.substring(0, 1000),
                    reviewerId: interaction.user.id,
                    reviewerTag: interaction.user.tag,
                    staffId: staffMember.id,
                    staffTag: staffMember.user.tag,
                    createdAt: new Date().toISOString()
                };

                saveReview(review);
                const channel = await publishReview(interaction.guild, review);

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(COLORS.darkRed)
                            .setTitle('<:usertiesolid:1563676703019114506> Staff Review Submitted')
                            .setDescription(
                                channel
                                    ? `Thank you <@${interaction.user.id}>. Your review of <@${staffMember.id}> has been posted in ${channel} with your name attached.`
                                    : `Thank you <@${interaction.user.id}>. Your review has been recorded, but it could not be published because no review channel is available.`
                            )
                            .addFields(
                                { name: 'Your Rating', value: `${rating} / 5`, inline: true },
                                { name: 'Staff Reviewed', value: `${staffMember.user.tag}\n${staffMember.id}`, inline: true },
                                { name: 'Submitted By', value: `${interaction.user.tag}\n${interaction.user.id}`, inline: false }
                            )
                            .setThumbnail(LOGO_URL)
                            .setFooter({ text: 'Jaxdrax Studio Community Feedback', iconURL: LOGO_URL })
                            .setTimestamp()
                    ],
                    flags: MessageFlags.Ephemeral
                });

                return true;
            }

            return false;

        } catch (error) {
            console.error('[review] Erreur interaction:', error.message);
            try {
                await replyError(
                    interaction,
                    'An unexpected error occurred while submitting your review. Please try again, and contact the staff if the problem persists.'
                );
            } catch (secondaryError) {
                // Interaction expirée : rien d'autre a faire
            }
            return true;
        }
    }
};
