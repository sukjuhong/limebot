import axios from "axios";
import * as cheerio from "cheerio";
import { EmbedBuilder, TextChannel } from "discord.js";

import Repeater from "../../interfaces/Repeater";
import ClientManager from "../../structures/ClientManager";
import { DISCORD_NOTICE_CHANNEL_ID } from "../../utills/Config";
import logger from "../../utills/Logger";
import Repository, { keys } from "../../utills/Repository";

interface Notice {
    title: string;
    category: string;
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

    private async parseNotices(): Promise<Array<Notice>> {
        const baseUrl = "https://lostark.game.onstove.com";
        const url = baseUrl + "/News/Notice/List";
        const notices = new Array<Notice>();

        const res = await axios.get(baseUrl + "/News/Notice/List");
        const $ = cheerio.load(res.data);
        const noticeElements = $(
            ".list li:not(.list__item--notice) a"
        ).toArray();

        for (const noticeElement of noticeElements.reverse()) {
            const title = $(noticeElement).find(".list__title").text();
            const category = $(noticeElement)
                .find(".list__category .icon")
                .text();
            const url = baseUrl + noticeElement.attribs.href;

            const sub_res = await axios.get(url);
            const sub_$ = cheerio.load(sub_res.data);
            let imgUrl =
                sub_$(".fr-view .editor__pc-only img")?.attr("src");
            imgUrl = imgUrl ? "http:" + imgUrl : "";

            notices.push({
                title,
                category,
                url,
                imgUrl
            });
        }

        return notices;
    }

    async execute() {
        logger.info(`Executing [${this.name}] repeater...`);
        const notices = await this.parseNotices();

        for (const notice of notices) {
            if (this.sentNotices.includes(notice.title)) continue;

            if (this.sentNotices.length > 30) this.sentNotices.shift();
            this.sentNotices.push(notice.title);
            repository.write(keys.LOSTARK_SENT_NOTICES, this.sentNotices);

            const embed = new EmbedBuilder()
                .setTitle(notice.title)
                .setDescription(notice.category)
                .setURL(notice.url)
                .setThumbnail(
                    "https://cdn-lostark.game.onstove.com/2018/obt/assets/images/pc/layout/logo_o.png?98a1a7c82ce9d71f950ad4cde8e4c9b0"
                )
                .setFooter({ text: "로스트아크 소식" });
            if (notice.imgUrl) embed.setImage(notice.imgUrl);

            const noticeChannel = await clientManager.client.channels.fetch(
                DISCORD_NOTICE_CHANNEL_ID
            );
            if (noticeChannel instanceof TextChannel)
                noticeChannel.send({ embeds: [embed] });
        }
    }
}
