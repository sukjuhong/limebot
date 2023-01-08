import ClientManager from "./structures/ClientManager";
import { GatewayIntentBits } from "discord.js";

const clientManager = ClientManager.getInstance();
clientManager.setOptions({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});
clientManager.init();
