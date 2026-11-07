const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(client, member) {
        try {
            if (!member || !member.user || member.user.bot) return;
        } catch (error) {
            // Silencieux
        }
    }
};
