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
const { getCosine } = require('../algorithm/tfidf_cosine');
const { getEuclidean } = require('../algorithm/euclidean');

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
        // try {
        //     console.log("Received find command from user:", interaction.user.tag);
        const getTitle = interaction.options.getString("title");
        // console.log("Searching for title:", getTitle);
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
            Manhwa *${getTitle}* tidak ditemukan.
            Data berdasarkan myanimelist awal tahun 2023.
            Judul bisa saja berbeda dengan yang biasa didengar.
            `);
            return interaction.reply({ embeds: [notFound] });
        }

        const cosine = getCosine(getTitle);
        const euclidean = getEuclidean(getTitle);

        if ((!cosine || cosine.length === 0) && (!euclidean || euclidean.length === 0)) {
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

        const cosineResults = cosine.map(rec => ({
            label: rec.title,
            description: `Similarity: ${rec.similarity}`,
            value: `cosine_${rec.title}`,
        }));

        const euclideanResults = euclidean.map(rec => ({
            label: rec.title,
            description: `Distance: ${rec.distance}`,
            value: `euclidean_${rec.title}`,
        }));

        const cosineMenu = new StringSelectMenuBuilder()
            .setCustomId(`${interaction.id}_cosine`)
            .setPlaceholder("Pilih rekomendasi (Cosine Similarity)")
            .addOptions(
                cosineResults.map(result =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(result.label)
                        .setDescription(result.description)
                        .setValue(result.value)
                )
            );

        const euclideanMenu = new StringSelectMenuBuilder()
            .setCustomId(`${interaction.id}_euclidean`)
            .setPlaceholder("Pilih rekomendasi (Euclidean Distance)")
            .addOptions(
                euclideanResults.map(result =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(result.label)
                        .setDescription(result.description)
                        .setValue(result.value)
                )
            );

        const row = new ActionRowBuilder().addComponents(cosineMenu);
        const row2 = new ActionRowBuilder().addComponents(euclideanMenu);

        const reply = await interaction.reply({ embeds: [embed], components: [row, row2] });

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            filter: (i) => i.user.id === interaction.user.id,
            time: 180000,
        });

        collector.on('collect', async (i) => {
            let selectedTitle = "";
            if (i.customId.endsWith('_cosine')) {
                selectedTitle = i.values[0].replace('cosine_', '');
            } else if (i.customId.endsWith('_euclidean')) {
                selectedTitle = i.values[0].replace('euclidean_', '');
            }

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
        // } catch (error) {
        //     console.error("Error in find command:", error);
        //     await interaction.reply({ content: 'There was an error processing your request.', ephemeral: true });
        // }
    }

};
