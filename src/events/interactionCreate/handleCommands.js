var clc = require("cli-color");
const { devs, mainServer } = require('../../../config.json');
const getLocalCommands = require('../../utils/getLocalCommands');

module.exports = async (client, interaction) => {

    if (!interaction.isChatInputCommand()) return;

    const localCommands = getLocalCommands();

    try {
        const commandObject = localCommands.find(
            (cmd) => cmd.name === interaction.commandName
        );

        if (!commandObject) return;

        const status = clc.greenBright('[ ') + clc.blueBright(' CHAT ') + clc.greenBright(' ] ');
        console.log(status + 'from ' + clc.magentaBright(interaction.user.tag) + ' in ' + clc.yellowBright(interaction.guild.name) + ' | ' + clc.greenBright(interaction.commandName));

        if (commandObject.devOnly) {
            if (!devs.includes(interaction.member.id)) {
                interaction.reply({
                    content: '⛔  You do not have permission to use this command.',
                    ephemeral: true,
                });
                return;
            }
        }

        if (commandObject.testOnly) {
            if (!(interaction.guild.id === mainServer)) {
                interaction.reply({
                    content: '⛔  This command cannot be ran here.',
                    ephemeral: true,
                });
                return;
            }
        }

        if (commandObject.permissionsRequired?.length) {
            for (const permission of commandObject.permissionsRequired) {
                if (!interaction.member.permission.has(permission)) {
                    interaction.reply({
                        content: '⛔  You do not have permission to use this command.',
                        ephemeral: true,
                    });
                    return;
                }
            }
        }

        if (commandObject.botPermissions?.length) {
            for (const permission of commandObject.botPermissions) {
                const bot = interaction.guild.member.me;

                if (!bot.permission.has(permission)) {
                    interaction.reply({
                        content: '⛔  I do not have permission to use this command.',
                        ephemeral: true,
                    });
                    return;
                }
            }
        }

        await commandObject.callback(client, interaction);
    } catch (error) {
        console.log(`⚠️  There was an error running a command: ${error}.`);
    }

}