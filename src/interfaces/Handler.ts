import { ClientEvents } from "discord.js";

export default interface Handler {
  name: keyof ClientEvents;
  once: Boolean;

  execute(...args: any[]): void | Promise<void>;
}
