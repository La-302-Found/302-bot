// Import all tools first
import { addMemoryTool, searchMemoryTool, updateMemoryTool, deleteMemoryTool, listMemoriesTool } from "./memory";

import {
  skipTool,
  replyToTool,
  sendMessageTool,
  addReactionTool,
  removeReactionTool,
  joinVoiceChannelTool,
  leaveVoiceChannelTool
} from "./discord";

import { searchWebTool } from "./web-search";

// Re-export all tools
export {
  addMemoryTool,
  searchMemoryTool,
  updateMemoryTool,
  deleteMemoryTool,
  listMemoriesTool,
  skipTool,
  replyToTool,
  sendMessageTool,
  addReactionTool,
  removeReactionTool,
  joinVoiceChannelTool,
  leaveVoiceChannelTool,
  searchWebTool
};

// Combine all tools for easy use
export const annaTools = {
  // Memory tools
  add_memories: addMemoryTool,
  search_memory: searchMemoryTool,
  update_memories: updateMemoryTool,
  delete_memory: deleteMemoryTool,
  list_memories: listMemoriesTool,

  // Discord interaction tools
  skip: skipTool,
  reply_to: replyToTool,
  send_message: sendMessageTool,
  add_reaction: addReactionTool,
  remove_reaction: removeReactionTool,
  join_voice_channel: joinVoiceChannelTool,
  leave_voice_channel: leaveVoiceChannelTool,

  // Information tools
  search_web: searchWebTool
};
