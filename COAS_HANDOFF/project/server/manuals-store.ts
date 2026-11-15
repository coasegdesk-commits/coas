import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { UserManualItem } from "../shared/cms-types";

const DATA_DIR = path.resolve(process.cwd(), "data");
const MANUALS_FILE = path.join(DATA_DIR, "manuals.json");

export const DEFAULT_MANUALS: UserManualItem[] = [
  {
    id: "manual-sliding-hardware",
    title: "슬라이딩 도어 시스템 종합 시공설명서",
    category: "슬라이딩도어",
    description: "60kg ~ 500kg 하중별 상하부 롤러 가공 치수, 레일 매립 규격, 스토퍼 및 도어 간격 조절 표준 시공 가이드",
    version: "v2026.1",
    fileUrl: "/uploads/manuals/sample-manual-sliding.pdf",
    fileName: "COAS_슬라이딩도어_종합시공설명서_v2026.pdf",
    fileSize: 3450000,
    fileExt: "pdf",
    downloadCount: 142,
    visible: true,
    order: 0,
    uploadedAt: "2026-11-01T09:00:00.000Z",
  },
  {
    id: "manual-damping-trigger",
    title: "소프트 댐핑 시스템(DP시리즈) 규격 및 설치 가이드",
    category: "댐퍼/클로징",
    description: "DP-20/40/60/100 유압 댐퍼 트리거 체결 위치, 도어 중량별 댐퍼 세팅표 및 타공 상세도면",
    version: "v2.4",
    fileUrl: "/uploads/manuals/sample-manual-damping.pdf",
    fileName: "COAS_DP댐핑시스템_설치가이드.pdf",
    fileSize: 2150000,
    fileExt: "pdf",
    downloadCount: 98,
    visible: true,
    order: 1,
    uploadedAt: "2026-11-03T11:00:00.000Z",
  },
  {
    id: "manual-onebody-compact",
    title: "1 Body(원바디 40/60/90) 슬라이딩 콤팩트 가공 시공서",
    category: "원바디 시스템",
    description: "상부 매립 6mm/8mm 레일 가공 치수 및 2구 롤러 부착 시공 표준서",
    version: "v1.8",
    fileUrl: "/uploads/manuals/sample-manual-onebody.pdf",
    fileName: "COAS_원바디_콤팩트가공_시공서.pdf",
    fileSize: 1850000,
    fileExt: "pdf",
    downloadCount: 76,
    visible: true,
    order: 2,
    uploadedAt: "2026-11-05T14:30:00.000Z",
  },
  {
    id: "manual-glass-partition",
    title: "유리 슬라이딩 & 샤워부스 하드웨어(GSD/GDP) 시공 매뉴얼",
    category: "유리 파티션",
    description: "강화유리 타공 가공도면, 클램프 조임 토크, 방수 실링 및 부속 체결 가이드",
    version: "v2.0",
    fileUrl: "/uploads/manuals/sample-manual-glass.pdf",
    fileName: "COAS_유리슬라이딩_시공매뉴얼.pdf",
    fileSize: 2800000,
    fileExt: "pdf",
    downloadCount: 65,
    visible: true,
    order: 3,
    uploadedAt: "2026-11-08T10:00:00.000Z",
  },
  {
    id: "manual-order-guide",
    title: "온라인 발주서 작성 및 엑셀 일괄주문 이용 가이드",
    category: "발주서 가이드",
    description: "B2B 거래처 간편로그인, 도면 부품 원클릭 담기, 과거 발주 복사 및 엑셀 붙여넣기 안내",
    version: "v3.0",
    fileUrl: "/uploads/manuals/sample-manual-order.pdf",
    fileName: "COAS_온라인발주서_이용가이드.pdf",
    fileSize: 1250000,
    fileExt: "pdf",
    downloadCount: 210,
    visible: true,
    order: 4,
    uploadedAt: "2026-11-10T16:00:00.000Z",
  },
];

class ManualsStore {
  private manuals: UserManualItem[] = [];

  constructor() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    this.load();
  }

  private load(): void {
    if (fs.existsSync(MANUALS_FILE)) {
      try {
        const raw = fs.readFileSync(MANUALS_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.manuals = parsed;
          return;
        }
      } catch (e) {
        console.error("[manuals-store] Error parsing manuals.json:", e);
      }
    }
    this.manuals = structuredClone(DEFAULT_MANUALS);
    this.persist();
  }

  private persist(): void {
    try {
      const tmp = `${MANUALS_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.manuals, null, 2), "utf-8");
      fs.renameSync(tmp, MANUALS_FILE);
    } catch (e) {
      console.error("[manuals-store] Failed to save manuals.json:", e);
    }
  }

  list(includeHidden = false): UserManualItem[] {
    const list = includeHidden
      ? this.manuals
      : this.manuals.filter((m) => m.visible !== false);
    return list.slice().sort((a, b) => a.order - b.order);
  }

  getById(id: string): UserManualItem | undefined {
    return this.manuals.find((m) => m.id === id);
  }

  upsert(item: Partial<UserManualItem> & { title: string; fileUrl: string }): UserManualItem {
    const id = item.id || `manual_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const idx = this.manuals.findIndex((m) => m.id === id);
    const now = new Date().toISOString();

    const normalized: UserManualItem = {
      id,
      title: item.title.trim(),
      category: item.category?.trim() || "기타 시공자료",
      description: item.description?.trim() || "",
      version: item.version?.trim() || "v1.0",
      fileUrl: item.fileUrl,
      fileName: item.fileName || path.basename(item.fileUrl),
      fileSize: typeof item.fileSize === "number" ? item.fileSize : 1024 * 1024,
      fileExt: item.fileExt || path.extname(item.fileUrl).replace(".", "").toLowerCase() || "pdf",
      downloadCount: typeof item.downloadCount === "number" ? item.downloadCount : 0,
      visible: item.visible !== false,
      order: typeof item.order === "number" ? item.order : this.manuals.length,
      uploadedAt: item.uploadedAt || now,
      updatedAt: now,
    };

    if (idx >= 0) {
      this.manuals[idx] = normalized;
    } else {
      this.manuals.push(normalized);
    }

    this.persist();
    return normalized;
  }

  delete(id: string): boolean {
    const before = this.manuals.length;
    this.manuals = this.manuals.filter((m) => m.id !== id);
    if (this.manuals.length !== before) {
      this.persist();
      return true;
    }
    return false;
  }

  incrementDownload(id: string): number {
    const target = this.manuals.find((m) => m.id === id);
    if (target) {
      target.downloadCount = (target.downloadCount || 0) + 1;
      this.persist();
      return target.downloadCount;
    }
    return 0;
  }
}

export const manualsStore = new ManualsStore();
