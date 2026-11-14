import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { trackEvent } from "@/lib/analytics";
import { SidebarFilters } from "@/components/SidebarFilters";
import { SearchModal } from "@/components/search-modal";

import img60kgSD from "@assets/1-60kg-SD-48P_1765161877020.gif";
import img80kgSD from "@assets/sliding-80Kg-50p_1766007601559.png";
import imgM80 from "@assets/sliding-M80-54p_1766008725035.png";
import img150kgSD from "@assets/sliding-150Kg-50p_1766008623356.png";
import img250kgSD from "@assets/sliding-250Kg-60p_1766008978683.png";
import img500kgSD from "@assets/sliding-500Kg-62p_1766009149325.png";
import imgDP20 from "@assets/parts_images/part-016.png";
import imgDP20Wide from "@assets/dp-20-22p_1766009769534.png";
import imgDP40 from "@assets/parts_images/part-018.png";
import imgDP40Wide from "@assets/dp-40-24p_1766010281516.png";
import imgDP60 from "@assets/parts_images/part-020.png";
import imgDP60Wide from "@assets/dp-60-26p_1766010790356.png";
import imgDP100 from "@assets/parts_images/part-022.png";
import imgDP100Wide from "@assets/dp-100-34p_1766011106176.png";
import img1Body4060 from "@assets/1body-40-60-28p_1766011601661.png";
import img1Body90 from "@assets/1body-90-32p_1766012196737.png";
import img60kgGSD from "@assets/parts_images/part-028.png";
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
import imgLadder2 from "@assets/parts_images/part-062.png";

import imgSL2831 from "@assets/parts_images/part-064.png";
import imgSL3332 from "@assets/parts_images/part-066.png";
import imgSL3445 from "@assets/parts_images/part-068.png";
import imgSL3540 from "@assets/parts_images/part-070.png";
import imgSL4550 from "@assets/parts_images/part-072.png";
import imgSL4977 from "@assets/parts_images/part-074.png";
import imgSL4550_2 from "@assets/parts_images/part-076.png";
import imgSL5544 from "@assets/parts_images/part-078.png";
import imgSL3337 from "@assets/parts_images/part-080.png";
import imgSL3032 from "@assets/parts_images/part-082.png";
import imgSL3032_2 from "@assets/parts_images/part-084.png";
import imgSL4953 from "@assets/parts_images/part-086.png";
import imgSL3332_glass80 from "@assets/parts_images/part-088.png";
import imgSL4550_glass150 from "@assets/parts_images/part-090.png";
import imgSL3332_c80 from "@assets/parts_images/part-092.png";
import imgSL3540_m80 from "@assets/parts_images/part-094.png";
import imgSL3337_dp from "@assets/parts_images/part-096.png";
import imgSL25 from "@assets/parts_images/part-098.png";
import imgSL3332_4fd from "@assets/parts_images/part-100.png";
import imgSL3332_2fd from "@assets/parts_images/part-102.png";
import imgSL5471 from "@assets/parts_images/part-104.png";
import imgSL6437 from "@assets/parts_images/part-106.png";
import imgSL3332_cubicle from "@assets/parts_images/part-108.png";
import imgSL1534 from "@assets/parts_images/part-110.png";
import imgSL1612 from "@assets/parts_images/part-112.png";
import imgSL5848 from "@assets/parts_images/part-114.png";
import imgSL3540_3 from "@assets/parts_images/part-116.png";
import imgSL3338 from "@assets/parts_images/part-118.png";
import imgSL3538 from "@assets/parts_images/part-120.png";
import imgSL3541 from "@assets/parts_images/part-122.png";
import imgSL1615 from "@assets/parts_images/part-124.png";
import imgSL1509 from "@assets/parts_images/part-126.png";
import imgRailCover1 from "@assets/parts_images/part-128.png";
import imgRailCover2 from "@assets/parts_images/part-130.png";
import imgRailCover3 from "@assets/parts_images/part-132.png";
import imgSD01Fe from "@assets/parts_images/part-134.png";
import imgSD01Al from "@assets/parts_images/part-136.png";
import imgSD02Fe from "@assets/parts_images/part-138.png";
import imgSD02Al from "@assets/parts_images/part-140.png";

