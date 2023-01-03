import Logger from "../utills/Logger";
import {
    Client,
    ClientOptions,
    Collection,
    Routes,
    REST,
    GatewayIntentBits,
} from "discord.js";
import Config from "../utills/Config";
import Command from "../interfaces/Command";
import Repeater from "../interfaces/Repeater";
import * as path from "path";
import * as fs from "fs";

export default class ClientManager {
    static instance = new ClientManager();

    client: Client;
    commands: Collection<string, Command>;
    repeaters: Collection<Repeater, NodeJS.Timer>;
    options: ClientOptions;

    private constructor() {
        this.options = {
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
            ],
        };
        this.commands = new Collection<string, Command>();
        this.repeaters = new Collection<Repeater, NodeJS.Timer>();
        this.createClient();
    }

    public static getInstance(): ClientManager {
        return this.instance;
    }

    public async init() {
        Logger.info("Starting Discord bot...");
        try {
            await this.login(Config.DISCORD_TOKEN);

            await this.loadCommands();
            await this.loadHandlers();
            await this.loadRepeater();

            this.registerCommands();
        } catch (error) {
            Logger.error("Failed starting Discord bot.");
            Logger.error(error);
        }
    }

    private createClient() {
        Logger.info("Making Discord bot client...");

        try {
            const client = new Client(this.options);
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
        const commandsPath = path.join(__dirname, "../commands");
        const commandFiles = fs
            .readdirSync(commandsPath)
            .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

        for (const file of commandFiles) {
            try {
                Logger.info(`Loading [${file}] command...`);
                const filePath = path.join(commandsPath, file);
                const command = new (await import(filePath)).default();
                this.commands.set(command.data.name, command);
                loadedCommandsCount++;
                Logger.info(
                    `Successfully Loaded [${command.data.name}] command.`
                );
            } catch (error) {
                Logger.error(`Failed loading [${file}] command.`);
                Logger.error(error);
            }
        }

        if (!loadedCommandsCount) Logger.warn("There is no commands.");
        else Logger.info(`Successfully Loaded ${this.commands.size} commands.`);
    }

    private async loadHandlers() {
        Logger.info("Loading handlers...");
        let loadedHandlersCount: number = 0;
        const handlersPath = path.join(__dirname, "../handlers");
        const handlerFiles = fs
            .readdirSync(handlersPath)
            .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

        for (const file of handlerFiles) {
            try {
                Logger.info(`Loading [${file}] handler...`);
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
                Logger.info(`Successfully loaded [${handler.name}] handlers.`);
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

    private async loadRepeater() {
        Logger.info("Loading repeater...");
        let loadedRepeaterCount: number = 0;
        const repeaterPath = path.join(__dirname, "../repeaters");
        const repeaterFiles = fs
            .readdirSync(repeaterPath)
            .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

        for (const file of repeaterFiles) {
            try {
                Logger.info(`Loading [${file}] repeater...`);
                const filePath = path.join(repeaterPath, file);
                const repeater = new (await import(filePath)).default();
                const interval = setInterval(
                    () => repeater.execute(),
                    repeater.ms
                );
                this.repeaters.set(repeater, interval);
                loadedRepeaterCount++;
                Logger.info(`Successfully loaded [${repeater.name}] repeater.`);
            } catch (error) {
                Logger.error(`Failed Loading [${file}] repeater.`);
                Logger.error(error);
            }
        }

        if (!loadedRepeaterCount) Logger.warn("There is no repeaters.");
        else
            Logger.info(`Successfully loaded ${loadedRepeaterCount} handlers.`);
    }
}
