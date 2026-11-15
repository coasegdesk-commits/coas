import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BookOpen,
  FileText,
  Upload,
  Download,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  FileUp,
  ExternalLink,
  Layers,
  Search,
  Filter,
} from "lucide-react";
import { adminFetch } from "@/lib/cms";
import { useToast } from "@/hooks/use-toast";
import type { UserManualItem } from "@shared/cms-types";

const CATEGORY_PRESETS = [
  "슬라이딩도어",
  "댐퍼/클로징",
  "원바디 시스템",
  "유리 파티션",
  "발주서 가이드",
  "종합 시공설명서",
  "기타 기술자료",
];

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function AdminManualsTab() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [manuals, setManuals] = useState<UserManualItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modal States
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [detailModalManual, setDetailModalManual] = useState<UserManualItem | null>(null);
  const [editingManual, setEditingManual] = useState<UserManualItem | null>(null);

  // Upload Form State
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("슬라이딩도어");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("v2026.1");
  const [visible, setVisible] = useState(true);

  // Load manuals from server
  const loadManuals = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/manuals");
      if (!res.ok) throw new Error("사용설명서 목록 로드 실패");
      const data = await res.json();
      setManuals(data.manuals || []);
    } catch (err: any) {
      toast({
        title: "오류",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadManuals();
  }, []);

  // Filtered list
  const filteredManuals = manuals.filter((m) => {
    const matchCat = selectedCategory === "all" || m.category === selectedCategory;
    const hay = [m.title, m.category, m.description, m.fileName, m.version].join(" ").toLowerCase();
    const matchSearch = !search || hay.includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Handle File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) {
        // Auto fill title from file name without extension
        const stem = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setTitle(stem);
      }
    }
  };

  // Submit Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !editingManual?.fileUrl) {
      toast({
        title: "파일을 선택해 주세요.",
        description: "PDF 또는 기술자료 문서를 선택해야 합니다.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      let fileUrl = editingManual?.fileUrl || "";
      let fileName = editingManual?.fileName || "";
      let fileSize = editingManual?.fileSize || 0;
      let fileExt = editingManual?.fileExt || "pdf";

      // If new file chosen, upload via binary stream
      if (selectedFile) {
        fileName = selectedFile.name;
        fileSize = selectedFile.size;
        fileExt = selectedFile.name.split(".").pop()?.toLowerCase() || "pdf";

        const uploadRes = await adminFetch("/api/admin/manuals/upload", {
          method: "POST",
          headers: {
            "Content-Type": selectedFile.type || "application/pdf",
            "x-file-name": encodeURIComponent(selectedFile.name),
          },
          body: selectedFile,
        });

        if (!uploadRes.ok) throw new Error("파일 업로드 실패");
        const uploadData = await uploadRes.json();
        fileUrl = uploadData.fileUrl;
      }

      // Save metadata to store
      const payload: Partial<UserManualItem> = {
        id: editingManual?.id,
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        version: version.trim(),
        fileUrl,
        fileName,
        fileSize,
        fileExt,
        visible,
        order: editingManual ? editingManual.order : manuals.length,
      };

      const saveRes = await adminFetch("/api/admin/manuals", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!saveRes.ok) throw new Error("사용설명서 정보 저장 실패");

      toast({
        title: editingManual ? "수정 완료" : "업로드 완료",
        description: `[${payload.title}] 사용설명서가 성공적으로 등록되었습니다.`,
      });

      // Reset form
      setUploadModalOpen(false);
      setEditingManual(null);
      setSelectedFile(null);
      setTitle("");
      setDescription("");
      setVersion("v2026.1");
      setVisible(true);

      void loadManuals();
    } catch (err: any) {
      toast({
        title: "저장 실패",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (manual: UserManualItem) => {
    setEditingManual(manual);
    setTitle(manual.title);
    setCategory(manual.category);
    setDescription(manual.description);
    setVersion(manual.version || "v1.0");
    setVisible(manual.visible);
    setSelectedFile(null);
    setUploadModalOpen(true);
  };

  // Delete Manual
  const handleDeleteManual = async (id: string, manualTitle: string) => {
    if (!window.confirm(`[${manualTitle}] 사용설명서를 정말 삭제하시겠습니까?`)) {
      return;
    }
    try {
      const res = await adminFetch(`/api/admin/manuals/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("삭제 실패");
      toast({
        title: "삭제 완료",
        description: `[${manualTitle}] 사용설명서가 삭제되었습니다.`,
      });
      void loadManuals();
      if (detailModalManual?.id === id) setDetailModalManual(null);
    } catch (err: any) {
      toast({
        title: "삭제 실패",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const totalDownloads = manuals.reduce((acc, m) => acc + (m.downloadCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-[#FF7B00] flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              사용설명서 및 시공가이드 관리
              <Badge className="bg-orange-100 text-[#FF7B00] border-orange-200 text-xs">
                총 {manuals.length}건
              </Badge>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              쇼핑몰 상단 풀다운 메뉴에 노출되는 부품별 사용설명서·타공도면(PDF)을 업로드하고 관리합니다.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => {
            setEditingManual(null);
            setTitle("");
            setDescription("");
            setVersion("v2026.1");
            setVisible(true);
            setSelectedFile(null);
            setUploadModalOpen(true);
          }}
          className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold text-xs h-9 gap-1.5 shadow-sm shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>사용설명서(PDF) 업로드</span>
        </Button>
      </div>

      {/* 2. Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500">등록된 설명서</span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {manuals.length} <span className="text-xs text-slate-400 font-normal">종</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-orange-50 text-[#FF7B00] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500">공개 노출 중</span>
              <div className="text-2xl font-black text-emerald-600 mt-0.5">
                {manuals.filter((m) => m.visible).length} <span className="text-xs text-slate-400 font-normal">종</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500">총 누적 다운로드</span>
              <div className="text-2xl font-black text-blue-600 mt-0.5">
                {totalDownloads.toLocaleString()} <span className="text-xs text-slate-400 font-normal">회</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === "all"
                ? "bg-[#FF7B00] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            전체 보기
          </button>
          {CATEGORY_PRESETS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-[#FF7B00] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제목, 파일명, 분류 검색"
            className="pl-8 h-8 text-xs bg-white"
          />
        </div>
      </div>

      {/* 4. Manuals Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 font-extrabold uppercase border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-3 w-10 text-center">No</th>
                <th className="p-3">분류</th>
                <th className="p-3">사용설명서 제목 및 내용</th>
                <th className="p-3">파일명 / 용량</th>
                <th className="p-3 text-center">버전</th>
                <th className="p-3 text-center">다운로드</th>
                <th className="p-3 text-center">공개상태</th>
                <th className="p-3 text-center">등록일시</th>
                <th className="p-3 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredManuals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    등록된 사용설명서가 없습니다. [+ 사용설명서 업로드] 버튼을 눌러 등록해주세요.
                  </td>
                </tr>
              ) : (
                filteredManuals.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Category */}
                    <td className="p-3 whitespace-nowrap">
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10.5px]">
                        {m.category}
                      </Badge>
                    </td>

                    {/* Title & Description */}
                    <td className="p-3 max-w-[280px]">
                      <span className="font-extrabold text-slate-900 block truncate" title={m.title}>
                        {m.title}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate mt-0.5" title={m.description}>
                        {m.description || "(설명 미입력)"}
                      </span>
                    </td>

                    {/* File & Size */}
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded bg-red-100 text-red-600 flex items-center justify-center font-black text-[10px] shrink-0 uppercase">
                          {m.fileExt || "pdf"}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs text-slate-700 font-semibold block truncate max-w-[140px]" title={m.fileName}>
                            {m.fileName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatBytes(m.fileSize)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Version */}
                    <td className="p-3 text-center font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {m.version || "-"}
                    </td>

                    {/* Download Count */}
                    <td className="p-3 text-center font-bold text-slate-800">
                      {m.downloadCount}회
                    </td>

                    {/* Visible Badge */}
                    <td className="p-3 text-center">
                      {m.visible ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          공개
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                          비공개
                        </span>
                      )}
                    </td>

                    {/* Upload Date */}
                    <td className="p-3 text-center font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {m.uploadedAt.slice(0, 10)}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setDetailModalManual(m)}
                          title="상세 보기 및 미리보기"
                          className="h-7 w-7 p-0 border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(m)}
                          title="수정하기"
                          className="h-7 w-7 p-0 border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteManual(m.id, m.title)}
                          title="삭제하기"
                          className="h-7 w-7 p-0 border-slate-300 text-red-600 hover:bg-red-50 hover:border-red-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal: Upload & Edit Manual */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileUp className="w-5 h-5 text-[#FF7B00]" />
              {editingManual ? "사용설명서 정보 수정" : "신규 사용설명서(PDF) 업로드"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-4 pt-2">
            {/* File Selection Box */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                설명서 파일 (PDF, ZIP, CAD도면)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#FF7B00] rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-orange-50/30"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.zip,.dwg,.doc,.docx"
                  className="hidden"
                />
                <FileText className="w-8 h-8 text-[#FF7B00] mx-auto mb-1.5 opacity-80" />
                {selectedFile ? (
                  <div>
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {selectedFile.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {formatBytes(selectedFile.size)} · 선택 완료 (클릭하여 파일 변경)
                    </span>
                  </div>
                ) : editingManual ? (
                  <div>
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      기존 파일: {editingManual.fileName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      클릭하여 새 파일로 교체하실 수 있습니다.
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      여기를 클릭하여 파일 선택
                    </span>
                    <span className="text-[11px] text-slate-400">
                      PDF, ZIP, DWG 등 최대 100MB 지원
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                설명서 제목 <span className="text-red-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 슬라이딩 도어 시스템 종합 시공설명서"
                required
                className="h-10 text-xs font-bold"
              />
            </div>

            {/* Category & Version */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  분류 (카테고리)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF7B00] bg-white"
                >
                  {CATEGORY_PRESETS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  규격 / 개정 버전
                </label>
                <Input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="예: v2026.1"
                  className="h-10 text-xs font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                상세 설명 (시공 대상 부품 및 가이드 요약)
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="예: 60kg~500kg 하중별 상하부 롤러 가공 치수 및 레일 매립 시공 주의사항"
                rows={3}
                className="text-xs resize-none"
              />
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  홈페이지 풀다운 메뉴 즉시 노출
                </span>
                <span className="text-[11px] text-slate-500">
                  체크 시 사용자가 상단 헤더 메뉴에서 바로 다운로드할 수 있습니다.
                </span>
              </div>
              <input
                type="checkbox"
                checked={visible}
                onChange={(e) => setVisible(e.target.checked)}
                className="w-4 h-4 rounded text-[#FF7B00] focus:ring-[#FF7B00]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadModalOpen(false)}
                disabled={uploading}
                className="text-xs font-bold"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={uploading}
                className="bg-[#FF7B00] hover:bg-[#e66f00] text-white text-xs font-bold gap-1.5 shadow-sm"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {editingManual ? "수정 완료" : "설명서 등록하기"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Modal: Detailed View & Inspection Modal */}
      {detailModalManual && (
        <Dialog open={true} onOpenChange={() => setDetailModalManual(null)}>
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-orange-100 text-[#FF7B00] font-black text-xs">
                  {detailModalManual.category}
                </span>
                {detailModalManual.version && (
                  <span className="text-xs text-slate-400 font-mono">
                    {detailModalManual.version}
                  </span>
                )}
              </div>
              <DialogTitle className="text-base font-extrabold text-slate-900 mt-1">
                {detailModalManual.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div>
                  <span className="text-slate-400 font-semibold block mb-0.5">상세 설명</span>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {detailModalManual.description || "(등록된 상세 설명이 없습니다.)"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-semibold">파일명</span>
                    <span className="text-slate-800 font-mono font-bold block truncate" title={detailModalManual.fileName}>
                      {detailModalManual.fileName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">파일 용량</span>
                    <span className="text-slate-800 font-bold block">
                      {formatBytes(detailModalManual.fileSize)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">누적 다운로드</span>
                    <span className="text-[#FF7B00] font-black block">
                      {detailModalManual.downloadCount}회
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">등록 일시</span>
                    <span className="text-slate-600 font-mono block">
                      {detailModalManual.uploadedAt.slice(0, 16).replace("T", " ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <a
                  href={detailModalManual.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1"
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-xs font-bold border-slate-300 gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                    새 탭에서 열람
                  </Button>
                </a>
                <a
                  href={detailModalManual.fileUrl}
                  download={detailModalManual.fileName}
                  className="flex-1"
                >
                  <Button
                    type="button"
                    className="w-full bg-[#FF7B00] hover:bg-[#e66f00] text-white text-xs font-bold gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    다운로드 테스트
                  </Button>
                </a>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDetailModalManual(null)}
                className="text-xs font-bold"
              >
                닫기
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const m = detailModalManual;
                  setDetailModalManual(null);
                  openEditModal(m);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                설명서 수정
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
