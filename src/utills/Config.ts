import { GatewayIntentBits } from "discord.js";
import * as dotenv from "dotenv";
dotenv.config();

class Config {
    static DISCORD_TOKEN: string = process.env.DISCORD_TOKEN || "";
    static DISCORD_CLIENT_ID: string = process.env.DISCORD_CLIENT_ID || "";

    static LIME_PARTY_GUILD_ID = "352739258341261313";
    static LIME_PARTY_CREATING_CHANNEL_ID = "1056503370782883860";
    static LIME_PARTY_CREATING_CHAANEL_CATEGOTY_ID = "1056753365771632650";
}

export default Config;
