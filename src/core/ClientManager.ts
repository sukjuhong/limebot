import { Client, ClientOptions, Collection, Routes, REST } from "discord.js";
import * as path from "path";
import * as fs from "fs";

import { DISCORD_TOKEN, DISCORD_CLIENT_ID } from "../utils/config";
import Command from "../interfaces/Command";
import { logger } from "../utils/logger";
import Handler from "../interfaces/Handler";

export class ClientManager {
  public readonly handlers: Map<String, Handler> = new Map<String, Handler>();
  public readonly commands: Collection<String, Command> = new Collection<
    String,
    Command
  >();

  public constructor(public readonly client: Client) {
    this.loadHandlers();
    this.loadCommands().then(() => this.registerCommands());
    client.login(DISCORD_TOKEN);
  }

  private async loadCommands() {
    let loadedCommandsCount = 0;
    const commandsPath = path.join(__dirname, "../commands");
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

    for (const file of commandFiles) {
      try {
        const filePath = path.join(commandsPath, file);
        const command: Command = new (await import(filePath)).default();
        this.commands.set(command.data.name, command);
        loadedCommandsCount++;
      } catch (error) {
        logger.error(`Failed to load [${file}] command.`, error);
      }
    }

    if (!loadedCommandsCount) logger.warn("There is no commands loaded.");
    else logger.info(`Successfully Loaded ${loadedCommandsCount} commands.`);
  }

  private async loadHandlers() {
    let loadedHandlersCount = 0;
    const handlersPath = path.join(__dirname, "../handlers");
    const handlerFiles = fs
      .readdirSync(handlersPath)
      .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

    for (const file of handlerFiles) {
      try {
        const filePath = path.join(handlersPath, file);
        const handler: Handler = new (await import(filePath)).default();
        this.handlers.set(handler.name, handler);
        if (handler.once) {
          this.client.once(
            handler.name,
            async (...args) => await handler.execute(...args)
          );
        } else {
          this.client.on(
            handler.name,
            async (...args) => await handler.execute(...args)
          );
        }
        loadedHandlersCount++;
      } catch (error) {
        logger.error(`Failed to load [${file}] handler.`, error);
      }
    }

    if (!loadedHandlersCount) logger.warn("There is no handlers loaded.");
    else logger.info(`Successfully loaded ${loadedHandlersCount} handlers.`);
  }

  private async registerCommands() {
    if (!this.commands.size) return;

    const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
    const body = [];
    this.commands.forEach((command) => {
      body.push(command.data.toJSON());
    });

    try {
      await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), {
        body,
      });
      logger.info(`Successfully registerd commands.`);
    } catch (error) {
      logger.error("Failed to register commands.", error);
    }
  }
}
