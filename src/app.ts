import { Client, GatewayIntentBits } from "discord.js";
import { ClientManager } from "./core/ClientManager";

export const clientManager = new ClientManager(
  new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  })
);
