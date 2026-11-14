import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  nameKo: text("name_ko").notNull(),
  category: text("category").notNull(),
  categoryKo: text("category_ko").notNull(),
  description: text("description"),
  descriptionKo: text("description_ko"),
  specifications: text("specifications"),
  weightCapacity: text("weight_capacity"),
  pageNumber: text("page_number"),
  imageUrl: text("image_url"),
  searchText: text("search_text"),
});

export const insertProductSchema = createInsertSchema(products);
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export const searchQueries = pgTable("search_queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  query: text("query").notNull(),
  language: text("language").default("ko"),
  resultCount: integer("result_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSearchQuerySchema = createInsertSchema(searchQueries).omit({
  id: true,
  createdAt: true,
});
export type InsertSearchQuery = z.infer<typeof insertSearchQuerySchema>;
export type SearchQuery = typeof searchQueries.$inferSelect;

export const catalogRequests = pgTable("catalog_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  message: text("message"),
  catalogType: text("catalog_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCatalogRequestSchema = createInsertSchema(catalogRequests).omit({
  id: true,
  createdAt: true,
});

export type InsertCatalogRequest = z.infer<typeof insertCatalogRequestSchema>;
export type CatalogRequest = typeof catalogRequests.$inferSelect;
