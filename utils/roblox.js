const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ROBLOX_FILE = path.join(DATA_DIR, 'roblox-users.json');

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

function linkRobloxAccount(discordId, robloxUsername, robloxId) {
    const data = loadRobloxData();
    data[discordId] = {
        robloxUsername: robloxUsername,
        robloxId: robloxId,
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
        if (robloxData.robloxUsername.toLowerCase() === robloxUsername.toLowerCase()) {
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
    linkRobloxAccount,
    getRobloxAccount,
    findDiscordIdByRobloxUsername,
    unlinkRobloxAccount,
    loadRobloxData
};