interface PartItem {
  id: string;
  name: string;
  page: string;
  subtitle?: string;
  image: string;
  wide?: boolean;
}

const partsData: PartItem[][] = [
  [
    { id: "sd-60", name: "60kg(SD)", page: "48 p", image: img60kgSD },
    { id: "sd-80", name: "80kg(SD)", page: "50 p", image: img80kgSD },
    { id: "m-80", name: "M-80", page: "54 p", image: imgM80 },
    { id: "sd-150", name: "150kg(SD)", page: "56 p", image: img150kgSD },
    { id: "sd-250", name: "250kg(SD)", page: "60 p", image: img250kgSD },
    { id: "sd-500", name: "500kg(SD)", page: "62 p", image: img500kgSD },
    { id: "dp-20-wide", name: "DP-20", page: "22 p", image: imgDP20Wide, wide: true },
    { id: "dp-40-wide", name: "DP-40", page: "24 p", image: imgDP40Wide, wide: true },
  ],
  [
    { id: "dp-60-wide", name: "DP-60", page: "26 p", image: imgDP60Wide, wide: true },
    { id: "dp-100-wide", name: "DP-100", page: "34 p", image: imgDP100Wide, wide: true },
  ],
  [
    { id: "1body-40-60", name: "1 Body-40/60", page: "28 p", subtitle: "상부롤러 8mm / 2구 롤러", image: img1Body4060, wide: true },
    { id: "1body-90", name: "1 Body-90", page: "32 p", subtitle: "상부롤러 8mm / 2구 롤러", image: img1Body90, wide: true },
  ],
  [
    { id: "gsd-60", name: "60kg(GSD)", page: "64 p", image: img60kgGSD },
    { id: "gsd-80", name: "80kg(GSD)", page: "66 p", image: img80kgGSD },
    { id: "gdp-100", name: "100kg(GDP)", page: "68 p", image: img100kgGDP },
    { id: "gsd-150", name: "150kg(GSD)", page: "70 p", image: img150kgGSD },
    { id: "fd-40", name: "40kg(FD)", page: "74 p", image: img40kgFD },
    { id: "fd-2", name: "2구 (FD)", page: "72 p", image: img2FD },
  ],
  [
    { id: "fd-100", name: "100kg(FD)", page: "76 p", image: img100kgFD },
    { id: "sd-200", name: "200kg(SD)", page: "", image: img200kgSD },
    { id: "msd-100", name: "100kg(MSD)", page: "92 p", image: img100kgMSD },
    { id: "yl-202", name: "YL-202", page: "78 p", image: imgYL202 },
    { id: "yl-845", name: "YL-845", page: "80 p", image: imgYL845 },
  ],
  [
    { id: "wsd-yl960", name: "WSD-YL960", page: "86 p", image: imgWSDYL960 },
    { id: "wsd-yl970", name: "WSD-YL970", page: "88 p", image: imgWSDYL970 },
    { id: "sd-360", name: "SD-360 (DP)", page: "82 p", image: imgSD360 },
    { id: "sd-370", name: "SD-370 (DP)", page: "84 p", image: imgSD370 },
    { id: "ladder-1", name: "이동식사다리", page: "96 p", image: imgLadder1 },
    { id: "ladder-2", name: "이동식사다리", page: "96 p", image: imgLadder2 },
  ],
];

