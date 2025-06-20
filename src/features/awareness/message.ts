import type { Message } from "discord.js";

export const formatMessage = (message: Message) =>
  `Message ID: ${message.id}
Author User ID: ${message.author.username}
Channel ID: ${message.channel.id}
Created At: ${message.createdAt.toISOString()}
Reactions: ${message.reactions.cache.map((r) => `${r.emoji.name} (${r.count}${r.users.cache.has(message.client.user?.id) ? ", including YOU" : ""})`).join(", ")}

${message.content}
`;
