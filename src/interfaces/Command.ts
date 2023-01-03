import { CacheType, Interaction, SlashCommandBuilder } from "discord.js";

export default interface Command {
    data: SlashCommandBuilder;

    execute(interaction: Interaction<CacheType>): void | Promise<void>;
}
