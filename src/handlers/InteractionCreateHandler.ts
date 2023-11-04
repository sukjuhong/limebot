import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ClientEvents,
  Events,
  Interaction,
} from "discord.js";

import { logger } from "../utils/logger";
import Handler from "../interfaces/Handler";
import { clientManager } from "../app";

export default class InteractionCreateHandler implements Handler {
  name: keyof ClientEvents = Events.InteractionCreate;
  once: Boolean = false;

  public async execute(interaction: Interaction) {
    if (interaction.isChatInputCommand()) {
      const command = clientManager.commands.get(interaction.commandName);

      try {
        logger.info(
          `Executed [${interaction.commandName}] command by [${interaction.member.user.username}] user.`
        );
        await command.execute(interaction);
      } catch (error) {
        logger.error(
          `Occurred error while executing [${interaction.commandName}] command.`,
          error
        );
        await interaction.reply({
          content: "커맨드 실행 도중 오류가 발생했습니다.",
          ephemeral: true,
        });
      }
    }
  }
}
