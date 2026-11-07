const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageUpdate,
    async execute(client, oldMessage, newMessage) {
        try {
            if (!oldMessage || !newMessage) return;
            if (!oldMessage.author || !newMessage.author) return;
            if (oldMessage.author.bot || newMessage.author.bot) return;
            if (!oldMessage.guild || !newMessage.guild) return;
            if (oldMessage.content === newMessage.content) return;
        } catch (error) {
            // Silencieux : les partials causent souvent des erreurs, on ignore
        }
    }
};
