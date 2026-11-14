import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Shield, Award, Truck, Search, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { SearchModal } from "@/components/search-modal";

// Import generated images
import heroImage from "@assets/generated_images/large_scale_interior_hardware_company_atmosphere.png";
import categoryDoor from "@assets/generated_images/close-up_of_a_sleek,_modern_brushed_metal_door_handle_on_a_high-quality_wooden_door..png";
import categoryCabinet from "@assets/generated_images/modern_kitchen_cabinet_hardware_detail..png";
import categoryGlass from "@assets/generated_images/glass_door_hardware_fittings..png";
import categoryFurniture from "@assets/generated_images/furniture_hardware_and_drawer_slides..png";

// Import product images from PDF
import img60kgSD from "@assets/parts_images/part-004.png";
import img80kgSD from "@assets/parts_images/part-006.png";
import imgM80 from "@assets/parts_images/part-008.png";
import img150kgSD from "@assets/parts_images/part-010.png";
import imgDP40 from "@assets/parts_images/part-018.png";
import imgDP60 from "@assets/parts_images/part-020.png";
import img60kgGSD from "@assets/parts_images/part-028.png";
import img100kgFD from "@assets/parts_images/part-040.png";

const BASE_URL = "https://e-coas.replit.app";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "E-COAS",
  "alternateName": "코아스",
  "url": BASE_URL,
  "logo": `${BASE_URL}/favicon.png`,
  "description": "인테리어 하드웨어 전문 기업. 슬라이딩 도어, 댐핑 시스템, 유리 피팅, 레일 등 프리미엄 건축 하드웨어를 공급합니다.",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+82-2-1234-5678",
    "contactType": "customer service",
    "availableLanguage": ["Korean", "English"]
  }
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "E-COAS",
  "url": BASE_URL,
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${BASE_URL}/parts-index?q={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
};

