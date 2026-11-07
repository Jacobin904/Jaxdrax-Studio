const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ROBLOX_FILE = path.join(DATA_DIR, 'roblox-users.json');
const ROBLOX_STATES_FILE = path.join(DATA_DIR, 'roblox-states.json');

// Configuration OAuth Roblox
const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID;
const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET;
const ROBLOX_REDIRECT_URI = process.env.ROBLOX_REDIRECT_URI || 'https://jaxdrax-studio.canner.app/api/roblox/callback';

function loadRobloxData() {
    try {
        if (!fs.existsSync(ROBLOX_FILE)) return {};
        return JSON.parse(fs.readFileSync(ROBLOX_FILE, 'utf8'));
    } catch (error) {
        return {};
    }
}

function saveRobloxData(data) {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(ROBLOX_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('[Roblox] Save failed:', error.message);
        return false;
    }
}

function loadStates() {
    try {
        if (!fs.existsSync(ROBLOX_STATES_FILE)) return {};
        const data = JSON.parse(fs.readFileSync(ROBLOX_STATES_FILE, 'utf8'));
        // Nettoyer les états expirés (plus de 10 minutes)
        const now = Date.now();
        const cleaned = {};
        for (const [state, info] of Object.entries(data)) {
            if (now - info.createdAt < 10 * 60 * 1000) {
                cleaned[state] = info;
            }
        }
        return cleaned;
    } catch (error) {
        return {};
    }
}

function saveStates(states) {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(ROBLOX_STATES_FILE, JSON.stringify(states, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('[Roblox] States save failed:', error.message);
        return false;
    }
}

function generateAuthUrl(discordId) {
    if (!ROBLOX_CLIENT_ID || !ROBLOX_CLIENT_SECRET) {
        throw new Error('Roblox OAuth not configured. Set ROBLOX_CLIENT_ID, ROBLOX_CLIENT_SECRET, and ROBLOX_REDIRECT_URI in environment variables.');
    }

    const state = crypto.randomBytes(16).toString('hex');
    const states = loadStates();
    states[state] = {
        discordId: discordId,
        createdAt: Date.now()
    };
    saveStates(states);

    const params = new URLSearchParams({
        client_id: ROBLOX_CLIENT_ID,
        redirect_uri: ROBLOX_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid profile',
        state: state
    });

    return `https://authorize.roblox.com/?${params.toString()}`;
}

async function exchangeCodeForToken(code, state) {
    const states = loadStates();
    const stateInfo = states[state];

    if (!stateInfo) {
        throw new Error('Invalid or expired state');
    }

    // Supprimer le state après utilisation
    delete states[state];
    saveStates(states);

    // Échanger le code contre un access token
    const tokenResponse = await fetch('https://apis.roblox.com/oauth/v1/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            client_id: ROBLOX_CLIENT_ID,
            client_secret: ROBLOX_CLIENT_SECRET,
            redirect_uri: ROBLOX_REDIRECT_URI
        })
    });

    if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    return { accessToken: tokenData.access_token, discordId: stateInfo.discordId };
}

async function getRobloxUserInfo(accessToken) {
    // Récupérer les infos de l'utilisateur via l'API Roblox
    const userResponse = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!userResponse.ok) {
        throw new Error('Failed to get user info');
    }

    const userInfo = await userResponse.json();
    return {
        robloxId: userInfo.sub,
        robloxUsername: userInfo.preferred_username,
        displayName: userInfo.name || userInfo.preferred_username
    };
}

function linkRobloxAccount(discordId, robloxData) {
    const data = loadRobloxData();
    data[discordId] = {
        ...robloxData,
        linkedAt: new Date().toISOString(),
        verified: true
    };
    return saveRobloxData(data);
}

function getRobloxAccount(discordId) {
    const data = loadRobloxData();
    return data[discordId] || null;
}

function findDiscordIdByRobloxUsername(robloxUsername) {
    const data = loadRobloxData();
    for (const [discordId, robloxData] of Object.entries(data)) {
        if (robloxData.robloxUsername && robloxData.robloxUsername.toLowerCase() === robloxUsername.toLowerCase()) {
            return discordId;
        }
    }
    return null;
}

function findDiscordIdByRobloxId(robloxId) {
    const data = loadRobloxData();
    for (const [discordId, robloxData] of Object.entries(data)) {
        if (robloxData.robloxId === robloxId) {
            return discordId;
        }
    }
    return null;
}

function unlinkRobloxAccount(discordId) {
    const data = loadRobloxData();
    if (data[discordId]) {
        delete data[discordId];
        return saveRobloxData(data);
    }
    return false;
}

module.exports = {
    generateAuthUrl,
    exchangeCodeForToken,
    getRobloxUserInfo,
    linkRobloxAccount,
    getRobloxAccount,
    findDiscordIdByRobloxUsername,
    findDiscordIdByRobloxId,
    unlinkRobloxAccount,
    loadRobloxData
};
