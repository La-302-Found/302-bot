import { tool } from "ai";
import { z } from "zod";
import { getFeatureLogger } from "@/lib/logger";
import client from "@/core/client";
import type { Message, TextBasedChannel } from "discord.js";
import { tryCatch } from "../try-catch";

const logger = getFeatureLogger(__filename);

// Define the context interface
export interface DiscordContext {
  message: Message;
  channel?: TextBasedChannel;
  userId: string;
  emojis: {
    name: string;
    id: string;
  }[];
  users: {
    id: string;
    username: string;
    displayName: string;
  }[];
  channels: {
    id: string;
    name: string;
  }[];
}

export class DiscordTools {
  private context: DiscordContext;

  constructor(context: DiscordContext) {
    this.context = context;
  }

  prepareMessage(message: string) {
    return (
      message
        // Prepare emojis
        .replace(/:(\w+):/g, (_, emojiName) => {
          const emoji = this.context.emojis.find((e) => e.name === emojiName);
          return emoji ? `<:${emoji.name}:${emoji.id}>` : `:${emojiName}:`;
        })
        // Prepare mentions
        .replace(/<@!(\d+)>/g, (_, userId) => {
          const user = this.context.users.find((u) => u.id === userId);
          return user ? `<@!${user.id}>` : `<@!${userId}>`;
        })
        // Prepare channels
        .replace(/<#(\d+)>/g, (_, channelId) => {
          const channel = this.context.channels.find((c) => c.id === channelId);
          return channel ? `<#${channel.id}>` : `<#${channelId}>`;
        })
    );
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

      const { data: channel, error } = await tryCatch(() => client.channels.cache.get(channelId));

      if (error || !channel || !channel.isTextBased()) {
        logger.error("Channel not found or not text-based", { channelId });
        return { success: false, error: "Channel not found or not text-based" };
      }

      const { data: message, error: messageError } = await tryCatch(() => channel.messages.fetch(messageId));

      if (messageError || !message) {
        logger.error("Message not found", { messageId });
        return { success: false, error: "Message not found" };
      }

      const { data: reply, error: replyError } = await tryCatch(() => message.reply(this.prepareMessage(content)));

      if (replyError) {
        logger.error("Error replying to message", { replyError });
        return { success: false, error: "Error replying to message" };
      }

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
        logger.error("Channel ID is required");
        return { success: false, error: "Channel ID is required" };
      }

      const { data: channel, error } = await tryCatch(() => client.channels.cache.get(targetChannelId));

      if (error || !channel || !channel.isSendable()) {
        logger.error("Channel not found or not sendable", { targetChannelId });
        return { success: false, error: "Channel not found or not sendable" };
      }

      const { data: sentMessage, error: sentMessageError } = await tryCatch(async () => {
        const message = await channel.send(this.prepareMessage(content));
        return message;
      });

      if (sentMessageError) {
        logger.error("Error sending message", { sentMessageError });
        return { success: false, error: "Error sending message" };
      }

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

      const { data: channel, error } = await tryCatch(() => client.channels.cache.get(channelId));

      if (error || !channel || !channel.isTextBased()) {
        logger.error("Channel not found or not text-based", { channelId });
        return { success: false, error: "Channel not found or not text-based" };
      }

      const { data: message, error: messageError } = await tryCatch(() => channel.messages.fetch(messageId));

      if (messageError || !message) {
        logger.error("Message not found", { messageId });
        return { success: false, error: "Message not found" };
      }

      const { data: reaction, error: reactionError } = await tryCatch(async () => {
        const reaction = await message.react(this.prepareMessage(emoji));
        return reaction;
      });

      if (reactionError) {
        logger.error("Error adding reaction", { reactionError });
        return { success: false, error: "Error adding reaction" };
      }

      return { success: true, newCount: reaction.count };
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

      const { data: channel, error } = await tryCatch(() => client.channels.cache.get(channelId));

      if (error || !channel || !channel.isTextBased()) {
        logger.error("Channel not found or not text-based", { channelId });
        return { success: false, error: "Channel not found or not text-based" };
      }

      const { data: message, error: messageError } = await tryCatch(() => channel.messages.fetch(messageId));

      if (messageError || !message) {
        logger.error("Message not found", { messageId });
        return { success: false, error: "Message not found" };
      }

      const { data: reaction, error: reactionError } = await tryCatch(() => message.reactions.cache.get(emoji));

      if (reactionError || !reaction) {
        logger.error("Reaction not found", { emoji });
        return { success: false, error: "Reaction not found" };
      }

      const { data: removedReaction, error: removedReactionError } = await tryCatch(async () => {
        const removedReaction = await reaction.users.remove(client.user?.id);
        return removedReaction;
      });

      if (removedReactionError) {
        logger.error("Error removing reaction", { removedReactionError });
        return { success: false, error: "Error removing reaction" };
      }

      return { success: true, newCount: removedReaction.count };
    }
  });

  joinVoiceChannelTool = tool({
    description: "Join a voice channel",
    parameters: z.object({
      channelId: z.string().describe("The voice channel ID to join (get it from list_all_channels tool)")
    }),
    execute: async ({ channelId }) => {
      logger.info("Voice channel join requested", { channelId });

      const { data: channel, error } = await tryCatch(() => client.channels.cache.get(channelId));

      if (error || !channel || !channel.isVoiceBased()) {
        logger.error("Voice channel not found", { channelId });
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

  listAllChannelsTool = tool({
    description: "List all channels in the server",
    parameters: z.object({}),
    execute: async () => {
      logger.info("Listing all channels", { channels: this.context.channels });
      return { success: true, channels: this.context.channels };
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
      leave_voice_channel: this.leaveVoiceChannelTool,
      list_all_channels: this.listAllChannelsTool
    };
  }
}