const slRailsData: PartItem[][] = [
  [
    { id: "sl-2831", name: "SL-2831", page: "", subtitle: "60kg(SD)", image: imgSL2831 },
    { id: "sl-3332", name: "SL-3332", page: "", subtitle: "80kg(SD)", image: imgSL3332 },
    { id: "sl-3445", name: "SL-3445", page: "", subtitle: "80kg(SD)", image: imgSL3445 },
    { id: "sl-3540", name: "SL-3540", page: "", subtitle: "M-80 일반", image: imgSL3540 },
    { id: "sl-4550", name: "SL-4550", page: "", subtitle: "150kg(SD)", image: imgSL4550 },
  ],
  [
    { id: "sl-4977", name: "SL-4977", page: "", subtitle: "150kg(SD) 벽체레일형", image: imgSL4977 },
    { id: "sl-4550-2", name: "SL-4550", page: "", subtitle: "250kg(SD)", image: imgSL4550_2 },
    { id: "sl-5544", name: "SL-5544", page: "", subtitle: "200kg(SD) 철롤러", image: imgSL5544 },
    { id: "sl-3337", name: "SL-3337", page: "", subtitle: "40, 60kg(DP)", image: imgSL3337 },
    { id: "sl-3032", name: "SL-3032", page: "", subtitle: "90kg(DP) 빌레스", image: imgSL3032 },
    { id: "sl-3032-2", name: "SL-3032", page: "", subtitle: "130kg(DP) 빌레스", image: imgSL3032_2 },
  ],
  [
    { id: "sl-4953", name: "SL-4953", page: "", subtitle: "60kg(SD) 샤워부스", image: imgSL4953 },
    { id: "sl-3332-glass80", name: "SL-3332", page: "", subtitle: "80kg(SD) 유리", image: imgSL3332_glass80 },
    { id: "sl-4550-glass150", name: "SL-4550", page: "", subtitle: "150kg(SD) 유리", image: imgSL4550_glass150 },
    { id: "sl-3332-c80", name: "SL-3332", page: "", subtitle: "C-80 반자동, 벨트", image: imgSL3332_c80 },
    { id: "sl-3540-m80", name: "SL-3540", page: "", subtitle: "M-80 반자동, 벨트", image: imgSL3540_m80 },
    { id: "sl-3337-dp", name: "SL-3337", page: "", subtitle: "40,60kg(DP) 반자동 벨트", image: imgSL3337_dp },
  ],
  [
    { id: "sl-25", name: "SL-25", page: "", subtitle: "φ25 2T SUS304", image: imgSL25 },
    { id: "sl-3332-4fd", name: "SL-3332", page: "", subtitle: "4구(FD)", image: imgSL3332_4fd },
    { id: "sl-3332-2fd", name: "SL-3332", page: "", subtitle: "2구(FD)", image: imgSL3332_2fd },
    { id: "sl-5471", name: "SL-5471", page: "", subtitle: "FD100 / SD500", image: imgSL5471 },
    { id: "sl-6437", name: "SL-6437", page: "", subtitle: "큐비클 롤러(SD)", image: imgSL6437 },
    { id: "sl-3332-cubicle", name: "SL-3332", page: "", subtitle: "큐비클 롤러", image: imgSL3332_cubicle },
  ],
  [
    { id: "sl-1534", name: "SL-1534", page: "", subtitle: "액자레일 대", image: imgSL1534 },
    { id: "sl-1612", name: "SL-1612", page: "", subtitle: "액자레일 소", image: imgSL1612 },
    { id: "sl-5848", name: "SL-5848", page: "", subtitle: "100kg 무빙월", image: imgSL5848 },
    { id: "sl-3540-3", name: "SL-3540", page: "", subtitle: "3연동", image: imgSL3540_3 },
    { id: "sl-3338", name: "SL-3338", page: "", subtitle: "원바디 40, 60", image: imgSL3338 },
    { id: "sl-3538", name: "SL-3538", page: "", subtitle: "원바디 90", image: imgSL3538 },
  ],
  [
    { id: "sl-3541", name: "SL-3541", page: "", subtitle: "100Kg (DP)", image: imgSL3541 },
    { id: "sl-1615", name: "SL-1615", page: "", subtitle: "하부레일 대", image: imgSL1615 },
    { id: "sl-1509", name: "SL-1509", page: "", subtitle: "하부레일 소", image: imgSL1509 },
    { id: "rail-cover-1", name: "원슬라이딩 레일+커버", page: "", image: imgRailCover1 },
    { id: "rail-cover-2", name: "2연동 레일+커버", page: "", image: imgRailCover2 },
    { id: "rail-cover-3", name: "벽체 카바형 레일+커버", page: "", image: imgRailCover3 },
  ],
];

