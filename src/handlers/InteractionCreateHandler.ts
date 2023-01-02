import { Events, Interaction } from "discord.js";
import Logger from "../utills/Logger.js";
import ClientManager from "../structures/ClientManager.js";
import Handler from "../structures/Handler.js";

export default class InteractionCreateHandler implements Handler {
    name: string = Events.InteractionCreate;
    once: boolean = false;

    public async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = ClientManager.getInstance().commands.get(
            interaction.commandName
        );

        if (!command) {
            Logger.debug(
                `Cannot find the command ${interaction.commandName} in commands Collection.`
            );
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            Logger.error("Occurred error while executing command.");
            Logger.error(error);
            await interaction.reply({
                content: "커맨드 실행 도중 오류가 발생했습니다.",
                ephemeral: true,
            });
        }
    }
}
