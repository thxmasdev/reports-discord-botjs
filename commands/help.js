const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays a list of available commands categorized by type'),
    async execute(interaction) {

        const botAvatarURL = interaction.client.user.displayAvatarURL();

        const helpEmbed = new EmbedBuilder()
            .setTitle('Help Menu')
            .setDescription('Here are the available commands categorized by type:')
            .setColor(0x6E0177)

            .addFields(
                { name: 'General Commands', value: '`/botinfo` - Get information about of the bot\n`/help` - Displays this help menu' },

                { name: 'Report Commands', value: '`/report create <user> <your report>` - Create a new report\n`/report resolved <report ID>` - Resolved a Report\n`/report insufficient <report ID>` - Insufficient a Report' }
            )

            .setFooter({ text: `Developed by thxmasdev`, iconURL: botAvatarURL });

        await interaction.reply({ embeds: [helpEmbed] });
    },
};
