import { ClientEvents, Events, Guild } from "discord.js";
import Handler from "../interfaces/Handler";
import prisma from "../utils/db";
import { logger } from "../utils/logger";

export default class GuildAvailableHandler implements Handler {
  name: keyof ClientEvents = Events.GuildAvailable;
  once: Boolean = false;

  async execute(guild: Guild): Promise<void> {
    const guildInDB = await prisma.guild.findUnique({
      where: { id: guild.id },
    });

    if (!guildInDB) {
      logger.info(`Recognize new guild [${guild.name}].`);
      await prisma.guild.create({
        data: {
          id: guild.id,
        },
      });
    }
  }
}
