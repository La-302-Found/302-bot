import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";

export const memories = pgTable(
  "memories",
  {
    // Base fields
    // Never update these fields manually
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),

    // Model fields
    userId: text("user_id").notNull(),
    memory: text("memory").notNull(),
    tags: text("tags").array().notNull().default([]),
    timestamp: timestamp("timestamp").notNull().defaultNow()
  },
  (table) => ({
    userIdIdx: index("memories_user_id_idx").on(table.userId),
    timestampIdx: index("memories_timestamp_idx").on(table.timestamp)
  })
);

export type Memory = typeof memories.$inferSelect;
export type NewMemory = typeof memories.$inferInsert;
