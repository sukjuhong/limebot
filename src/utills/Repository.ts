import * as path from "path";
import * as fs from "fs";
import Logger from "./Logger";

export type JsonType =
    | string
    | number
    | boolean
    | { [x: string]: JsonType }
    | Array<JsonType>;

export const keys = {
    LOSTARK_SENT_NOTICES: "lostark_sent_notices",
    LOL_SENT_NOTICES: "lol_sent_notices",
};

export default class Repository {
    dbPath: string;
    static instance = new Repository();

    private constructor() {
        this.dbPath = path.join(__dirname, "../../db.json");

        try {
            fs.accessSync(this.dbPath, fs.constants.F_OK);
        } catch (error) {
            Logger.info(
                "There is no database json file. Automatically made a data.json."
            );
            fs.writeFileSync(this.dbPath, JSON.stringify({}));
        }
    }

    public static getInstance() {
        return this.instance;
    }

    public read(key: string): JsonType {
        Logger.info("Reading database json file...");
        const jsonData = fs.readFileSync(this.dbPath, "utf8");
        const data = JSON.parse(jsonData);

        if (Object.keys(data).includes(key)) return data[key];
        return undefined;
    }

    public write(key: string, newData: JsonType) {
        Logger.info("Writing database json file...");
        try {
            const jsonData = fs.readFileSync(this.dbPath, "utf8");
            const data = JSON.parse(jsonData);
            data[key] = newData;

            const newJsonData = JSON.stringify(data);
            fs.writeFileSync(this.dbPath, newJsonData);
        } catch (error) {
            Logger.error("Failed to write database json file.");
            Logger.error(error);
        }
    }
}
