import {
  ChatInputCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
} from "discord.js";

export default interface Command {
  data: {
    name: String;
    description: String;
    toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody;
  } & Partial<SlashCommandBuilder>;

  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
