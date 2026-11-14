import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronUp, ChevronDown, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCmsBootstrap } from "@/lib/cms";
import type { SidebarFilterCategory } from "@shared/cms-types";

interface SidebarFiltersProps {
  onSearchClick?: () => void;
}

function FilterItem({ section }: { section: SidebarFilterCategory }) {
  const [isExpanded, setIsExpanded] = useState(section.expanded ?? false);
  const [location, setLocation] = useLocation();

  const handleItemClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href || href === "#") {
      e.preventDefault();
      return;
    }

    if (href.includes("#")) {
      const [pathPart, hashPart] = href.split("#");
      const targetPath = pathPart || location;
      if (targetPath === location || (!pathPart && hashPart)) {
        e.preventDefault();
        const el = document.getElementById(hashPart);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return;
      }
      e.preventDefault();
      setLocation(targetPath);
      setTimeout(() => {
        const el = document.getElementById(hashPart);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
      return;
    }

    if (href.startsWith("/")) {
      e.preventDefault();
      setLocation(href);
    }
  };

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-3 px-4 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
        data-testid={`filter-section-${section.title}`}
      >
        <span>{section.title}</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {isExpanded && section.subItems && section.subItems.length > 0 && (
        <div className="pb-3">
          {section.subItems.map((item) => (
            <a
              key={item.id}
              href={item.href || "#"}
              onClick={(e) => handleItemClick(e, item.href || "#")}
              className="block py-2 px-6 text-sm text-gray-600 hover:text-[#FF7B00] hover:bg-gray-50 transition-colors"
              data-testid={`filter-item-${item.label}`}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function SidebarFilters({ onSearchClick }: SidebarFiltersProps) {
  const { cms } = useCmsBootstrap();

  return (
    <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 h-fit" data-testid="sidebar-filters">
      {/* AI Search Button */}
      <Button
        onClick={onSearchClick}
        className="w-full mb-4 bg-gradient-to-r from-[#FF7B00] to-[#FF9933] hover:from-[#FF8C1A] hover:to-[#FFAA4D] text-white shadow-md hover:shadow-lg transition-all duration-300 py-6"
        data-testid="button-ai-search-sidebar"
      >
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <Search className="w-4 h-4" />
            <span className="font-semibold">AI 검색</span>
          </div>
          <span className="text-xs opacity-90">정확한 정보를 확인하세요</span>
        </div>
      </Button>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {cms.sidebarFilters.map((section) => (
          <FilterItem key={section.id} section={section} />
        ))}
      </div>
    </aside>
  );
}
