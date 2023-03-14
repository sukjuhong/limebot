import axios from "axios";
import * as cheerio from "cheerio";
import { EmbedBuilder, TextChannel } from "discord.js";

import Repeater from "../../interfaces/Repeater";
import ClientManager from "../../structures/ClientManager";
import { DISCORD_NOTICE_CHANNEL } from "../../utills/Config";
import logger from "../../utills/Logger";
import Repository, { keys } from "../../utills/Repository";

const LOASTARK_BASE_URL = "https://lostark.game.onstove.com";

interface Notice {
    title: string;
    category: string;
    article: string;
    url: string;
    imgUrl: string;
}

const clientManager = ClientManager.getInstance();
const repository = Repository.getInstance();

export default class LostarkNoticeRepeater implements Repeater {
    name: string;
    description: string;
    ms: number;
    on: boolean;
    timer: NodeJS.Timer;
    sentNotices: Array<string>;

    constructor() {
        this.name = "Lostark Notice";
        this.description = "로스트아크 공지를 확인하는 리피터";
        this.ms = 1000 * 60;
        this.on = true;
        this.timer = null;
        this.sentNotices =
            (repository.read(keys.LOSTARK_SENT_NOTICES) as Array<string>) ??
            new Array<string>();
    }

    private async parseUnsentNotices(): Promise<Array<Notice>> {
        const url = LOASTARK_BASE_URL + "/News/Notice/List";
        const notices: Array<Notice> = [];

        try {
            logger.info(`GET: ${url} in [${this.name}] repeater.`);
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
                repository.write(keys.LOSTARK_SENT_NOTICES, this.sentNotices);

                logger.info(
                    `GET: ${notice.url} using axios in [${this.name}].`
                );
                const sub_res = await axios.get(notice.url);
                const sub_$ = cheerio.load(sub_res.data);
                const articleElements = sub_$(".fr-view *");
                notice.imgUrl =
                    sub_$(".fr-view .editor__pc-only img")?.attr("src") ?? "";
                notice.imgUrl = notice.imgUrl ? "http:" + notice.imgUrl : "";

                for (const articleElement of articleElements) {
                    let articleDatum = "";
                    for (const articleChildElement of articleElement.childNodes) {
                        if (articleChildElement.type === "text") {
                            const parent =
                                articleChildElement.parent as cheerio.Element;
                            if (
                                parent.name === "li" &&
                                (parent.parent?.parent as cheerio.Element)
                                    .name === "li"
                            ) {
                                articleDatum += "\t\t* ";
                            } else if (parent.name === "li") {
                                articleDatum += "\t* ";
                            }
                            articleDatum += articleChildElement.data.trim();
                        }
                    }

                    if (
                        articleDatum &&
                        notice.article.length + articleDatum.length < 500
                    )
                        notice.article += articleDatum + "\n";
                }

                notices.push(notice);
            }
        } catch (error) {
            logger.error(
                `Failed to parse data in [${this.name}] repeater.`,
                error
            );
        }

        return notices;
    }

    async execute() {
        logger.info(`Executing [${this.name}] repeater...`);
        const unsentNotices = await this.parseUnsentNotices();

        for (const notice of unsentNotices) {
            const embed = new EmbedBuilder()
                .setTitle(notice.title)
                .setFields([{ name: "카테고리", value: notice.category }])
                .setURL(notice.url)
                .setThumbnail(
                    "https://cdn-lostark.game.onstove.com/2018/obt/assets/images/pc/layout/logo_o.png?98a1a7c82ce9d71f950ad4cde8e4c9b0"
                )
                .setFooter({ text: "로스트아크 소식" });

            embed.addFields([
                {
                    name: "내용",
                    value: `\`\`\`${notice.article}\`\`\``,
                },
            ]);

            if (notice.imgUrl) embed.setImage(notice.imgUrl);

            const noticeChannel = clientManager.client.channels.fetch(DISCORD_NOTICE_CHANNEL);
            if (noticeChannel instanceof TextChannel)
                await noticeChannel.send({ embeds: [embed] });
            else
                new Error("noticeChannel is not TextChannel.")
        }
    }
}
