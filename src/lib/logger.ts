import { createLogger, format, transports, Logger } from "winston";
import path from "path";

const createFeatureLogger = (feature?: string): Logger => {
  const baseFormat = format.combine(format.timestamp(), format.errors({ stack: true }), format.json());

  const consoleFormat = format.combine(
    format.timestamp({ format: "HH:mm:ss" }),
    format.colorize(),
    format.printf(({ timestamp, level, message, feature: logFeature, ...meta }) => {
      const featurePrefix = logFeature ? `[${logFeature}] ` : "";
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
      return `${timestamp} ${level}: ${featurePrefix}${message}${metaStr}`;
    })
  );

  const logger = createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: baseFormat,
    defaultMeta: feature ? { feature } : {},
    transports: [
      new transports.Console({
        format: consoleFormat
      })
    ]
  });

  return logger;
};

// Helper function to auto-detect feature from file path
const getFeatureLogger = (filePath?: string): Logger => {
  if (!filePath) return createFeatureLogger();

  const normalizedPath = path.normalize(filePath);

  // Extract feature name from path like: /path/to/src/features/feature-name/...
  const featureMatch = normalizedPath.match(/[/\\]features[/\\]([^/\\]+)/);
  const featureName = featureMatch ? featureMatch[1] : undefined;

  return createFeatureLogger(featureName);
};

// Default logger without feature
const logger = createFeatureLogger();

// Export both the default logger and the factory functions
export default logger;
export { createFeatureLogger, getFeatureLogger };
