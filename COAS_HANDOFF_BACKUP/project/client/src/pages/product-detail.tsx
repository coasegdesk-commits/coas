import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { ArrowLeft, Package, FileText, Scale, Loader2, Image, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import img60kgSD from "@assets/1-60kg-SD-48P_1765161877020.gif";
import img80kgSD from "@assets/sliding-80Kg-50p_1766007601559.png";
import imgM80 from "@assets/sliding-M80-54p_1766008725035.png";
import img150kgSD from "@assets/sliding-150Kg-50p_1766008623356.png";
import img250kgSD from "@assets/sliding-250Kg-60p_1766008978683.png";
import img500kgSD from "@assets/sliding-500Kg-62p_1766009149325.png";
import imgDP20Wide from "@assets/dp-20-22p_1766009769534.png";
import imgDP40Wide from "@assets/dp-40-24p_1766010281516.png";
import imgDP60Wide from "@assets/DP-60_1770328862066.png";
import imgDP100Wide from "@assets/dp-100-34p_1766011106176.png";
import img1Body4060 from "@assets/1body-40-60-28p_1766011601661.png";
import img1Body90 from "@assets/1body-90-32p_1766012196737.png";
import imgDP40 from "@assets/DP-40_1770327501473.png";
import img60kgGSD from "@assets/60kg(GSD)_1770329444630.png";
import img80kgGSD from "@assets/parts_images/part-030.png";
import img100kgGDP from "@assets/parts_images/part-032.png";
import img150kgGSD from "@assets/parts_images/part-034.png";
import img40kgFD from "@assets/parts_images/part-036.png";
import img2FD from "@assets/parts_images/part-038.png";
import img100kgFD from "@assets/parts_images/part-040.png";
import img200kgSD from "@assets/parts_images/part-042.png";
import img100kgMSD from "@assets/parts_images/part-044.png";
import imgYL202 from "@assets/parts_images/part-046.png";
import imgYL845 from "@assets/parts_images/part-048.png";
import imgWSDYL960 from "@assets/parts_images/part-052.png";
import imgWSDYL970 from "@assets/parts_images/part-054.png";
import imgSD360 from "@assets/parts_images/part-056.png";
import imgSD370 from "@assets/parts_images/part-058.png";
import imgLadder1 from "@assets/parts_images/part-060.png";
import imgSD60_48p from "@assets/coas_페이지_048_1770322997387.png";
import imgSD60_49p from "@assets/coas_페이지_049_1770322997388.png";

const imgSliding60kgDetails = img80kgSD; // Temporarily using available image to fix crash

const productImageMap: Record<string, string> = {
  "sd-60": img60kgSD,
  "sd-80": img80kgSD,
  "m-80": imgM80,
  "sd-150": img150kgSD,
  "sd-250": img250kgSD,
  "sd-500": img500kgSD,
  "dp-20-wide": imgDP20Wide,
  "dp-40-wide": imgDP40Wide,
  "dp-60-wide": imgDP60Wide,
  "dp-100-wide": imgDP100Wide,
  "1body-40-60": img1Body4060,
  "1body-90": img1Body90,
  "gsd-60": img60kgGSD,
  "dp-40": imgDP40,
  "gsd-80": img80kgGSD,
  "gdp-100": img100kgGDP,
  "gsd-150": img150kgGSD,
  "fd-40": img40kgFD,
  "fd-2": img2FD,
  "fd-100": img100kgFD,
  "sd-200": img200kgSD,
  "msd-100": img100kgMSD,
  "yl-202": imgYL202,
  "yl-845": imgYL845,
  "wsd-yl960": imgWSDYL960,
  "wsd-yl970": imgWSDYL970,
  "sd-360": imgSD360,
  "sd-370": imgSD370,
  "ladder-1": imgLadder1,
  "ladder-2": imgLadder1,
};

interface Product {
  id: string;
  name: string;
  nameKo: string;
  category: string;
  categoryKo: string;
  description: string | null;
  descriptionKo: string | null;
  specifications: string | null;
  weightCapacity: string | null;
  pageNumber: string | null;
  imageUrl: string | null;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("제품을 찾을 수 없습니다.");
          } else {
            throw new Error("Failed to fetch product");
          }
          return;
        }
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError("제품 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const BASE_URL = "https://e-coas.replit.app";

  if (loading) {
    return (
      <Layout>
        <div className="pt-20 pb-16 min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF7B00]" />
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="pt-20 pb-16 min-h-screen">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-error-title">
                {error || "제품을 찾을 수 없습니다."}
              </h1>
              <p className="text-gray-500 mb-6">요청하신 제품 정보를 찾을 수 없습니다.</p>
              <Link href="/parts-index">
                <Button className="bg-[#FF7B00] hover:bg-[#FF7B00]/90">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  부품 인덱스로 돌아가기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const resolvedImage = productImageMap[product.id] || product.imageUrl || null;
  const absoluteImageUrl = resolvedImage
    ? resolvedImage.startsWith("http")
      ? resolvedImage
      : `${BASE_URL}${resolvedImage}`
    : null;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.nameKo,
    "alternateName": product.name,
    "description": product.descriptionKo || product.description || undefined,
    "category": product.categoryKo,
    "brand": {
      "@type": "Brand",
      "name": "E-COAS"
    },
    "manufacturer": {
      "@type": "Organization",
      "name": "E-COAS",
      "alternateName": "코아스"
    },
    ...(absoluteImageUrl ? { "image": absoluteImageUrl } : {}),
    ...(product.weightCapacity ? { "additionalProperty": { "@type": "PropertyValue", "name": "제품중량", "value": product.weightCapacity } } : {}),
  };

  const pageTitle = `${product.nameKo} (${product.name}) | E-COAS`;
  const pageDesc = product.descriptionKo
    ? `${product.descriptionKo} — E-COAS ${product.categoryKo} 제품`
    : `E-COAS ${product.categoryKo} 제품: ${product.nameKo} (${product.name})`;

  return (
    <Layout>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`${BASE_URL}/product/${product.id}`} />
        {absoluteImageUrl && <meta property="og:image" content={absoluteImageUrl} />}
        <script type="application/ld+json">{JSON.stringify(productJsonLd)}</script>
      </Helmet>
      <div className="pt-20 pb-16 bg-gradient-to-b from-gray-100 to-white min-h-screen">
        <div className="container mx-auto px-4">
          <Link href="/parts-index" className="inline-flex items-center justify-center gap-2 bg-[#FF7B00] text-white py-3 rounded-lg font-semibold hover:bg-[#FF7B00]/90 shadow-md hover:shadow-lg mb-6 transition-all duration-300 w-full lg:w-64">
            <ArrowLeft className="w-5 h-5" />
            부품 인덱스로 돌아가기
          </Link>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#FF7B00] to-orange-500 px-6 py-4">
              <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                <span>{product.categoryKo}</span>
                <span>•</span>
                <span>{product.category}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white" data-testid="text-product-name">
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
                      <p className="text-gray-600">{product.descriptionKo}</p>
                      {product.description && (
                        <p className="text-gray-500 text-sm mt-1">{product.description}</p>
                      )}
                    </div>
                  )}

                  {product.specifications && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#FF7B00]" />
                        사양
                      </h2>
                      <p className="text-gray-600">{product.specifications}</p>
                    </div>
                  )}

                  {product.weightCapacity && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Scale className="w-5 h-5 text-[#FF7B00]" />
                        제품중량
                      </h2>
                      <p className="text-gray-600 font-medium text-lg">{product.weightCapacity}</p>
                    </div>
                  )}

                  {(product.imageUrl || productImageMap[product.id]) && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Image className="w-5 h-5 text-[#FF7B00]" />
                        제품
                      </h2>
                      <div className="bg-[#EAEAEA] rounded-lg p-4 relative group/img overflow-hidden">
                        <img 
                          src={productImageMap[product.id] || product.imageUrl || ""} 
                          alt={product.nameKo}
                          className="w-full h-auto object-contain rounded-lg transition-transform duration-500 group-hover/img:scale-110"
                        />
                        <Dialog onOpenChange={(open) => {
                          if (open) trackEvent("product_image_expanded", { product_id: product.id });
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="absolute bottom-6 right-6 transition-all duration-300 bg-white hover:bg-[#FF7B00] rounded-full flex items-center justify-center z-10 shadow-md border border-gray-200 hover:border-[#FF7B00] group/icon"
                            >
                              <Maximize2 className="w-4 h-4 text-[#FF7B00] group-hover/icon:text-white transition-colors" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[100vw] max-h-[100vh] p-0 overflow-hidden border-none bg-transparent shadow-none w-screen h-screen">
                            <div className="relative w-full h-full flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
                              <img 
                                src={productImageMap[product.id] || product.imageUrl || ""} 
                                alt={product.nameKo}
                                className="max-w-full max-h-[100vh] scale-110 object-contain rounded-lg shadow-2xl"
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
                    <h3 className="font-semibold text-gray-900 mb-4">제품 정보</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">제품 ID</dt>
                        <dd className="font-medium text-gray-900" data-testid="text-product-id">{product.id}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">카테고리</dt>
                        <dd className="font-medium text-gray-900">{product.categoryKo}</dd>
                      </div>
                      {product.pageNumber && (
                        <div className="flex justify-between">
                          <dt className="text-gray-500">카탈로그 페이지</dt>
                          <dd className="font-medium text-[#FF7B00]">{product.pageNumber} p</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="bg-[#FF7B00]/5 border border-[#FF7B00]/20 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">문의하기</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      이 제품에 대해 더 알고 싶으시면 문의해 주세요.
                    </p>
                    <Link href="/contact" onClick={() => trackEvent("product_inquiry_clicked", { product_id: product.id })}>
                      <Button className="w-full bg-[#FF7B00] hover:bg-[#FF7B00]/90">
                        문의하기
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* 상세 페이지 이미지 삽입 영역 */}
              {product.id === "sd-60" && (
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <div className="flex flex-col items-center gap-8">
                    <img 
                      src={imgSD60_48p} 
                      alt="제품 상세 정보 1" 
                      className="w-full h-auto"
                    />
                    <img 
                      src={imgSD60_49p} 
                      alt="제품 상세 정보 2" 
                      className="w-full h-auto"
                    />
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
