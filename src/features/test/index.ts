import client from "@/core/client";
import { getFeatureLogger } from "@/lib/logger";

export const logger = getFeatureLogger(__filename);

client.on("messageCreate", (message) => {
  if (message.content === "say something else") {
    logger.info("Responding to test message", {
      userId: message.author.id,
      username: message.author.username,
      content: message.content
    });

    message.reply("Hello, world!");
  }
});
