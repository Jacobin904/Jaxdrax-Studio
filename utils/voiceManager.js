const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');

const VOICE_CHANNEL_ID = '1561473045208506479';

let connection = null;

async function joinVoice(client) {
    try {
        const channel = client.channels.cache.get(VOICE_CHANNEL_ID);
        
        if (!channel) {
            console.error('[Voice] Voice channel not found');
            return false;
        }

        if (channel.type !== 2) {
            console.error('[Voice] Channel is not a voice channel');
            return false;
        }

        connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false
        });

        connection.on(VoiceConnectionStatus.Ready, () => {
            console.log('[Voice] Connected to voice channel');
        });

        connection.on(VoiceConnectionStatus.Disconnected, () => {
            console.log('[Voice] Disconnected from voice channel, attempting to reconnect...');
            setTimeout(() => joinVoice(client), 5000);
        });

        connection.on(VoiceConnectionStatus.Destroyed, () => {
            console.log('[Voice] Connection destroyed');
            connection = null;
        });

        return true;
    } catch (error) {
        console.error('[Voice] Error joining voice channel:', error.message);
        return false;
    }
}

module.exports = {
    joinVoice
};
