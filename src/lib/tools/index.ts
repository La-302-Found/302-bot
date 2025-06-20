// Import all tools first
import { addMemoryTool, searchMemoryTool, updateMemoryTool, deleteMemoryTool, listMemoriesTool } from "./memory";
import { DiscordTools, DiscordContext } from "./discord";
import { searchWebTool } from "./web-search";

// Re-export individual memory and web tools
export { addMemoryTool, searchMemoryTool, updateMemoryTool, deleteMemoryTool, listMemoriesTool, searchWebTool };

// Re-export Discord types
export { DiscordTools, DiscordContext };

// Function to create all tools with context
export function createAnnaTools(discordContext: DiscordContext) {
  const discordTools = new DiscordTools(discordContext);
  const tools = discordTools.getTools();

  return {
    // Memory tools
    add_memories: addMemoryTool,
    search_memory: searchMemoryTool,
    update_memories: updateMemoryTool,
    delete_memory: deleteMemoryTool,
    list_memories: listMemoriesTool,

    // Discord interaction tools
    skip: tools.skip,
    reply_to: tools.reply_to,
    send_message: tools.send_message,
    add_reaction: tools.add_reaction,
    remove_reaction: tools.remove_reaction,
    join_voice_channel: tools.join_voice_channel,
    leave_voice_channel: tools.leave_voice_channel,
    list_all_channels: tools.list_all_channels,

    // Information tools
    search_web: searchWebTool
  };
}
