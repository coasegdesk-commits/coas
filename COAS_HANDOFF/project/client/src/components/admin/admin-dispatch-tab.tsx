import React, { useState, useEffect, useMemo } from "react";
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
  Truck,
  PackageCheck,
  Clock,
  CheckCircle2,
  Printer,
  Download,
  Search,
  Calendar,
  Building2,
  Phone,
  MapPin,
  FileSpreadsheet,
  AlertCircle,
  Save,
  RotateCcw,
  Boxes,
  ExternalLink,
} from "lucide-react";
import { adminFetch, downloadCsv } from "@/lib/cms";
import { useToast } from "@/hooks/use-toast";
import type {
  DailyDispatchSummary,
  OrderRecord,
  ShippingStatus,
} from "@shared/cms-types";

const CARRIER_OPTIONS = [
  "경동화물",
  "대신화물",
  "로젠택배",
  "CJ대한통운",
  "롯데택배",
  "한진택배",
  "직배송/용차",
  "방문수령",
  "기타",
];

const SHIPPING_STATUS_META: Record<
  ShippingStatus,
  { label: string; bg: string; text: string; icon: any }
> = {
  pending: {
    label: "출고대기",
    bg: "bg-amber-100 border-amber-300",
    text: "text-amber-800",
    icon: Clock,
  },
  packed: {
    label: "포장완료",
    bg: "bg-blue-100 border-blue-300",
    text: "text-blue-800",
    icon: PackageCheck,
  },
  shipped: {
    label: "배송중/출고",
    bg: "bg-orange-100 border-orange-300",
    text: "text-[#FF7B00]",
    icon: Truck,
  },
  delivered: {
    label: "배송완료",
    bg: "bg-emerald-100 border-emerald-300",
    text: "text-emerald-800",
    icon: CheckCircle2,
  },
};

