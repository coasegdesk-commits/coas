import { useState, useEffect, useCallback, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  adminFetch,
  clearAdminToken,
  CMS_BOOTSTRAP_KEY,
  getAdminToken,
  setAdminToken,
} from "@/lib/cms";
import { AdminDesignTab } from "@/components/admin/admin-design-tab";
import { AdminNewProductsTab } from "@/components/admin/admin-new-products-tab";
import { AdminPartsTab } from "@/components/admin/admin-parts-tab";
import { AdminECatalogTab } from "@/components/admin/admin-ecatalog-tab";
import { AdminSubmissionsTab } from "@/components/admin/admin-submissions-tab";
import { AdminRecommendationsTab } from "@/components/admin/admin-recommendations-tab";
import type {
  CatalogRequestRecord,
  CmsProduct,
  InquiryRecord,
  MediaItem,
  NewProductItem,
  OrderRecord,
  PartAffinitySnapshot,
  PartsSection,
  SidebarFilterCategory,
  SiteDesignSettings,
} from "@shared/cms-types";
import {
  Lock,
  LayoutDashboard,
  Palette,
  Sparkles,
  Layers,
  BookOpen,
  ClipboardList,
  Star,
  ExternalLink,
  LogOut,
  KeyRound,
  Download,
  Upload,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface AdminOverviewData {
  design: SiteDesignSettings;
  newProducts: NewProductItem[];
  partsSections: PartsSection[];
  sidebarFilters: SidebarFilterCategory[];
  products: CmsProduct[];
  submissions: {
    orders: OrderRecord[];
    inquiries: InquiryRecord[];
    catalogRequests: CatalogRequestRecord[];
  };
  media: MediaItem[];
  affinity?: PartAffinitySnapshot;
}

type AdminTabId =
  | "overview"
  | "design"
  | "new-products"
  | "parts"
  | "recommendations"
  | "ecatalog"
  | "submissions";

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const restoreInputRef = useRef<HTMLInputElement | null>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTabId>("overview");
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Change password modal
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoadingData(true);
    try {
      const overview = await adminFetch<AdminOverviewData>("/api/admin/overview");
      setData(overview);
      setAuthenticated(true);
      // Invalidate public storefront caches so navigating to the mall shows fresh changes
      queryClient.invalidateQueries({ queryKey: CMS_BOOTSTRAP_KEY });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/part-affinity"] });
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        setAuthenticated(false);
      } else {
        toast({
          title: "데이터 로드 오류",
          description: err.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoadingData(false);
      setCheckingAuth(false);
    }
  }, [queryClient, toast]);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setCheckingAuth(false);
      return;
    }
    loadOverview();
  }, [loadOverview]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoggingIn(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "로그인에 실패했습니다.");
      }
      setAdminToken(json.token);
      setPassword("");
      await loadOverview();
      toast({ title: "관리자 페이지에 로그인되었습니다." });
    } catch (err: any) {
      toast({
        title: "로그인 실패",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminFetch("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore
    }
    clearAdminToken();
    setAuthenticated(false);
    setData(null);
    toast({ title: "로그아웃되었습니다." });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      toast({
        title: "새 비밀번호는 4자리 이상 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "새 비밀번호 확인이 일치하지 않습니다.",
        variant: "destructive",
      });
      return;
    }
    setChangingPw(true);
    try {
      await adminFetch("/api/admin/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast({ title: "관리자 비밀번호가 안전하게 변경되었습니다." });
      setPwModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({
        title: "비밀번호 변경 실패",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setChangingPw(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const backup = await adminFetch("/api/admin/backup");
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coas-cms-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({ title: "전체 설정·제품·접수내역 백업 파일이 다운로드되었습니다." });
    } catch (err: any) {
      toast({
        title: "백업 실패",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (
      !window.confirm(
        `'${file.name}' 백업 파일로 현재 쇼핑몰 데이터를 복원하시겠습니까?`,
      )
    )
      return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await adminFetch("/api/admin/restore", {
        method: "POST",
        body: JSON.stringify(parsed),
      });
      toast({ title: "백업 데이터가 정상적으로 복원되었습니다." });
      await loadOverview();
    } catch (err: any) {
      toast({
        title: "복원 실패",
        description: err.message || "올바른 백업 JSON 파일이 아닙니다.",
        variant: "destructive",
      });
    }
  };

  const handleMediaUploaded = (item: MediaItem) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            media: [item, ...prev.media.filter((m) => m.id !== item.id)],
          }
        : prev,
    );
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF7B00]" />
      </div>
    );
  }

  // =========================================================
  // LOGIN VIEW
  // =========================================================
  if (!authenticated || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Helmet>
          <title>관리자 로그인 | E-COAS CMS</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-slate-900 px-8 py-7 text-center border-b border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-[#FF7B00] text-white flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white">
              E-COAS 쇼핑몰 관리자 시스템
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              관리자 전용 페이지입니다. 비밀번호를 입력해주세요.
            </p>
          </div>

          <form onSubmit={handleLogin} className="p-8 space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="admin-pw"
                className="text-sm font-semibold text-gray-700"
              >
                관리자 비밀번호
              </label>
              <Input
                id="admin-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                autoFocus
                className="h-11"
              />
              <p className="text-[11px] text-gray-400">
                * 초기 설정 비밀번호는 <code className="font-mono text-gray-600">coas1234</code> 이며, 로그인 후 상단 [비밀번호 변경]에서 즉시 변경하실 수 있습니다.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loggingIn}
              className="w-full h-11 bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold text-base"
            >
              {loggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  확인 중...
                </>
              ) : (
                "관리자 로그인"
              )}
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/"
                className="text-xs text-gray-500 hover:text-[#FF7B00] transition-colors"
              >
                ← 쇼핑몰 메인 화면으로 돌아가기
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================
  // AUTHENTICATED ADMIN DASHBOARD
  // =========================================================
  const unreadOrders = data.submissions.orders.filter(
    (o) => o.status === "new",
  ).length;
  const unreadInquiries = data.submissions.inquiries.filter(
    (i) => i.status === "new",
  ).length;
  const unreadCatalogs = data.submissions.catalogRequests.filter(
    (c) => c.status === "new",
  ).length;
  const totalUnread = unreadOrders + unreadInquiries + unreadCatalogs;

  const navItems: {
    id: AdminTabId;
    label: string;
    icon: any;
    badge?: number;
  }[] = [
    { id: "overview", label: "대시보드 요약", icon: LayoutDashboard },
    { id: "recommendations", label: "추천 부속 · 출고학습", icon: Star },
    { id: "design", label: "홈 · 디자인 · 회사정보", icon: Palette },
    { id: "new-products", label: "신제품 등록 · 관리", icon: Sparkles },
    { id: "parts", label: "부품 인덱스 · 상세도면", icon: Layers },
    { id: "ecatalog", label: "전자카탈로그 관리", icon: BookOpen },
    {
      id: "submissions",
      label: "발주서 · 문의 · 신청 내역",
      icon: ClipboardList,
      badge: totalUnread,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Helmet>
        <title>관리자 센터 | E-COAS CMS</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Top Admin Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#FF7B00] p-2 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight">
                E-COAS 관리자 센터
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-400">
                쇼핑몰 통합 CMS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
            >
              쇼핑몰 열기
              <ExternalLink className="w-3.5 h-3.5 text-[#FF7B00]" />
            </a>

            <a
              href="/order"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
            >
              발주서 페이지
              <ExternalLink className="w-3.5 h-3.5 text-[#FF7B00]" />
            </a>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleDownloadBackup}
              className="text-slate-300 hover:text-white hover:bg-slate-800 h-8 text-xs hidden sm:inline-flex"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              백업
            </Button>

            <input
              ref={restoreInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleRestoreBackup}
              className="hidden"
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => restoreInputRef.current?.click()}
              className="text-slate-300 hover:text-white hover:bg-slate-800 h-8 text-xs hidden sm:inline-flex"
            >
              <Upload className="w-3.5 h-3.5 mr-1" />
              복원
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setPwModalOpen(true)}
              className="text-slate-300 hover:text-white hover:bg-slate-800 h-8 text-xs"
            >
              <KeyRound className="w-3.5 h-3.5 mr-1" />
              비밀번호 변경
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 hover:bg-slate-800 h-8 text-xs"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="max-w-[1600px] w-full mx-auto px-4 py-6 flex-1 flex flex-col lg:flex-row gap-6">
        {/* Left Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <nav className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm flex lg:flex-col gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between gap-2 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#FF7B00] text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white text-[#FF7B00]"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {loadingData && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF7B00]" />
              동기화 중...
            </div>
          )}
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 min-w-0">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card
                  onClick={() => setActiveTab("submissions")}
                  className="cursor-pointer hover:border-[#FF7B00] transition-colors"
                >
                  <CardContent className="p-5">
                    <p className="text-xs font-medium text-gray-500">
                      접수된 발주서
                    </p>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {data.submissions.orders.length}
                      </span>
                      {unreadOrders > 0 && (
                        <Badge className="bg-red-500 text-white text-xs">
                          신규 {unreadOrders}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => setActiveTab("submissions")}
                  className="cursor-pointer hover:border-[#FF7B00] transition-colors"
                >
                  <CardContent className="p-5">
                    <p className="text-xs font-medium text-gray-500">
                      온라인 문의
                    </p>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {data.submissions.inquiries.length}
                      </span>
                      {unreadInquiries > 0 && (
                        <Badge className="bg-red-500 text-white text-xs">
                          신규 {unreadInquiries}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => setActiveTab("submissions")}
                  className="cursor-pointer hover:border-[#FF7B00] transition-colors"
                >
                  <CardContent className="p-5">
                    <p className="text-xs font-medium text-gray-500">
                      카탈로그 리드 수집
                    </p>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {data.submissions.catalogRequests.length}
                      </span>
                      {unreadCatalogs > 0 && (
                        <Badge className="bg-red-500 text-white text-xs">
                          신규 {unreadCatalogs}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => setActiveTab("new-products")}
                  className="cursor-pointer hover:border-[#FF7B00] transition-colors"
                >
                  <CardContent className="p-5">
                    <p className="text-xs font-medium text-gray-500">
                      신제품 전시 카드
                    </p>
                    <p className="text-2xl font-bold text-[#FF7B00] mt-2">
                      {data.newProducts.length}개
                    </p>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => setActiveTab("parts")}
                  className="cursor-pointer hover:border-[#FF7B00] transition-colors"
                >
                  <CardContent className="p-5">
                    <p className="text-xs font-medium text-gray-500">
                      등록된 전체 제품
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {data.products.length}종
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Action Guide Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setActiveTab("recommendations")}
                  className="bg-amber-50/70 rounded-xl border border-amber-200 p-6 hover:border-[#FF7B00] hover:shadow-md transition-all cursor-pointer flex items-center justify-between md:col-span-2"
                >
                  <div>
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                      <Star className="w-5 h-5 text-[#FF7B00] fill-[#FF7B00]" />
                      발주서 추천 부속 지정(1순위) & 출고확정 자동학습(2순위) 별도 분류 관리
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      메인 롤러별 &lsquo;★ 관리자 지정 공식 추천&rsquo;을 최우선 지정하고, 발주서 처리완료(출고확정) 건으로 자동 학습된 부속 목록을 별도 분류로 조회·승격·제외 관리합니다. (현재 출고학습 완료 발주: {data.affinity?.totalLearnedOrders ?? 0}건)
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#FF7B00] shrink-0" />
                </div>

                <div
                  onClick={() => setActiveTab("new-products")}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:border-[#FF7B00] hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#FF7B00]" />
                      신제품 등록 및 움직이는 GIF 업로드
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      신제품 이미지를 업로드하고 1칸/2칸 와이드 크기와 상단 드롭다운 메뉴 노출을 바로 설정합니다.
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 shrink-0" />
                </div>

                <div
                  onClick={() => setActiveTab("parts")}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:border-[#FF7B00] hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#FF7B00]" />
                      부품 인덱스 카드 추가 & 상세도면 업로드
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      부품 인덱스 섹션별 카드를 배치하고, 각 제품 클릭 시 하단에 보이는 카탈로그 상세 도면을 여러 장 등록합니다.
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 shrink-0" />
                </div>

                <div
                  onClick={() => setActiveTab("design")}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:border-[#FF7B00] hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                      <Palette className="w-5 h-5 text-[#FF7B00]" />
                      홈 메인 배너 · 인기 제품 · 회사 연락처 수정
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      메인 배너 문구/배경, 발주서 버튼, 인기 제품 8종 및 전화번호·이메일·주소를 한 곳에서 변경합니다.
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 shrink-0" />
                </div>

                <div
                  onClick={() => setActiveTab("ecatalog")}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:border-[#FF7B00] hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[#FF7B00]" />
                      전자카탈로그 PDF 교체 & 다운로드 리드 설정
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      최신 카탈로그 PDF나 슬라이드 이미지를 올리고 다운로드 시 고객 정보 입력 여부를 제어합니다.
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 shrink-0" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "design" && (
            <AdminDesignTab
              design={data.design}
              products={data.products}
              mediaList={data.media}
              onSaved={loadOverview}
              onMediaUploaded={handleMediaUploaded}
            />
          )}

          {activeTab === "new-products" && (
            <AdminNewProductsTab
              newProducts={data.newProducts}
              products={data.products}
              mediaList={data.media}
              onSaved={loadOverview}
              onMediaUploaded={handleMediaUploaded}
            />
          )}

          {activeTab === "parts" && (
            <AdminPartsTab
              partsSections={data.partsSections}
              sidebarFilters={data.sidebarFilters}
              products={data.products}
              mediaList={data.media}
              onSaved={loadOverview}
              onMediaUploaded={handleMediaUploaded}
            />
          )}

          {activeTab === "recommendations" && (
            <AdminRecommendationsTab
              products={data.products}
              partsSections={data.partsSections}
              affinity={
                data.affinity || {
                  connected: false,
                  totalLearnedOrders: 0,
                  learnedOrderIds: [],
                  records: [],
                }
              }
              onSaved={loadOverview}
            />
          )}

          {activeTab === "ecatalog" && (
            <AdminECatalogTab
              design={data.design}
              mediaList={data.media}
              onSaved={loadOverview}
              onMediaUploaded={handleMediaUploaded}
            />
          )}

          {activeTab === "submissions" && (
            <AdminSubmissionsTab
              orders={data.submissions.orders}
              inquiries={data.submissions.inquiries}
              catalogRequests={data.submissions.catalogRequests}
              learnedOrderIds={data.affinity?.learnedOrderIds || []}
              onSaved={loadOverview}
            />
          )}
        </main>
      </div>

      {/* Password Change Modal */}
      <Dialog open={pwModalOpen} onOpenChange={setPwModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>관리자 비밀번호 변경</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                현재 비밀번호
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                새 비밀번호 (4자 이상)
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                새 비밀번호 확인
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPwModalOpen(false)}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={changingPw}
                className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold"
              >
                {changingPw && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                비밀번호 변경
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
