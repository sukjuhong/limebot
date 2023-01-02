import { Client } from "discord.js";

export default interface Handler {
    name: string;
    once: boolean;

    execute(...args: any[]): void | Promise<void>;
}
