import morgan from "morgan";

// Compact log format: METHOD URL STATUS response-time ms - content-length
export const requestLogger = morgan(
  ":method :url :status :res[content-length] - :response-time ms"
);
