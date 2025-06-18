import client from "@/core/client";
import { ai } from "@/lib/ai";
import { getFeatureLogger } from "@/lib/logger";
import { generateText, Message } from "ai";
import { annaTools } from "@/lib/tools";
import { getSystemPrompt } from "./prompt";

export const logger = getFeatureLogger(__filename);

client.on("messageCreate", async (message) => {
  // Only respond when mentioned or replying to bot's message
  if (
    message.mentions.users.has(client.user?.id || "") ||
    (message.reference?.messageId && message.mentions.users.has(client.user?.id || ""))
  ) {
    logger.info("Processing awareness message", {
      userId: message.author.id,
      username: message.author.username,
      content: message.content,
      guildId: message.guild?.id,
      channelId: message.channel.id
    });

    try {
      // Get the last 50 messages in the channel for context
      const messages = await message.channel.messages.fetch({ limit: 50 }).then((msgs) =>
        msgs.map(
          (m) =>
            ({
              role: (m.author.id === client.user?.id ? "assistant" : "user") as "assistant" | "user",
              id: m.id,
              annotations: [
                {
                  userId: m.author.username,
                  messageId: m.id,
                  channelId: m.channel.id,
                  contentLength: m.content.length,
                  timestamp: m.createdAt.toISOString()
                }
              ],
              createdAt: m.createdAt,
              content: `ID:${m.id} - Author:${m.author.username} - Content:${m.content}`
            }) as Message
        )
      );

      const { text, toolResults, steps } = await generateText({
        model: ai("anthropic/claude-4-sonnet"),
        temperature: 0.7,
        maxSteps: 10, // Allow Anna to use multiple tools
        tools: annaTools,
        messages: [
          {
            role: "system",
            content: getSystemPrompt()
          },
          ...messages.reverse()
        ],
        toolChoice: "required"
      });

      logger.info("AI response generated", {
        userId: message.author.id,
        responseLength: text?.length || 0,
        toolCallsCount: toolResults?.length || 0,
        stepsCount: steps?.length || 0
      });
    } catch (error) {
      logger.error("Error processing awareness message", {
        userId: message.author.id,
        error: error instanceof Error ? error.message : String(error)
      });

      await message.reply("Hey! I'm having a bit of trouble processing that right now 😅");
    }
  }
});
