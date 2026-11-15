import React from "react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import { Maximize2, ArrowLeft, Plus, Check } from "lucide-react";
import { Link } from "wouter";
import { trackEvent } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";
import { resolveAssetUrl, useCmsBootstrap } from "@/lib/cms";
import { useOrderDraftSummary } from "@/lib/order-draft";

const BASE_URL = "https://e-coas.replit.app";

export default function NewProducts() {
  const { cms } = useCmsBootstrap();
  const { toast } = useToast();
  const { itemCount, hasActiveSession, getItemQty, addItem } =
    useOrderDraftSummary();

  const visibleItems = cms.newProducts.filter((item) => item.visible);

  return (
    <Layout>
      <Helmet>
        <title>신제품 | E-COAS</title>
        <meta
          name="description"
          content="코아스의 최신 기술이 집약된 신제품 라인업. 60kg~200kg 슬라이딩 도어 시스템, DP 댐핑 시리즈, GSD 유리 슬라이딩 도어 등 혁신적인 신제품을 만나보세요."
        />
        <meta property="og:title" content="신제품 | E-COAS" />
        <meta
          property="og:description"
          content="코아스의 최신 기술이 집약된 신제품 라인업. 60kg~200kg 슬라이딩 도어 시스템, DP 댐핑 시리즈, GSD 유리 슬라이딩 도어 등 혁신적인 신제품을 만나보세요."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/new-products`} />
      </Helmet>
      <div className="pt-24 pb-24 container mx-auto px-4">
        {hasActiveSession && (
          <div className="mb-8 bg-orange-50 border border-orange-300 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="text-xs sm:text-sm text-slate-800">
              <strong className="text-[#FF7B00]">
                ● 발주서 이어쓰기 모드:
              </strong>{" "}
              신제품 상세 제원·도면을 확인하거나{" "}
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            New Item
          </h1>
          <p className="text-xl text-gray-600">
            코아스의 최신 기술이 집약된 신제품 라인업을 소개합니다.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
          {visibleItems.map((item, idx) => {
            const addedQty = getItemQty(item.name, item.desc);
            return (
              <Link
                key={item.id}
                href={`/product/${item.productId}`}
                className={item.wide ? "lg:col-span-2" : ""}
                onClick={() =>
                  trackEvent("product_selected", {
                    product_id: item.productId,
                    location: "new_products",
                  })
                }
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: Math.min(idx * 0.07, 0.5),
                  }}
                  className={`group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border cursor-pointer h-full flex flex-col justify-between ${
                    addedQty > 0
                      ? "border-[#FF7B00] ring-1 ring-[#FF7B00]/40"
                      : "border-gray-100"
                  }`}
                >
                  <div>
                    <div
                      className={`${
                        item.wide ? "aspect-[8/3]" : "aspect-[4/3]"
                      } bg-white relative overflow-hidden`}
                    >
                      <img
                        src={resolveAssetUrl(item.image)}
                        alt={item.name}
                        style={
                          {
                            "--base-scale": item.baseScale || 1.1,
                            "--hover-scale": item.hoverScale || 1.3,
                          } as React.CSSProperties
                        }
                        className="w-full h-full object-contain p-0 transition-transform duration-500 [transform:scale(var(--base-scale))] group-hover:[transform:scale(var(--hover-scale))]"
                      />
                      {item.showBadge && (
                        <div className="absolute top-4 left-4 bg-[#FF7B00] text-white text-xs font-bold px-3 py-1 rounded-full z-10">
                          NEW
                        </div>
                      )}
                      {addedQty > 0 && (
                        <div className="absolute top-4 right-4 bg-slate-900/90 text-orange-300 text-xs font-bold px-3 py-1 rounded-full z-10">
                          발주담김 {addedQty}
                        </div>
                      )}
                      <div className="absolute bottom-4 right-4 w-10 h-10 bg-white group-hover:bg-[#FF7B00] rounded-full flex items-center justify-center z-10 transition-all duration-300 shadow-md border border-gray-200 group-hover:border-[#FF7B00]">
                        <Maximize2 className="w-5 h-5 text-[#FF7B00] group-hover:text-white transition-colors" />
                      </div>
                    </div>
                    <div className="p-6 pb-3">
                      <h3 className="text-lg font-bold mb-2 group-hover:text-[#FF7B00] transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  </div>

                  <div className="px-6 pb-5 pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const res = addItem({
                          productId: item.productId,
                          code: item.name,
                          title: item.desc,
                          spec: item.desc,
                        });
                        toast({
                          title: `발주서에 [${item.name}] 신제품이 담겼습니다.`,
                          description: `현재 발주서 총 ${res.itemCount}종 (해당 품목 수량: ${res.qty})`,
                        });
                      }}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        addedQty > 0
                          ? "bg-slate-800 hover:bg-slate-900 text-white"
                          : "bg-orange-50 hover:bg-[#FF7B00] text-[#FF7B00] hover:text-white border border-orange-200"
                      }`}
                    >
                      {addedQty > 0 ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-orange-400" />
                          <span>발주서 담김 ({addedQty}) +추가 담기</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>발주서에 바로 담기</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
