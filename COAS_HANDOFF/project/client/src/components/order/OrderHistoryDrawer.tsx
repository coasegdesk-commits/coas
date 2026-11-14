import React, { useState, useEffect, useMemo } from "react";
import {
  History,
  ChevronLeft,
  ChevronRight,
  Search,
  Star,
  Copy,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  Package,
  FileText,
  AlertCircle,
  X,
  ArrowRight,
  Lock,
  LogIn,
  LogOut,
  ShieldCheck,
  UserCheck,
  Layers,
  MapPin,
  FileCode2,
} from "lucide-react";
import type { OrderLineItem } from "@shared/cms-types";
import {
  type OrderHistoryRecord,
  loadOrderHistory,
  deleteOrderHistoryRecord,
  toggleOrderHistoryFavorite,
} from "@/lib/order-history";
import {
  type BuyerSession,
  getBuyerSession,
  logoutBuyerSession,
} from "@/lib/order-auth";
import { useToast } from "@/hooks/use-toast";

interface OrderHistoryDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  buyerSession?: BuyerSession;
  onOpenLoginModal?: () => void;
  onLogout?: () => void;
  onApplyFullOrder: (order: OrderHistoryRecord, mode: "replace" | "append") => void;
  onAddSelectedItems: (items: OrderLineItem[]) => void;
  onSaveCurrentAsHistory: () => void;
}

