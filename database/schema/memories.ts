import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";

export const memories = pgTable(
  "memories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    memory: text("memory").notNull(),
    tags: text("tags").array().notNull().default([]),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
  },
  (table) => ({
    userIdIdx: index("memories_user_id_idx").on(table.userId),
    timestampIdx: index("memories_timestamp_idx").on(table.timestamp)
  })
);

export type Memory = typeof memories.$inferSelect;
export type NewMemory = typeof memories.$inferInsert;
