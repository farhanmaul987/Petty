var clc = require("cli-color");

const { mainServer } = require("../../../config.json");
const areCommandsDifferent = require("../../utils/areCmdDifferent");
const getApplicationCommands = require("../../utils/getAppCommands");
const getLocalCommands = require("../../utils/getLocalCommands");

module.exports = async (client) => {
  try {
    const status =
      clc.greenBright("[ ") +
      clc.yellowBright(" CMD ") +
      clc.greenBright(" ] ");
    const msg = clc.xterm(91);
    const localCommands = getLocalCommands();
    const applicationCommands = await getApplicationCommands(
      client,
      mainServer
    );

    for (const localCommand of localCommands) {
      const { name, description, options } = localCommand;

      const existingCommand = await applicationCommands.cache.find(
        (cmd) => cmd.name === name
      );

      if (existingCommand) {
        if (localCommand.deleted) {
          await applicationCommands.delete(existingCommand.id);
          console.log(status + "Deleted: " + msg(`${name}`));
          continue;
        }

        if (areCommandsDifferent(existingCommand, localCommand)) {
          await applicationCommands.edit(existingCommand.id, {
            description,
            options,
          });
          console.log(status + "Updated: " + msg(`${name}`));
        }
      } else {
        if (localCommand.deleted) {
          console.log(status + "Skipped: " + msg(`${name}`));
          continue;
        }

        await applicationCommands.create({
          name,
          description,
          options,
        });

        console.log(status + "Registered: " + msg(`${name}`));
      }
    }
  } catch (error) {
    console.log(
      `There was an error while trying to register commands: ${error}`
    );
  }
};
