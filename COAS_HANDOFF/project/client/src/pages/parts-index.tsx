import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { ArrowLeft, Plus, Check } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { SidebarFilters } from "@/components/SidebarFilters";
import { SearchModal } from "@/components/search-modal";
import { useToast } from "@/hooks/use-toast";
import { useCmsBootstrap, resolveAssetUrl } from "@/lib/cms";
import { useOrderDraftSummary } from "@/lib/order-draft";
import type { PartCardItem, PartsSection } from "@shared/cms-types";

function PartCard({
  item,
  addedQty,
  onAddOrder,
}: {
  item: PartCardItem;
  addedQty: number;
  onAddOrder: (item: PartCardItem) => void;
}) {
  const targetId = item.productId || item.id;
  return (
    <Link
      href={`/product/${targetId}`}
      className={item.wide ? "col-span-2" : ""}
      onClick={() =>
        trackEvent("product_selected", {
          product_id: targetId,
          location: "parts_index",
        })
      }
    >
      <div
        id={targetId}
        className={`group bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col scroll-mt-28 ${
          addedQty > 0
            ? "border-[#FF7B00] ring-1 ring-[#FF7B00]/40"
            : "border-gray-200 hover:border-[#FF7B00]/50"
        }`}
        data-testid={`card-part-${targetId}`}
      >
        <div
          className={`${
            item.wide ? "aspect-[8/3.5]" : "aspect-[4/3]"
          } bg-[#EAEAEA] flex items-center justify-center relative overflow-hidden`}
        >
          {item.image ? (
            <img
              src={resolveAssetUrl(item.image)}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-xs text-gray-400">이미지 준비중</span>
          )}

          {addedQty > 0 && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-900/90 text-orange-300 text-[10px] font-bold">
              발주담김 {addedQty}
            </span>
          )}
        </div>
        <div className="p-3 text-center bg-white border-t border-gray-100 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#FF7B00] transition-colors">
              {item.name}
            </h3>
            {item.subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
            )}
            {item.page && (
              <p className="text-xs text-[#FF7B00] font-medium mt-1">
                {item.page}
              </p>
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddOrder(item);
              }}
              data-testid={`button-order-add-${targetId}`}
              className={`w-full py-1.5 px-2 rounded text-[11px] font-bold flex items-center justify-center gap-1 transition-colors ${
                addedQty > 0
                  ? "bg-slate-800 hover:bg-slate-900 text-white"
                  : "bg-orange-50 hover:bg-[#FF7B00] text-[#FF7B00] hover:text-white border border-orange-200"
              }`}
            >
              {addedQty > 0 ? (
                <>
                  <Check className="w-3 h-3 text-orange-400" />
                  <span>발주서 담김 ({addedQty}) +추가</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  <span>발주서에 담기</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

function groupSectionRows(items: PartCardItem[]): PartCardItem[][] {
  const visibleItems = items.filter((item) => item.visible !== false);
  const grouped = new Map<number, PartCardItem[]>();
  for (const item of visibleItems) {
    const groupKey = typeof item.rowGroup === "number" ? item.rowGroup : 999;
    const list = grouped.get(groupKey) || [];
    list.push(item);
    grouped.set(groupKey, list);
  }
  return Array.from(grouped.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, list]) => list);
}

function getHeaderBgClass(color: PartsSection["headerColor"]): string {
  switch (color) {
    case "orange":
      return "bg-[#FF7B00]";
    case "slate":
      return "bg-slate-700";
    case "dark":
    default:
      return "bg-gray-800";
  }
}

const BASE_URL = "https://e-coas.replit.app";

