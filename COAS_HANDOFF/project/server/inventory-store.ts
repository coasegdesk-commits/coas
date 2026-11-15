import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { InventoryItem, InventorySummary, StockAdjustmentLog } from "../shared/cms-types";

const DATA_DIR = path.resolve(process.cwd(), "data");
const INVENTORY_FILE = path.join(DATA_DIR, "inventory.json");

export const DEFAULT_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: "inv-sd-60",
    sku: "COAS-SD-060",
    productName: "60kg(SD)",
    category: "슬라이딩 시스템",
    spec: "목문용 상부 롤러 세트 (도어중량 60kg 이하)",
    unit: "SET",
    currentStock: 185,
    safetyStock: 50,
    incomingStock: 100,
    outgoingStock: 25,
    unitCost: 14000,
    sellingPrice: 22000,
    warehouseLocation: "A동 1열-01",
    status: "in_stock",
    lastStockUpdated: "2026-11-14T10:30:00.000Z",
    history: [
      {
        id: "log-sd60-1",
        type: "inbound",
        quantity: 100,
        previousStock: 85,
        newStock: 185,
        reason: "정기 생산분 입고",
        operator: "물류팀장",
        timestamp: "2026-11-14T10:30:00.000Z",
      },
    ],
  },
  {
    id: "inv-sd-80",
    sku: "COAS-SD-080",
    productName: "80kg(SD)",
    category: "슬라이딩 시스템",
    spec: "목문용 중하중 상부 롤러 세트 (도어중량 80kg 이하)",
    unit: "SET",
    currentStock: 140,
    safetyStock: 40,
    incomingStock: 50,
    outgoingStock: 15,
    unitCost: 16500,
    sellingPrice: 26000,
    warehouseLocation: "A동 1열-02",
    status: "in_stock",
    lastStockUpdated: "2026-11-13T14:20:00.000Z",
    history: [
      {
        id: "log-sd80-1",
        type: "inbound",
        quantity: 50,
        previousStock: 90,
        newStock: 140,
        reason: "1차 조립완제품 입고",
        operator: "생산관리자",
        timestamp: "2026-11-13T14:20:00.000Z",
      },
    ],
  },
  {
    id: "inv-m-80",
    sku: "COAS-SD-M080",
    productName: "M-80",
    category: "슬라이딩 시스템",
    spec: "매립형 콤팩트 목문 롤러 (80kg 대응)",
    unit: "SET",
    currentStock: 68,
    safetyStock: 30,
    incomingStock: 0,
    outgoingStock: 12,
    unitCost: 17000,
    sellingPrice: 27000,
    warehouseLocation: "A동 1열-03",
    status: "in_stock",
    lastStockUpdated: "2026-11-12T16:00:00.000Z",
    history: [],
  },
  {
    id: "inv-sd-150",
    sku: "COAS-SD-150",
    productName: "150kg(SD)",
    category: "슬라이딩 시스템",
    spec: "고하중 베어링 롤러 세트 (150kg용)",
    unit: "SET",
    currentStock: 42,
    safetyStock: 25,
    incomingStock: 40,
    outgoingStock: 8,
    unitCost: 28000,
    sellingPrice: 45000,
    warehouseLocation: "A동 2열-01",
    status: "in_stock",
    lastStockUpdated: "2026-11-10T11:15:00.000Z",
    history: [],
  },
  {
    id: "inv-sd-250",
    sku: "COAS-SD-250",
    productName: "250kg(SD)",
    category: "슬라이딩 시스템",
    spec: "초고하중 상부 4륜 롤러 세트 (250kg용)",
    unit: "SET",
    currentStock: 18,
    safetyStock: 20,
    incomingStock: 30,
    outgoingStock: 6,
    unitCost: 45000,
    sellingPrice: 72000,
    warehouseLocation: "A동 2열-02",
    status: "low_stock",
    lastStockUpdated: "2026-11-14T17:40:00.000Z",
    history: [
      {
        id: "log-sd250-1",
        type: "outbound",
        quantity: -10,
        previousStock: 28,
        newStock: 18,
        reason: "영림도어 대형프로젝트 일괄 출고",
        operator: "물류팀장",
        timestamp: "2026-11-14T17:40:00.000Z",
      },
    ],
  },
  {
    id: "inv-sd-500",
    sku: "COAS-SD-500",
    productName: "500kg(SD)",
    category: "슬라이딩 시스템",
    spec: "산업/특수 도어용 스틸 강철 롤러 (500kg용)",
    unit: "SET",
    currentStock: 6,
    safetyStock: 10,
    incomingStock: 20,
    outgoingStock: 2,
    unitCost: 95000,
    sellingPrice: 155000,
    warehouseLocation: "A동 2열-03",
    status: "low_stock",
    lastStockUpdated: "2026-11-11T13:20:00.000Z",
    history: [],
  },
  {
    id: "inv-dp-20",
    sku: "COAS-DP-020",
    productName: "DP-20",
    category: "댐퍼/클로징",
    spec: "초경량 20kg 소형 댐퍼 시스템 (포켓도어용)",
    unit: "SET",
    currentStock: 110,
    safetyStock: 30,
    incomingStock: 0,
    outgoingStock: 10,
    unitCost: 19000,
    sellingPrice: 31000,
    warehouseLocation: "B동 1열-01",
    status: "in_stock",
    lastStockUpdated: "2026-11-09T09:00:00.000Z",
    history: [],
  },
  {
    id: "inv-dp-40",
    sku: "COAS-DP-040",
    productName: "DP-40",
    category: "댐퍼/클로징",
    spec: "소프트 댐핑 클로징 시스템 (40kg 표준형)",
    unit: "SET",
    currentStock: 195,
    safetyStock: 50,
    incomingStock: 80,
    outgoingStock: 35,
    unitCost: 22000,
    sellingPrice: 35000,
    warehouseLocation: "B동 1열-02",
    status: "in_stock",
    lastStockUpdated: "2026-11-15T09:10:00.000Z",
    history: [
      {
        id: "log-dp40-1",
        type: "inbound",
        quantity: 50,
        previousStock: 145,
        newStock: 195,
        reason: "수입 유압 실린더 완제품 입고",
        operator: "자재팀",
        timestamp: "2026-11-15T09:10:00.000Z",
      },
    ],
  },
  {
    id: "inv-dp-60",
    sku: "COAS-DP-060",
    productName: "DP-60",
    category: "댐퍼/클로징",
    spec: "고성능 유압 양방향 댐핑 세트 (60kg 대응)",
    unit: "SET",
    currentStock: 130,
    safetyStock: 40,
    incomingStock: 50,
    outgoingStock: 20,
    unitCost: 26000,
    sellingPrice: 42000,
    warehouseLocation: "B동 1열-03",
    status: "in_stock",
    lastStockUpdated: "2026-11-13T10:00:00.000Z",
    history: [],
  },
  {
    id: "inv-dp-100",
    sku: "COAS-DP-100",
    productName: "DP-100",
    category: "댐퍼/클로징",
    spec: "대형 프리미엄 듀얼 댐퍼 (100kg 중량도어용)",
    unit: "SET",
    currentStock: 8,
    safetyStock: 25,
    incomingStock: 50,
    outgoingStock: 5,
    unitCost: 38000,
    sellingPrice: 62000,
    warehouseLocation: "B동 1열-04",
    status: "low_stock",
    lastStockUpdated: "2026-11-15T08:30:00.000Z",
    history: [
      {
        id: "log-dp100-1",
        type: "outbound",
        quantity: -15,
        previousStock: 23,
        newStock: 8,
        reason: "한샘인테리어 디자인 출고",
        operator: "물류팀장",
        timestamp: "2026-11-15T08:30:00.000Z",
      },
    ],
  },
  {
    id: "inv-body-40",
    sku: "COAS-BD-040",
    productName: "1 Body-40",
    category: "원바디 시스템",
    spec: "일체형 슬림 원바디 롤러 (40kg용)",
    unit: "SET",
    currentStock: 85,
    safetyStock: 30,
    incomingStock: 0,
    outgoingStock: 10,
    unitCost: 21000,
    sellingPrice: 34000,
    warehouseLocation: "B동 2열-01",
    status: "in_stock",
    lastStockUpdated: "2026-11-12T14:00:00.000Z",
    history: [],
  },
  {
    id: "inv-body-60",
    sku: "COAS-BD-060",
    productName: "1 Body-60",
    category: "원바디 시스템",
    spec: "일체형 원바디 중형 롤러 (60kg용)",
    unit: "SET",
    currentStock: 74,
    safetyStock: 30,
    incomingStock: 40,
    outgoingStock: 12,
    unitCost: 24000,
    sellingPrice: 39000,
    warehouseLocation: "B동 2열-02",
    status: "in_stock",
    lastStockUpdated: "2026-11-14T11:00:00.000Z",
    history: [],
  },
  {
    id: "inv-body-90",
    sku: "COAS-BD-090",
    productName: "1 Body-90",
    category: "원바디 시스템",
    spec: "일체형 고중량 원바디 롤러 (90kg용)",
    unit: "SET",
    currentStock: 0,
    safetyStock: 20,
    incomingStock: 60,
    outgoingStock: 0,
    unitCost: 29000,
    sellingPrice: 47000,
    warehouseLocation: "B동 2열-03",
    status: "out_of_stock",
    lastStockUpdated: "2026-11-15T09:40:00.000Z",
    history: [
      {
        id: "log-bd90-1",
        type: "outbound",
        quantity: -12,
        previousStock: 12,
        newStock: 0,
        reason: "긴급 시공 현장 전량 출고(품절 발생)",
        operator: "물류팀장",
        timestamp: "2026-11-15T09:40:00.000Z",
      },
    ],
  },
  {
    id: "inv-gsd-60",
    sku: "COAS-GL-060",
    productName: "60kg(GSD)",
    category: "유리 하드웨어",
    spec: "유리 슬라이딩 상부 클램프 롤러 (8~10T, 60kg)",
    unit: "SET",
    currentStock: 56,
    safetyStock: 20,
    incomingStock: 0,
    outgoingStock: 6,
    unitCost: 38000,
    sellingPrice: 59000,
    warehouseLocation: "C동 1열-01",
    status: "in_stock",
    lastStockUpdated: "2026-11-11T16:00:00.000Z",
    history: [],
  },
  {
    id: "inv-gsd-80",
    sku: "COAS-GL-080",
    productName: "80kg(GSD)",
    category: "유리 하드웨어",
    spec: "유리 슬라이딩 중하중 클램프 롤러 (10~12T, 80kg)",
    unit: "SET",
    currentStock: 48,
    safetyStock: 20,
    incomingStock: 30,
    outgoingStock: 4,
    unitCost: 46000,
    sellingPrice: 72000,
    warehouseLocation: "C동 1열-02",
    status: "in_stock",
    lastStockUpdated: "2026-11-10T15:30:00.000Z",
    history: [],
  },
  {
    id: "inv-gdp-100",
    sku: "COAS-GL-100",
    productName: "100kg(GDP)",
    category: "유리 하드웨어",
    spec: "유리 도어 전용 소프트 댐핑 시스템 (100kg)",
    unit: "SET",
    currentStock: 34,
    safetyStock: 15,
    incomingStock: 20,
    outgoingStock: 5,
    unitCost: 52000,
    sellingPrice: 82000,
    warehouseLocation: "C동 1열-03",
    status: "in_stock",
    lastStockUpdated: "2026-11-09T14:10:00.000Z",
    history: [],
  },
  {
    id: "inv-rail-al-2m",
    sku: "COAS-RL-020",
    productName: "알루미늄 상부 레일 (2M)",
    category: "레일/부속",
    spec: "알루미늄 아노다이징 상부 레일 길이 2,000mm",
    unit: "本(개)",
    currentStock: 210,
    safetyStock: 60,
    incomingStock: 150,
    outgoingStock: 40,
    unitCost: 15000,
    sellingPrice: 24000,
    warehouseLocation: "D동 롱랙-01",
    status: "in_stock",
    lastStockUpdated: "2026-11-15T08:00:00.000Z",
    history: [],
  },
  {
    id: "inv-rail-al-3m",
    sku: "COAS-RL-030",
    productName: "알루미늄 상부 레일 (3M)",
    category: "레일/부속",
    spec: "알루미늄 아노다이징 상부 레일 길이 3,000mm",
    unit: "本(개)",
    currentStock: 165,
    safetyStock: 50,
    incomingStock: 100,
    outgoingStock: 30,
    unitCost: 22000,
    sellingPrice: 35000,
    warehouseLocation: "D동 롱랙-02",
    status: "in_stock",
    lastStockUpdated: "2026-11-14T09:20:00.000Z",
    history: [],
  },
  {
    id: "inv-bottom-guide",
    sku: "COAS-AC-001",
    productName: "하부 가이드 핀/롤러 세트",
    category: "레일/부속",
    spec: "도어 하부 흔들림 방지 베어링 가이드 핀 (목문/유리 겸용)",
    unit: "EA",
    currentStock: 320,
    safetyStock: 80,
    incomingStock: 0,
    outgoingStock: 50,
    unitCost: 2500,
    sellingPrice: 5000,
    warehouseLocation: "B동 3열-05",
    status: "in_stock",
    lastStockUpdated: "2026-11-12T11:00:00.000Z",
    history: [],
  },
];

