import {
    Client,
    ClientOptions,
    Collection,
    Routes,
    REST,
    GatewayIntentBits,
    VoiceChannel,
} from "discord.js";
import * as path from "path";
import * as fs from "fs";

import { config } from "../utills/Config";
import Command from "../interfaces/Command";
import Repeater from "../interfaces/Repeater";
import logger from "../utills/Logger";

export default class ClientManager {
    client: Client;
    commands: Map<string, Command>;
    repeaters: Map<string, Repeater>;
    options: ClientOptions;
    static instance = new ClientManager();

    private constructor() {
        this.options = { intents: [] };
        this.commands = new Collection<string, Command>();
        this.repeaters = new Map<string, Repeater>();
    }

    public static getInstance() {
        return this.instance;
    }

    public setOptions(options: ClientOptions) {
        logger.info(`Set client options [${options.intents}]`);
        this.options = options;
    }

    public async init() {
        logger.info("Initiating limebot by client manager...");
        this.client = this.createClient();
        await this.login(config.DISCORD_TOKEN);

        await this.loadCommands();
        await this.loadHandlers();
        await this.loadRepeater();
        await this.registerCommands();
    }

    private createClient(): Client {
        logger.info("Creating Discord bot client...");
        let ret: Client<boolean>;
        try {
            ret = new Client(this.options);
        } catch (error) {
            logger.error("Failed to create Discord bot client.", error);
        }
        logger.info("Successfully created Discord bot client.");
        return ret;
    }

    private async login(discordToken) {
        logger.info("Logging in the Discord bot client...");
        try {
            if (discordToken === "")
                logger.warn("Your Discord token is empty.");
            await this.client.login(discordToken);
        } catch (error) {
            logger.error("Failed to log in Discord bot client.", error);
        }
        logger.info("Successfully to log in Discord bot client.");
    }

    private async loadCommands() {
        logger.info("Loading commands...");
        let loadedCommandsCount: number = 0;
        const commandsPath = path.join(__dirname, "../commands");
        const commandFiles = fs
            .readdirSync(commandsPath)
            .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

        for (const file of commandFiles) {
            try {
                logger.info(`Loading [${file}] command...`);
                const filePath = path.join(commandsPath, file);
                const command = new (await import(filePath)).default();
                this.commands.set(command.data.name, command);
                loadedCommandsCount++;
                logger.info(
                    `Successfully Loaded [${command.data.name}] command.`
                );
            } catch (error) {
                logger.error(`Failed to load [${file}] command.`, error);
            }
        }

        if (!loadedCommandsCount) logger.warn("There is no commands.");
        else logger.info(`Successfully Loaded ${this.commands.size} commands.`);
    }

    private async loadHandlers() {
        logger.info("Loading handlers...");
        let loadedHandlersCount: number = 0;
        const handlersPath = path.join(__dirname, "../handlers");
        const handlerFiles = fs
            .readdirSync(handlersPath)
            .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

        for (const file of handlerFiles) {
            try {
                logger.info(`Loading [${file}] handler...`);
                const filePath = path.join(handlersPath, file);
                const handler = new (await import(filePath)).default();
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
                logger.info(`Successfully loaded [${handler.name}] handlers.`);
            } catch (error) {
                logger.error(`Failed to load [${file}] handler.`, error);
            }
        }

        if (!loadedHandlersCount) logger.warn("There is no handlers.");
        else
            logger.info(`Successfully loaded ${loadedHandlersCount} handlers.`);
    }

    private async registerCommands() {
        if (!this.commands.size) {
            logger.warn("There is no commands for registering.");
            return;
        }

        const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);
        const body = [];
        this.commands.forEach((command) => {
            body.push(command.data.toJSON());
        });

        try {
            logger.info("Registering commands...");

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

    private async loadRepeater() {
        logger.info("Loading repeater...");
        let loadedRepeaterCount: number = 0;
        const repeaterPath = path.join(__dirname, "../commands/repeaters");
        const repeaterFiles = fs
            .readdirSync(repeaterPath)
            .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

        for (const file of repeaterFiles) {
            try {
                logger.info(`Loading [${file}] repeater...`);
                const filePath = path.join(repeaterPath, file);
                const repeater = new (await import(filePath)).default();
                this.repeaters.set(repeater.name, repeater);
                loadedRepeaterCount++;
                logger.info(`Successfully loaded [${repeater.name}] repeater.`);
            } catch (error) {
                logger.error(`Failed to load [${file}] repeater.`);
                logger.error(error);
            }
        }

        if (!loadedRepeaterCount) logger.warn("There is no repeaters.");
        else
            logger.info(`Successfully loaded ${loadedRepeaterCount} handlers.`);
    }
}