export default function PartsIndex() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { cms } = useCmsBootstrap();
  const { toast } = useToast();
  const { itemCount, hasActiveSession, getItemQty, addItem } =
    useOrderDraftSummary();

  const visibleSections = useMemo(
    () =>
      cms.partsSections
        .filter((sec) => sec.visible !== false)
        .sort((a, b) => a.order - b.order),
    [cms.partsSections],
  );

  const handleAddOrderFromCard = (item: PartCardItem) => {
    const res = addItem({
      productId: item.productId || item.id,
      code: item.name,
      title: item.subtitle || "",
      spec: item.subtitle || "",
    });
    toast({
      title: `발주서에 [${item.name}] 품목이 담겼습니다.`,
      description: `현재 발주서 총 ${res.itemCount}종 (해당 품목 수량: ${res.qty})`,
    });
  };

  return (
    <Layout>
      <Helmet>
        <title>부품 인덱스 | E-COAS</title>
        <meta
          name="description"
          content="E-COAS 전체 부품 인덱스. 슬라이딩 도어 시스템, SL 레일 시리즈, L형 가이드 등 모든 제품을 카테고리별로 탐색하세요."
        />
        <meta property="og:title" content="부품 인덱스 | E-COAS" />
        <meta
          property="og:description"
          content="E-COAS 전체 부품 인덱스. 슬라이딩 도어 시스템, SL 레일 시리즈, L형 가이드 등 모든 제품을 카테고리별로 탐색하세요."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/parts-index`} />
      </Helmet>
      <div className="pt-20 pb-24 bg-gradient-to-b from-gray-100 to-white min-h-screen">
        <div className="container mx-auto px-4">
          {hasActiveSession && (
            <div className="mb-6 bg-orange-50 border border-orange-300 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="text-xs sm:text-sm text-slate-800">
                <strong className="text-[#FF7B00]">
                  ● 발주서 이어쓰기 모드:
                </strong>{" "}
                제품 카드를 클릭해 상세 도면을 확인하거나{" "}
                <strong>[+ 발주서에 담기]</strong> 버튼으로 바로 추가한 뒤 발주서로 돌아가실 수 있습니다.
              </div>
              <Link href="/order">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-[#FF7B00] hover:bg-[#e66f00] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>작성 중이던 발주서로 돌아가기 (현재 {itemCount}종)</span>
                </button>
              </Link>
            </div>
          )}

          <div className="text-center mb-8">
            <p className="text-[#FF7B00] font-semibold text-sm tracking-widest uppercase mb-2">
              INDEX
            </p>
            <h1
              className="text-2xl md:text-3xl font-bold text-gray-900"
              data-testid="text-page-title"
            >
              by product category and item numbers
            </h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <SidebarFilters onSearchClick={() => setSearchOpen(true)} />

            <div className="flex-1 space-y-16">
              {visibleSections.map((section) => {
                const rows = groupSectionRows(section.items);
                if (rows.length === 0) return null;

                const gridColsClass =
                  section.columns === 4
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                    : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4";

                if (!section.showHeader) {
                  return (
                    <div
                      key={section.id}
                      id={section.id}
                      className="space-y-6 scroll-mt-24"
                    >
                      {rows.map((row, rowIdx) => (
                        <div key={rowIdx} className={gridColsClass}>
                          {row.map((item) => (
                            <PartCard
                              key={item.id}
                              item={item}
                              addedQty={getItemQty(item.name, item.subtitle)}
                              onAddOrder={handleAddOrderFromCard}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                }

                return (
                  <div
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-24"
                  >
                    <div
                      className={`${getHeaderBgClass(
                        section.headerColor,
                      )} text-white px-6 py-3 rounded-t-lg`}
                    >
                      <h2 className="text-lg font-bold">{section.title}</h2>
                    </div>
                    <div className="bg-white rounded-b-lg p-4 border border-t-0 border-gray-200">
                      <div className="space-y-4">
                        {rows.map((row, rowIdx) => (
                          <div key={rowIdx} className={gridColsClass}>
                            {row.map((item) => (
                              <PartCard
                                key={item.id}
                                item={item}
                                addedQty={getItemQty(item.name, item.subtitle)}
                                onAddOrder={handleAddOrderFromCard}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        language="ko"
      />
    </Layout>
  );
}
