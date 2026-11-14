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

export const DEFAULT_DEMO_BUYER: BuyerSession = {
  isAuthenticated: true,
  companyName: "(주)코아스인테리어",
  bizNumber: "123-45-67890",
  contactName: "김담당 실장",
  phone: "010-1234-5678",
  email: "example@company.com",
  deliveryAddress: "경기도 화성시 동탄첨단산업1로 27, A동 302호",
  shippingMethod: "화물",
  loginMethod: "biz_phone",
  loggedInAt: new Date().toISOString(),
};

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
