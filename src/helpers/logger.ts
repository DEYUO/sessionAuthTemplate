import log4js from "log4js";

// Configuring Log4js with a custom layout for the console appender
log4js.configure({
  appenders: {
    console: {
      type: "console",
      layout: {
        type: "pattern",
        pattern: "%[[%d] [%h][%p] [PID: %z]%]: %m",
      },
    },
  },
  categories: {
    default: { appenders: ["console"], level: "all" },
  },
});

// Getting the logger instance
const aLogger = log4js.getLogger();

// Defining a custom logging function to log messages
const customWebLogger = (message: string, ...rest: string[]) => {
  aLogger.debug(message, ...rest); // use aLogger.info to log messages at the info level
};

export { aLogger, customWebLogger };