const guidesData: PartItem[][] = [
  [
    { id: "sd-01-fe", name: "SD-01(철)", page: "41 p", subtitle: "L형 가이드, 주문제작 가능", image: imgSD01Fe },
    { id: "sd-01-al", name: "SD-01(AL)", page: "41 p", subtitle: "L형 가이드, 주문제작 가능", image: imgSD01Al },
    { id: "sd-02-fe", name: "SD-02(철)", page: "41 p", subtitle: "L형 가이드, 주문제작 가능", image: imgSD02Fe },
    { id: "sd-02-al", name: "SD-02(AL)", page: "41 p", subtitle: "L형 가이드, 주문제작 가능", image: imgSD02Al },
  ],
];

function PartCard({ item }: { item: PartItem }) {
  return (
    <Link href={`/product/${item.id}`} className={item.wide ? "col-span-2" : ""} onClick={() => trackEvent("product_selected", { product_id: item.id, location: "parts_index" })}>
      <div 
        className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-[#FF7B00]/50 transition-all duration-300 cursor-pointer h-full"
        data-testid={`card-part-${item.id}`}
      >
        <div className={`${item.wide ? "aspect-[8/3.5]" : "aspect-[4/3]"} bg-[#EAEAEA] flex items-center justify-center relative overflow-hidden`}>
          <img 
            src={item.image} 
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-3 text-center bg-white border-t border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#FF7B00] transition-colors">
            {item.name}
          </h3>
          {item.subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
          )}
          {item.page && (
            <p className="text-xs text-[#FF7B00] font-medium mt-1">{item.page}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

const BASE_URL = "https://e-coas.replit.app";

export default function PartsIndex() {
  const [searchOpen, setSearchOpen] = useState(false);
  
  return (
    <Layout>
      <Helmet>
        <title>부품 인덱스 | E-COAS</title>
        <meta name="description" content="E-COAS 전체 부품 인덱스. 슬라이딩 도어 시스템, SL 레일 시리즈, L형 가이드 등 모든 제품을 카테고리별로 탐색하세요." />
        <meta property="og:title" content="부품 인덱스 | E-COAS" />
        <meta property="og:description" content="E-COAS 전체 부품 인덱스. 슬라이딩 도어 시스템, SL 레일 시리즈, L형 가이드 등 모든 제품을 카테고리별로 탐색하세요." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/parts-index`} />
      </Helmet>
      <div className="pt-20 pb-16 bg-gradient-to-b from-gray-100 to-white min-h-screen">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-[#FF7B00] font-semibold text-sm tracking-widest uppercase mb-2">INDEX</p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="text-page-title">
              by product category and item numbers
            </h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <SidebarFilters onSearchClick={() => setSearchOpen(true)} />
            
            <div className="flex-1">
              <div className="space-y-6 mb-16">
                {partsData.map((row, rowIdx) => (
                  <div 
                    key={rowIdx} 
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                  >
                    {row.map((item) => (
                      <PartCard key={item.id} item={item} />
                    ))}
                  </div>
                ))}
              </div>

              <div className="mb-16">
                <div className="bg-gray-800 text-white px-6 py-3 rounded-t-lg">
                  <h2 className="text-lg font-bold">SL 레일 시리즈</h2>
                </div>
                <div className="bg-white rounded-b-lg p-4 border border-t-0 border-gray-200">
                  <div className="space-y-4">
                    {slRailsData.map((row, rowIdx) => (
                      <div 
                        key={rowIdx} 
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                      >
                        {row.map((item) => (
                          <PartCard key={item.id} item={item} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-[#FF7B00] text-white px-6 py-3 rounded-t-lg">
                  <h2 className="text-lg font-bold">L형 가이드</h2>
                </div>
                <div className="bg-white rounded-b-lg p-4 border border-t-0 border-gray-200">
                  <div className="space-y-4">
                    {guidesData.map((row, rowIdx) => (
                      <div 
                        key={rowIdx} 
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                      >
                        {row.map((item) => (
                          <PartCard key={item.id} item={item} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
