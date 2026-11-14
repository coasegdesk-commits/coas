import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { resolveAssetUrl, uploadAdminFile } from "@/lib/cms";
import type { MediaItem } from "@shared/cms-types";
import {
  Upload,
  FolderOpen,
  X,
  Loader2,
  Search,
  FileText,
  Check,
  Image as ImageIcon,
} from "lucide-react";

interface ImagePickerProps {
  value: string;
  onChange: (url: string) => void;
  folder?: "products" | "banners" | "catalogs" | "general";
  mediaList?: MediaItem[];
  onUploaded?: (item: MediaItem) => void;
  label?: string;
  accept?: string;
  placeholder?: string;
  compact?: boolean;
}

export function ImagePicker({
  value,
  onChange,
  folder = "products",
  mediaList = [],
  onUploaded,
  label,
  accept = "image/*,.gif",
  placeholder = "/uploads/... 또는 이미지 URL",
  compact = false,
}: ImagePickerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "uploads" | "builtin">("all");
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadAdminFile(file, folder);
      onChange(res.url);
      onUploaded?.(res.media);
      toast({
        title: "파일 업로드 완료",
        description: file.name,
      });
    } catch (err: any) {
      toast({
        title: "업로드 실패",
        description: err.message || "파일 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      await handleFile(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  const filteredMedia = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mediaList.filter((m) => {
      const isPdf = m.url.toLowerCase().endsWith(".pdf");
      if (accept.includes("image") && !accept.includes(".pdf") && isPdf) {
        return false;
      }
      if (sourceFilter === "uploads" && m.id.startsWith("asset-")) return false;
      if (sourceFilter === "builtin" && !m.id.startsWith("asset-")) return false;
      if (!q) return true;
      return (
        m.originalName.toLowerCase().includes(q) ||
        m.fileName.toLowerCase().includes(q) ||
        m.url.toLowerCase().includes(q)
      );
    });
  }, [mediaList, search, sourceFilter, accept]);

  const isPdfValue = value?.toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border rounded-lg p-3 transition-colors ${
          dragOver
            ? "border-[#FF7B00] bg-orange-50/60"
            : "border-gray-200 bg-gray-50/60"
        }`}
      >
        <div className={`flex ${compact ? "items-center gap-3" : "flex-col sm:flex-row gap-4 items-start sm:items-center"}`}>
          {/* Preview Box */}
          <div
            className={`${
              compact ? "w-16 h-16" : "w-28 h-24"
            } rounded-md bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 relative`}
          >
            {value ? (
              isPdfValue ? (
                <div className="flex flex-col items-center text-[#FF7B00] p-2 text-center">
                  <FileText className="w-7 h-7" />
                  <span className="text-[10px] font-semibold mt-1">PDF</span>
                </div>
              ) : (
                <img
                  src={resolveAssetUrl(value)}
                  alt="미리보기"
                  className="w-full h-full object-contain"
                />
              )
            ) : (
              <div className="flex flex-col items-center text-gray-400 text-xs">
                <ImageIcon className="w-5 h-5 mb-1 opacity-60" />
                {!compact && <span>없음</span>}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex-1 w-full space-y-2">
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleInputChange}
                className="hidden"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-[#FF7B00] hover:bg-[#e66f00] text-white"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    내 PC에서 업로드
                  </>
                )}
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setLibraryOpen(true)}
              >
                <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                보관함에서 선택
              </Button>

              {value && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onChange("")}
                  className="text-gray-500 hover:text-red-600"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  비우기
                </Button>
              )}
            </div>

            {!compact && (
              <Input
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-8 text-xs bg-white"
              />
            )}
          </div>
        </div>
      </div>

      {/* Media Library Dialog */}
      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>이미지 / 미디어 보관함 ({filteredMedia.length}개)</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row gap-2 py-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="파일명 검색 (예: dp-40, part-028, 60kg, gif...)"
                className="pl-9"
              />
            </div>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg shrink-0">
              {(
                [
                  { id: "all", label: "전체" },
                  { id: "uploads", label: "새 업로드" },
                  { id: "builtin", label: "기본 내장 자산" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSourceFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    sourceFilter === tab.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50 min-h-[320px]">
            {filteredMedia.length === 0 ? (
              <div className="h-60 flex flex-col items-center justify-center text-gray-400 text-sm">
                검색 조건에 맞는 미디어 파일이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {filteredMedia.map((item) => {
                  const selected = value === item.url;
                  const isPdf = item.url.toLowerCase().endsWith(".pdf");
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onChange(item.url);
                        setLibraryOpen(false);
                      }}
                      className={`group text-left bg-white rounded-lg border overflow-hidden transition-all hover:shadow-md ${
                        selected
                          ? "border-[#FF7B00] ring-2 ring-[#FF7B00]/30"
                          : "border-gray-200 hover:border-[#FF7B00]/50"
                      }`}
                    >
                      <div className="aspect-square bg-[#EAEAEA] flex items-center justify-center overflow-hidden relative p-1">
                        {isPdf ? (
                          <FileText className="w-10 h-10 text-[#FF7B00]" />
                        ) : (
                          <img
                            src={resolveAssetUrl(item.url)}
                            alt={item.originalName}
                            loading="lazy"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          />
                        )}
                        {selected && (
                          <div className="absolute top-1.5 right-1.5 bg-[#FF7B00] text-white rounded-full p-1">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {item.originalName}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {item.folder}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
