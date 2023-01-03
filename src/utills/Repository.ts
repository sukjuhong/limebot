import * as path from "path";
import * as fs from "fs";
import Logger from "./Logger";

export type JsonType =
    | string
    | number
    | boolean
    | { [x: string]: JsonType }
    | Array<JsonType>;

export default class Repository {
    static instance: Repository = new Repository();

    dbPath: string;

    private constructor() {
        this.dbPath = path.join(__dirname, "../../db.json");
    }

    public static getInstance() {
        return this.instance;
    }

    public read(key: string): JsonType {
        let data;
        try {
            Logger.info("Reading database json file...");
            const jsonData = fs.readFileSync(this.dbPath, "utf8");
            data = JSON.parse(jsonData);
        } catch (error) {
            Logger.warn(
                "There is no database json file. Automatically Create database json file to execute properly."
            );
            fs.writeFileSync(this.dbPath, JSON.stringify({}));
            return {};
        }

        return data[key];
    }

    public write(key: string, newData: JsonType) {
        const jsonData = fs.readFileSync(this.dbPath, "utf8");
        const data = JSON.parse(jsonData);
        data[key] = newData;

        const newJsonData = JSON.stringify(data);
        fs.writeFileSync(this.dbPath, newJsonData);
    }
}
