import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
export const waitlist = sqliteTable("waitlist", {
  email: text("email").primaryKey(),
  neighborhood: text("neighborhood").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
