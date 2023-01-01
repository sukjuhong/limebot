import { Events, ChannelType } from "discord.js";
import * as dotenv from "dotenv";
dotenv.config();

export default {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        if (
            oldState.channelId !== process.env.CREATING_VOICE_CHANNEL_ID &&
            createdChannels.includes(oldState.channel) &&
            !oldState.channel.members.size
        ) {
            createdChannels.splice(createdChannels.indexOf(oldState.channel));
            oldState.channel.delete();
        }

        if (newState.channelId === process.env.CREATING_VOICE_CHANNEL_ID) {
            const createdChannel = await newState.guild.channels.create({
                name: `채널 ${createdChannels.length + 1}`,
                type: ChannelType.GuildVoice,
                parent: process.env.CREATING_VOICE_CHANNEL_CATEGORY_ID,
            });

            createdChannels.push(createdChannel);

            newState.member.voice.setChannel(createdChannel);
        }
    },
};
