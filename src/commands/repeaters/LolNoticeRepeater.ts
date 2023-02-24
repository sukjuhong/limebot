import axios from "axios";
import * as cheerio from "cheerio";

import Logger from "../../utills/Logger";
import Repeater from "../../interfaces/Repeater";
import { EmbedBuilder } from "@discordjs/builders";
import ClientManager from "../../structures/ClientManager";
import { config } from "../../utills/Config";
import { TextChannel } from "discord.js";
import Repository, { keys } from "../../utills/Repository";

const clientManager = ClientManager.getInstance();
const repository = Repository.getInstance();

interface Notice {
    title: string;
    url: string;
    imgUrl: string;
}

export default class LolNoticeRepeater implements Repeater {
    name: string;
    description: string;
    ms: number;
    on: boolean;
    timer: NodeJS.Timer;
    sentNotices: Array<string>;

    constructor() {
        this.name = "LoL Notice";
        this.description = "롤 패치를 확인하는 리피터";
        this.ms = 1000 * 60;
        this.on = true;
        this.timer = null;
        this.sentNotices =
            (repository.read(keys.LOL_SENT_NOTICES) as Array<string>) ??
            new Array<string>();
    }

    private async parseNotices(): Promise<Array<Notice>> {
        const baseUrl = "https://www.leagueoflegends.com";
        const url = baseUrl + "/ko-kr/news/tags/patch-notes/";
        const notices: Array<Notice> = Array<Notice>();

        const res = await axios.get(url);
        const $ = cheerio.load(res.data);
        const noticeElements = $(".a-DAap").toArray();

        for (const noticeElement of noticeElements.reverse()) {
            const noticeTitle = $(noticeElement).find("h2").text();
            const noticeUri = $(noticeElement).find("a").attr("href");

            if (this.sentNotices.includes(noticeTitle)) continue;
            if (this.sentNotices.length > 30) this.sentNotices.shift();
            this.sentNotices.push(noticeTitle);
            repository.write(keys.LOL_SENT_NOTICES, this.sentNotices);

            const subRes = await axios.get(baseUrl + noticeUri);
            const sub$ = cheerio.load(subRes.data);
            const noticeImgUrl = sub$(".skins").first().attr("href");

            notices.push({
                title: noticeTitle,
                url: baseUrl + noticeUri,
                imgUrl: noticeImgUrl,
            });
        }

        return notices;
    }

    async execute() {
        const notices = await this.parseNotices();

        for (const notice of notices) {
            try {
                const embed = new EmbedBuilder()
                    .setTitle(notice.title)
                    .setURL(notice.url)
                    .setDescription("패치 노트")
                    .setImage(notice.imgUrl)
                    .setThumbnail(
                        "https://www.leagueoflegends.com/static/logo-1200-589b3ef693ce8a750fa4b4704f1e61f2.png"
                    )
                    .setFooter({ text: "리그오브레전드 패치노트" });

                const noticeChannel =
                    (await clientManager.client.channels.fetch(
                        config.LIME_PARTY_NOTICE_CHANNEL
                    )) as TextChannel;
                await noticeChannel.send({ embeds: [embed] });
            } catch (error) {
                Logger.error(
                    `Failed to execute [${this.name}] repeater.`,
                    error
                );
            }
        }
    }
}