export function OrderHistoryDrawer({
  isOpen,
  onToggle,
  onClose,
  buyerSession = getBuyerSession(),
  onOpenLoginModal = () => {},
  onLogout = () => {},
  onApplyFullOrder,
  onAddSelectedItems,
  onSaveCurrentAsHistory,
}: OrderHistoryDrawerProps) {
  const { toast } = useToast();
  const [historyList, setHistoryList] = useState<OrderHistoryRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, number[]>>({});

  // Reload history whenever drawer opens
  useEffect(() => {
    if (isOpen) {
      setHistoryList(loadOrderHistory());
    }
  }, [isOpen]);

  // STRICT COMPANY ISOLATION:
  // Show ONLY orders belonging to currently logged-in company!
  const myCompanyOrders = useMemo(() => {
    if (!buyerSession.isAuthenticated || !buyerSession.companyName.trim()) {
      return [];
    }
    const myName = buyerSession.companyName.trim().toLowerCase();
    const myPhone = buyerSession.phone.replace(/[^0-9]/g, "");

    return historyList.filter((item) => {
      const matchName =
        item.companyName.toLowerCase().includes(myName) ||
        myName.includes(item.companyName.toLowerCase());
      const matchPhone =
        Boolean(myPhone) &&
        item.phone.replace(/[^0-9]/g, "") === myPhone;
      return matchName || matchPhone;
    });
  }, [historyList, buyerSession]);

  // Filtered by Search Query within My Company's Orders
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return myCompanyOrders;
    const q = searchQuery.trim().toLowerCase();
    return myCompanyOrders.filter((item) => {
      const matchOrderNum = item.orderNumber.toLowerCase().includes(q);
      const matchContact = item.contactName.toLowerCase().includes(q);
      const matchMemo = (item.memo || "").toLowerCase().includes(q);
      const matchItem = item.items.some(
        (it) =>
          it.productName.toLowerCase().includes(q) ||
          it.spec.toLowerCase().includes(q) ||
          (it.note || "").toLowerCase().includes(q),
      );
      return matchOrderNum || matchContact || matchMemo || matchItem;
    });
  }, [myCompanyOrders, searchQuery]);

  // Handle Delete
  const handleDelete = (id: string, orderNumber: string) => {
    if (!window.confirm(`[${orderNumber}] 주문 이력을 삭제하시겠습니까?`)) {
      return;
    }
    const updated = deleteOrderHistoryRecord(id);
    setHistoryList(updated);
    toast({
      title: "주문 이력이 삭제되었습니다.",
      description: orderNumber,
    });
  };

  // Handle Toggle Favorite
  const handleToggleFav = (id: string) => {
    const updated = toggleOrderHistoryFavorite(id);
    setHistoryList(updated);
  };

  // Toggle item checkbox
  const handleToggleItemCheck = (orderId: string, itemIdx: number) => {
    setSelectedItemsMap((prev) => {
      const current = prev[orderId] || [];
      const next = current.includes(itemIdx)
        ? current.filter((i) => i !== itemIdx)
        : [...current, itemIdx];
      return { ...prev, [orderId]: next };
    });
  };

  // Add only selected items
  const handleAddSelected = (order: OrderHistoryRecord) => {
    const indices = selectedItemsMap[order.id] || [];
    if (indices.length === 0) {
      toast({
        title: "선택된 품목이 없습니다.",
        description: "추가할 품목의 체크박스를 선택해 주세요.",
        variant: "destructive",
      });
      return;
    }
    const toAdd = indices.map((idx) => order.items[idx]).filter(Boolean);
    onAddSelectedItems(toAdd);
    toast({
      title: `${toAdd.length}개 품목이 발주서에 추가되었습니다.`,
      description: `[${order.companyName}] 발주 품목 추가 완료`,
    });
  };

  return (
    <>
      {/* Right Sliding Drawer */}
      <aside
        className={`fixed top-14 right-0 bottom-0 z-40 w-[450px] max-w-[92vw] bg-white border-l-2 border-[#FF7B00] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out no-print ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="우리 회사 주문 히스토리"
      >
        {/* Toggle Tab Attached to Left Edge of Drawer (Always visible on right edge of screen) */}
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-full top-1/2 -translate-y-1/2 bg-[#FF7B00] hover:bg-[#e66f00] text-white rounded-l-lg px-2 py-4 shadow-lg border border-r-0 border-orange-600 flex flex-col items-center gap-1.5 cursor-pointer transition-colors"
          title={isOpen ? "히스토리 닫기" : "우리 회사 주문 히스토리 열기"}
        >
          {isOpen ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
          <History className="w-3.5 h-3.5 mt-0.5 text-orange-200" />
          <span className="text-[11px] font-bold leading-tight [writing-mode:vertical-rl] tracking-wider">
            {isOpen ? "히스토리 닫기" : "우리 회사 주문 히스토리"}
          </span>
        </button>

        {/* 1. Drawer Header (Company Authentication Status) */}
        <div className="p-3 bg-slate-900 text-white border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md bg-[#FF7B00] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black flex items-center gap-1.5 truncate">
                <span className="truncate">
                  {buyerSession.isAuthenticated
                    ? `${buyerSession.companyName}`
                    : "거래처 간편로그인"}
                </span>
                {buyerSession.isAuthenticated && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40 shrink-0">
                    인증완료
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {buyerSession.isAuthenticated
                  ? "우리 회사 전용 과거 발주 이력 및 원클릭 재발주"
                  : "간편로그인 후 우리 회사 주문 내역 조회"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {buyerSession.isAuthenticated ? (
              <button
                type="button"
                onClick={onLogout}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
                title="로그아웃"
              >
                로그아웃
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF7B00] hover:bg-[#e66f00] text-white transition-colors cursor-pointer shadow-xs"
              >
                로그인
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* =====================================================================
            CASE A: NOT LOGGED IN -> Show Friendly B2B Login Guidance Card
           ===================================================================== */}
        {!buyerSession.isAuthenticated ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 text-[#FF7B00] flex items-center justify-center shadow-inner">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-1.5 max-w-[320px]">
              <h3 className="text-sm font-black text-slate-900">
                거래처(업체) 간편로그인이 필요합니다
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                간편로그인하시면 <strong>오직 우리 회사</strong>가 이전에 발주했던 과거 내역을 안전하게 조회하고, 원클릭으로 불러와 빠르게 수정·발주하실 수 있습니다.
              </p>
            </div>

            <div className="w-full max-w-[300px] space-y-2 pt-2">
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="w-full py-2.5 rounded-lg bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>업체 간편로그인 시작하기</span>
              </button>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[10.5px] text-slate-500 text-left space-y-1">
                <div className="font-bold text-slate-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>지원하는 3가지 간편인증:</span>
                </div>
                <p>① 사업자등록번호 + 담당자 휴대폰 인증</p>
                <p>② 카카오 / 네이버 비즈니스 1초 간편인증</p>
                <p>③ 상호 / 비밀번호 일반 로그인</p>
              </div>
            </div>
          </div>
        ) : (
          /* =====================================================================
              CASE B: LOGGED IN -> Show My Company's Order History Exclusively
             ===================================================================== */
          <>
            {/* Quick Action Bar: Save Current Order as History */}
            <div className="px-3 py-2 bg-orange-50/70 border-b border-orange-200 flex items-center justify-between gap-2 shrink-0">
              <span className="text-[10.5px] font-bold text-orange-950 flex items-center gap-1 truncate">
                <UserCheck className="w-3.5 h-3.5 text-[#FF7B00] shrink-0" />
                <span className="truncate">
                  {buyerSession.contactName || "담당자"} 님
                </span>
                <span className="text-slate-400 font-normal">|</span>
                <span className="text-slate-600 font-normal">
                  누적 {myCompanyOrders.length}건
                </span>
              </span>

              <button
                type="button"
                onClick={onSaveCurrentAsHistory}
                className="px-2 py-1 rounded bg-[#FF7B00] hover:bg-[#e66f00] text-white text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                title="현재 작성 중인 발주서 내용을 우리 회사 히스토리에 보관합니다"
              >
                <Plus className="w-3 h-3" />
                <span>현재 발주서 보관</span>
              </button>
            </div>

            {/* Search Box within My Company's Orders */}
            <div className="p-2.5 bg-white border-b border-slate-200 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="품목명, 규격, 발주번호 검색..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#FF7B00] focus:bg-white transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* History Cards List (Redesigned with Premium Layout & Merge Options) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#F8FAFC] scrollbar-thin">
              {filteredList.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <History className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    {searchQuery
                      ? "검색 조건과 일치하는 주문 내역이 없습니다."
                      : `[${buyerSession.companyName}]의 등록된 이전 발주 내역이 없습니다.`}
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-[260px] mx-auto">
                    발주서를 작성하신 후 [발주서 접수하기]를 완료하시면 자동으로 이곳에 차곡차곡 누적됩니다.
                  </p>
                </div>
              ) : (
                filteredList.map((order) => {
                  const isExpanded = expandedId === order.id;
                  const checkedIndices = selectedItemsMap[order.id] || [];

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl border border-slate-200 hover:border-orange-300 shadow-2xs hover:shadow-md transition-all overflow-hidden"
                    >
                      {/* 1. Card Top Badge Bar: Date + OrderNumber + Badges + Actions */}
                      <div className="px-3.5 pt-3 pb-2 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-800 text-[10.5px] font-black flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-600" />
                            {order.orderDate}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {order.orderNumber}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleFav(order.id)}
                            className={`p-1 rounded hover:bg-slate-100 cursor-pointer transition-colors ${
                              order.isFavorite
                                ? "text-amber-500"
                                : "text-slate-300 hover:text-amber-400"
                            }`}
                            title={order.isFavorite ? "단골 주문 해제" : "★ 단골 주문 등록"}
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                order.isFavorite ? "fill-current" : ""
                              }`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(order.id, order.orderNumber)}
                            className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                            title="이력 삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* 2. Card Body: Summary + Items Chips + Delivery & Memo */}
                      <div className="p-3.5 space-y-2">
                        {/* Title & Quantity Pill */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-black text-slate-900 truncate flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-[#FF7B00] shrink-0" />
                            <span className="truncate">
                              {order.contactName ? `${order.contactName} 발주 건` : "발주 주문 건"}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-[#FF7B00] text-[10px] font-extrabold shrink-0 shadow-2xs">
                            총 {order.itemCount}품목 · 합계 {order.totalQuantity}개
                          </span>
                        </div>

                        {/* Visual Item Chips */}
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {order.items.slice(0, 4).map((it, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-slate-100/90 text-slate-700 text-[10.5px] font-semibold flex items-center gap-1 border border-slate-200/80 truncate max-w-full"
                            >
                              <span className="truncate">{it.productName || it.spec}</span>
                              <strong className="text-slate-900 shrink-0 font-mono">
                                {it.quantity}{it.unit}
                              </strong>
                            </span>
                          ))}
                          {order.items.length > 4 && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 text-[10px] font-bold border border-slate-200">
                              +{order.items.length - 4}개
                            </span>
                          )}
                        </div>

                        {/* Delivery Address & Memo Preview Box */}
                        {(order.deliveryAddress || order.memo) && (
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-150 text-[10.5px] text-slate-600 space-y-1">
                            {order.deliveryAddress && (
                              <div className="flex items-start gap-1 truncate text-slate-700">
                                <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                                <span className="truncate font-medium">
                                  {order.deliveryAddress}
                                </span>
                              </div>
                            )}
                            {order.memo && (
                              <div className="flex items-start gap-1 text-slate-800 font-medium">
                                <FileText className="w-3 h-3 text-[#FF7B00] mt-0.5 shrink-0" />
                                <span className="line-clamp-2 leading-tight">
                                  {order.memo}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 3. Expandable Detailed Line-Items */}
                      {isExpanded && (
                        <div className="px-3.5 pb-3 pt-1 bg-slate-50/70 border-t border-slate-100 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pb-1 border-b border-slate-200">
                            <span>상세 품목 ({order.items.length}개)</span>
                            <span className="text-orange-700">체크 후 선택 추가 가능</span>
                          </div>

                          <div className="max-h-[160px] overflow-y-auto space-y-1 scrollbar-thin">
                            {order.items.map((it, idx) => {
                              const isChecked = checkedIndices.includes(idx);
                              return (
                                <label
                                  key={idx}
                                  className={`flex items-start gap-2 p-1.5 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                                    isChecked
                                      ? "bg-orange-50 border-orange-300 text-orange-950 font-semibold shadow-2xs"
                                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleItemCheck(order.id, idx)}
                                    className="mt-0.5 rounded text-[#FF7B00] focus:ring-[#FF7B00]"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-bold truncate">
                                        {it.productName}
                                      </span>
                                      <span className="text-[10.5px] text-slate-900 font-extrabold shrink-0 font-mono">
                                        {it.quantity} {it.unit}
                                      </span>
                                    </div>
                                    {(it.spec || it.color || it.note) && (
                                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                        {[it.spec, it.color, it.note]
                                          .filter(Boolean)
                                          .join(" · ")}
                                      </div>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>

                          {/* Add Selected Button */}
                          <button
                            type="button"
                            onClick={() => handleAddSelected(order)}
                            className="w-full py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3 text-[#FF7B00]" />
                            <span>선택한 {checkedIndices.length}개 품목만 발주서에 추가</span>
                          </button>
                        </div>
                      )}

                      {/* 4. Card Bottom Actions: Expand Toggle + [새로 채우기] + [➕ 이어서 합치기] */}
                      <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                        {/* Expand/Collapse details */}
                        <button
                          type="button"
                          onClick={() => setExpandedId((prev) => (prev === order.id ? null : order.id))}
                          className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-0.5 cursor-pointer rounded hover:bg-slate-200/60"
                        >
                          <span>품목 {order.items.length}건</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-slate-500" />
                          )}
                        </button>

                        {/* Dual Action Buttons: Replace VS. Merge/Append */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Option 1: Replace Entire Form */}
                          <button
                            type="button"
                            onClick={() => onApplyFullOrder(order, "replace")}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            title="현재 작성 중인 발주서를 이 주문으로 전체 새로 채웁니다"
                          >
                            <Copy className="w-3 h-3 text-slate-500" />
                            <span>새로 채우기</span>
                          </button>

                          {/* Option 2: Append & Merge (사용자가 요청하신 다른 건 합치기 기능!) */}
                          <button
                            type="button"
                            onClick={() => onApplyFullOrder(order, "append")}
                            className="px-2.5 py-1.5 rounded-lg bg-[#FF7B00] hover:bg-[#e66f00] text-white text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            title="현재 발주서의 기존 품목 아래에 이 주문 품목들을 이어서 합칩니다"
                          >
                            <Layers className="w-3 h-3" />
                            <span>➕ 이어서 합치기</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
