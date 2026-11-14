import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  defaultDesign,
  defaultNewProducts,
  defaultPartsSections,
  defaultProducts,
  defaultSidebarFilters,
} from "@shared/cms-defaults";
import { productData as extraSeedProducts } from "./seed-products";
import type {
  CatalogRequestRecord,
  CmsBootstrapPayload,
  CmsProduct,
  CmsStoreData,
  InquiryRecord,
  MediaItem,
  NewProductItem,
  OrderRecord,
  PartsSection,
  SidebarFilterCategory,
  SiteDesignSettings,
  SubmissionStatus,
} from "@shared/cms-types";

const PROJECT_ROOT = fs.existsSync(path.join(process.cwd(), "attached_assets"))
  ? process.cwd()
  : path.resolve(process.cwd(), "COAS_HANDOFF", "project");
export const DATA_DIR = path.join(PROJECT_ROOT, "data");
export const UPLOADS_DIR = path.join(PROJECT_ROOT, "uploads");
export const ATTACHED_ASSETS_DIR = path.join(PROJECT_ROOT, "attached_assets");
const STORE_PATH = path.join(DATA_DIR, "cms-store.json");

function hashPassword(password: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, actualSalt, 64).toString("hex");
  return `${actualSalt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, originalHash] = stored.split(":");
  if (!salt || !originalHash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(originalHash, "hex"),
    Buffer.from(candidate, "hex"),
  );
}

function buildInitialProducts(): CmsProduct[] {
  const map = new Map<string, CmsProduct>();
  for (const p of defaultProducts) {
    map.set(p.id, structuredClone(p));
  }
  for (const extra of extraSeedProducts) {
    if (!map.has(extra.id)) {
      map.set(extra.id, {
        id: extra.id,
        name: extra.name,
        nameKo: extra.nameKo,
        category: extra.category,
        categoryKo: extra.categoryKo,
        description: extra.description ?? null,
        descriptionKo: extra.descriptionKo ?? null,
        specifications: extra.specifications ?? null,
        weightCapacity: extra.weightCapacity ?? null,
        pageNumber: extra.pageNumber ?? null,
        imageUrl: extra.imageUrl ?? null,
        detailImages: [],
        searchText:
          extra.searchText ??
          `${extra.name} ${extra.nameKo} ${extra.category} ${extra.categoryKo}`,
      });
    }
  }
  return Array.from(map.values());
}

function createDefaultStore(): CmsStoreData {
  const initialPassword = process.env.ADMIN_PASSWORD || "coas1234";
  return {
    version: 1,
    adminPasswordHash: hashPassword(initialPassword),
    design: structuredClone(defaultDesign),
    products: buildInitialProducts(),
    newProducts: structuredClone(defaultNewProducts),
    partsSections: structuredClone(defaultPartsSections),
    sidebarFilters: structuredClone(defaultSidebarFilters),
    catalogRequests: [],
    inquiries: [],
    orders: [],
    media: [],
  };
}

class CmsStore {
  private state: CmsStoreData;
  private sessions = new Map<string, number>(); // token -> expiresAt ms

  constructor() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    this.state = this.load();
  }

  private load(): CmsStoreData {
    if (fs.existsSync(STORE_PATH)) {
      try {
        const raw = fs.readFileSync(STORE_PATH, "utf-8");
        const parsed = JSON.parse(raw) as CmsStoreData;
        return {
          ...createDefaultStore(),
          ...parsed,
          design: {
            ...structuredClone(defaultDesign),
            ...(parsed.design || {}),
            company: {
              ...defaultDesign.company,
              ...(parsed.design?.company || {}),
            },
            hero: {
              ...defaultDesign.hero,
              ...(parsed.design?.hero || {}),
            },
            ecatalog: {
              ...defaultDesign.ecatalog,
              ...(parsed.design?.ecatalog || {}),
            },
          },
        };
      } catch (err) {
        console.error("[cms-store] Failed to parse store, creating backup and reinitializing:", err);
        fs.copyFileSync(STORE_PATH, `${STORE_PATH}.corrupt.${Date.now()}.bak`);
      }
    }
    const initial = createDefaultStore();
    this.persist(initial);
    return initial;
  }

  private persist(data: CmsStoreData = this.state): void {
    const tmpPath = `${STORE_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tmpPath, STORE_PATH);
  }

  // --- Auth ---
  login(password: string): string | null {
    // Allow env override or stored hash
    const envPwd = process.env.ADMIN_PASSWORD;
    const valid =
      (envPwd && password === envPwd) ||
      verifyPassword(password, this.state.adminPasswordHash);
    if (!valid) return null;
    const token = crypto.randomBytes(32).toString("hex");
    this.sessions.set(token, Date.now() + 1000 * 60 * 60 * 24); // 24h
    return token;
  }

  verifyToken(token: string | undefined): boolean {
    if (!token) return false;
    const exp = this.sessions.get(token);
    if (!exp) return false;
    if (Date.now() > exp) {
      this.sessions.delete(token);
      return false;
    }
    return true;
  }

  logout(token: string | undefined): void {
    if (token) this.sessions.delete(token);
  }

  changePassword(currentPassword: string, newPassword: string): boolean {
    const envPwd = process.env.ADMIN_PASSWORD;
    const valid =
      (envPwd && currentPassword === envPwd) ||
      verifyPassword(currentPassword, this.state.adminPasswordHash);
    if (!valid) return false;
    this.state.adminPasswordHash = hashPassword(newPassword);
    this.persist();
    return true;
  }

  // --- Public Bootstrap ---
  getBootstrap(): CmsBootstrapPayload {
    return {
      design: this.state.design,
      newProducts: [...this.state.newProducts].sort((a, b) => a.order - b.order),
      partsSections: [...this.state.partsSections].sort((a, b) => a.order - b.order),
      sidebarFilters: this.state.sidebarFilters,
    };
  }

  // --- Design ---
  saveDesign(design: SiteDesignSettings): SiteDesignSettings {
    this.state.design = design;
    this.persist();
    return this.state.design;
  }

  // --- Products ---
  getAllProducts(): CmsProduct[] {
    return this.state.products;
  }

  getProductById(id: string): CmsProduct | undefined {
    const exact = this.state.products.find((p) => p.id === id);
    if (exact) return exact;
    if (id.endsWith("-wide")) {
      const baseId = id.replace(/-wide$/, "");
      return this.state.products.find((p) => p.id === baseId);
    }
    return undefined;
  }

  searchProducts(query: string): CmsProduct[] {
    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length === 0) return [];
    return this.state.products.filter((p) => {
      const hay = [
        p.id,
        p.name,
        p.nameKo,
        p.category,
        p.categoryKo,
        p.description,
        p.descriptionKo,
        p.specifications,
        p.weightCapacity,
        p.pageNumber,
        p.searchText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return tokens.some((tok) => hay.includes(tok));
    });
  }

  upsertProduct(product: CmsProduct): CmsProduct {
    const idx = this.state.products.findIndex((p) => p.id === product.id);
    const normalized: CmsProduct = {
      ...product,
      detailImages: Array.isArray(product.detailImages) ? product.detailImages : [],
      searchText:
        product.searchText ||
        `${product.name} ${product.nameKo} ${product.category} ${product.categoryKo} ${product.specifications || ""}`,
    };
    if (idx >= 0) {
      this.state.products[idx] = normalized;
    } else {
      this.state.products.unshift(normalized);
    }
    this.persist();
    return normalized;
  }

  deleteProduct(id: string): boolean {
    const before = this.state.products.length;
    this.state.products = this.state.products.filter((p) => p.id !== id);
    if (this.state.products.length !== before) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- New Products ---
  getNewProducts(): NewProductItem[] {
    return [...this.state.newProducts].sort((a, b) => a.order - b.order);
  }

  saveNewProducts(items: NewProductItem[]): NewProductItem[] {
    this.state.newProducts = items.map((item, idx) => ({
      ...item,
      order: idx,
    }));
    this.persist();
    return this.getNewProducts();
  }

  upsertNewProduct(item: NewProductItem): NewProductItem {
    const idx = this.state.newProducts.findIndex((x) => x.id === item.id);
    if (idx >= 0) {
      this.state.newProducts[idx] = item;
    } else {
      item.order = this.state.newProducts.length;
      this.state.newProducts.push(item);
    }
    this.persist();
    return item;
  }

  deleteNewProduct(id: string): boolean {
    const before = this.state.newProducts.length;
    this.state.newProducts = this.state.newProducts
      .filter((x) => x.id !== id)
      .map((x, idx) => ({ ...x, order: idx }));
    if (this.state.newProducts.length !== before) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- Parts Index & Sidebar Filters ---
  savePartsSections(sections: PartsSection[]): PartsSection[] {
    this.state.partsSections = sections.map((sec, idx) => ({
      ...sec,
      order: idx,
    }));
    this.persist();
    return this.state.partsSections;
  }

  saveSidebarFilters(filters: SidebarFilterCategory[]): SidebarFilterCategory[] {
    this.state.sidebarFilters = filters;
    this.persist();
    return this.state.sidebarFilters;
  }

  // --- Submissions ---
  addCatalogRequest(data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message?: string;
    catalogType: string;
  }): CatalogRequestRecord {
    const record: CatalogRequestRecord = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      phone: data.phone || "",
      company: data.company || "",
      message: data.message || "",
      catalogType: data.catalogType,
      status: "new",
      adminMemo: "",
      createdAt: new Date().toISOString(),
    };
    this.state.catalogRequests.unshift(record);
    this.persist();
    return record;
  }

  addInquiry(data: {
    name: string;
    company?: string;
    phone?: string;
    email: string;
    subject: string;
    message: string;
  }): InquiryRecord {
    const record: InquiryRecord = {
      id: crypto.randomUUID(),
      name: data.name,
      company: data.company || "",
      phone: data.phone || "",
      email: data.email,
      subject: data.subject,
      message: data.message,
      status: "new",
      adminMemo: "",
      createdAt: new Date().toISOString(),
    };
    this.state.inquiries.unshift(record);
    this.persist();
    return record;
  }

  addOrder(data: Omit<OrderRecord, "id" | "orderNumber" | "status" | "adminMemo" | "createdAt">): OrderRecord {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const seq = String(this.state.orders.length + 1).padStart(3, "0");
    const record: OrderRecord = {
      ...data,
      id: crypto.randomUUID(),
      orderNumber: `ORD-${datePart}-${seq}`,
      status: "new",
      adminMemo: "",
      createdAt: new Date().toISOString(),
    };
    this.state.orders.unshift(record);
    this.persist();
    return record;
  }

  getSubmissions() {
    return {
      orders: this.state.orders,
      inquiries: this.state.inquiries,
      catalogRequests: this.state.catalogRequests,
    };
  }

  getOrderById(id: string): OrderRecord | undefined {
    const target = this.state.orders.find((o) => o.id === id);
    return target ? structuredClone(target) : undefined;
  }

  updateSubmission(
    type: "orders" | "inquiries" | "catalogRequests",
    id: string,
    patch: { status?: SubmissionStatus; adminMemo?: string },
  ): boolean {
    const list = this.state[type] as Array<{
      id: string;
      status: SubmissionStatus;
      adminMemo: string;
    }>;
    const target = list.find((item) => item.id === id);
    if (!target) return false;
    if (patch.status) target.status = patch.status;
    if (patch.adminMemo !== undefined) target.adminMemo = patch.adminMemo;
    this.persist();
    return true;
  }

  deleteSubmission(
    type: "orders" | "inquiries" | "catalogRequests",
    id: string,
  ): boolean {
    const before = this.state[type].length;
    (this.state[type] as Array<{ id: string }>) = (
      this.state[type] as Array<{ id: string }>
    ).filter((item) => item.id !== id);
    if (this.state[type].length !== before) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- Media ---
  addMedia(item: Omit<MediaItem, "id" | "createdAt">): MediaItem {
    const media: MediaItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.state.media.unshift(media);
    this.persist();
    return media;
  }

  getMediaList(): MediaItem[] {
    const builtinItems: MediaItem[] = [];
    const walk = (dir: string, prefix = "") => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walk(path.join(dir, entry.name), rel);
        } else if (/\.(png|jpe?g|gif|webp|svg|pdf)$/i.test(entry.name)) {
          const ext = path.extname(entry.name).toLowerCase();
          builtinItems.push({
            id: `asset-${rel}`,
            fileName: entry.name,
            originalName: entry.name,
            url: `/attached_assets/${rel}`,
            folder: prefix || "기본 내장 자산",
            mimeType: ext === ".pdf" ? "application/pdf" : `image/${ext.slice(1)}`,
            size: 0,
            createdAt: "",
          });
        }
      }
    };
    walk(ATTACHED_ASSETS_DIR);
    return [...this.state.media, ...builtinItems];
  }

  deleteMedia(id: string): boolean {
    const idx = this.state.media.findIndex((m) => m.id === id);
    if (idx < 0) return false;
    const [removed] = this.state.media.splice(idx, 1);
    const diskPath = path.join(UPLOADS_DIR, removed.folder, removed.fileName);
    if (fs.existsSync(diskPath)) {
      try {
        fs.unlinkSync(diskPath);
      } catch {
        // ignore unlink errors
      }
    }
    this.persist();
    return true;
  }

  // --- Backup & Restore ---
  exportBackup(): Omit<CmsStoreData, "adminPasswordHash"> {
    const { adminPasswordHash: _ignored, ...safe } = this.state;
    return safe;
  }

  restoreBackup(payload: Partial<CmsStoreData>): void {
    const currentHash = this.state.adminPasswordHash;
    const defaults = createDefaultStore();
    this.state = {
      ...defaults,
      ...payload,
      adminPasswordHash: currentHash,
    };
    this.persist();
  }
}

export const cmsStore = new CmsStore();
