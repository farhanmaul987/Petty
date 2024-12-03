const fs = require("fs");
const path = require("path");
const {
  EmbedBuilder,
  ApplicationCommandOptionType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ComponentType,
} = require("discord.js");
const { getCosine } = require("../algorithm/cosine");
const { getEuclidean } = require("../algorithm/euclidean");
const { stripIndents } = require("common-tags");

const manhwa_data = require("../data/manhwa_mal.json");
const history_data = path.join(__dirname, "../data/history.json");

// Fungsi untuk membaca history.json
const getUserHistory = (userId) => {
  if (!fs.existsSync(history_data)) return [];
  const history = JSON.parse(fs.readFileSync(history_data, "utf-8"));
  return history[userId] || [];
};

// Fungsi untuk menyimpan data riwayat
const saveHistory = (userId, title) => {
  let history = {};

  // Baca file history.json jika ada
  if (fs.existsSync(history_data)) {
    history = JSON.parse(fs.readFileSync(history_data, "utf-8"));
  }

  // Tambahkan data baru
  const lowerCaseTitle = title.toLowerCase();
  if (!history[userId]) {
    history[userId] = [];
  }
  if (!history[userId].includes(lowerCaseTitle)) {
    history[userId].push(lowerCaseTitle);
  }

  // Tulis kembali ke file
  fs.writeFileSync(history_data, JSON.stringify(history, null, 2));
};

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
    const userId = interaction.user.id;

    // Dapatkan riwayat pengguna
    const userHistory = getUserHistory(userId);

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
            Judul bisa saja berbeda dengan yang biasa didengar, silahkan cek myanimelist untuk judul yang lebih akurat.
            `);
      return interaction.reply({ embeds: [notFound] });
    }

    // Simpan riwayat pencarian hanya jika manhwa ditemukan
    saveHistory(userId, getTitle);

    // Dapatkan rekomendasi
    const cosine = getCosine(getTitle);
    const euclidean = getEuclidean(getTitle);

    if (
      (!cosine || cosine.length === 0) &&
      (!euclidean || euclidean.length === 0)
    ) {
      const noRecommendations = new EmbedBuilder().setColor("#5500FF")
        .setDescription(stripIndents`
                Tidak ada rekomendasi ditemukan untuk **${getTitle}**.
                `);
      return interaction.reply({ embeds: [noRecommendations] });
    }

    // Filter rekomendasi untuk melewati judul yang sudah dicari sebelumnya
    const filterRecommendations = (recommendations) =>
      recommendations
        .filter((rec) => !userHistory.includes(rec.title.toLowerCase()))
        .slice(0, 5);

    const filteredCosine = filterRecommendations(cosine);
    const filteredEuclidean = filterRecommendations(euclidean);

    const embed = new EmbedBuilder()
      .setColor("#5500FF")
      .setTitle(manhwa.title.toUpperCase()).setDescription(stripIndents`
            _**(${manhwa.genres})**_

            ${manhwa.synopsis}

            **AUTHOR**
            - ${manhwa.authors}
            `);

    const cosineResults = filteredCosine.map((rec) => ({
      label: rec.title,
      description: `Similarity: ${rec.similarity}`,
      value: `cosine_${rec.title}`,
    }));

    const euclideanResults = filteredEuclidean.map((rec) => ({
      label: rec.title,
      description: `Distance: ${rec.distance}`,
      value: `euclidean_${rec.title}`,
    }));

    const cosineMenu = new StringSelectMenuBuilder()
      .setCustomId(`${interaction.id}_cosine`)
      .setPlaceholder("Pilih Rekomendasi (Cosine Similarity)")
      .addOptions(
        cosineResults.map((result) =>
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
        euclideanResults.map((result) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(result.label)
            .setDescription(result.description)
            .setValue(result.value)
        )
      );

    const cos = new ActionRowBuilder().addComponents(cosineMenu);
    const euc = new ActionRowBuilder().addComponents(euclideanMenu);

    const reply = await interaction.reply({
      embeds: [embed],
      components: [cos, euc],
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (i) => i.user.id === interaction.user.id,
      time: 180000,
    });

    collector.on("collect", async (i) => {
      let selectedTitle = "";
      if (i.customId.endsWith("_cosine")) {
        selectedTitle = i.values[0].replace("cosine_", "");
      } else if (i.customId.endsWith("_euclidean")) {
        selectedTitle = i.values[0].replace("euclidean_", "");
      }

      const selectedManhwa = manhwa_data.find((m) => m.title === selectedTitle);

      const selectedEmbed = new EmbedBuilder()
        .setColor("#5500FF")
        .setTitle(selectedManhwa.title.toUpperCase())
        .setDescription(stripIndents`
                    _**(${selectedManhwa.genres})**_

                    ${selectedManhwa.synopsis}

                    **AUTHOR**
                    - ${selectedManhwa.authors}
                    `);

      await i.reply({ embeds: [selectedEmbed], ephemeral: true });
    });
  },
};
