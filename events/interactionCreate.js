const { EmbedBuilder, Events, PermissionsBitField } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isCommand()) return;

        const { client } = interaction;
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);

            if (interaction.commandName === 'report' && (interaction.options.getSubcommand() === 'resolved' || interaction.options.getSubcommand() === 'insufficient')) {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    if (!interaction.replied) {
                        return interaction.reply({ content: 'You do not have the required permissions to execute this command.', ephemeral: true });
                    } else {
                        return interaction.followUp({ content: 'The embed was not sent to the player private since you do not have permissions.', ephemeral: true });
                    }
                }

                const reportChannelId = config.ReportChannelId;
                const reportChannel = client.channels.cache.get(reportChannelId);
                if (!reportChannel) return console.error('Report channel not found.');

                const messageId = interaction.options.getString('message_id');
                if (!messageId) return console.error('No message ID provided.');

                try {
                    const message = await reportChannel.messages.fetch(messageId);
                    if (!message) return console.error('Message not found.');

                    const existingEmbed = message.embeds[0];
                    if (!existingEmbed) return console.error('No embed found in the message.');

                    const fields = existingEmbed.fields || [];

                    const updatedColor = interaction.options.getSubcommand() === 'resolved' ? '#00FF00' : '#FFFF00';
                    const updatedTitle = interaction.options.getSubcommand() === 'resolved' ? '🛑 Player Report (Resolved)' : '🛑 Player Report (Insufficient)';

                    const updatedEmbed = new EmbedBuilder()
                        .setColor(updatedColor)
                        .setTitle(updatedTitle)
                        .setFooter({ text: existingEmbed.footer?.text || 'Footer text', iconURL: existingEmbed.footer?.iconURL || 'https://example.com/default-icon.png' })
                        .addFields(fields);

                    await message.edit({ embeds: [updatedEmbed] });

                    const originalReporterField = existingEmbed.fields.find(field => field.name === 'Reported by');
                    if (originalReporterField) {
                        const reporterId = originalReporterField.value.match(/<@(\d+)>/)[1];
                        const reporter = await client.users.fetch(reporterId);
                        if (reporter) {
                            const notificationEmbed = new EmbedBuilder()
                                .setColor(updatedColor)
                                .setTitle(`Your report has been marked as ${interaction.options.getSubcommand() === 'resolved' ? 'resolved' : 'insufficient'}`)
                                .setDescription(`The report you submitted has been reviewed and marked as ${interaction.options.getSubcommand() === 'resolved' ? 'resolved' : 'insufficient'}.`)
                                .setFooter({ text: `Developed by thxmasdev`, iconURL: interaction.client.user.displayAvatarURL() })
                                .addFields(fields);

                            await reporter.send({ embeds: [notificationEmbed] });
                        }
                    }

                } catch (error) {
                    console.error(error);
                }
            }
        } catch (error) {
            console.error(error);
        }
    },
};
