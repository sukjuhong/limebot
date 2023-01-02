import Handler from "../structures/Handler.js";
import {
    VoiceState,
    Events,
    VoiceChannel,
    VoiceBasedChannel,
    ChannelType,
} from "discord.js";
import Logger from "../utills/Logger.js";
import ClientManager from "../structures/ClientManager.js";
import Config from "../utills/Config.js";

export default class VoiceStateUpdateHandler implements Handler {
    name: string = Events.VoiceStateUpdate;
    once: boolean = false;

    creatingChannel: VoiceChannel;
    createdChannelsMap: Map<string, VoiceBasedChannel>;

    constructor() {
        this.setCreatingChannel(Config.LIME_PARTY_CREATING_CHANNEL_ID);
        this.createdChannelsMap = new Map<string, VoiceBasedChannel>();
    }

    private async setCreatingChannel(channelId) {
        const cm = ClientManager.getInstance();
        const creatingChannel = (await cm.client.channels.fetch(
            channelId
        )) as VoiceChannel;
        this.creatingChannel = creatingChannel;
    }

    public async execute(oldState: VoiceState, newState: VoiceState) {
        if (
            oldState.channelId !== this.creatingChannel.id &&
            this.createdChannelsMap.has(oldState.channelId) &&
            !oldState.channel.members.size
        ) {
            Logger.info(
                `Deleted empty voice channel ${oldState.channel.name} created by creating channel.`
            );
            this.createdChannelsMap.delete(oldState.channelId);
            await oldState.channel.delete();
        }

        if (newState.channelId === this.creatingChannel.id) {
            const createdChannel = await newState.guild.channels.create({
                name: `${newState.member.nickname} 채널`,
                type: ChannelType.GuildVoice,
                parent: process.env.CREATING_VOICE_CHANNEL_CATEGORY_ID,
            });
            Logger.info(
                `Creating temporary voice channel [${createdChannel.name}]. `
            );
            this.createdChannelsMap.set(createdChannel.id, createdChannel);
            await newState.member.voice.setChannel(createdChannel);
        }
    }
}
