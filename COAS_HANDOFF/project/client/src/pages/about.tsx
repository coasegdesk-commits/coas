import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import ceoImage from "@assets/leehongmyung_1765052394787.jpg";
import heroBg from "@assets/stock_images/modern_interior_desi_8981a198.jpg";
import techBg from "@assets/stock_images/architectural_design_f9bb10a2.jpg";
import warehouseBg from "@assets/shutterstock_396462703_1765055010956.gif";
import { Lightbulb, Hammer, Handshake, ShieldCheck, Award, PenTool, Layers } from "lucide-react";

const BASE_URL = "https://e-coas.replit.app";

export default function About() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>회사소개 | E-COAS 코아스</title>
        <meta name="description" content="코아스는 인테리어 산업의 새로운 가치를 창조하는 기업입니다. 정성, 기술, 혁신을 바탕으로 고객과 Win-Win 전략을 추구하며 프리미엄 인테리어 하드웨어를 공급합니다." />
        <meta property="og:title" content="회사소개 | E-COAS 코아스" />
        <meta property="og:description" content="코아스는 인테리어 산업의 새로운 가치를 창조하는 기업입니다. 정성, 기술, 혁신을 바탕으로 고객과 Win-Win 전략을 추구하며 프리미엄 인테리어 하드웨어를 공급합니다." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/about`} />
      </Helmet>
      <div className="min-h-screen bg-white overflow-hidden">
        
        {/* 1. Hero Section */}
        <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
          {/* Background with overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src={heroBg} 
              alt="Modern Interior Background" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
          </div>

          {/* Content */}
          <div className="container mx-auto px-4 relative z-10 text-center text-white">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
                인테리어 산업의<br />
                <span className="text-[#FF7B00]">새로운 가치</span>를 창조하는<br />
                코아스
              </h1>
              <div className="w-20 h-1 bg-[#FF7B00] mx-auto mb-8" />
              <p className="text-lg md:text-2xl font-light text-gray-200 max-w-3xl mx-auto leading-relaxed break-keep">
                코아스는 인테리어 산업의 새로운 가치를 창조하기 위해<br className="hidden md:block" /> 
                선봉에 서고자 노력하고 개발하는 기업으로 거듭나겠습니다.
              </p>
            </motion.div>
          </div>
          
          {/* Scroll Indicator */}
          <motion.div 
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-white/50 to-transparent mx-auto" />
            <span className="text-xs tracking-widest mt-2 block">SCROLL</span>
          </motion.div>
        </section>

        {/* 2. Story & Philosophy Section */}
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              
              {/* CEO Image with Frame */}
              <motion.div 
                className="w-full lg:w-1/2 flex justify-center lg:justify-end"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="relative max-w-md w-full">
                   <div className="absolute -inset-6 border-2 border-[#FF7B00]/20 rounded-xl translate-x-4 translate-y-4 z-0" />
                   <div className="w-full aspect-[3/4] rounded-lg overflow-hidden relative shadow-2xl z-10">
                      <img 
                        src={ceoImage} 
                        alt="CEO Portrait" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                        <p className="text-2xl font-bold">이 홍 명</p>
                        <p className="text-[#FF7B00] font-medium text-sm tracking-wider uppercase mt-1">대표이사</p>
                      </div>
                   </div>
                </div>
              </motion.div>

              {/* Text Content */}
              <motion.div 
                className="w-full lg:w-1/2"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                <motion.div variants={fadeInUp} className="mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    고객과의 <span className="text-[#FF7B00]">Win-Win</span> 전략
                  </h2>
                  <p className="text-lg text-gray-600 leading-relaxed break-keep">
                    창사 이래 지금껏 고객사와 Win-Win 전략을 모토로 제품 하나하나에 정성과 기술적 완성도를 부여하여 
                    기능성 하드웨어의 생산과 유통 및 개발에 매진하고 있습니다.
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
                  <motion.div variants={fadeInUp} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center group hover:border-[#FF7B00]/30 transition-colors">
                    <div className="w-12 h-12 mx-auto bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4 group-hover:bg-[#FF7B00]/10 group-hover:text-[#FF7B00] transition-colors">
                      <Award className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">정성</h3>
                    <p className="text-sm text-gray-500">Sincerity</p>
                  </motion.div>
                  
                  <motion.div variants={fadeInUp} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center group hover:border-[#FF7B00]/30 transition-colors">
                    <div className="w-12 h-12 mx-auto bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4 group-hover:bg-[#FF7B00]/10 group-hover:text-[#FF7B00] transition-colors">
                      <PenTool className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">기술</h3>
                    <p className="text-sm text-gray-500">Technology</p>
                  </motion.div>

                  <motion.div variants={fadeInUp} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center group hover:border-[#FF7B00]/30 transition-colors">
                    <div className="w-12 h-12 mx-auto bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4 group-hover:bg-[#FF7B00]/10 group-hover:text-[#FF7B00] transition-colors">
                      <Lightbulb className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">혁신</h3>
                    <p className="text-sm text-gray-500">Innovation</p>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 3. Technology & Design Section */}
        <section className="py-24 bg-white overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row-reverse gap-16 items-center">
              
              {/* Visuals */}
              <motion.div 
                className="w-full lg:w-1/2"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4 translate-y-8">
                    <img src={techBg} className="w-full h-64 object-cover rounded-2xl shadow-lg" alt="Hardware Detail" />
                    <div className="bg-gray-100 p-6 rounded-2xl h-40 flex flex-col justify-center">
                      <Layers className="w-8 h-8 text-[#FF7B00] mb-3" />
                      <span className="font-semibold text-gray-900">System Hardware</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-900 p-6 rounded-2xl h-40 flex flex-col justify-center text-white">
                      <Hammer className="w-8 h-8 text-[#FF7B00] mb-3" />
                      <span className="font-semibold">Craftsmanship</span>
                    </div>
                    <img src={warehouseBg} className="w-full h-64 object-cover rounded-2xl shadow-lg" alt="Logistics Warehouse" />
                  </div>
                </div>
              </motion.div>

              {/* Text Content */}
              <motion.div 
                className="w-full lg:w-1/2"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                <motion.div variants={fadeInUp}>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                    기술, 기능성, 디자인의<br />
                    <span className="text-[#FF7B00]">완벽한 결합</span>
                  </h2>
                  <div className="h-1 w-16 bg-gray-200 mb-8" />
                  <p className="text-lg text-gray-600 leading-relaxed mb-8 break-keep">
                    코아스는 뛰어난 기술, 기능성, 디자인의 완벽한 결합을 만듭니다. 
                    건축 및 레일 시스템부터 힌지, 손잡이, 슬라이딩 및 폴딩도어 피팅까지 
                    광범위한 제품을 개발하고 생산합니다.
                  </p>
                  
                  <ul className="space-y-4">
                    {[
                      "건축 하드웨어 시스템",
                      "슬라이딩 & 폴딩 도어 피팅",
                      "샤워부스 & 큐비클 시스템",
                      "파워 경첩 시스템"
                    ].map((item, i) => (
                      <motion.li key={i} className="flex items-center gap-3 text-gray-700 font-medium" variants={fadeInUp}>
                        <div className="w-2 h-2 bg-[#FF7B00] rounded-full" />
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 4. Vision & Commitment Section */}
        <section className="py-24 bg-[#1a1a1a] text-white relative overflow-hidden">
          {/* Abstract Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF7B00] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
          </div>

          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="max-w-4xl mx-auto"
            >
              <ShieldCheck className="w-16 h-16 text-[#FF7B00] mx-auto mb-8" />
              <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">
                최고의 파트너가 되어<br />
                미래를 함께 창출하겠습니다
              </h2>
              <p className="text-lg md:text-xl text-gray-400 leading-relaxed mb-12 break-keep">
                코아스 브랜드는 건축 하드웨어, 백색가전 산업, 유통업, 기술산업과 DIY 분야의 최고의 파트너입니다.<br className="hidden md:block" />
                품질·혁신·신뢰성을 바탕으로 고객과 함께 새로운 미래를 창출하며,<br className="hidden md:block" /> 
                변함없이 기술개발과 품질향상에 힘쓸 것입니다.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 md:gap-8 border-t border-white/10 pt-12">
                <div className="px-6 py-2 border border-white/20 rounded-full text-sm uppercase tracking-widest text-gray-400">Quality</div>
                <div className="px-6 py-2 border border-white/20 rounded-full text-sm uppercase tracking-widest text-gray-400">Innovation</div>
                <div className="px-6 py-2 border border-white/20 rounded-full text-sm uppercase tracking-widest text-gray-400">Trust</div>
                <div className="px-6 py-2 border border-white/20 rounded-full text-sm uppercase tracking-widest text-gray-400">Partnership</div>
              </div>
            </motion.div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
