import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  Phone,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  MessageCircle,
  Truck,
  RotateCcw,
  Check,
  UserCheck,
} from "lucide-react";
import {
  type BuyerSession,
  setBuyerSession,
  PRESET_BUYERS,
  findBuyerByPhone,
} from "@/lib/order-auth";
import { useToast } from "@/hooks/use-toast";
import type { B2BCompanyProfile } from "@shared/cms-types";

interface BuyerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (session: BuyerSession) => void;
}

export function BuyerAuthModal({
  isOpen,
  onClose,
  onSuccess = () => {},
}: BuyerAuthModalProps) {
  const { toast } = useToast();

  // Phone Suffix State ( 뒷 8자리: e.g. "1234-5678" ) - 010 및 하이픈(-) 자동 처리
  const [phoneSuffix, setPhoneSuffix] = useState("1234-5678");
  const [companyName, setCompanyName] = useState("(주)코아스인테리어");
  const [contactName, setContactName] = useState("김담당 실장");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("1234");
  const [rememberMe, setRememberMe] = useState(true);
  const [remoteCompanies, setRemoteCompanies] = useState<B2BCompanyProfile[]>([]);

  // Load B2B companies from server & EGDesk My DB
  useEffect(() => {
    if (isOpen) {
      fetch("/api/b2b/companies")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.companies)) {
            setRemoteCompanies(data.companies);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Full Phone computed from 010 + suffix
  const fullPhone = phoneSuffix.trim() ? `010-${phoneSuffix.trim()}` : "";

  // Audit Log Helper
  const sendAuthAuditLog = (session: BuyerSession, method: string) => {
    fetch("/api/auth/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: session.companyName,
        contactName: session.contactName,
        phone: session.phone,
        loginMethod: method,
        status: "success",
      }),
    }).catch(() => {});
  };

  // Find matching staff contact in registered B2B companies
  const matchedRemote = (() => {
    const clean = fullPhone.replace(/[^0-9]/g, "");
    if (!clean || clean.length < 8) return null;
    for (const comp of remoteCompanies) {
      for (const staff of comp.staffContacts) {
        if (staff.phone.replace(/[^0-9]/g, "") === clean) {
          return { company: comp, staff };
        }
      }
    }
    return null;
  })();

  // Fallback to static preset buyer if not in remote companies
  const matchedBuyer = matchedRemote
    ? {
        companyName: matchedRemote.company.companyName,
        contactName: `${matchedRemote.staff.name} (${matchedRemote.staff.role || "담당자"})`,
        phone: matchedRemote.staff.phone,
      }
    : findBuyerByPhone(fullPhone);

  // Smart Phone Input Handler:
  // 1) 010 타이핑 안 하고 뒷번호만 입력해도 자동 처리
  // 2) 혹시 010을 입력하거나 복사-붙여넣기 해도 자동으로 앞의 010 제거
  // 3) 하이픈(-)을 안 넣어도 4자리 이후 자동 하이픈 삽입 (12345678 -> 1234-5678)
  const handlePhoneSuffixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // 숫자만 추출
    let digits = raw.replace(/[^0-9]/g, "");

    // 사용자가 실수로 010을 먼저 입력하거나 010-을 붙여넣은 경우, 앞의 010을 자동 제거
    if (digits.startsWith("010")) {
      digits = digits.slice(3);
    }

    // 뒷자리는 최대 8자리까지만 허용 (4자리 국번 + 4자리 번호)
    if (digits.length > 8) {
      digits = digits.slice(0, 8);
    }

    // 하이픈(-) 자동 포맷팅 (4자리 초과 시 자동 하이픈 삽입)
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }

    setPhoneSuffix(formatted);

    // 등록된 거래처 자동 감지 (원격 다중 담당자 우선 -> 정적 프리셋 보조)
    const computedFull = formatted ? `010-${formatted}` : "";
    const clean = computedFull.replace(/[^0-9]/g, "");

    let foundRemote: { company: B2BCompanyProfile; staff: any } | null = null;
    for (const comp of remoteCompanies) {
      for (const staff of comp.staffContacts) {
        if (staff.phone.replace(/[^0-9]/g, "") === clean) {
          foundRemote = { company: comp, staff };
          break;
        }
      }
      if (foundRemote) break;
    }

    if (foundRemote) {
      setCompanyName(foundRemote.company.companyName);
      setContactName(`${foundRemote.staff.name} (${foundRemote.staff.role || "담당자"})`);
    } else {
      const found = findBuyerByPhone(computedFull);
      if (found) {
        setCompanyName(found.companyName);
        setContactName(found.contactName);
      }
    }
  };

  // 1. Hero: Kakao 1-Click Login
  const handleKakaoLogin = () => {
    const defaultBuyer = PRESET_BUYERS[0];
    const session: BuyerSession = {
      ...defaultBuyer,
      isAuthenticated: true,
      loginMethod: "social_kakao",
      loggedInAt: new Date().toISOString(),
    };
    setBuyerSession(session);
    sendAuthAuditLog(session, "social_kakao");
    toast({
      title: "카카오 1초 로그인 완료",
      description: `[${session.companyName} - ${session.contactName}] 님 환영합니다. 과거 발주 이력과 기본 배송지가 자동 연동되었습니다.`,
    });
    onSuccess(session);
    onClose();
  };

  // 2. Phone OTP Request
  const handleSendOtp = () => {
    const digitsOnly = phoneSuffix.replace(/[^0-9]/g, "");
    if (!digitsOnly || digitsOnly.length < 7) {
      toast({
        title: "휴대폰 번호 뒷자리를 정확히 입력해 주세요.",
        description: "010을 제외한 뒷 7~8자리 숫자를 입력하시면 됩니다.",
        variant: "destructive",
      });
      return;
    }
    setOtpSent(true);
    toast({
      title: "인증번호 발송 완료",
      description: `[${fullPhone}] 번호로 4자리 인증번호가 전송되었습니다. (테스트 코드: 1234)`,
    });
  };

  // 3. Phone OTP Submit (Passwordless)
  const handlePhoneLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const digitsOnly = phoneSuffix.replace(/[^0-9]/g, "");
    if (!digitsOnly || digitsOnly.length < 7) {
      toast({
        title: "휴대폰 번호 뒷자리를 입력해 주세요.",
        description: "010을 제외한 7~8자리 숫자 (예: 1234-5678)",
        variant: "destructive",
      });
      return;
    }
    if (otpSent && otpCode.trim() !== "1234" && otpCode.trim().length !== 4) {
      toast({ title: "인증번호 4자리를 확인해 주세요.", variant: "destructive" });
      return;
    }

    let session: BuyerSession;
    if (matchedRemote) {
      session = {
        isAuthenticated: true,
        companyName: matchedRemote.company.companyName,
        bizNumber: matchedRemote.company.bizNumber,
        contactName: `${matchedRemote.staff.name} (${matchedRemote.staff.role || "담당자"})`,
        phone: fullPhone,
        email: "order@" + (matchedRemote.company.companyName.replace(/[^a-zA-Z0-9]/g, "") || "buyer") + ".com",
        deliveryAddress: matchedRemote.company.deliveryAddress,
        shippingMethod: (matchedRemote.company.shippingMethod as any) || "화물",
        loginMethod: "biz_phone",
        loggedInAt: new Date().toISOString(),
      };
    } else {
      const matched = findBuyerByPhone(fullPhone);
      session = matched
        ? {
            ...matched,
            isAuthenticated: true,
            loginMethod: "biz_phone",
            loggedInAt: new Date().toISOString(),
          }
        : {
            isAuthenticated: true,
            companyName: companyName.trim() || "신규 거래처",
            bizNumber: "123-45-67890",
            contactName: contactName.trim() || "담당자",
            phone: fullPhone,
            email: "order@" + (companyName.replace(/[^a-zA-Z0-9]/g, "") || "buyer") + ".com",
            deliveryAddress: "서울/수도권 현장 직송 배송지",
            shippingMethod: "화물",
            loginMethod: "biz_phone",
            loggedInAt: new Date().toISOString(),
          };
    }

    setBuyerSession(session);
    sendAuthAuditLog(session, "biz_phone");
    toast({
      title: "거래처 로그인 완료",
      description: `[${session.companyName}] 님 환영합니다. 비밀번호 없이 안전하게 발주서를 작성하실 수 있습니다.`,
    });
    onSuccess(session);
    onClose();
  };

  // 4. Quick Preset Switch
  const handlePresetSelect = (preset: BuyerSession) => {
    let rawDigits = preset.phone.replace(/[^0-9]/g, "");
    if (rawDigits.startsWith("010")) rawDigits = rawDigits.slice(3);
    const formatted =
      rawDigits.length > 4 ? `${rawDigits.slice(0, 4)}-${rawDigits.slice(4)}` : rawDigits;

    setPhoneSuffix(formatted);
    setCompanyName(preset.companyName);
    setContactName(preset.contactName);

    const session: BuyerSession = {
      ...preset,
      isAuthenticated: true,
      loginMethod: preset.loginMethod || "biz_phone",
      loggedInAt: new Date().toISOString(),
    };
    setBuyerSession(session);
    sendAuthAuditLog(session, "preset_quick");
    toast({
      title: "거래처 전환 완료",
      description: `[${session.companyName}] 님으로 로그인되었습니다.`,
    });
    onSuccess(session);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-2 border-slate-300 shadow-2xl">
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white p-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF7B00] flex items-center justify-center text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-white tracking-tight">
                거래처(B2B) 1초 간편로그인
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                복잡한 비밀번호 없이 카카오톡 또는 휴대폰 4자리로 즉시 로그인합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* SECTION 1: 【1위 추천】 카카오 1초 간편 로그인 (Hero Primary Action) */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleKakaoLogin}
              data-testid="button-kakao-login"
              className="w-full h-12 rounded-xl bg-[#FEE500] hover:bg-[#FDD835] active:scale-[0.99] text-[#191919] font-black text-sm flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer"
            >
              <span className="w-6 h-6 rounded-full bg-[#191919] text-[#FEE500] flex items-center justify-center font-black text-xs shrink-0">
                💬
              </span>
              <span>카카오로 1초 시작하기</span>
            </button>

            {/* Micro Value Prop */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-amber-50/70 border border-amber-200/80 rounded-lg p-2">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#FF7B00] shrink-0" />
                <span className="truncate">모바일 카톡 1터치 연동</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#FF7B00] shrink-0" />
                <span className="truncate">출고/송장 카톡 자동알림</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="shrink-0 mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              또는 휴대폰 번호로 로그인
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* SECTION 3: 【2위 추천】 휴대폰 번호 간편 인증 (010 및 하이픈 자동 처리!) */}
          <form onSubmit={handlePhoneLogin} className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  휴대폰 번호
                </label>
                {matchedBuyer && (
                  <span className="text-[11px] font-extrabold text-[#FF7B00] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[240px]">
                      등록 거래처: {matchedBuyer.companyName}
                      {matchedRemote?.staff?.name
                        ? ` (${matchedRemote.staff.name}${matchedRemote.staff.role ? ` ${matchedRemote.staff.role}` : ""})`
                        : ""}
                    </span>
                  </span>
                )}
              </div>

              {/* 010 고정 Prefix + 뒷 8자리 자동 하이픈 통합 입력창 */}
              <div className="flex gap-2">
                <div className="flex-1 flex rounded-xl border border-slate-300 overflow-hidden focus-within:border-[#FF7B00] focus-within:ring-2 focus-within:ring-[#FF7B00]/20 bg-white transition-all shadow-xs">
                  {/* Fixed 010 Badge */}
                  <div className="px-3 py-2 bg-slate-100 border-r border-slate-200 text-slate-800 font-extrabold text-xs flex items-center gap-1 select-none shrink-0">
                    <Phone className="w-3.5 h-3.5 text-[#FF7B00]" />
                    <span>010</span>
                    <span className="text-slate-400 font-normal">-</span>
                  </div>

                  {/* Suffix Input (8 Digits with auto-hyphen) */}
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={phoneSuffix}
                    onChange={handlePhoneSuffixChange}
                    placeholder="1234-5678 (뒷 번호만 입력)"
                    className="w-full px-3 py-2 text-xs font-bold tracking-wider text-slate-900 focus:outline-none bg-transparent placeholder:text-slate-400 placeholder:font-normal"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs whitespace-nowrap border border-slate-300 transition-colors cursor-pointer shrink-0"
                >
                  {otpSent ? "재전송" : "인증요청"}
                </button>
              </div>

              {/* Helpful UX Note */}
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF7B00] shrink-0" />
                <span>
                  <strong>010</strong> 및 <strong>하이픈(-)</strong>은 자동 입력됩니다. 뒷 8자리 숫자만 누르시면 됩니다.
                </span>
              </p>
            </div>

            {/* OTP Code Input (Passwordless) */}
            {otpSent && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-1 bg-orange-50/60 p-2.5 rounded-xl border border-orange-200">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>인증번호 4자리 입력</span>
                  <span className="text-slate-500 font-normal">
                    테스트 인증코드: <strong className="text-[#FF7B00] font-bold">1234</strong>
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    maxLength={4}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="1234"
                    className="w-32 px-3 py-1.5 text-center text-sm font-black tracking-widest border border-slate-300 rounded-lg focus:outline-none focus:border-[#FF7B00] bg-white"
                    autoFocus
                  />
                  <span className="text-[11px] text-slate-500">
                    인증번호를 누르고 아래 로그인 버튼을 클릭하세요.
                  </span>
                </div>
              </div>
            )}

            {/* Company Name (only if new or not matched) */}
            {!matchedBuyer && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  업체명(상호)
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="예: 영림인테리어 디자인"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#FF7B00]"
                  required
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              data-testid="button-phone-login"
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#FF7B00]" />
              <span>휴대폰 번호로 로그인 및 발주서 작성</span>
            </button>
          </form>

          {/* SECTION 4: 💡 빠른 테스트 거래처 선택 (원클릭 전환) */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500">
                💡 등록 거래처 원클릭 로그인 (빠른 체험):
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {PRESET_BUYERS.map((preset) => (
                <button
                  key={preset.companyName}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className="py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-900 text-[10.5px] font-bold truncate transition-colors cursor-pointer text-center"
                  title={`${preset.companyName} (${preset.contactName})`}
                >
                  {preset.companyName.replace(/\(주\)/g, "")}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-login remember notice */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-[#FF7B00] focus:ring-[#FF7B00]"
              />
              <span>이 기기에서 항상 로그인 유지</span>
            </label>
            <span className="text-[10.5px] text-slate-400">비밀번호 없는 안심인증</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
