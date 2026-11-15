import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { adminFetch, downloadCsv } from "@/lib/cms";
import type {
  B2BCompanyProfile,
  B2BStaffContact,
  B2BAuthLog,
} from "@shared/cms-types";
import {
  Building2,
  Phone,
  KeyRound,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Search,
  Download,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserPlus,
  Database,
  ExternalLink,
} from "lucide-react";

export function AdminB2BAccountsTab() {
  const { toast } = useToast();

  const [subTab, setSubTab] = useState<"companies" | "logs">("companies");
  const [loading, setLoading] = useState(false);
  const [syncingEgdesk, setSyncingEgdesk] = useState(false);

  const [companies, setCompanies] = useState<B2BCompanyProfile[]>([]);
  const [authLogs, setAuthLogs] = useState<B2BAuthLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal: Add/Edit Company
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<B2BCompanyProfile | null>(null);
  const [formCompanyName, setFormCompanyName] = useState("");
  const [formBizNumber, setFormBizNumber] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formShippingMethod, setFormShippingMethod] = useState<"화물" | "택배" | "방문수령">("화물");
  const [formMemo, setFormMemo] = useState("");

  // Modal: Add Staff Phone to Company
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [targetCompany, setTargetCompany] = useState<B2BCompanyProfile | null>(null);
  const [staffName, setStaffName] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffRole, setStaffRole] = useState("현장담당");
  const [staffIsPrimary, setStaffIsPrimary] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [compsRes, logsRes] = await Promise.all([
        adminFetch("/api/admin/b2b-companies").catch(() => []),
        adminFetch("/api/admin/auth-logs").catch(() => []),
      ]);
      if (Array.isArray(compsRes)) setCompanies(compsRes);
      if (Array.isArray(logsRes)) setAuthLogs(logsRes);
    } catch {
      toast({ title: "데이터를 불러오는 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync to EGDesk
  const handleSyncToEgdesk = async () => {
    setSyncingEgdesk(true);
    try {
      const res = await adminFetch("/api/admin/b2b-sync-egdesk", { method: "POST" });
      toast({
        title: "EGDesk My DB 동기화 완료",
        description: `거래처 ${res.companiesCount}개사, 인증로그 ${res.logsCount}건이 coas_buyers & coas_auth_logs에 반영되었습니다.`,
      });
      loadData();
    } catch {
      toast({ title: "EGDesk 동기화 실패", variant: "destructive" });
    } finally {
      setSyncingEgdesk(false);
    }
  };

  // Open Company Modal
  const handleOpenCompanyModal = (comp?: B2BCompanyProfile) => {
    if (comp) {
      setEditingCompany(comp);
      setFormCompanyName(comp.companyName);
      setFormBizNumber(comp.bizNumber || "");
      setFormAddress(comp.deliveryAddress || "");
      setFormShippingMethod(comp.shippingMethod || "화물");
      setFormMemo(comp.memo || "");
    } else {
      setEditingCompany(null);
      setFormCompanyName("");
      setFormBizNumber("123-45-67890");
      setFormAddress("");
      setFormShippingMethod("화물");
      setFormMemo("");
    }
    setCompanyModalOpen(true);
  };

  // Save Company
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompanyName.trim()) {
      toast({ title: "업체명을 입력해 주세요.", variant: "destructive" });
      return;
    }
    try {
      await adminFetch("/api/admin/b2b-companies", {
        method: "POST",
        body: JSON.stringify({
          id: editingCompany?.id,
          companyName: formCompanyName.trim(),
          bizNumber: formBizNumber.trim(),
          deliveryAddress: formAddress.trim(),
          shippingMethod: formShippingMethod,
          memo: formMemo.trim(),
          staffContacts: editingCompany?.staffContacts || [],
        }),
      });
      toast({ title: "거래처가 저장되었습니다. (EGDesk 동기화 반영)" });
      setCompanyModalOpen(false);
      loadData();
    } catch (err: any) {
      toast({ title: err?.message || "저장 실패", variant: "destructive" });
    }
  };

  // Delete Company
  const handleDeleteCompany = async (id: string, name: string) => {
    if (!confirm(`[${name}] 거래처 및 등록된 모든 담당자 번호를 삭제하시겠습니까?`)) {
      return;
    }
    try {
      await adminFetch(`/api/admin/b2b-companies/${id}`, { method: "DELETE" });
      toast({ title: `[${name}] 거래처가 삭제되었습니다.` });
      loadData();
    } catch {
      toast({ title: "삭제 실패", variant: "destructive" });
    }
  };

  // Open Add Staff Phone Modal
  const handleOpenAddPhoneModal = (comp: B2BCompanyProfile) => {
    setTargetCompany(comp);
    setStaffName("");
    setStaffPhone("");
    setStaffRole("현장담당");
    setStaffIsPrimary(comp.staffContacts.length === 0);
    setPhoneModalOpen(true);
  };

  // Save Staff Phone
  const handleSaveStaffPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCompany) return;
    if (!staffPhone.trim()) {
      toast({ title: "휴대폰 번호를 입력해 주세요.", variant: "destructive" });
      return;
    }
    try {
      await adminFetch(`/api/admin/b2b-companies/${targetCompany.id}/phones`, {
        method: "POST",
        body: JSON.stringify({
          name: staffName.trim() || "담당자",
          phone: staffPhone.trim(),
          role: staffRole.trim(),
          isPrimary: staffIsPrimary,
        }),
      });
      toast({
        title: "담당자 번호 등록 완료",
        description: `[${targetCompany.companyName}]에 ${staffName || "담당자"}(${staffPhone}) 번호가 등록되었습니다.`,
      });
      setPhoneModalOpen(false);
      loadData();
    } catch (err: any) {
      toast({ title: err?.message || "등록 실패", variant: "destructive" });
    }
  };

  // Remove Staff Phone
  const handleRemoveStaffPhone = async (companyId: string, phoneId: string, name: string) => {
    if (!confirm(`[${name}] 담당자 번호를 삭제하시겠습니까?`)) return;
    try {
      await adminFetch(`/api/admin/b2b-companies/${companyId}/phones/${phoneId}`, {
        method: "DELETE",
      });
      toast({ title: "담당자 번호가 삭제되었습니다." });
      loadData();
    } catch {
      toast({ title: "삭제 실패", variant: "destructive" });
    }
  };

  // Filtered Companies
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;
    const q = searchQuery.toLowerCase().trim();
    return companies.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        (c.bizNumber && c.bizNumber.includes(q)) ||
        c.staffContacts.some(
          (s) => s.name.toLowerCase().includes(q) || s.phone.includes(q) || (s.role && s.role.includes(q)),
        ),
    );
  }, [companies, searchQuery]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return authLogs;
    const q = searchQuery.toLowerCase().trim();
    return authLogs.filter(
      (l) =>
        l.companyName.toLowerCase().includes(q) ||
        l.contactName.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.loginMethod.toLowerCase().includes(q),
    );
  }, [authLogs, searchQuery]);

  // CSV Export for Logs
  const handleDownloadLogsCsv = () => {
    const headers = ["인증일시", "업체명(상호)", "담당자명", "휴대폰번호", "인증수단", "상태"];
    const rows = filteredLogs.map((l) => [
      new Date(l.loggedAt).toLocaleString("ko-KR"),
      l.companyName,
      l.contactName,
      l.phone,
      l.loginMethod === "social_kakao" ? "카카오 1초 로그인" : "휴대폰 번호 OTP",
      l.status === "success" ? "성공" : "실패",
    ]);
    downloadCsv(`COAS_거래처_인증내역_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  // Metrics
  const totalPhones = useMemo(
    () => companies.reduce((acc, c) => acc + (c.staffContacts?.length || 0), 0),
    [companies],
  );

  return (
    <div className="space-y-6">
      {/* Header & Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF7B00] flex items-center justify-center text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">거래처 및 다중 담당자 번호 관리</h2>
              <p className="text-xs text-slate-300">
                한 거래처에 여러 직원의 휴대폰 번호를 등록하여 주문 권한을 부여하고, 실시간 인증 내역을 관리합니다.
              </p>
            </div>
          </div>
        </div>

        {/* EGDesk Sync Pill & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200">
            <Database className="w-3.5 h-3.5 text-[#FF7B00]" />
            <span>EGDesk My DB 실시간 연동 (coas_buyers & coas_auth_logs)</span>
          </div>

          <Button
            size="sm"
            onClick={handleSyncToEgdesk}
            disabled={syncingEgdesk}
            className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-extrabold text-xs h-9 px-3 gap-1.5 shadow-md cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingEgdesk ? "animate-spin" : ""}`} />
            <span>EGDesk 전체 동기화</span>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">등록 거래처 (회원사)</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{companies.length}개사</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF7B00] flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">등록된 담당자 휴대폰 번호</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{totalPhones}명</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Phone className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">누적 인증 로그인 건수</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{authLogs.length}건</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2 Sub Tabs: Companies vs Auth Logs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setSubTab("companies")}
          className={`py-2.5 px-4 font-black text-sm border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            subTab === "companies"
              ? "border-[#FF7B00] text-[#FF7B00]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>업체별 등록번호 관리 ({companies.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("logs")}
          className={`py-2.5 px-4 font-black text-sm border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            subTab === "logs"
              ? "border-[#FF7B00] text-[#FF7B00]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>실시간 로그인 인증 내역 ({authLogs.length})</span>
        </button>
      </div>

      {/* Toolbar: Search + Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              subTab === "companies"
                ? "업체명, 담당자명, 전화번호 검색..."
                : "인증 내역 검색..."
            }
            className="pl-9 text-xs h-9 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {subTab === "companies" ? (
            <Button
              size="sm"
              onClick={() => handleOpenCompanyModal()}
              className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-extrabold text-xs h-9 gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>신규 거래처 등록</span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadLogsCsv}
              className="text-xs h-9 gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>인증내역 CSV 다운로드</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={loadData}
            title="새로고침"
            className="h-9 w-9 p-0 text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* TAB 1: Companies & Staff Phone Directory */}
      {subTab === "companies" && (
        <div className="space-y-4">
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">등록된 거래처가 없습니다.</p>
              <p className="text-xs text-slate-400 mt-1">상단의 [+ 신규 거래처 등록] 버튼을 눌러 추가하세요.</p>
            </div>
          ) : (
            filteredCompanies.map((comp) => (
              <Card key={comp.id} className="border border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/80 border-b border-slate-200 p-4 py-3 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-orange-100 text-[#FF7B00] font-black text-sm flex items-center justify-center shrink-0">
                      🏢
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate">{comp.companyName}</h4>
                        {comp.bizNumber && (
                          <Badge variant="outline" className="text-[10.5px] px-1.5 py-0 font-mono">
                            {comp.bizNumber}
                          </Badge>
                        )}
                        <Badge className="bg-[#FF7B00]/15 text-[#FF7B00] hover:bg-[#FF7B00]/20 text-[10.5px] px-2">
                          등록번호 {comp.staffContacts.length}명
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        기본 배송지: {comp.deliveryAddress || "미지정"} ({comp.shippingMethod})
                        {comp.memo ? ` · ${comp.memo}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenAddPhoneModal(comp)}
                      className="text-xs h-8 gap-1 bg-white hover:bg-orange-50 hover:text-[#FF7B00] border-slate-300"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>담당자 번호 추가</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenCompanyModal(comp)}
                      className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                      title="업체 정보 수정"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCompany(comp.id, comp.companyName)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="업체 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4">
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 mb-2 flex items-center justify-between">
                      <span>등록된 발주 권한 휴대폰 번호 (해당 번호 입력 시 이 거래처로 즉시 로그인됩니다)</span>
                      <span className="text-slate-400 font-normal">총 {comp.staffContacts.length}명 등록됨</span>
                    </p>

                    {comp.staffContacts.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">등록된 담당자 번호가 없습니다. [담당자 번호 추가]를 눌러 직원을 등록해 주세요.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {comp.staffContacts.map((staff) => (
                          <div
                            key={staff.id}
                            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-orange-300 transition-colors flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-900 truncate">{staff.name}</span>
                                {staff.role && (
                                  <span className="text-[10px] px-1 rounded bg-slate-200 text-slate-700 font-medium">
                                    {staff.role}
                                  </span>
                                )}
                                {staff.isPrimary && (
                                  <span className="text-[9.5px] px-1 rounded bg-[#FF7B00] text-white font-extrabold">
                                    대표
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-mono font-bold text-slate-700 mt-0.5 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-[#FF7B00]" />
                                <span>{staff.phone}</span>
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveStaffPhone(comp.id, staff.id, staff.name)}
                              className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer shrink-0"
                              title="번호 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 2: Live Auth Logs (Audit Trail) */}
      {subTab === "logs" && (
        <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white">
          <CardHeader className="p-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF7B00]" />
              <h4 className="text-xs font-black text-slate-900">실시간 휴대폰 및 카카오 인증 이력 (최근순)</h4>
            </div>
            <span className="text-[11px] text-slate-500 font-bold">총 {filteredLogs.length}건</span>
          </CardHeader>

          <CardContent className="p-0">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">인증 기록이 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 whitespace-nowrap">인증 일시</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">거래처 상호</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">담당자명</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">휴대폰 번호</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">인증 수단</th>
                      <th className="py-2.5 px-3 whitespace-nowrap text-center">인증 결과</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {new Date(log.loggedAt).toLocaleString("ko-KR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-900">
                          {log.companyName}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-800">
                          {log.contactName}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-700">
                          {log.phone}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {log.loginMethod === "social_kakao" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10.5px]">
                              💬 카카오 1초 로그인
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-extrabold text-[10.5px]">
                              📱 휴대폰 4자리 OTP
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-center">
                          {log.status === "success" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              인증 성공
                            </span>
                          ) : (
                            <span className="text-red-500 font-bold text-[11px]">인증 실패</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODAL 1: Add / Edit Company */}
      <Dialog open={companyModalOpen} onOpenChange={setCompanyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black">
              {editingCompany ? "거래처 정보 수정" : "신규 거래처 등록"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCompany} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">업체명 (상호) *</label>
              <Input
                value={formCompanyName}
                onChange={(e) => setFormCompanyName(e.target.value)}
                placeholder="예: (주)한라엔지니어링"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">사업자등록번호</label>
                <Input
                  value={formBizNumber}
                  onChange={(e) => setFormBizNumber(e.target.value)}
                  placeholder="123-45-67890"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">기본 배송방식</label>
                <select
                  value={formShippingMethod}
                  onChange={(e) => setFormShippingMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-semibold focus:outline-none focus:border-[#FF7B00]"
                >
                  <option value="화물">화물 배송</option>
                  <option value="택배">택배 배송</option>
                  <option value="방문수령">방문 수령</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">기본 배송지 주소</label>
              <Input
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="서울/경기 등 주요 현장 주소"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">관리자 메모</label>
              <Input
                value={formMemo}
                onChange={(e) => setFormMemo(e.target.value)}
                placeholder="특이사항, 단가조건 등 메모"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCompanyModalOpen(false)}>
                취소
              </Button>
              <Button type="submit" className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold">
                저장하기
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Add Staff Phone to Company */}
      <Dialog open={phoneModalOpen} onOpenChange={setPhoneModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-[#FF7B00]" />
              <span>담당자 번호 등록</span>
            </DialogTitle>
          </DialogHeader>

          {targetCompany && (
            <p className="text-xs text-slate-600 bg-orange-50 p-2 rounded-lg border border-orange-200">
              <strong>{targetCompany.companyName}</strong>의 주문 권한을 부여할 직원의 휴대폰 번호를 등록합니다.
            </p>
          )}

          <form onSubmit={handleSaveStaffPhone} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">담당자 이름 *</label>
              <Input
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="예: 최반장 / 박실장"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">휴대폰 번호 *</label>
              <Input
                type="tel"
                value={staffPhone}
                onChange={(e) => setStaffPhone(e.target.value)}
                placeholder="010-XXXX-XXXX"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">직책 / 역할</label>
              <Input
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value)}
                placeholder="예: 현장소장 / 구매담당 / 시공팀장"
              />
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={staffIsPrimary}
                onChange={(e) => setStaffIsPrimary(e.target.checked)}
                className="rounded text-[#FF7B00] focus:ring-[#FF7B00]"
              />
              <span className="font-bold text-slate-700 text-xs">대표 담당자로 지정</span>
            </label>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setPhoneModalOpen(false)}>
                취소
              </Button>
              <Button type="submit" className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold">
                번호 등록 완료
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
