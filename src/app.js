import { Client, GatewayIntentBits, Collection } from "discord.js";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "url";
import { registerCommands } from "./deploy-commands.js";
import * as dotenv from "dotenv";
dotenv.config();

registerCommands(
    process.env.DISCORD_TOKEN,
    process.env.DISCORD_CLIENT_ID,
    process.env.DISCORD_GUILD_ID
);

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.commands = new Collection();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = (await import(filePath)).default;
    client.commands.set(command.data.name, command);
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = (await import(filePath)).default;
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.login(process.env.DISCORD_TOKEN);
