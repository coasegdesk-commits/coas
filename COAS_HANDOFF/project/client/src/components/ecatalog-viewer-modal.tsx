import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  X,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { resolveAssetUrl } from "@/lib/cms";
import type { SiteDesignSettings } from "@shared/cms-types";

interface ECatalogViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ecatalog: SiteDesignSettings["ecatalog"];
}

export function ECatalogViewerModal({
  open,
  onOpenChange,
  ecatalog,
}: ECatalogViewerModalProps) {
  const { toast } = useToast();
  const [pageIdx, setPageIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<"pdf" | "pages">(
    ecatalog.pdfUrl ? "pdf" : "pages",
  );
  const [downloadPromptOpen, setDownloadPromptOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    message: "",
  });

  const pages = ecatalog.previewImages || [];

  useEffect(() => {
    if (open) {
      setViewMode(ecatalog.pdfUrl ? "pdf" : "pages");
      setZoom(1);
      trackEvent("catalog_request_opened", { catalog_type: "electronic_viewer" });
    } else {
      setDownloadPromptOpen(false);
    }
  }, [open, ecatalog.pdfUrl]);

  const triggerFileDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = resolveAssetUrl(url);
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executeDownload = () => {
    if (ecatalog.pdfUrl) {
      triggerFileDownload(
        ecatalog.pdfUrl,
        ecatalog.pdfFileName || "E-COAS_전자카탈로그.pdf",
      );
      toast({
        title: "다운로드가 시작되었습니다",
        description: "E-COAS 전자카탈로그 PDF 파일이 다운로드됩니다.",
      });
    } else if (pages[pageIdx]) {
      triggerFileDownload(
        pages[pageIdx],
        `E-COAS_카탈로그_${pageIdx + 1}페이지.png`,
      );
      toast({
        title: "카탈로그 페이지 다운로드",
        description:
          "현재 열람 중인 고해상도 카탈로그 도면이 저장되며, 통합본 요청이 함께 접수되었습니다.",
      });
    } else {
      toast({
        title: "신청이 접수되었습니다",
        description: "담당자가 확인 후 입력하신 연락처/이메일로 최신 통합 카탈로그를 발송해 드립니다.",
      });
    }
  };

  const handleDownloadClick = () => {
    if (!ecatalog.requireInfoForDownload) {
      executeDownload();
      return;
    }
    setDownloadPromptOpen(true);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/catalog-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          catalogType: "전자카탈로그 다운로드",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "신청 처리에 실패했습니다.");
      }
      trackEvent("catalog_request_completed", { catalog_type: "electronic_download" });
      setDownloadPromptOpen(false);
      executeDownload();
      setFormData({ name: "", company: "", phone: "", email: "", message: "" });
    } catch (err: any) {
      toast({
        title: "입력 확인 필요",
        description: err.message || "다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-zinc-900 text-white border-zinc-700 [&>button]:hidden">
        {/* Top Viewer Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-zinc-950 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#FF7B00]/20 text-[#FF7B00] flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base md:text-lg font-bold text-white truncate">
                {ecatalog.title || "E-COAS 종합 전자카탈로그"}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 truncate hidden sm:block">
                {ecatalog.description}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {ecatalog.pdfUrl && pages.length > 0 && (
              <div className="hidden md:flex bg-zinc-800 rounded-lg p-0.5 mr-2">
                <button
                  type="button"
                  onClick={() => setViewMode("pdf")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    viewMode === "pdf"
                      ? "bg-[#FF7B00] text-white"
                      : "text-zinc-300 hover:text-white"
                  }`}
                >
                  PDF 문서 보기
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("pages")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    viewMode === "pages"
                      ? "bg-[#FF7B00] text-white"
                      : "text-zinc-300 hover:text-white"
                  }`}
                >
                  주요 도면 슬라이드 ({pages.length})
                </button>
              </div>
            )}

            {viewMode === "pages" && pages.length > 0 && (
              <div className="hidden sm:flex items-center gap-1 bg-zinc-800 rounded-lg px-2 py-1">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))}
                  className="p-1 text-zinc-300 hover:text-white"
                  title="축소"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.25, +(z + 0.25).toFixed(2)))}
                  className="p-1 text-zinc-300 hover:text-white"
                  title="확대"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            )}

            <Button
              size="sm"
              onClick={handleDownloadClick}
              className="bg-[#FF7B00] hover:bg-[#FF7B00]/90 text-white font-semibold gap-1.5 shadow-md"
              data-testid="button-ecatalog-download"
            >
              <Download className="w-4 h-4" />
              카탈로그 다운로드
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-9 w-9"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Main Viewer Body */}
        <div className="relative flex-1 overflow-hidden flex flex-col bg-zinc-900">
          {viewMode === "pdf" && ecatalog.pdfUrl ? (
            <iframe
              src={`${resolveAssetUrl(ecatalog.pdfUrl)}#toolbar=0&navpanes=0`}
              title={ecatalog.title}
              className="w-full h-full border-0 bg-white"
            />
          ) : pages.length > 0 ? (
            <>
              <div className="flex-1 overflow-auto flex items-center justify-center p-4 md:p-8 relative">
                <img
                  src={resolveAssetUrl(pages[pageIdx])}
                  alt={`카탈로그 페이지 ${pageIdx + 1}`}
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "center top",
                  }}
                  className="max-h-full max-w-full object-contain bg-white rounded-lg shadow-2xl transition-transform duration-200"
                />

                {pages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setPageIdx((i) => (i > 0 ? i - 1 : pages.length - 1))
                      }
                      className="fixed md:absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 hover:bg-[#FF7B00] text-white flex items-center justify-center border border-white/15 transition-colors shadow-lg"
                      aria-label="이전 페이지"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPageIdx((i) => (i < pages.length - 1 ? i + 1 : 0))
                      }
                      className="fixed md:absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 hover:bg-[#FF7B00] text-white flex items-center justify-center border border-white/15 transition-colors shadow-lg"
                      aria-label="다음 페이지"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Strip */}
              <div className="bg-zinc-950/90 border-t border-zinc-800 px-4 py-2.5 flex items-center gap-3 overflow-x-auto shrink-0">
                <span className="text-xs text-zinc-400 font-medium shrink-0">
                  {pageIdx + 1} / {pages.length} 페이지
                </span>
                <div className="flex items-center gap-2">
                  {pages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPageIdx(idx);
                        setZoom(1);
                      }}
                      className={`w-14 h-10 rounded overflow-hidden border-2 transition-all shrink-0 bg-white ${
                        idx === pageIdx
                          ? "border-[#FF7B00] scale-105"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={resolveAssetUrl(img)}
                        alt={`${idx + 1}p`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
              <FileText className="w-16 h-16 mb-4 text-zinc-600" />
              <p className="text-lg font-medium text-white mb-2">
                등록된 전자카탈로그 미리보기가 없습니다.
              </p>
              <p className="text-sm mb-6">
                우측 상단의 카탈로그 다운로드 버튼을 눌러 신청해 주시면 최신 파일을 보내드립니다.
              </p>
              <Button
                onClick={handleDownloadClick}
                className="bg-[#FF7B00] hover:bg-[#FF7B00]/90"
              >
                카탈로그 요청하기
              </Button>
            </div>
          )}

          {/* Lead-Capture Overlay when user requests Download */}
          {downloadPromptOpen && (
            <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white text-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-7 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF7B00] bg-orange-50 px-2.5 py-1 rounded-full mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      다운로드 정보 확인
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      전자카탈로그 다운로드
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      간단한 정보를 입력해 주시면 즉시 다운로드가 시작됩니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDownloadPromptOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleLeadSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="dl-name">성함 / 담당자명 *</Label>
                      <Input
                        id="dl-name"
                        required
                        placeholder="홍길동"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dl-company">업체명 / 상호</Label>
                      <Input
                        id="dl-company"
                        placeholder="(주)코아스인테리어"
                        value={formData.company}
                        onChange={(e) =>
                          setFormData({ ...formData, company: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dl-phone">연락처 *</Label>
                    <Input
                      id="dl-phone"
                      type="tel"
                      required
                      placeholder="010-1234-5678"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dl-email">이메일 *</Label>
                    <Input
                      id="dl-email"
                      type="email"
                      required
                      placeholder="example@company.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dl-message">관심 품목 / 메모 (선택)</Label>
                    <Textarea
                      id="dl-message"
                      rows={2}
                      placeholder="예: 슬라이딩 댐핑 도어 견적도 함께 검토 희망"
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDownloadPromptOpen(false)}
                      className="flex-1"
                    >
                      열람으로 돌아가기
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-[#FF7B00] hover:bg-[#FF7B00]/90 text-white font-semibold gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      {submitting ? "처리 중..." : "다운로드 시작"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
