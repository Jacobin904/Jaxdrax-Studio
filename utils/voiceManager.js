const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const SpotifyWebApi = require('spotify-web-api-node');
const yts = require('yt-stream');
const ffmpeg = require('ffmpeg-static');

const VOICE_CHANNEL_ID = '1561473045208506479';

let connection = null;
let player = null;
let currentTrack = null;
let queue = [];

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

// Rafraîchir le token Spotify
async function refreshSpotifyToken() {
    try {
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body.access_token);
        console.log('[Voice] Spotify token refreshed');
    } catch (error) {
        console.error('[Voice] Error refreshing Spotify token:', error.message);
    }
}

// Rejoindre le salon vocal
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

        player = createAudioPlayer();
        connection.subscribe(player);

        connection.on(VoiceConnectionStatus.Ready, () => {
            console.log('[Voice] Connected to voice channel');
        });

        connection.on(VoiceConnectionStatus.Disconnected, () => {
            console.log('[Voice] Disconnected from voice channel, attempting to reconnect...');
            setTimeout(() => joinVoice(client), 5000);
        });

        player.on(AudioPlayerStatus.Idle, () => {
            console.log('[Voice] Player idle, playing next track');
            playNext();
        });

        return true;
    } catch (error) {
        console.error('[Voice] Error joining voice channel:', error.message);
        return false;
    }
}

// Rechercher une chanson Spotify
async function searchSpotifyTrack(url) {
    try {
        const trackId = url.match(/track\/([a-zA-Z0-9]+)/)?.[1];
        if (!trackId) return null;

        const track = await spotifyApi.getTrack(trackId);
        return {
            title: track.body.name,
            artist: track.body.artists.map(a => a.name).join(', '),
            url: url
        };
    } catch (error) {
        console.error('[Voice] Error searching Spotify track:', error.message);
        return null;
    }
}

// Rechercher une playlist Spotify
async function searchSpotifyPlaylist(url) {
    try {
        const playlistId = url.match(/playlist\/([a-zA-Z0-9]+)/)?.[1];
        if (!playlistId) return [];

        const playlist = await spotifyApi.getPlaylistTracks(playlistId);
        return playlist.body.items.map(item => ({
            title: item.track.name,
            artist: item.track.artists.map(a => a.name).join(', '),
            url: item.track.external_urls.spotify
        }));
    } catch (error) {
        console.error('[Voice] Error searching Spotify playlist:', error.message);
        return [];
    }
}

// Chercher sur YouTube
async function searchYouTube(query) {
    try {
        const results = await yts.search(query, { limit: 1 });
        if (results.length === 0) return null;
        return results[0].url;
    } catch (error) {
        console.error('[Voice] Error searching YouTube:', error.message);
        return null;
    }
}

// Jouer une piste
async function playTrack(track) {
    try {
        const query = `${track.title} ${track.artist}`;
        const youtubeUrl = await searchYouTube(query);
        
        if (!youtubeUrl) {
            console.error('[Voice] Could not find track on YouTube');
            return false;
        }

        const stream = yts.stream(youtubeUrl, { highWaterMark: 1024 * 1024 * 10 });
        const resource = createAudioResource(stream, {
            inputType: 'webm/opus'
        });

        currentTrack = track;
        player.play(resource);
        
        console.log(`[Voice] Now playing: ${track.title} by ${track.artist}`);
        return true;
    } catch (error) {
        console.error('[Voice] Error playing track:', error.message);
        return false;
    }
}

// Ajouter à la file d'attente
async function addToQueue(url) {
    if (url.includes('playlist')) {
        const tracks = await searchSpotifyPlaylist(url);
        queue.push(...tracks);
        return tracks.length;
    } else {
        const track = await searchSpotifyTrack(url);
        if (track) {
            queue.push(track);
            return 1;
        }
    }
    return 0;
}

// Jouer la prochaine piste
function playNext() {
    if (queue.length > 0) {
        const track = queue.shift();
        playTrack(track);
    } else {
        currentTrack = null;
    }
}

// Obtenir la file d'attente
function getQueue() {
    return { current: currentTrack, queue: queue };
}

// Skip la piste actuelle
function skipTrack() {
    player.stop();
}

module.exports = {
    joinVoice,
    addToQueue,
    getQueue,
    skipTrack,
    refreshSpotifyToken
};
