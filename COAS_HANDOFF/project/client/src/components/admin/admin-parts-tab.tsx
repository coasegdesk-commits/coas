import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { adminFetch, resolveAssetUrl, uploadAdminFile } from "@/lib/cms";
import { ImagePicker } from "./image-picker";
import type {
  CmsProduct,
  MediaItem,
  PartCardItem,
  PartsSection,
  SidebarFilterCategory,
} from "@shared/cms-types";
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Search,
  FileText,
  Upload,
  Loader2,
  ExternalLink,
  Layers,
  Database,
  ListFilter,
  Save,
  Maximize2,
} from "lucide-react";

interface AdminPartsTabProps {
  partsSections: PartsSection[];
  sidebarFilters: SidebarFilterCategory[];
  products: CmsProduct[];
  mediaList: MediaItem[];
  onSaved: () => void;
  onMediaUploaded: (item: MediaItem) => void;
}

const createBlankProduct = (id = ""): CmsProduct => ({
  id,
  name: "",
  nameKo: "",
  category: "Sliding Door System",
  categoryKo: "슬라이딩 도어 시스템",
  description: null,
  descriptionKo: "",
  specifications: "",
  weightCapacity: "",
  pageNumber: "",
  imageUrl: "",
  detailImages: [],
  searchText: null,
});

