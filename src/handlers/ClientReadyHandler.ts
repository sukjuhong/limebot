import { Client, Events } from "discord.js";
import Handler from "../structures/Handler.js";
import Logger from "../utills/Logger.js";

export default class ClientReadyHandler implements Handler {
    name: string = Events.ClientReady;
    once: boolean = true;

    public execute(client: Client): void {
        Logger.info(`Logged in as ${client.user.tag}`);
    }
}
