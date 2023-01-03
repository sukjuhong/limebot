import { Client, Events } from "discord.js";
import Handler from "../interfaces/Handler";
import Logger from "../utills/Logger";

export default class ClientReadyHandler implements Handler {
    name: string;
    once: boolean;

    constructor() {
        this.name = Events.ClientReady;
        this.once = true;
    }

    public execute(client: Client): void {
        Logger.info(`Logged in as ${client.user.tag}`);
    }
}
