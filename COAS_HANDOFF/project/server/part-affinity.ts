import fs from "fs";
import path from "path";
import type {
  AdminAffinityAction,
  CmsProduct,
  DoorMaterialType,
  OrderLineItem,
  OrderRecord,
  PartAffinityRecord,
  PartAffinitySnapshot,
} from "../shared/cms-types";
import { DATA_DIR } from "./cms-store";
import {
  loadAffinityRowsFromEgdesk,
  syncAffinityRowsToEgdesk,
} from "./egdesk-sync";

interface AffinityStoreState {
  totalLearnedOrders: number;
  learnedOrderIds: string[];
  records: Record<string, PartAffinityRecord>;
}

const AFFINITY_FILE = path.join(DATA_DIR, "part-affinity.json");

const ANCHOR_CATEGORIES = new Set([
  "슬라이딩도어",
  "댐핑",
  "유리슬라이딩도어",
  "유리댐핑도어",
  "폴딩도어",
  "무빙슬라이딩도어",
  "YL 시리즈",
  "WSD 시리즈",
]);

function isServerAnchorProduct(p?: CmsProduct, rawName = ""): boolean {
  if (p && ANCHOR_CATEGORIES.has(p.categoryKo)) {
    return true;
  }
  const hay = `${p?.name || ""} ${p?.nameKo || ""} ${rawName}`.toUpperCase();
  if (
    hay.includes("SL-") ||
    hay.includes("레일") ||
    hay.includes("가이드") ||
    hay.includes("SD-01") ||
    hay.includes("SD-02") ||
    hay.includes("CS-") ||
    hay.includes("TB-") ||
    hay.includes("커버")
  ) {
    return false;
  }
  return (
    hay.includes("(SD)") ||
    hay.includes("(GSD)") ||
    hay.includes("(GDP)") ||
    hay.includes("(FD)") ||
    hay.includes("(MSD)") ||
    hay.includes("DP-") ||
    hay.includes("1 BODY") ||
    hay.includes("원바디") ||
    hay.includes("M-80") ||
    hay.includes("WSD-") ||
    hay.includes("YL-")
  );
}

function inferDoorTypeFromProduct(
  p?: CmsProduct,
  rawName = "",
): DoorMaterialType {
  const hay = `${p?.categoryKo || ""} ${p?.name || ""} ${p?.nameKo || ""} ${rawName}`.toUpperCase();
  if (hay.includes("GSD") || hay.includes("GDP") || hay.includes("유리")) {
    return "glass";
  }
  return "wood";
}

