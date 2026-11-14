import fs from "fs";
import path from "path";
import type { OrderRecord, PartAffinityRecord } from "../shared/cms-types";

export interface EgdeskBuyerProfile {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  shippingMethod: "화물" | "택배" | "방문수령";
  updatedAt: string;
  useCount: number;
}

interface EgdeskConnectionConfig {
  apiUrl: string;
  apiKey: string;
  projectId: string;
  env: string;
}

const EGDESK_ORDERS_TABLE = "coas_orders";
const EGDESK_BUYERS_TABLE = "coas_buyers";
const EGDESK_AFFINITY_TABLE = "coas_part_affinity";

function parseEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return result;
  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx <= 0) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

function loadEgdeskConfig(): EgdeskConnectionConfig | null {
  const workspaceRoot = path.resolve(process.cwd(), "..", "..");
  const envFromFiles = {
    ...parseEnvFile(path.join(workspaceRoot, ".env.local")),
    ...parseEnvFile(path.join(workspaceRoot, ".env.development.local")),
  };

  const apiUrl = (
    process.env.EGDESK_MCP_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_EGDESK_API_URL ||
    envFromFiles.NEXT_PUBLIC_EGDESK_API_URL ||
    "http://localhost:8080"
  ).replace(/\/$/, "");

  const apiKey =
    process.env.EGDESK_API_KEY ||
    process.env.NEXT_PUBLIC_EGDESK_API_KEY ||
    envFromFiles.NEXT_PUBLIC_EGDESK_API_KEY ||
    "";

  const projectId =
    process.env.EGDESK_PROJECT_ID ||
    process.env.NEXT_PUBLIC_EGDESK_PROJECT_ID ||
    envFromFiles.NEXT_PUBLIC_EGDESK_PROJECT_ID ||
    "";

  const env =
    process.env.EGDESK_ENV ||
    process.env.NEXT_PUBLIC_EGDESK_ENV ||
    envFromFiles.NEXT_PUBLIC_EGDESK_ENV ||
    "development";

  if (!apiUrl || !apiKey || !projectId) {
    return null;
  }

  return { apiUrl, apiKey, projectId, env };
}

async function callEgdeskUserDataTool(
  toolName: string,
  args: Record<string, any> = {},
): Promise<any> {
  const cfg = loadEgdeskConfig();
  if (!cfg) {
    throw new Error("EGDesk credentials not configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(`${cfg.apiUrl}/user-data/tools/call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": cfg.apiKey,
        "X-EGDesk-Project-Id": cfg.projectId,
        "X-EGDesk-Env": cfg.env,
      },
      body: JSON.stringify({ tool: toolName, arguments: args }),
      signal: controller.signal,
    });

    const payload: any = await res.json().catch(() => null);
    if (!res.ok || !payload || payload.success !== true) {
      const errMsg =
        payload?.error ||
        payload?.message ||
        `HTTP ${res.status} calling ${toolName}`;
      throw new Error(String(errMsg));
    }

    const text = payload.result?.content?.[0]?.text;
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

let ensureTablesPromise: Promise<boolean> | null = null;

