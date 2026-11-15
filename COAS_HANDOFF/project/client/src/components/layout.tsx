import { Link, useLocation } from "wouter";
import {
  Menu,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
  Lock,
  ClipboardList,
  ArrowLeft,
  ArrowRight,
  Minus,
  X,
  Building2,
  LogIn,
  LogOut,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CatalogRequestDialog } from "@/components/catalog-request-dialog";
import { ECatalogViewerModal } from "@/components/ecatalog-viewer-modal";
import { SearchModal } from "@/components/search-modal";
import { BuyerAuthModal } from "@/components/order/BuyerAuthModal";
import { ManualDownloadDropdown } from "@/components/ManualDownloadDropdown";
import { resolveAssetUrl, useCmsBootstrap } from "@/lib/cms";
import { useOrderDraftSummary } from "@/lib/order-draft";
import { useBuyerAuth } from "@/lib/order-auth";

interface NavSubItem {
  label: string;
  labelKo: string;
  href: string;
  subItems?: { label: string; labelKo: string; href: string }[];
}

interface NavLinkType {
  href: string;
  label: string;
  labelKo: string;
  multiLine?: boolean;
  subItems?: NavSubItem[];
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(() =>
    typeof window !== "undefined" ? window.scrollY > 20 : false,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ecatalogOpen, setEcatalogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSwingDrawerOpen, setIsSwingDrawerOpen] = useState(false);
  const [buyerAuthModalOpen, setBuyerAuthModalOpen] = useState(false);
  const { session: buyerSession, isAuthenticated: isBuyerLoggedIn, logout: buyerLogout } = useBuyerAuth();
  const { cms } = useCmsBootstrap();
  const { itemCount, totalQty, hasActiveSession, dismissSession } =
    useOrderDraftSummary();
  const showOrderReturnBar =
    hasActiveSession &&
    location !== "/order" &&
    !location.startsWith("/admin");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location]);

  useEffect(() => {
    const handleOpenLogin = () => setBuyerAuthModalOpen(true);
    window.addEventListener("open-buyer-auth-modal", handleOpenLogin);
    return () => window.removeEventListener("open-buyer-auth-modal", handleOpenLogin);
  }, []);

  const navNewProductSubItems: NavSubItem[] = cms.newProducts
    .filter((item) => item.visible && item.showInNav)
    .map((item) => ({
      label: item.name,
      labelKo: item.name,
      href: `/product/${item.productId}`,
    }));

  const navLinks: NavLinkType[] = [
    {
      href: "/",
      label: "Home",
      labelKo: "홈",
      subItems: [
        { label: "Greetings", labelKo: "인사말", href: "/about" },
        { label: "Company Intro", labelKo: "회사소개", href: "/about" },
        { label: "Location", labelKo: "오시는 길", href: "/contact#location" },
      ],
    },
    {
      href: "/new-products",
      label: "New Item",
      labelKo: "신제품",
      subItems: navNewProductSubItems.length > 0 ? navNewProductSubItems : undefined,
    },
    {
      href: "/parts-index",
      label: "Parts Index",
      labelKo: "부품인덱스",
    },
    { href: "/contact", label: "Contact", labelKo: "문의하기" },
  ];

  const hasHeroBanner =
    location === "/" ||
    location === "/contact" ||
    location === "/about";
  const showSolidDarkBar = !hasHeroBanner || isScrolled;
  const isDarkHeader = true;
  const company = cms.design.company;
  const logoSrc = resolveAssetUrl(company.logoUrl);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-14 transition-colors duration-300 ease-in-out border-b print:hidden ${
          showSolidDarkBar
            ? "bg-slate-900/95 backdrop-blur-md border-slate-800 shadow-md"
            : "bg-transparent border-transparent"
        }`}
      >
        <div
          className={`w-full px-4 lg:px-8 h-full flex items-center justify-between ${
            showSolidDarkBar ? "" : "bg-gray-100/10"
          }`}
        >
          {/* Logo - Mobile (About) */}
          <Link href="/about" className="flex md:hidden items-center gap-2">
            <img
              src={logoSrc}
              alt="E-COAS"
              className="h-7 w-auto object-contain transition-opacity duration-300"
            />
          </Link>

          {/* Logo - Desktop (Home) */}
          <Link href="/" className="hidden md:flex items-center justify-center lg:w-64">
            <img
              src={logoSrc}
              alt="E-COAS"
              className="h-[41px] w-auto object-contain transition-opacity duration-300"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(360deg) brightness(100%) contrast(104%)",
              }}
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-4 mr-[100px]">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSearchOpen(true)}
              className={`h-9 px-3 transition-colors ${
                isDarkHeader || isScrolled
                  ? "text-white hover:text-[#FF7B00] hover:bg-white/10"
                  : "text-gray-700 hover:text-[#FF7B00] hover:bg-gray-50"
              }`}
              data-testid="button-search"
            >
              <Search className="w-4 h-4" />
            </Button>

            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                labelKo={link.labelKo}
                isActive={location === link.href}
                isDarkHeader={isDarkHeader || isScrolled}
                subItems={link.subItems}
                multiLine={link.multiLine}
              />
            ))}

            <div className="flex items-center gap-2">
              <ECatalogButton
                isDarkHeader={isDarkHeader || isScrolled}
                onClick={() => setEcatalogOpen(true)}
              />
              <ManualDownloadDropdown
                isDarkHeader={isDarkHeader || isScrolled}
                onRequestCatalog={() => setDialogOpen(true)}
                onOpenECatalog={() => setEcatalogOpen(true)}
              />

              {/* B2B Partner Login Button / Status Badge */}
              {isBuyerLoggedIn ? (
                <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1 text-xs shrink-0 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setBuyerAuthModalOpen(true)}
                    className="flex items-center gap-1.5 font-bold text-white hover:text-[#FF7B00] transition-colors cursor-pointer"
                    title="거래처 계정 정보 / 전환"
                  >
                    <Building2 className="w-3.5 h-3.5 text-[#FF7B00]" />
                    <span className="max-w-[130px] truncate">{buyerSession.companyName}</span>
                  </button>
                  <button
                    type="button"
                    onClick={buyerLogout}
                    className="text-slate-400 hover:text-white text-[11px] font-medium ml-1 pl-1.5 border-l border-slate-700 transition-colors cursor-pointer"
                    title="로그아웃"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBuyerAuthModalOpen(true)}
                  className="h-8 px-2.5 bg-[#FF7B00]/10 hover:bg-[#FF7B00] border-[#FF7B00]/50 text-[#FF7B00] hover:text-white text-xs font-bold transition-all cursor-pointer shrink-0"
                  title="거래처 1초 간편로그인 (비밀번호 없음)"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1" />
                  거래처 로그인
                </Button>
              )}
            </div>

            {/* Contact Info */}
            <div
              className={`hidden xl:flex items-center gap-4 text-xs font-medium transition-colors ${
                isDarkHeader || isScrolled ? "text-white/90" : "text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-[#FF7B00]" />
                <span>{company.phone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-[#FF7B00]" />
                <span>{company.email}</span>
              </div>
            </div>
          </nav>

          {/* Mobile Nav */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className={
                  isDarkHeader || isScrolled
                    ? "text-[#FF7B00] hover:bg-[#FF7B00]/20 hover:text-[#FF7B00]"
                    : ""
                }
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[75%] sm:w-[400px] overflow-y-auto">
              <div className="flex flex-col gap-2 mt-8">
                {/* Mobile B2B Login Banner */}
                {isBuyerLoggedIn ? (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-white flex items-center justify-between mb-1 shadow-sm">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white truncate">
                        <Building2 className="w-4 h-4 text-[#FF7B00] shrink-0" />
                        <span className="truncate">{buyerSession.companyName}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {buyerSession.contactName || "담당자"} 님 (로그인됨)
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={buyerLogout}
                      className="text-slate-400 hover:text-white text-xs h-7 px-2 shrink-0"
                    >
                      로그아웃
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBuyerAuthModalOpen(true)}
                    className="w-full h-11 rounded-xl bg-[#FEE500] hover:bg-[#FDD835] active:scale-[0.99] text-[#191919] font-black text-xs flex items-center justify-center gap-2 mb-1 shadow-sm transition-all cursor-pointer"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#191919] text-[#FEE500] flex items-center justify-center text-[10px] font-black shrink-0">
                      💬
                    </span>
                    <span>거래처 1초 간편로그인</span>
                  </button>
                )}

                <Button
                  variant="outline"
                  className="w-full mb-2 justify-start gap-2"
                  onClick={() => setSearchOpen(true)}
                  data-testid="button-mobile-search"
                >
                  <Search className="w-4 h-4" />
                  제품 검색
                </Button>
                {navLinks.map((link) => (
                  <MobileNavItem key={link.href} link={link} location={location} />
                ))}
                <Link href="/order">
                  <Button
                    variant="outline"
                    className="w-full mt-2 border-[#FF7B00] text-[#FF7B00]"
                  >
                    발주서 작성
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  className="w-full mt-1"
                  onClick={() => setEcatalogOpen(true)}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  전자카탈로그 열람
                </Button>
                <Button
                  className="w-full mt-1 bg-[#FF7B00] hover:bg-[#FF7B00]/90 text-white"
                  onClick={() => setDialogOpen(true)}
                >
                  카탈로그 신청
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-0">{children}</main>

      {/* Immediate E-Catalog Viewer + Lead-Capture Download */}
      <ECatalogViewerModal
        open={ecatalogOpen}
        onOpenChange={setEcatalogOpen}
        ecatalog={cms.design.ecatalog}
      />

      {/* Printed Catalog Request Dialog */}
      <CatalogRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        catalogType="standard"
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        language="ko"
      />

      {/* Global B2B Partner Easy Login Modal (Passwordless) */}
      <BuyerAuthModal
        isOpen={buyerAuthModalOpen}
        onClose={() => setBuyerAuthModalOpen(false)}
      />

      {/* Right Edge Vertical Swing Tab & Slide Drawer (Active when browsing Parts Index / New Products / Product Detail / Home during an Order) */}
      {showOrderReturnBar && (
        <aside
          data-testid="floating-order-swing-tab"
          aria-label="작성 중 발주서 스윙 탭"
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center print:hidden select-none"
        >
          {/* Slide-out Drawer Panel (left of the handle) */}
          <div
            className={`transition-all duration-300 ease-out transform ${
              isSwingDrawerOpen
                ? "translate-x-0 opacity-100 pointer-events-auto"
                : "translate-x-full opacity-0 pointer-events-none w-0 overflow-hidden"
            }`}
          >
            <div className="w-80 bg-slate-900/98 backdrop-blur-md text-white border-2 border-r-0 border-[#FF7B00] rounded-l-2xl shadow-2xl p-4 flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF7B00] animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-white tracking-tight truncate">
                    작성 중인 발주서 자동 보관
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsSwingDrawerOpen(false)}
                    title="스윙 탭 접기"
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 text-orange-400" />
                  </button>
                  {itemCount === 0 && (
                    <button
                      type="button"
                      onClick={dismissSession}
                      title="안내 창 닫기"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Count & Info */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">담긴 품목</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FF7B00]/20 border border-[#FF7B00] text-orange-300 text-xs font-black">
                    총 {itemCount}종 (수량 {totalQty}개)
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  신제품·부품 탐색 후 언제든 발주서로 바로 복귀하실 수 있습니다.
                </p>
              </div>

              {/* Main Action Return Button */}
              <Link href="/order" className="w-full">
                <Button
                  type="button"
                  size="sm"
                  data-testid="button-return-to-order"
                  className="w-full bg-[#FF7B00] hover:bg-[#e66f00] text-white font-extrabold text-xs sm:text-sm h-10 shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  작성 중이던 발주서로 돌아가기
                </Button>
              </Link>

              {/* Sub Quick Navigation */}
              <div className="flex items-center gap-1.5 pt-0.5">
                {location !== "/parts-index" && (
                  <Link href="/parts-index" className="flex-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-[11px] font-semibold h-7 px-2 cursor-pointer"
                    >
                      부품인덱스
                    </Button>
                  </Link>
                )}
                {location !== "/new-products" && (
                  <Link href="/new-products" className="flex-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-[11px] font-semibold h-7 px-2 cursor-pointer"
                    >
                      신제품 보기
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Right Edge Swing Tab Handle */}
          <button
            type="button"
            onClick={() => setIsSwingDrawerOpen((prev) => !prev)}
            data-testid="button-order-swing-tab"
            title={isSwingDrawerOpen ? "발주서 정보 접기" : "작성 중인 발주서 정보 열기"}
            className="bg-[#FF7B00] hover:bg-[#e66f00] active:scale-95 text-white rounded-l-xl px-2 py-4 shadow-2xl border border-r-0 border-orange-400 flex flex-col items-center gap-2 cursor-pointer transition-all shrink-0 group"
          >
            {isSwingDrawerOpen ? (
              <ChevronRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-white group-hover:-translate-x-0.5 transition-transform animate-pulse" />
            )}
            <span className="text-[11px] font-black leading-tight [writing-mode:vertical-rl] tracking-wider py-1">
              작성 중 발주서
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-950 text-orange-300 text-[10.5px] font-black border border-orange-400/60 min-w-[22px] text-center shadow-xs">
              {itemCount}
            </span>
          </button>
        </aside>
      )}

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <img
                  src={logoSrc}
                  alt="E-COAS"
                  className="h-8 w-auto brightness-0 invert opacity-90"
                />
              </div>
              <p className="text-primary-foreground/70 text-sm leading-relaxed mb-6">
                {company.footerDesc}
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="text-primary-foreground/70 hover:text-white transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-primary-foreground/70 hover:text-white transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-primary-foreground/70 hover:text-white transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold text-lg mb-4">바로가기</h3>
              <ul className="space-y-3 text-sm text-primary-foreground/70">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    홈 (Home)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/new-products"
                    className="hover:text-white transition-colors"
                  >
                    신제품 (New Item)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/parts-index"
                    className="hover:text-white transition-colors"
                  >
                    부품 인덱스 (Parts Index)
                  </Link>
                </li>
                <li>
                  <Link href="/order" className="hover:text-white transition-colors">
                    발주서 작성 (Purchase Order)
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    문의하기 (Contact)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Products */}
            <div>
              <h3 className="font-semibold text-lg mb-4">주요 제품군</h3>
              <ul className="space-y-3 text-sm text-primary-foreground/70">
                <li>
                  <Link
                    href="/parts-index"
                    className="hover:text-white transition-colors"
                  >
                    슬라이딩 & 댐핑 도어 시스템
                  </Link>
                </li>
                <li>
                  <Link
                    href="/parts-index#sec-sl-rails"
                    className="hover:text-white transition-colors"
                  >
                    SL 알루미늄 레일 시리즈
                  </Link>
                </li>
                <li>
                  <Link
                    href="/parts-index#sec-l-guides"
                    className="hover:text-white transition-colors"
                  >
                    L형 가이드 & 하드웨어 부속
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setEcatalogOpen(true)}
                    className="hover:text-white transition-colors text-left"
                  >
                    전자카탈로그 열람
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-lg mb-4">고객지원 센터</h3>
              <ul className="space-y-4 text-sm text-primary-foreground/70">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 shrink-0 mt-0.5 text-[#FF7B00]" />
                  <span>{company.address}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 shrink-0 text-[#FF7B00]" />
                  <span>{company.phone}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 shrink-0 text-[#FF7B00]" />
                  <span>{company.email}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-primary-foreground/50">
            <p>&copy; {new Date().getFullYear()} E-COAS. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <Link
                href="/admin"
                title="관리자 로그인"
                className="opacity-35 hover:opacity-100 hover:text-[#FF7B00] transition-all p-1"
                data-testid="link-footer-admin"
              >
                <Lock className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({
  href,
  label,
  labelKo,
  isActive,
  isDarkHeader,
  subItems,
  multiLine,
}: {
  href: string;
  label: string;
  labelKo: string;
  isActive: boolean;
  isDarkHeader: boolean;
  subItems?: NavSubItem[];
  multiLine?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const displayText = isHovered ? label : labelKo;

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={href}
        className={`text-sm font-medium transition-colors min-w-[60px] inline-flex items-center justify-center py-2 ${
          multiLine ? "text-center leading-tight" : ""
        } ${
          isActive
            ? isDarkHeader
              ? "text-[#FF7B00] font-semibold"
              : "text-primary font-semibold"
            : isDarkHeader
              ? "text-[#FF7B00]/90"
              : "text-muted-foreground"
        }`}
      >
        {multiLine ? (
          <span className="whitespace-pre-line text-center">{displayText}</span>
        ) : (
          displayText
        )}
      </Link>
      <span
        className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#FF7B00] transform origin-left transition-transform duration-300 ${
          isHovered ? "scale-x-100" : "scale-x-0"
        }`}
      />

      {subItems && subItems.length > 0 && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-border/50 overflow-visible py-1 max-h-[70vh] overflow-y-auto">
            {subItems.map((sub, idx) => (
              <SubNavLink
                key={`${sub.href}-${idx}`}
                href={sub.href}
                label={sub.label}
                labelKo={sub.labelKo}
                subItems={sub.subItems}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SubNavLink({
  href,
  label,
  labelKo,
  subItems,
}: {
  href: string;
  label: string;
  labelKo: string;
  subItems?: { label: string; labelKo: string; href: string }[];
}) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      className="relative group/sub"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={href}
        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100/80 hover:text-[#FF7B00] transition-colors text-center relative"
      >
        {isHovered ? label : labelKo}
        {subItems && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            ▶
          </span>
        )}
      </Link>

      {subItems && (
        <div className="absolute top-0 left-full w-56 pt-0 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200 ease-in-out z-50 ml-1">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-border/50 overflow-hidden py-1">
            {subItems.map((sub, idx) => (
              <SubNavLink
                key={`${sub.href}-${idx}`}
                href={sub.href}
                label={sub.label}
                labelKo={sub.labelKo}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ECatalogButton({
  isDarkHeader,
  onClick,
}: {
  isDarkHeader: boolean;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={onClick}
      className={`h-9 w-32 px-3 transition-colors font-semibold border ${
        isDarkHeader
          ? "border-white/20 text-white hover:text-[#FF7B00] hover:bg-white/10"
          : "border-gray-200 text-gray-700 hover:text-[#FF7B00] hover:bg-gray-50"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="button-ecatalog"
    >
      <BookOpen className="w-4 h-4 mr-2" />
      {isHovered ? "E-Catalog" : "전자카탈로그"}
    </Button>
  );
}

function CatalogButton({
  isDarkHeader,
  onClick,
}: {
  isDarkHeader: boolean;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <Button
      size="sm"
      onClick={onClick}
      className={`ml-4 w-36 transition-colors ${
        isDarkHeader ? "bg-[#FF7B00] text-white hover:bg-[#FF7B00]/90" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="button-catalog"
    >
      {isHovered ? "Request Catalog" : "카탈로그 신청"}
    </Button>
  );
}

function MobileNavItem({
  link,
  location,
}: {
  link: NavLinkType;
  location: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!link.subItems) {
    return (
      <Link
        href={link.href}
        className={`text-lg font-medium transition-colors hover:text-primary py-2 ${
          location === link.href ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {link.labelKo}
      </Link>
    );
  }

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center justify-between text-lg font-medium transition-colors hover:text-primary py-2 ${
          location === link.href ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {link.labelKo}
        <ChevronDown
          className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>
      {isExpanded && (
        <div className="flex flex-col pl-4 border-l-2 border-gray-200 ml-2 mt-1 mb-2">
          <Link
            href={link.href}
            className="text-base font-medium text-[#FF7B00] py-1.5"
          >
            {link.labelKo} 전체보기
          </Link>
          {link.subItems.map((sub, idx) => (
            <MobileSubNavItem key={`${sub.href}-${idx}`} item={sub} location={location} />
          ))}
        </div>
      )}
    </div>
  );
}

function MobileSubNavItem({
  item,
  location,
}: {
  item: NavSubItem;
  location: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!item.subItems) {
    return (
      <Link
        href={item.href}
        className={`text-base transition-colors hover:text-[#FF7B00] py-1.5 ${
          location === item.href ? "text-[#FF7B00]" : "text-muted-foreground"
        }`}
      >
        {item.labelKo}
      </Link>
    );
  }

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center justify-between text-base transition-colors hover:text-[#FF7B00] py-1.5 ${
          location === item.href ? "text-[#FF7B00]" : "text-muted-foreground"
        }`}
      >
        {item.labelKo}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>
      {isExpanded && (
        <div className="flex flex-col pl-3 border-l border-gray-200 ml-2 mt-1 mb-1">
          {item.subItems.map((sub, idx) => (
            <Link
              key={`${sub.href}-${idx}`}
              href={sub.href}
              className={`text-sm transition-colors hover:text-[#FF7B00] py-1 ${
                location === sub.href ? "text-[#FF7B00]" : "text-muted-foreground"
              }`}
            >
              {sub.labelKo}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
