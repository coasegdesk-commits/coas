import type {
  DoorMaterialType,
  PartAffinityRecord,
  RecommendationSourceTier,
} from "@shared/cms-types";

export interface CatalogPartLike {
  id: string;
  code: string;
  title: string;
  specHint: string;
  page: string;
  categoryGroup: "sliding" | "damping" | "rail" | "glass";
  rawCategoryKo?: string;
  defaultUnit: "SET" | "EA";
  image?: string;
}

export type RecPartRole =
  | "all"
  | "upper_rail"
  | "lower"
  | "handle"
  | "bracket";

export interface RecommendedPartItem<
  T extends CatalogPartLike = CatalogPartLike,
> {
  item: T;
  role: Exclude<RecPartRole, "all">;
  sourceTier: RecommendationSourceTier;
  seedScore: number;
  orderCount: number;
  cartCount: number;
  pinned: boolean;
  totalScore: number;
  matchReason: string;
}

const ANCHOR_RAW_CATEGORIES = new Set([
  "슬라이딩도어",
  "댐핑",
  "유리슬라이딩도어",
  "유리댐핑도어",
  "폴딩도어",
  "무빙슬라이딩도어",
  "YL 시리즈",
  "WSD 시리즈",
]);

export function isAnchorRollerItem(item: CatalogPartLike): boolean {
  if (item.rawCategoryKo && ANCHOR_RAW_CATEGORIES.has(item.rawCategoryKo)) {
    return true;
  }
  const hay = `${item.code} ${item.title} ${item.rawCategoryKo || ""}`.toUpperCase();
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

export function inferDefaultDoorType(item: CatalogPartLike): DoorMaterialType {
  const hay = `${item.code} ${item.title} ${item.rawCategoryKo || ""} ${item.specHint}`.toUpperCase();
  if (hay.includes("GSD") || hay.includes("GDP") || hay.includes("유리")) {
    return "glass";
  }
  return "wood";
}

export function classifySubPartRole(
  item: CatalogPartLike,
): Exclude<RecPartRole, "all"> | null {
  if (isAnchorRollerItem(item)) return null;
  const cat = item.rawCategoryKo || "";
  const hay = `${item.code} ${item.title} ${item.specHint} ${cat}`.toUpperCase();

  // Lower rails & bottom guides
  if (
    hay.includes("하부레일") ||
    item.id === "sl-1615" ||
    item.id === "sl-1509" ||
    cat === "가이드" ||
    hay.includes("가이드") ||
    hay.includes("SD-01") ||
    hay.includes("SD-02") ||
    item.id === "cs-210" ||
    item.id === "cs-230"
  ) {
    return "lower";
  }

  // Upper rails
  if (cat === "SL 레일" || hay.startsWith("SL-")) {
    return "upper_rail";
  }

  // Handles (wood & glass handles)
  if (
    cat === "손잡이" ||
    hay.includes("손잡이") ||
    item.id === "cs-240" ||
    item.id === "cs-250"
  ) {
    return "handle";
  }

  // Brackets, covers, accessories, glass clamps
  if (
    cat === "트랙브라켓" ||
    cat === "레일커버" ||
    cat === "악세서리" ||
    cat === "유리파티션" ||
    hay.includes("브라켓") ||
    hay.includes("커버") ||
    hay.includes("TB-")
  ) {
    return "bracket";
  }

  return null;
}

function extractWeights(text: string): number[] {
  const matches = text.match(/\d{2,3}/g) || [];
  return matches
    .map((m) => parseInt(m, 10))
    .filter((n) =>
      [20, 40, 60, 80, 90, 100, 130, 150, 200, 250, 500].includes(n),
    );
}

function computeSeedMatch(
  anchor: CatalogPartLike,
  candidate: CatalogPartLike,
  role: Exclude<RecPartRole, "all">,
  doorType: DoorMaterialType,
): { score: number; reason: string } {
  const ancHay = `${anchor.code} ${anchor.title} ${anchor.specHint}`.toUpperCase();
  const candHay = `${candidate.code} ${candidate.title} ${candidate.specHint}`.toUpperCase();
  const ancWeights = extractWeights(`${anchor.code} ${anchor.title}`);
  const candWeights = extractWeights(`${candidate.specHint} ${candidate.title}`);
  const sharedWeight = ancWeights.find((w) => candWeights.includes(w));

  const isAncOneBody = ancHay.includes("1 BODY") || ancHay.includes("원바디");
  const isAncM80 = ancHay.includes("M-80");
  const isAncFD = ancHay.includes("(FD)") || ancHay.includes("폴딩");
  const isAncMSD = ancHay.includes("(MSD)") || ancHay.includes("무빙");
  const isAncDP =
    ancHay.includes("DP-") ||
    ancHay.includes("(DP)") ||
    ancHay.includes("(GDP)") ||
    ancHay.includes("댐핑");

  if (role === "upper_rail") {
    const candIsGlassSpecific =
      candHay.includes("유리") ||
      candHay.includes("샤워부스") ||
      candHay.includes("SUS304");
    const candIsCubicle =
      candHay.includes("큐비클") || candHay.includes("액자레일");
    if (candIsCubicle) return { score: 0, reason: "" };

    const candIsDP = candHay.includes("(DP)") || candHay.includes("DP ");
    const candIsOneBody =
      candHay.includes("원바디") || candHay.includes("1 BODY");
    const candIsM80 = candHay.includes("M-80");
    const candIsFD = candHay.includes("(FD)") || candHay.includes("폴딩") || candHay.includes("FD100");
    const candIsMSD = candHay.includes("(MSD)") || candHay.includes("무빙");

    // Strict series isolation: prevent DP/One-Body/M-80/FD/MSD rails from leaking into unrelated series
    if (!isAncDP && candIsDP) return { score: 0, reason: "" };
    if (!isAncOneBody && candIsOneBody) return { score: 0, reason: "" };
    if (!isAncM80 && candIsM80) return { score: 0, reason: "" };
    if (!isAncFD && candIsFD && !(ancWeights.includes(500) && candHay.includes("SD500"))) {
      return { score: 0, reason: "" };
    }
    if (!isAncMSD && candIsMSD) return { score: 0, reason: "" };

    if (doorType === "glass") {
      if (candIsGlassSpecific) {
        if (sharedWeight) {
          return {
            score: 66,
            reason: `${sharedWeight}kg 유리도어 전용 규격`,
          };
        }
        return { score: 48, reason: "유리도어 호환 상부레일" };
      }
      if (sharedWeight) {
        if (isAncDP && candIsDP) {
          return { score: 44, reason: `${sharedWeight}kg 댐핑 호환 레일` };
        }
        if (!isAncDP && !candIsDP && !candIsOneBody) {
          return { score: 34, reason: `${sharedWeight}kg 하중 호환 레일` };
        }
      }
      return { score: 0, reason: "" };
    }

    // Wood / General Door
    if (candIsGlassSpecific) return { score: 0, reason: "" };

    if (isAncM80 && candIsM80) {
      return { score: 62, reason: "M-80 전용 호환 레일" };
    }
    if (isAncOneBody && candIsOneBody) {
      return {
        score: sharedWeight ? 66 : 56,
        reason: "원바디 전용 호환 레일",
      };
    }
    if (isAncFD && candIsFD) {
      return {
        score: sharedWeight ? 64 : 54,
        reason: "폴딩도어 전용 레일",
      };
    }
    if (isAncMSD && candIsMSD) {
      return { score: 64, reason: "무빙슬라이딩 전용 레일" };
    }
    if (isAncDP && candIsDP) {
      if (
        sharedWeight ||
        (ancHay.includes("DP-20") && candWeights.includes(40))
      ) {
        return { score: 62, reason: "DP 댐핑 전용 규격 레일" };
      }
      return { score: 0, reason: "" };
    }
    if (!isAncDP && !isAncOneBody && !isAncM80 && !isAncFD && !isAncMSD) {
      if (candHay.includes("(SD)") && sharedWeight) {
        return { score: 64, reason: `${sharedWeight}kg(SD) 표준 호환 레일` };
      }
      if (ancWeights.includes(500) && candHay.includes("SD500")) {
        return { score: 62, reason: "500kg(SD) 중량 호환 레일" };
      }
    }
    return { score: 0, reason: "" };
  }

  if (role === "lower") {
    const maxWeight = ancWeights.length ? Math.max(...ancWeights) : 80;
    if (candidate.id === "sl-1615" || candHay.includes("하부레일 대")) {
      return {
        score: maxWeight >= 100 ? 40 : 33,
        reason: "하부 흔들림 방지 매립 레일(대)",
      };
    }
    if (candidate.id === "sl-1509" || candHay.includes("하부레일 소")) {
      return {
        score: maxWeight <= 80 ? 38 : 30,
        reason: "중문·슬라이딩 하부 매립 레일(소)",
      };
    }
    if (
      candidate.rawCategoryKo === "가이드" ||
      candHay.includes("SD-01") ||
      candHay.includes("SD-02")
    ) {
      return {
        score: doorType === "wood" ? 39 : 28,
        reason: "도어 하부 흔들림 방지 L가이드",
      };
    }
    if (
      doorType === "glass" &&
      (candidate.id === "cs-210" || candidate.id === "cs-230")
    ) {
      return { score: 37, reason: "강화유리 도어 하부 가이드/부속" };
    }
    return { score: 0, reason: "" };
  }

  if (role === "handle") {
    if (doorType === "glass") {
      if (candidate.id === "cs-240" || candidate.id === "cs-250") {
        return { score: 34, reason: "유리도어 전용 손잡이/부속" };
      }
      if (candidate.id === "cs-200" || candidate.id === "cs-300") {
        return { score: 31, reason: "유리·공용 슬라이딩 손잡이" };
      }
      if (candidate.rawCategoryKo === "손잡이") {
        return { score: 22, reason: "슬라이딩 손잡이" };
      }
      return { score: 0, reason: "" };
    }

    if (candidate.rawCategoryKo === "손잡이") {
      const popular =
        candidate.id === "cs-401" ||
        candidate.id === "cs-419" ||
        candidate.id === "cs-200" ||
        candidate.id === "cs-300";
      return {
        score: popular ? 31 : 25,
        reason: popular ? "슬라이딩 매립·기본 인기 손잡이" : "슬라이딩 도어 손잡이",
      };
    }
    return { score: 0, reason: "" };
  }

  if (role === "bracket") {
    if (candidate.rawCategoryKo === "레일커버") {
      return { score: 34, reason: "상부 레일 노출 마감 커버" };
    }
    if (candidate.rawCategoryKo === "트랙브라켓") {
      const is80 = ancWeights.includes(80) && candHay.includes("3332");
      return {
        score: is80 ? 40 : 29,
        reason: is80 ? "SL-3332 레일 벽체 브라켓" : "상부 레일 벽부착 브라켓",
      };
    }
    if (doorType === "glass" && candidate.rawCategoryKo === "유리파티션") {
      if (["cs-231", "cs-232", "cs-260", "cs-270"].includes(candidate.id)) {
        return { score: 27, reason: "강화유리 고정 클램프·부속" };
      }
      return { score: 0, reason: "" };
    }
    if (
      candidate.rawCategoryKo === "악세서리" &&
      ["700", "711", "712"].includes(candidate.id)
    ) {
      return { score: 22, reason: "슬라이딩 보조 악세서리" };
    }
  }

  return { score: 0, reason: "" };
}

function tierPriority(tier: RecommendationSourceTier): number {
  switch (tier) {
    case "admin_designated":
      return 3;
    case "verified_shipment":
      return 2;
    case "catalog_compatible":
      return 1;
  }
}

export function computeRelatedPartRecommendations<T extends CatalogPartLike>(
  anchor: T,
  catalog: T[],
  doorType: DoorMaterialType,
  affinityRecords: PartAffinityRecord[],
): {
  items: RecommendedPartItem<T>[];
  adminDesignated: RecommendedPartItem<T>[];
  verifiedShipment: RecommendedPartItem<T>[];
  catalogCompatible: RecommendedPartItem<T>[];
  excludedItems: T[];
  excludedCount: number;
} {
  const affinityByTarget = new Map<string, PartAffinityRecord>();
  const excludedTargetIds = new Set<string>();

  for (const rec of affinityRecords) {
    if (rec.anchorId === anchor.id && rec.doorType === doorType) {
      affinityByTarget.set(rec.targetId, rec);
      if (rec.excluded) excludedTargetIds.add(rec.targetId);
    }
  }

  const results: RecommendedPartItem<T>[] = [];
  const excludedItems: T[] = [];

  for (const cand of catalog) {
    if (cand.id === anchor.id) continue;
    const learned = affinityByTarget.get(cand.id);
    if (learned?.excluded) {
      excludedItems.push(cand);
      continue;
    }

    const role = classifySubPartRole(cand);
    const effectiveRole: Exclude<RecPartRole, "all"> = role || "bracket";
    const seed = role
      ? computeSeedMatch(anchor, cand, role, doorType)
      : { score: 0, reason: "" };

    const orderCount = learned?.orderCount || 0;
    const pinned = Boolean(learned?.pinned);

    // Only include if Admin-designated, Verified-shipment learned, or Catalog-compatible
    if (!pinned && orderCount === 0 && seed.score <= 0) {
      continue;
    }

    const sourceTier: RecommendationSourceTier = pinned
      ? "admin_designated"
      : orderCount > 0
        ? "verified_shipment"
        : "catalog_compatible";

    const totalScore =
      (pinned ? 1000 : 0) +
      (orderCount > 0 ? 300 + orderCount * 12 : 0) +
      seed.score;

    const matchReason = pinned
      ? seed.reason || "코아스 관리자 공식 지정 호환 부속"
      : orderCount > 0
        ? seed.reason || "출고확정(처리완료) 발주 동시 납품 품목"
        : seed.reason;

    results.push({
      item: cand,
      role: effectiveRole,
      sourceTier,
      seedScore: seed.score,
      orderCount,
      cartCount: 0,
      pinned,
      totalScore,
      matchReason,
    });
  }

  results.sort((a, b) => {
    const pDiff = tierPriority(b.sourceTier) - tierPriority(a.sourceTier);
    if (pDiff !== 0) return pDiff;
    if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount;
    if (b.seedScore !== a.seedScore) return b.seedScore - a.seedScore;
    return (b.item.image ? 1 : 0) - (a.item.image ? 1 : 0);
  });

  return {
    items: results,
    adminDesignated: results.filter((r) => r.sourceTier === "admin_designated"),
    verifiedShipment: results.filter(
      (r) => r.sourceTier === "verified_shipment",
    ),
    catalogCompatible: results.filter(
      (r) => r.sourceTier === "catalog_compatible",
    ),
    excludedItems,
    excludedCount: excludedTargetIds.size,
  };
}
