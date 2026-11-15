import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import OpenAI from "openai";
import { cmsStore, UPLOADS_DIR } from "./cms-store";
import {
  deleteBuyerFromEgdesk,
  getEgdeskStatus,
  listBuyersFromEgdesk,
  syncOrderToEgdesk,
  upsertBuyerInEgdesk,
} from "./egdesk-sync";
import { partAffinityStore } from "./part-affinity";
import { b2bStore } from "./b2b-store";
import { manualsStore } from "./manuals-store";
import { inventoryStore } from "./inventory-store";
import {
  getDailyDispatchSummary,
  getAccountRevenueBreakdown,
  getRevenueKpiSummary,
} from "./order-analytics";

const apiKey =
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

const openai = apiKey
  ? new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined,
      apiKey,
    })
  : null;

function extractToken(req: Request): string | undefined {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }
  return undefined;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!cmsStore.verifyToken(token)) {
    return res.status(401).json({ error: "관리자 로그인이 필요합니다." });
  }
  next();
}

function sanitizeFileStem(name: string): string {
  const stem = path.basename(name, path.extname(name));
  const cleaned = stem
    .replace(/[^a-zA-Z0-9가-힣_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 50);
  return cleaned || "file";
}

function streamUploadToDisk(
  req: Request,
  folder: string,
  allowedExts: Set<string>,
  maxBytes: number,
): Promise<{
  fileName: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
}> {
  return new Promise((resolve, reject) => {
    const rawHeaderName = String(req.headers["x-file-name"] || "upload.bin");
    let originalName = "upload.bin";
    try {
      originalName = decodeURIComponent(rawHeaderName);
    } catch {
      originalName = rawHeaderName;
    }

    const ext = path.extname(originalName).toLowerCase();
    if (!allowedExts.has(ext)) {
      return reject(
        new Error(`허용되지 않는 파일 형식입니다 (${ext || "확장자 없음"}).`),
      );
    }

    const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "") || "general";
    const targetDir = path.join(UPLOADS_DIR, safeFolder);
    fs.mkdirSync(targetDir, { recursive: true });

    const uniquePrefix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const fileName = `${uniquePrefix}-${sanitizeFileStem(originalName)}${ext}`;
    const fullPath = path.join(targetDir, fileName);
    const mimeType = String(
      req.headers["x-mime-type"] || req.headers["content-type"] || "application/octet-stream",
    );

    const out = fs.createWriteStream(fullPath);
    let size = 0;
    let aborted = false;

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes && !aborted) {
        aborted = true;
        out.destroy();
        fs.unlink(fullPath, () => {});
        reject(
          new Error(
            `파일 용량이 제한(${Math.round(maxBytes / 1024 / 1024)}MB)을 초과했습니다.`,
          ),
        );
      }
    });

    req.on("error", (err) => {
      if (!aborted) {
        aborted = true;
        out.destroy();
        fs.unlink(fullPath, () => {});
        reject(err);
      }
    });

    out.on("error", (err) => {
      if (!aborted) {
        aborted = true;
        reject(err);
      }
    });

    out.on("finish", () => {
      if (!aborted) {
        resolve({
          fileName,
          originalName,
          url: `/uploads/${safeFolder}/${fileName}`,
          size,
          mimeType,
        });
      }
    });

    req.pipe(out);
  });
}

const ADMIN_ALLOWED_EXTS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".pdf",
]);

