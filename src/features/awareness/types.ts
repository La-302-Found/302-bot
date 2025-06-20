import type { Channel } from "discord.js";

export type ChannelType = "text" | "voice" | "thread" | "unknown";
export type ChannelTypes = ChannelType | ChannelTypes[];

export const getChannelType = (channel: Channel): ChannelTypes => {
  const types: ChannelTypes[] = [];

  if (channel.isTextBased()) types.push("text");
  if (channel.isVoiceBased()) types.push("voice");
  if (channel.isThread()) types.push("thread");

  return types.length > 1 ? types : types[0] || "unknown";
};

export const getChannelTypeLabel = (channel: Channel): string => {
  const types = getChannelType(channel);

  if (Array.isArray(types)) {
    return types.join(" & ");
  }

  return types;
};
