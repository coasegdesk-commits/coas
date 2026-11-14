import { useState, useEffect, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { adminFetch, resolveAssetUrl } from "@/lib/cms";
import { ImagePicker } from "./image-picker";
import type { CmsProduct, MediaItem, NewProductItem } from "@shared/cms-types";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Maximize2,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface AdminNewProductsTabProps {
  newProducts: NewProductItem[];
  products: CmsProduct[];
  mediaList: MediaItem[];
  onSaved: () => void;
  onMediaUploaded: (item: MediaItem) => void;
}

const emptyItem = (order: number): NewProductItem => ({
  id: `np-${Date.now()}`,
  productId: "",
  name: "",
  desc: "",
  image: "",
  wide: false,
  baseScale: 1.1,
  hoverScale: 1.3,
  showBadge: true,
  visible: true,
  showInNav: true,
  order,
});

export function AdminNewProductsTab({
  newProducts,
  products,
  mediaList,
  onSaved,
  onMediaUploaded,
}: AdminNewProductsTabProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<NewProductItem[]>(newProducts);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<NewProductItem | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    setItems([...newProducts].sort((a, b) => a.order - b.order));
  }, [newProducts]);

  const persistList = async (
    nextList: NewProductItem[],
    successMsg = "신제품 목록이 저장되었습니다.",
  ) => {
    const normalized = nextList.map((item, idx) => ({ ...item, order: idx }));
    setItems(normalized);
    setSaving(true);
    try {
      await adminFetch("/api/admin/new-products", {
        method: "PUT",
        body: JSON.stringify({ items: normalized }),
      });
      toast({ title: successMsg });
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

  const openCreate = () => {
    setIsNew(true);
    setEditing(emptyItem(items.length));
  };

  const openEdit = (item: NewProductItem) => {
    setIsNew(false);
    setEditing({ ...item });
  };

  const handleSaveModal = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast({ title: "표시 제품명을 입력해주세요.", variant: "destructive" });
      return;
    }
    if (!editing.image.trim()) {
      toast({ title: "신제품 이미지를 업로드하거나 선택해주세요.", variant: "destructive" });
      return;
    }

    const cleanSlug =
      editing.productId.trim() ||
      editing.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9가-힣-]+/g, "-")
        .replace(/^-|-$/g, "") ||
      `prod-${Date.now()}`;

    const finalItem: NewProductItem = {
      ...editing,
      productId: cleanSlug,
      name: editing.name.trim(),
      desc: editing.desc.trim(),
    };

    // If product doesn't exist in master DB yet, auto-register a base product so /product/:id never 404s!
    const existsInDb = products.some((p) => p.id === cleanSlug);
    if (!existsInDb) {
      try {
        await adminFetch("/api/admin/products", {
          method: "POST",
          body: JSON.stringify({
            id: cleanSlug,
            name: finalItem.name,
            nameKo: finalItem.name,
            category: "New Hardware",
            categoryKo: "신제품 하드웨어",
            descriptionKo: finalItem.desc || `${finalItem.name} 신제품`,
            imageUrl: finalItem.image,
            detailImages: [],
          }),
        });
      } catch {
        // non-blocking
      }
    }

    const nextList = isNew
      ? [...items, finalItem]
      : items.map((i) => (i.id === finalItem.id ? finalItem : i));

    setEditing(null);
    await persistList(
      nextList,
      isNew ? "신제품이 등록되었습니다." : "신제품 정보가 수정되었습니다.",
    );
  };

  const handleDelete = async (item: NewProductItem) => {
    if (!window.confirm(`'${item.name}' 신제품 카드를 삭제하시겠습니까?`)) return;
    const nextList = items.filter((i) => i.id !== item.id);
    await persistList(nextList, "신제품 카드가 삭제되었습니다.");
  };

  const handleMove = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    await persistList(next, "진열 순서가 변경되었습니다.");
  };

  const handleToggleVisible = async (item: NewProductItem) => {
    const next = items.map((i) =>
      i.id === item.id ? { ...i, visible: !i.visible } : i,
    );
    await persistList(
      next,
      !item.visible ? "신제품이 노출 상태로 변경되었습니다." : "신제품이 숨김 처리되었습니다.",
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            신제품 관리 ({items.length}개 등록됨)
          </h2>
          <p className="text-xs text-gray-500">
            움직이는 GIF·고화질 이미지 업로드, 2칸 와이드 크기 전환, 배율 조정 및 상단 메뉴 드롭다운 연동을 관리합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/new-products"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#FF7B00] px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
          >
            신제품 페이지 보기
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Button
            onClick={openCreate}
            disabled={saving}
            className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            신제품 등록
          </Button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={`bg-white rounded-xl border overflow-hidden shadow-sm transition-all flex flex-col ${
              item.wide ? "sm:col-span-2" : ""
            } ${
              item.visible
                ? "border-gray-200"
                : "border-dashed border-gray-300 opacity-60"
            }`}
          >
            <div
              className={`${
                item.wide ? "aspect-[16/9]" : "aspect-[4/3]"
              } bg-[#EAEAEA] relative overflow-hidden flex items-center justify-center`}
            >
              {item.image ? (
                <img
                  src={resolveAssetUrl(item.image)}
                  alt={item.name}
                  style={{ transform: `scale(${item.baseScale || 1})` }}
                  className="w-full h-full object-contain transition-transform"
                />
              ) : (
                <span className="text-xs text-gray-400">이미지 없음</span>
              )}

              <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                {item.showBadge && (
                  <Badge className="bg-[#FF7B00] text-white text-[10px]">
                    NEW
                  </Badge>
                )}
                {item.wide && (
                  <Badge variant="secondary" className="bg-slate-800 text-white text-[10px]">
                    <Maximize2 className="w-2.5 h-2.5 mr-1" />
                    2칸 와이드
                  </Badge>
                )}
                {!item.visible && (
                  <Badge variant="outline" className="bg-white/90 text-gray-600 text-[10px]">
                    숨김
                  </Badge>
                )}
              </div>

              <div className="absolute top-2.5 right-2.5 bg-black/60 text-white text-[11px] font-semibold px-2 py-0.5 rounded">
                #{idx + 1}
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-gray-900">{item.name}</h3>
                  <span className="text-[11px] text-gray-400 font-mono">
                    ID: {item.productId}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {item.desc || "설명 없음"}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    기본 배율 {item.baseScale}x / 호버 {item.hoverScale}x
                  </span>
                  {item.showInNav && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-orange-50 text-[#FF7B00] font-medium">
                      상단 드롭다운 노출
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => handleMove(idx, -1)}
                    disabled={idx === 0 || saving}
                    title="앞으로 이동"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => handleMove(idx, 1)}
                    disabled={idx === items.length - 1 || saving}
                    title="뒤로 이동"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => handleToggleVisible(item)}
                    disabled={saving}
                    title={item.visible ? "숨기기" : "노출하기"}
                  >
                    {item.visible ? (
                      <Eye className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    수정
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(item)}
                    disabled={saving}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNew ? "신제품 등록" : `신제품 수정 — ${editing?.name}`}
            </DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-5 py-2">
              <datalist id="admin-np-products">
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameKo} ({p.name})
                  </option>
                ))}
              </datalist>

              <ImagePicker
                label="신제품 대표 이미지 (움직이는 GIF / PNG / JPG 지원)"
                value={editing.image}
                onChange={(url) => setEditing({ ...editing, image: url })}
                folder="products"
                mediaList={mediaList}
                onUploaded={onMediaUploaded}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    표시 제품명 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                    placeholder="예: DP-80 PRO"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    연결 상세페이지 제품 ID (자동완성 또는 신규 입력)
                  </label>
                  <Input
                    list="admin-np-products"
                    value={editing.productId}
                    onChange={(e) => {
                      const pid = e.target.value;
                      const found = products.find((p) => p.id === pid);
                      setEditing({
                        ...editing,
                        productId: pid,
                        ...(found && !editing.name ? { name: found.name } : {}),
                        ...(found && !editing.desc && found.descriptionKo
                          ? { desc: found.descriptionKo }
                          : {}),
                      });
                    }}
                    placeholder="비워두면 제품명으로 자동 생성됩니다"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  카드 한줄 설명
                </label>
                <Input
                  value={editing.desc}
                  onChange={(e) =>
                    setEditing({ ...editing, desc: e.target.value })
                  }
                  placeholder="예: 고하중 양방향 소프트 댐핑 슬라이딩 시스템"
                />
              </div>

              {/* Scale Sliders + Live Hover Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">
                        기본 이미지 확대 배율
                      </span>
                      <span className="font-bold text-[#FF7B00]">
                        {editing.baseScale.toFixed(2)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.8}
                      max={1.6}
                      step={0.05}
                      value={editing.baseScale}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          baseScale: Number(e.target.value),
                        })
                      }
                      className="w-full accent-[#FF7B00]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">
                        마우스 올렸을 때 확대 배율
                      </span>
                      <span className="font-bold text-[#FF7B00]">
                        {editing.hoverScale.toFixed(2)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.9}
                      max={1.8}
                      step={0.05}
                      value={editing.hoverScale}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          hoverScale: Number(e.target.value),
                        })
                      }
                      className="w-full accent-[#FF7B00]"
                    />
                  </div>
                </div>

                {/* Live Interactive Preview */}
                <div>
                  <p className="text-[11px] text-gray-500 mb-1.5 text-center">
                    실제 카드 미리보기 (마우스를 올려보세요)
                  </p>
                  <div className="group bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <div
                      className={`${
                        editing.wide ? "aspect-[16/9]" : "aspect-[4/3]"
                      } bg-[#EAEAEA] relative overflow-hidden flex items-center justify-center`}
                    >
                      {editing.image ? (
                        <img
                          src={resolveAssetUrl(editing.image)}
                          alt="미리보기"
                          style={
                            {
                              "--base-scale": editing.baseScale,
                              "--hover-scale": editing.hoverScale,
                            } as CSSProperties
                          }
                          className="w-full h-full object-contain scale-[var(--base-scale)] group-hover:scale-[var(--hover-scale)] transition-transform duration-500"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">이미지 선택 필요</span>
                      )}
                      {editing.showBadge && (
                        <Badge className="absolute top-2 left-2 bg-[#FF7B00] text-white text-[10px]">
                          NEW
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      와이드 카드 (가로 2칸 차지)
                    </p>
                    <p className="text-xs text-gray-500">
                      DP-60, 1 Body처럼 가로로 긴 이미지에 적합
                    </p>
                  </div>
                  <Switch
                    checked={editing.wide}
                    onCheckedChange={(v) => setEditing({ ...editing, wide: v })}
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      좌측 상단 NEW 배지 표시
                    </p>
                    <p className="text-xs text-gray-500">
                      오렌지색 NEW 태그 노출
                    </p>
                  </div>
                  <Switch
                    checked={editing.showBadge}
                    onCheckedChange={(v) =>
                      setEditing({ ...editing, showBadge: v })
                    }
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      상단바 '신제품' 드롭다운 메뉴 노출
                    </p>
                    <p className="text-xs text-gray-500">
                      헤더 메뉴에 마우스 오버 시 자동 표시
                    </p>
                  </div>
                  <Switch
                    checked={editing.showInNav}
                    onCheckedChange={(v) =>
                      setEditing({ ...editing, showInNav: v })
                    }
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      쇼핑몰 화면에 공개
                    </p>
                    <p className="text-xs text-gray-500">
                      끄면 삭제하지 않고 임시 숨김 처리
                    </p>
                  </div>
                  <Switch
                    checked={editing.visible}
                    onCheckedChange={(v) =>
                      setEditing({ ...editing, visible: v })
                    }
                  />
                </label>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(null)}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleSaveModal}
              disabled={saving}
              className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isNew ? "신제품 등록 완료" : "수정사항 저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
