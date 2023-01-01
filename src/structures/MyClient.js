import { Client, GatewayIntentBits, Collection, REST, Routes } from "discord.js";
import logger from "../logger.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class MyClient extends Client {
    constructor() {
        super({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
        });

        this.commands = new Collection();
    }

    init(discordToken) {
        logger.info("Initiating Limebot...");
        this.loadCommands();
        this.loadEvents();
        this.login(discordToken);
    }

    async loadCommands() {
        logger.info("Loading commands...");
        let loadedCommandsCount = 0;
        const commandsPath = path.join(__dirname, "../commands");
        const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = (await import(filePath)).default;
            this.commands.set(command.data.name, command);
            logger.info(`Successfully Loaded [${command.data.name}] command.`);
            loadedCommandsCount++;
        }

        if (!loadedCommandsCount) logger.warn("There is no commands.");
        else logger.info(`Successfully Loaded ${this.commands.size} commands.`);
    }

    async loadEvents() {
        logger.info("Loading Events...");
        let loadedEventsCount = 0;
        const eventsPath = path.join(__dirname, "../events");
        const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));

        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            const event = (await import(filePath)).default;
            if (event.once) {
                this.once(event.name, (...args) => event.execute(...args));
            } else {
                this.on(event.name, (...args) => event.execute(...args));
            }
            logger.info(`Successfully loaded [${event.name}] Event.`);
            loadedEventsCount++;
        }

        if (!loadedEventsCount) logger.warn("There is no events");
        else logger.info(`Successfully loaded ${loadedEventsCount} events.`);
    }

    async registerCommands(discordToken, discordClientId) {
        const rest = new REST({ version: "10" }).setToken(discordToken);

        try {
            logger.info("Registering commands...");

            if (!this.commands.size) {
                logger.warn("There is no commands for registering.");
                return;
            }

            const guildsMap = await this.guilds.fetch();
            for (const guildId of guildsMap.keys()) {
                const data = await rest.put(Routes.applicationGuildCommands(discordClientId, guildId), {
                    body: this.commands,
                });
                logger.info(
                    `Successfully registering ${data.length} commands to [${guildsMap.get(guildId).name}] guild.`
                );
            }
        } catch (error) {
            logger.error("Failed registering commands.");
            logger.error(error);
        }
    }
}
