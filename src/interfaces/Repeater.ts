export default interface Repeater {
    name: string;
    description: string;
    ms: number;
    on: boolean;
    timer: NodeJS.Timer;

    execute(): void | Promise<void>;
}
