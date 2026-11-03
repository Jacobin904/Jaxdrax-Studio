const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageUpdate,
    async execute(client, oldMessage, newMessage) {
        try {
            // Sécurité : ignorer les messages partiels ou les bots
            if (!oldMessage || !newMessage) return;
            if (oldMessage.partial) await oldMessage.fetch().catch(() => {});
            if (newMessage.partial) await newMessage.fetch().catch(() => {});
            
            if (!oldMessage.author || oldMessage.author.bot) return;
            if (!newMessage.author || newMessage.author.bot) return;
            
            // Ignorer si le contenu n'a pas changé
            if (oldMessage.content === newMessage.content) return;
            
            // Tu peux ajouter ici ton code de log d'édition de message
            
        } catch (error) {
            console.error('[Event:messageUpdate]', error.message);
        }
    }
};
