module.exports = {
    // ==================== COULEURS OFFICIELLES ====================
    COLORS: {
        dark: '#242120',
        red: '#cf0d0e',
        darkRed: '#6c0b0d',
        gray: '#a49f9e',
        light: '#fbf7f7'
    },

    // ==================== LOGO ET BANNIÈRE OFFICIELS ====================
    LOGO_URL: 'https://media.discordapp.net/attachments/1561478676850151638/1561543957790330900/q1401r6.png',
    BANNER_URL: 'https://cdn.discordapp.com/attachments/1561478676850151638/1564345992403488858/b22nrk8.jpg?ex=6ae0ee3c&is=6adf9cbc&hm=9e5ea321a18e546b2eb5797e5109e00bc96b46b41d4b51fa903e4515910ba831',

    // ==================== PREFIX DES COMMANDES ====================
    PREFIX: '!',

    // ==================== ROLES STAFF ====================
    STAFF_ROLES: [
        'Game Direction',
        'Admin',
        'Moderator',
        'Developer',
        'Staff Team'
    ],

    // ==================== ROLES MEMBRES ====================
    MEMBER_ROLES: [
        'Member',
        'VIP',
        'Beta Tester',
        'Verified',
        'Unverified'
    ],

    // ==================== SALONS PRINCIPAUX ====================
    CHANNELS: {
        // Information
        WELCOME: 'welcome',
        RULES: 'rules',
        UPDATE: 'update',
        INFORMATIONS: 'informations',

        // Communauté
        GENERAL_CHAT: 'general-chat',
        MEDIA: 'media',
        FISH_TALK: 'fish-talk',
        BOT_COMMANDS: 'bot-commands',
        REVIEW: 'review',

        // Staff
        STAFF_CHAT: 'staff-chat',
        MODERATOR_ONLY: 'moderator-only',
        DEV_LOGS: 'dev-logs',
        TICKET_TRANSCRIPTS: 'ticket-transcripts'
    },

    // ==================== PERMISSIONS DANGEREUSES ====================
    DANGEROUS_PERMISSIONS: [
        'Administrator',
        'ManageGuild',
        'ManageRoles',
        'ManageChannels',
        'ManageMessages',
        'KickMembers',
        'BanMembers',
        'ManageNicknames',
        'ManageWebhooks',
        'ManageEmojisAndStickers',
        'ManageEvents',
        'ManageThreads'
    ],

    // ==================== PERMISSIONS BOT ====================
    BOT_PERMISSIONS: [
        'ViewChannel',
        'SendMessages',
        'ReadMessageHistory',
        'EmbedLinks',
        'AttachFiles',
        'ManageMessages',
        'ManageChannels',
        'ManageRoles'
    ],

    // ==================== PERMISSIONS MEMBRES ====================
    MEMBER_PERMISSIONS: [
        'ViewChannel',
        'SendMessages',
        'ReadMessageHistory',
        'EmbedLinks',
        'AttachFiles',
        'UseExternalEmojis'
    ],

    // ==================== PERMISSIONS STAFF ====================
    STAFF_PERMISSIONS: [
        'ViewChannel',
        'SendMessages',
        'ReadMessageHistory',
        'EmbedLinks',
        'AttachFiles',
        'ManageMessages',
        'KickMembers',
        'BanMembers',
        'TimeoutMembers',
        'ManageNicknames',
        'ModerateMembers'
    ]
};
