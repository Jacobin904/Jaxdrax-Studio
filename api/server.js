const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour servir les fichiers statiques du site web
app.use(express.static(path.join(__dirname, '..', 'public')));

// Middleware pour parser le JSON
app.use(express.json());

// Stockage des stats (mis à jour par le bot)
let cachedStats = {
    memberCount: 0,
    robloxPresence: {
        onlinePlayers: 0,
        serverStatus: 'Unknown'
    },
    lastUpdated: null
};

// Fonction pour mettre à jour les stats
function updateStats(stats) {
    cachedStats = {
        ...stats,
        lastUpdated: new Date().toISOString()
    };
}

// Endpoint pour les stats publiques (utilisé par le site web)
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

// Endpoint de santé pour vérifier que le bot est en ligne
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

// Endpoint pour mettre à jour les stats (appelé par le bot)
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

// Route par défaut - redirige vers le site web
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Gestion des routes non trouvées
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error('[API] Unhandled error:', err.message);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Démarrage du serveur
function startServer() {
    try {
        app.listen(PORT, () => {
            console.log(`[API] Server running on port ${PORT}`);
            console.log(`[API] Website available at http://localhost:${PORT}`);
            console.log(`[API] API endpoints:`);
            console.log(`  - GET /api/public-stats`);
            console.log(`  - GET /api/health`);
            console.log(`  - POST /api/update-stats`);
        });
    } catch (error) {
        console.error('[API] Failed to start server:', error.message);
        process.exit(1);
    }
}

// Exporter les fonctions pour que le bot puisse les utiliser
module.exports = {
    app,
    startServer,
    updateStats,
    getStats: () => cachedStats
};

// Démarrer le serveur automatiquement si ce fichier est exécuté directement
if (require.main === module) {
    startServer();
}