class InventoryStore {
  private items: InventoryItem[] = [];
  private initialized = false;

  private ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private calculateStatus(current: number, safety: number): "in_stock" | "low_stock" | "out_of_stock" {
    if (current <= 0) return "out_of_stock";
    if (current <= safety) return "low_stock";
    return "in_stock";
  }

  public init() {
    if (this.initialized) return;
    this.ensureDir();

    try {
      if (fs.existsSync(INVENTORY_FILE)) {
        const raw = fs.readFileSync(INVENTORY_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.items = parsed;
        } else {
          this.items = [...DEFAULT_INVENTORY_ITEMS];
          this.save();
        }
      } else {
        this.items = [...DEFAULT_INVENTORY_ITEMS];
        this.save();
      }
    } catch (err) {
      console.error("[InventoryStore] Failed to load inventory.json, using defaults:", err);
      this.items = [...DEFAULT_INVENTORY_ITEMS];
      this.save();
    }
    this.initialized = true;
  }

  private save() {
    this.ensureDir();
    fs.writeFileSync(INVENTORY_FILE, JSON.stringify(this.items, null, 2), "utf-8");
  }

  public list(): InventoryItem[] {
    this.init();
    return [...this.items];
  }

  public getSummary(): InventorySummary {
    this.init();
    let totalItems = this.items.length;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalAssetValuation = 0;

    for (const it of this.items) {
      const status = this.calculateStatus(it.currentStock, it.safetyStock);
      it.status = status;
      if (status === "in_stock") inStockCount++;
      else if (status === "low_stock") lowStockCount++;
      else if (status === "out_of_stock") outOfStockCount++;

      totalAssetValuation += Math.max(0, it.currentStock) * (it.unitCost || 0);
    }

    return {
      totalItems,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      totalAssetValuation,
      items: [...this.items],
    };
  }