export function AdminDispatchTab() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [summary, setSummary] = useState<DailyDispatchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState<
    "all" | "화물" | "택배" | "용차" | "방문수령"
  >("all");
  const [search, setSearch] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderRecord | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  // Load dispatch summary for selected date
  const loadDispatchData = async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/dispatch-daily?date=${dateStr}`);
      if (!res.ok) throw new Error("출고장 데이터 로드 실패");
      const data: DailyDispatchSummary = await res.json();
      setSummary(data);
    } catch (err: any) {
      toast({
        title: "출고장 불러오기 오류",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDispatchData(selectedDate);
  }, [selectedDate]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (!summary?.orders) return [];
    return summary.orders.filter((order) => {
      const matchMethod =
        methodFilter === "all" ||
        (order.shippingMethod || "화물") === methodFilter;
      const hay = [
        order.orderNumber,
        order.companyName,
        order.contactName,
        order.phone,
        order.deliveryAddress,
        order.trackingNumber,
      ]
        .join(" ")
        .toLowerCase();
      const matchSearch = !search || hay.includes(search.toLowerCase());
      return matchMethod && matchSearch;
    });
  }, [summary, methodFilter, search]);

  // Update single order shipping status/tracking
  const handleUpdateShipping = async (
    orderId: string,
    patch: {
      shippingStatus?: ShippingStatus;
      shippingCarrier?: string;
      trackingNumber?: string;
      adminMemo?: string;
    },
  ) => {
    try {
      const res = await adminFetch(`/api/admin/orders/${orderId}/shipping`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("배송 정보 업데이트 실패");
      toast({
        title: "배송 정보 저장 완료",
        description: "출고 상태 및 송장번호가 성공적으로 반영되었습니다.",
      });
      void loadDispatchData(selectedDate);
      setEditingOrder(null);
    } catch (err: any) {
      toast({
        title: "저장 실패",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Batch status update
  const handleBatchStatus = async (status: ShippingStatus) => {
    if (selectedOrders.length === 0) {
      toast({
        title: "선택된 발주 건이 없습니다.",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await adminFetch(`/api/admin/orders/batch-shipping`, {
        method: "POST",
        body: JSON.stringify({
          orderIds: selectedOrders,
          shippingStatus: status,
        }),
      });
      if (!res.ok) throw new Error("일괄 변경 실패");
      toast({
        title: "일괄 변경 완료",
        description: `선택하신 ${selectedOrders.length}건이 [${SHIPPING_STATUS_META[status].label}] 상태로 변경되었습니다.`,
      });
      setSelectedOrders([]);
      void loadDispatchData(selectedDate);
    } catch (err: any) {
      toast({
        title: "일괄 처리 실패",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Download CSV
  const handleDownloadCsv = () => {
    if (!summary?.orders || summary.orders.length === 0) return;
    const headers = [
      "출고일자",
      "발주번호",
      "거래처명",
      "담당자",
      "연락처",
      "배송방법",
      "운송사",
      "송장번호",
      "배송상태",
      "도착지주소",
      "품목수",
      "총금액",
      "특이사항",
    ];
    const rows = summary.orders.map((o) => [
      selectedDate,
      o.orderNumber,
      o.companyName,
      o.contactName,
      o.phone,
      o.shippingMethod || "화물",
      o.shippingCarrier || "",
      o.trackingNumber || "",
      SHIPPING_STATUS_META[o.shippingStatus || "pending"].label,
      o.deliveryAddress,
      o.items.length,
      o.totalAmount ? `${o.totalAmount.toLocaleString()}원` : "0원",
      o.memo || "",
    ]);
    downloadCsv(`COAS_일일출고장_${selectedDate}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar: Date Selector & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-[#FF7B00] flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              일일 출고장 및 배송 관리
              <Badge className="bg-orange-100 text-[#FF7B00] border-orange-200 text-xs">
                {selectedDate}
              </Badge>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              화물·택배·용차 출고를 관리하고, 송장번호 입력 및 A4 출고전표를 인쇄합니다.
            </p>
          </div>
        </div>

        {/* Date Selector & Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Quick Date Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().slice(0, 10));
              }}
              className="px-2.5 py-1 rounded hover:bg-white transition-colors cursor-pointer text-slate-600"
            >
              어제
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                selectedDate === new Date().toISOString().slice(0, 10)
                  ? "bg-white text-[#FF7B00] font-bold shadow-xs"
                  : "hover:bg-white text-slate-600"
              }`}
            >
              오늘
            </button>
          </div>

          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 px-3 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7B00] bg-white text-slate-800"
            />
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => setPrintModalOpen(true)}
            disabled={!summary || summary.totalOrders === 0}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-[#FF7B00]" />
            <span>A4 출고장 인쇄</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleDownloadCsv}
            disabled={!summary || summary.totalOrders === 0}
            className="border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs h-9 gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>엑셀</span>
          </Button>
        </div>
      </div>

      {/* 2. Key Metrics: Status & Delivery Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="border border-slate-200 shadow-xs bg-white">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">당일 출고 건</span>
              <Truck className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">
                {summary?.totalOrders ?? 0}
              </span>
              <span className="text-xs text-slate-400 font-bold">건</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span>화물 {summary?.byMethod.freight ?? 0}</span>
              <span>·</span>
              <span>택배 {summary?.byMethod.courier ?? 0}</span>
              <span>·</span>
              <span>용차 {summary?.byMethod.direct ?? 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-amber-200/80 shadow-xs bg-amber-50/50">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700">출고 대기</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-900">
                {summary?.pendingOrders ?? 0}
              </span>
              <span className="text-xs text-amber-600 font-bold">건</span>
            </div>
            <p className="text-[11px] text-amber-700 mt-1 truncate">피킹 및 포장 준비</p>
          </CardContent>
        </Card>

        <Card className="border border-blue-200/80 shadow-xs bg-blue-50/50">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700">포장 완료</span>
              <PackageCheck className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-blue-900">
                {summary?.packedOrders ?? 0}
              </span>
              <span className="text-xs text-blue-600 font-bold">건</span>
            </div>
            <p className="text-[11px] text-blue-700 mt-1 truncate">송장발행/기사 인계</p>
          </CardContent>
        </Card>

        <Card className="border border-orange-200/80 shadow-xs bg-orange-50/50">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#FF7B00]">배송중/출고</span>
              <Truck className="w-4 h-4 text-[#FF7B00]" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">
                {summary?.shippedOrders ?? 0}
              </span>
              <span className="text-xs text-slate-500 font-bold">건</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 truncate">기사님 인계 완료</p>
          </CardContent>
        </Card>

        <Card className="border border-emerald-200/80 shadow-xs bg-emerald-50/50">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700">배송 완료</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-900">
                {summary?.deliveredOrders ?? 0}
              </span>
              <span className="text-xs text-emerald-600 font-bold">건</span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1 truncate">거래처 수령 확인</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Aggregated Warehouse Picking List (창고 총 출고 피킹 요약) */}
      {summary?.pickingList && summary.pickingList.length > 0 && (
        <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50/70 to-amber-50/40 shadow-xs">
          <CardHeader className="py-3 px-4 border-b border-orange-200/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#FF7B00]" />
                <CardTitle className="text-xs font-black text-slate-900">
                  {selectedDate} 창고 총 출고 피킹 리스트 (품목별 총 수량 합산 집계)
                </CardTitle>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">
                총 {summary.pickingList.length}개 품목 준비 요망
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-3.5">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {summary.pickingList.map((item, idx) => (
                <div
                  key={`${item.productName}-${idx}`}
                  className="bg-white p-2.5 rounded-lg border border-orange-200 shadow-xs flex flex-col justify-between"
                >
                  <span className="text-xs font-bold text-slate-800 line-clamp-1" title={item.productName}>
                    {item.productName}
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                      {item.spec}
                    </span>
                    <span className="text-sm font-black text-[#FF7B00]">
                      {item.totalQuantity} <span className="text-xs font-semibold text-slate-600">{item.unit}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Order List & Batch Processing Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
          {/* Method Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            {(
              [
                { id: "all", label: "전체" },
                { id: "화물", label: "화물(경동/대신)" },
                { id: "택배", label: "택배(로젠/CJ)" },
                { id: "용차", label: "직배송/용차" },
                { id: "방문수령", label: "방문수령" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMethodFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  methodFilter === tab.id
                    ? "bg-[#FF7B00] text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Batch Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="거래처명, 발주번호, 주소 검색"
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7B00] bg-white"
              />
            </div>

            {selectedOrders.length > 0 && (
              <div className="flex items-center gap-1 shrink-0 animate-in fade-in">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleBatchStatus("packed")}
                  className="h-8 text-xs font-bold bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                >
                  포장완료({selectedOrders.length})
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleBatchStatus("shipped")}
                  className="h-8 text-xs font-bold bg-[#FF7B00] hover:bg-[#e66f00] text-white shadow-xs"
                >
                  출고완료({selectedOrders.length})
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 font-extrabold uppercase border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredOrders.length > 0 &&
                      selectedOrders.length === filteredOrders.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrders(filteredOrders.map((o) => o.id));
                      } else {
                        setSelectedOrders([]);
                      }
                    }}
                    className="rounded text-[#FF7B00] focus:ring-[#FF7B00]"
                  />
                </th>
                <th className="p-3">발주번호 / 접수</th>
                <th className="p-3">거래처 / 담당자</th>
                <th className="p-3">납품 현장 주소</th>
                <th className="p-3">배송수단 / 운송사</th>
                <th className="p-3">송장번호</th>
                <th className="p-3 text-center">출고상태</th>
                <th className="p-3 text-right">총 발주액</th>
                <th className="p-3 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <Truck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    선택하신 날짜({selectedDate})의 출고 건이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusInfo =
                    SHIPPING_STATUS_META[order.shippingStatus || "pending"];
                  const StatusIcon = statusInfo.icon;
                  const isChecked = selectedOrders.includes(order.id);

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? "bg-orange-50/40" : ""
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrders((prev) => [...prev, order.id]);
                            } else {
                              setSelectedOrders((prev) =>
                                prev.filter((id) => id !== order.id),
                              );
                            }
                          }}
                          className="rounded text-[#FF7B00] focus:ring-[#FF7B00]"
                        />
                      </td>

                      {/* Order Number */}
                      <td className="p-3">
                        <span className="font-mono font-bold text-slate-900 block">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10.5px] text-slate-400">
                          {order.createdAt.slice(11, 16)} 접수
                        </span>
                      </td>

                      {/* Company & Contact */}
                      <td className="p-3">
                        <span className="font-extrabold text-slate-900 block truncate max-w-[150px]">
                          {order.companyName}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {order.contactName} ({order.phone})
                        </span>
                      </td>

                      {/* Address */}
                      <td className="p-3 max-w-[220px]">
                        <p className="truncate text-slate-700" title={order.deliveryAddress}>
                          {order.deliveryAddress || "(현장 주소 미입력)"}
                        </p>
                        {order.memo && (
                          <p className="text-[10px] text-orange-600 truncate mt-0.5">
                            요청: {order.memo}
                          </p>
                        )}
                      </td>

                      {/* Shipping Method & Carrier */}
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block">
                          {order.shippingMethod || "화물"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {order.shippingCarrier || "운송사 미지정"}
                        </span>
                      </td>

                      {/* Tracking Number Input (Inline or click to edit) */}
                      <td className="p-3">
                        {order.trackingNumber ? (
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200 block truncate max-w-[130px]">
                            {order.trackingNumber}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingOrder(order)}
                            className="text-[11px] text-slate-400 hover:text-[#FF7B00] font-semibold underline decoration-dashed cursor-pointer"
                          >
                            + 송장입력
                          </button>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${statusInfo.bg} ${statusInfo.text}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="p-3 text-right font-extrabold text-slate-900">
                        {order.totalAmount
                          ? `₩${order.totalAmount.toLocaleString()}`
                          : "-"}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingOrder(order)}
                          className="h-7 text-xs font-bold border-slate-300 hover:bg-slate-100 px-2.5"
                        >
                          배송설정
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal: Edit Single Order Shipping & Tracking */}
      {editingOrder && (
        <Dialog open={true} onOpenChange={() => setEditingOrder(null)}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#FF7B00]" />
                배송 정보 및 송장번호 수정
              </DialogTitle>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const carrier = (form.elements.namedItem("carrier") as HTMLSelectElement).value;
                const tracking = (form.elements.namedItem("tracking") as HTMLInputElement).value;
                const status = (form.elements.namedItem("status") as HTMLSelectElement).value as ShippingStatus;
                const memo = (form.elements.namedItem("adminMemo") as HTMLInputElement).value;

                handleUpdateShipping(editingOrder.id, {
                  shippingCarrier: carrier,
                  trackingNumber: tracking,
                  shippingStatus: status,
                  adminMemo: memo,
                });
              }}
              className="space-y-4 pt-2"
            >
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">발주번호</span>
                  <span className="font-mono font-bold text-slate-900">{editingOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">거래처명</span>
                  <span className="font-extrabold text-slate-900">{editingOrder.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">배송지</span>
                  <span className="text-slate-700 truncate max-w-[230px]">{editingOrder.deliveryAddress}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  운송사 선택
                </label>
                <select
                  name="carrier"
                  defaultValue={editingOrder.shippingCarrier || "경동화물"}
                  className="w-full h-10 px-3 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF7B00] bg-white"
                >
                  {CARRIER_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  송장번호 / 화물접수번호
                </label>
                <Input
                  name="tracking"
                  defaultValue={editingOrder.trackingNumber || ""}
                  placeholder="예: KD-9821-4820 또는 9482-1049-2810"
                  className="h-10 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  출고 및 배송 상태
                </label>
                <select
                  name="status"
                  defaultValue={editingOrder.shippingStatus || "pending"}
                  className="w-full h-10 px-3 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF7B00] bg-white"
                >
                  <option value="pending">출고대기 (피킹/패킹 대기)</option>
                  <option value="packed">포장완료 (패킹 완료/송장발행)</option>
                  <option value="shipped">배송중/출고 (기사님 전달 완료)</option>
                  <option value="delivered">배송완료 (거래처 수령 확인)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  관리자 메모
                </label>
                <Input
                  name="adminMemo"
                  defaultValue={editingOrder.adminMemo || ""}
                  placeholder="예: 2차분 3박스 분할 출고"
                  className="h-10 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingOrder(null)}
                  className="text-xs font-bold"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="bg-[#FF7B00] hover:bg-[#e66f00] text-white text-xs font-bold"
                >
                  저장하기
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* 6. Modal: Printable A4 Daily Dispatch Sheet (인쇄 최적화 일일 출고장) */}
      <Dialog open={printModalOpen} onOpenChange={setPrintModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-8 rounded-2xl">
          <div id="printable-dispatch-sheet" className="space-y-6 text-slate-900">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <span className="text-2xl font-black tracking-tight text-slate-900 block">
                  일 일 출 고 장 (DISPATCH SHEET)
                </span>
                <span className="text-xs text-slate-500 font-semibold mt-1 block">
                  E-COAS 물류출고센터 · 인테리어 하드웨어 유통
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-500 block">출고 기준일자</span>
                <span className="text-base font-black text-[#FF7B00] block">{selectedDate}</span>
                <span className="text-xs text-slate-500 mt-1 block">
                  총 {summary?.totalOrders ?? 0}건 (화물 {summary?.byMethod.freight} / 택배 {summary?.byMethod.courier})
                </span>
              </div>
            </div>

            {/* Warehouse Aggregate Picking Block */}
            {summary?.pickingList && (
              <div className="border border-slate-300 rounded-lg p-3.5 bg-slate-50">
                <span className="text-xs font-extrabold text-slate-800 block mb-2">
                  ■ 당일 총 출고 피킹 집계표 (창고 반출용)
                </span>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {summary.pickingList.map((it, idx) => (
                    <div key={idx} className="flex justify-between border-b border-slate-200 pb-1">
                      <span className="text-slate-700 font-semibold truncate mr-2">{it.productName}</span>
                      <span className="font-mono font-black text-slate-900">{it.totalQuantity} {it.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itemized Orders Table */}
            <div>
              <span className="text-xs font-extrabold text-slate-800 block mb-2">
                ■ 거래처별 출고 상세 내역
              </span>
              <table className="w-full text-left text-xs border border-slate-300 divide-y divide-slate-200">
                <thead className="bg-slate-100 font-bold text-slate-700 text-[11px]">
                  <tr>
                    <th className="p-2 border-r border-slate-300 text-center w-8">No</th>
                    <th className="p-2 border-r border-slate-300 w-28">발주번호</th>
                    <th className="p-2 border-r border-slate-300 w-32">거래처 / 연락처</th>
                    <th className="p-2 border-r border-slate-300">납품지 주소</th>
                    <th className="p-2 border-r border-slate-300 w-24">배송수단/운송사</th>
                    <th className="p-2 border-r border-slate-300 w-28">송장번호</th>
                    <th className="p-2 text-center w-16">확인란</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {summary?.orders.map((o, idx) => (
                    <tr key={o.id}>
                      <td className="p-2 border-r border-slate-300 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="p-2 border-r border-slate-300 font-mono font-bold">
                        {o.orderNumber}
                      </td>
                      <td className="p-2 border-r border-slate-300">
                        <span className="font-bold text-slate-900 block">{o.companyName}</span>
                        <span className="text-[10px] text-slate-500">{o.contactName} ({o.phone})</span>
                      </td>
                      <td className="p-2 border-r border-slate-300">
                        <p className="text-xs leading-tight">{o.deliveryAddress}</p>
                        {o.memo && <p className="text-[10px] text-orange-600 mt-0.5">요청: {o.memo}</p>}
                      </td>
                      <td className="p-2 border-r border-slate-300">
                        <span className="font-bold block">{o.shippingMethod}</span>
                        <span className="text-[10px] text-slate-500">{o.shippingCarrier || "-"}</span>
                      </td>
                      <td className="p-2 border-r border-slate-300 font-mono text-[11px]">
                        {o.trackingNumber || "(미기재)"}
                      </td>
                      <td className="p-2 text-center">
                        <div className="w-5 h-5 border border-slate-400 rounded mx-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Signature Box */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-300 text-xs">
              <div className="border border-slate-300 p-3 rounded-lg text-slate-600">
                <span className="font-bold block mb-1">물류/출고 담당자 확인</span>
                <span>출고 검수자: _______________ (인)</span>
              </div>
              <div className="border border-slate-300 p-3 rounded-lg text-slate-600">
                <span className="font-bold block mb-1">운송 기사님 인수 확인</span>
                <span>화물/택배 인수자: _______________ (인)</span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPrintModalOpen(false)}
            >
              닫기
            </Button>
            <Button
              type="button"
              onClick={() => window.print()}
              className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold gap-1.5"
            >
              <Printer className="w-4 h-4" />
              지금 인쇄하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
