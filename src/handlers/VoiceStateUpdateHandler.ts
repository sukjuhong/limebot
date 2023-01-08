import {
    VoiceState,
    Events,
    VoiceChannel,
    VoiceBasedChannel,
    ChannelType,
} from "discord.js";

import Handler from "../interfaces/Handler";
import Logger from "../utills/Logger";
import ClientManager from "../structures/ClientManager";
import { config } from "../utills/Config";

const clientManager = ClientManager.getInstance();

export default class VoiceStateUpdateHandler implements Handler {
    name: string;
    once: boolean;

    creatingChannel: VoiceChannel;
    createdChannelsMap: Map<string, VoiceBasedChannel>;

    constructor() {
        this.name = Events.VoiceStateUpdate;
        this.once = false;
        this.createdChannelsMap = new Map<string, VoiceBasedChannel>();
    }

    public async execute(oldState: VoiceState, newState: VoiceState) {
        if (!this.creatingChannel)
            this.creatingChannel = (await clientManager.client.channels.fetch(
                config.LIME_PARTY_CREATING_CHANNEL_ID
            )) as VoiceChannel;

        if (
            oldState.channelId !== this.creatingChannel.id &&
            this.createdChannelsMap.has(oldState.channelId) &&
            !oldState.channel.members.size
        ) {
            Logger.info(
                `Deleted [${oldState.channel.name}] empty voice channel created by creating channel.`
            );
            this.createdChannelsMap.delete(oldState.channelId);
            await oldState.channel.delete();
        }

        if (newState.channelId === this.creatingChannel.id) {
            const createdChannel = await newState.guild.channels.create({
                name: `🔊 ${
                    oldState.member.nickname || oldState.member.displayName
                } 채널`,
                type: ChannelType.GuildVoice,
                parent: config.LIME_PARTY_CREATING_CHAANEL_CATEGOTY_ID,
            });
            Logger.info(
                `Created [${createdChannel.name}] temporary voice channel.`
            );
            this.createdChannelsMap.set(createdChannel.id, createdChannel);
            await newState.member.voice.setChannel(createdChannel);
        }
    }
}
