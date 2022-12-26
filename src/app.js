import { Client, Events, GatewayIntentBits, Collection, ChannelType } from "discord.js";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

client.commands = new Collection();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = (await import(filePath)).default;
    client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

const CREATING_VOICE_CHANNEL_ID = "1042115849630269443";
const CATEGORY_ID = "1042115849630269441";
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    if (newState.channelId !== CREATING_VOICE_CHANNEL_ID) return;

    const createdChannel = await newState.guild.channels.create({
        name: "TEST",
        type: ChannelType.GuildVoice,
        parent: CATEGORY_ID
    });

    newState.member.voice.setChannel(createdChannel);
})

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);
