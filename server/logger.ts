import { LoggingBunyan } from "@google-cloud/logging-bunyan";
import bunyan from "bunyan";

const loggingBunyan = new LoggingBunyan();

// Create a Bunyan logger that streams to Stackdriver Logging
// Logs will be written to: "projects/bavard-[env]/logs/bunyan_log"
const logger = bunyan.createLogger({
  // The JSON payload of the log as it appears in Stackdriver Logging
  // will contain "name": "user-service"
  name: "user-service",
  streams: [
    // Log to the console at 'info' and above
    {stream: process.stdout, level: "info"},
    // And log to Stackdriver Logging, logging at 'info' and above
    loggingBunyan.stream("info"),
  ],
});

export default logger;
