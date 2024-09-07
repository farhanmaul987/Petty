const {
    EmbedBuilder,
    ApplicationCommandOptionType,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    ComponentType
} = require("discord.js");

const manhwa_data = require('../data/manhwa_mal.json');
const { getCosine } = require('../algorithm/cosine');
const { getEuclidean } = require('../algorithm/euclidean');
const { stripIndents } = require("common-tags");

module.exports = {
    name: "find",
    description: "Temukan Rekomendasi Manhwa",
    options: [
        {
            name: "title",
            description: "Judul Manhwa",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],

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
            Data berdasarkan myanimelist awal tahun 2023.
            Judul bisa saja berbeda dengan yang biasa didengar, , silahkan cek myanimelist untuk judul yang lebih akurat.
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
            .setPlaceholder("Pilih Rekomendasi (Cosine Similarity)")
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
            .setPlaceholder("Pilih Rekomendasi (Euclidean Distance)")
            .addOptions(
                euclideanResults.map(result =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(result.label)
                        .setDescription(result.description)
                        .setValue(result.value)
                )
            );

        const cos = new ActionRowBuilder().addComponents(cosineMenu);
        const euc = new ActionRowBuilder().addComponents(euclideanMenu);

        const reply = await interaction.reply({ embeds: [embed], components: [cos, euc] });

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

            const selectedEmbed = new EmbedBuilder()
                .setColor("#5500FF")
                .setTitle(selectedManhwa.title.toUpperCase()).setDescription(stripIndents`
                    _**(${selectedManhwa.genres})**_

                    ${selectedManhwa.synopsis}

                    **AUTHOR**
                    - ${selectedManhwa.authors}
                    `);

            await i.reply({ embeds: [selectedEmbed], ephemeral: true });
        });
    }

};
