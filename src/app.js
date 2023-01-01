import MyClient from "./structures/MyClient.js";
import { DISCORD_TOKEN } from "./config.js";

const client = new MyClient();
client.init(DISCORD_TOKEN);
