import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Building2,
  Phone,
  Lock,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  X,
} from "lucide-react";
import {
  type BuyerSession,
  setBuyerSession,
  DEFAULT_DEMO_BUYER,
} from "@/lib/order-auth";
import { useToast } from "@/hooks/use-toast";

interface BuyerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: BuyerSession) => void;
}

export function BuyerAuthModal({
  isOpen,
  onClose,
  onSuccess,
}: BuyerAuthModalProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<"biz_phone" | "social" | "password">("biz_phone");

  // Tab 1: Biz + Phone
  const [bizNumber, setBizNumber] = useState("123-45-67890");
  const [bizCompany, setBizCompany] = useState("(주)코아스인테리어");
  const [bizContact, setBizContact] = useState("김담당 실장");
  const [bizPhone, setBizPhone] = useState("010-1234-5678");

  // Tab 3: Password
  const [pwdCompany, setPwdCompany] = useState("(주)코아스인테리어");
  const [password, setPassword] = useState("");

  // Handler 1: Biz + Phone Login
  const handleBizPhoneLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizCompany.trim()) {
      toast({ title: "업체명을 입력해 주세요.", variant: "destructive" });
      return;
    }
    const session: BuyerSession = {
      isAuthenticated: true,
      companyName: bizCompany.trim(),
      bizNumber: bizNumber.trim() || "123-45-67890",
      contactName: bizContact.trim() || "담당자",
      phone: bizPhone.trim() || "010-0000-0000",
      email: "order@" + bizCompany.replace(/[^a-zA-Z0-9]/g, "") + ".co.kr",
      deliveryAddress: "경기도 화성시 동탄첨단산업1로 27",
      shippingMethod: "화물",
      loginMethod: "biz_phone",
      loggedInAt: new Date().toISOString(),
    };
    setBuyerSession(session);
    toast({
      title: "간편로그인 완료",
      description: `[${session.companyName}] 님 환영합니다. 우리 회사 주문 히스토리가 연동되었습니다.`,
    });
    onSuccess(session);
    onClose();
  };

  // Handler 2: Social Login (Kakao / Naver)
  const handleSocialLogin = (provider: "kakao" | "naver") => {
    const providerName = provider === "kakao" ? "카카오" : "네이버";
    const session: BuyerSession = {
      isAuthenticated: true,
      companyName: provider === "kakao" ? "(주)코아스인테리어" : "한샘인테리어 디자인",
      bizNumber: "214-88-12345",
      contactName: provider === "kakao" ? "김담당 실장 (카카오 연동)" : "박과장 (네이버 연동)",
      phone: "010-1234-5678",
      email: `buyer_${provider}@company.com`,
      deliveryAddress: "서울시 강남구 테헤란로 152",
      shippingMethod: "화물",
      loginMethod: provider === "kakao" ? "social_kakao" : "social_naver",
      loggedInAt: new Date().toISOString(),
    };
    setBuyerSession(session);
    toast({
      title: `${providerName} 간편로그인 완료`,
      description: `[${session.companyName}] 우리 회사 주문 히스토리가 연동되었습니다.`,
    });
    onSuccess(session);
    onClose();
  };

  // Handler 3: Company + Password Login
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdCompany.trim()) {
      toast({ title: "상호 또는 아이디를 입력해 주세요.", variant: "destructive" });
      return;
    }
    const session: BuyerSession = {
      isAuthenticated: true,
      companyName: pwdCompany.trim(),
      bizNumber: "123-45-67890",
      contactName: "담당 실장",
      phone: "010-1234-5678",
      email: "order@company.com",
      deliveryAddress: "경기도 화성시 동탄첨단산업1로 27",
      shippingMethod: "화물",
      loginMethod: "password",
      loggedInAt: new Date().toISOString(),
    };
    setBuyerSession(session);
    toast({
      title: "업체 로그인 완료",
      description: `[${session.companyName}] 로그인되었습니다.`,
    });
    onSuccess(session);
    onClose();
  };

  // Quick Demo Login
  const handleQuickDemoLogin = (company: string, phone: string, contact: string) => {
    const session: BuyerSession = {
      isAuthenticated: true,
      companyName: company,
      bizNumber: "123-45-67890",
      contactName: contact,
      phone: phone,
      email: "example@company.com",
      deliveryAddress: "경기도 화성시 동탄첨단산업1로 27, A동 302호",
      shippingMethod: "화물",
      loginMethod: "biz_phone",
      loggedInAt: new Date().toISOString(),
    };
    setBuyerSession(session);
    toast({
      title: "간편인증 로그인 완료",
      description: `[${company}] 우리 회사 주문 히스토리와 발주서가 연동되었습니다.`,
    });
    onSuccess(session);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-xl border border-slate-300 shadow-2xl">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF7B00] flex items-center justify-center text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-black text-white">
                거래처(업체) 간편로그인
              </DialogTitle>
              <p className="text-[11px] text-slate-400 mt-0.5">
                로그인하시면 우리 회사의 과거 발주 이력을 1초 만에 불러옵니다.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Tabs Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab("biz_phone")}
            className={`flex-1 py-2.5 text-center cursor-pointer transition-colors border-b-2 ${
              tab === "biz_phone"
                ? "border-[#FF7B00] text-[#FF7B00] bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            ① 사업자·휴대폰
          </button>
          <button
            type="button"
            onClick={() => setTab("social")}
            className={`flex-1 py-2.5 text-center cursor-pointer transition-colors border-b-2 ${
              tab === "social"
                ? "border-[#FF7B00] text-[#FF7B00] bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            ② 카카오·네이버
          </button>
          <button
            type="button"
            onClick={() => setTab("password")}
            className={`flex-1 py-2.5 text-center cursor-pointer transition-colors border-b-2 ${
              tab === "password"
                ? "border-[#FF7B00] text-[#FF7B00] bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            ③ 상호·비밀번호
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3">
          {/* TAB 1: Business Number + Mobile Phone Authentication */}
          {tab === "biz_phone" && (
            <form onSubmit={handleBizPhoneLogin} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  업체명(상호) *
                </label>
                <input
                  type="text"
                  value={bizCompany}
                  onChange={(e) => setBizCompany(e.target.value)}
                  placeholder="예: (주)코아스인테리어"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#FF7B00]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    사업자등록번호
                  </label>
                  <input
                    type="text"
                    value={bizNumber}
                    onChange={(e) => setBizNumber(e.target.value)}
                    placeholder="123-45-67890"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#FF7B00]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    담당자명
                  </label>
                  <input
                    type="text"
                    value={bizContact}
                    onChange={(e) => setBizContact(e.target.value)}
                    placeholder="김담당 실장"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#FF7B00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  담당자 휴대폰 번호 *
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={bizPhone}
                    onChange={(e) => setBizPhone(e.target.value)}
                    placeholder="010-1234-5678"
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#FF7B00]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => toast({ title: "인증번호가 발송되었습니다. (테스트 환경에서는 즉시 로그인 가능)" })}
                    className="px-2.5 py-1.5 rounded bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-700 text-[11px] font-bold whitespace-nowrap cursor-pointer"
                  >
                    인증요청
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-3 py-2.5 rounded-lg bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>사업자·휴대폰으로 간편로그인</span>
              </button>
            </form>
          )}

          {/* TAB 2: Kakao / Naver 1-Click Social Authentication */}
          {tab === "social" && (
            <div className="space-y-3 py-1">
              <p className="text-[11px] text-slate-600 text-center leading-relaxed">
                거래처 대표자 또는 발주 담당자의 <strong>카카오 / 네이버</strong> 계정으로 1초 만에 간편로그인하여 우리 회사 발주 이력을 불러옵니다.
              </p>

              {/* Kakao Login Button */}
              <button
                type="button"
                onClick={() => handleSocialLogin("kakao")}
                className="w-full py-2.5 px-4 rounded-lg bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors"
              >
                <span className="w-5 h-5 rounded-full bg-[#3C1E1E] text-[#FEE500] font-black text-[10px] flex items-center justify-center">
                  talk
                </span>
                <span>카카오 계정으로 간편로그인</span>
              </button>

              {/* Naver Login Button */}
              <button
                type="button"
                onClick={() => handleSocialLogin("naver")}
                className="w-full py-2.5 px-4 rounded-lg bg-[#03C75A] hover:bg-[#02b150] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors"
              >
                <span className="w-5 h-5 rounded bg-white text-[#03C75A] font-black text-[11px] flex items-center justify-center">
                  N
                </span>
                <span>네이버 계정으로 간편로그인</span>
              </button>

              <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[10.5px] text-slate-500 space-y-0.5">
                <p>✓ 최초 1회 로그인 시 회사 상호와 자동 매칭됩니다.</p>
                <p>✓ 로그인 즉시 우리 회사 과거 주문 내역이 안전하게 열립니다.</p>
              </div>
            </div>
          )}

          {/* TAB 3: Company Name + Password Login */}
          {tab === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  업체명(상호) 또는 회원 아이디 *
                </label>
                <input
                  type="text"
                  value={pwdCompany}
                  onChange={(e) => setPwdCompany(e.target.value)}
                  placeholder="예: (주)코아스인테리어"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#FF7B00]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력 (체험 시 엔터 가능)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#FF7B00]"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-3 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
              >
                <Lock className="w-4 h-4 text-[#FF7B00]" />
                <span>업체 아이디·비밀번호 로그인</span>
              </button>
            </form>
          )}

          {/* Quick Demo Switcher */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block mb-1.5">
              💡 빠른 체험 계정 전환 (원클릭 테스트):
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handleQuickDemoLogin(
                    "(주)코아스인테리어",
                    "010-1234-5678",
                    "김담당 실장",
                  )
                }
                className="flex-1 py-1 px-1.5 rounded bg-orange-50 hover:bg-orange-100 border border-orange-300 text-orange-900 text-[10.5px] font-bold truncate cursor-pointer transition-colors"
              >
                코아스인테리어 (2건)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickDemoLogin(
                    "한샘인테리어 디자인",
                    "010-9876-5432",
                    "박과장",
                  )
                }
                className="flex-1 py-1 px-1.5 rounded bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-900 text-[10.5px] font-bold truncate cursor-pointer transition-colors"
              >
                한샘인테리어 (1건)
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
