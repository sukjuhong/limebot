import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    CacheType,
    Events,
    VoiceChannel,
    DiscordAPIError,
} from "discord.js";
import VoiceStateUpdateHandler from "../handlers/VoiceStateUpdateHandler";
import Command from "../interfaces/Command";
import ClientManager from "../structures/ClientManager";
import logger from "../utills/Logger";

const clientManager = ClientManager.getInstance();

export default class SetCreatingChannelCommand implements Command {
    data: Pick<SlashCommandBuilder, "toJSON" | "name" | "description">;

    constructor() {
        this.data = new SlashCommandBuilder()
            .setName("set_creating_channel")
            .setDescription(
                "보이스 채널을 자동으로 만들어주는 채널을 설정할 수 있습니다."
            )
            .addStringOption((option) =>
                option
                    .setName("channel_id")
                    .setDescription(
                        "생성 채널로 만들 음성 채널의 ID를 적어주세요."
                    )
                    .setRequired(true)
            );
    }

    async execute(
        interaction: ChatInputCommandInteraction<CacheType>
    ): Promise<void> {
        try {
            const creatingChannelId =
                interaction.options.getString("channel_id");
            const creatingChannel = await interaction.guild.channels.fetch(
                creatingChannelId
            );

            if (!creatingChannel.isVoiceBased()) {
                interaction.reply("해당 채널은 음성 채널이 아닙니다.");
                return;
            }

            const handler = clientManager.handlers.get(
                Events.VoiceStateUpdate
            ) as VoiceStateUpdateHandler;
            handler.creatingChannel = creatingChannel as VoiceChannel;
            logger.info(
                `[${creatingChannelId}] Channel is set as the creating channel by [${interaction.user.username}]`
            );
            interaction.reply(
                `[${creatingChannelId}] 채널이 생성 채널로 설정되었습니다.`
            );
        } catch (error) {
            if (error instanceof DiscordAPIError) {
                interaction.reply("해당 채널은 없는 채널입니다.");
            }
        }
    }
}
