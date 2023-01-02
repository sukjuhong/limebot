import { GatewayIntentBits } from "discord.js";
import Config from "./utills/Config.js";
import ClientManager from "./structures/ClientManager.js";

const cm = ClientManager.getInstance();

cm.init({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});
