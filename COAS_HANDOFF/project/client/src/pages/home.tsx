import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Award, Truck, FileText } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { SearchModal } from "@/components/search-modal";
import { resolveAssetUrl, useCmsBootstrap } from "@/lib/cms";

const BASE_URL = "https://e-coas.replit.app";

export default function Home() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { cms } = useCmsBootstrap();
  const { design } = cms;
  const { hero, company } = design;

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "E-COAS",
    alternateName: "코아스",
    url: BASE_URL,
    logo: `${BASE_URL}/favicon.png`,
    description: company.footerDesc,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: company.phone,
      contactType: "customer service",
      availableLanguage: ["Korean", "English"],
    },
  };

  return (
    <Layout>
      <Helmet>
        <title>E-COAS | 인테리어 하드웨어 전문 기업</title>
        <meta
          name="description"
          content="코아스는 슬라이딩 도어, 댐핑 시스템, 유리 피팅, 레일 등 프리미엄 인테리어 하드웨어를 공급하는 전문 기업입니다."
        />
        <meta property="og:title" content="E-COAS | 인테리어 하드웨어 전문 기업" />
        <meta
          property="og:description"
          content="코아스는 슬라이딩 도어, 댐핑 시스템, 유리 피팅, 레일 등 프리미엄 인테리어 하드웨어를 공급하는 전문 기업입니다."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={BASE_URL} />
        <script type="application/ld+json">{JSON.stringify(organizationJsonLd)}</script>
      </Helmet>

      {/* Hero Section */}
      <section className="relative h-screen min-h-[640px] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500"
          style={{ backgroundImage: `url("${resolveAssetUrl(hero.bgImageUrl)}")` }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, rgba(0,0,0,${
                (hero.overlayOpacity ?? 75) / 100
              }), rgba(0,0,0,0.2))`,
            }}
          />
        </div>

        <div className="relative h-full container mx-auto px-4 flex flex-col justify-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl space-y-6"
          >
            {hero.badgeText && (
              <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium tracking-wide uppercase">
                {hero.badgeText}
              </span>
            )}
            <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
              {hero.titleLine1} <br />
              <span className="text-white/90">{hero.titleLine2}</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-xl leading-relaxed whitespace-pre-line">
              {hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-4 pt-4 items-center">
              <Link href={hero.primaryBtnHref || "/parts-index"}>
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-white/90 border-none text-base h-12 px-8 cursor-pointer"
                >
                  {hero.primaryBtnText || "Explore Collections"}
                </Button>
              </Link>
              <Link href={hero.orderBtnHref || "/order"}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#FF7B00] to-orange-500 hover:from-[#FF7B00]/90 hover:to-orange-500/90 text-white text-base h-12 px-16 shadow-lg shadow-orange-500/30 border-none cursor-pointer"
                  data-testid="button-hero-order"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  {hero.orderBtnText || "발주서 작성"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-foreground">
              {design.categoriesSectionTitle}
            </h2>
            <p className="text-muted-foreground text-lg">
              {design.categoriesSectionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {design.categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                title={cat.title}
                image={resolveAssetUrl(cat.image)}
                desc={cat.desc}
                href={cat.href || "/parts-index"}
              />
            ))}
          </div>

          {/* Featured Products */}
          {design.featuredProducts.length > 0 && (
            <div className="mt-16">
              <h3 className="text-2xl font-bold text-center mb-8">
                {design.featuredSectionTitle || "인기 제품"}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {design.featuredProducts.map((fp) => (
                  <ProductCard
                    key={fp.id}
                    id={fp.productId}
                    name={fp.name}
                    page={fp.page}
                    image={resolveAssetUrl(fp.image)}
                  />
                ))}
              </div>
            </div>
          )}
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
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to elevate your project?
          </h2>
          <p className="text-primary-foreground/70 text-xl max-w-2xl mx-auto mb-10">
            전문 상담팀에 제품 견적을 문의하시거나 온라인 발주서를 바로 접수하실 수 있습니다.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/order">
              <Button
                size="lg"
                className="h-14 px-10 text-lg bg-[#FF7B00] hover:bg-[#FF7B00]/90 text-white cursor-pointer"
              >
                발주서 작성하기 <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="secondary" className="h-14 px-10 text-lg cursor-pointer">
                견적 및 상담 문의
              </Button>
            </Link>
          </div>
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

function CategoryCard({
  title,
  image,
  desc,
  href,
}: {
  title: string;
  image: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-lg relative aspect-[4/5]"
    >
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10" />
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white translate-y-2 group-hover:translate-y-0 transition-transform">
        <h3 className="text-2xl font-bold mb-1">{title}</h3>
        <p className="text-white/80 text-sm opacity-0 group-hover:opacity-100 transition-opacity delay-100">
          {desc}
        </p>
      </div>
    </Link>
  );
}

function FeatureItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center text-center md:items-start md:text-left p-6 rounded-xl hover:bg-background transition-colors duration-300">
      <div className="mb-6 p-4 bg-primary/5 rounded-full">{icon}</div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function ProductCard({
  id,
  name,
  page,
  image,
}: {
  id: string;
  name: string;
  page: string;
  image: string;
}) {
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
          {page && <p className="text-xs text-[#FF7B00] font-medium mt-1">{page}</p>}
        </div>
      </div>
    </Link>
  );
}
