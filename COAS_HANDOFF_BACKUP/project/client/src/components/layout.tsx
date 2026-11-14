import { Link, useLocation } from "wouter";
import { Menu, X, Phone, Mail, MapPin, Facebook, Instagram, Linkedin, ChevronDown, Search } from "lucide-react";
import React, { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CatalogRequestDialog } from "@/components/catalog-request-dialog";
import { SearchModal } from "@/components/search-modal";
import logoMark from "@assets/코아스로고영문만_1766005232834.png";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [catalogType, setCatalogType] = useState<"standard" | "electronic">("standard");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { 
      href: "/", 
      label: "Home", 
      labelKo: "홈",
      subItems: [
        { label: "Greetings", labelKo: "인사말", href: "/about" },
        { label: "Company Intro", labelKo: "회사소개", href: "/about" },
        { label: "Location", labelKo: "오시는 길", href: "/contact#location" }
      ]
    },
    { 
      href: "/new-products", 
      label: "New Item", 
      labelKo: "신제품",
      subItems: [
        { label: "60kg(SD)", labelKo: "60kg(SD)", href: "/new-products" },
        { label: "80kg(SD)", labelKo: "80kg(SD)", href: "/new-products" },
        { label: "M-80", labelKo: "M-80", href: "/new-products" },
        { label: "150kg(SD)", labelKo: "150kg(SD)", href: "/new-products" },
        { label: "DP-40", labelKo: "DP-40", href: "/new-products" },
        { label: "DP-60", labelKo: "DP-60", href: "/new-products" },
        { label: "60kg(GSD)", labelKo: "60kg(GSD)", href: "/new-products" },
        { label: "100kg(FD)", labelKo: "100kg(FD)", href: "/new-products" },
        { label: "YL-845", labelKo: "YL-845", href: "/new-products" }
      ]
    },
    { 
      href: "/parts-index", 
      label: "Parts Index", 
      labelKo: "부품인덱스"
    },
    { href: "/contact", label: "Contact", labelKo: "문의하기" },
  ];

  const isHome = location === "/";
  const isContact = location === "/contact";
  const hasDarkHero = isHome || isContact;
  const isDarkHeader = hasDarkHero && !isScrolled;

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-[750ms] ease-in-out border-b ${
          isScrolled
            ? "bg-black/95 backdrop-blur-md border-white/10 h-14 shadow-sm"
            : "bg-transparent border-transparent h-14"
        }`}
      >
        <div className="w-full px-4 lg:px-8 h-full flex items-center justify-between bg-gray-100/10">
          {/* Logo - Mobile (About) */}
          <Link href="/about" className="flex md:hidden items-center gap-2">
              <img 
                src={logoMark} 
                alt="E-COAS" 
                className="h-7 w-auto object-contain transition-opacity duration-300" 
              />
          </Link>

          {/* Logo - Desktop (Home) */}
          <Link href="/" className="hidden md:flex items-center justify-center lg:w-64">
              <img 
                src={logoMark} 
                alt="E-COAS" 
                className="h-[41px] w-auto object-contain transition-opacity duration-300"
                style={{ filter: 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(360deg) brightness(100%) contrast(104%)' }}
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
                multiLine={'multiLine' in link ? link.multiLine : undefined}
              />
            ))}

            <div className="flex items-center gap-2">
               <ECatalogButton 
                 isDarkHeader={isDarkHeader || isScrolled} 
                 onClick={() => {
                   setCatalogType("electronic");
                   setDialogOpen(true);
                 }}
               />
               <CatalogButton 
                 isDarkHeader={isDarkHeader || isScrolled} 
                 onClick={() => {
                   setCatalogType("standard");
                   setDialogOpen(true);
                 }}
               />
            </div>

            {/* Contact Info */}
            <div className={`hidden xl:flex items-center gap-4 text-xs font-medium transition-colors ${isDarkHeader || isScrolled ? "text-white/90" : "text-muted-foreground"}`}>
               <div className="flex items-center gap-1.5">
                 <Phone className={`h-3.5 w-3.5 ${isDarkHeader || isScrolled ? "text-[#FF7B00]" : "text-[#FF7B00]"}`} />
                 <span>031)278-2201</span>
               </div>
               <div className="flex items-center gap-1.5">
                 <Mail className={`h-3.5 w-3.5 ${isDarkHeader || isScrolled ? "text-[#FF7B00]" : "text-[#FF7B00]"}`} />
                 <span>hmlee1125@naver.com</span>
               </div>
            </div>
          </nav>

          {/* Mobile Nav */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className={isDarkHeader || isScrolled ? "text-[#FF7B00] hover:bg-[#FF7B00]/20 hover:text-[#FF7B00]" : ""}>
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[70%] sm:w-[540px] overflow-y-auto">
              <div className="flex flex-col gap-2 mt-10">
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
                  <MobileNavItem 
                    key={link.href}
                    link={link}
                    location={location}
                  />
                ))}
                <Button className="w-full mt-4" onClick={() => { setCatalogType("standard"); setDialogOpen(true); }}>카탈로그 신청</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-grow pt-0">
        {children}
      </main>
      {/* Catalog Request Dialog */}
      <CatalogRequestDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        catalogType={catalogType} 
      />
      {/* Search Modal */}
      <SearchModal 
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        language="ko"
      />
      {/* Footer */}
      <footer className="bg-primary text-primary-foreground pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <img src={logoMark} alt="E-COAS" className="h-8 w-auto brightness-0 invert opacity-90" />
              </div>
              <p className="text-primary-foreground/70 text-sm leading-relaxed mb-6">
                Premium interior hardware solutions tailored for modern architectural projects. Quality, durability, and design excellence.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-primary-foreground/70 hover:text-white transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-primary-foreground/70 hover:text-white transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-primary-foreground/70 hover:text-white transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-3 text-sm text-primary-foreground/70">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/products" className="hover:text-white transition-colors">Our Products</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
              </ul>
            </div>

            {/* Products */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Categories</h3>
              <ul className="space-y-3 text-sm text-primary-foreground/70">
                <li><a href="#" className="hover:text-white transition-colors">Door Hardware</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Furniture Fittings</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Glass Systems</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Bathroom Accessories</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
              <ul className="space-y-4 text-sm text-primary-foreground/70">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>123 Industrial Ave, Design District, Seoul, South Korea</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 shrink-0" />
                  <span>+82 31-278-2201</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 shrink-0" />
                  <span>contact@e-coas.com</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-primary-foreground/50">
            <p>&copy; {new Date().getFullYear()} E-COAS. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ href, label, labelKo, isActive, isDarkHeader, subItems, multiLine }: { href: string, label: string, labelKo: string, isActive: boolean, isDarkHeader: boolean, subItems?: { label: string, labelKo: string, href: string, subItems?: { label: string, labelKo: string, href: string }[] }[], multiLine?: boolean }) {
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
        className={`text-sm font-medium transition-colors min-w-[60px] inline-flex items-center justify-center py-2 ${multiLine ? "text-center leading-tight" : ""} ${
          isActive
            ? isDarkHeader ? "text-[#FF7B00] font-semibold" : "text-primary font-semibold"
            : isDarkHeader ? "text-[#FF7B00]/90" : "text-muted-foreground"
        }`}
      >
          {multiLine ? (
            <span className="whitespace-pre-line text-center">{displayText}</span>
          ) : displayText}
      </Link>
      <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#FF7B00] transform origin-left transition-transform duration-300 ${isHovered ? "scale-x-100" : "scale-x-0"}`} />

      {subItems && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-border/50 overflow-visible py-1">
            {subItems.map((sub) => (
              <SubNavLink key={sub.href} href={sub.href} label={sub.label} labelKo={sub.labelKo} subItems={sub.subItems} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SubNavLink({ href, label, labelKo, subItems }: { href: string, label: string, labelKo: string, subItems?: { label: string, labelKo: string, href: string }[] }) {
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
             <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">▶</span>
          )}
      </Link>

      {subItems && (
        <div className="absolute top-0 left-full w-56 pt-0 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200 ease-in-out z-50 ml-1">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-border/50 overflow-hidden py-1">
            {subItems.map((sub) => (
              <SubNavLink key={sub.href} href={sub.href} label={sub.label} labelKo={sub.labelKo} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ECatalogButton({ isDarkHeader, onClick }: { isDarkHeader: boolean; onClick: () => void }) {
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

function CatalogButton({ isDarkHeader, onClick }: { isDarkHeader: boolean; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <Button 
      size="sm" 
      onClick={onClick}
      className={`ml-4 w-36 transition-colors ${isDarkHeader ? "bg-[#FF7B00] text-white hover:bg-[#FF7B00]/90" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="button-catalog"
    >
      {isHovered ? "Request Catalog" : "카탈로그 신청"}
    </Button>
  );
}

interface NavLinkType {
  href: string;
  label: string;
  labelKo: string;
  subItems?: {
    label: string;
    labelKo: string;
    href: string;
    subItems?: { label: string; labelKo: string; href: string }[];
  }[];
}

function MobileNavItem({ link, location }: { link: NavLinkType; location: string }) {
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
        <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
      </button>
      {isExpanded && (
        <div className="flex flex-col pl-4 border-l-2 border-gray-200 ml-2 mt-1 mb-2">
          {link.subItems.map((sub) => (
            <MobileSubNavItem key={sub.href} item={sub} location={location} />
          ))}
        </div>
      )}
    </div>
  );
}

function MobileSubNavItem({ item, location }: { item: { label: string; labelKo: string; href: string; subItems?: { label: string; labelKo: string; href: string }[] }; location: string }) {
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
        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
      </button>
      {isExpanded && (
        <div className="flex flex-col pl-3 border-l border-gray-200 ml-2 mt-1 mb-1">
          {item.subItems.map((sub) => (
            <Link 
              key={sub.href}
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
