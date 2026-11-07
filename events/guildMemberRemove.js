const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(client, member) {
        try {
            if (!member || !member.user) return;
        } catch (error) {
            // Silencieux
        }
    }
};
