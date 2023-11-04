import {
  ChannelType,
  ClientEvents,
  Events,
  VoiceChannel,
  VoiceState,
} from "discord.js";

import Handler from "../interfaces/Handler";
import prisma from "../utils/db";
import { logger } from "../utils/logger";

export default class VoiceStateUpdateHandler implements Handler {
  name: keyof ClientEvents = Events.VoiceStateUpdate;
  once: Boolean = false;
  createdChannelsMap: Map<String, VoiceChannel> = new Map<
    String,
    VoiceChannel
  >();

  public async execute(oldState: VoiceState, newState: VoiceState) {
    const guild = oldState.guild;
    const guildInDB = await prisma.guild.findUniqueOrThrow({
      where: {
        id: guild.id,
      },
    });

    if (!guildInDB.create_voice_channel_id) {
      return;
    }

    const createChannelId = guildInDB.create_voice_channel_id;

    if (
      this.createdChannelsMap.has(oldState.channelId) &&
      !oldState.channel.members.size
    ) {
      logger.info(
        `Deleted [${oldState.channel.name}] empty voice channel created by creating channel.`
      );
      this.createdChannelsMap.delete(oldState.channelId);
      await oldState.channel.delete();
    }

    if (newState.channelId === createChannelId) {
      const createdChannel = await newState.guild.channels.create({
        name: `🔊 ${
          newState.member.nickname || newState.member.displayName
        } 채널`,
        type: ChannelType.GuildVoice,
        parent: newState.channel.parent,
      });
      logger.info(`Created [${createdChannel.name}] temporary voice channel.`);
      this.createdChannelsMap.set(createdChannel.id, createdChannel);
      await newState.member.voice.setChannel(createdChannel);
    }
  }
}
