const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());

let cachedStats = {
    memberCount: 0,
    robloxPresence: {
        onlinePlayers: 0,
        serverStatus: 'Unknown'
    },
    lastUpdated: null
};

function updateStats(stats) {
    cachedStats = {
        ...stats,
        lastUpdated: new Date().toISOString()
    };
}

function getStats() {
    return cachedStats;
}

app.get('/api/public-stats', (req, res) => {
    try {
        res.json({
            success: true,
            data: cachedStats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[API] Error in /api/public-stats:', error.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.get('/api/health', (req, res) => {
    try {
        res.json({
            success: true,
            status: 'online',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[API] Error in /api/health:', error.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.post('/api/update-stats', (req, res) => {
    try {
        const { memberCount, robloxPresence } = req.body;
        
        if (memberCount !== undefined) {
            cachedStats.memberCount = memberCount;
        }
        
        if (robloxPresence !== undefined) {
            cachedStats.robloxPresence = robloxPresence;
        }
        
        cachedStats.lastUpdated = new Date().toISOString();
        
        res.json({
            success: true,
            message: 'Stats updated successfully',
            data: cachedStats
        });
    } catch (error) {
        console.error('[API] Error in /api/update-stats:', error.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

app.use((err, req, res, next) => {
    console.error('[API] Unhandled error:', err.message);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

function startServer() {
    try {
        app.listen(PORT, () => {
            console.log(`[API] Server running on port ${PORT}`);
            console.log(`[API] Website available at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('[API] Failed to start server:', error.message);
    }
}

module.exports = {
    app,
    startServer,
    updateStats,
    getStats
};