function resolveProductForLineItem(
  it: OrderLineItem,
  byId: Map<string, CmsProduct>,
  allProducts: CmsProduct[],
): CmsProduct | undefined {
  if (it.productId && byId.has(it.productId)) {
    return byId.get(it.productId);
  }
  const raw = String(it.productName || "").trim();
  if (!raw) return undefined;
  const upperRaw = raw.toUpperCase();
  const codeHead = upperRaw.split(/\s+\(/)[0]?.trim() || upperRaw;

  return (
    allProducts.find((p) => p.name.toUpperCase() === codeHead) ||
    allProducts.find(
      (p) =>
        upperRaw === p.name.toUpperCase() ||
        upperRaw.startsWith(`${p.name.toUpperCase()} (`) ||
        upperRaw === p.nameKo.toUpperCase(),
    )
  );
}

export function makeAffinityKey(
  anchorId: string,
  doorType: DoorMaterialType,
  targetId: string,
): string {
  return `${anchorId}::${doorType}::${targetId}`;
}

class PartAffinityStore {
  private state: AffinityStoreState = {
    totalLearnedOrders: 0,
    learnedOrderIds: [],
    records: {},
  };
  private hydratedFromEgdesk = false;

  constructor() {
    this.loadLocal();
  }

  private loadLocal() {
    try {
      if (fs.existsSync(AFFINITY_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(AFFINITY_FILE, "utf8"));
        if (parsed && typeof parsed === "object") {
          const learnedIds = Array.isArray(parsed.learnedOrderIds)
            ? parsed.learnedOrderIds
                .map((x: unknown) => String(x || "").trim())
                .filter(Boolean)
            : [];
          this.state.learnedOrderIds = Array.from(new Set(learnedIds));
          this.state.totalLearnedOrders = Math.max(
            this.state.learnedOrderIds.length,
            Number(parsed.totalLearnedOrders) || 0,
          );
          if (parsed.records && typeof parsed.records === "object") {
            this.state.records = parsed.records;
          }
        }
      }
    } catch {
      // ignore corrupted file, start clean
    }
  }

  private persistLocal() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(
        AFFINITY_FILE,
        JSON.stringify(this.state, null, 2),
        "utf8",
      );
    } catch {
      // ignore disk write issues
    }
  }

  async hydrateFromEgdeskOnce(): Promise<boolean> {
    if (this.hydratedFromEgdesk) return true;
    const remote = await loadAffinityRowsFromEgdesk();
    if (!remote.connected) return false;
    this.hydratedFromEgdesk = true;

    let changed = false;
    for (const row of remote.records) {
      const local = this.state.records[row.pairKey];
      if (
        !local ||
        row.orderCount > local.orderCount ||
        row.updatedAt > local.updatedAt
      ) {
        this.state.records[row.pairKey] = {
          pairKey: row.pairKey,
          anchorId: row.anchorId,
          targetId: row.targetId,
          doorType: row.doorType,
          cartCount: Math.max(local?.cartCount || 0, row.cartCount),
          orderCount: Math.max(local?.orderCount || 0, row.orderCount),
          pinned: row.pinned ?? local?.pinned ?? false,
          excluded: row.excluded ?? local?.excluded ?? false,
          updatedAt: row.updatedAt,
        };
        changed = true;
      }
    }
    if (changed) {
      this.persistLocal();
    }
    return true;
  }

  hasLearnedOrder(orderId: string): boolean {
    return this.state.learnedOrderIds.includes(String(orderId || "").trim());
  }

  async getSnapshot(): Promise<PartAffinitySnapshot> {
    const connected = await this.hydrateFromEgdeskOnce();
    return {
      connected,
      totalLearnedOrders: Math.max(
        this.state.learnedOrderIds.length,
        this.state.totalLearnedOrders,
      ),
      learnedOrderIds: [...this.state.learnedOrderIds],
      records: Object.values(this.state.records),
    };
  }

  /**
   * Admin-only curation: designate official recommended part (pinned),
   * exclude incompatible candidate (excluded), or reset verified shipment count.
   */
  async curateByAdmin(params: {
    anchorId: string;
    targetId: string;
    doorType: DoorMaterialType;
    action: AdminAffinityAction;
  }): Promise<PartAffinityRecord | null> {
    await this.hydrateFromEgdeskOnce();

    const anchorId = String(params.anchorId || "").trim();
    const targetId = String(params.targetId || "").trim();
    if (!anchorId || !targetId || anchorId === targetId) return null;

    const doorType: DoorMaterialType =
      params.doorType === "glass" ? "glass" : "wood";
    const pairKey = makeAffinityKey(anchorId, doorType, targetId);
    const now = new Date().toISOString();

    const prev = this.state.records[pairKey] || {
      pairKey,
      anchorId,
      targetId,
      doorType,
      cartCount: 0,
      orderCount: 0,
      pinned: false,
      excluded: false,
      updatedAt: now,
    };

    const next: PartAffinityRecord = { ...prev, updatedAt: now };

    switch (params.action) {
      case "pin":
        next.pinned = true;
        next.excluded = false;
        break;
      case "unpin":
        next.pinned = false;
        break;
      case "toggle_pin":
        next.pinned = !next.pinned;
        if (next.pinned) next.excluded = false;
        break;
      case "exclude":
        next.excluded = true;
        next.pinned = false;
        break;
      case "unexclude":
        next.excluded = false;
        break;
      case "toggle_exclude":
        next.excluded = !next.excluded;
        if (next.excluded) next.pinned = false;
        break;
      case "reset_order_count":
        next.orderCount = 0;
        break;
    }

    this.state.records[pairKey] = next;
    this.persistLocal();
    void syncAffinityRowsToEgdesk([next]);
    return next;
  }

  async resetAnchorExclusions(
    anchorId: string,
    doorType?: DoorMaterialType,
  ): Promise<PartAffinityRecord[]> {
    await this.hydrateFromEgdeskOnce();
    const cleanAnchor = String(anchorId || "").trim();
    if (!cleanAnchor) return [];
    const touched: PartAffinityRecord[] = [];
    const now = new Date().toISOString();

    for (const rec of Object.values(this.state.records)) {
      if (
        rec.anchorId === cleanAnchor &&
        rec.excluded &&
        (!doorType || rec.doorType === doorType)
      ) {
        rec.excluded = false;
        rec.updatedAt = now;
        touched.push(rec);
      }
    }
    if (touched.length > 0) {
      this.persistLocal();
      void syncAffinityRowsToEgdesk(touched);
    }
    return Object.values(this.state.records);
  }

  private extractVerifiedPairs(
    order: OrderRecord,
    allProducts: CmsProduct[],
  ): Array<{ anchorId: string; targetId: string; doorType: DoorMaterialType }> {
    if (!Array.isArray(order.items) || order.items.length < 2) return [];

    const byId = new Map(allProducts.map((p) => [p.id, p]));
    const resolved = order.items
      .map((it) => {
        const prod = resolveProductForLineItem(it, byId, allProducts);
        const id = prod?.id || String(it.productId || "").trim();
        if (!id) return null;
        return {
          id,
          prod,
          rawName: it.productName || "",
          rawSpec: it.spec || "",
          isAnchor: isServerAnchorProduct(prod, it.productName),
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    const anchors = resolved.filter((x) => x.isAnchor);
    const subParts = resolved.filter((x) => !x.isAnchor);
    if (anchors.length === 0 || subParts.length === 0) return [];

    const pairs: Array<{
      anchorId: string;
      targetId: string;
      doorType: DoorMaterialType;
    }> = [];
    const seen = new Set<string>();

    for (const anc of anchors) {
      const doorType: DoorMaterialType =
        order.doorType === "glass" || order.doorType === "wood"
          ? order.doorType
          : inferDoorTypeFromProduct(
              anc.prod,
              `${anc.rawName} ${anc.rawSpec}`,
            );

      for (const sub of subParts) {
        if (anc.id === sub.id) continue;
        const key = makeAffinityKey(anc.id, doorType, sub.id);
        if (seen.has(key)) continue;
        seen.add(key);
        pairs.push({ anchorId: anc.id, targetId: sub.id, doorType });
      }
    }
    return pairs;
  }

  /**
   * Automatically learns from an order ONLY when COAS Admin marks it "completed" (출고확정/처리완료).
   * Idempotent per order.id so saving admin memos multiple times never double-counts.
   */
  async learnVerifiedOrder(
    order: OrderRecord,
    allProducts: CmsProduct[],
  ): Promise<{ learned: boolean; pairsCount: number }> {
    await this.hydrateFromEgdeskOnce();
    if (!order?.id || order.status !== "completed") {
      return { learned: false, pairsCount: 0 };
    }
    if (this.hasLearnedOrder(order.id)) {
      return { learned: false, pairsCount: 0 };
    }

    const pairs = this.extractVerifiedPairs(order, allProducts);
    if (pairs.length === 0) {
      return { learned: false, pairsCount: 0 };
    }

    const now = new Date().toISOString();
    const touched: PartAffinityRecord[] = [];

    for (const p of pairs) {
      const pairKey = makeAffinityKey(p.anchorId, p.doorType, p.targetId);
      const prev = this.state.records[pairKey] || {
        pairKey,
        anchorId: p.anchorId,
        targetId: p.targetId,
        doorType: p.doorType,
        cartCount: 0,
        orderCount: 0,
        pinned: false,
        excluded: false,
        updatedAt: now,
      };
      // Respect admin's explicit exclusion — never resurrect an excluded incompatible part
      if (prev.excluded) continue;

      const updated: PartAffinityRecord = {
        ...prev,
        orderCount: prev.orderCount + 1,
        updatedAt: now,
      };
      this.state.records[pairKey] = updated;
      touched.push(updated);
    }

    if (touched.length > 0) {
      this.state.learnedOrderIds.push(order.id);
      this.state.totalLearnedOrders = Math.max(
        this.state.learnedOrderIds.length,
        this.state.totalLearnedOrders + 1,
      );
      this.persistLocal();
      await syncAffinityRowsToEgdesk(touched);
      return { learned: true, pairsCount: touched.length };
    }

    return { learned: false, pairsCount: 0 };
  }

  /**
   * Reverses learning if an order previously marked "completed" is reverted or deleted.
   */
  async unlearnVerifiedOrder(
    order: OrderRecord,
    allProducts: CmsProduct[],
  ): Promise<{ unlearned: boolean; pairsCount: number }> {
    await this.hydrateFromEgdeskOnce();
    if (!order?.id || !this.hasLearnedOrder(order.id)) {
      return { unlearned: false, pairsCount: 0 };
    }

    const pairs = this.extractVerifiedPairs(order, allProducts);
    const now = new Date().toISOString();
    const touched: PartAffinityRecord[] = [];

    for (const p of pairs) {
      const pairKey = makeAffinityKey(p.anchorId, p.doorType, p.targetId);
      const prev = this.state.records[pairKey];
      if (!prev || prev.orderCount <= 0) continue;

      const updated: PartAffinityRecord = {
        ...prev,
        orderCount: Math.max(0, prev.orderCount - 1),
        updatedAt: now,
      };
      this.state.records[pairKey] = updated;
      touched.push(updated);
    }

    this.state.learnedOrderIds = this.state.learnedOrderIds.filter(
      (id) => id !== order.id,
    );
    this.state.totalLearnedOrders = Math.max(
      this.state.learnedOrderIds.length,
      Math.max(0, this.state.totalLearnedOrders - 1),
    );
    this.persistLocal();
    if (touched.length > 0) {
      await syncAffinityRowsToEgdesk(touched);
    }
    return { unlearned: true, pairsCount: touched.length };
  }

  /**
   * Ensures any already-completed orders in CmsStore are synced once into verified shipment counts.
   */
  async syncCompletedOrders(
    orders: OrderRecord[],
    allProducts: CmsProduct[],
  ): Promise<void> {
    for (const ord of orders) {
      if (ord.status === "completed" && !this.hasLearnedOrder(ord.id)) {
        await this.learnVerifiedOrder(ord, allProducts);
      }
    }
  }
}

export const partAffinityStore = new PartAffinityStore();
