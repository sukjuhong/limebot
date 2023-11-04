import { Client, ClientEvents, Events } from "discord.js";

import Handler from "../interfaces/Handler";
import { logger } from "../utils/logger";

export default class ClientReadyHandler implements Handler {
  name: keyof ClientEvents = Events.ClientReady;
  once: Boolean = true;

  public execute(client: Client): void {
    logger.info(`Logged in as ${client.user.tag}`);
  }
}
