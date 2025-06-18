import { tool } from "ai";
import { z } from "zod";
import { getFeatureLogger } from "@/lib/logger";

const logger = getFeatureLogger(__filename);

// Simple in-memory storage for now - could be replaced with Redis/database
interface MemoryData {
  id: string;
  userId: string;
  memory: string;
  tags: string[];
  timestamp: string;
  updatedAt?: string;
}

const memories = new Map<string, MemoryData>();

export const addMemoryTool = tool({
  description: "Store a new memory about a user or conversation",
  parameters: z.object({
    userId: z.string().describe("The Discord user ID"),
    memory: z.string().describe("The memory to store"),
    tags: z.array(z.string()).optional().describe("Optional tags for categorization")
  }),
  execute: async ({ userId, memory, tags }) => {
    const memoryId = `${userId}_${Date.now()}`;
    const memoryData = {
      id: memoryId,
      userId,
      memory,
      tags: tags || [],
      timestamp: new Date().toISOString()
    };

    memories.set(memoryId, memoryData);
    logger.info("Memory stored", { memoryId, userId });

    return { success: true, memoryId };
  }
});

export const searchMemoryTool = tool({
  description: "Search for memories about a specific user",
  parameters: z.object({
    userId: z.string().describe("The Discord user ID to search memories for"),
    query: z.string().optional().describe("Optional search query to filter memories")
  }),
  execute: async ({ userId, query }) => {
    const userMemories = Array.from(memories.values())
      .filter((m) => m.userId === userId)
      .filter(
        (m) =>
          !query ||
          m.memory.toLowerCase().includes(query.toLowerCase()) ||
          m.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
      );

    logger.info("Memory search", { userId, foundCount: userMemories.length });

    return { memories: userMemories };
  }
});

export const updateMemoryTool = tool({
  description: "Update an existing memory",
  parameters: z.object({
    memoryId: z.string().describe("The memory ID to update"),
    memory: z.string().describe("The updated memory content"),
    tags: z.array(z.string()).optional().describe("Updated tags")
  }),
  execute: async ({ memoryId, memory, tags }) => {
    const existingMemory = memories.get(memoryId);
    if (!existingMemory) {
      return { success: false, error: "Memory not found" };
    }

    const updatedMemory = {
      ...existingMemory,
      memory,
      tags: tags || existingMemory.tags,
      updatedAt: new Date().toISOString()
    };

    memories.set(memoryId, updatedMemory);
    logger.info("Memory updated", { memoryId });

    return { success: true };
  }
});

export const deleteMemoryTool = tool({
  description: "Delete a memory",
  parameters: z.object({
    memoryId: z.string().describe("The memory ID to delete")
  }),
  execute: async ({ memoryId }) => {
    const deleted = memories.delete(memoryId);
    logger.info("Memory deletion", { memoryId, success: deleted });

    return { success: deleted };
  }
});

export const listMemoriesTool = tool({
  description: "List all memories for a user",
  parameters: z.object({
    userId: z.string().describe("The Discord user ID"),
    limit: z.number().optional().describe("Limit the number of memories returned")
  }),
  execute: async ({ userId, limit }) => {
    const userMemories = Array.from(memories.values())
      .filter((m) => m.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit || 50);

    logger.info("Memory list", { userId, count: userMemories.length });

    return { memories: userMemories };
  }
});
