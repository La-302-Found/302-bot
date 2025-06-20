import { tool } from "ai";
import { z } from "zod";
import { getFeatureLogger } from "@/lib/logger";
import { db } from "db";
import { memories, type NewMemory } from "db/schema";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";

const logger = getFeatureLogger(__filename);

export const addMemoryTool = tool({
  description: "Store a new memory about a user or conversation",
  parameters: z.object({
    userId: z.string().describe("The Discord user ID"),
    memory: z.string().describe("The memory to store"),
    tags: z.array(z.string()).optional().describe("Optional tags for categorization")
  }),
  execute: async ({ userId, memory, tags }) => {
    try {
      const newMemory: NewMemory = {
        userId,
        memory,
        tags: tags || [],
        timestamp: new Date()
      };

      const [inserted] = await db.insert(memories).values(newMemory).returning();

      logger.info("Memory stored", { memoryId: inserted.id, userId });
      return { success: true, memoryId: inserted.id };
    } catch (error) {
      logger.error("Failed to store memory", { error, userId });
      return { success: false, error: "Failed to store memory" };
    }
  }
});

export const searchMemoryTool = tool({
  description: "Search for memories about a specific user",
  parameters: z.object({
    userId: z.string().describe("The Discord user ID to search memories for"),
    query: z.string().optional().describe("Optional search query to filter memories")
  }),
  execute: async ({ userId, query }) => {
    try {
      const userMemories = await db
        .select()
        .from(memories)
        .where(
          and(
            eq(memories.userId, userId),
            query
              ? or(
                  ilike(memories.memory, `%${query}%`),
                  sql`EXISTS (SELECT 1 FROM unnest(${memories.tags}) AS tag WHERE tag ILIKE ${"%" + query + "%"})`
                )
              : undefined
          )
        );

      logger.info("Memory search", { userId, foundCount: userMemories.length });
      return { memories: userMemories };
    } catch (error) {
      logger.error("Failed to search memories", { error, userId });
      return { memories: [] };
    }
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
    try {
      const [updated] = await db.update(memories).set({ memory, tags }).where(eq(memories.id, memoryId)).returning();

      if (!updated) {
        return { success: false, error: "Memory not found" };
      }

      logger.info("Memory updated", { memoryId });
      return { success: true };
    } catch (error) {
      logger.error("Failed to update memory", { error, memoryId });
      return { success: false, error: "Failed to update memory" };
    }
  }
});

export const deleteMemoryTool = tool({
  description: "Delete a memory",
  parameters: z.object({
    memoryId: z.string().describe("The memory ID to delete")
  }),
  execute: async ({ memoryId }) => {
    try {
      const [deleted] = await db.delete(memories).where(eq(memories.id, memoryId)).returning();

      const success = !!deleted;
      logger.info("Memory deletion", { memoryId, success });
      return { success };
    } catch (error) {
      logger.error("Failed to delete memory", { error, memoryId });
      return { success: false };
    }
  }
});

export const listMemoriesTool = tool({
  description: "List all memories for a user",
  parameters: z.object({
    userId: z.string().describe("The Discord user ID"),
    limit: z.number().optional().describe("Limit the number of memories returned")
  }),
  execute: async ({ userId, limit }) => {
    try {
      const userMemories = await db
        .select()
        .from(memories)
        .where(eq(memories.userId, userId))
        .orderBy(desc(memories.timestamp))
        .limit(limit || 50);

      logger.info("Memory list", { userId, count: userMemories.length });
      return { memories: userMemories };
    } catch (error) {
      logger.error("Failed to list memories", { error, userId });
      return { memories: [] };
    }
  }
});
