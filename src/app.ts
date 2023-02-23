import ClientManager from "./structures/ClientManager";
import { GatewayIntentBits } from "discord.js";

const clientManager = ClientManager.getInstance();
clientManager.init({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});
