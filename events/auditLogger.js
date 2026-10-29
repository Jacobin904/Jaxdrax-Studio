const { Events } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log('[AuditLogger] Registering all audit event listeners...');

        // ========== MEMBRES ==========
        client.on(Events.GuildMemberAdd, async (member) => {
            try { await logger.logMemberJoin(member); } catch (e) { console.error('[Audit] GuildMemberAdd:', e.message); }
        });

        client.on(Events.GuildMemberRemove, async (member) => {
            try { await logger.logMemberLeave(member); } catch (e) { console.error('[Audit] GuildMemberRemove:', e.message); }
        });

        client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
            try { await logger.logMemberUpdate(oldMember, newMember); } catch (e) { console.error('[Audit] GuildMemberUpdate:', e.message); }
        });

        // ========== MESSAGES ==========
        client.on(Events.MessageDelete, async (message) => {
            try { await logger.logMessageDelete(message); } catch (e) { console.error('[Audit] MessageDelete:', e.message); }
        });

        client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
            try { await logger.logMessageUpdate(oldMessage, newMessage); } catch (e) { console.error('[Audit] MessageUpdate:', e.message); }
        });

        client.on(Events.MessageBulkDelete, async (messages, channel) => {
            try { await logger.logMessageBulkDelete(messages, channel); } catch (e) { console.error('[Audit] MessageBulkDelete:', e.message); }
        });

        // ========== VOIX ==========
        client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
            try { await logger.logVoiceState(oldState, newState); } catch (e) { console.error('[Audit] VoiceStateUpdate:', e.message); }
        });

        // ========== BANS ==========
        client.on(Events.GuildBanAdd, async (ban) => {
            try { await logger.logBanAdd(ban.guild, ban); } catch (e) { console.error('[Audit] GuildBanAdd:', e.message); }
        });

        client.on(Events.GuildBanRemove, async (ban) => {
            try { await logger.logBanRemove(ban.guild, ban); } catch (e) { console.error('[Audit] GuildBanRemove:', e.message); }
        });

        // ========== SALONS ==========
        client.on(Events.ChannelCreate, async (channel) => {
            try { await logger.logChannelCreate(channel); } catch (e) { console.error('[Audit] ChannelCreate:', e.message); }
        });

        client.on(Events.ChannelDelete, async (channel) => {
            try { await logger.logChannelDelete(channel); } catch (e) { console.error('[Audit] ChannelDelete:', e.message); }
        });

        client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
            try { await logger.logChannelUpdate(oldChannel, newChannel); } catch (e) { console.error('[Audit] ChannelUpdate:', e.message); }
        });

        // ========== ROLES ==========
        client.on(Events.GuildRoleCreate, async (role) => {
            try { await logger.logRoleCreate(role); } catch (e) { console.error('[Audit] GuildRoleCreate:', e.message); }
        });

        client.on(Events.GuildRoleDelete, async (role) => {
            try { await logger.logRoleDelete(role); } catch (e) { console.error('[Audit] GuildRoleDelete:', e.message); }
        });

        client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
            try { await logger.logRoleUpdate(oldRole, newRole); } catch (e) { console.error('[Audit] GuildRoleUpdate:', e.message); }
        });

        // ========== SERVEUR ==========
        client.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
            try { await logger.logGuildUpdate(oldGuild, newGuild); } catch (e) { console.error('[Audit] GuildUpdate:', e.message); }
        });

        // ========== EMOJIS ==========
        client.on(Events.GuildEmojiCreate, async (emoji) => {
            try { await logger.logEmojiCreate(emoji); } catch (e) { console.error('[Audit] GuildEmojiCreate:', e.message); }
        });

        client.on(Events.GuildEmojiDelete, async (emoji) => {
            try { await logger.logEmojiDelete(emoji); } catch (e) { console.error('[Audit] GuildEmojiDelete:', e.message); }
        });

        client.on(Events.GuildEmojiUpdate, async (oldEmoji, newEmoji) => {
            try { await logger.logEmojiUpdate(oldEmoji, newEmoji); } catch (e) { console.error('[Audit] GuildEmojiUpdate:', e.message); }
        });

        // ========== INVITATIONS ==========
        client.on(Events.InviteCreate, async (invite) => {
            try { await logger.logInviteCreate(invite); } catch (e) { console.error('[Audit] InviteCreate:', e.message); }
        });

        client.on(Events.InviteDelete, async (invite) => {
            try { await logger.logInviteDelete(invite); } catch (e) { console.error('[Audit] InviteDelete:', e.message); }
        });

        // ========== THREADS ==========
        client.on(Events.ThreadCreate, async (thread) => {
            try { await logger.logThreadCreate(thread); } catch (e) { console.error('[Audit] ThreadCreate:', e.message); }
        });

        client.on(Events.ThreadDelete, async (thread) => {
            try { await logger.logThreadDelete(thread); } catch (e) { console.error('[Audit] ThreadDelete:', e.message); }
        });

        console.log('[AuditLogger] All audit event listeners registered successfully');
    }
};
