import { Client, ClientOptions, Collection, Routes, REST } from "discord.js";
import * as path from "path";
import * as fs from "fs";

import { config } from "../utills/Config";
import Command from "../interfaces/Command";
import Repeater from "../interfaces/Repeater";
import logger from "../utills/Logger";
import Handler from "../interfaces/Handler";

export default class ClientManager {
    client: Client;
    options: ClientOptions;
    commands: Map<string, Command>;
    repeaters: Map<string, Repeater>;
    handlers: Map<string, Handler>;

    static instance = new ClientManager();

    private constructor() {
        this.options = { intents: [] };
        this.commands = new Collection<string, Command>();
        this.repeaters = new Map<string, Repeater>();
        this.handlers = new Map<string, Handler>();
    }

    public static getInstance() {
        return this.instance;
    }

    public async init(options: ClientOptions) {
        this.client = new Client(options);
        this.client.login(config.DISCORD_TOKEN);

        this.loadCommands().then(() => this.registerCommands());
        this.loadHandlers();
        this.loadRepeater();
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

        if (!loadedCommandsCount) logger.warn("There is no commands.");
        else
            logger.info(`Successfully Loaded ${loadedCommandsCount} commands.`);
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
                    this.client.once(handler.name, (...args) =>
                        handler.execute(...args)
                    );
                } else {
                    this.client.on(handler.name, (...args) =>
                        handler.execute(...args)
                    );
                }
                loadedHandlersCount++;
            } catch (error) {
                logger.error(`Failed to load [${file}] handler.`, error);
            }
        }

        if (!loadedHandlersCount) logger.warn("There is no handlers.");
        else
            logger.info(`Successfully loaded ${loadedHandlersCount} handlers.`);
    }

    private async loadRepeater() {
        let loadedRepeaterCount = 0;
        const repeaterPath = path.join(__dirname, "../commands/repeaters");
        const repeaterFiles = fs
            .readdirSync(repeaterPath)
            .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

        for (const file of repeaterFiles) {
            try {
                const filePath = path.join(repeaterPath, file);
                const repeater: Repeater = new (
                    await import(filePath)
                ).default();
                this.repeaters.set(repeater.name, repeater);
                loadedRepeaterCount++;
            } catch (error) {
                logger.error(`Failed to load [${file}] repeater.`, error);
            }
        }

        if (!loadedRepeaterCount) logger.warn("There is no repeaters.");
        else
            logger.info(`Successfully loaded ${loadedRepeaterCount} handlers.`);
    }

    private async registerCommands() {
        if (!this.commands.size) return;

        const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);
        const body = [];
        this.commands.forEach((command) => {
            body.push(command.data.toJSON());
        });

        try {
            await rest.put(
                Routes.applicationGuildCommands(
                    config.DISCORD_CLIENT_ID,
                    config.LIME_PARTY_GUILD_ID
                ),
                {
                    body,
                }
            );
        } catch (error) {
            logger.error("Failed to register commands.", error);
        }
        logger.info(`Sucessfully registerd commands.`);
    }
}
