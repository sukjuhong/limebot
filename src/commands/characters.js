import axios from "axios";
import * as dotenv from "dotenv";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
dotenv.config();


axios.defaults.baseURL = "https://developer-lostark.game.onstove.com"

export default {
    data: new SlashCommandBuilder()
        .setName("characters")
        .setDescription("주어진 이름의 캐릭터 정보를 불러옵니다.")
        .addStringOption(option =>
            option.setName("name")
                .setDescription("특정 캐릭터 이름을 적어주세요.")
                .setRequired(true)
        ),
    async execute(interaction) {
        const response = await axios({
            method: "get",
            url: "/characters/행당동떡볶이/siblings",
            headers: {
                accept: "application/json",
                authorization: `bearer ${process.env.LOSTARK_API_KEY}`
            }
        });
        const targetName = interaction.options.getString("name");
        const targetCharacter = response.data.filter(character => character.CharacterName === targetName)[0];
        const embed = new EmbedBuilder()
            .setTitle(targetCharacter.CharacterName)
            .setDescription(targetCharacter.ServerName)
            .setFields([
                { name: "직업", value: targetCharacter.CharacterClassName, inline: true },
                { name: "캐릭터 레벨", value: targetCharacter.CharacterLevel.toString(), inline: true },
                { name: "아이템 레벨", value: targetCharacter.ItemAvgLevel, inline: true }
            ]);
        interaction.reply({ embeds: [embed] });
    }
};