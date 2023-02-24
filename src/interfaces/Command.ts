import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export default interface Command {
    data: any;

    execute(interaction: ChatInputCommandInteraction): void | Promise<void>;
}
