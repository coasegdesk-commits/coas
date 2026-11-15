import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Download,
  FileText,
  BookOpen,
  Send,
  ExternalLink,
  Sparkles,
  PhoneCall,
  CheckCircle2,
} from "lucide-react";
import type { UserManualItem } from "@shared/cms-types";

interface ManualDownloadDropdownProps {
  isDarkHeader: boolean;
  onRequestCatalog: () => void;
  onOpenECatalog: () => void;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function ManualDownloadDropdown({
  isDarkHeader,
  onRequestCatalog,
  onOpenECatalog,
}: ManualDownloadDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [manuals, setManuals] = useState<UserManualItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load public manuals
  useEffect(() => {
    fetch("/api/manuals")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.manuals)) {
          setManuals(data.manuals);
        }
      })
      .catch(() => {});
  }, []);

  // Close when clicked outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Mouse hover handlers with slight delay to prevent flicker
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 250);
  };

  // Track download
  const handleDownloadClick = (manualId: string) => {
    fetch(`/api/manuals/${manualId}/download`, { method: "POST" }).catch(() => {});
  };

  return (
    <div
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative ml-4 inline-block text-left"
    >
      {/* Trigger Button (카탈로그 · 사용설명서 풀다운) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        data-testid="button-manual-dropdown"
        className={`h-9 px-3.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer select-none ${
          isDarkHeader
            ? "bg-[#FF7B00] hover:bg-[#e66f00] text-white border border-orange-400/30"
            : "bg-[#FF7B00] hover:bg-[#e66f00] text-white"
        } ${isOpen ? "ring-2 ring-orange-400/50" : ""}`}
      >
        <BookOpen className="w-3.5 h-3.5 text-white/90" />
        <span>카탈로그 · 사용설명서</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-white transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Pulldown Menu Container */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-32px)] bg-slate-900/98 backdrop-blur-md text-white rounded-2xl shadow-2xl border-2 border-slate-700/80 p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Top Quick Actions: Printed Catalog Request & E-Catalog */}
          <div className="grid grid-cols-2 gap-2 mb-3 pb-3 border-b border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onRequestCatalog();
              }}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-orange-500/50 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-orange-400 font-extrabold text-[11px] mb-0.5">
                <Send className="w-3 h-3 text-[#FF7B00] group-hover:translate-x-0.5 transition-transform" />
                <span>인쇄 카탈로그 신청</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                무료 우편·택배 발송
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenECatalog();
              }}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-orange-500/50 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-blue-400 font-extrabold text-[11px] mb-0.5">
                <BookOpen className="w-3 h-3 text-blue-400 group-hover:scale-110 transition-transform" />
                <span>전자카탈로그 열람</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                온라인 E-Book 즉시보기
              </p>
            </button>
          </div>

          {/* Section Header: User Manuals & Installation Guides */}
          <div className="flex items-center justify-between px-1 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF7B00] animate-pulse" />
              <span className="text-xs font-black text-white tracking-tight">
                제품별 사용설명서 & 시공가이드 (PDF)
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              즉시 다운로드 가능
            </span>
          </div>

          {/* Manuals List */}
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
            {manuals.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                등록된 사용설명서가 없습니다.
              </div>
            ) : (
              manuals.map((manual) => (
                <div
                  key={manual.id}
                  className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-2.5 group"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 font-black text-[10px] flex items-center justify-center shrink-0 uppercase mt-0.5">
                      {manual.fileExt || "PDF"}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-white block truncate">
                        {manual.title}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                        <span className="text-orange-400/90 font-semibold truncate max-w-[100px]">
                          {manual.category}
                        </span>
                        <span>·</span>
                        {manual.version && (
                          <>
                            <span className="font-mono text-slate-400">{manual.version}</span>
                            <span>·</span>
                          </>
                        )}
                        <span className="font-mono">{formatBytes(manual.fileSize)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Direct Download Button */}
                  <a
                    href={manual.fileUrl}
                    download={manual.fileName}
                    onClick={() => handleDownloadClick(manual.id)}
                    className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-[#FF7B00] text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0 shadow-xs"
                    title={`[${manual.fileName}] 다운로드`}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))
            )}
          </div>

          {/* Bottom Footer Note */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10.5px] text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <PhoneCall className="w-3 h-3 text-[#FF7B00]" />
              <span>CAD 도면 및 대량 주문 문의: 031-278-2201</span>
            </span>
            <a
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="text-[#FF7B00] hover:underline font-bold"
            >
              기술 문의하기 →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
