import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import Command from "../interfaces/Command";

export default class PingCommand implements Command {
    data: SlashCommandBuilder;

    constructor() {
        this.data = new SlashCommandBuilder()
            .setName("ping")
            .setDescription("test for ping");
    }

    execute(interaction: ChatInputCommandInteraction) {
        interaction.reply("pong");
    }
}
