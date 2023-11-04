import {
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  CacheType,
  ChannelType,
  VoiceChannel,
} from "discord.js";
import Command from "../interfaces/Command";
import prisma from "../utils/db";
import { logger } from "../utils/logger";

export default class SetCreateVoiceChannelCommand implements Command {
  private readonly CREATE_VOICE_CHANNEL = "create-voice-channel";

  data = new SlashCommandBuilder()
    .setName("set-create-voice-channel")
    .setDescription("보이스 채널을 생성하는 채널을 설정합니다.")
    .addChannelOption((option) =>
      option
        .setName(this.CREATE_VOICE_CHANNEL)
        .setDescription("보이스 채널을 생성 할 채널")
        .setRequired(true)
    );

  async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    const createVoiceChannel = interaction.options.getChannel(
      this.CREATE_VOICE_CHANNEL,
      true,
      [ChannelType.GuildVoice]
    );

    await prisma.guild.update({
      where: {
        id: createVoiceChannel.guildId,
      },
      data: {
        create_voice_channel_id: createVoiceChannel.id,
      },
    });
    logger.info(
      `Set [${createVoiceChannel.guild.name}]'s create-voice-channel to [${createVoiceChannel.name}]`
    );

    await interaction.reply(
      `보이스 채널 생성 채널이 [${createVoiceChannel.name}]으로 설정되었습니다.`
    );
  }
}
