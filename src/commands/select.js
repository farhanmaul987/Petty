const { EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ComponentType } = require("discord.js");

const { stripIndents } = require("common-tags")

module.exports = {
    name: 'select',
    description: 'Just Select',
    deleted: true,

    callback: async (client, interaction) => {

        const embed = new EmbedBuilder()
            .setColor('#5500FF')
            .setDescription(stripIndents`
        Choose Your Pet!
        `)

        const pets = [
            {
                label: 'Dog',
                description: 'This is a dog',
                value: 'White Dog'
            },
            {
                label: 'Cat',
                description: 'This is a cat',
                value: 'Black Cat'
            }
        ];

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(interaction.id)
            .setPlaceholder('Make a selection!')
            .addOptions(pets.map((pets) =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(pets.label)
                    .setDescription(pets.description)
                    .setValue(pets.value)));

        const row = new ActionRowBuilder()
            .addComponents(selectMenu);

        const reply = await interaction.reply({ components: [row] });

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            filter: (i) => i.user.id === interaction.user.id && i.customId === interaction.id,
            time: 60_000,
        });

        collector.on('collect', (interaction) => {
            if (!interaction.values.length) {
                interaction.reply({ content: 'No value selected', ephemeral: true });
                return;
            }

            interaction.reply({ content: `You selected: ${interaction.values[0]}`, ephemeral: true });
        })
    }
}