export async function ensureCoasTables(): Promise<boolean> {
  if (ensureTablesPromise) {
    return ensureTablesPromise;
  }

  ensureTablesPromise = (async () => {
    try {
      const listRes = await callEgdeskUserDataTool("user_data_list_tables", {});
      const tables: Array<{ tableName?: string }> = Array.isArray(listRes?.tables)
        ? listRes.tables
        : [];
      const existing = new Set(tables.map((t) => t.tableName).filter(Boolean));

      if (!existing.has(EGDESK_ORDERS_TABLE)) {
        await callEgdeskUserDataTool("user_data_create_table", {
          tableName: EGDESK_ORDERS_TABLE,
          displayName: "COAS 발주서 접수",
          description: "COAS 온라인 발주서 접수 내역",
          uniqueKeyColumns: ["order_id"],
          duplicateAction: "update",
          schema: [
            { name: "order_id", type: "TEXT", notNull: true },
            { name: "order_number", type: "TEXT", notNull: true },
            { name: "company_name", type: "TEXT", notNull: true },
            { name: "contact_name", type: "TEXT", notNull: true },
            { name: "phone", type: "TEXT", notNull: true },
            { name: "email", type: "TEXT" },
            { name: "delivery_address", type: "TEXT" },
            { name: "desired_date", type: "TEXT" },
            { name: "item_count", type: "INTEGER", defaultValue: 0 },
            { name: "items_json", type: "TEXT" },
            { name: "memo", type: "TEXT" },
            { name: "status", type: "TEXT", defaultValue: "new" },
            { name: "created_at", type: "TEXT", notNull: true },
          ],
        });
      }

      if (!existing.has(EGDESK_BUYERS_TABLE)) {
        await callEgdeskUserDataTool("user_data_create_table", {
          tableName: EGDESK_BUYERS_TABLE,
          displayName: "COAS 거래처 프로필",
          description: "COAS 발주처(내 거래처) 저장 프로필 목록",
          uniqueKeyColumns: ["buyer_key"],
          duplicateAction: "update",
          schema: [
            { name: "buyer_key", type: "TEXT", notNull: true },
            { name: "profile_id", type: "TEXT", notNull: true },
            { name: "company_name", type: "TEXT", notNull: true },
            { name: "contact_name", type: "TEXT" },
            { name: "phone", type: "TEXT" },
            { name: "email", type: "TEXT" },
            { name: "delivery_address", type: "TEXT" },
            { name: "shipping_method", type: "TEXT", defaultValue: "화물" },
            { name: "use_count", type: "INTEGER", defaultValue: 1 },
            { name: "updated_at", type: "TEXT", notNull: true },
          ],
        });
      }

      if (!existing.has(EGDESK_AFFINITY_TABLE)) {
        await callEgdeskUserDataTool("user_data_create_table", {
          tableName: EGDESK_AFFINITY_TABLE,
          displayName: "COAS 연관부품 학습",
          description: "COAS 발주서 롤러-부속품 누적 학습 가중치 테이블",
          uniqueKeyColumns: ["pair_key"],
          duplicateAction: "update",
          schema: [
            { name: "pair_key", type: "TEXT", notNull: true },
            { name: "anchor_id", type: "TEXT", notNull: true },
            { name: "target_id", type: "TEXT", notNull: true },
            { name: "door_type", type: "TEXT", notNull: true },
            { name: "cart_count", type: "INTEGER", defaultValue: 0 },
            { name: "order_count", type: "INTEGER", defaultValue: 0 },
            { name: "pinned", type: "INTEGER", defaultValue: 0 },
            { name: "excluded", type: "INTEGER", defaultValue: 0 },
            { name: "updated_at", type: "TEXT", notNull: true },
          ],
        });
      }

      return true;
    } catch {
      ensureTablesPromise = null;
      return false;
    }
  })();

  return ensureTablesPromise;
}

export async function getEgdeskStatus(): Promise<{
  connected: boolean;
  apiUrl: string;
  projectId: string;
  tables: string[];
}> {
  const cfg = loadEgdeskConfig();
  if (!cfg) {
    return { connected: false, apiUrl: "", projectId: "", tables: [] };
  }
  try {
    await ensureCoasTables();
    const listRes = await callEgdeskUserDataTool("user_data_list_tables", {});
    const tables: string[] = Array.isArray(listRes?.tables)
      ? listRes.tables
          .map((t: any) => String(t?.tableName || ""))
          .filter(Boolean)
      : [];
    return {
      connected: true,
      apiUrl: cfg.apiUrl,
      projectId: cfg.projectId,
      tables,
    };
  } catch {
    return {
      connected: false,
      apiUrl: cfg.apiUrl,
      projectId: cfg.projectId,
      tables: [],
    };
  }
}

