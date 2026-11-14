import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { adminFetch, resolveAssetUrl, uploadAdminFile } from "@/lib/cms";
import { ImagePicker } from "./image-picker";
import { ECatalogViewerModal } from "@/components/ecatalog-viewer-modal";
import type { MediaItem, SiteDesignSettings } from "@shared/cms-types";
import {
  BookOpen,
  Upload,
  FileText,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Loader2,
  Eye,
  Plus,
  ExternalLink,
} from "lucide-react";

interface AdminECatalogTabProps {
  design: SiteDesignSettings;
  mediaList: MediaItem[];
  onSaved: () => void;
  onMediaUploaded: (item: MediaItem) => void;
}

export function AdminECatalogTab({
  design,
  mediaList,
  onSaved,
  onMediaUploaded,
}: AdminECatalogTabProps) {
  const { toast } = useToast();
  const [ecatalog, setEcatalog] = useState(design.ecatalog);
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingSlides, setUploadingSlides] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pickerUrl, setPickerUrl] = useState("");

  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const slidesInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setEcatalog(design.ecatalog);
  }, [design.ecatalog]);

  const handleSave = async (nextEcatalog = ecatalog) => {
    setSaving(true);
    try {
      await adminFetch("/api/admin/design", {
        method: "PUT",
        body: JSON.stringify({
          ...design,
          ecatalog: nextEcatalog,
        }),
      });
      toast({
        title: "전자카탈로그 설정이 저장되었습니다.",
      });
      onSaved();
    } catch (err: any) {
      toast({
        title: "저장 실패",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast({
        title: "PDF 파일(.pdf)만 업로드할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    setUploadingPdf(true);
    try {
      const res = await uploadAdminFile(file, "catalogs");
      onMediaUploaded(res.media);
      const updated = {
        ...ecatalog,
        pdfUrl: res.url,
        pdfFileName: file.name,
      };
      setEcatalog(updated);
      await handleSave(updated);
    } catch (err: any) {
      toast({
        title: "PDF 업로드 실패",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleMultiSlideUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    setUploadingSlides(true);
    try {
      const uploadedUrls: string[] = [];
      for (const f of files) {
        const res = await uploadAdminFile(f, "catalogs");
        onMediaUploaded(res.media);
        uploadedUrls.push(res.url);
      }
      setEcatalog((prev) => ({
        ...prev,
        previewImages: [...prev.previewImages, ...uploadedUrls],
      }));
      toast({
        title: `${uploadedUrls.length}개의 슬라이드 이미지가 추가되었습니다.`,
        description: "우측 상단 [변경사항 저장] 버튼을 눌러 확정해주세요.",
      });
    } catch (err: any) {
      toast({
        title: "슬라이드 업로드 실패",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploadingSlides(false);
    }
  };

  const moveSlide = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= ecatalog.previewImages.length) return;
    const next = [...ecatalog.previewImages];
    [next[idx], next[target]] = [next[target], next[idx]];
    setEcatalog({ ...ecatalog, previewImages: next });
  };

  const removeSlide = (idx: number) => {
    setEcatalog({
      ...ecatalog,
      previewImages: ecatalog.previewImages.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">전자카탈로그 관리</h2>
          <p className="text-xs text-gray-500">
            상단 [전자카탈로그] 클릭 시 즉시 열리는 뷰어의 PDF 파일, 슬라이드 페이지 및 다운로드 고객정보 수집 여부를 설정합니다.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="w-4 h-4 mr-1.5" />
            뷰어 미리보기
          </Button>
          <Button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1.5" />
            )}
            변경사항 저장
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Settings & Lead Capture Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#FF7B00]" />
              기본 정보 및 다운로드 정책
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                전자카탈로그 뷰어 제목
              </label>
              <Input
                value={ecatalog.title}
                onChange={(e) =>
                  setEcatalog({ ...ecatalog, title: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                안내 설명 문구
              </label>
              <Textarea
                rows={3}
                value={ecatalog.description}
                onChange={(e) =>
                  setEcatalog({ ...ecatalog, description: e.target.value })
                }
              />
            </div>

            <label className="flex items-center justify-between p-4 rounded-xl border border-orange-200 bg-orange-50/50 cursor-pointer">
              <div className="pr-4">
                <p className="text-sm font-bold text-gray-900">
                  다운로드 요청 시 고객 정보 입력 받기 (추천)
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  열람은 즉시 허용하고, [카탈로그 다운로드] 클릭 시 업체명·담당자·연락처를 입력받은 뒤 파일을 내려받게 합니다.
                </p>
              </div>
              <Switch
                checked={ecatalog.requireInfoForDownload}
                onCheckedChange={(v) =>
                  setEcatalog({ ...ecatalog, requireInfoForDownload: v })
                }
              />
            </label>
          </CardContent>
        </Card>

        {/* PDF File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FF7B00]" />
              카탈로그 원본 PDF 파일 (최대 100MB)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handlePdfUpload}
              className="hidden"
            />

            {ecatalog.pdfUrl ? (
              <div className="p-4 rounded-xl border border-green-200 bg-green-50/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-green-100 text-green-700 rounded-lg shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {ecatalog.pdfFileName || "등록된 카탈로그.pdf"}
                    </p>
                    <a
                      href={resolveAssetUrl(ecatalog.pdfUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#FF7B00] hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                      새 창에서 PDF 직접 확인
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 shrink-0"
                  onClick={() =>
                    setEcatalog({
                      ...ecatalog,
                      pdfUrl: null,
                      pdfFileName: null,
                    })
                  }
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  해제
                </Button>
              </div>
            ) : (
              <div className="p-6 rounded-xl border-2 border-dashed border-gray-200 text-center bg-gray-50">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">
                  현재 등록된 통합 PDF 파일이 없습니다.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF가 없어도 아래 슬라이드 페이지 뷰어가 자동으로 동작하며, PDF를 업로드하면 PDF 뷰어 및 즉시 다운로드가 활성화됩니다.
                </p>
              </div>
            )}

            <Button
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              disabled={uploadingPdf}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            >
              {uploadingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  PDF 업로드 중...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {ecatalog.pdfUrl
                    ? "새 카탈로그 PDF 파일로 교체 업로드"
                    : "통합 카탈로그 PDF 파일 업로드"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview Slide Pages Management */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              웹 뷰어 슬라이드 페이지 이미지 ({ecatalog.previewImages.length}페이지)
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              고객이 [전자카탈로그] 클릭 시 설치 없이 즉시 넘겨볼 수 있는 카탈로그 페이지 이미지들입니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={slidesInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleMultiSlideUpload}
              className="hidden"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => slidesInputRef.current?.click()}
              disabled={uploadingSlides}
              className="bg-[#FF7B00] hover:bg-[#e66f00] text-white"
            >
              {uploadingSlides ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-1.5" />
              )}
              여러 장 한 번에 업로드
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Optional add from library */}
          <div className="max-w-xl">
            <ImagePicker
              compact
              label="보관함에서 슬라이드 페이지 추가"
              value={pickerUrl}
              onChange={(url) => {
                if (url) {
                  setEcatalog((prev) => ({
                    ...prev,
                    previewImages: [...prev.previewImages, url],
                  }));
                  setPickerUrl("");
                }
              }}
              folder="catalogs"
              mediaList={mediaList}
              onUploaded={onMediaUploaded}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {ecatalog.previewImages.map((img, idx) => (
              <div
                key={`${img}-${idx}`}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col"
              >
                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                  <img
                    src={resolveAssetUrl(img)}
                    alt={`슬라이드 ${idx + 1}`}
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {idx + 1} p
                  </span>
                </div>
                <div className="p-1.5 flex items-center justify-between bg-gray-50 border-t border-gray-100">
                  <div className="flex gap-0.5">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => moveSlide(idx, -1)}
                      disabled={idx === 0}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => moveSlide(idx, 1)}
                      disabled={idx === ecatalog.previewImages.length - 1}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-red-500 hover:text-red-700"
                    onClick={() => removeSlide(idx)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ECatalogViewerModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        ecatalog={ecatalog}
      />
    </div>
  );
}
