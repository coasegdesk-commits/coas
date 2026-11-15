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
  TrendingUp,
  BarChart3,
  DollarSign,
  ShoppingCart,
  Users,
  Building2,
  Calendar,
  Download,
  Printer,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  Percent,
  FileText,
  Clock,
  CheckCircle2,
  Truck,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { adminFetch, downloadCsv } from "@/lib/cms";
import { useToast } from "@/hooks/use-toast";
import type {
  AccountRevenueRecord,
  RevenueKpiSummary,
  OrderRecord,
} from "@shared/cms-types";

const PIE_COLORS = ["#FF7B00", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#64748B"];

export function AdminRevenueStatsTab() {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<"kpi" | "accounts">("kpi");
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly" | "all">("monthly");
  const [kpiData, setKpiData] = useState<RevenueKpiSummary | null>(null);
  const [accounts, setAccounts] = useState<AccountRevenueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountSearch, setAccountSearch] = useState("");
  const [statementAccount, setStatementAccount] = useState<AccountRevenueRecord | null>(null);

  // Fetch KPI Stats
  const loadKpiStats = async (p: string) => {
    try {
      const res = await adminFetch(`/api/admin/revenue-stats?period=${p}`);
      if (!res.ok) throw new Error("통계 데이터 로드 실패");
      const data: RevenueKpiSummary = await res.json();
      setKpiData(data);
    } catch (err: any) {
      toast({
        title: "통계 불러오기 오류",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Fetch Account Revenue
  const loadAccountRevenue = async () => {
    try {
      const res = await adminFetch(`/api/admin/account-revenue`);
      if (!res.ok) throw new Error("거래처 매출 로드 실패");
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (err: any) {
      toast({
        title: "거래처 매출 불러오기 오류",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadKpiStats(period), loadAccountRevenue()]).finally(() => {
      setLoading(false);
    });
  }, [period]);

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const hay = [acc.companyName, acc.contactName, acc.phone, acc.deliveryAddress]
        .join(" ")
        .toLowerCase();
      return !accountSearch || hay.includes(accountSearch.toLowerCase());
    });
  }, [accounts, accountSearch]);

  // CSV download for accounts
  const handleDownloadAccountsCsv = () => {
    if (accounts.length === 0) return;
    const headers = [
      "순위",
      "거래처명",
      "대표자담당",
      "연락처",
      "납품기본주소",
      "총발주건수",
      "총누적매출",
      "평균객단가",
      "미출고건수",
      "최근발주일자",
      "주요주문품목",
    ];
    const rows = accounts.map((acc, idx) => [
      idx + 1,
      acc.companyName,
      acc.contactName,
      acc.phone,
      acc.deliveryAddress,
      acc.totalOrders,
      `${acc.totalRevenue.toLocaleString()}원`,
      `${acc.averageOrderValue.toLocaleString()}원`,
      acc.pendingCount,
      acc.lastOrderDate.slice(0, 10),
      acc.topProducts.join(", "),
    ]);
    downloadCsv(
      `COAS_거래처별_매출현황_${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows,
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar & Sub-tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-[#FF7B00] flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              매출 통계 및 거래처 경영 분석
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              일별·주별·월별·년별 매출 추이와 거래처별 매출 기여도 및 월말 거래명세서를 조회합니다.
            </p>
          </div>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab("kpi")}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === "kpi"
                ? "bg-white text-slate-900 shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#FF7B00]" />
            <span>경영 실적 대시보드 (CEO)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("accounts")}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === "accounts"
                ? "bg-white text-slate-900 shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-[#FF7B00]" />
            <span>거래처별 매출 현황</span>
          </button>
        </div>
      </div>

      {/* ==================== SUB-TAB 1: CEO KPI DASHBOARD ==================== */}
      {activeSubTab === "kpi" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Period Filter Buttons */}
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#FF7B00]" />
              집계 기간 선택:
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
              {(
                [
                  { id: "daily", label: "일별 (최근)" },
                  { id: "weekly", label: "주별" },
                  { id: "monthly", label: "월별 (추천)" },
                  { id: "yearly", label: "년별" },
                  { id: "all", label: "전체 누적" },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    period === p.id
                      ? "bg-white text-[#FF7B00] font-black shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Executive KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">총 발주 매출액</span>
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF7B00] flex items-center justify-center font-bold">
                    ₩
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {kpiData ? `₩${kpiData.totalRevenue.toLocaleString()}` : "0원"}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>전기 대비 +{kpiData?.revenueGrowthRate ?? 14.2}% 성장</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Orders */}
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">총 발주 접수 건수</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {kpiData ? kpiData.totalOrders.toLocaleString() : 0}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">건</span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>전기 대비 +{kpiData?.orderGrowthRate ?? 8.5}% 증가</span>
                </div>
              </CardContent>
            </Card>

            {/* Average Order Value (AOV) */}
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">건당 평균 객단가 (AOV)</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {kpiData ? `₩${kpiData.averageOrderValue.toLocaleString()}` : "0원"}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">도매 하드웨어 대량 번들 기준</p>
              </CardContent>
            </Card>

            {/* Shipment Fulfilment Rate */}
            <Card className="border border-slate-200 bg-white shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">출고 및 배송 완료율</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {kpiData?.shippedRate ?? 0}%
                  </span>
                </div>
                <div className="mt-2 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#FF7B00] h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, kpiData?.shippedRate ?? 0)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Section 1: Revenue & Orders Dual Trend Chart */}
          <Card className="border border-slate-200 shadow-xs bg-white">
            <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black text-slate-900">
                  기간별 매출액 및 발주 건수 트렌드
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  막대(Bar): 발주 총 매출액(원) · 선(Line): 발주 건수
                </p>
              </div>
              <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-bold">
                {period === "daily" ? "일별 추세" : period === "weekly" ? "주별 추세" : "월별 추세"}
              </Badge>
            </CardHeader>
            <CardContent className="p-4 pt-6">
              <div className="h-72 w-full">
                {kpiData?.trend && kpiData.trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kpiData.trend} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="label" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis
                        yAxisId="left"
                        stroke="#FF7B00"
                        fontSize={11}
                        tickFormatter={(v) => `${Math.round(v / 10000)}만`}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#3B82F6"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(v) => `${v}건`}
                      />
                      <Tooltip
                        formatter={(val: any, name: string) => [
                          name === "매출액" ? `₩${Number(val).toLocaleString()}원` : `${val}건`,
                          name,
                        ]}
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderRadius: "10px",
                          border: "none",
                          color: "#FFF",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                      <Bar
                        yAxisId="left"
                        dataKey="revenue"
                        name="매출액"
                        fill="#FF7B00"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="orderCount"
                        name="발주건수"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#3B82F6" }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    표시할 트렌드 데이터가 없습니다.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chart Section 2: Top Accounts & Category Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top 5 Accounts Donut */}
            <Card className="border border-slate-200 shadow-xs bg-white">
              <CardHeader className="p-4 pb-2 border-b border-slate-100">
                <CardTitle className="text-sm font-black text-slate-900">
                  상위 5대 거래처 매출 점유율 (Pareto)
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  회사 전체 매출을 견인하는 핵심 파트너사 비중
                </p>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64 w-full flex items-center justify-center">
                  {kpiData?.topAccounts && kpiData.topAccounts.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={kpiData.topAccounts}
                          dataKey="revenue"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                        >
                          {kpiData.topAccounts.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: any) => [`₩${Number(v).toLocaleString()}원`, "매출액"]}
                          contentStyle={{
                            backgroundColor: "#0F172A",
                            borderRadius: "10px",
                            border: "none",
                            color: "#FFF",
                            fontSize: "12px",
                          }}
                        />
                        <Legend
                          layout="vertical"
                          align="right"
                          verticalAlign="middle"
                          wrapperStyle={{ fontSize: "11px", lineHeight: "22px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <span className="text-slate-400 text-xs">거래처 데이터가 없습니다.</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Category Hardware Contribution */}
            <Card className="border border-slate-200 shadow-xs bg-white">
              <CardHeader className="p-4 pb-2 border-b border-slate-100">
                <CardTitle className="text-sm font-black text-slate-900">
                  부품 제품군별 매출 기여도
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  슬라이딩 시스템, 댐퍼, 레일 등 제품군별 매출 분포
                </p>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {kpiData?.categoryBreakdown.map((cat, idx) => (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-extrabold text-slate-800">{cat.category}</span>
                      <span className="font-mono font-bold text-slate-900">
                        ₩{cat.revenue.toLocaleString()} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 2: ACCOUNTS REVENUE BREAKDOWN ==================== */}
      {activeSubTab === "accounts" && (
        <div className="space-y-4 animate-in fade-in">
          {/* Search & Export Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                placeholder="거래처명, 담당자, 연락처 검색"
                className="pl-9 h-9 text-xs"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadAccountsCsv}
              className="border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs h-9 gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>거래처 매출대장 엑셀 다운로드</span>
            </Button>
          </div>

          {/* Accounts Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 font-extrabold uppercase border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="p-3 w-12 text-center">순위</th>
                    <th className="p-3">거래처명</th>
                    <th className="p-3">대표/담당자 (연락처)</th>
                    <th className="p-3">기본 납품 주소</th>
                    <th className="p-3 text-center">총 발주</th>
                    <th className="p-3 text-right">총 누적 매출</th>
                    <th className="p-3 text-right">평균 객단가</th>
                    <th className="p-3 text-center">미출고</th>
                    <th className="p-3 text-center">최근 발주</th>
                    <th className="p-3 text-center">정산 서류</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-10 text-center text-slate-400">
                        등록된 거래처 매출 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((acc, idx) => (
                      <tr key={acc.companyName} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="p-3">
                          <span className="font-extrabold text-slate-900 block">
                            {acc.companyName}
                          </span>
                          <span className="text-[10.5px] text-slate-400 truncate max-w-[150px] block">
                            주요: {acc.topProducts.slice(0, 2).join(", ") || "-"}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-800 block">{acc.contactName}</span>
                          <span className="text-[11px] text-slate-500">{acc.phone}</span>
                        </td>
                        <td className="p-3 max-w-[200px] truncate text-slate-700" title={acc.deliveryAddress}>
                          {acc.deliveryAddress || "-"}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">
                          {acc.totalOrders}건
                        </td>
                        <td className="p-3 text-right font-black text-slate-900 text-sm">
                          ₩{acc.totalRevenue.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-600">
                          ₩{acc.averageOrderValue.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          {acc.pendingCount > 0 ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                              {acc.pendingCount}건 대기
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-slate-400">완료</span>
                          )}
                        </td>
                        <td className="p-3 text-center text-slate-500 font-mono text-[11px]">
                          {acc.lastOrderDate.slice(0, 10)}
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setStatementAccount(acc)}
                            className="h-7 text-xs font-bold border-slate-300 hover:bg-slate-100 gap-1 px-2 text-[#FF7B00]"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>거래명세서</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: B2B Monthly Statement (거래처별 거래명세서 출력 창) */}
      {statementAccount && (
        <Dialog open={true} onOpenChange={() => setStatementAccount(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-8 rounded-2xl">
            <div id="printable-statement" className="space-y-6 text-slate-900">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <span className="text-2xl font-black tracking-tight text-slate-900 block">
                    거 래 명 세 서 (STATEMENT)
                  </span>
                  <span className="text-xs text-slate-500 font-semibold mt-1 block">
                    공급사: E-COAS (코아스) · 사업자등록번호: 123-45-67890
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 block">발행일자</span>
                  <span className="text-sm font-bold text-slate-900 block">
                    {new Date().toISOString().slice(0, 10)}
                  </span>
                  <span className="text-xs text-[#FF7B00] font-black mt-1 block">
                    합계금액: ₩{statementAccount.totalRevenue.toLocaleString()} (VAT포함)
                  </span>
                </div>
              </div>

              {/* Company Info Box */}
              <div className="grid grid-cols-2 gap-4 text-xs border border-slate-300 rounded-lg p-3 bg-slate-50">
                <div>
                  <span className="font-extrabold text-slate-500 block mb-1">■ 공급받는자 (거래처)</span>
                  <div className="space-y-0.5">
                    <p><strong className="text-slate-900">{statementAccount.companyName}</strong></p>
                    <p>담당자: {statementAccount.contactName} ({statementAccount.phone})</p>
                    <p>배송지: {statementAccount.deliveryAddress}</p>
                  </div>
                </div>
                <div>
                  <span className="font-extrabold text-slate-500 block mb-1">■ 공급자 (본사)</span>
                  <div className="space-y-0.5">
                    <p><strong className="text-slate-900">E-COAS (코아스)</strong></p>
                    <p>전화: 031)278-2201 · 이메일: hmlee1125@naver.com</p>
                    <p>주소: 경기도 화성시 인테리어하드웨어 단지</p>
                  </div>
                </div>
              </div>

              {/* Orders Table */}
              <div>
                <span className="text-xs font-extrabold text-slate-800 block mb-2">
                  ■ 발주 및 납품 명세 목록 (총 {statementAccount.orders.length}건)
                </span>
                <table className="w-full text-left text-xs border border-slate-300 divide-y divide-slate-200">
                  <thead className="bg-slate-100 font-bold text-slate-700 text-[11px]">
                    <tr>
                      <th className="p-2 border-r border-slate-300 w-10 text-center">No</th>
                      <th className="p-2 border-r border-slate-300 w-24">발주일자</th>
                      <th className="p-2 border-r border-slate-300 w-28">발주번호</th>
                      <th className="p-2 border-r border-slate-300">품목 및 규격</th>
                      <th className="p-2 border-r border-slate-300 text-center w-16">배송방식</th>
                      <th className="p-2 border-r border-slate-300 text-right w-24">공급가액</th>
                      <th className="p-2 text-right w-24">합계(VAT포함)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {statementAccount.orders.map((ord, idx) => {
                      const total = ord.totalAmount || 0;
                      const supply = Math.round(total / 1.1);
                      return (
                        <tr key={ord.id}>
                          <td className="p-2 border-r border-slate-300 text-center text-slate-500">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-300 font-mono text-[11px]">{ord.createdAt.slice(0, 10)}</td>
                          <td className="p-2 border-r border-slate-300 font-mono font-bold text-[11px]">{ord.orderNumber}</td>
                          <td className="p-2 border-r border-slate-300">
                            {ord.items.map((it) => `${it.productName}(${it.quantity}개)`).join(", ")}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center">{ord.shippingMethod || "화물"}</td>
                          <td className="p-2 border-r border-slate-300 text-right font-mono">₩{supply.toLocaleString()}</td>
                          <td className="p-2 text-right font-mono font-bold">₩{total.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-black border-t-2 border-slate-300 text-xs">
                    <tr>
                      <td colSpan={5} className="p-2.5 text-center border-r border-slate-300">
                        총 합 계 (TOTAL)
                      </td>
                      <td className="p-2.5 text-right border-r border-slate-300 font-mono">
                        ₩{Math.round(statementAccount.totalRevenue / 1.1).toLocaleString()}
                      </td>
                      <td className="p-2.5 text-right font-mono text-[#FF7B00]">
                        ₩{statementAccount.totalRevenue.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <DialogFooter className="pt-4 flex justify-between sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStatementAccount(null)}
              >
                닫기
              </Button>
              <Button
                type="button"
                onClick={() => window.print()}
                className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold gap-1.5"
              >
                <Printer className="w-4 h-4" />
                거래명세서 인쇄
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