export async function syncOrderToEgdesk(
  record: OrderRecord,
): Promise<{ synced: boolean; error?: string }> {
  try {
    const ready = await ensureCoasTables();
    if (!ready) {
      return { synced: false, error: "EGDesk gateway unavailable" };
    }

    await callEgdeskUserDataTool("user_data_insert_rows", {
      tableName: EGDESK_ORDERS_TABLE,
      rows: [
        {
          order_id: record.id,
          order_number: record.orderNumber,
          company_name: record.companyName,
          contact_name: record.contactName,
          phone: record.phone,
          email: record.email || "",
          delivery_address: record.deliveryAddress || "",
          desired_date: record.desiredDate || "",
          item_count: Array.isArray(record.items) ? record.items.length : 0,
          items_json: JSON.stringify(record.items || []),
          memo: record.memo || "",
          status: record.status || "new",
          created_at: record.createdAt,
        },
      ],
    });
    return { synced: true };
  } catch (err: any) {
    return { synced: false, error: err?.message || "Sync failed" };
  }
}

function makeBuyerKey(companyName: string, phone: string): string {
  const cleanCompany = companyName.trim().toLowerCase();
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  return `${cleanCompany}::${cleanPhone}`;
}

function mapRowToBuyerProfile(row: Record<string, any>): EgdeskBuyerProfile | null {
  const companyName = String(row.company_name || "").trim();
  if (!companyName) return null;
  const method = String(row.shipping_method || "화물");
  const shippingMethod: "화물" | "택배" | "방문수령" =
    method === "택배" || method === "방문수령" ? method : "화물";

  return {
    id: String(row.profile_id || row.buyer_key || `eg_${row.id || Date.now()}`),
    companyName,
    contactName: String(row.contact_name || ""),
    phone: String(row.phone || ""),
    email: String(row.email || ""),
    deliveryAddress: String(row.delivery_address || ""),
    shippingMethod,
    updatedAt: String(row.updated_at || new Date().toISOString()),
    useCount: Number(row.use_count) > 0 ? Number(row.use_count) : 1,
  };
}

export async function listBuyersFromEgdesk(): Promise<{
  connected: boolean;
  buyers: EgdeskBuyerProfile[];
}> {
  try {
    const ready = await ensureCoasTables();
    if (!ready) return { connected: false, buyers: [] };
    const res = await callEgdeskUserDataTool("user_data_query", {
      tableName: EGDESK_BUYERS_TABLE,
      limit: 100,
      orderBy: "updated_at",
      orderDirection: "DESC",
    });
    const rawRows: Array<Record<string, any>> = Array.isArray(res?.rows)
      ? res.rows
      : Array.isArray(res?.data)
        ? res.data
        : [];
    const buyers = rawRows
      .map(mapRowToBuyerProfile)
      .filter((x): x is EgdeskBuyerProfile => Boolean(x));
    return { connected: true, buyers };
  } catch {
    return { connected: false, buyers: [] };
  }
}

