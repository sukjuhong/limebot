import * as path from "path";
import * as fs from "fs";

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
        const jsonData = fs.readFileSync(this.dbPath, "utf8");
        const data = JSON.parse(jsonData);

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
