const { ChannelType, PermissionFlagsBits } = require('discord.js');
const {
    joinVoiceChannel,
    getVoiceConnection,
    VoiceConnectionStatus
} = require('@discordjs/voice');

const GUILD_ID = '1557003074827194458';
const VOICE_CHANNEL_ID = '1561473045208506479';

let connection = null;
let reconnectTimer = null;
let stopping = false;

function scheduleReconnect(client, delay = 15000) {
    if (stopping || reconnectTimer) return;

    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        joinVoice(client).catch(error => {
            console.error('[Voice] Reconnect failed:', error.message);
        });
    }, delay);
}

function bindEvents(client, voiceConnection) {
    voiceConnection.on(VoiceConnectionStatus.Ready, () => {
        console.log('[Voice] Connected and ready');
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
    });

    voiceConnection.on(VoiceConnectionStatus.Disconnected, () => {
        console.warn('[Voice] Disconnected, trying to rejoin');

        try {
            voiceConnection.rejoin();
        } catch (error) {
            console.error('[Voice] Rejoin failed:', error.message);
        }

        scheduleReconnect(client, 15000);
    });

    voiceConnection.on(VoiceConnectionStatus.Destroyed, () => {
        console.warn('[Voice] Connection destroyed');
        if (connection === voiceConnection) connection = null;
        scheduleReconnect(client, 10000);
    });
}

async function joinVoice(client) {
    if (stopping) return false;

    try {
        const guild = client.guilds.cache.get(GUILD_ID) || client.guilds.cache.first();
        if (!guild) {
            console.error('[Voice] Guild not found');
            return false;
        }

        const existing = getVoiceConnection(guild.id);
        if (existing) {
            const status = existing.state.status;
            if (
                status === VoiceConnectionStatus.Ready ||
                status === VoiceConnectionStatus.Connecting ||
                status === VoiceConnectionStatus.Signalling
            ) {
                connection = existing;
                return status === VoiceConnectionStatus.Ready;
            }
            existing.destroy();
        }

        const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);

        if (!channel || channel.type !== ChannelType.GuildVoice) {
            console.error('[Voice] Voice channel not found: ' + VOICE_CHANNEL_ID);
            return false;
        }

        const permissions = channel.permissionsFor(guild.members.me);

        if (
            !permissions ||
            !permissions.has(PermissionFlagsBits.ViewChannel) ||
            !permissions.has(PermissionFlagsBits.Connect)
        ) {
            console.error('[Voice] Bot needs ViewChannel and Connect in that channel');
            return false;
        }

        connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: false
        });

        bindEvents(client, connection);

        console.log('[Voice] Joining: #' + channel.name);
        return true;
    } catch (error) {
        console.error('[Voice] Join error:', error.message);
        scheduleReconnect(client, 20000);
        return false;
    }
}

function leaveVoice() {
    stopping = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (connection) {
        try { connection.destroy(); } catch (error) { /* already gone */ }
    }
    connection = null;
}

module.exports = { joinVoice, leaveVoice };
