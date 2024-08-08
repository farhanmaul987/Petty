const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { stripIndents } = require('common-tags')
const manhwa_data = require('../data/manhwa_mal.json');

module.exports = {
    name: 'manhwa',
    description: 'Get a manhwa!',
    options: [{
        name: 'title',
        description: 'The name of the manhwa',
        type: ApplicationCommandOptionType.String,
        required: true
    }],
    deleted: true,

    callback: (client, interaction) => {
        const getTitle = interaction.options.getString('title');
        const manhwa = manhwa_data.find((m) => {
            const mTitle = typeof m.title === 'string' ? m.title.toLowerCase() : String(m.title).toLowerCase();
            return mTitle === getTitle.toLowerCase();
        });

        if (!manhwa) {
            const notFound = new EmbedBuilder()
                .setColor('#5500FF')
                .setDescription(stripIndents`
                Manhwa **${getTitle}** tidak ditemukan.
                Ketik \`/add_manhwa\` untuk memberi masukan judul ke admin.
                `)
            return interaction.reply({ embeds: [notFound] });
        }

        const embed = new EmbedBuilder()
            .setColor('#5500FF')
            .setTitle(manhwa.title.toUpperCase())
            .setDescription(stripIndents`
            _**(${manhwa.genres})**_

            ${manhwa.synopsis}

            **AUTHOR**
            - ${manhwa.authors}
            `)
        // .setImage('https://cdn.myanimelist.net/images/manga/3/222295.jpg')

        interaction.reply({ embeds: [embed] });
    },
}