import * as path from "path";
import { format, createLogger, transports } from "winston";
import "winston-daily-rotate-file";

const logDir = path.join(__dirname, "../../logs");

const logLevel = {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
};

const logFormat = format.printf(
    ({ level, message, label, timestamp, stack }) => {
        return `${timestamp} [${label}] ${level}: ${message}`;
    }
);

const logger = createLogger({
    levels: logLevel,
    format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.label({ label: "LimeBot" }),
        format.errors({ stack: true }),
        logFormat
    ),
    transports: [
        new transports.DailyRotateFile({
            level: "info",
            datePattern: "YYYY-MM-DD",
            dirname: logDir,
            filename: `%DATE%.log`,
            maxFiles: 30,
        }),
        new transports.DailyRotateFile({
            level: "error",
            datePattern: "YYYY-MM-DD",
            dirname: logDir + "/error",
            filename: `%DATE%.error.log`,
            maxFiles: 30,
        }),
    ],
    exceptionHandlers: [
        new transports.DailyRotateFile({
            level: "fatal",
            datePattern: "YYYY-MM-DD",
            dirname: logDir + "/exception",
            filename: `%DATE%.exception.log`,
            maxFiles: 30,
            zippedArchive: true,
        }),
    ],
});

if (process.env.NODE_ENV !== "production") {
    logger.add(
        new transports.Console({
            format: format.combine(format.colorize(), format.simple()),
        })
    );
}

export default logger;