export default function Home() {
  const [searchOpen, setSearchOpen] = useState(false);
  
  return (
    <Layout>
      <Helmet>
        <title>E-COAS | 인테리어 하드웨어 전문 기업</title>
        <meta name="description" content="코아스는 슬라이딩 도어, 댐핑 시스템, 유리 피팅, 레일 등 프리미엄 인테리어 하드웨어를 공급하는 전문 기업입니다. AI 검색으로 원하는 제품을 빠르게 찾아보세요." />
        <meta property="og:title" content="E-COAS | 인테리어 하드웨어 전문 기업" />
        <meta property="og:description" content="코아스는 슬라이딩 도어, 댐핑 시스템, 유리 피팅, 레일 등 프리미엄 인테리어 하드웨어를 공급하는 전문 기업입니다." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={BASE_URL} />
        <script type="application/ld+json">{JSON.stringify(organizationJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(websiteJsonLd)}</script>
      </Helmet>
      {/* Hero Section */}
      <section className="relative h-[90vh] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/20" />
        </div>
        
        <div className="relative h-full container mx-auto px-4 flex flex-col justify-center text-white">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl space-y-6"
          >
            <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium tracking-wide uppercase">
              Premium Interior Hardware
            </span>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
              앞서가는 COAS와 <br />
              <span className="text-white/90">함께 하세요.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-xl leading-relaxed">
              AI 검색으로 원하는 인테리어 부품을 빠르고 정확하게 찾아보세요.<br />
              슬라이딩도어, 댐핑, 레일, 샤워부스, 큐비클, 유리파티션 등 전세계 모든 제품을 자연어로 검색할 수 있습니다.
            </p>
            <div className="flex flex-wrap gap-4 pt-4 items-center">
              <Link href="/products">
                <Button size="lg" className="bg-white text-black hover:bg-white/90 border-none text-base h-12 px-8">
                  Explore Collections
                </Button>
              </Link>
              <Button 
                size="lg" 
                onClick={() => setSearchOpen(true)}
                className="bg-gradient-to-r from-[#FF7B00] to-orange-500 hover:from-[#FF7B00]/90 hover:to-orange-500/90 text-white text-base h-12 px-20 shadow-lg shadow-orange-500/30 border-none"
                data-testid="button-hero-ai-search"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI 검색
                <Search className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      {/* Categories Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-foreground">Curated Categories</h2>
            <p className="text-muted-foreground text-lg">Discover our comprehensive range of high-end hardware solutions designed for modern living.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CategoryCard 
              title="Door Hardware" 
              image={categoryDoor} 
              desc="Handles, Locks, Hinges"
            />
            <CategoryCard 
              title="Cabinet Fittings" 
              image={categoryCabinet} 
              desc="Knobs, Pulls, Slides"
            />
            <CategoryCard 
              title="Glass Systems" 
              image={categoryGlass} 
              desc="Patch Fittings, Showers"
            />
            <CategoryCard 
              title="Furniture Parts" 
              image={categoryFurniture} 
              desc="Legs, Castors, Connectors"
            />
          </div>

          {/* Featured Products - 2 rows x 4 columns */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-center mb-8">인기 제품</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <ProductCard id="sd-60" name="60kg(SD)" page="48 p" image={img60kgSD} />
              <ProductCard id="sd-80" name="80kg(SD)" page="50 p" image={img80kgSD} />
              <ProductCard id="m-80" name="M-80" page="54 p" image={imgM80} />
              <ProductCard id="sd-150" name="150kg(SD)" page="56 p" image={img150kgSD} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ProductCard id="dp-40" name="DP-40" page="24 p" image={imgDP40} />
              <ProductCard id="dp-60" name="DP-60" page="26 p" image={imgDP60} />
              <ProductCard id="gsd-60" name="60kg(GSD)" page="64 p" image={img60kgGSD} />
              <ProductCard id="fd-100" name="100kg(FD)" page="76 p" image={img100kgFD} />
            </div>
          </div>
        </div>
      </section>
      {/* Features / Why Choose Us */}
      <section className="py-24 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureItem 
              icon={<Shield className="h-10 w-10 text-primary" />}
              title="Uncompromising Quality"
              desc="Every piece is tested for durability and performance, ensuring it stands the test of time."
            />
            <FeatureItem 
              icon={<Award className="h-10 w-10 text-primary" />}
              title="Award-Winning Design"
              desc="Our collections feature designs that have been recognized globally for their innovation and aesthetics."
            />
            <FeatureItem 
              icon={<Truck className="h-10 w-10 text-primary" />}
              title="Reliable Logistics"
              desc="Efficient supply chain management ensures your projects stay on schedule with timely deliveries."
            />
          </div>
        </div>
      </section>
      {/* Call to Action */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-50" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to elevate your project?</h2>
          <p className="text-primary-foreground/70 text-xl max-w-2xl mx-auto mb-10">
            Get in touch with our specialists for a consultation or request our latest catalog.
          </p>
          <Link href="/contact">
            <Button size="lg" variant="secondary" className="h-14 px-10 text-lg">
              Get a Quote <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
      <SearchModal 
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        language="ko"
      />
    </Layout>
  );
}

function CategoryCard({ title, image, desc }: { title: string, image: string, desc: string }) {
  return (
    <Link href="/products">
      <a className="group block overflow-hidden rounded-lg relative aspect-[4/5]">
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10" />
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white translate-y-2 group-hover:translate-y-0 transition-transform">
          <h3 className="text-2xl font-bold mb-1">{title}</h3>
          <p className="text-white/80 text-sm opacity-0 group-hover:opacity-100 transition-opacity delay-100">{desc}</p>
        </div>
      </a>
    </Link>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex flex-col items-center text-center md:items-start md:text-left p-6 rounded-xl hover:bg-background transition-colors duration-300">
      <div className="mb-6 p-4 bg-primary/5 rounded-full">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function ProductCard({ id, name, page, image }: { id: string, name: string, page: string, image: string }) {
  return (
    <Link href={`/product/${id}`}>
      <div 
        className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-[#FF7B00]/50 transition-all duration-300 cursor-pointer"
        data-testid={`card-product-${id}`}
      >
        <div className="aspect-square bg-white flex items-center justify-center relative overflow-hidden p-2">
          <img 
            src={image} 
            alt={name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-[#FF7B00]/0 group-hover:bg-[#FF7B00]/5 transition-colors duration-300" />
        </div>
        <div className="p-3 text-center bg-gray-50 border-t border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#FF7B00] transition-colors">
            {name}
          </h3>
          {page && (
            <p className="text-xs text-[#FF7B00] font-medium mt-1">{page}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
