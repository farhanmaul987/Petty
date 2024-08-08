const path = require('path');
const getAllFiles = require('./getAllFiles');

module.exports = (exceptions = []) => {
    let localCommands = [];
    const commandsDir = path.join(__dirname, '..', 'commands');
    const commandFiles = getAllFiles(commandsDir);

    for (const commandFile of commandFiles) {
        const commandObject = require(commandFile);
        if (exceptions.includes(commandObject.name)) {
            continue;
        }
        localCommands.push(commandObject);
    }

    return localCommands;
}