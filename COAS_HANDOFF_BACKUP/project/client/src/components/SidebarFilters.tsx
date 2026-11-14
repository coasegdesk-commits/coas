import { useState } from "react";
import { ChevronUp, ChevronDown, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubItem {
  label: string;
  href?: string;
}

interface FilterSection {
  title: string;
  expanded?: boolean;
  subItems?: SubItem[];
}

interface SidebarFiltersProps {
  onSearchClick?: () => void;
}

const filterSections: FilterSection[] = [
  {
    title: "슬라이딩",
    expanded: true,
    subItems: [
      { label: "SD-60", href: "/parts-index#sd-60" },
      { label: "SD-80", href: "/parts-index#sd-80" },
      { label: "M-80", href: "/parts-index#m-80" },
      { label: "SD-150", href: "/parts-index#sd-150" },
      { label: "SD-250", href: "/parts-index#sd-250" },
      { label: "SD-500", href: "/parts-index#sd-500" },
      { label: "DP-20", href: "/parts-index#dp-20" },
      { label: "DP-40", href: "/parts-index#dp-40" },
      { label: "DP-60", href: "/parts-index#dp-60" },
      { label: "DP-100", href: "/parts-index#dp-100" },
    ],
  },
  {
    title: "샤워부스",
    subItems: [
      { label: "샤워부스 전체", href: "/products/shower-booth" },
      { label: "SD-09 ~ SD-15", href: "/parts-index#shower" },
      { label: "SL-531 ~ SL-538", href: "/parts-index#shower-sl" },
    ],
  },
  {
    title: "큐비클",
    subItems: [
      { label: "큐비클 전체", href: "/products/cubicle" },
      { label: "CD-101 ~ CD-115", href: "/parts-index#cubicle" },
    ],
  },
  {
    title: "유리파티션",
    subItems: [
      { label: "유리부속 전체", href: "/products/glass-fittings" },
      { label: "60kg(GSD)", href: "/parts-index#gsd-60" },
      { label: "80kg(GSD)", href: "/parts-index#gsd-80" },
      { label: "100kg(GDP)", href: "/parts-index#gdp-100" },
      { label: "150kg(GSD)", href: "/parts-index#gsd-150" },
    ],
  },
  {
    title: "컨틴뉘우스",
    subItems: [
      { label: "컨틴뉘우스 전체", href: "/products/continuous" },
    ],
  },
  {
    title: "정첩시스템",
    subItems: [
      { label: "정첩 전체", href: "/products/hinge" },
      { label: "CH 시리즈", href: "/parts-index#hinge" },
    ],
  },
  {
    title: "수입건축용하드웨어",
    subItems: [
      { label: "수입하드웨어 전체", href: "/products/imported" },
    ],
  },
  {
    title: "SL 레일 시리즈",
    subItems: [
      { label: "SL-2831", href: "/parts-index#sl-2831" },
      { label: "SL-3332", href: "/parts-index#sl-3332" },
      { label: "SL-3445", href: "/parts-index#sl-3445" },
      { label: "SL-3540", href: "/parts-index#sl-3540" },
      { label: "SL-4550", href: "/parts-index#sl-4550" },
    ],
  },
];

function FilterItem({ section }: { section: FilterSection }) {
  const [isExpanded, setIsExpanded] = useState(section.expanded ?? false);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
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
      
      {isExpanded && section.subItems && (
        <div className="pb-3">
          {section.subItems.map((item, idx) => (
            <a
              key={idx}
              href={item.href || "#"}
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
        {filterSections.map((section, idx) => (
          <FilterItem key={idx} section={section} />
        ))}
      </div>
    </aside>
  );
}
