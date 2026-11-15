import { useState, useEffect } from "react";

export interface BuyerSession {
  isAuthenticated: boolean;
  companyName: string;
  bizNumber?: string;
  contactName: string;
  phone: string;
  email?: string;
  deliveryAddress?: string;
  shippingMethod?: "화물" | "택배" | "방문수령";
  loginMethod?: "biz_phone" | "social_kakao" | "social_naver" | "password";
  loggedInAt?: string;
}

export const STORAGE_BUYER_SESSION_KEY = "coas_buyer_session_v1";

export const PRESET_BUYERS: BuyerSession[] = [
  {
    isAuthenticated: true,
    companyName: "(주)코아스인테리어",
    bizNumber: "123-45-67890",
    contactName: "김담당 실장",
    phone: "010-1234-5678",
    email: "coas_order@interior.co.kr",
    deliveryAddress: "경기도 화성시 동탄첨단산업1로 27, A동 302호",
    shippingMethod: "화물",
    loginMethod: "social_kakao",
  },
  {
    isAuthenticated: true,
    companyName: "한샘인테리어 디자인",
    bizNumber: "214-88-12345",
    contactName: "박과장",
    phone: "010-9876-5432",
    email: "hanssem_buyer@interior.com",
    deliveryAddress: "서울시 강남구 테헤란로 152 한샘빌딩 5층 자재부",
    shippingMethod: "화물",
    loginMethod: "biz_phone",
  },
  {
    isAuthenticated: true,
    companyName: "영림도어 하드웨어",
    bizNumber: "110-81-99887",
    contactName: "이소장",
    phone: "010-5555-7777",
    email: "younglim_hw@hardware.kr",
    deliveryAddress: "인천광역시 서구 원창동 382-1 물류센터",
    shippingMethod: "택배",
    loginMethod: "biz_phone",
  },
];

export const DEFAULT_DEMO_BUYER: BuyerSession = PRESET_BUYERS[0];

export function findBuyerByPhone(phone: string): BuyerSession | undefined {
  const clean = phone.replace(/[^0-9]/g, "");
  return PRESET_BUYERS.find((b) => b.phone.replace(/[^0-9]/g, "") === clean);
}

export function getBuyerSession(): BuyerSession {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, companyName: "", contactName: "", phone: "" };
  }
  try {
    const raw = localStorage.getItem(STORAGE_BUYER_SESSION_KEY);
    if (!raw) {
      // By default, initialize with demo logged-in session so user can immediately experience company history
      localStorage.setItem(
        STORAGE_BUYER_SESSION_KEY,
        JSON.stringify(DEFAULT_DEMO_BUYER),
      );
      return DEFAULT_DEMO_BUYER;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
    return { isAuthenticated: false, companyName: "", contactName: "", phone: "" };
  } catch {
    return { isAuthenticated: false, companyName: "", contactName: "", phone: "" };
  }
}

export function setBuyerSession(session: BuyerSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_BUYER_SESSION_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent("coas-buyer-session-change", { detail: session }));
  } catch {}
}

export function logoutBuyerSession(): BuyerSession {
  const empty: BuyerSession = {
    isAuthenticated: false,
    companyName: "",
    bizNumber: "",
    contactName: "",
    phone: "",
    email: "",
    deliveryAddress: "",
    shippingMethod: "화물",
  };
  setBuyerSession(empty);
  return empty;
}

export function openBuyerAuthModal(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-buyer-auth-modal"));
  }
}

export function useBuyerAuth() {
  const [session, setSessionState] = useState<BuyerSession>(() => getBuyerSession());

  useEffect(() => {
    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent<BuyerSession>;
      if (customEvent.detail) {
        setSessionState(customEvent.detail);
      } else {
        setSessionState(getBuyerSession());
      }
    };
    window.addEventListener("coas-buyer-session-change", handleAuthChange);
    return () => window.removeEventListener("coas-buyer-session-change", handleAuthChange);
  }, []);

  return {
    session,
    isAuthenticated: !!session.isAuthenticated && !!session.companyName,
    companyName: session.companyName,
    contactName: session.contactName,
    phone: session.phone,
    login: (newSession: BuyerSession) => setBuyerSession(newSession),
    logout: () => logoutBuyerSession(),
    openLoginModal: () => openBuyerAuthModal(),
  };
}
