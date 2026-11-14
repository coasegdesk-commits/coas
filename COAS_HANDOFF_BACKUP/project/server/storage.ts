import { type CatalogRequest, type InsertCatalogRequest, catalogRequests, type Product, type InsertProduct, products, type InsertSearchQuery, searchQueries } from "@shared/schema";
import { db } from "./db";
import { ilike, or, sql } from "drizzle-orm";

export interface IStorage {
  createCatalogRequest(request: InsertCatalogRequest): Promise<CatalogRequest>;
  getAllCatalogRequests(): Promise<CatalogRequest[]>;
  
  // Product methods
  createProduct(product: InsertProduct): Promise<Product>;
  createProducts(productList: InsertProduct[]): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
  
  // Search query logging
  logSearchQuery(searchQuery: InsertSearchQuery): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createCatalogRequest(request: InsertCatalogRequest): Promise<CatalogRequest> {
    const [catalogRequest] = await db.insert(catalogRequests).values(request).returning();
    return catalogRequest;
  }

  async getAllCatalogRequests(): Promise<CatalogRequest[]> {
    return await db.select().from(catalogRequests).orderBy(catalogRequests.createdAt);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async createProducts(productList: InsertProduct[]): Promise<Product[]> {
    if (productList.length === 0) return [];
    const newProducts = await db.insert(products).values(productList).returning();
    return newProducts;
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(sql`${products.id} = ${id}`);
    return product;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products).where(
      or(
        ilike(products.category, `%${category}%`),
        ilike(products.categoryKo, `%${category}%`)
      )
    );
  }

  async searchProducts(query: string): Promise<Product[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(products).where(
      or(
        ilike(products.name, searchTerm),
        ilike(products.nameKo, searchTerm),
        ilike(products.category, searchTerm),
        ilike(products.categoryKo, searchTerm),
        ilike(products.description, searchTerm),
        ilike(products.descriptionKo, searchTerm),
        ilike(products.searchText, searchTerm),
        ilike(products.specifications, searchTerm)
      )
    );
  }

  async logSearchQuery(searchQuery: InsertSearchQuery): Promise<void> {
    await db.insert(searchQueries).values(searchQuery);
  }
}

export const storage = new DatabaseStorage();
