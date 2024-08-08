const {
    EmbedBuilder,
    ApplicationCommandOptionType,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    ComponentType
} = require("discord.js");

const { stripIndents } = require("common-tags");
const manhwa_data = require('../data/manhwa_mal.json');
const { getRecommendations } = require('../algorithm/tfidf_cosine');

module.exports = {
    name: "find",
    description: "Find Manhwa Recommendation",
    options: [
        {
            name: "title",
            description: "The name of the manhwa",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    // deleted: true,

    callback: async (client, interaction) => {
        const getTitle = interaction.options.getString("title");
        const manhwa = manhwa_data.find((m) => {
            const mTitle =
                typeof m.title === "string"
                    ? m.title.toLowerCase()
                    : String(m.title).toLowerCase();
            return mTitle === getTitle.toLowerCase();
        });

        if (!manhwa) {
            const notFound = new EmbedBuilder().setColor("#5500FF")
                .setDescription(stripIndents`
                Manhwa **${getTitle}** tidak ditemukan.
                Ketik \`/add_manhwa\` untuk memberi masukan judul ke admin.
                `);
            return interaction.reply({ embeds: [notFound] });
        }

        // Mendapatkan rekomendasi dari tfidf_cosine.js
        const recommendations = getRecommendations(getTitle);

        if (!recommendations || recommendations.length === 0) {
            const noRecommendations = new EmbedBuilder().setColor("#5500FF")
                .setDescription(stripIndents`
                Tidak ada rekomendasi ditemukan untuk **${getTitle}**.
                `);
            return interaction.reply({ embeds: [noRecommendations] });
        }

        const embed = new EmbedBuilder()
            .setColor("#5500FF")
            .setTitle(manhwa.title.toUpperCase()).setDescription(stripIndents`
            _**(${manhwa.genres})**_

            ${manhwa.synopsis}

            **AUTHOR**
            - ${manhwa.authors}
            `);

        const results = recommendations.map(rec => ({
            label: rec.title,
            description: `Similarity: ${rec.similarity}`,
            value: rec.title,
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(interaction.id)
            .setPlaceholder("Pilih untuk informasi lebih lanjut")
            .addOptions(
                results.map(result =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(result.label)
                        .setDescription(result.description)
                        .setValue(result.value)
                )
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const reply = await interaction.reply({ embeds: [embed], components: [row] });

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            filter: (i) => i.user.id === interaction.user.id && i.customId === interaction.id,
            time: 60_000,
        });

        collector.on('collect', async (i) => {
            const selectedTitle = i.values[0];
            const selectedManhwa = manhwa_data.find(m => m.title === selectedTitle);

            if (selectedManhwa) {
                const selectedEmbed = new EmbedBuilder()
                    .setColor("#5500FF")
                    .setTitle(selectedManhwa.title.toUpperCase()).setDescription(stripIndents`
                    _**(${selectedManhwa.genres})**_

                    ${selectedManhwa.synopsis}

                    **AUTHOR**
                    - ${selectedManhwa.authors}
                    `);

                await i.reply({ embeds: [selectedEmbed], ephemeral: true });
            } else {
                await i.reply({ content: 'Informasi manhwa tidak ditemukan.', ephemeral: true });
            }
        });
    },
};