const ORDER_ALLOWED_EXTS = new Set([
  // Images
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
  ".tif",
  ".tiff",
  ".heic",
  ".svg",
  // PDF & CAD / 3D Drawings
  ".pdf",
  ".dwg",
  ".dxf",
  ".dwf",
  ".dwfx",
  ".stp",
  ".step",
  ".igs",
  ".iges",
  ".stl",
  ".3dm",
  ".skp",
  ".plt",
  ".ai",
  ".eps",
  // Excel, Spreadsheets & Data
  ".xlsx",
  ".xls",
  ".xlsm",
  ".xlsb",
  ".csv",
  ".tsv",
  ".ods",
  ".json",
  ".xml",
  ".txt",
  // Documents & Archives
  ".doc",
  ".docx",
  ".hwp",
  ".hwpx",
  ".ppt",
  ".pptx",
  ".zip",
  ".7z",
  ".rar",
  ".tar",
  ".gz",
]);

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // =========================================================
  // 1. Public Storefront & Customer Submission APIs
  // =========================================================

  app.get("/api/cms/bootstrap", (_req, res) => {
    res.json(cmsStore.getBootstrap());
  });

  app.get("/api/products", (_req, res) => {
    res.json(cmsStore.getAllProducts());
  });

  app.get("/api/products/:id", (req, res) => {
    const product = cmsStore.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  });

  // Catalog Request & E-Catalog Download Lead Capture
  app.post("/api/catalog-requests", (req, res) => {
    try {
      const { name, email, phone, company, message, catalogType } = req.body || {};
      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: "이름(담당자명)을 입력해주세요." });
      }
      if (!email && !phone) {
        return res.status(400).json({ error: "이메일 또는 연락처를 입력해주세요." });
      }
      const record = cmsStore.addCatalogRequest({
        name: String(name).trim(),
        email: String(email || "").trim(),
        phone: String(phone || "").trim(),
        company: String(company || "").trim(),
        message: String(message || "").trim(),
        catalogType: String(catalogType || "Standard Catalog"),
      });
      const ecatalog = cmsStore.getBootstrap().design.ecatalog;
      res.json({
        ...record,
        downloadUrl: ecatalog.pdfUrl,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Contact Inquiry submission
  app.post("/api/inquiries", (req, res) => {
    try {
      const { name, company, phone, email, subject, message } = req.body || {};
      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: "성함/담당자명을 입력해주세요." });
      }
      if (!message || !String(message).trim()) {
        return res.status(400).json({ error: "문의 내용을 입력해주세요." });
      }
      const record = cmsStore.addInquiry({
        name: String(name).trim(),
        company: String(company || "").trim(),
        phone: String(phone || "").trim(),
        email: String(email || "").trim(),
        subject: String(subject || "제품 및 견적 문의").trim(),
        message: String(message).trim(),
      });
      res.json(record);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Customer Order attachment upload (PDF, CAD drawings, Excel, data files — up to 50MB)
  app.post("/api/upload/order-attachment", async (req, res) => {
    try {
      const uploaded = await streamUploadToDisk(
        req,
        "orders",
        ORDER_ALLOWED_EXTS,
        50 * 1024 * 1024,
      );
      res.json({
        name: uploaded.originalName,
        url: uploaded.url,
        size: uploaded.size,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // EGDesk My DB status & buyer profile sync (/order)
  app.get("/api/egdesk/status", async (_req, res) => {
    const status = await getEgdeskStatus();
    res.json(status);
  });

  app.get("/api/buyer-profiles", async (_req, res) => {
    const result = await listBuyersFromEgdesk();
    res.json(result);
  });

  app.post("/api/buyer-profiles", async (req, res) => {
    const {
      companyName,
      contactName,
      phone,
      email,
      deliveryAddress,
      shippingMethod,
    } = req.body || {};

    if (!companyName || !String(companyName).trim()) {
      return res.status(400).json({ error: "업체명을 입력해주세요." });
    }

    const result = await upsertBuyerInEgdesk({
      companyName: String(companyName),
      contactName: String(contactName || ""),
      phone: String(phone || ""),
      email: String(email || ""),
      deliveryAddress: String(deliveryAddress || ""),
      shippingMethod,
    });
    res.json(result);
  });

  app.delete("/api/buyer-profiles/:id", async (req, res) => {
    const result = await deleteBuyerFromEgdesk(req.params.id);
    res.json(result);
  });

  // --- B2B Partner Directory & Authentication Log Endpoints ---
  app.get("/api/b2b/companies", (_req, res) => {
    res.json(b2bStore.listCompanies());
  });

  app.get("/api/b2b/resolve-phone", (req, res) => {
    const phone = String(req.query.phone || "");
    const found = b2bStore.findCompanyByPhone(phone);
    res.json(found || { matched: false });
  });

  app.post("/api/auth/log", (req, res) => {
    const { companyName, contactName, phone, loginMethod, status } = req.body || {};
    if (!phone) {
      return res.status(400).json({ error: "전화번호가 필요합니다." });
    }
    const log = b2bStore.recordAuthLog({
      companyName: String(companyName || "미확인 업체"),
      contactName: String(contactName || "담당자"),
      phone: String(phone),
      loginMethod: String(loginMethod || "biz_phone"),
      status: status === "fail" ? "fail" : "success",
    });
    res.json({ success: true, log });
  });

  app.get("/api/admin/b2b-companies", requireAdmin, (_req, res) => {
    res.json(b2bStore.listCompanies());
  });

  app.post("/api/admin/b2b-companies", requireAdmin, (req, res) => {
    const { companyName, bizNumber, deliveryAddress, shippingMethod, memo, staffContacts, id } = req.body || {};
    if (!companyName || !String(companyName).trim()) {
      return res.status(400).json({ error: "업체명을 입력해 주세요." });
    }
    const saved = b2bStore.upsertCompany({
      id,
      companyName: String(companyName),
      bizNumber: String(bizNumber || "123-45-67890"),
      deliveryAddress: String(deliveryAddress || ""),
      shippingMethod,
      memo: String(memo || ""),
      staffContacts: Array.isArray(staffContacts) ? staffContacts : [],
    });
    res.json({ success: true, company: saved });
  });

  app.delete("/api/admin/b2b-companies/:id", requireAdmin, (req, res) => {
    const deleted = b2bStore.deleteCompany(req.params.id);
    res.json({ success: deleted });
  });

  app.post("/api/admin/b2b-companies/:id/phones", requireAdmin, (req, res) => {
    const { name, phone, role, isPrimary } = req.body || {};
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ error: "전화번호를 입력해 주세요." });
    }
    const updated = b2bStore.addStaffPhone(req.params.id, {
      name: String(name || "담당자"),
      phone: String(phone),
      role: String(role || "담당자"),
      isPrimary: !!isPrimary,
    });
    if (!updated) {
      return res.status(404).json({ error: "업체를 찾을 수 없습니다." });
    }
    res.json({ success: true, company: updated });
  });

  app.delete("/api/admin/b2b-companies/:id/phones/:phoneId", requireAdmin, (req, res) => {
    const updated = b2bStore.removeStaffPhone(req.params.id, req.params.phoneId);
    if (!updated) {
      return res.status(404).json({ error: "업체를 찾을 수 없습니다." });
    }
    res.json({ success: true, company: updated });
  });

  app.get("/api/admin/auth-logs", requireAdmin, (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    res.json(b2bStore.listAuthLogs(limit));
  });

  app.post("/api/admin/b2b-sync-egdesk", requireAdmin, async (_req, res) => {
    const result = await b2bStore.syncAllToEgdesk();
    res.json(result);
  });

  // Related-parts recommendation read endpoint (Public Read-Only)
  app.get("/api/part-affinity", async (_req, res) => {
    await partAffinityStore.syncCompletedOrders(
      cmsStore.getSubmissions().orders,
      cmsStore.getAllProducts(),
    );
    const snapshot = await partAffinityStore.getSnapshot();
    res.json(snapshot);
  });

  // Admin-only curation endpoints (Protected by requireAdmin — blocks public tampering)
  const handleAdminCurateAffinity = async (req: Request, res: Response) => {
    const { anchorId, targetId, doorType, action } = req.body || {};
    const validActions = new Set([
      "pin",
      "unpin",
      "toggle_pin",
      "exclude",
      "unexclude",
      "toggle_exclude",
      "reset_order_count",
    ]);
    // Map legacy "pin"/"exclude" toggle calls cleanly
    const normalizedAction =
      action === "pin"
        ? "toggle_pin"
        : action === "exclude"
          ? "toggle_exclude"
          : String(action || "");

    if (!anchorId || !targetId || !validActions.has(normalizedAction)) {
      return res.status(400).json({ error: "유효하지 않은 추천 설정 요청입니다." });
    }

    const updated = await partAffinityStore.curateByAdmin({
      anchorId: String(anchorId),
      targetId: String(targetId),
      doorType: doorType === "glass" ? "glass" : "wood",
      action: normalizedAction as any,
    });
    const snapshot = await partAffinityStore.getSnapshot();
    res.json({ updated, ...snapshot });
  };

  app.post("/api/admin/part-affinity/curate", requireAdmin, handleAdminCurateAffinity);
  app.post("/api/part-affinity/event", requireAdmin, handleAdminCurateAffinity);

  const handleAdminResetExclusions = async (req: Request, res: Response) => {
    const { anchorId, doorType } = req.body || {};
    await partAffinityStore.resetAnchorExclusions(
      String(anchorId || ""),
      doorType === "glass" || doorType === "wood" ? doorType : undefined,
    );
    const snapshot = await partAffinityStore.getSnapshot();
    res.json(snapshot);
  };

  app.post(
    "/api/admin/part-affinity/reset-exclusions",
    requireAdmin,
    handleAdminResetExclusions,
  );
  app.post(
    "/api/part-affinity/reset-exclusions",
    requireAdmin,
    handleAdminResetExclusions,
  );

  // Dedicated Purchase Order (/order) submission
  // Note: Unverified customer submissions ("new") are NOT learned immediately;
  // learning runs ONLY when COAS Admin marks the order "completed" (출고확정/처리완료).
  app.post("/api/orders", async (req, res) => {
    try {
      const {
        companyName,
        contactName,
        phone,
        email,
        deliveryAddress,
        desiredDate,
        doorType,
        items,
        attachments,
        memo,
      } = req.body || {};

      if (!companyName || !String(companyName).trim()) {
        return res.status(400).json({ error: "발주 업체명을 입력해주세요." });
      }
      if (!contactName || !String(contactName).trim()) {
        return res.status(400).json({ error: "담당자 성함을 입력해주세요." });
      }
      if (!phone || !String(phone).trim()) {
        return res.status(400).json({ error: "연락처를 입력해주세요." });
      }

      const validItems = Array.isArray(items)
        ? items.filter((i: any) => i && String(i.productName || "").trim())
        : [];
      const validAttachments = Array.isArray(attachments) ? attachments : [];

      if (validItems.length === 0 && validAttachments.length === 0) {
        return res.status(400).json({
          error: "발주 품목을 1개 이상 입력하거나 발주서 파일을 첨부해주세요.",
        });
      }

      const record = cmsStore.addOrder({
        companyName: String(companyName).trim(),
        contactName: String(contactName).trim(),
        phone: String(phone).trim(),
        email: String(email || "").trim(),
        deliveryAddress: String(deliveryAddress || "").trim(),
        desiredDate: String(desiredDate || "").trim(),
        doorType:
          doorType === "glass" || doorType === "wood" ? doorType : undefined,
        items: validItems,
        attachments: validAttachments,
        memo: String(memo || "").trim(),
      });

      const egdeskResult = await syncOrderToEgdesk(record);

      res.json({
        ...record,
        egdeskSynced: egdeskResult.synced,
        affinityLearned: false,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Search endpoint (works with or without OpenAI API key)
  app.post("/api/search", async (req, res) => {
    try {
      const { query, language = "ko" } = req.body || {};
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "검색어를 입력해주세요." });
      }

      const matchedProducts = cmsStore.searchProducts(query);

      if (matchedProducts.length === 0) {
        let aiSuggestion: string | null = null;
        if (openai) {
          try {
            const aiResponse = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: `You are a helpful assistant for E-COAS, an interior hardware company specializing in sliding doors, damping systems, folding doors, rails, and guides. Suggest related search terms in ${language === "ko" ? "Korean" : "English"}.`,
                },
                {
                  role: "user",
                  content: `The user searched for: "${query}" with no exact matches. Suggest related terms.`,
                },
              ],
              max_tokens: 180,
            });
            aiSuggestion = aiResponse.choices[0]?.message?.content || null;
          } catch {
            aiSuggestion = null;
          }
        } else {
          aiSuggestion =
            language === "ko"
              ? "추천 검색어: 슬라이딩, 댐핑(DP-40, DP-60), 원바디(1 Body), SL 레일(SL-3332), 유리도어(GSD), 폴딩도어(FD), 샤워부스, 큐비클"
              : "Try searching for: Sliding Door, DP-40, DP-60, SL Rail, GSD, Folding Door";
        }

        return res.json({
          products: [],
          aiSuggestion,
          query,
          totalResults: 0,
        });
      }

      let aiSummary: string | null = null;
      if (openai) {
        try {
          const productContext = matchedProducts.slice(0, 8).map((p) => ({
            id: p.id,
            name: p.name,
            nameKo: p.nameKo,
            category: p.categoryKo,
            specifications: p.specifications,
            weightCapacity: p.weightCapacity,
          }));
          const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a product assistant for E-COAS interior hardware. Summarize matching products concisely (2 sentences) in ${language === "ko" ? "Korean" : "English"}.`,
              },
              {
                role: "user",
                content: `Query: "${query}"\nMatches:\n${JSON.stringify(productContext)}`,
              },
            ],
            max_tokens: 180,
          });
          aiSummary = aiResponse.choices[0]?.message?.content || null;
        } catch {
          aiSummary = null;
        }
      }

      res.json({
        products: matchedProducts,
        aiSummary,
        query,
        totalResults: matchedProducts.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================
  // 2. Admin Authentication & CMS Management APIs
  // =========================================================

  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body || {};
    if (!password || typeof password !== "string") {
      return res.status(400).json({ error: "비밀번호를 입력해주세요." });
    }
    const token = cmsStore.login(password);
    if (!token) {
      return res.status(401).json({ error: "비밀번호가 일치하지 않습니다." });
    }
    res.json({ token });
  });

  app.post("/api/admin/logout", (req, res) => {
    cmsStore.logout(extractToken(req));
    res.json({ success: true });
  });

  app.get("/api/admin/me", requireAdmin, (_req, res) => {
    res.json({ authenticated: true });
  });

  app.post("/api/admin/change-password", requireAdmin, (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword || String(newPassword).length < 4) {
      return res.status(400).json({ error: "새 비밀번호는 4자 이상이어야 합니다." });
    }
    const ok = cmsStore.changePassword(
      String(currentPassword || ""),
      String(newPassword),
    );
    if (!ok) {
      return res.status(400).json({ error: "현재 비밀번호가 올바르지 않습니다." });
    }
    res.json({ success: true });
  });

  // Admin full overview state
  app.get("/api/admin/overview", requireAdmin, async (_req, res) => {
    const bootstrap = cmsStore.getBootstrap();
    const products = cmsStore.getAllProducts();
    const submissions = cmsStore.getSubmissions();
    const media = cmsStore.getMediaList();
    await partAffinityStore.syncCompletedOrders(submissions.orders, products);
    const affinity = await partAffinityStore.getSnapshot();
    res.json({
      ...bootstrap,
      products,
      submissions,
      media,
      affinity,
    });
  });

  // Admin binary file upload (images, GIFs, PDFs up to 100MB)
  app.post("/api/admin/upload", requireAdmin, async (req, res) => {
    try {
      const folder = String(req.headers["x-upload-folder"] || "general");
      const uploaded = await streamUploadToDisk(
        req,
        folder,
        ADMIN_ALLOWED_EXTS,
        100 * 1024 * 1024,
      );
      const media = cmsStore.addMedia({
        fileName: uploaded.fileName,
        originalName: uploaded.originalName,
        url: uploaded.url,
        folder,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
      });
      res.json({ media, url: uploaded.url });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/admin/media", requireAdmin, (_req, res) => {
    res.json(cmsStore.getMediaList());
  });

  app.delete("/api/admin/media/:id", requireAdmin, (req, res) => {
    const ok = cmsStore.deleteMedia(req.params.id);
    res.json({ success: ok });
  });

  // Design & E-Catalog settings
  app.put("/api/admin/design", requireAdmin, (req, res) => {
    const updated = cmsStore.saveDesign(req.body);
    res.json(updated);
  });

  // New Products CRUD
  app.put("/api/admin/new-products", requireAdmin, (req, res) => {
    const items = Array.isArray(req.body?.items) ? req.body.items : req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "유효하지 않은 신제품 목록입니다." });
    }
    res.json(cmsStore.saveNewProducts(items));
  });

  app.post("/api/admin/new-products/item", requireAdmin, (req, res) => {
    const saved = cmsStore.upsertNewProduct(req.body);
    res.json(saved);
  });

  app.delete("/api/admin/new-products/:id", requireAdmin, (req, res) => {
    res.json({ success: cmsStore.deleteNewProduct(req.params.id) });
  });

  // Parts Index Sections & Sidebar Filters
  app.put("/api/admin/parts-sections", requireAdmin, (req, res) => {
    const sections = Array.isArray(req.body?.sections) ? req.body.sections : req.body;
    if (!Array.isArray(sections)) {
      return res.status(400).json({ error: "유효하지 않은 섹션 데이터입니다." });
    }
    res.json(cmsStore.savePartsSections(sections));
  });

  app.put("/api/admin/sidebar-filters", requireAdmin, (req, res) => {
    const filters = Array.isArray(req.body?.filters) ? req.body.filters : req.body;
    if (!Array.isArray(filters)) {
      return res.status(400).json({ error: "유효하지 않은 필터 데이터입니다." });
    }
    res.json(cmsStore.saveSidebarFilters(filters));
  });

  // Products & Detail Images CRUD
  app.post("/api/admin/products", requireAdmin, (req, res) => {
    const body = req.body || {};
    if (!body.id || !String(body.id).trim()) {
      return res.status(400).json({ error: "제품 ID를 입력해주세요." });
    }
    const saved = cmsStore.upsertProduct({
      ...body,
      id: String(body.id).trim(),
    });
    res.json(saved);
  });

  app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
    res.json({ success: cmsStore.deleteProduct(req.params.id) });
  });

  // Submissions management (orders, inquiries, catalogRequests)
  app.get("/api/admin/submissions", requireAdmin, (_req, res) => {
    res.json(cmsStore.getSubmissions());
  });

  app.patch(
    "/api/admin/submissions/:type/:id",
    requireAdmin,
    async (req, res) => {
      const { type, id } = req.params;
      if (
        type !== "orders" &&
        type !== "inquiries" &&
        type !== "catalogRequests"
      ) {
        return res.status(400).json({ error: "잘못된 분류입니다." });
      }

      const prevOrder =
        type === "orders" ? cmsStore.getOrderById(id) : undefined;
      const ok = cmsStore.updateSubmission(type, id, req.body || {});

      let affinityLearned = false;
      let affinityUnlearned = false;
      let learnedPairsCount = 0;

      if (ok && type === "orders") {
        const updatedOrder = cmsStore.getOrderById(id);
        if (updatedOrder) {
          void syncOrderToEgdesk(updatedOrder);
          const allProducts = cmsStore.getAllProducts();
          if (updatedOrder.status === "completed") {
            const learnRes = await partAffinityStore.learnVerifiedOrder(
              updatedOrder,
              allProducts,
            );
            affinityLearned = learnRes.learned;
            learnedPairsCount = learnRes.pairsCount;
          } else if (prevOrder?.status === "completed") {
            const unlearnRes = await partAffinityStore.unlearnVerifiedOrder(
              prevOrder,
              allProducts,
            );
            affinityUnlearned = unlearnRes.unlearned;
          }
        }
      }

      res.json({
        success: ok,
        affinityLearned,
        affinityUnlearned,
        learnedPairsCount,
      });
    },
  );

  app.delete(
    "/api/admin/submissions/:type/:id",
    requireAdmin,
    async (req, res) => {
      const { type, id } = req.params;
      if (
        type !== "orders" &&
        type !== "inquiries" &&
        type !== "catalogRequests"
      ) {
        return res.status(400).json({ error: "잘못된 분류입니다." });
      }
      const prevOrder =
        type === "orders" ? cmsStore.getOrderById(id) : undefined;
      if (prevOrder?.status === "completed") {
        await partAffinityStore.unlearnVerifiedOrder(
          prevOrder,
          cmsStore.getAllProducts(),
        );
      }
      const ok = cmsStore.deleteSubmission(type, id);
      res.json({ success: ok });
    },
  );

  // Backup & Restore
  app.get("/api/admin/backup", requireAdmin, (_req, res) => {
    res.json(cmsStore.exportBackup());
  });

  app.post("/api/admin/restore", requireAdmin, (req, res) => {
    cmsStore.restoreBackup(req.body || {});
    res.json({ success: true });
  });

  // --- Daily Dispatch & Shipping Management ---
  app.get("/api/admin/dispatch-daily", requireAdmin, async (req, res) => {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const targetDate =
        typeof req.query.date === "string" && req.query.date
          ? req.query.date
          : todayStr;
      const orders = cmsStore.getSubmissions().orders;
      const summary = getDailyDispatchSummary(orders, targetDate);
      res.json(summary);
    } catch (err: any) {
      res
        .status(500)
        .json({ error: err.message || "Failed to load daily dispatch" });
    }
  });

  app.patch("/api/admin/orders/:id/shipping", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updated = cmsStore.updateOrderShipping(id, req.body || {});
      if (!updated) {
        return res.status(404).json({ error: "주문을 찾을 수 없습니다." });
      }
      void syncOrderToEgdesk(updated);
      res.json({ success: true, order: updated });
    } catch (err: any) {
      res
        .status(500)
        .json({ error: err.message || "Failed to update shipping" });
    }
  });

  app.post("/api/admin/orders/batch-shipping", requireAdmin, async (req, res) => {
    try {
      const { orderIds, shippingStatus, shippingCarrier } = req.body || {};
      if (!Array.isArray(orderIds) || !shippingStatus) {
        return res
          .status(400)
          .json({ error: "주문 목록 및 상태가 필요합니다." });
      }
      const results: any[] = [];
      for (const oid of orderIds) {
        const updated = cmsStore.updateOrderShipping(oid, {
          shippingStatus,
          ...(shippingCarrier ? { shippingCarrier } : {}),
        });
        if (updated) {
          results.push(updated);
          void syncOrderToEgdesk(updated);
        }
      }
      res.json({ success: true, count: results.length, orders: results });
    } catch (err: any) {
      res
        .status(500)
        .json({ error: err.message || "Failed to batch update shipping" });
    }
  });

  // --- Account Revenue & Business Analytics ---
  app.get("/api/admin/account-revenue", requireAdmin, async (_req, res) => {
    try {
      const orders = cmsStore.getSubmissions().orders;
      const accounts = getAccountRevenueBreakdown(orders);
      res.json({ accounts, totalCount: accounts.length });
    } catch (err: any) {
      res
        .status(500)
        .json({ error: err.message || "Failed to load account revenue" });
    }
  });

  app.get("/api/admin/revenue-stats", requireAdmin, async (req, res) => {
    try {
      const period = (req.query.period as any) || "monthly";
      const orders = cmsStore.getSubmissions().orders;
      const stats = getRevenueKpiSummary(orders, period);
      res.json(stats);
    } catch (err: any) {
      res
        .status(500)
        .json({ error: err.message || "Failed to load revenue stats" });
    }
  });

  // --- User Manuals & Installation Guides ---
  app.get("/api/manuals", async (_req, res) => {
    try {
      res.json({ manuals: manualsStore.list(false) });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load manuals" });
    }
  });

  app.get("/api/admin/manuals", requireAdmin, async (_req, res) => {
    try {
      res.json({ manuals: manualsStore.list(true) });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load admin manuals" });
    }
  });

  app.post("/api/admin/manuals", requireAdmin, async (req, res) => {
    try {
      const item = req.body;
      if (!item || !item.title || !item.fileUrl) {
        return res.status(400).json({ error: "제목과 파일 URL이 필요합니다." });
      }
      const saved = manualsStore.upsert(item);
      res.json({ success: true, manual: saved });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save manual" });
    }
  });

  app.delete("/api/admin/manuals/:id", requireAdmin, async (req, res) => {
    try {
      const ok = manualsStore.delete(req.params.id);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to delete manual" });
    }
  });

  app.post("/api/manuals/:id/download", async (req, res) => {
    try {
      const count = manualsStore.incrementDownload(req.params.id);
      res.json({ success: true, count });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to increment download" });
    }
  });

  app.post("/api/admin/manuals/upload", requireAdmin, async (req, res) => {
    try {
      const uploaded = await streamUploadToDisk(
        req,
        "manuals",
        ADMIN_ALLOWED_EXTS,
        100 * 1024 * 1024,
      );
      res.json({
        success: true,
        fileUrl: uploaded.url,
        fileName: uploaded.originalName,
        fileSize: uploaded.size,
        mimeType: uploaded.mimeType,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ============================================
  // Inventory / Stock Management Endpoints
  // ============================================

  // Get inventory items and KPI summary
  app.get("/api/admin/inventory", requireAdmin, (_req, res) => {
    try {
      const summary = inventoryStore.getSummary();
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "재고 목록 조회 실패" });
    }
  });

  // Create or add new inventory item
  app.post("/api/admin/inventory", requireAdmin, (req, res) => {
    try {
      const { productName, sku, category, spec, unit, currentStock, safetyStock, unitCost, sellingPrice, warehouseLocation } = req.body;
      if (!productName || typeof productName !== "string") {
        return res.status(400).json({ error: "제품명은 필수 항목입니다." });
      }

      const item = inventoryStore.upsert({
        productName: productName.trim(),
        sku: (sku || "").trim(),
        category: category || "슬라이딩 시스템",
        spec: spec || "",
        unit: unit || "SET",
        currentStock: Number(currentStock) || 0,
        safetyStock: Number(safetyStock) || 10,
        unitCost: Number(unitCost) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        warehouseLocation: warehouseLocation || "A동 1열",
      });

      res.status(201).json({ success: true, item });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "재고 품목 등록 실패" });
    }
  });

  // Update inventory item metadata / safety stock / location
  app.patch("/api/admin/inventory/:id", requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const existing = inventoryStore.getById(id);
      if (!existing) {
        return res.status(404).json({ error: "해당 재고 품목을 찾을 수 없습니다." });
      }

      const updated = inventoryStore.upsert({
        ...req.body,
        id,
        productName: req.body.productName || existing.productName,
      });

      res.json({ success: true, item: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "재고 품목 수정 실패" });
    }
  });

  // Stock adjustment: Inbound (+), Outbound (-), or Physical count Audit
  app.post("/api/admin/inventory/:id/adjust", requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const { type, quantity, reason, operator } = req.body;

      if (!type || !["inbound", "outbound", "adjustment"].includes(type)) {
        return res.status(400).json({ error: "유효한 조정 구분(inbound, outbound, adjustment)이 필요합니다." });
      }

      if (typeof quantity !== "number" || isNaN(quantity)) {
        return res.status(400).json({ error: "유효한 수량을 입력해주세요." });
      }

      const updated = inventoryStore.adjustStock(id, {
        type,
        quantity,
        reason: reason || "",
        operator: operator || "관리자",
      });

      res.json({ success: true, item: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "재고 조정 처리 실패" });
    }
  });

  // Delete inventory item
  app.delete("/api/admin/inventory/:id", requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const success = inventoryStore.delete(id);
      if (!success) {
        return res.status(404).json({ error: "해당 재고 품목이 존재하지 않습니다." });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "재고 품목 삭제 실패" });
    }
  });

  // Dynamic sitemap.xml
  app.get("/sitemap.xml", (_req, res) => {
    const BASE_URL = "https://e-coas.replit.app";
    const staticPages = [
      { url: "/", priority: "1.0", changefreq: "weekly" },
      { url: "/new-products", priority: "0.9", changefreq: "weekly" },
      { url: "/parts-index", priority: "0.8", changefreq: "weekly" },
      { url: "/order", priority: "0.8", changefreq: "monthly" },
      { url: "/about", priority: "0.7", changefreq: "monthly" },
      { url: "/contact", priority: "0.6", changefreq: "monthly" },
    ];
    const allProducts = cmsStore.getAllProducts();
    const today = new Date().toISOString().split("T")[0];
    const urls = [
      ...staticPages.map(
        (p) => `
  <url>
    <loc>${BASE_URL}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
      ),
      ...allProducts.map(
        (p) => `
  <url>
    <loc>${BASE_URL}/product/${p.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
      ),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
    res.setHeader("Content-Type", "application/xml");
    res.send(xml);
  });

  return httpServer;
}
