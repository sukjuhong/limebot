import Logger from "../utills/Logger.js";
import { Client, ClientOptions, Collection, Routes, REST } from "discord.js";
import Config from "../utills/Config.js";
import Command from "./Command.js";
import * as path from "path";
import * as fs from "fs";
import * as url from "url";
import Handler from "./Handler.js";
import axios from "axios";

const __dirname = url.fileURLToPath(import.meta.url);

export default class ClientManager {
    static instance = new ClientManager();

    private constructor() {
        this.commands = new Collection<string, Command>();
    }

    public static getInstance(): ClientManager {
        return this.instance;
    }

    client: Client;
    commands: Collection<string, Command>;

    public async init(options: ClientOptions) {
        Logger.info("Starting Discord bot...");
        try {
            this.createClient(options);
            await this.login(Config.DISCORD_TOKEN);
            await this.loadCommands();
            await this.loadHandlers();
            this.registerCommands();
        } catch (error) {
            Logger.error("Failed starting Discord bot.");
            Logger.error(error);
        }
    }

    private createClient(options: ClientOptions) {
        Logger.info("Making Discord bot client...");
        try {
            const client = new Client(options);
            this.client = client;
        } catch (error) {
            Logger.error("Failed Making Discord bot client.");
            Logger.error(error);
        }
        Logger.info("Successfully Making Discord bot client.");
    }

    private async login(discordToken) {
        Logger.info("Logging in Discord bot client...");
        try {
            if (discordToken === "")
                Logger.warn("Your Discord token is empty.");
            await this.client.login(discordToken);
        } catch (error) {
            Logger.error("Failed logged in Discord bot client.");
            Logger.error(error);
        }
        Logger.info("Successfully logged in Discord bot client.");
    }

    private async loadCommands() {
        Logger.info("Loading commands...");
        let loadedCommandsCount: number = 0;
        const commandsPath = path.join(__dirname, "../../.", "/commands");
        const commandFiles = fs
            .readdirSync(commandsPath)
            .filter((file) => file.endsWith(".js") && file !== "Command.js");

        for (const file of commandFiles) {
            try {
                Logger.info(`Loading [${file}] command...`);
                const filePath = path.join(commandsPath, file);
                const command: Command = new (await import(filePath)).default();
                this.commands.set(command.data.name, command);
                Logger.info(
                    `Successfully Loaded [${command.data.name}] command.`
                );
                loadedCommandsCount++;
            } catch (error) {
                Logger.error(`Failed loading [${file}] command.`);
            }
        }

        if (!loadedCommandsCount) Logger.warn("There is no commands.");
        else Logger.info(`Successfully Loaded ${this.commands.size} commands.`);
    }

    private async loadHandlers() {
        Logger.info("Loading handlers...");
        let loadedHandlersCount: number = 0;
        const handlersPath = path.join(__dirname, "../../.", "/handlers");
        const handlerFiles = fs
            .readdirSync(handlersPath)
            .filter((file) => file.endsWith(".js") && file !== "Handler.js");

        for (const file of handlerFiles) {
            try {
                Logger.info(`Loading [${file}] handler...`);
                const filePath = path.join(handlersPath, file);
                const handler: Handler = new (await import(filePath)).default();
                if (handler.once) {
                    this.client.once(handler.name, (...args) =>
                        handler.execute(...args)
                    );
                } else {
                    this.client.on(handler.name, (...args) =>
                        handler.execute(...args)
                    );
                }
                Logger.info(`Successfully loaded [${handler.name}] handlers.`);
                loadedHandlersCount++;
            } catch (error) {
                Logger.error(`Failed loading [${file}] handler.`);
                Logger.error(error);
            }
        }
        if (!loadedHandlersCount) Logger.warn("There is no handlers.");
        else
            Logger.info(`Successfully loaded ${loadedHandlersCount} handlers.`);
    }

    private async registerCommands() {
        if (!this.commands.size) {
            Logger.warn("There is no commands for registering");
            return;
        }

        const rest = new REST({ version: "10" }).setToken(Config.DISCORD_TOKEN);
        const body = [];
        this.commands.each((command) => {
            body.push(command.data.toJSON());
        });

        try {
            Logger.info("Registering commands...");

            await rest.put(
                Routes.applicationGuildCommands(
                    Config.DISCORD_CLIENT_ID,
                    Config.LIME_PARTY_GUILD_ID
                ),
                {
                    body,
                }
            );
        } catch (error) {
            Logger.error("Failed registering commands.");
            Logger.error(error);
        }
        Logger.info(`Sucessfully registerd commands.`);
    }
}

// private registerClientCommands() {
//     const rest = new REST({ version: "10" }).setToken(discordToken);

//     try {
//         logger.info("Registering commands...");

//         if (!this.commands.size) {
//             logger.warn("There is no commands for registering.");
//             return;
//         }

//         const guildsMap = await this.guilds.fetch();
//         for (const guildId of guildsMap.keys()) {
//             const data = await rest.put(Routes.applicationGuildCommands(discordClientId, guildId), {
//                 body: this.commands,
//             });
//             logger.info(
//                 `Successfully registering ${data.length} commands to [${guildsMap.get(guildId).name}] guild.`
//             );
//         }
//     } catch (error) {
//         logger.error("Failed registering commands.");
//         logger.error(error);
//     }
// }
