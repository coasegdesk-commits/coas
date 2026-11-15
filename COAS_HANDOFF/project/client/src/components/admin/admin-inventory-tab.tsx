import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Package,
  PackageSearch,
  PackageCheck,
  AlertTriangle,
  AlertOctagon,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  History,
  Download,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  Coins,
  MapPin,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { adminFetch, downloadCsv } from "@/lib/cms";
import { useToast } from "@/hooks/use-toast";
import type { InventoryItem, InventorySummary, StockAdjustmentLog } from "@shared/cms-types";

const CATEGORY_LIST = [
  "전체",
  "슬라이딩 시스템",
  "댐퍼/클로징",
  "원바디 시스템",
  "유리 하드웨어",
  "레일/부속",
];

const STATUS_FILTERS = [
  { id: "all", label: "전체 상태" },
  { id: "low_stock", label: "⚠️ 안전재고 미달 (발주요망)" },
  { id: "out_of_stock", label: "🛑 품절 (0개)" },
  { id: "in_stock", label: "✅ 정상 재고" },
];

export function AdminInventoryTab() {
  const { toast } = useToast();

  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Modals
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<"inbound" | "outbound" | "adjustment">("inbound");
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustOperator, setAdjustOperator] = useState("물류담당자");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // Edit / Create Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<InventoryItem> | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // History Modal
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/inventory");
      if (!res.ok) throw new Error("재고 데이터를 불러오지 못했습니다.");
      const data: InventorySummary = await res.json();
      setSummary(data);
      setItems(data.items || []);
    } catch (err: any) {
      toast({
        title: "재고 데이터 로드 오류",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Quick adjust (+5 / -5)
  const handleQuickAdjust = async (item: InventoryItem, delta: number) => {
    try {
      const type = delta > 0 ? "inbound" : "outbound";
      const res = await adminFetch(`/api/admin/inventory/${item.id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          quantity: Math.abs(delta),
          reason: delta > 0 ? "간편 빠른 입고 (+5)" : "간편 빠른 출고 (-5)",
          operator: "현장관리자",
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "재고 조정 실패");
      }

      toast({
        title: "재고 수량 반영 완료",
        description: `${item.productName} 수량이 ${delta > 0 ? `+${delta}` : delta} 변경되었습니다.`,
      });
      fetchInventory();
    } catch (err: any) {
      toast({
        title: "조정 오류",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Submit Stock Adjustment Dialog
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem) return;
    if (adjustQty <= 0 && adjustType !== "adjustment") {
      toast({
        title: "수량 확인",
        description: "1개 이상의 수량을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setAdjustSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/inventory/${adjustItem.id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: adjustType,
          quantity: Number(adjustQty),
          reason: adjustReason.trim() || (adjustType === "inbound" ? "정기 입고" : adjustType === "outbound" ? "출고" : "실사 재고조정"),
          operator: adjustOperator.trim() || "관리자",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "재고 조정 처리 실패");
      }

      toast({
        title: "재고 조정 완료",
        description: `${adjustItem.productName}의 재고가 성공적으로 업데이트되었습니다.`,
      });
      setAdjustItem(null);
      fetchInventory();
    } catch (err: any) {
      toast({
        title: "오류",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setAdjustSubmitting(false);
    }
  };

  // Save (Create or Update) Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.productName) {
      toast({
        title: "입력 오류",
        description: "제품명을 반드시 입력해야 합니다.",
        variant: "destructive",
      });
      return;
    }

    setEditSubmitting(true);
    try {
      const isEdit = Boolean(editingItem.id);
      const url = isEdit ? `/api/admin/inventory/${editingItem.id}` : "/api/admin/inventory";
      const method = isEdit ? "PATCH" : "POST";

      const res = await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "저장 실패");
      }

      toast({
        title: isEdit ? "품목 정보 수정 완료" : "신규 품목 등록 완료",
        description: `${editingItem.productName} 정보가 안전하게 저장되었습니다.`,
      });
      setEditOpen(false);
      setEditingItem(null);
      fetchInventory();
    } catch (err: any) {
      toast({
        title: "저장 실패",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (item: InventoryItem) => {
    if (!confirm(`'${item.productName}' 품목을 재고 관리 목록에서 삭제하시겠습니까?\n이력 데이터도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      const res = await adminFetch(`/api/admin/inventory/${item.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "삭제 실패");
      }

      toast({
        title: "품목 삭제 완료",
        description: `${item.productName} 품목이 삭제되었습니다.`,
      });
      fetchInventory();
    } catch (err: any) {
      toast({
        title: "삭제 실패",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    if (!items.length) {
      toast({ title: "다운로드 불가", description: "다운로드할 재고 품목이 없습니다." });
      return;
    }

    const headers = [
      "관리코드(SKU)",
      "제품명",
      "카테고리",
      "규격사양",
      "단위",
      "현재고",
      "안전재고",
      "입고예정",
      "출고대기",
      "상태",
      "창고위치",
      "매입원가(원)",
      "판매단가(원)",
      "재고평가액(원)",
      "최근변경일시",
    ];

    const rows = filteredItems.map((i) => [
      i.sku,
      i.productName,
      i.category,
      i.spec,
      i.unit,
      i.currentStock,
      i.safetyStock,
      i.incomingStock,
      i.outgoingStock,
      i.status === "in_stock" ? "정상" : i.status === "low_stock" ? "안전재고미달(경고)" : "품절",
      i.warehouseLocation,
      i.unitCost,
      i.sellingPrice,
      i.currentStock * i.unitCost,
      i.lastStockUpdated ? new Date(i.lastStockUpdated).toLocaleString("ko-KR") : "-",
    ]);

    const todayStr = new Date().toISOString().slice(0, 10);
    downloadCsv(`COAS_실시간재고현황표_${todayStr}.csv`, headers, rows);
    toast({
      title: "재고 현황표 다운로드 완료",
      description: `총 ${filteredItems.length}건의 재고 품목 데이터가 CSV로 추출되었습니다.`,
    });
  };

  // Filtered Items
  const filteredItems = items.filter((item) => {
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = item.productName.toLowerCase().includes(q);
      const matchSku = item.sku.toLowerCase().includes(q);
      const matchSpec = (item.spec || "").toLowerCase().includes(q);
      const matchLoc = (item.warehouseLocation || "").toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchSpec && !matchLoc) return false;
    }

    // Category
    if (selectedCategory !== "전체" && item.category !== selectedCategory) {
      return false;
    }

    // Status
    if (selectedStatus !== "all" && item.status !== selectedStatus) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <PackageSearch className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold tracking-tight">재고 관리 · 물류 현황</h2>
            <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30 text-xs font-semibold">
              실시간 창고 동기화
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            코아스 슬라이딩 하드웨어 전 제품의 현재고, 안전재고 모니터링, 입출고 전표 처리 및 창고 랙 위치를 통합 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInventory}
            disabled={loading}
            className="gap-1.5 text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="gap-1.5 text-xs font-medium border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <Download className="w-3.5 h-3.5" />
            재고현황 엑셀(CSV)
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingItem({
                productName: "",
                sku: `COAS-${Date.now().toString().slice(-4)}`,
                category: "슬라이딩 시스템",
                spec: "",
                unit: "SET",
                currentStock: 50,
                safetyStock: 20,
                incomingStock: 0,
                outgoingStock: 0,
                unitCost: 15000,
                sellingPrice: 25000,
                warehouseLocation: "A동 1열",
              });
              setEditOpen(true);
            }}
            className="gap-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            신규 품목 등록
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Items */}
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">총 관리 품목</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight">
              {summary ? summary.totalItems.toLocaleString() : "-"}
              <span className="text-xs font-normal text-muted-foreground ml-1">SKU</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-blue-600 font-medium">정상 가동:</span> {summary?.inStockCount || 0}개 품목
            </p>
          </CardContent>
        </Card>

        {/* Normal in-stock */}
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">정상 재고 품목</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-emerald-600">
              {summary ? summary.inStockCount.toLocaleString() : "-"}
              <span className="text-xs font-normal text-muted-foreground ml-1">품목</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              안전재고 기준 이상 확보 유지
            </p>
          </CardContent>
        </Card>

        {/* Low Stock Warning */}
        <Card className={`border shadow-xs ${summary && summary.lowStockCount > 0 ? "border-amber-400 bg-amber-50/20 dark:bg-amber-950/10" : "border-border/80"}`}>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400">안전재고 미달 (발주 필요)</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-amber-600">
              {summary ? summary.lowStockCount.toLocaleString() : "-"}
              <span className="text-xs font-normal text-muted-foreground ml-1">품목 위험</span>
            </div>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400 mt-1">
              품절 대비 긴급 생산·입고 요망
            </p>
          </CardContent>
        </Card>

        {/* Total Asset Valuation */}
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">총 재고 자산 평가액</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-orange-600">
              ₩{summary ? (summary.totalAssetValuation / 10000).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "-"}
              <span className="text-xs font-normal text-muted-foreground ml-1">만원</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              실물 원가 기준 총 {summary?.totalAssetValuation.toLocaleString()}원
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 border border-border/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {CATEGORY_LIST.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-orange-500 text-white shadow-xs"
                    : "bg-muted/70 hover:bg-muted text-muted-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search & Status Filter */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Status select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 text-xs rounded-md border border-input bg-background px-3 py-1 focus:ring-1 focus:ring-orange-500"
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>

            {/* Keyword Search */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="제품명, SKU, 창고위치..."
                className="pl-8 text-xs h-9"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Inventory Table */}
      <Card className="border border-border/80 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border/80 flex items-center justify-between bg-muted/20">
          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span>재고 품목 리스트</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
              총 {filteredItems.length}건
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">
            ※ [+5] / [-5] 클릭 시 빠른 현장 수량 가감이 즉시 반영됩니다.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-medium">
                <th className="py-2.5 px-3">상태</th>
                <th className="py-2.5 px-3">관리코드(SKU)</th>
                <th className="py-2.5 px-3">제품명 / 규격</th>
                <th className="py-2.5 px-3">분류</th>
                <th className="py-2.5 px-3">창고 적치</th>
                <th className="py-2.5 px-3 text-right">현재고</th>
                <th className="py-2.5 px-3 text-right">안전재고</th>
                <th className="py-2.5 px-3 text-right">매입원가</th>
                <th className="py-2.5 px-3 text-right">평가액</th>
                <th className="py-2.5 px-3 text-center">빠른 수량조정</th>
                <th className="py-2.5 px-3 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-500" />
                    재고 현황 데이터를 불러오는 중입니다...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-muted-foreground">
                    조건에 해당하는 재고 품목이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isOutOfStock = item.status === "out_of_stock";
                  const isLowStock = item.status === "low_stock";
                  const assetVal = item.currentStock * (item.unitCost || 0);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        isOutOfStock
                          ? "bg-red-50/20 dark:bg-red-950/10"
                          : isLowStock
                          ? "bg-amber-50/20 dark:bg-amber-950/10"
                          : ""
                      }`}
                    >
                      {/* Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isOutOfStock ? (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            품절
                          </Badge>
                        ) : isLowStock ? (
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-1.5 py-0">
                            부족 (위험)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-50/30 text-[10px] px-1.5 py-0">
                            정상
                          </Badge>
                        )}
                      </td>

                      {/* SKU */}
                      <td className="py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap">
                        {item.sku}
                      </td>

                      {/* Name / Spec */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          <span>{item.productName}</span>
                          <span className="text-[11px] font-normal text-muted-foreground">({item.unit})</span>
                        </div>
                        {item.spec && (
                          <div className="text-[11px] text-muted-foreground truncate max-w-xs" title={item.spec}>
                            {item.spec}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                        {item.category}
                      </td>

                      {/* Warehouse Location */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-muted text-[11px] font-mono font-medium">
                          <MapPin className="w-3 h-3 text-orange-500" />
                          {item.warehouseLocation || "미지정"}
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span
                          className={`font-bold text-sm ${
                            isOutOfStock
                              ? "text-red-600"
                              : isLowStock
                              ? "text-amber-600"
                              : "text-foreground"
                          }`}
                        >
                          {item.currentStock.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-0.5">{item.unit}</span>

                        {/* Incoming/Outgoing badge if any */}
                        {(item.incomingStock > 0 || item.outgoingStock > 0) && (
                          <div className="text-[10px] text-muted-foreground flex justify-end gap-1 mt-0.5">
                            {item.incomingStock > 0 && (
                              <span className="text-blue-600">+{item.incomingStock}입고예정</span>
                            )}
                            {item.outgoingStock > 0 && (
                              <span className="text-purple-600">-{item.outgoingStock}출고대기</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Safety Stock */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap text-muted-foreground">
                        {item.safetyStock.toLocaleString()} {item.unit}
                      </td>

                      {/* Unit Cost */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap text-muted-foreground">
                        ₩{item.unitCost ? item.unitCost.toLocaleString() : 0}
                      </td>

                      {/* Asset Valuation */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-medium text-foreground">
                        ₩{assetVal.toLocaleString()}
                      </td>

                      {/* Quick Adjust Buttons */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-1.5 text-[10px] font-mono text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            onClick={() => handleQuickAdjust(item, 5)}
                            title="빠른 입고 +5"
                          >
                            +5
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-1.5 text-[10px] font-mono text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            onClick={() => handleQuickAdjust(item, -5)}
                            disabled={item.currentStock <= 0}
                            title="빠른 출고 -5"
                          >
                            -5
                          </Button>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2 gap-1 bg-orange-50/50 hover:bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800"
                            onClick={() => {
                              setAdjustItem(item);
                              setAdjustType("inbound");
                              setAdjustQty(10);
                              setAdjustReason("정기 입고");
                            }}
                          >
                            <SlidersHorizontal className="w-3 h-3" />
                            입출고/조정
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => setHistoryItem(item)}
                            title="입출고 이력 보기"
                          >
                            <History className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setEditingItem({ ...item });
                              setEditOpen(true);
                            }}
                            title="품목 정보 수정"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteItem(item)}
                            title="품목 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal 1: Stock Adjustment / Inbound / Outbound */}
      <Dialog open={Boolean(adjustItem)} onOpenChange={(open) => !open && setAdjustItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-orange-500" />
              <span>재고 변동 전표 처리</span>
            </DialogTitle>
          </DialogHeader>

          {adjustItem && (
            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{adjustItem.productName}</span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {adjustItem.sku}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-muted-foreground text-[11px] pt-1 border-t border-border/50">
                  <span>현재 실재고: <b className="text-foreground">{adjustItem.currentStock} {adjustItem.unit}</b></span>
                  <span>안전재고: {adjustItem.safetyStock} {adjustItem.unit}</span>
                  <span>적치: {adjustItem.warehouseLocation}</span>
                </div>
              </div>

              {/* Adjust Type Selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType("inbound")}
                  className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                    adjustType === "inbound"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-background text-muted-foreground border-input hover:bg-muted"
                  }`}
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  입고 (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType("outbound")}
                  className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                    adjustType === "outbound"
                      ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                      : "bg-background text-muted-foreground border-input hover:bg-muted"
                  }`}
                >
                  <ArrowUpFromLine className="w-3.5 h-3.5" />
                  출고 (-)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType("adjustment")}
                  className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                    adjustType === "adjustment"
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-background text-muted-foreground border-input hover:bg-muted"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  실사 조정
                </button>
              </div>

              {/* Quantity Input */}
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">
                  {adjustType === "inbound"
                    ? "입고 수량 (+)"
                    : adjustType === "outbound"
                    ? "출고 / 폐기 수량 (-)"
                    : "실제 확인된 총 실재고 수량"}
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Number(e.target.value))}
                    className="text-sm font-bold pl-3 pr-12"
                    placeholder="수량 입력"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    {adjustItem.unit}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground flex justify-between pt-0.5">
                  <span>변동 후 예상 재고:</span>
                  <span className="font-bold text-orange-600">
                    {adjustType === "inbound"
                      ? adjustItem.currentStock + Number(adjustQty)
                      : adjustType === "outbound"
                      ? Math.max(0, adjustItem.currentStock - Number(adjustQty))
                      : Number(adjustQty)}{" "}
                    {adjustItem.unit}
                  </span>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">변동 사유 / 적요</label>
                <Input
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="예: 공장 생산분 입고, 긴급 출고, 실사 수량 불일치 조정"
                  className="text-xs"
                />
                <div className="flex gap-1 flex-wrap mt-1">
                  {[
                    adjustType === "inbound" ? "정기 생산분 입고" : adjustType === "outbound" ? "현장 긴급 출고" : "월말 정기 실사",
                    adjustType === "inbound" ? "협력사 납품 입고" : adjustType === "outbound" ? "불량/파손 폐기" : "수량 카운트 보정",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAdjustReason(preset)}
                      className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Operator */}
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">담당자</label>
                <Input
                  value={adjustOperator}
                  onChange={(e) => setAdjustOperator(e.target.value)}
                  placeholder="담당자명 (예: 물류팀장)"
                  className="text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setAdjustItem(null)}>
                  취소
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={adjustSubmitting}
                  className={`text-white font-medium ${
                    adjustType === "inbound"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : adjustType === "outbound"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {adjustSubmitting ? "반영 중..." : "변동 전표 저장"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 2: Create / Edit Inventory Item */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              <span>{editingItem?.id ? "재고 품목 정보 수정" : "신규 재고 품목 등록"}</span>
            </DialogTitle>
          </DialogHeader>

          {editingItem && (
            <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">제품명 *</label>
                  <Input
                    value={editingItem.productName || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, productName: e.target.value })}
                    placeholder="예: 60kg(SD)"
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">관리코드 (SKU)</label>
                  <Input
                    value={editingItem.sku || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value })}
                    placeholder="예: COAS-SD-060"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">카테고리</label>
                  <select
                    value={editingItem.category || "슬라이딩 시스템"}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full h-9 text-xs rounded-md border border-input bg-background px-3 focus:ring-1 focus:ring-orange-500"
                  >
                    {CATEGORY_LIST.filter((c) => c !== "전체").map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">관리 단위</label>
                  <Input
                    value={editingItem.unit || "SET"}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    placeholder="SET, EA, 本 등"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">규격 및 사양 설명</label>
                <Input
                  value={editingItem.spec || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, spec: e.target.value })}
                  placeholder="예: 목문용 상부 롤러 세트 (도어중량 60kg 이하 대응)"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">현재 실재고 수량</label>
                  <Input
                    type="number"
                    min="0"
                    value={editingItem.currentStock ?? 0}
                    onChange={(e) => setEditingItem({ ...editingItem, currentStock: Number(e.target.value) })}
                    className="text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-amber-700 dark:text-amber-400">안전재고 (경고 기준값)</label>
                  <Input
                    type="number"
                    min="0"
                    value={editingItem.safetyStock ?? 10}
                    onChange={(e) => setEditingItem({ ...editingItem, safetyStock: Number(e.target.value) })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">매입 원가 (원)</label>
                  <Input
                    type="number"
                    min="0"
                    value={editingItem.unitCost ?? 0}
                    onChange={(e) => setEditingItem({ ...editingItem, unitCost: Number(e.target.value) })}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-foreground">공급 판매단가 (원)</label>
                  <Input
                    type="number"
                    min="0"
                    value={editingItem.sellingPrice ?? 0}
                    onChange={(e) => setEditingItem({ ...editingItem, sellingPrice: Number(e.target.value) })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">창고 랙 적치 위치</label>
                <Input
                  value={editingItem.warehouseLocation || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, warehouseLocation: e.target.value })}
                  placeholder="예: A동 1열-03, B동 2열-08"
                  className="text-xs font-mono"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(false)}>
                  취소
                </Button>
                <Button type="submit" size="sm" disabled={editSubmitting} className="bg-orange-500 hover:bg-orange-600 text-white">
                  {editSubmitting ? "저장 중..." : "품목 저장"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 3: History Modal */}
      <Dialog open={Boolean(historyItem)} onOpenChange={(open) => !open && setHistoryItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-orange-500" />
              <span>{historyItem?.productName} — 입출고 변동 이력</span>
            </DialogTitle>
          </DialogHeader>

          {historyItem && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-muted/40 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">{historyItem.productName}</div>
                  <div className="text-[11px] text-muted-foreground">{historyItem.spec}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-foreground">
                    현재고 {historyItem.currentStock} {historyItem.unit}
                  </div>
                  <div className="text-[11px] text-muted-foreground">적치: {historyItem.warehouseLocation}</div>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto border border-border/80 rounded-md">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-muted/60 sticky top-0">
                    <tr className="border-b border-border/60 text-muted-foreground">
                      <th className="py-2 px-3">일시</th>
                      <th className="py-2 px-3">구분</th>
                      <th className="py-2 px-3 text-right">변동수량</th>
                      <th className="py-2 px-3 text-right">변경 후</th>
                      <th className="py-2 px-3">변동 사유</th>
                      <th className="py-2 px-3">담당자</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {!historyItem.history || historyItem.history.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          기록된 입출고 이력이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      historyItem.history.map((log) => {
                        const isInbound = log.type === "inbound";
                        const isOutbound = log.type === "outbound";

                        return (
                          <tr key={log.id} className="hover:bg-muted/30">
                            <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString("ko-KR", {
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              {isInbound ? (
                                <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">입고</Badge>
                              ) : isOutbound ? (
                                <Badge className="bg-rose-600 text-white text-[10px] px-1.5 py-0">출고</Badge>
                              ) : (
                                <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0">실사조정</Badge>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-bold whitespace-nowrap">
                              <span className={log.quantity > 0 ? "text-emerald-600" : "text-rose-600"}>
                                {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-medium text-foreground whitespace-nowrap">
                              {log.newStock} {historyItem.unit}
                            </td>
                            <td className="py-2 px-3 text-foreground">{log.reason || "-"}</td>
                            <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">{log.operator}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setHistoryItem(null)}>
                  닫기
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
