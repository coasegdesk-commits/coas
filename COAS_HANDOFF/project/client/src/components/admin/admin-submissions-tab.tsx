import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { adminFetch, downloadCsv, resolveAssetUrl } from "@/lib/cms";
import type {
  CatalogRequestRecord,
  InquiryRecord,
  OrderRecord,
  SubmissionStatus,
} from "@shared/cms-types";
import {
  ClipboardList,
  MessageSquare,
  BookOpen,
  Download,
  Search,
  Paperclip,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface AdminSubmissionsTabProps {
  orders: OrderRecord[];
  inquiries: InquiryRecord[];
  catalogRequests: CatalogRequestRecord[];
  learnedOrderIds?: string[];
  onSaved: () => void;
}

const STATUS_META: Record<
  SubmissionStatus,
  { label: string; badgeClass: string }
> = {
  new: {
    label: "신규접수",
    badgeClass: "bg-red-500 text-white",
  },
  in_progress: {
    label: "확인중",
    badgeClass: "bg-amber-500 text-white",
  },
  completed: {
    label: "처리완료",
    badgeClass: "bg-emerald-600 text-white",
  },
};

function formatDate(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminSubmissionsTab({
  orders,
  inquiries,
  catalogRequests,
  learnedOrderIds = [],
  onSaved,
}: AdminSubmissionsTabProps) {
  const { toast } = useToast();
  const learnedOrderSet = useMemo(
    () => new Set(learnedOrderIds),
    [learnedOrderIds],
  );
  const [subTab, setSubTab] = useState<
    "orders" | "inquiries" | "catalogRequests"
  >("orders");
  const [statusFilter, setStatusFilter] = useState<"all" | SubmissionStatus>(
    "all",
  );
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRecord | null>(
    null,
  );
  const [selectedCatalog, setSelectedCatalog] =
    useState<CatalogRequestRecord | null>(null);

  const [memoDraft, setMemoDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<SubmissionStatus>("new");

  const newOrderCount = orders.filter((o) => o.status === "new").length;
  const newInquiryCount = inquiries.filter((i) => i.status === "new").length;
  const newCatalogCount = catalogRequests.filter(
    (c) => c.status === "new",
  ).length;

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.companyName.toLowerCase().includes(q) ||
        o.contactName.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        o.items.some((it) => it.productName.toLowerCase().includes(q))
      );
    });
  }, [orders, statusFilter, search]);

  const filteredInquiries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inquiries.filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        i.company.toLowerCase().includes(q) ||
        i.phone.toLowerCase().includes(q) ||
        i.subject.toLowerCase().includes(q) ||
        i.message.toLowerCase().includes(q)
      );
    });
  }, [inquiries, statusFilter, search]);

  const filteredCatalogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalogRequests.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    });
  }, [catalogRequests, statusFilter, search]);

  const handleUpdateSubmission = async (
    type: "orders" | "inquiries" | "catalogRequests",
    id: string,
  ) => {
    setSaving(true);
    try {
      const res = await adminFetch<{
        success: boolean;
        affinityLearned?: boolean;
        affinityUnlearned?: boolean;
        learnedPairsCount?: number;
      }>(`/api/admin/submissions/${type}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: statusDraft,
          adminMemo: memoDraft,
        }),
      });
      if (res?.affinityLearned) {
        toast({
          title: "출고확정(처리완료) 저장 및 자동학습 반영 완료",
          description:
            res.learnedPairsCount && res.learnedPairsCount > 0
              ? `롤러+부속 조합 ${res.learnedPairsCount}건이 '출고확정 발주 자동학습' 분류에 반영되었습니다.`
              : "출고확정 상태로 저장되었습니다. (단독 품목 발주건은 학습 조합 없음)",
        });
      } else if (res?.affinityUnlearned) {
        toast({
          title: "처리 상태 변경 및 출고학습 차감 완료",
          description:
            "처리완료가 해제되어 기존 자동학습 집계에서 안전하게 제외되었습니다.",
        });
      } else {
        toast({ title: "처리 상태 및 관리자 메모가 저장되었습니다." });
      }
      setSelectedOrder(null);
      setSelectedInquiry(null);
      setSelectedCatalog(null);
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

  const handleDeleteSubmission = async (
    type: "orders" | "inquiries" | "catalogRequests",
    id: string,
  ) => {
    if (!window.confirm("이 접수 내역을 영구 삭제하시겠습니까?")) return;
    setSaving(true);
    try {
      await adminFetch(`/api/admin/submissions/${type}/${id}`, {
        method: "DELETE",
      });
      toast({ title: "내역이 삭제되었습니다." });
      setSelectedOrder(null);
      setSelectedInquiry(null);
      setSelectedCatalog(null);
      onSaved();
    } catch (err: any) {
      toast({
        title: "삭제 실패",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = () => {
    const today = new Date().toISOString().slice(0, 10);
    if (subTab === "orders") {
      downloadCsv(
        `코아스_발주서내역_${today}.csv`,
        [
          "접수번호",
          "접수일시",
          "처리상태",
          "발주업체명",
          "담당자",
          "연락처",
          "이메일",
          "희망납기일",
          "납품주소",
          "발주품목요약",
          "첨부파일수",
          "고객요청사항",
          "관리자메모",
        ],
        filteredOrders.map((o) => [
          o.orderNumber,
          formatDate(o.createdAt),
          STATUS_META[o.status]?.label || o.status,
          o.companyName,
          o.contactName,
          o.phone,
          o.email,
          o.desiredDate,
          o.deliveryAddress,
          o.items
            .map(
              (it) =>
                `${it.productName}${it.spec ? `(${it.spec})` : ""} x ${it.quantity}`,
            )
            .join(" / "),
          o.attachments.length,
          o.memo,
          o.adminMemo,
        ]),
      );
    } else if (subTab === "inquiries") {
      downloadCsv(
        `코아스_온라인문의내역_${today}.csv`,
        [
          "접수일시",
          "처리상태",
          "담당자명",
          "업체명",
          "연락처",
          "이메일",
          "문의제목",
          "문의내용",
          "관리자메모",
        ],
        filteredInquiries.map((i) => [
          formatDate(i.createdAt),
          STATUS_META[i.status]?.label || i.status,
          i.name,
          i.company,
          i.phone,
          i.email,
          i.subject,
          i.message,
          i.adminMemo,
        ]),
      );
    } else {
      downloadCsv(
        `코아스_카탈로그신청내역_${today}.csv`,
        [
          "접수일시",
          "처리상태",
          "구분",
          "성함/담당자",
          "업체명",
          "연락처",
          "이메일",
          "요청메시지",
          "관리자메모",
        ],
        filteredCatalogs.map((c) => [
          formatDate(c.createdAt),
          STATUS_META[c.status]?.label || c.status,
          c.catalogType,
          c.name,
          c.company,
          c.phone,
          c.email,
          c.message,
          c.adminMemo,
        ]),
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSubTab("orders")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
            subTab === "orders"
              ? "bg-[#FF7B00] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          발주서 접수 내역 ({orders.length})
          {newOrderCount > 0 && (
            <span className="bg-red-600 text-white text-[11px] px-2 py-0.5 rounded-full">
              신규 {newOrderCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubTab("inquiries")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
            subTab === "inquiries"
              ? "bg-[#FF7B00] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          온라인 문의 내역 ({inquiries.length})
          {newInquiryCount > 0 && (
            <span className="bg-red-600 text-white text-[11px] px-2 py-0.5 rounded-full">
              신규 {newInquiryCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubTab("catalogRequests")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
            subTab === "catalogRequests"
              ? "bg-[#FF7B00] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          카탈로그 신청 · 다운로드 ({catalogRequests.length})
          {newCatalogCount > 0 && (
            <span className="bg-red-600 text-white text-[11px] px-2 py-0.5 rounded-full">
              신규 {newCatalogCount}
            </span>
          )}
        </button>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="업체명, 담당자, 연락처, 품목명 검색..."
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 rounded-md border border-input bg-white px-3 text-sm"
            >
              <option value="all">전체 상태</option>
              <option value="new">신규접수</option>
              <option value="in_progress">확인중</option>
              <option value="completed">처리완료</option>
            </select>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleExportCsv}
            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold shrink-0"
          >
            <Download className="w-4 h-4 mr-1.5" />
            엑셀(CSV) 다운로드
          </Button>
        </CardHeader>

        <CardContent>
          {/* ORDERS TABLE */}
          {subTab === "orders" && (
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 text-xs border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">상태</th>
                    <th className="py-3 px-4">발주번호 / 일시</th>
                    <th className="py-3 px-4">발주업체 / 담당자</th>
                    <th className="py-3 px-4">연락처</th>
                    <th className="py-3 px-4">품목 / 첨부</th>
                    <th className="py-3 px-4">희망납기</th>
                    <th className="py-3 px-4 text-right">상세보기</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-gray-400"
                      >
                        접수된 발주서 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr
                        key={ord.id}
                        onClick={() => {
                          setSelectedOrder(ord);
                          setStatusDraft(ord.status);
                          setMemoDraft(ord.adminMemo || "");
                        }}
                        className="hover:bg-orange-50/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex flex-col items-start gap-1">
                            <Badge className={STATUS_META[ord.status].badgeClass}>
                              {STATUS_META[ord.status].label}
                            </Badge>
                            {learnedOrderSet.has(ord.id) && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                ✓ 출고학습 반영됨
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-mono font-bold text-xs text-gray-900">
                            {ord.orderNumber}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(ord.createdAt)}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900">
                            {ord.companyName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {ord.contactName}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-gray-700">
                          {ord.phone}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-xs text-gray-800 truncate max-w-[220px]">
                            {ord.items.length > 0
                              ? `${ord.items[0].productName}${
                                  ord.items.length > 1
                                    ? ` 외 ${ord.items.length - 1}건`
                                    : ""
                                }`
                              : "첨부파일 참조"}
                          </p>
                          {ord.attachments.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                              <Paperclip className="w-3 h-3" />
                              첨부 {ord.attachments.length}개
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600">
                          {ord.desiredDate || "-"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button size="sm" variant="outline" className="h-8 text-xs">
                            상세 / 처리
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* INQUIRIES TABLE */}
          {subTab === "inquiries" && (
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 text-xs border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">상태</th>
                    <th className="py-3 px-4">접수일시</th>
                    <th className="py-3 px-4">성함 / 업체명</th>
                    <th className="py-3 px-4">연락처 / 이메일</th>
                    <th className="py-3 px-4">제목 / 내용</th>
                    <th className="py-3 px-4 text-right">상세보기</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInquiries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-gray-400"
                      >
                        접수된 온라인 문의 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredInquiries.map((inq) => (
                      <tr
                        key={inq.id}
                        onClick={() => {
                          setSelectedInquiry(inq);
                          setStatusDraft(inq.status);
                          setMemoDraft(inq.adminMemo || "");
                        }}
                        className="hover:bg-orange-50/40 cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <Badge className={STATUS_META[inq.status].badgeClass}>
                            {STATUS_META[inq.status].label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500">
                          {formatDate(inq.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900">{inq.name}</p>
                          {inq.company && (
                            <p className="text-xs text-gray-500">{inq.company}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-700">
                          <p>{inq.phone || "-"}</p>
                          <p className="text-gray-400">{inq.email}</p>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-medium text-gray-900 truncate">
                            {inq.subject}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {inq.message}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button size="sm" variant="outline" className="h-8 text-xs">
                            상세 / 처리
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* CATALOG REQUESTS TABLE */}
          {subTab === "catalogRequests" && (
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 text-xs border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">상태</th>
                    <th className="py-3 px-4">접수일시</th>
                    <th className="py-3 px-4">구분</th>
                    <th className="py-3 px-4">담당자 / 업체명</th>
                    <th className="py-3 px-4">연락처 / 이메일</th>
                    <th className="py-3 px-4">요청 메시지</th>
                    <th className="py-3 px-4 text-right">상세보기</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCatalogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-gray-400"
                      >
                        접수된 카탈로그 신청 및 다운로드 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredCatalogs.map((cat) => (
                      <tr
                        key={cat.id}
                        onClick={() => {
                          setSelectedCatalog(cat);
                          setStatusDraft(cat.status);
                          setMemoDraft(cat.adminMemo || "");
                        }}
                        className="hover:bg-orange-50/40 cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <Badge className={STATUS_META[cat.status].badgeClass}>
                            {STATUS_META[cat.status].label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500">
                          {formatDate(cat.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">
                            {cat.catalogType}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900">{cat.name}</p>
                          <p className="text-xs text-gray-500">
                            {cat.company || "-"}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-700">
                          <p>{cat.phone || "-"}</p>
                          <p className="text-gray-400">{cat.email || "-"}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600 max-w-xs truncate">
                          {cat.message || "-"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button size="sm" variant="outline" className="h-8 text-xs">
                            상세 / 처리
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ORDER DETAIL MODAL */}
      <Dialog
        open={Boolean(selectedOrder)}
        onOpenChange={(o) => !o && setSelectedOrder(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>발주서 상세 내역</span>
              <span className="font-mono text-sm text-[#FF7B00]">
                ({selectedOrder?.orderNumber})
              </span>
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-5 py-2 text-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <span className="text-xs text-gray-500 block">발주 업체명</span>
                  <span className="font-bold text-gray-900">
                    {selectedOrder.companyName}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">담당자</span>
                  <span className="font-semibold text-gray-900">
                    {selectedOrder.contactName}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">연락처</span>
                  <a
                    href={`tel:${selectedOrder.phone}`}
                    className="font-bold text-[#FF7B00] hover:underline"
                  >
                    {selectedOrder.phone}
                  </a>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">이메일</span>
                  <span>{selectedOrder.email || "-"}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">희망 납기일</span>
                  <span>{selectedOrder.desiredDate || "-"}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">접수일시</span>
                  <span>{formatDate(selectedOrder.createdAt)}</span>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-xs text-gray-500 block">
                    납품 받을 주소 / 현장명
                  </span>
                  <span>{selectedOrder.deliveryAddress || "-"}</span>
                </div>
              </div>

              {/* Line Items */}
              {selectedOrder.items.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">
                    발주 품목 내역 ({selectedOrder.items.length}건)
                  </h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100 text-gray-600">
                        <tr>
                          <th className="py-2 px-3 text-left">#</th>
                          <th className="py-2 px-3 text-left">품목 / 모델명</th>
                          <th className="py-2 px-3 text-left">규격 / 길이</th>
                          <th className="py-2 px-3 text-left">색상 / 재질</th>
                          <th className="py-2 px-3 text-center">단위</th>
                          <th className="py-2 px-3 text-right">수량</th>
                          <th className="py-2 px-3 text-left">비고</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedOrder.items.map((it, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 text-gray-400">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 font-bold text-gray-900">
                              {it.productName}
                            </td>
                            <td className="py-2 px-3">{it.spec || "-"}</td>
                            <td className="py-2 px-3">{it.color || "-"}</td>
                            <td className="py-2 px-3 text-center">
                              {it.unit || "SET"}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-[#FF7B00]">
                              {it.quantity}
                            </td>
                            <td className="py-2 px-3 text-gray-500">
                              {it.note || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedOrder.attachments.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">
                    첨부파일 ({selectedOrder.attachments.length}개)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={resolveAssetUrl(att.url)}
                        download={att.name}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>{att.name}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.memo && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">고객 요청사항</h4>
                  <div className="p-3 rounded-lg bg-gray-50 border text-gray-700 whitespace-pre-line">
                    {selectedOrder.memo}
                  </div>
                </div>
              )}

              {/* Admin Status & Memo */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-700 mr-2">
                    처리 상태 변경:
                  </span>
                  {(
                    [
                      { id: "new", label: "신규접수", icon: AlertCircle },
                      { id: "in_progress", label: "확인중", icon: Clock },
                      { id: "completed", label: "처리완료", icon: CheckCircle2 },
                    ] as const
                  ).map((st) => {
                    const Icon = st.icon;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setStatusDraft(st.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          statusDraft === st.id
                            ? "border-[#FF7B00] bg-[#FF7B00] text-white"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {st.label}
                      </button>
                    );
                  })}
                </div>

                <div
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    statusDraft === "completed"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  {learnedOrderSet.has(selectedOrder.id) ? (
                    <span className="font-semibold">
                      ✓ 현재 이 발주서는 출고확정(처리완료) 자동학습 데이터에 반영되어 있습니다.
                      {statusDraft !== "completed" &&
                        " 상태를 변경해 저장하면 자동학습 집계에서 즉시 차감됩니다."}
                    </span>
                  ) : statusDraft === "completed" ? (
                    <span className="font-semibold">
                      ✓ [상태 및 메모 저장]을 누르면 발주 품목의 메인 롤러+부속 조합이
                      &lsquo;출고확정 발주 자동학습&rsquo; 분류(관리자 지정 추천과 별도 분류)에 자동 학습됩니다.
                    </span>
                  ) : (
                    <span>
                      * 신규접수·확인중 상태에서는 추천 순위에 반영되지 않으며, 관리자가{" "}
                      <strong className="text-emerald-700">처리완료(출고확정)</strong>로 저장한 발주건만 별도 분류로 자동 학습됩니다.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    관리자 내부 처리 메모 (고객에게 노출되지 않음)
                  </label>
                  <Textarea
                    rows={2}
                    value={memoDraft}
                    onChange={(e) => setMemoDraft(e.target.value)}
                    placeholder="예: 11/13 오전 출고 안내 완료, 세금계산서 발행 예정"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-red-500 hover:text-red-700"
              onClick={() =>
                selectedOrder &&
                handleDeleteSubmission("orders", selectedOrder.id)
              }
            >
              <Trash2 className="w-4 h-4 mr-1" />
              내역 삭제
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                닫기
              </Button>
              <Button
                onClick={() =>
                  selectedOrder &&
                  handleUpdateSubmission("orders", selectedOrder.id)
                }
                disabled={saving}
                className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                상태 및 메모 저장
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* INQUIRY / CATALOG SHARED DETAIL MODAL */}
      <Dialog
        open={Boolean(selectedInquiry || selectedCatalog)}
        onOpenChange={(o) => {
          if (!o) {
            setSelectedInquiry(null);
            setSelectedCatalog(null);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {selectedInquiry ? "온라인 문의 상세" : "카탈로그 신청 / 다운로드 상세"}
            </DialogTitle>
          </DialogHeader>

          {(selectedInquiry || selectedCatalog) && (
            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border">
                <div>
                  <span className="text-xs text-gray-500 block">성함 / 담당자</span>
                  <span className="font-bold">
                    {selectedInquiry?.name || selectedCatalog?.name}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">업체명</span>
                  <span>
                    {selectedInquiry?.company || selectedCatalog?.company || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">연락처</span>
                  <span className="font-bold text-[#FF7B00]">
                    {selectedInquiry?.phone || selectedCatalog?.phone || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">이메일</span>
                  <span>
                    {selectedInquiry?.email || selectedCatalog?.email || "-"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-gray-500 block">접수일시</span>
                  <span>
                    {formatDate(
                      selectedInquiry?.createdAt ||
                        selectedCatalog?.createdAt ||
                        "",
                    )}
                  </span>
                </div>
              </div>

              {selectedInquiry && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">
                    {selectedInquiry.subject}
                  </h4>
                  <div className="p-3 bg-gray-50 border rounded-lg whitespace-pre-line text-gray-700">
                    {selectedInquiry.message}
                  </div>
                </div>
              )}

              {selectedCatalog && (
                <div>
                  <span className="text-xs text-gray-500 block mb-1">
                    신청 구분: {selectedCatalog.catalogType}
                  </span>
                  {selectedCatalog.message && (
                    <div className="p-3 bg-gray-50 border rounded-lg whitespace-pre-line text-gray-700">
                      {selectedCatalog.message}
                    </div>
                  )}
                </div>
              )}

              <div className="border-t pt-4 space-y-3">
                <div className="flex gap-2">
                  {(["new", "in_progress", "completed"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusDraft(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                        statusDraft === st
                          ? "border-[#FF7B00] bg-[#FF7B00] text-white"
                          : "border-gray-200 bg-white text-gray-600"
                      }`}
                    >
                      {STATUS_META[st].label}
                    </button>
                  ))}
                </div>
                <Textarea
                  rows={2}
                  value={memoDraft}
                  onChange={(e) => setMemoDraft(e.target.value)}
                  placeholder="관리자 처리 메모 입력..."
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-red-500"
              onClick={() => {
                if (selectedInquiry) {
                  handleDeleteSubmission("inquiries", selectedInquiry.id);
                } else if (selectedCatalog) {
                  handleDeleteSubmission("catalogRequests", selectedCatalog.id);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              삭제
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedInquiry(null);
                  setSelectedCatalog(null);
                }}
              >
                닫기
              </Button>
              <Button
                disabled={saving}
                onClick={() => {
                  if (selectedInquiry) {
                    handleUpdateSubmission("inquiries", selectedInquiry.id);
                  } else if (selectedCatalog) {
                    handleUpdateSubmission(
                      "catalogRequests",
                      selectedCatalog.id,
                    );
                  }
                }}
                className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold"
              >
                저장
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