export function AdminPartsTab({
  partsSections,
  sidebarFilters,
  products,
  mediaList,
  onSaved,
  onMediaUploaded,
}: AdminPartsTabProps) {
  const { toast } = useToast();
  const [subTab, setSubTab] = useState<"index" | "products" | "sidebar">("index");

  // --- Parts Index State ---
  const [sections, setSections] = useState<PartsSection[]>(partsSections);
  const [activeSectionId, setActiveSectionId] = useState<string>(
    partsSections[0]?.id || "",
  );
  const [cardSearch, setCardSearch] = useState("");
  const [savingSections, setSavingSections] = useState(false);

  // Part Card Modal
  const [editingCard, setEditingCard] = useState<{
    sectionId: string;
    card: PartCardItem;
    isNew: boolean;
  } | null>(null);

  // Section Settings Modal
  const [editingSection, setEditingSection] = useState<{
    section: PartsSection;
    isNew: boolean;
  } | null>(null);

  // --- Master Products & Detail Drawings State ---
  const [prodSearch, setProdSearch] = useState("");
  const [prodCategoryFilter, setProdCategoryFilter] = useState("all");
  const [onlyWithDrawings, setOnlyWithDrawings] = useState(false);
  const [editingProduct, setEditingProduct] = useState<{
    product: CmsProduct;
    isNew: boolean;
  } | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingDrawings, setUploadingDrawings] = useState(false);
  const [drawingPickerUrl, setDrawingPickerUrl] = useState("");
  const drawingFileRef = useRef<HTMLInputElement | null>(null);

  // --- Sidebar Filters State ---
  const [filtersDraft, setFiltersDraft] =
    useState<SidebarFilterCategory[]>(sidebarFilters);
  const [savingFilters, setSavingFilters] = useState(false);

  useEffect(() => {
    const sorted = [...partsSections].sort((a, b) => a.order - b.order);
    setSections(sorted);
    if (!sorted.some((s) => s.id === activeSectionId) && sorted[0]) {
      setActiveSectionId(sorted[0].id);
    }
  }, [partsSections]);

  useEffect(() => {
    setFiltersDraft(sidebarFilters);
  }, [sidebarFilters]);

  const persistSections = async (
    nextSections: PartsSection[],
    msg = "부품 인덱스 구성이 저장되었습니다.",
  ) => {
    const normalized = nextSections.map((sec, idx) => ({ ...sec, order: idx }));
    setSections(normalized);
    setSavingSections(true);
    try {
      await adminFetch("/api/admin/parts-sections", {
        method: "PUT",
        body: JSON.stringify({ sections: normalized }),
      });
      toast({ title: msg });
      onSaved();
    } catch (err: any) {
      toast({
        title: "저장 실패",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingSections(false);
    }
  };

  const activeSection = useMemo(
    () => sections.find((s) => s.id === activeSectionId) || sections[0] || null,
    [sections, activeSectionId],
  );

  const filteredSectionItems = useMemo(() => {
    if (!activeSection) return [];
    const q = cardSearch.trim().toLowerCase();
    if (!q) return activeSection.items;
    return activeSection.items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.productId.toLowerCase().includes(q) ||
        (item.subtitle || "").toLowerCase().includes(q) ||
        (item.page || "").toLowerCase().includes(q),
    );
  }, [activeSection, cardSearch]);

  // Open Product Detail Editor directly for any productId (creates blank if not in DB yet)
  const openProductEditorById = (productId: string, fallbackCard?: PartCardItem) => {
    const found = products.find((p) => p.id === productId);
    if (found) {
      setEditingProduct({
        product: {
          ...found,
          detailImages: Array.isArray(found.detailImages)
            ? [...found.detailImages]
            : [],
        },
        isNew: false,
      });
    } else {
      setEditingProduct({
        product: {
          ...createBlankProduct(productId),
          name: fallbackCard?.name || productId,
          nameKo: fallbackCard?.name || productId,
          pageNumber: fallbackCard?.page?.replace(/[^0-9]/g, "") || "",
          imageUrl: fallbackCard?.image || "",
        },
        isNew: true,
      });
    }
  };

  // --- Section Actions ---
  const handleSaveSectionModal = async () => {
    if (!editingSection) return;
    const { section, isNew } = editingSection;
    if (!section.title.trim()) {
      toast({ title: "섹션 제목을 입력해주세요.", variant: "destructive" });
      return;
    }
    const next = isNew
      ? [...sections, section]
      : sections.map((s) => (s.id === section.id ? section : s));
    setEditingSection(null);
    setActiveSectionId(section.id);
    await persistSections(
      next,
      isNew ? "새 섹션이 추가되었습니다." : "섹션 설정이 수정되었습니다.",
    );
  };

  const handleMoveSection = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[idx], next[target]] = [next[target], next[idx]];
    await persistSections(next, "섹션 순서가 변경되었습니다.");
  };

  const handleDeleteSection = async (sec: PartsSection) => {
    if (
      !window.confirm(
        `'${sec.title}' 섹션과 내부 카드 ${sec.items.length}개를 삭제하시겠습니까? (원본 제품 DB는 삭제되지 않습니다)`,
      )
    )
      return;
    const next = sections.filter((s) => s.id !== sec.id);
    await persistSections(next, "섹션이 삭제되었습니다.");
  };

  // --- Card Actions ---
  const openNewCardModal = () => {
    if (!activeSection) return;
    const maxRowGroup = activeSection.items.reduce(
      (max, it) => (typeof it.rowGroup === "number" && it.rowGroup > max ? it.rowGroup : max),
      0,
    );
    setEditingCard({
      sectionId: activeSection.id,
      isNew: true,
      card: {
        id: `pi-${Date.now()}`,
        productId: "",
        name: "",
        subtitle: "",
        page: "",
        image: "",
        wide: false,
        rowGroup: maxRowGroup,
        visible: true,
      },
    });
  };

  const handleSaveCardModal = async () => {
    if (!editingCard) return;
    const { sectionId, card, isNew } = editingCard;
    if (!card.name.trim()) {
      toast({ title: "카드 표시 이름을 입력해주세요.", variant: "destructive" });
      return;
    }

    const cleanProdId =
      card.productId.trim() ||
      card.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9가-힣-]+/g, "-")
        .replace(/^-|-$/g, "") ||
      `part-${Date.now()}`;

    const finalCard: PartCardItem = {
      ...card,
      productId: cleanProdId,
      name: card.name.trim(),
      subtitle: card.subtitle?.trim() || "",
      page: card.page?.trim() || "",
    };

    // Ensure matching product exists in DB so clicking card never 404s
    if (!products.some((p) => p.id === cleanProdId)) {
      try {
        await adminFetch("/api/admin/products", {
          method: "POST",
          body: JSON.stringify({
            id: cleanProdId,
            name: finalCard.name,
            nameKo: finalCard.name,
            category: "Hardware",
            categoryKo: activeSection?.title || "하드웨어 부품",
            descriptionKo: finalCard.subtitle || `${finalCard.name} 부품`,
            pageNumber: finalCard.page?.replace(/[^0-9]/g, "") || null,
            imageUrl: finalCard.image || null,
            detailImages: [],
          }),
        });
      } catch {
        // non-blocking
      }
    }

    const nextSections = sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      const nextItems = isNew
        ? [...sec.items, finalCard]
        : sec.items.map((it) => (it.id === finalCard.id ? finalCard : it));
      return { ...sec, items: nextItems };
    });

    setEditingCard(null);
    await persistSections(
      nextSections,
      isNew ? "부품 카드가 추가되었습니다." : "부품 카드가 수정되었습니다.",
    );
  };

  const handleDuplicateCard = async (card: PartCardItem) => {
    if (!activeSection) return;
    const copy: PartCardItem = {
      ...card,
      id: `pi-${Date.now()}`,
      name: `${card.name} (복사본)`,
    };
    const nextSections = sections.map((sec) => {
      if (sec.id !== activeSection.id) return sec;
      const idx = sec.items.findIndex((i) => i.id === card.id);
      const nextItems = [...sec.items];
      nextItems.splice(idx + 1, 0, copy);
      return { ...sec, items: nextItems };
    });
    await persistSections(nextSections, "카드가 복제되었습니다.");
  };

  const handleDeleteCard = async (card: PartCardItem) => {
    if (!activeSection) return;
    if (!window.confirm(`'${card.name}' 카드를 부품 인덱스에서 삭제하시겠습니까?`))
      return;
    const nextSections = sections.map((sec) =>
      sec.id === activeSection.id
        ? { ...sec, items: sec.items.filter((i) => i.id !== card.id) }
        : sec,
    );
    await persistSections(nextSections, "카드가 삭제되었습니다.");
  };

  const handleMoveCard = async (cardId: string, dir: -1 | 1) => {
    if (!activeSection) return;
    const idx = activeSection.items.findIndex((i) => i.id === cardId);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= activeSection.items.length) return;
    const nextItems = [...activeSection.items];
    // Match target's rowGroup so visual order updates predictably within/across rows
    const movedItem = {
      ...nextItems[idx],
      rowGroup: nextItems[target].rowGroup,
    };
    nextItems[idx] = nextItems[target];
    nextItems[target] = movedItem;

    const nextSections = sections.map((sec) =>
      sec.id === activeSection.id ? { ...sec, items: nextItems } : sec,
    );
    await persistSections(nextSections, "카드 순서가 변경되었습니다.");
  };

  // --- Master Product & Detail Drawings Actions ---
  const productCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoryKo) set.add(p.categoryKo);
    });
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = prodSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (prodCategoryFilter !== "all" && p.categoryKo !== prodCategoryFilter) {
        return false;
      }
      if (
        onlyWithDrawings &&
        (!Array.isArray(p.detailImages) || p.detailImages.length === 0)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.nameKo.toLowerCase().includes(q) ||
        p.categoryKo.toLowerCase().includes(q) ||
        (p.pageNumber || "").toLowerCase().includes(q)
      );
    });
  }, [products, prodSearch, prodCategoryFilter, onlyWithDrawings]);

  const handleMultiDrawingUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!editingProduct || files.length === 0) return;

    setUploadingDrawings(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const res = await uploadAdminFile(file, "products");
        onMediaUploaded(res.media);
        urls.push(res.url);
      }
      setEditingProduct((prev) =>
        prev
          ? {
              ...prev,
              product: {
                ...prev.product,
                detailImages: [...(prev.product.detailImages || []), ...urls],
              },
            }
          : null,
      );
      toast({
        title: `상세 도면 이미지 ${urls.length}장이 추가되었습니다.`,
      });
    } catch (err: any) {
      toast({
        title: "도면 업로드 실패",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploadingDrawings(false);
    }
  };

  const handleSaveProductModal = async () => {
    if (!editingProduct) return;
    const p = editingProduct.product;
    if (!p.id.trim()) {
      toast({ title: "제품 고유 ID를 입력해주세요.", variant: "destructive" });
      return;
    }
    if (!p.name.trim() && !p.nameKo.trim()) {
      toast({ title: "제품명을 입력해주세요.", variant: "destructive" });
      return;
    }

    setSavingProduct(true);
    try {
      await adminFetch("/api/admin/products", {
        method: "POST",
        body: JSON.stringify({
          ...p,
          id: p.id.trim(),
          name: p.name.trim() || p.nameKo.trim(),
          nameKo: p.nameKo.trim() || p.name.trim(),
        }),
      });
      toast({
        title: editingProduct.isNew
          ? "신규 제품 상세페이지가 등록되었습니다."
          : "제품 상세 정보 및 도면이 저장되었습니다.",
      });
      setEditingProduct(null);
      onSaved();
    } catch (err: any) {
      toast({
        title: "제품 저장 실패",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (p: CmsProduct) => {
    if (
      !window.confirm(
        `'${p.nameKo} (${p.id})' 제품 상세 데이터를 삭제하시겠습니까?`,
      )
    )
      return;
    try {
      await adminFetch(`/api/admin/products/${encodeURIComponent(p.id)}`, {
        method: "DELETE",
      });
      toast({ title: "제품이 삭제되었습니다." });
      onSaved();
    } catch (err: any) {
      toast({
        title: "삭제 실패",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // --- Sidebar Filters Save ---
  const handleSaveSidebarFilters = async () => {
    setSavingFilters(true);
    try {
      await adminFetch("/api/admin/sidebar-filters", {
        method: "PUT",
        body: JSON.stringify({ filters: filtersDraft }),
      });
      toast({ title: "좌측 카테고리 필터 메뉴가 저장되었습니다." });
      onSaved();
    } catch (err: any) {
      toast({
        title: "저장 실패",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingFilters(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Sub-navigation */}
      <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSubTab("index")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
            subTab === "index"
              ? "bg-[#FF7B00] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Layers className="w-4 h-4" />
          1. 부품 인덱스 섹션 · 카드 배치 ({sections.reduce((n, s) => n + s.items.length, 0)}개)
        </button>

        <button
          type="button"
          onClick={() => setSubTab("products")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
            subTab === "products"
              ? "bg-[#FF7B00] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Database className="w-4 h-4" />
          2. 전체 제품 상세 · 하단 도면 관리 ({products.length}개)
        </button>

        <button
          type="button"
          onClick={() => setSubTab("sidebar")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
            subTab === "sidebar"
              ? "bg-[#FF7B00] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <ListFilter className="w-4 h-4" />
          3. 좌측 사이드바 메뉴 편집
        </button>
      </div>

      {/* =========================================================
          SUB-TAB 1: PARTS INDEX SECTIONS & CARDS
         ========================================================= */}
      {subTab === "index" && (
        <div className="space-y-5">
          {/* Section Selector Pills */}
          <Card>
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">
                  부품 인덱스 섹션 목록 ({sections.length}개 섹션)
                </CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  섹션 탭을 클릭해 내부 부품 카드를 추가·수정·배치하거나, 새 카테고리 섹션을 추가할 수 있습니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/parts-index"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-[#FF7B00] px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                >
                  부품 인덱스 보기
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    setEditingSection({
                      isNew: true,
                      section: {
                        id: `sec-${Date.now()}`,
                        title: "신규 부품 섹션",
                        showHeader: true,
                        headerColor: "dark",
                        columns: 5,
                        visible: true,
                        order: sections.length,
                        items: [],
                      },
                    })
                  }
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  새 섹션 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {sections.map((sec, idx) => {
                  const isActive = sec.id === activeSection?.id;
                  return (
                    <div
                      key={sec.id}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 transition-all ${
                        isActive
                          ? "border-[#FF7B00] bg-orange-50/70 ring-1 ring-[#FF7B00]/30"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveSectionId(sec.id)}
                        className="text-left flex items-center gap-2"
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            sec.headerColor === "orange"
                              ? "bg-[#FF7B00]"
                              : sec.headerColor === "slate"
                                ? "bg-slate-600"
                                : "bg-gray-800"
                          }`}
                        />
                        <span className="text-sm font-bold text-gray-900">
                          {sec.title}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {sec.items.length}
                        </Badge>
                        {!sec.visible && (
                          <Badge variant="outline" className="text-[10px]">
                            숨김
                          </Badge>
                        )}
                      </button>

                      <div className="flex items-center pl-1 border-l border-gray-200 ml-1">
                        <button
                          type="button"
                          onClick={() => handleMoveSection(idx, -1)}
                          disabled={idx === 0 || savingSections}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                          title="섹션 위로"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSection(idx, 1)}
                          disabled={idx === sections.length - 1 || savingSections}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                          title="섹션 아래로"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingSection({ section: { ...sec }, isNew: false })
                          }
                          className="p-1 text-gray-500 hover:text-[#FF7B00]"
                          title="섹션 설정 수정"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(sec)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="섹션 삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Active Section Cards Grid */}
          {activeSection && (
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>{activeSection.title}</span>
                    <Badge variant="outline">
                      {activeSection.columns}열 그리드
                    </Badge>
                    {!activeSection.showHeader && (
                      <Badge variant="secondary">상단 헤더바 숨김 (메인영역)</Badge>
                    )}
                  </CardTitle>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-56">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <Input
                      value={cardSearch}
                      onChange={(e) => setCardSearch(e.target.value)}
                      placeholder="섹션 내 모델명 검색..."
                      className="h-9 pl-8 text-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={openNewCardModal}
                    className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    부품 카드 추가
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {filteredSectionItems.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400">
                    표시할 부품 카드가 없습니다. [+ 부품 카드 추가] 버튼을 눌러 등록해보세요.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredSectionItems.map((card) => {
                      const linkedProd = products.find(
                        (p) => p.id === card.productId,
                      );
                      const drawingCount =
                        linkedProd?.detailImages?.length || 0;

                      return (
                        <div
                          key={card.id}
                          className={`border rounded-xl overflow-hidden bg-white flex flex-col justify-between shadow-sm ${
                            card.wide ? "col-span-2" : ""
                          } ${
                            card.visible === false
                              ? "opacity-50 border-dashed border-gray-300"
                              : "border-gray-200"
                          }`}
                        >
                          <div>
                            <div
                              className={`${
                                card.wide ? "aspect-[8/3.5]" : "aspect-[4/3]"
                              } bg-[#EAEAEA] relative overflow-hidden flex items-center justify-center`}
                            >
                              {card.image ? (
                                <img
                                  src={resolveAssetUrl(card.image)}
                                  alt={card.name}
                                  loading="lazy"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs text-gray-400">
                                  이미지 없음
                                </span>
                              )}

                              <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
                                <span className="bg-black/65 text-white text-[10px] px-1.5 py-0.5 rounded">
                                  행 #{(card.rowGroup ?? 0) + 1}
                                </span>
                                {card.wide && (
                                  <span className="bg-[#FF7B00] text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">
                                    2칸 와이드
                                  </span>
                                )}
                                {drawingCount > 0 && (
                                  <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">
                                    도면 {drawingCount}p
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="p-2.5 text-center">
                              <p className="font-bold text-sm text-gray-900 truncate">
                                {card.name}
                              </p>
                              {card.subtitle && (
                                <p className="text-[11px] text-gray-500 truncate">
                                  {card.subtitle}
                                </p>
                              )}
                              <div className="flex items-center justify-center gap-2 mt-1 text-[11px]">
                                <span className="text-gray-400 font-mono">
                                  {card.productId}
                                </span>
                                {card.page && (
                                  <span className="text-[#FF7B00] font-semibold">
                                    {card.page}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="px-2 py-1.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-1">
                            <div className="flex items-center">
                              <button
                                type="button"
                                onClick={() => handleMoveCard(card.id, -1)}
                                className="p-1 text-gray-500 hover:text-gray-900"
                                title="앞으로 이동"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveCard(card.id, 1)}
                                className="p-1 text-gray-500 hover:text-gray-900"
                                title="뒤로 이동"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() =>
                                  openProductEditorById(card.productId, card)
                                }
                                className="px-1.5 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50 rounded"
                                title="클릭 시 열리는 상세페이지 제원 및 도면 편집"
                              >
                                도면/상세
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingCard({
                                    sectionId: activeSection.id,
                                    card: { ...card },
                                    isNew: false,
                                  })
                                }
                                className="p-1 text-gray-600 hover:text-[#FF7B00]"
                                title="카드 수정"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateCard(card)}
                                className="p-1 text-gray-500 hover:text-gray-900"
                                title="카드 복제"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCard(card)}
                                className="p-1 text-red-500 hover:text-red-700"
                                title="카드 삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* =========================================================
          SUB-TAB 2: ALL PRODUCTS & MULTI-PAGE DETAIL DRAWINGS
         ========================================================= */}
      {subTab === "products" && (
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">
                  전체 제품 상세페이지 · 하단 도면 관리 ({filteredProducts.length} / {products.length}개)
                </CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  AI 검색 대상이 되는 전체 제품 제원과 상세페이지 하단에 삽입될 카탈로그 도면(여러 장 가능)을 관리합니다.
                </p>
              </div>
              <Button
                type="button"
                onClick={() =>
                  setEditingProduct({
                    product: createBlankProduct(),
                    isNew: true,
                  })
                }
                className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold shrink-0"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                신규 제품 등록
              </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  placeholder="제품 ID, 모델명(SD-60, DP-40, SL-3332), 한글명, 페이지 번호 검색..."
                  className="pl-9"
                />
              </div>
              <select
                value={prodCategoryFilter}
                onChange={(e) => setProdCategoryFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="all">전체 카테고리</option>
                {productCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-xs font-medium cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={onlyWithDrawings}
                  onChange={(e) => setOnlyWithDrawings(e.target.checked)}
                  className="accent-[#FF7B00]"
                />
                상세도면 보유 제품만
              </label>
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 text-xs border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">이미지</th>
                    <th className="py-3 px-4">제품 ID</th>
                    <th className="py-3 px-4">한글명 / 모델명</th>
                    <th className="py-3 px-4">카테고리</th>
                    <th className="py-3 px-4">페이지</th>
                    <th className="py-3 px-4">하단 상세도면</th>
                    <th className="py-3 px-4 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((p) => {
                    const dCount = Array.isArray(p.detailImages)
                      ? p.detailImages.length
                      : 0;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/80">
                        <td className="py-2.5 px-4">
                          <div className="w-12 h-10 rounded bg-[#EAEAEA] border border-gray-200 overflow-hidden flex items-center justify-center">
                            {p.imageUrl ? (
                              <img
                                src={resolveAssetUrl(p.imageUrl)}
                                alt={p.nameKo}
                                loading="lazy"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <span className="text-[10px] text-gray-400">없음</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-xs text-gray-600">
                          {p.id}
                        </td>
                        <td className="py-2.5 px-4">
                          <p className="font-bold text-gray-900">{p.nameKo}</p>
                          <p className="text-xs text-gray-500">{p.name}</p>
                        </td>
                        <td className="py-2.5 px-4 text-xs text-gray-600">
                          {p.categoryKo}
                        </td>
                        <td className="py-2.5 px-4 text-xs font-medium text-[#FF7B00]">
                          {p.pageNumber ? `${p.pageNumber} p` : "-"}
                        </td>
                        <td className="py-2.5 px-4">
                          {dCount > 0 ? (
                            <Badge className="bg-blue-600 text-white text-xs">
                              도면 {dCount}페이지
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">미등록</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <a
                              href={`/product/${encodeURIComponent(p.id)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-gray-400 hover:text-[#FF7B00]"
                              title="새 창에서 상세페이지 열기"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => openProductEditorById(p.id)}
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1" />
                              수정 / 도면업로드
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteProduct(p)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* =========================================================
          SUB-TAB 3: SIDEBAR FILTERS EDITOR
         ========================================================= */}
      {subTab === "sidebar" && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">
                부품 인덱스 좌측 아코디언 메뉴 편집 ({filtersDraft.length}개 대분류)
              </CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                부품 인덱스 좌측 사이드바의 대분류 제목과 하위 바로가기 링크(예: /product/sd-60 또는 #sec-sl-rails)를 설정합니다.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setFiltersDraft((prev) => [
                    ...prev,
                    {
                      id: `sf-${Date.now()}`,
                      title: "새 카테고리",
                      expanded: false,
                      subItems: [],
                    },
                  ])
                }
              >
                <Plus className="w-4 h-4 mr-1" />
                대분류 추가
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveSidebarFilters}
                disabled={savingFilters}
                className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold"
              >
                {savingFilters ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1.5" />
                )}
                사이드바 메뉴 저장
              </Button>
            </div>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtersDraft.map((cat, catIdx) => (
              <div
                key={cat.id}
                className="border border-gray-200 rounded-xl p-4 bg-white space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={cat.title}
                    onChange={(e) => {
                      const next = [...filtersDraft];
                      next[catIdx] = { ...cat, title: e.target.value };
                      setFiltersDraft(next);
                    }}
                    className="font-bold h-9"
                    placeholder="대분류명"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 shrink-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(cat.expanded)}
                      onChange={(e) => {
                        const next = [...filtersDraft];
                        next[catIdx] = { ...cat, expanded: e.target.checked };
                        setFiltersDraft(next);
                      }}
                      className="accent-[#FF7B00]"
                    />
                    기본펼침
                  </label>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500 shrink-0"
                    onClick={() =>
                      setFiltersDraft(filtersDraft.filter((_, i) => i !== catIdx))
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 pl-2 border-l-2 border-gray-100">
                  {cat.subItems.map((sub, subIdx) => (
                    <div key={sub.id} className="flex items-center gap-2">
                      <Input
                        value={sub.label}
                        onChange={(e) => {
                          const next = [...filtersDraft];
                          const nextSubs = [...cat.subItems];
                          nextSubs[subIdx] = { ...sub, label: e.target.value };
                          next[catIdx] = { ...cat, subItems: nextSubs };
                          setFiltersDraft(next);
                        }}
                        placeholder="항목명 (예: SD-60)"
                        className="h-8 text-xs w-36 shrink-0"
                      />
                      <Input
                        value={sub.href}
                        onChange={(e) => {
                          const next = [...filtersDraft];
                          const nextSubs = [...cat.subItems];
                          nextSubs[subIdx] = { ...sub, href: e.target.value };
                          next[catIdx] = { ...cat, subItems: nextSubs };
                          setFiltersDraft(next);
                        }}
                        placeholder="/product/sd-60 또는 #sec-sl-rails"
                        className="h-8 text-xs flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...filtersDraft];
                          next[catIdx] = {
                            ...cat,
                            subItems: cat.subItems.filter((_, i) => i !== subIdx),
                          };
                          setFiltersDraft(next);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-[#FF7B00]"
                    onClick={() => {
                      const next = [...filtersDraft];
                      next[catIdx] = {
                        ...cat,
                        subItems: [
                          ...cat.subItems,
                          {
                            id: `sfi-${Date.now()}`,
                            label: "신규 항목",
                            href: "/parts-index",
                          },
                        ],
                      };
                      setFiltersDraft(next);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    하위 링크 추가
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* =========================================================
          DIALOG A: PART CARD ADD / EDIT
         ========================================================= */}
      <Dialog
        open={Boolean(editingCard)}
        onOpenChange={(o) => !o && setEditingCard(null)}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCard?.isNew ? "부품 카드 추가" : "부품 카드 수정"}
            </DialogTitle>
          </DialogHeader>
          {editingCard && (
            <div className="space-y-4 py-2">
              <datalist id="admin-parts-product-ids">
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameKo} ({p.name})
                  </option>
                ))}
              </datalist>

              <ImagePicker
                label="카드 썸네일 이미지 (GIF / PNG / JPG)"
                value={editingCard.card.image}
                onChange={(url) =>
                  setEditingCard({
                    ...editingCard,
                    card: { ...editingCard.card, image: url },
                  })
                }
                folder="products"
                mediaList={mediaList}
                onUploaded={onMediaUploaded}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    카드 표시 모델명 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={editingCard.card.name}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        card: { ...editingCard.card, name: e.target.value },
                      })
                    }
                    placeholder="예: 60kg(SD) 또는 SL-3332"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    연결 제품 상세 ID
                  </label>
                  <Input
                    list="admin-parts-product-ids"
                    value={editingCard.card.productId}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        card: { ...editingCard.card, productId: e.target.value },
                      })
                    }
                    placeholder="예: sd-60 (비워두면 자동생성)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    보조 규격 설명 (선택)
                  </label>
                  <Input
                    value={editingCard.card.subtitle || ""}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        card: { ...editingCard.card, subtitle: e.target.value },
                      })
                    }
                    placeholder="예: 상부롤러 8mm / 2구 롤러"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    카탈로그 페이지
                  </label>
                  <Input
                    value={editingCard.card.page || ""}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        card: { ...editingCard.card, page: e.target.value },
                      })
                    }
                    placeholder="예: 48 p"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 items-center pt-1">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    행(줄) 그룹 번호
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={editingCard.card.rowGroup ?? 0}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        card: {
                          ...editingCard.card,
                          rowGroup: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>

                <label className="flex items-center justify-between p-2.5 border rounded-lg cursor-pointer mt-4">
                  <span className="text-xs font-medium flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5 text-[#FF7B00]" />
                    2칸 와이드
                  </span>
                  <Switch
                    checked={Boolean(editingCard.card.wide)}
                    onCheckedChange={(v) =>
                      setEditingCard({
                        ...editingCard,
                        card: { ...editingCard.card, wide: v },
                      })
                    }
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 border rounded-lg cursor-pointer mt-4">
                  <span className="text-xs font-medium">화면 노출</span>
                  <Switch
                    checked={editingCard.card.visible !== false}
                    onCheckedChange={(v) =>
                      setEditingCard({
                        ...editingCard,
                        card: { ...editingCard.card, visible: v },
                      })
                    }
                  />
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCard(null)}>
              취소
            </Button>
            <Button
              onClick={handleSaveCardModal}
              className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold"
            >
              저장하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================
          DIALOG B: SECTION ADD / EDIT
         ========================================================= */}
      <Dialog
        open={Boolean(editingSection)}
        onOpenChange={(o) => !o && setEditingSection(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSection?.isNew ? "새 부품 섹션 추가" : "섹션 설정 수정"}
            </DialogTitle>
          </DialogHeader>
          {editingSection && (
            <div className="space-y-4 py-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  섹션 제목
                </label>
                <Input
                  value={editingSection.section.title}
                  onChange={(e) =>
                    setEditingSection({
                      ...editingSection,
                      section: {
                        ...editingSection.section,
                        title: e.target.value,
                      },
                    })
                  }
                  placeholder="예: 샤워부스 하드웨어 시리즈"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    헤더 배너 색상
                  </label>
                  <select
                    value={editingSection.section.headerColor}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        section: {
                          ...editingSection.section,
                          headerColor: e.target
                            .value as PartsSection["headerColor"],
                        },
                      })
                    }
                    className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm"
                  >
                    <option value="dark">다크 그레이 (SL레일 스타일)</option>
                    <option value="orange">코아스 오렌지 (L형가이드 스타일)</option>
                    <option value="slate">슬레이트 네이비</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    가로 열 개수 (PC 기준)
                  </label>
                  <select
                    value={editingSection.section.columns}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        section: {
                          ...editingSection.section,
                          columns: Number(e.target.value) as 4 | 5,
                        },
                      })
                    }
                    className="w-full h-10 rounded-md border border-input bg-white px-3 text-sm"
                  >
                    <option value={5}>5열 그리드</option>
                    <option value={4}>4열 그리드</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer">
                <span className="text-sm font-medium">상단 섹션 제목바 표시</span>
                <Switch
                  checked={editingSection.section.showHeader}
                  onCheckedChange={(v) =>
                    setEditingSection({
                      ...editingSection,
                      section: { ...editingSection.section, showHeader: v },
                    })
                  }
                />
              </label>

              <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer">
                <span className="text-sm font-medium">쇼핑몰 화면에 노출</span>
                <Switch
                  checked={editingSection.section.visible}
                  onCheckedChange={(v) =>
                    setEditingSection({
                      ...editingSection,
                      section: { ...editingSection.section, visible: v },
                    })
                  }
                />
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSection(null)}>
              취소
            </Button>
            <Button
              onClick={handleSaveSectionModal}
              className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold"
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================
          DIALOG C: PRODUCT DETAIL & MULTI-PAGE DRAWINGS EDITOR
         ========================================================= */}
      <Dialog
        open={Boolean(editingProduct)}
        onOpenChange={(o) => !o && setEditingProduct(null)}
      >
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct?.isNew
                ? "신규 제품 상세페이지 & 도면 등록"
                : `제품 상세 · 도면 편집 — ${editingProduct?.product.nameKo} (${editingProduct?.product.id})`}
            </DialogTitle>
          </DialogHeader>

          {editingProduct && (
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    제품 고유 ID (URL 주소) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={editingProduct.product.id}
                    disabled={!editingProduct.isNew}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        product: {
                          ...editingProduct.product,
                          id: e.target.value,
                        },
                      })
                    }
                    placeholder="예: dp-80-pro"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    한글 제품명 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={editingProduct.product.nameKo}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        product: {
                          ...editingProduct.product,
                          nameKo: e.target.value,
                        },
                      })
                    }
                    placeholder="예: 60kg 슬라이딩 도어"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    모델명 / 영문명
                  </label>
                  <Input
                    value={editingProduct.product.name}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        product: {
                          ...editingProduct.product,
                          name: e.target.value,
                        },
                      })
                    }
                    placeholder="예: 60kg(SD)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    카테고리명 (한글)
                  </label>
                  <Input
                    value={editingProduct.product.categoryKo}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        product: {
                          ...editingProduct.product,
                          categoryKo: e.target.value,
                        },
                      })
                    }
                    placeholder="예: 슬라이딩 도어 시스템"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    허용하중 / 제품중량
                  </label>
                  <Input
                    value={editingProduct.product.weightCapacity || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        product: {
                          ...editingProduct.product,
                          weightCapacity: e.target.value,
                        },
                      })
                    }
                    placeholder="예: 60kg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    카탈로그 페이지
                  </label>
                  <Input
                    value={editingProduct.product.pageNumber || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        product: {
                          ...editingProduct.product,
                          pageNumber: e.target.value,
                        },
                      })
                    }
                    placeholder="예: 48"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    제품 설명
                  </label>
                  <Textarea
                    rows={3}
                    value={editingProduct.product.descriptionKo || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        product: {
                          ...editingProduct.product,
                          descriptionKo: e.target.value,
                        },
                      })
                    }
                    placeholder="제품 특징 및 용도 설명"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    상세 사양 (규격 / 재질 / 호환 레일 등)
                  </label>
                  <Textarea
                    rows={3}
                    value={editingProduct.product.specifications || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        product: {
                          ...editingProduct.product,
                          specifications: e.target.value,
                        },
                      })
                    }
                    placeholder="예: 적용 레일 SL-2831, 도어 두께 30mm 이상"
                  />
                </div>
              </div>

              <ImagePicker
                label="대표 제품 이미지 (상세페이지 좌측 대표 사진)"
                value={editingProduct.product.imageUrl || ""}
                onChange={(url) =>
                  setEditingProduct({
                    ...editingProduct,
                    product: {
                      ...editingProduct.product,
                      imageUrl: url,
                    },
                  })
                }
                folder="products"
                mediaList={mediaList}
                onUploaded={onMediaUploaded}
              />

              {/* Multi-Page Detail Drawings Section */}
              <div className="border-t border-gray-200 pt-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#FF7B00]" />
                      하단 상세 제원 · 카탈로그 도면 이미지 (
                      {editingProduct.product.detailImages?.length || 0}페이지)
                    </h4>
                    <p className="text-xs text-gray-500">
                      60kg(SD)의 48p·49p처럼 상세페이지 하단에 순서대로 크게 보여줄 도면/카탈로그 이미지를 여러 장 등록할 수 있습니다.
                    </p>
                  </div>

                  <div>
                    <input
                      ref={drawingFileRef}
                      type="file"
                      accept="image/*,.gif"
                      multiple
                      onChange={handleMultiDrawingUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => drawingFileRef.current?.click()}
                      disabled={uploadingDrawings}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {uploadingDrawings ? (
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-1.5" />
                      )}
                      도면 이미지 여러 장 업로드
                    </Button>
                  </div>
                </div>

                <ImagePicker
                  compact
                  label="또는 보관함에서 도면 이미지 선택 추가"
                  value={drawingPickerUrl}
                  onChange={(url) => {
                    if (url) {
                      setEditingProduct((prev) =>
                        prev
                          ? {
                              ...prev,
                              product: {
                                ...prev.product,
                                detailImages: [
                                  ...(prev.product.detailImages || []),
                                  url,
                                ],
                              },
                            }
                          : null,
                      );
                      setDrawingPickerUrl("");
                    }
                  }}
                  folder="products"
                  mediaList={mediaList}
                  onUploaded={onMediaUploaded}
                />

                {editingProduct.product.detailImages?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {editingProduct.product.detailImages.map((dUrl, idx) => (
                      <div
                        key={`${dUrl}-${idx}`}
                        className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center gap-3 p-2"
                      >
                        <div className="w-20 h-20 bg-white border rounded overflow-hidden shrink-0 flex items-center justify-center">
                          <img
                            src={resolveAssetUrl(dUrl)}
                            alt={`도면 ${idx + 1}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900">
                            상세 도면 #{idx + 1} 페이지
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {dUrl}
                          </p>
                          <div className="flex items-center gap-1 mt-2">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              disabled={idx === 0}
                              onClick={() => {
                                const next = [
                                  ...editingProduct.product.detailImages,
                                ];
                                [next[idx - 1], next[idx]] = [
                                  next[idx],
                                  next[idx - 1],
                                ];
                                setEditingProduct({
                                  ...editingProduct,
                                  product: {
                                    ...editingProduct.product,
                                    detailImages: next,
                                  },
                                });
                              }}
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              disabled={
                                idx ===
                                editingProduct.product.detailImages.length - 1
                              }
                              onClick={() => {
                                const next = [
                                  ...editingProduct.product.detailImages,
                                ];
                                [next[idx], next[idx + 1]] = [
                                  next[idx + 1],
                                  next[idx],
                                ];
                                setEditingProduct({
                                  ...editingProduct,
                                  product: {
                                    ...editingProduct.product,
                                    detailImages: next,
                                  },
                                });
                              }}
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-red-500 hover:text-red-700 ml-auto"
                              onClick={() => {
                                const next =
                                  editingProduct.product.detailImages.filter(
                                    (_, i) => i !== idx,
                                  );
                                setEditingProduct({
                                  ...editingProduct,
                                  product: {
                                    ...editingProduct.product,
                                    detailImages: next,
                                  },
                                });
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              삭제
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingProduct(null)}>
              취소
            </Button>
            <Button
              onClick={handleSaveProductModal}
              disabled={savingProduct}
              className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold"
            >
              {savingProduct && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              제품 정보 및 상세도면 저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
