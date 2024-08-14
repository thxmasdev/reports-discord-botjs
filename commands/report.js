const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Report a player or manage reports.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new player report.')
                .addUserOption(option => 
                    option.setName('player')
                        .setDescription('The player to report.')
                        .setRequired(true))
                .addStringOption(option => 
                    option.setName('report')
                        .setDescription('The report message.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('resolved')
                .setDescription('Mark a report as resolved.')
                .addStringOption(option => 
                    option.setName('message_id')
                        .setDescription('The ID of the message to mark as resolved.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('insufficient')
                .setDescription('Mark a report as insufficient.')
                .addStringOption(option => 
                    option.setName('message_id')
                        .setDescription('The ID of the message to mark as insufficient.')
                        .setRequired(true))),
    
    async execute(interaction) {
        if (!interaction.isCommand()) return;

        const { client, options } = interaction;
        const config = require('../config.json');
        const reportChannelId = config.ReportChannelId;
        const staffRoleId = config.staffRoleId;

        const subcommand = options.getSubcommand();
        const user = options.getUser('player');
        const reportMessage = options.getString('report');
        const messageId = options.getString('message_id');

        const botAvatarURL = interaction.client.user.displayAvatarURL();

        try {
            if (subcommand === 'create') {
                if (user.id === interaction.user.id) {
                    return interaction.reply({ content: 'You cannot report yourself.', ephemeral: true });
                }

                const now = Date.now();
                const cooldownAmount = 30 * 60 * 1000; // 30 minutes

                if (cooldowns.has(interaction.user.id)) {
                    const expirationTime = cooldowns.get(interaction.user.id) + cooldownAmount;
                    if (now < expirationTime) {
                        const timeLeft = (expirationTime - now) / 1000;
                        return interaction.reply({ content: `Please wait ${Math.ceil(timeLeft / 60)} more minute(s) before reporting again.`, ephemeral: true });
                    }
                }
                cooldowns.set(interaction.user.id, now);
                setTimeout(() => cooldowns.delete(interaction.user.id), cooldownAmount);

                const embed = new EmbedBuilder()
                    .setColor('#6E0177')
                    .setTitle('🛑 Player Report 🛑')
                    .setFooter({ text: `Developed by thxmasdev`, iconURL: botAvatarURL })
                    .addFields(
                        { name: 'User Report', value: `<@${user.id}>`, inline: false },
                        { name: 'Reported by', value: `<@${interaction.user.id}>`, inline: false },
                        { name: 'Message Report', value: reportMessage }
                    );

                const reportChannel = client.channels.cache.get(reportChannelId);
                if (!reportChannel) return interaction.reply({ content: 'Report channel not found.', ephemeral: true });

                await reportChannel.send({ content: `<@&${staffRoleId}>`, embeds: [embed] });
                return interaction.reply({ content: 'Your report has been submitted.', ephemeral: true });

            } else if (subcommand === 'resolved' || subcommand === 'insufficient') {

                if (!messageId) return interaction.reply({ content: 'Please provide a valid message ID.', ephemeral: true });

                const reportChannel = client.channels.cache.get(reportChannelId);
                if (!reportChannel) return interaction.reply({ content: 'Report channel not found.', ephemeral: true });

                try {
                    const message = await reportChannel.messages.fetch(messageId);
                    if (!message) return interaction.reply({ content: 'Message not found.', ephemeral: true });

                    const existingEmbed = message.embeds[0];
                    if (!existingEmbed) return interaction.reply({ content: 'No embed found in the message.', ephemeral: true });

                    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                        return interaction.reply({ content: 'You do not have the required permissions to execute this command.', ephemeral: true });
                    }

                    const updatedEmbed = new EmbedBuilder()
                        .setColor(subcommand === 'resolved' ? '#00FF00' : '#FFFF00')
                        .setTitle(subcommand === 'resolved' ? '🛑 Player Report (Resolved)' : '🛑 Player Report (Insufficient)')
                        .setFooter({ text: existingEmbed.footer.text, iconURL: existingEmbed.footer.iconURL })
                        .addFields(existingEmbed.fields);

                    await message.edit({ embeds: [updatedEmbed] });
                    return interaction.reply({ content: `Report marked as ${subcommand === 'resolved' ? 'resolved' : 'insufficient'}.`, ephemeral: true });

                } catch (error) {
                    console.error(error);
                    return interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
                }
            }
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
        }
    },
};
