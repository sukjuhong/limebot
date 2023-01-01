import { Events } from "discord.js";
import logger from "../logger.js";
import { DISCORD_TOKEN, DISCORD_CLIENT_ID } from "../config.js";

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        logger.info(`Logged in as ${client.user.tag}`);

        client.registerCommands(DISCORD_TOKEN, DISCORD_CLIENT_ID);
    },
};
