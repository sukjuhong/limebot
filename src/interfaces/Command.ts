import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export default interface Command {
    data: Partial<SlashCommandBuilder>;

    execute(interaction: ChatInputCommandInteraction): void | Promise<void>;
}
