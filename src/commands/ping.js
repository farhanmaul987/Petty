module.exports = {
    name: "ping",
    description: "Get the bot's latency",

    callback: (client, interaction) => {
        interaction.reply({
            content: `Ping! ${client.ws.ping}ms`,
            ephemeral: true,
        });
    },
};