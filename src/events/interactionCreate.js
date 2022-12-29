import { Events } from "discord.js";

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`${interaction.commandName} 해당 커맨드의 적용이 안되어있습니다.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: "오류가 발생했습니다.",
                ephemeral: true,
            });
        }
    },
};
