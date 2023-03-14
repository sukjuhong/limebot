import {
    SlashCommandBuilder,
    ComponentType,
    ChatInputCommandInteraction,
    Collection,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Events,
} from "discord.js";
import Command from "../interfaces/Command";
import Repeater from "../interfaces/Repeater";
import ClientManager from "../structures/ClientManager";
import logger from "../utills/Logger";

const clientManager = ClientManager.getInstance();

export default class RepeaterCommand implements Command {
    data: SlashCommandBuilder;
    repeaters: Map<string, Repeater>;

    constructor() {
        this.data = new SlashCommandBuilder()
            .setName("repeater")
            .setDescription("리피터를 설정할 수 있습니다.");
        this.repeaters = clientManager.repeaters;
    }

    async execute(interaction: ChatInputCommandInteraction) {
        const options = [];
        this.repeaters.forEach((repeater) => {
            options.push({
                label: `${repeater.on ? "🟢" : "🔴"} ${repeater.name}`,
                description: repeater.description,
                value: repeater.name,
            });
        });
        const selectMenu =
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("repeater_select")
                    .setPlaceholder("리피터 목록")
                    .setOptions(options)
            );
        const selectResponse = await interaction.reply({
            content: "리피터 현황입니다.",
            components: [selectMenu],
            ephemeral: true,
        });

        const selectCollector = selectResponse.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 1000 * 60,
        });
        selectCollector.once("collect", async (interaction) => {
            if (
                interaction.customId === "repeater_select" &&
                interaction.user.id === interaction.user.id
            ) {
                const repeater = clientManager.repeaters.get(
                    interaction.values[0]
                );
                const repeaterButton =
                    new ActionRowBuilder<ButtonBuilder>().addComponents([
                        new ButtonBuilder()
                            .setCustomId("repeater_on_button")
                            .setLabel("켜기")
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(repeater.on),
                        new ButtonBuilder()
                            .setCustomId("repeater_off_button")
                            .setLabel("끄기")
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(!repeater.on),
                    ]);

                const embed = new EmbedBuilder()
                    .setTitle(repeater.name)
                    .setFields([
                        {
                            name: "반복 간격",
                            value: `${repeater.ms}ms`,
                        },
                        {
                            name: "설명",
                            value: `${repeater.description}`,
                        },
                    ]);
                const buttonResponse = await interaction.update({
                    content: "",
                    embeds: [embed],
                    components: [repeaterButton],
                });

                const buttonCollector =
                    buttonResponse.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        time: 1000 * 60,
                    });
                buttonCollector.once("collect", (interaction) => {
                    if (
                        interaction.customId === "repeater_on_button" &&
                        interaction.user.id === interaction.user.id
                    ) {
                        repeater.timer = setInterval(
                            () => repeater.execute(),
                            repeater.ms
                        );
                        repeater.on = true;
                        logger.info(
                            `Turned on [${repeater.name}] repeater by [${interaction.user.username}]`
                        );
                    } else if (
                        interaction.customId === "repeater_off_button" &&
                        interaction.user.id === interaction.user.id
                    ) {
                        clearInterval(repeater.timer);
                        repeater.on = false;
                        logger.info(
                            `Turned off [${repeater.name}] repeater by [${interaction.user.username}]`
                        );
                    }
                    interaction.update({
                        content: `${repeater.name}가 ${
                            repeater.on ? "켜졌습니다." : "꺼졌습니다."
                        }`,
                        embeds: [],
                        components: [],
                    });
                });
            }
        });
    }
}
