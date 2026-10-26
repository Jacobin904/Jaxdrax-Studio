const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags
} = require('discord.js');

const { COLORS, LOGO_URL, BANNER_URL, STAFF_ROLES } = require('../config/constants');

const COMMAND_IDS = {
    config: '1564274366274084945',
    help: '1564274366274084946',
    info: '1564274366274084947',
    modpanel: '1564274366274084948',
    ping: '1564274366274084949',
    review: '1564274366274084950',
    rules: '1564274366274084951'
};

function runtime(source) {
    const isInteraction = typeof source.deferReply === 'function';
    return {
        isInteraction,
        guild: source.guild,
        channel: source.channel,
        member: source.member,
        user: isInteraction ? source.user : source.author
    };
}

async function respond(source, payload) {
    if (typeof source.deferReply !== 'function') {
        return source.channel.send(payload);
    }

    if (source.replied || source.deferred) {
        return source.followUp(payload);
    }

    return source.reply(payload);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays the full command list and support guide'),

    name: 'help',
    description: 'Displays the full command list and support guide',

    async execute(source, isStaffFlag, client) {
        const ctx = runtime(source);

        const isStaff = ctx.member?.roles?.cache?.some(r => STAFF_ROLES.includes(r.name)) || isStaffFlag;

        const uptimeSeconds = Math.floor((client.uptime || 0) / 1000);
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = uptimeSeconds % 60;

        const embed = new EmbedBuilder()
            .setColor(COLORS.dark)
            .setTitle('Jaxdrax Studio - Command Center')
            .setDescription(
                'Welcome to the official command center for Your Fish Life.\n\n' +
                'Every command below works with both slash syntax and the text prefix.\n' +
                'Slash: /command\n' +
                'Text: !command\n\n' +
                'Commands marked as staff only are hidden from members and will be rejected if run without the required role.'
            )
            .addFields(
                {
                    name: 'Getting Started',
                    value:
                        '</help:' + COMMAND_IDS.help + '> - Opens this command center and explains how each feature works.\n' +
                        '</ping:' + COMMAND_IDS.ping + '> - Shows message latency, gateway latency, uptime, memory usage and bot statistics.\n' +
                        'Use these first if you are unsure where to find something.',
                    inline: false
                },
                {
                    name: 'Server Information',
                    value:
                        '</rules:' + COMMAND_IDS.rules + '> - Staff: posts the full rule set in the current channel for members. Members: receives a direct link to the rules channel.\n' +
                        '</info:' + COMMAND_IDS.info + '> - Staff: posts the game information panel with license and support buttons. Members: receives a direct link to the information channel.\n' +
                        'Read the rules before opening a ticket so your request can be handled faster.',
                    inline: false
                },
                {
                    name: 'Community Feedback',
                    value:
                        '</review:' + COMMAND_IDS.review + '> - Opens the review system with two options: review the server or review a specific staff member.\n' +
                        'Each review requires a rating from 1 to 5 and a written comment.\n' +
                        'Your username, user ID and submission date are attached to the review. Keep feedback respectful and constructive.',
                    inline: false
                },
                {
                    name: 'Support And Tickets',
                    value:
                        '1. Run </info:' + COMMAND_IDS.info + '> as a staff member, or open the information panel.\n' +
                        '2. Select Support Ticket.\n' +
                        '3. Select Open A Ticket.\n' +
                        '4. Choose a category and describe your issue.\n\n' +
                        'Only one open ticket per member is allowed. Closing a ticket hides it from you and leaves Reopen or Close Permanently available to staff. Permanent closures are archived to the transcript channel.',
                    inline: false
                },
                {
                    name: 'Staff Tools - Restricted',
                    value:
                        '</config:' + COMMAND_IDS.config + '> - Audits and synchronizes every role and channel permission. Supports preview mode with /config preview:true. Sends a complete .txt dump to your DMs.\n' +
                        '</modpanel:' + COMMAND_IDS.modpanel + '> - Opens the moderation control panel with member investigation, guides, statistics, quick actions and recent logs.\n' +
                        'Required roles: ' + STAFF_ROLES.join(', ') + '.',
                    inline: false
                },
                {
                    name: 'Current Bot Status',
                    value:
                        'Gateway Latency: ' + client.ws.ping + 'ms\n' +
                        'Uptime: ' + hours + 'h ' + minutes + 'm ' + seconds + 's\n' +
                        'Servers: ' + client.guilds.cache.size + '\n' +
                        'Voice: connected to the Jaxdrax Studio || Your Fish Life channel',
                    inline: true
                },
                {
                    name: 'Command Rules',
                    value:
                        '- Do not spam commands in public channels.\n' +
                        '- Do not run staff commands to test permissions.\n' +
                        '- If a command fails, check that you used the correct syntax before reporting it.\n' +
                        '- All moderation actions and ticket closures are logged for accountability.',
                    inline: false
                }
            )
            .setImage(BANNER_URL)
            .setFooter({
                text: (isStaff ? 'Staff View | ' : 'Member View | ') + 'Jaxdrax Studio Command Center',
                iconURL: LOGO_URL
            })
            .setTimestamp();

        await respond(source, { embeds: [embed] });
    }
};