export async function upsertBuyerInEgdesk(input: {
  companyName: string;
  contactName?: string;
  phone?: string;
  email?: string;
  deliveryAddress?: string;
  shippingMethod?: "화물" | "택배" | "방문수령";
}): Promise<{ synced: boolean; buyers: EgdeskBuyerProfile[] }> {
  const companyName = String(input.companyName || "").trim();
  if (!companyName) {
    return { synced: false, buyers: [] };
  }
  const contactName = String(input.contactName || "").trim();
  const phone = String(input.phone || "").trim();
  const email = String(input.email || "").trim();
  const deliveryAddress = String(input.deliveryAddress || "").trim();
  const shippingMethod: "화물" | "택배" | "방문수령" =
    input.shippingMethod === "택배" || input.shippingMethod === "방문수령"
      ? input.shippingMethod
      : "화물";

  try {
    const ready = await ensureCoasTables();
    if (!ready) return { synced: false, buyers: [] };

    const buyerKey = makeBuyerKey(companyName, phone);
    const existingRes = await callEgdeskUserDataTool("user_data_query", {
      tableName: EGDESK_BUYERS_TABLE,
      filters: { buyer_key: buyerKey },
      limit: 1,
    });
    const prevRow: Record<string, any> | undefined =
      existingRes?.rows?.[0] || existingRes?.data?.[0];

    const now = new Date().toISOString();
    const row = {
      buyer_key: buyerKey,
      profile_id:
        String(prevRow?.profile_id || "").trim() ||
        `bp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      company_name: companyName,
      contact_name: contactName || String(prevRow?.contact_name || ""),
      phone: phone || String(prevRow?.phone || ""),
      email: email || String(prevRow?.email || ""),
      delivery_address:
        deliveryAddress || String(prevRow?.delivery_address || ""),
      shipping_method:
        shippingMethod || String(prevRow?.shipping_method || "화물"),
      use_count: (Number(prevRow?.use_count) || 0) + 1,
      updated_at: now,
    };

    await callEgdeskUserDataTool("user_data_insert_rows", {
      tableName: EGDESK_BUYERS_TABLE,
      rows: [row],
    });

    const listed = await listBuyersFromEgdesk();
    return { synced: true, buyers: listed.buyers };
  } catch {
    return { synced: false, buyers: [] };
  }
}

export async function deleteBuyerFromEgdesk(
  profileId: string,
): Promise<{ synced: boolean }> {
  const cleanId = String(profileId || "").trim();
  if (!cleanId) return { synced: false };

  try {
    const ready = await ensureCoasTables();
    if (!ready) return { synced: false };
    await callEgdeskUserDataTool("user_data_delete_rows", {
      tableName: EGDESK_BUYERS_TABLE,
      filters: { profile_id: cleanId },
    });
    return { synced: true };
  } catch {
    return { synced: false };
  }
}

export async function syncAffinityRowsToEgdesk(
  records: PartAffinityRecord[],
): Promise<boolean> {
  if (!records.length) return true;
  try {
    const ready = await ensureCoasTables();
    if (!ready) return false;
    await callEgdeskUserDataTool("user_data_insert_rows", {
      tableName: EGDESK_AFFINITY_TABLE,
      rows: records.map((r) => ({
        pair_key: r.pairKey,
        anchor_id: r.anchorId,
        target_id: r.targetId,
        door_type: r.doorType,
        cart_count: r.cartCount,
        order_count: r.orderCount,
        pinned: r.pinned ? 1 : 0,
        excluded: r.excluded ? 1 : 0,
        updated_at: r.updatedAt,
      })),
    });
    return true;
  } catch {
    return false;
  }
}

export async function loadAffinityRowsFromEgdesk(): Promise<{
  connected: boolean;
  records: PartAffinityRecord[];
}> {
  try {
    const ready = await ensureCoasTables();
    if (!ready) return { connected: false, records: [] };
    const res = await callEgdeskUserDataTool("user_data_query", {
      tableName: EGDESK_AFFINITY_TABLE,
      limit: 1000,
      orderBy: "updated_at",
      orderDirection: "DESC",
    });
    const rawRows: Array<Record<string, any>> = Array.isArray(res?.rows)
      ? res.rows
      : Array.isArray(res?.data)
        ? res.data
        : [];
    const records: PartAffinityRecord[] = rawRows
      .filter((row) => row.pair_key && row.anchor_id && row.target_id)
      .map((row) => ({
        pairKey: String(row.pair_key),
        anchorId: String(row.anchor_id),
        targetId: String(row.target_id),
        doorType: row.door_type === "glass" ? "glass" : "wood",
        cartCount: Math.max(0, Number(row.cart_count) || 0),
        orderCount: Math.max(0, Number(row.order_count) || 0),
        pinned: Boolean(Number(row.pinned)),
        excluded: Boolean(Number(row.excluded)),
        updatedAt: String(row.updated_at || new Date().toISOString()),
      }));
    return { connected: true, records };
  } catch {
    return { connected: false, records: [] };
  }
}
