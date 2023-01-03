export default interface Repeater {
    name: string;
    description: string;
    ms: number;

    execute(): void | Promise<void>;
}
