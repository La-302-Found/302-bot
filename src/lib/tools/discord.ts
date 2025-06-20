import { tool } from "ai";
import { z } from "zod";
import { getFeatureLogger } from "@/lib/logger";
import client from "@/core/client";
import type { Message, TextBasedChannel } from "discord.js";

const logger = getFeatureLogger(__filename);

// Define the context interface
export interface DiscordContext {
  message?: Message;
  channel?: TextBasedChannel;
  userId?: string;
  guildId?: string;
}

export class DiscordTools {
  private context: DiscordContext;

  constructor(context: DiscordContext) {
    this.context = context;
  }

  skipTool = tool({
    description: "Skip responding to the current message - use when not interested or not relevant",
    parameters: z.object({
      reason: z.string().optional().describe("Optional reason for skipping")
    }),
    execute: async ({ reason }) => {
      logger.info("Skipping interaction", { reason });
      return { success: true };
    }
  });

  replyToTool = tool({
    description: "Reply to a specific message",
    parameters: z.object({
      content: z.string().describe("The reply content"),
      messageId: z.string().describe("The message ID to reply to"),
      channelId: z.string().describe("The channel ID where the message is located")
    }),
    execute: async ({ content, messageId, channelId }) => {
      logger.info("Reply requested", { messageId, channelId, contentLength: content.length });

      const channel = client.channels.cache.get(channelId);

      if (!channel || !channel.isTextBased()) {
        return { success: false, error: "Channel not found or not text-based" };
      }

      const message = await channel.messages.fetch(messageId);
      if (!message) {
        return { success: false, error: "Message not found" };
      }

      const reply = await message.reply(content);
      return { success: true, replyId: reply.id };
    }
  });

  sendMessageTool = tool({
    description: "Send a new message to the current channel",
    parameters: z.object({
      content: z.string().describe("The message content to send"),
      channelId: z.string().optional().describe("The channel ID to send the message to (defaults to current channel)")
    }),
    execute: async ({ content, channelId }) => {
      logger.info("Message send requested", { contentLength: content.length, channelId });

      // Use provided channelId or get from context
      const targetChannelId = channelId || this.context.channel?.id;

      if (!targetChannelId) {
        return { success: false, error: "Channel ID is required" };
      }

      const channel = client.channels.cache.get(targetChannelId);

      if (!channel || !channel.isSendable()) {
        return { success: false, error: "Channel not found or not sendable" };
      }

      const sentMessage = await channel.send(content);
      return { success: true, messageId: sentMessage.id };
    }
  });

  addReactionTool = tool({
    description: "Add an emoji reaction to a message",
    parameters: z.object({
      messageId: z.string().describe("The message ID to react to"),
      channelId: z.string().describe("The channel ID where the message is located"),
      emoji: z.string().describe("The emoji to add (e.g., '👍', '❤️', or custom emoji name)")
    }),
    execute: async ({ messageId, channelId, emoji }) => {
      logger.info("Reaction requested", { messageId, channelId, emoji });

      const channel = client.channels.cache.get(channelId);

      if (!channel || !channel.isTextBased()) {
        return { success: false, error: "Channel not found or not text-based" };
      }

      const message = await channel.messages.fetch(messageId);
      if (!message) {
        return { success: false, error: "Message not found" };
      }

      await message.react(emoji);
      return { success: true };
    }
  });

  removeReactionTool = tool({
    description: "Remove your reaction from a message",
    parameters: z.object({
      messageId: z.string().describe("The message ID to remove reaction from"),
      channelId: z.string().describe("The channel ID where the message is located"),
      emoji: z.string().describe("The emoji to remove")
    }),
    execute: async ({ messageId, channelId, emoji }) => {
      logger.info("Reaction removal requested", { messageId, channelId, emoji });

      const channel = client.channels.cache.get(channelId);

      if (!channel || !channel.isTextBased()) {
        return { success: false, error: "Channel not found or not text-based" };
      }

      const message = await channel.messages.fetch(messageId);
      if (!message) {
        return { success: false, error: "Message not found" };
      }

      const reaction = message.reactions.cache.get(emoji);
      if (!reaction) {
        return { success: false, error: "Reaction not found" };
      }

      await reaction.users.remove(client.user?.id);
      return { success: true };
    }
  });

  joinVoiceChannelTool = tool({
    description: "Join a voice channel",
    parameters: z.object({
      channelId: z.string().describe("The voice channel ID to join")
    }),
    execute: async ({ channelId }) => {
      logger.info("Voice channel join requested", { channelId });

      const channel = client.channels.cache.get(channelId);

      if (!channel || !channel.isVoiceBased()) {
        return { success: false, error: "Voice channel not found" };
      }

      // Voice channel functionality would require @discordjs/voice package
      // For now, just return success as placeholder
      logger.info("Voice channel join not implemented yet", { channelId });
      return { success: false, error: "Voice channel functionality not implemented yet" };
    }
  });

  leaveVoiceChannelTool = tool({
    description: "Leave the current voice channel",
    parameters: z.object({
      reason: z.string().optional().describe("Optional reason for leaving")
    }),
    execute: async ({ reason }) => {
      logger.info("Voice channel leave requested", { reason });

      // Voice channel functionality would require @discordjs/voice package
      // For now, just return success as placeholder
      logger.info("Voice channel leave not implemented yet", { reason });
      return { success: false, error: "Voice channel functionality not implemented yet" };
    }
  });

  // Method to get all tools as an object
  getTools() {
    return {
      skip: this.skipTool,
      reply_to: this.replyToTool,
      send_message: this.sendMessageTool,
      add_reaction: this.addReactionTool,
      remove_reaction: this.removeReactionTool,
      join_voice_channel: this.joinVoiceChannelTool,
      leave_voice_channel: this.leaveVoiceChannelTool
    };
  }
}

// Export a factory function for backward compatibility
export function createDiscordTools(context: DiscordContext) {
  return new DiscordTools(context);
}
