import { format, createLogger, transports } from "winston";

const logFormat = format.printf(
    ({ level, message, label, timestamp, stack }) => {
        return stack
            ? `${timestamp} [${label}] ${level}: ${message}\n${stack}`
            : `${timestamp} [${label}] ${level}: ${message}`;
    }
);

const Logger = createLogger({
    format: format.combine(
        format.colorize(),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.label({ label: "LimeBot" }),
        logFormat
    ),
    transports: [new transports.Console()],
});

export default Logger;
