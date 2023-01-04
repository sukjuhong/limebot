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
};

class Repository {
    dbPath: string;
    defalutData: JsonType;

    constructor() {
        this.dbPath = path.join(__dirname, "../../db.json");
        this.defalutData = {
            lostark_sent_notices: [],
        };

        try {
            fs.accessSync(this.dbPath, fs.constants.F_OK);
        } catch (error) {
            Logger.warn(
                "There is no database json file. Automatically made a data.json."
            );
            fs.writeFileSync(this.dbPath, JSON.stringify(this.defalutData));
        }
    }

    public read(key: string): JsonType {
        let data;
        try {
            Logger.info("Reading database json file...");
            const jsonData = fs.readFileSync(this.dbPath, "utf8");
            data = JSON.parse(jsonData);
        } catch (error) {
            Logger.error("Failed to read database json file.");
            Logger.error(error);
        }
        return data[key];
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

export default new Repository();
