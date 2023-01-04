import axios from "axios";
import * as cheerio from "cheerio";
import { EmbedBuilder, TextChannel } from "discord.js";

import Repeater from "../interfaces/Repeater";
import ClientManager from "../structures/ClientManager";
import { config } from "../utills/Config";
import Logger from "../utills/Logger";
import Repository, { keys } from "../utills/Repository";

const LOASTARK_BASE_URL = "https://lostark.game.onstove.com";

interface Notice {
    title: string;
    category: string;
    article: string;
    url: string;
    imgUrl: string;
}

export default class LostarkNoticeRepeater implements Repeater {
    name: string;
    description: string;
    ms: number;
    sentNotices: Array<string>;

    constructor() {
        this.name = "Lostark Notice";
        this.description = "로스트아크 공지를 확인하는 리피터";
        this.ms = 1000 * 60;
        this.sentNotices =
            (Repository.read(keys.LOSTARK_SENT_NOTICES) as Array<string>) ??
            new Array<string>();
    }

    private async parseUnsentNotices(): Promise<Array<Notice>> {
        const url = LOASTARK_BASE_URL + "/News/Notice/List";
        const notices: Array<Notice> = [];

        try {
            Logger.info(`GET: ${url} using axios in [${this.name}] repeater.`);
            const res = await axios.get(
                LOASTARK_BASE_URL + "/News/Notice/List"
            );
            const $ = cheerio.load(res.data);
            const noticeElements = $(
                ".list li:not(.list__item--notice) a"
            ).toArray();

            for (const noticeElement of noticeElements.reverse()) {
                const notice: Notice = {
                    title: "",
                    category: "",
                    article: "",
                    url: "",
                    imgUrl: "",
                };

                notice.title = $(noticeElement).find(".list__title").text();
                notice.category = $(noticeElement)
                    .find(".list__category .icon")
                    .text();
                notice.url = LOASTARK_BASE_URL + noticeElement.attribs.href;

                if (this.sentNotices.includes(notice.title)) continue;
                if (this.sentNotices.length > 30) this.sentNotices.shift();
                this.sentNotices.push(notice.title);
                Repository.write(keys.LOSTARK_SENT_NOTICES, this.sentNotices);

                Logger.info(
                    `GET: ${notice.url} using axios in [${this.name}].`
                );
                const sub_res = await axios.get(notice.url);
                const sub_$ = cheerio.load(sub_res.data);
                const articleElements = sub_$(".fr-view").children().toArray();
                notice.imgUrl =
                    sub_$(".fr-view .editor__pc-only img")?.attr("src") ?? "";
                notice.imgUrl = notice.imgUrl ? "http:" + notice.imgUrl : "";

                for (const articleElement of articleElements) {
                    if (articleElement.tagName === "hr") break;
                    if (notice.article.length > 100) {
                        notice.article += "...";
                        break;
                    }

                    const articleDatum = sub_$(articleElement).text().trim();

                    if (!articleDatum) continue;

                    notice.article += articleDatum + "\n";
                }
                notices.push(notice);
            }
        } catch (error) {
            Logger.error(`Failed to parse data in [${this.name}] repeater.`);
            Logger.error(error);
        }

        return notices;
    }

    async execute() {
        Logger.info(`Executing [${this.name}] repeater...`);
        const unsentNotices = await this.parseUnsentNotices();

        for (const notice of unsentNotices) {
            try {
                const embed = new EmbedBuilder()
                    .setTitle(notice.title)
                    .setFields([{ name: "카테고리", value: notice.category }])
                    .setURL(notice.url)
                    .setThumbnail(
                        "https://cdn-lostark.game.onstove.com/2018/obt/assets/images/pc/layout/logo_o.png?98a1a7c82ce9d71f950ad4cde8e4c9b0"
                    )
                    .setFooter({ text: "로스트아크 소식" });

                if (notice.article) console.log(notice.article);
                console.log(!notice.article);
                embed.addFields([
                    {
                        name: "내용",
                        value: `\`\`\`${notice.article}\`\`\``,
                    },
                ]);

                if (notice.imgUrl) embed.setImage(notice.imgUrl);

                const noticeChannel =
                    (await ClientManager.client.channels.fetch(
                        config.LIME_PARTY_NOTICE_CHANNEL
                    )) as TextChannel;
                await noticeChannel.send({ embeds: [embed] });
            } catch (error) {
                Logger.error(`Failed to execute [${this.name}] repeater.`);
                Logger.error(error);
            }
        }
    }
}
