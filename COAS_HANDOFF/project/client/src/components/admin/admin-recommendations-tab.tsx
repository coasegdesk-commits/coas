import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { adminFetch, resolveAssetUrl } from "@/lib/cms";
import {
  computeRelatedPartRecommendations,
  inferDefaultDoorType,
  isAnchorRollerItem,
  type CatalogPartLike,
} from "@/lib/part-recommender";
import type {
  AdminAffinityAction,
  CmsProduct,
  DoorMaterialType,
  PartAffinityRecord,
  PartAffinitySnapshot,
  PartsSection,
} from "@shared/cms-types";
import {
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";

interface AdminRecommendationsTabProps {
  products: CmsProduct[];
  partsSections: PartsSection[];
  affinity: PartAffinitySnapshot;
  onSaved: () => void;
}

export function AdminRecommendationsTab({
  products,
  partsSections,
  affinity,
  onSaved,
}: AdminRecommendationsTabProps) {
  const { toast } = useToast();
  const [records, setRecords] = useState<PartAffinityRecord[]>(
    affinity.records || [],
  );
  const [totalLearnedOrders, setTotalLearnedOrders] = useState<number>(
    affinity.totalLearnedOrders || 0,
  );
  const [anchorSearch, setAnchorSearch] = useState("");
  const [addPartSearch, setAddPartSearch] = useState("");

  useEffect(() => {
    setRecords(affinity.records || []);
    setTotalLearnedOrders(affinity.totalLearnedOrders || 0);
  }, [affinity]);

  // Build unified catalog list identical to /order
  const catalogList = useMemo<CatalogPartLike[]>(() => {
    const map = new Map<string, CatalogPartLike>();

    const classifyGroup = (
      code: string,
      title: string,
      catKo = "",
    ): {
      group: CatalogPartLike["categoryGroup"];
      unit: "SET" | "EA";
    } => {
      const hay = `${code} ${title} ${catKo}`.toUpperCase();
      if (hay.includes("SL-") || hay.includes("레일") || hay.includes("커버")) {
        return { group: "rail", unit: "EA" };
      }
      if (
        hay.includes("DP") ||
        hay.includes("1 BODY") ||
        hay.includes("1BODY") ||
        hay.includes("원바디") ||
        hay.includes("댐핑")
      ) {
        return { group: "damping", unit: "SET" };
      }
      if (
        hay.includes("GSD") ||
        hay.includes("GDP") ||
        hay.includes("유리") ||
        hay.includes("가이드") ||
        hay.includes("SD-01") ||
        hay.includes("SD-02")
      ) {
        const isGuide =
          hay.includes("가이드") ||
          hay.includes("SD-01") ||
          hay.includes("SD-02");
        return { group: "glass", unit: isGuide ? "EA" : "SET" };
      }
      return { group: "sliding", unit: "SET" };
    };

    for (const sec of partsSections) {
      if (sec.visible === false) continue;
      for (const card of sec.items) {
        if (card.visible === false) continue;
        const key = card.productId || card.id;
        if (map.has(key)) continue;
        const matchedProd = products.find((p) => p.id === card.productId);
        const { group, unit } = classifyGroup(
          card.name,
          matchedProd?.nameKo || card.subtitle || "",
          sec.title,
        );
        map.set(key, {
          id: key,
          code: card.name,
          title:
            matchedProd?.nameKo && matchedProd.nameKo !== card.name
              ? matchedProd.nameKo
              : card.subtitle || sec.title,
          specHint:
            card.subtitle ||
            matchedProd?.specifications ||
            (unit === "EA" ? "표준 규격" : "기본 세트 구성"),
          page:
            card.page ||
            (matchedProd?.pageNumber ? `${matchedProd.pageNumber}p` : ""),
          categoryGroup: group,
          rawCategoryKo: matchedProd?.categoryKo || sec.title,
          defaultUnit: unit,
          image: card.image || matchedProd?.imageUrl || undefined,
        });
      }
    }

    for (const p of products) {
      if (map.has(p.id) || p.id.endsWith("-wide")) continue;
      const { group, unit } = classifyGroup(p.name, p.nameKo, p.categoryKo);
      map.set(p.id, {
        id: p.id,
        code: p.name,
        title: p.nameKo,
        specHint:
          p.specifications ||
          (unit === "EA" ? "표준 규격" : "기본 세트 구성"),
        page: p.pageNumber ? `${p.pageNumber}p` : "",
        categoryGroup: group,
        rawCategoryKo: p.categoryKo,
        defaultUnit: unit,
        image: p.imageUrl || undefined,
      });
    }

    return Array.from(map.values());
  }, [partsSections, products]);

  const anchorRollers = useMemo(
    () => catalogList.filter((item) => isAnchorRollerItem(item)),
    [catalogList],
  );

  const [selectedAnchorId, setSelectedAnchorId] = useState<string>(() => {
    return anchorRollers[0]?.id || "sd-60";
  });
  const [doorType, setDoorType] = useState<DoorMaterialType>("wood");

  const activeAnchor = useMemo(
    () =>
      anchorRollers.find((a) => a.id === selectedAnchorId) ||
      anchorRollers[0] ||
      null,
    [anchorRollers, selectedAnchorId],
  );

  const filteredAnchors = useMemo(() => {
    const q = anchorSearch.trim().toLowerCase();
    if (!q) return anchorRollers;
    return anchorRollers.filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.specHint.toLowerCase().includes(q),
    );
  }, [anchorRollers, anchorSearch]);

  const recGroups = useMemo(() => {
    if (!activeAnchor) {
      return {
        adminDesignated: [],
        verifiedShipment: [],
        catalogCompatible: [],
        excludedItems: [],
        excludedCount: 0,
      };
    }
    return computeRelatedPartRecommendations(
      activeAnchor,
      catalogList,
      doorType,
      records,
    );
  }, [activeAnchor, catalogList, doorType, records]);

  const addableSubParts = useMemo(() => {
    if (!activeAnchor) return [];
    const q = addPartSearch.trim().toLowerCase();
    if (!q) return [];
    const designatedSet = new Set(
      records
        .filter(
          (r) =>
            r.anchorId === activeAnchor.id &&
            r.doorType === doorType &&
            r.pinned,
        )
        .map((r) => r.targetId),
    );
    return catalogList
      .filter(
        (c) =>
          c.id !== activeAnchor.id &&
          !isAnchorRollerItem(c) &&
          !designatedSet.has(c.id) &&
          (c.code.toLowerCase().includes(q) ||
            c.title.toLowerCase().includes(q) ||
            c.specHint.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [activeAnchor, addPartSearch, catalogList, doorType, records]);

  const totalDesignatedCount = useMemo(
    () => records.filter((r) => r.pinned && !r.excluded).length,
    [records],
  );
  const totalVerifiedPairsCount = useMemo(
    () => records.filter((r) => !r.pinned && !r.excluded && r.orderCount > 0).length,
    [records],
  );

  const handleCurate = async (
    targetId: string,
    action: AdminAffinityAction,
    msg: string,
  ) => {
    if (!activeAnchor) return;
    try {
      const res = await adminFetch<{
        records?: PartAffinityRecord[];
        totalLearnedOrders?: number;
      }>("/api/admin/part-affinity/curate", {
        method: "POST",
        body: JSON.stringify({
          anchorId: activeAnchor.id,
          targetId,
          doorType,
          action,
        }),
      });
      if (Array.isArray(res.records)) setRecords(res.records);
      if (typeof res.totalLearnedOrders === "number") {
        setTotalLearnedOrders(res.totalLearnedOrders);
      }
      toast({ title: msg });
      onSaved();
    } catch (err: any) {
      toast({
        title: "설정 저장 실패",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleResetExclusions = async () => {
    if (!activeAnchor) return;
    try {
      const res = await adminFetch<{ records?: PartAffinityRecord[] }>(
        "/api/admin/part-affinity/reset-exclusions",
        {
          method: "POST",
          body: JSON.stringify({ anchorId: activeAnchor.id, doorType }),
        },
      );
      if (Array.isArray(res.records)) setRecords(res.records);
      toast({ title: "제외 품목이 복원되었습니다." });
      onSaved();
    } catch (err: any) {
      toast({
        title: "복원 실패",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Governance Policy Banner */}
      <Card className="border-orange-200 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#FF7B00]" />
              <h2 className="text-base font-bold">
                발주서 추천 부속 관리 (관리자 지정 vs 출고확정 학습 분리 운영)
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              일반 고객 화면에서는 편집 기능이 잠겨 조회·담기만 가능하며,{" "}
              <strong className="text-orange-300">① 관리자 공식 지정 추천</strong>이
              최상단에 먼저 노출되고{" "}
              <strong className="text-emerald-300">
                ② 발주서 [처리완료(출고확정)] 시 자동 학습된 부품
              </strong>
              이 별도 분류로 그다음에 노출됩니다.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-lg bg-slate-950/60 border border-slate-700 text-center">
              <div className="text-[11px] text-orange-300 font-semibold">
                ★ 관리자 지정 조합
              </div>
              <div className="text-lg font-extrabold text-white">
                {totalDesignatedCount}건
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-lg bg-slate-950/60 border border-slate-700 text-center">
              <div className="text-[11px] text-emerald-300 font-semibold">
                ✓ 출고확정 학습
              </div>
              <div className="text-lg font-extrabold text-white">
                {totalLearnedOrders}발주 ({totalVerifiedPairsCount}조합)
              </div>
            </div>
            <a
              href="/order"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2.5 rounded-lg bg-[#FF7B00] hover:bg-[#e66f00] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <span>발주서 화면 확인</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Roller Selector (4 cols) */}
        <Card className="lg:col-span-4 border-gray-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#FF7B00]" />
                기준 롤러(본체) 선택 ({anchorRollers.length}종)
              </h3>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={anchorSearch}
                onChange={(e) => setAnchorSearch(e.target.value)}
                placeholder="롤러 코드명(60kg, DP-60, M-80) 검색..."
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="max-h-[640px] overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-lg">
              {filteredAnchors.map((anc) => {
                const isSelected = activeAnchor?.id === anc.id;
                const ancPinnedCnt = records.filter(
                  (r) => r.anchorId === anc.id && r.pinned && !r.excluded,
                ).length;
                const ancVerifiedCnt = records.filter(
                  (r) =>
                    r.anchorId === anc.id &&
                    !r.pinned &&
                    !r.excluded &&
                    r.orderCount > 0,
                ).length;

                return (
                  <button
                    key={anc.id}
                    type="button"
                    onClick={() => {
                      setSelectedAnchorId(anc.id);
                      setDoorType(inferDefaultDoorType(anc));
                      setAddPartSearch("");
                    }}
                    className={`w-full px-3 py-2.5 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-orange-50 border-l-4 border-l-[#FF7B00]"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded border border-gray-200 bg-white p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                        {anc.image ? (
                          <img
                            src={resolveAssetUrl(anc.image)}
                            alt={anc.code}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-[9px] text-gray-400">NO IMG</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-gray-900 truncate">
                          {anc.code}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                          {anc.title}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {ancPinnedCnt > 0 && (
                        <Badge className="bg-[#FF7B00] text-white text-[10px] px-1.5 py-0">
                          ★{ancPinnedCnt}
                        </Badge>
                      )}
                      {ancVerifiedCnt > 0 && (
                        <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">
                          ✓{ancVerifiedCnt}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right: Separate Classification Management for Selected Roller (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeAnchor && (
            <>
              {/* Active Roller + Door Type Context Header */}
              <Card className="border-gray-200">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-[#FF7B00] text-white text-xs font-extrabold">
                        {activeAnchor.code}
                      </span>
                      <span className="font-bold text-sm text-gray-900">
                        {activeAnchor.title}
                      </span>
                      {activeAnchor.page && (
                        <span className="text-xs text-gray-500">
                          ({activeAnchor.page})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      도어 재질별로 추천 부속이 별도 저장·분류됩니다.
                    </p>
                  </div>

                  <div className="inline-flex rounded-lg border border-orange-300 bg-orange-50/50 p-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDoorType("wood")}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-extrabold transition-colors cursor-pointer ${
                        doorType === "wood"
                          ? "bg-[#FF7B00] text-white shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      목재·일반 도어용 설정
                    </button>
                    <button
                      type="button"
                      onClick={() => setDoorType("glass")}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-extrabold transition-colors cursor-pointer ${
                        doorType === "glass"
                          ? "bg-[#FF7B00] text-white shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      유리 도어용 설정
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 1: ★ 관리자 지정 공식 추천 (Shown First to Customers) */}
              <Card className="border-2 border-orange-300">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-orange-200">
                    <div>
                      <h4 className="text-sm font-extrabold text-[#9a4400] flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-[#FF7B00] fill-[#FF7B00]" />
                        1순위 분류: 관리자 지정 공식 추천 (
                        {recGroups.adminDesignated.length}종)
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5">
                        코아스 관리자가 직접 지정한 부품으로, 고객 추천 팝업 최상단에
                        가장 먼저 고정 노출됩니다.
                      </p>
                    </div>
                  </div>

                  {/* Direct Catalog Search & Add to Official Designated */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        value={addPartSearch}
                        onChange={(e) => setAddPartSearch(e.target.value)}
                        placeholder="전체 233개 카탈로그 부품 중 공식 추천으로 추가할 모델명·품명 검색 (예: SL-2831, SD-01, 손잡이)..."
                        className="pl-9 h-9 text-xs border-orange-300"
                      />
                      {addPartSearch && (
                        <button
                          type="button"
                          onClick={() => setAddPartSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {addPartSearch.trim() && (
                      <div className="rounded-lg border border-orange-200 bg-orange-50/40 divide-y divide-orange-100">
                        {addableSubParts.length === 0 ? (
                          <div className="p-3 text-xs text-gray-500 text-center">
                            검색어와 일치하는 추가 가능 부품이 없습니다.
                          </div>
                        ) : (
                          addableSubParts.map((cand) => (
                            <div
                              key={cand.id}
                              className="px-3 py-2 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {cand.image && (
                                  <img
                                    src={resolveAssetUrl(cand.image)}
                                    alt={cand.code}
                                    className="w-9 h-9 rounded border bg-white object-contain p-0.5 shrink-0"
                                  />
                                )}
                                <div className="min-w-0">
                                  <span className="font-extrabold text-gray-900 mr-1.5">
                                    [{cand.code}]
                                  </span>
                                  <span className="text-gray-700">
                                    {cand.title}
                                  </span>
                                  <span className="text-gray-400 ml-1.5">
                                    ({cand.specHint})
                                  </span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  handleCurate(
                                    cand.id,
                                    "pin",
                                    `★ [${cand.code}] 품목을 관리자 공식 추천으로 등록했습니다.`,
                                  );
                                  setAddPartSearch("");
                                }}
                                className="h-7 text-xs bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold shrink-0"
                              >
                                ★ 공식 지정 추가
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {recGroups.adminDesignated.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-400 bg-orange-50/30 rounded-lg border border-dashed border-orange-200">
                      현재 등록된 관리자 공식 지정 부품이 없습니다. 위 검색창에서
                      추가하거나 아래 목록에서 [★ 공식지정]을 눌러 등록하세요.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {recGroups.adminDesignated.map((rec) => (
                        <div
                          key={rec.item.id}
                          className="p-2.5 rounded-lg border border-orange-300 bg-orange-50/30 flex items-center justify-between gap-2.5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-12 h-12 rounded border border-orange-200 bg-white p-0.5 flex items-center justify-center shrink-0">
                              {rec.item.image ? (
                                <img
                                  src={resolveAssetUrl(rec.item.image)}
                                  alt={rec.item.code}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <span className="text-[9px] text-gray-400">
                                  NO IMG
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <Badge className="bg-[#FF7B00] text-white text-[10px] px-1.5 py-0">
                                  ★ 공식지정
                                </Badge>
                                <span className="font-extrabold text-xs text-gray-900 truncate">
                                  {rec.item.code}
                                </span>
                              </div>
                              <div className="text-xs text-gray-700 truncate mt-0.5">
                                {rec.item.title}
                              </div>
                              {rec.orderCount > 0 && (
                                <div className="text-[10.5px] font-bold text-emerald-700">
                                  출고확정 {rec.orderCount}건 동시 납품됨
                                </div>
                              )}
                            </div>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleCurate(
                                rec.item.id,
                                "unpin",
                                `[${rec.item.code}] 공식 지정을 해제했습니다.`,
                              )
                            }
                            className="h-7 text-[11px] shrink-0"
                          >
                            지정 해제
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SECTION 2: ✓ 출고확정(처리완료) 자동 학습 목록 (Separately Classified!) */}
              <Card className="border-2 border-emerald-300">
                <CardContent className="p-4 space-y-3">
                  <div className="pb-2 border-b border-emerald-200">
                    <h4 className="text-sm font-extrabold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      2순위 별도 분류: 출고확정(처리완료) 발주 자동학습 (
                      {recGroups.verifiedShipment.length}종)
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5">
                      관리자가 발주서 접수 내역을{" "}
                      <strong className="text-emerald-700">[처리완료]</strong>로
                      확정한 건만 자동 집계되며, 관리자 지정 목록 아래에 별도
                      섹션으로 구분 노출됩니다.
                    </p>
                  </div>

                  {recGroups.verifiedShipment.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-400 bg-emerald-50/30 rounded-lg border border-dashed border-emerald-200">
                      아직 이 롤러({doorType === "glass" ? "유리 도어" : "목재·일반 도어"}
                      )로 출고확정(처리완료)된 발주 학습 데이터가 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recGroups.verifiedShipment.map((rec) => (
                        <div
                          key={rec.item.id}
                          className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/30 flex flex-wrap items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-11 h-11 rounded border border-emerald-200 bg-white p-0.5 flex items-center justify-center shrink-0">
                              {rec.item.image ? (
                                <img
                                  src={resolveAssetUrl(rec.item.image)}
                                  alt={rec.item.code}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <span className="text-[9px] text-gray-400">
                                  NO IMG
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">
                                  ✓ 출고확정 {rec.orderCount}건
                                </Badge>
                                <span className="font-extrabold text-xs text-gray-900">
                                  {rec.item.code}
                                </span>
                                <span className="text-xs text-gray-600 truncate">
                                  {rec.item.title}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-500 mt-0.5">
                                {rec.matchReason}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() =>
                                handleCurate(
                                  rec.item.id,
                                  "pin",
                                  `★ [${rec.item.code}] 품목을 관리자 공식 추천으로 승격했습니다.`,
                                )
                              }
                              className="h-7 text-[11px] bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold"
                            >
                              ★ 공식지정 승격
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleCurate(
                                  rec.item.id,
                                  "reset_order_count",
                                  `[${rec.item.code}] 출고학습 건수를 초기화했습니다.`,
                                )
                              }
                              className="h-7 text-[11px]"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              건수 초기화
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleCurate(
                                  rec.item.id,
                                  "exclude",
                                  `[${rec.item.code}] 품목을 추천에서 제외했습니다.`,
                                )
                              }
                              className="h-7 text-[11px] text-red-600 border-red-200 hover:bg-red-50"
                            >
                              × 제외
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SECTION 3: 카탈로그 규격 호환 후보 및 제외 관리 */}
              <Card className="border-gray-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">
                        3순위 분류: 카탈로그 규격 호환 후보 (
                        {recGroups.catalogCompatible.length}종)
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        하중·시리즈 규격 기준 기본 호환 후보입니다. 핵심 부품은 [★
                        공식지정]으로 올리고, 비호환 품목은 [× 제외]하세요.
                      </p>
                    </div>
                  </div>

                  <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-lg">
                    {recGroups.catalogCompatible.map((rec) => (
                      <div
                        key={rec.item.id}
                        className="px-3 py-2 flex items-center justify-between gap-2 text-xs hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded border bg-white p-0.5 flex items-center justify-center shrink-0">
                            {rec.item.image ? (
                              <img
                                src={resolveAssetUrl(rec.item.image)}
                                alt={rec.item.code}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <span className="text-[9px] text-gray-400">
                                NO IMG
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-extrabold text-gray-900 mr-1.5">
                              {rec.item.code}
                            </span>
                            <span className="text-gray-700">
                              {rec.item.title}
                            </span>
                            <span className="text-gray-400 ml-1.5">
                              · {rec.matchReason}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleCurate(
                                rec.item.id,
                                "pin",
                                `★ [${rec.item.code}] 품목을 관리자 공식 추천으로 지정했습니다.`,
                              )
                            }
                            className="h-7 text-[11px] border-orange-300 text-[#c25900] hover:bg-orange-50 font-bold"
                          >
                            ★ 공식지정
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleCurate(
                                rec.item.id,
                                "exclude",
                                `[${rec.item.code}] 품목을 이 롤러 추천에서 제외했습니다.`,
                              )
                            }
                            className="h-7 text-[11px] text-gray-500 hover:text-red-600"
                          >
                            × 제외
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {recGroups.excludedCount > 0 && (
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-700">
                          현재 제외된 부품 ({recGroups.excludedCount}종)
                        </span>
                        <button
                          type="button"
                          onClick={handleResetExclusions}
                          className="text-xs font-bold text-[#FF7B00] underline cursor-pointer"
                        >
                          제외 품목 전체 복원
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recGroups.excludedItems.map((ex) => (
                          <button
                            key={ex.id}
                            type="button"
                            onClick={() =>
                              handleCurate(
                                ex.id,
                                "unexclude",
                                `[${ex.code}] 품목 제외를 해제했습니다.`,
                              )
                            }
                            className="px-2 py-1 rounded bg-white border border-gray-300 hover:border-[#FF7B00] text-xs font-semibold text-gray-700 cursor-pointer"
                          >
                            {ex.code} ({ex.title}) ↺ 복원
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
