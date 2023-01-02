import { Interaction, SlashCommandBuilder } from "discord.js";

export default interface Command {
    data: SlashCommandBuilder;

    execute(interaction: Interaction): void | Promise<void>;
}
