import { GatewayIntentBits } from "discord.js";
import * as dotenv from "dotenv";
dotenv.config();

export default {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN || "",
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || "",

    LIME_PARTY_GUILD_ID: "352739258341261313",
    LIME_PARTY_NOTICE_CHANNEL: "1056755319394541669",
    LIME_PARTY_CREATING_CHANNEL_ID: "1056503370782883860",
    LIME_PARTY_CREATING_CHAANEL_CATEGOTY_ID: "1056753365771632650",
};
