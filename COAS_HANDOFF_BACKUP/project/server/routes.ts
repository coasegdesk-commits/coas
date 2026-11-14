import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCatalogRequestSchema } from "@shared/schema";
import { seedProducts } from "./seed-products";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/catalog-requests", async (req, res) => {
    try {
      const validatedData = insertCatalogRequestSchema.parse(req.body);
      const catalogRequest = await storage.createCatalogRequest(validatedData);
      res.json(catalogRequest);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/catalog-requests", async (req, res) => {
    try {
      const requests = await storage.getAllCatalogRequests();
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Seed products endpoint (for development)
  app.post("/api/seed-products", async (req, res) => {
    try {
      await seedProducts();
      res.json({ success: true, message: "Products seeded successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get product by ID
  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // RAG Search endpoint
  app.post("/api/search", async (req, res) => {
    try {
      const { query, language = "ko" } = req.body;
      
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query is required" });
      }

      // First, search products using text matching
      const matchedProducts = await storage.searchProducts(query);
      
      // Log the search query
      await storage.logSearchQuery({
        query,
        language,
        resultCount: matchedProducts.length,
      });

      // If no products found, return empty results with AI suggestion
      if (matchedProducts.length === 0) {
        // Use AI to provide helpful response
        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant for E-COAS, an interior hardware company specializing in sliding doors, damping systems, folding doors, rails, and guides. The user's search returned no results. Suggest related products or alternative search terms. Respond in ${language === "ko" ? "Korean" : "English"}.`
            },
            {
              role: "user",
              content: `The user searched for: "${query}" but no products were found. Suggest what they might be looking for.`
            }
          ],
          max_tokens: 200,
        });

        return res.json({
          products: [],
          aiSuggestion: aiResponse.choices[0]?.message?.content || null,
          query,
        });
      }

      // Use AI to enhance search results with context
      const productContext = matchedProducts.slice(0, 10).map(p => ({
        id: p.id,
        name: p.name,
        nameKo: p.nameKo,
        category: p.category,
        categoryKo: p.categoryKo,
        description: language === "ko" ? p.descriptionKo : p.description,
        specifications: p.specifications,
        weightCapacity: p.weightCapacity,
      }));

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful product assistant for E-COAS, an interior hardware company. Based on the user's search query and the matching products, provide a brief helpful summary or recommendation. Respond in ${language === "ko" ? "Korean" : "English"}. Keep your response concise (2-3 sentences).`
          },
          {
            role: "user",
            content: `Search query: "${query}"\n\nMatching products:\n${JSON.stringify(productContext, null, 2)}\n\nProvide a helpful summary.`
          }
        ],
        max_tokens: 200,
      });

      res.json({
        products: matchedProducts,
        aiSummary: aiResponse.choices[0]?.message?.content || null,
        query,
        totalResults: matchedProducts.length,
      });
    } catch (error: any) {
      console.error("Search error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Dynamic sitemap.xml
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const BASE_URL = "https://e-coas.replit.app";
      const staticPages = [
        { url: "/", priority: "1.0", changefreq: "weekly" },
        { url: "/new-products", priority: "0.9", changefreq: "weekly" },
        { url: "/products", priority: "0.8", changefreq: "weekly" },
        { url: "/parts-index", priority: "0.8", changefreq: "weekly" },
        { url: "/parts-spec", priority: "0.7", changefreq: "monthly" },
        { url: "/about", priority: "0.7", changefreq: "monthly" },
        { url: "/contact", priority: "0.6", changefreq: "monthly" },
      ];

      const products = await storage.getAllProducts();
      const today = new Date().toISOString().split("T")[0];

      const urls = [
        ...staticPages.map(
          (p) => `
  <url>
    <loc>${BASE_URL}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
        ),
        ...products.map(
          (p) => `
  <url>
    <loc>${BASE_URL}/product/${p.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
        ),
      ];

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

      res.setHeader("Content-Type", "application/xml");
      res.send(xml);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
