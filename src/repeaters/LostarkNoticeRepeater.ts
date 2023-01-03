import axios from "axios";
import * as cheerio from "cheerio";
import { Collection, EmbedBuilder, TextChannel } from "discord.js";
import Repeater from "../interfaces/Repeater";
import ClientManager from "../structures/ClientManager";
import config from "../utills/Config";
import Logger from "../utills/Logger";

const LOASTARK_BASE_URL = "https://lostark.game.onstove.com";

export default class LostarkNoticeRepeater implements Repeater {
    name: string;
    description: string;
    ms: number;
    sendedNotices: Array<string>;

    constructor() {
        this.name = "Lostark Notice";
        this.description = "로스트아크 공지를 확인하는 리피터";
        this.ms = 1000 * 60;
        this.sendedNotices = [];
    }

    async execute() {
        const cm = ClientManager.getInstance();
        const res = await axios.get(LOASTARK_BASE_URL + "/News/Notice/List");
        const $ = cheerio.load(res.data);
        const notices = $(".list li:not(.list__item--notice) a").toArray();

        for (const notice of notices.reverse()) {
            const title = $(notice).find(".list__title").text();
            const category = $(notice).find(".list__category .icon").text();
            const uri = notice.attribs.href;

            if (this.sendedNotices.includes(title)) return;

            this.sendedNotices.push(title);

            const res_child = await axios.get(LOASTARK_BASE_URL + uri);
            const sub_$ = cheerio.load(res_child.data);
            const articleData = sub_$(".fr-view").children().toArray();
            let article = "";
            let imgUrl =
                sub_$(articleData).find(".editor__pc-only img").attr()?.src ??
                "";

            for (const data of articleData) {
                if (data.tagName === "hr") break;
                if (article.length > 100) {
                    article += "...";
                    break;
                }

                const dataText = sub_$(data).text().trim();

                if (!dataText) continue;

                article += dataText + "\n";
            }

            try {
                const embed = new EmbedBuilder()
                    .setTitle(title)
                    .setFields([{ name: "카테고리", value: category }])
                    .setURL(LOASTARK_BASE_URL + uri)
                    .setThumbnail(
                        "https://cdn-lostark.game.onstove.com/2018/obt/assets/images/pc/layout/logo_o.png?98a1a7c82ce9d71f950ad4cde8e4c9b0"
                    )
                    .setFooter({ text: "로스트아크 소식" });

                if (article)
                    embed.addFields([
                        {
                            name: "내용",
                            value: `\`\`\`${article}\`\`\``,
                        },
                    ]);

                if (imgUrl) embed.setImage("https:" + imgUrl);

                const noticeChannel = (await cm.client.channels.fetch(
                    config.LIME_PARTY_NOTICE_CHANNEL
                )) as TextChannel;
                await noticeChannel.send({ embeds: [embed] });
            } catch (error) {
                Logger.error(error);
            }
        }
    }
}