  public getById(id: string): InventoryItem | undefined {
    this.init();
    return this.items.find((item) => item.id === id);
  }

  public upsert(item: Partial<InventoryItem> & { productName: string }): InventoryItem {
    this.init();
    const existingIndex = item.id ? this.items.findIndex((i) => i.id === item.id) : -1;
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const prev = this.items[existingIndex];
      const currentStock = typeof item.currentStock === "number" ? item.currentStock : prev.currentStock;
      const safetyStock = typeof item.safetyStock === "number" ? item.safetyStock : prev.safetyStock;

      const updated: InventoryItem = {
        ...prev,
        ...item,
        currentStock,
        safetyStock,
        status: this.calculateStatus(currentStock, safetyStock),
        lastStockUpdated: now,
      };
      this.items[existingIndex] = updated;
      this.save();
      return updated;
    } else {
      const currentStock = item.currentStock ?? 0;
      const safetyStock = item.safetyStock ?? 10;
      const newItem: InventoryItem = {
        id: item.id || `inv-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
        sku: item.sku || `COAS-${Date.now().toString().slice(-6)}`,
        productName: item.productName,
        category: item.category || "슬라이딩 시스템",
        spec: item.spec || "",
        unit: item.unit || "SET",
        currentStock,
        safetyStock,
        incomingStock: item.incomingStock ?? 0,
        outgoingStock: item.outgoingStock ?? 0,
        unitCost: item.unitCost ?? 0,
        sellingPrice: item.sellingPrice ?? 0,
        warehouseLocation: item.warehouseLocation || "A동 1열",
        status: this.calculateStatus(currentStock, safetyStock),
        lastStockUpdated: now,
        history: [],
      };
      this.items.push(newItem);
      this.save();
      return newItem;
    }
  }

  public adjustStock(
    id: string,
    params: {
      type: "inbound" | "outbound" | "adjustment";
      quantity: number; // positive or adjustment diff
      reason: string;
      operator?: string;
    }
  ): InventoryItem {
    this.init();
    const item = this.getById(id);
    if (!item) {
      throw new Error(`Inventory item not found: ${id}`);
    }

    const previousStock = item.currentStock;
    let newStock = previousStock;

    if (params.type === "inbound") {
      newStock = previousStock + Math.abs(params.quantity);
    } else if (params.type === "outbound") {
      newStock = Math.max(0, previousStock - Math.abs(params.quantity));
    } else if (params.type === "adjustment") {
      // 실사 조정인 경우 입력된 수량이 최종 수량인 경우와 차이인 경우 고려
      // params.quantity를 바로 newStock으로 설정하거나 delta로 처리
      newStock = Math.max(0, params.quantity);
    }

    const now = new Date().toISOString();
    const log: StockAdjustmentLog = {
      id: `log-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      type: params.type,
      quantity: newStock - previousStock,
      previousStock,
      newStock,
      reason: params.reason || (params.type === "inbound" ? "수동 입고" : params.type === "outbound" ? "수동 출고" : "실사 재고조정"),
      operator: params.operator || "관리자",
      timestamp: now,
    };

    item.currentStock = newStock;
    item.status = this.calculateStatus(newStock, item.safetyStock);
    item.lastStockUpdated = now;
    item.history = [log, ...(item.history || [])];

    this.save();
    return item;
  }

  public delete(id: string): boolean {
    this.init();
    const beforeCount = this.items.length;
    this.items = this.items.filter((i) => i.id !== id);
    if (this.items.length !== beforeCount) {
      this.save();
      return true;
    }
    return false;
  }
}

export const inventoryStore = new InventoryStore();
