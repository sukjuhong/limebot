import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    Events,
    Interaction,
} from "discord.js";

import Logger from "../utills/Logger";
import ClientManager from "../structures/ClientManager";
import Handler from "../interfaces/Handler";

export default class InteractionCreateHandler implements Handler {
    name: string;
    once: boolean;

    constructor() {
        this.name = Events.InteractionCreate;
        this.once = false;
    }

    public async execute(interaction: Interaction) {
        if (interaction.isChatInputCommand()) {
            const command = ClientManager.commands.get(interaction.commandName);

            if (!command) {
                Logger.debug(
                    `Cannot find the command [${interaction.commandName}] in commands Collection.`
                );
                return;
            }

            try {
                Logger.info(
                    `Executed [${interaction.commandName}] command by [${interaction.member.user.username}] user.`
                );
                await command.execute(interaction);
            } catch (error) {
                Logger.error(
                    `Occurred error while executing [${interaction.commandName}] command.`
                );
                Logger.error(error);
                await interaction.reply({
                    content: "커맨드 실행 도중 오류가 발생했습니다.",
                    ephemeral: true,
                });
            }
        }
    }
}
