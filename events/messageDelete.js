const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageDelete,
    async execute(client, message) {
        try {
            if (!message || !message.guild) return;
            if (!message.author || message.author.bot) return;
        } catch (error) {
            // Silencieux
        }
    }
};
