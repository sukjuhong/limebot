import * as dotenv from "dotenv";
dotenv.config();

export const config = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN || "",
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || "",

    LIME_PARTY_GUILD_ID: process.env.LIME_PARTY_GUILD_ID || "",
    LIME_PARTY_NOTICE_CHANNEL: process.env.LIME_PARTY_NOTICE_CHANNEL || "",
    LIME_PARTY_CREATING_CHANNEL_ID:
        process.env.LIME_PARTY_CREATING_CHANNEL_ID || "",
    LIME_PARTY_CREATING_CHAANEL_CATEGOTY_ID:
        process.env.LIME_PARTY_CREATING_CHAANEL_CATEGOTY_ID || "",
};
