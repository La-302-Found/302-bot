import client from "@/core/client";
import { ai } from "@/lib/ai";
import { getFeatureLogger } from "@/lib/logger";
import { generateText, Message } from "ai";
import { createAnnaTools } from "@/lib/tools";
import { getSystemPrompt } from "./prompt";
import { getChannelTypeLabel } from "./types";

export const logger = getFeatureLogger(__filename);

client.on("messageCreate", async (message) => {
  let needToRespond = false;

  // Respond if mentioned
  if (message.mentions.users.has(client.user?.id || "")) needToRespond = true;

  // Respond if bot was involved in the last 10 messages
  if (!needToRespond) {
    needToRespond = await message.channel.messages
      .fetch({ limit: 10 })
      .then((msgs) => msgs.some((m) => m.mentions.users.has(client.user?.id || "")));
  }

  // If no need to respond, return
  if (!needToRespond) return;

  logger.info("Processing awareness message", {
    userId: message.author.id,
    username: message.author.username,
    content: message.cleanContent,
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
            content: `ID:${m.id} - Author:${m.author.username} - Content:${m.cleanContent}`
          }) as Message
      )
    );

    const users = await message.guild?.members
      .fetch()
      .then((members) => members.map((m) => ({ id: m.id, username: m.user.username, displayName: m.displayName })));

    const channels = await message.guild?.channels.fetch().then((channels) =>
      channels
        .filter((c) => !!c)
        .map((c) => {
          return {
            id: c.id,
            name: c.name,
            type: getChannelTypeLabel(c)
          };
        })
    );

    const emojis = await message.guild?.emojis
      .fetch()
      .then((emojis) => emojis.map((e) => ({ name: e.name || "", id: e.id })));

    const systemPrompt = getSystemPrompt({
      users: users || [],
      emojis: emojis || []
    });

    const payload = [
      {
        role: "system" as const,
        content: systemPrompt
      },
      ...messages.reverse()
    ];

    // Create tools with context
    const contextualTools = createAnnaTools({
      message: message,
      channel: message.channel.isTextBased() ? message.channel : undefined,
      userId: message.author.id,
      emojis: emojis || [],
      users: users || [],
      channels: channels || []
    });

    logger.info("Payload", {
      system: systemPrompt.length,
      messages: messages.length,
      payload: JSON.stringify(payload).length
    });

    const { text, toolResults, steps } = await generateText({
      model: ai("google/gemini-2.5-flash-preview-05-20"),
      temperature: 0.7,
      tools: contextualTools,
      messages: payload,
      toolChoice: "required"
    });

    logger.info("AI response generated", {
      userId: message.author.id,
      responseLength: text?.length || 0,
      toolCallsCount: toolResults?.length || 0,
      stepsCount: steps?.length || 0
    });
  } catch (error) {
    logger.error("Error processing message", { error });
    await message.reply("Hey! I'm having a bit of trouble processing that right now 😅");
  }
});
