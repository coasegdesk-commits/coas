import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import { Maximize2 } from "lucide-react";
import { Link } from "wouter";
import { trackEvent } from "@/lib/analytics";

import img60kgSD from "@assets/1-60kg-SD-48P_1765161288917.gif";
import img80kgSD from "@assets/2-80kg-SD-50P_1765161559365.gif";
import imgM80 from "@assets/3-M-80-54p_1765161792190.png";
import imgDP40 from "@assets/DP-40_1770327501473.png";
import imgDP60 from "@assets/DP-60_1770328862066.png";
import img60kgGSD from "@assets/60kg(GSD)_1770329444630.png";
import img1Body4060 from "@assets/1body-40-60-28p_1766011601661.png";
import img200kgSD from "@assets/parts_images/part-042.png";
import imgDP60Wide from "@assets/DP-60-2_1770330446962.png";

const BASE_URL = "https://e-coas.replit.app";

export default function NewProducts() {
  return (
    <Layout>
      <Helmet>
        <title>신제품 | E-COAS</title>
        <meta name="description" content="코아스의 최신 기술이 집약된 신제품 라인업. 60kg~200kg 슬라이딩 도어 시스템, DP 댐핑 시리즈, GSD 유리 슬라이딩 도어 등 혁신적인 신제품을 만나보세요." />
        <meta property="og:title" content="신제품 | E-COAS" />
        <meta property="og:description" content="코아스의 최신 기술이 집약된 신제품 라인업. 60kg~200kg 슬라이딩 도어 시스템, DP 댐핑 시리즈, GSD 유리 슬라이딩 도어 등 혁신적인 신제품을 만나보세요." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/new-products`} />
      </Helmet>
      <div className="pt-24 pb-16 container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">New Item</h1>
          <p className="text-xl text-gray-600">
            코아스의 최신 기술이 집약된 신제품 라인업을 소개합니다.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
          {[
            { id: "sd-60", name: "60kg(SD)", desc: "60kg 하중 슬라이딩 도어 시스템", href: "/product/sd-60", image: img60kgSD, baseScale: 1.1, hoverScale: 1.3 },
            { id: "sd-80", name: "80kg(SD)", desc: "80kg 하중 슬라이딩 도어 시스템", href: "/product/sd-80", image: img80kgSD, baseScale: 1.1, hoverScale: 1.3 },
            { id: "m-80", name: "M-80", desc: "M-80 슬라이딩 도어 시스템", href: "/product/m-80", image: imgM80, baseScale: 1.1, hoverScale: 1.3 },
            { id: "dp-40", name: "DP-40", desc: "DP-40 뎀핑 슬라이딩 도어", href: "/product/dp-40-wide", image: imgDP40, baseScale: 1.2, hoverScale: 1.44 },
            { id: "sd-200-small", name: "200kg(SD)", desc: "200kg 하중 슬라이딩 도어 시스템", href: "/product/sd-200", image: imgDP60, baseScale: 1.1, hoverScale: 1.3 },
            { id: "gsd-60", name: "60kg(GSD)", desc: "60kg 유리 슬라이딩 도어", href: "/product/gsd-60", image: img60kgGSD, baseScale: 1.1, hoverScale: 1.3 },
            { id: "1body-40-60", name: "1 Body-40/60/90", desc: "원바디 슬라이딩 도어 시스템", href: "/product/1body-40-60", image: img1Body4060, wide: true, baseScale: 1.05, hoverScale: 1.2 },
            { id: "dp-60-wide", name: "DP-60", desc: "DP-60 뎀핑 슬라이딩 도어 시스템", href: "/product/dp-60-wide", image: imgDP60Wide, wide: true, baseScale: 1.05, hoverScale: 1.2 },
          ].map((item, idx) => (
            <Link key={item.id} href={item.href} className={item.wide ? "lg:col-span-2" : ""} onClick={() => trackEvent("product_selected", { product_id: item.href.split("/").pop()!, location: "new_products" })}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer h-full"
              >
                <div className={`${item.wide ? "aspect-[8/3]" : "aspect-[4/3]"} bg-gray-50 relative overflow-hidden`}>
                  <img 
                    src={item.image} 
                    alt={item.name}
                    style={{ 
                      "--base-scale": item.baseScale || 1.1,
                      "--hover-scale": item.hoverScale || 1.3
                    } as React.CSSProperties}
                    className="w-full h-full object-contain p-4 transition-transform duration-500 [transform:scale(var(--base-scale))] group-hover:[transform:scale(var(--hover-scale))]"
                  />
                  <div className="absolute top-4 left-4 bg-[#FF7B00] text-white text-xs font-bold px-3 py-1 rounded-full z-10">
                    NEW
                  </div>
                  <div className="absolute bottom-4 right-4 w-10 h-10 bg-white group-hover:bg-[#FF7B00] rounded-full flex items-center justify-center z-10 transition-all duration-300 shadow-md border border-gray-200 group-hover:border-[#FF7B00]">
                    <Maximize2 className="w-5 h-5 text-[#FF7B00] group-hover:text-white transition-colors" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-2 group-hover:text-[#FF7B00] transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
