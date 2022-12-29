import axios from "axios";
import * as dotenv from "dotenv";
import { SlashCommandBuilder, EmbedBuilder, moveElementInArray } from "discord.js";
dotenv.config();

const extractStringInHtmlTags = (text) => text.replace(/<[^>]+>/g, "");

const statsToString = (stats) => {
    const neededStats = ["치명", "특화", "제압", "신속", "인내", "숙련"];

    let ret = "";
    stats.forEach((stat) => {
        if (neededStats.includes(stat.Type)) ret += `${stat.Type}: ${stat.Value}\n`;
    });
    return ret;
};

const equipmentsToString = (equipments, accesories = false) => {
    const neededEquipment = ["무기", "투구", "상의", "하의", "장갑", "어깨"];
    const neededAccesories = ["목걸이", "귀걸이", "반지"];

    let ret = "";
    equipments.forEach((equipment) => {
        const needed = accesories ? neededAccesories : neededEquipment;
        if (needed.includes(equipment.Type))
            ret += `${equipment.Type}: ${equipment.Name} (${equipment.Grade}) 품${
                JSON.parse(equipment.Tooltip).Element_001.value.qualityValue
            }\n`;
    });
    return ret;
};

const engravingsToString = (effects) => {
    let ret = "";
    effects.forEach((effect) => {
        ret += effect.Name + "\n";
    });
    return ret;
};

const gemsToString = (gems, effects) => {
    let ret = "";

    for (let slot = 0; slot < 11; slot++) {
        const gem = gems.filter((gem) => gem.Slot === slot)[0];
        const effect = effects.filter((effect) => effect.GemSlot === slot)[0];

        if (!gem || !effect) continue;

        ret += `${extractStringInHtmlTags(gem.Name)} - ${effect.Name}\n`;
    }
    return ret;
};

const cardsToString = (effects) => {
    let ret = "";

    effects.forEach((effect) => {
        effect.Items.forEach((item) => {
            ret += `${item.Name} - ${item.Description}\n`;
        });
    });
    return ret;
};

export default {
    data: new SlashCommandBuilder()
        .setName("characters")
        .setDescription("주어진 이름의 캐릭터 정보를 불러옵니다.")
        .addStringOption((option) =>
            option.setName("name").setDescription("특정 캐릭터 이름을 적어주세요.").setRequired(true)
        ),
    async execute(interaction) {
        const targetName = interaction.options.getString("name");
        let response = await axios({
            method: "get",
            url: `https://developer-lostark.game.onstove.com/armories/characters/${targetName}/profiles`,
            headers: {
                accept: "application/json",
                authorization: `bearer ${process.env.LOSTARK_API_KEY}`,
            },
        });
        if (response.data === null) await interaction.reply("없는 캐릭터입니다.");

        const profile = response.data;

        response = await axios({
            method: "get",
            url: `https://developer-lostark.game.onstove.com/armories/characters/${targetName}/equipment`,
            headers: {
                accept: "application/json",
                authorization: `bearer ${process.env.LOSTARK_API_KEY}`,
            },
        });
        const equipment = response.data;

        response = await axios({
            method: "get",
            url: `https://developer-lostark.game.onstove.com/armories/characters/${targetName}/engravings`,
            headers: {
                accept: "application/json",
                authorization: `bearer ${process.env.LOSTARK_API_KEY}`,
            },
        });
        const engravings = response.data;

        response = await axios({
            method: "get",
            url: `https://developer-lostark.game.onstove.com/armories/characters/${targetName}/gems`,
            headers: {
                accept: "application/json",
                authorization: `bearer ${process.env.LOSTARK_API_KEY}`,
            },
        });
        const gems = response.data;

        response = await axios({
            method: "get",
            url: `https://developer-lostark.game.onstove.com/armories/characters/${targetName}/cards`,
            headers: {
                accept: "application/json",
                authorization: `bearer ${process.env.LOSTARK_API_KEY}`,
            },
        });
        const cards = response.data;

        const model = {
            image: profile.CharacterImage,
            server: profile.ServerName,
            name: profile.CharacterName,
            class: profile.CharacterClassName,
            characterLevel: profile.CharacterLevel.toString(),
            ItemLevel: profile.ItemAvgLevel,
            expeditionLevel: profile.ExpeditionLevel.toString(),
            stat: statsToString(profile.Stats),
            equipment: equipmentsToString(equipment),
            equipment_accessories: equipmentsToString(equipment, true),
            engravings: engravingsToString(engravings.Effects),
            gems: gemsToString(gems.Gems, gems.Effects),
            cards: cardsToString(cards.Effects),
        };
        console.log(model);

        const embed = new EmbedBuilder()
            .setTitle(model.name)
            .setThumbnail(model.image)
            .addFields([
                {
                    name: "서버",
                    value: model.server,
                },

                {
                    name: "직업",
                    value: model.class,
                },

                {
                    name: "원정대 레벨",
                    value: model.expeditionLevel,
                    inline: true,
                },
                {
                    name: "캐릭터 레벨",
                    value: model.characterLevel,
                    inline: true,
                },
                { name: "아이템 레벨", value: model.ItemLevel, inline: true },

                { name: "스탯", value: model.stat, inline: true },
                { name: "각인", value: model.engravings, inline: true },

                { name: "장비", value: model.equipment },
                {
                    name: "장신구",
                    value: model.equipment_accessories,
                },
                { name: "보석", value: model.gems },
                { name: "카드", value: model.cards },
            ]);
        await interaction.reply({ embeds: [embed] });
    },
};
