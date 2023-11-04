import {
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  CacheType,
} from "discord.js";
import Command from "../interfaces/Command";

export default class EchoCommand implements Command {
  public readonly data = new SlashCommandBuilder()
    .setName("echo")
    .setDescription("Repiles with your input!")
    .addStringOption((option) =>
      option.setName("input").setDescription("The input to echo back")
    );

  public async execute(
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<void> {
    const input = interaction.options.getString("input");
    await interaction.reply(input);
  }
}
