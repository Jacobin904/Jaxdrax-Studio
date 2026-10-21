const express = require('express');

module.exports = function createApiServer(client, robloxPresence, updateBotPresence) {
    const app = express();
    app.use(express.json());
    const PORT = process.env.PORT || 3000;

    function verifyRobloxKey(req, res, next) {
        if (req.headers['x-roblox-key'] !== process.env.ROBLOX_API_KEY) {
            return res.status(401).json({ error: 'Invalid API key' });
        }
        next();
    }

    app.get('/', (req, res) => {
        res.status(200).send('Jaxdrax Studio Bot is running smoothly');
    });

    app.post('/api/update-presence', verifyRobloxKey, (req, res) => {
        try {
            const { onlinePlayers, totalPlayers, serverStatus } = req.body;
            robloxPresence.onlinePlayers = onlinePlayers || 0;
            robloxPresence.totalPlayers = totalPlayers || 0;
            robloxPresence.serverStatus = serverStatus || 'Unknown';
            updateBotPresence();
            res.json({ success: true, message: 'Presence updated', data: robloxPresence });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/check-member', verifyRobloxKey, async (req, res) => {
        try {
            const { discordId, guildId } = req.body;
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return res.json({ isMember: false });
            try {
                await guild.members.fetch(discordId);
                res.json({ isMember: true });
            } catch {
                res.json({ isMember: false });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/give-vip', verifyRobloxKey, async (req, res) => {
        try {
            const { discordId, guildId } = req.body;
            const guild = client.guilds.cache.get(guildId);
            const vipRole = guild.roles.cache.find(r => r.name === 'VIP');
            const member = await guild.members.fetch(discordId);
            await member.roles.add(vipRole);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/stats', verifyRobloxKey, (req, res) => {
        const guild = client.guilds.cache.first();
        if (!guild) return res.status(404).json({ error: 'No guild found' });
        res.json({
            memberCount: guild.memberCount,
            onlineCount: guild.members.cache.filter(m => m.presence?.status === 'online').size,
            botOnline: true,
            robloxPresence: robloxPresence
        });
    });

    app.listen(PORT, () => console.log(`API and health check server running on port ${PORT}`));
};
