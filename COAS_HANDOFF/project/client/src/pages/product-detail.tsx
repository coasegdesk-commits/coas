import { Helmet } from "react-helmet-async";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import {
  ArrowLeft,
  Package,
  FileText,
  Scale,
  Loader2,
  Image as ImageIcon,
  Maximize2,
  ClipboardList,
  MessageSquare,
  Plus,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { resolveAssetUrl } from "@/lib/cms";
import { useOrderDraftSummary } from "@/lib/order-draft";
import type { CmsProduct } from "@shared/cms-types";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { itemCount, hasActiveSession, getItemQty, addItem } =
    useOrderDraftSummary();

  const {
    data: product,
    isLoading,
    error,
  } = useQuery<CmsProduct>({
    queryKey: ["/api/products", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await fetch(
        `/api/products/${encodeURIComponent(id || "")}`,
      );
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("제품을 찾을 수 없습니다.");
        }
        throw new Error("제품 정보를 불러오는 중 오류가 발생했습니다.");
      }
      return response.json();
    },
  });

  const BASE_URL = "https://e-coas.replit.app";

  if (isLoading) {
    return (
      <Layout>
        <div className="pt-20 pb-16 min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF7B00]" />
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    const errorMessage =
      error instanceof Error ? error.message : "제품을 찾을 수 없습니다.";
    return (
      <Layout>
        <div className="pt-20 pb-16 min-h-screen">
          <div className="container mx-auto px-4">
            <div className="text-center py-16 mt-[200px]">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h1
                className="text-2xl font-bold text-gray-900 mb-2"
                data-testid="text-error-title"
              >
                {errorMessage}
              </h1>
              <p className="text-gray-500 mb-6">
                요청하신 제품 정보를 찾을 수 없습니다.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/parts-index">
                  <Button className="bg-[#FF7B00] hover:bg-[#FF7B00]/90">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    부품 인덱스로 돌아가기
                  </Button>
                </Link>
                {hasActiveSession && (
                  <Link href="/order">
                    <Button variant="outline" className="border-[#FF7B00] text-[#FF7B00]">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      작성 중이던 발주서로 돌아가기
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const resolvedImage = product.imageUrl
    ? resolveAssetUrl(product.imageUrl)
    : "";
  const detailImages = Array.isArray(product.detailImages)
    ? product.detailImages.filter(Boolean)
    : [];

  const absoluteImageUrl = resolvedImage
    ? resolvedImage.startsWith("http")
      ? resolvedImage
      : `${BASE_URL}${resolvedImage}`
    : null;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameKo,
    alternateName: product.name,
    description: product.descriptionKo || product.description || undefined,
    category: product.categoryKo,
    brand: {
      "@type": "Brand",
      name: "E-COAS",
    },
    manufacturer: {
      "@type": "Organization",
      name: "E-COAS",
      alternateName: "코아스",
    },
    ...(absoluteImageUrl ? { image: absoluteImageUrl } : {}),
    ...(product.weightCapacity
      ? {
           additionalProperty: {
            "@type": "PropertyValue",
            name: "제품중량",
            value: product.weightCapacity,
          },
        }
      : {}),
  };

  const pageTitle = `${product.nameKo} (${product.name}) | E-COAS`;
  const pageDesc = product.descriptionKo
    ? `${product.descriptionKo} — E-COAS ${product.categoryKo} 제품`
    : `E-COAS ${product.categoryKo} 제품: ${product.nameKo} (${product.name})`;

  const pageLabel = product.pageNumber
    ? product.pageNumber.toLowerCase().includes("p")
      ? product.pageNumber
      : `${product.pageNumber} p`
    : null;

  const addedQty = getItemQty(product.name, product.nameKo);

  const handleAddCurrentProductToOrder = () => {
    const res = addItem({
      productId: product.id,
      code: product.name,
      title: product.nameKo,
      spec: product.specifications || "",
    });
    toast({
      title: `발주서에 [${product.name}] 품목이 추가되었습니다.`,
      description: `현재 발주서 총 ${res.itemCount}종 (해당 품목 수량: ${res.qty})`,
    });
  };

  return (
    <Layout>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`${BASE_URL}/product/${product.id}`} />
        {absoluteImageUrl && (
          <meta property="og:image" content={absoluteImageUrl} />
        )}
        <script type="application/ld+json">
          {JSON.stringify(productJsonLd)}
        </script>
      </Helmet>
      <div className="pt-20 pb-24 bg-gradient-to-b from-gray-100 to-white min-h-screen">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/parts-index"
                className="inline-flex items-center justify-center gap-2 bg-[#FF7B00] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#FF7B00]/90 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5" />
                부품 인덱스로 돌아가기
              </Link>
              <Link
                href="/new-products"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-300 py-3 px-5 rounded-lg font-semibold hover:bg-slate-50 shadow-sm transition-all duration-300"
              >
                신제품 페이지 보기
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={handleAddCurrentProductToOrder}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 px-5"
              >
                {addedQty > 0 ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-orange-400" />
                    발주서 담김 ({addedQty}) · 수량 +1 추가
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2 text-[#FF7B00]" />
                    현재 제품 발주서에 추가 담기
                  </>
                )}
              </Button>

              <Link href="/order">
                <Button className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold h-12 px-5 shadow-md">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {hasActiveSession
                    ? `작성 중이던 발주서로 돌아가기 (${itemCount}종)`
                    : "발주서 작성 화면으로 이동"}
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#FF7B00] to-orange-500 px-6 py-4">
              <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                <span>{product.categoryKo}</span>
                {product.category && (
                  <>
                    <span>•</span>
                    <span>{product.category}</span>
                  </>
                )}
              </div>
              <h1
                className="text-2xl md:text-3xl font-bold text-white"
                data-testid="text-product-name"
              >
                {product.nameKo}
              </h1>
              <p className="text-white/80">{product.name}</p>
            </div>

            <div className="p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {product.descriptionKo && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Package className="w-5 h-5 text-[#FF7B00]" />
                        제품 설명
                      </h2>
                      <p className="text-gray-600 whitespace-pre-line">
                        {product.descriptionKo}
                      </p>
                      {product.description && (
                        <p className="text-gray-500 text-sm mt-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                  )}

                  {product.specifications && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#FF7B00]" />
                        사양
                      </h2>
                      <p className="text-gray-600 whitespace-pre-line">
                        {product.specifications}
                      </p>
                    </div>
                  )}

                  {product.weightCapacity && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Scale className="w-5 h-5 text-[#FF7B00]" />
                        제품중량
                      </h2>
                      <p className="text-gray-600 font-medium text-lg">
                        {product.weightCapacity}
                      </p>
                    </div>
                  )}

                  {resolvedImage && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-[#FF7B00]" />
                        제품 이미지
                      </h2>
                      <div className="bg-[#EAEAEA] rounded-lg p-4 relative group/img overflow-hidden">
                        <img
                          src={resolvedImage}
                          alt={product.nameKo}
                          className="w-full h-auto object-contain rounded-lg transition-transform duration-500 group-hover/img:scale-105"
                        />
                        <Dialog
                          onOpenChange={(open) => {
                            if (open)
                              trackEvent("product_image_expanded", {
                                product_id: product.id,
                              });
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute bottom-6 right-6 transition-all duration-300 bg-white hover:bg-[#FF7B00] rounded-full flex items-center justify-center z-10 shadow-md border border-gray-200 hover:border-[#FF7B00] group/icon"
                            >
                              <Maximize2 className="w-4 h-4 text-[#FF7B00] group-hover/icon:text-white transition-colors" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] max-h-[95vh] p-4 overflow-auto bg-black/85 border-none">
                            <div className="flex items-center justify-center w-full h-full">
                              <img
                                src={resolvedImage}
                                alt={product.nameKo}
                                className="max-w-full max-h-[88vh] object-contain rounded-lg"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-6 h-full">
                  <div className="bg-gray-50 rounded-lg p-6 flex-grow">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      제품 정보
                    </h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">제품 ID</dt>
                        <dd
                          className="font-medium text-gray-900"
                          data-testid="text-product-id"
                        >
                          {product.id}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">모델명</dt>
                        <dd className="font-medium text-gray-900">
                          {product.name}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">카테고리</dt>
                        <dd className="font-medium text-gray-900">
                          {product.categoryKo}
                        </dd>
                      </div>
                      {pageLabel && (
                        <div className="flex justify-between">
                          <dt className="text-gray-500">카탈로그 페이지</dt>
                          <dd className="font-medium text-[#FF7B00]">
                            {pageLabel}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="bg-[#FF7B00]/5 border border-[#FF7B00]/20 rounded-lg p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        발주서 담기 및 제품 문의
                      </h3>
                      {addedQty > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-orange-300 text-xs font-bold">
                          현재 발주서에 {addedQty}개 담김
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">
                      작성 중인 발주서에 이 부품을 바로 추가하고 이어서 작성하거나, 담당자에게 견적·기술 문의를 남기실 수 있습니다.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <Button
                        type="button"
                        onClick={handleAddCurrentProductToOrder}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                      >
                        <Plus className="w-4 h-4 mr-2 text-[#FF7B00]" />
                        {addedQty > 0
                          ? `발주서 수량 +1 추가 (${addedQty})`
                          : "현재 발주서에 추가 담기"}
                      </Button>

                      <Link href="/order">
                        <Button className="w-full bg-[#FF7B00] hover:bg-[#e66f00] text-white font-semibold">
                          <ClipboardList className="w-4 h-4 mr-2" />
                          {hasActiveSession
                            ? `발주서로 돌아가기 (${itemCount}종)`
                            : "발주서 작성 화면 이동"}
                        </Button>
                      </Link>
                    </div>
                    <div className="pt-1">
                      <Link
                        href="/contact"
                        onClick={() =>
                          trackEvent("product_inquiry_clicked", {
                            product_id: product.id,
                          })
                        }
                      >
                        <Button
                          variant="outline"
                          className="w-full border-[#FF7B00]/40 text-[#FF7B00] hover:bg-[#FF7B00]/10 font-semibold"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          담당자 견적 / 기술 문의하기
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* 상세 도면 / 카탈로그 페이지 이미지 영역 (모든 제품 공용) */}
              {detailImages.length > 0 && (
                <div className="mt-10 pt-8 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#FF7B00]" />
                      상세 제원 및 카탈로그 도면 ({detailImages.length}페이지)
                    </h2>
                  </div>
                  <div className="flex flex-col items-center gap-8">
                    {detailImages.map((imgUrl, idx) => {
                      const src = resolveAssetUrl(imgUrl);
                      return (
                        <div
                          key={`${imgUrl}-${idx}`}
                          className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white"
                        >
                          <img
                            src={src}
                            alt={`${product.nameKo} 상세 도면 ${idx + 1}`}
                            className="w-full h-auto"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
