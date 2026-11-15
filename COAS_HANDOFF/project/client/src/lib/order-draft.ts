import { useState, useEffect, useCallback } from "react";
import type { OrderAttachment, OrderLineItem } from "@shared/cms-types";

export const MIN_ORDER_ROW_COUNT = 10;
export const INITIAL_ORDER_ROW_COUNT = 20;
const STORAGE_KEY = "coas_order_draft_v1";
const CHANGE_EVENT = "coas-order-draft-change";

export interface OrderDraftState {
  activeSession: boolean;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  desiredDate: string;
  shippingMethod: "화물" | "택배" | "방문수령";
  memo: string;
  items: OrderLineItem[];
  attachments: OrderAttachment[];
  updatedAt: string;
  unitOrderV2?: boolean;
  initialV20?: boolean;
}

export function sanitizeSpecification(
  rawSpec: string | null | undefined,
): string {
  if (!rawSpec) return "";
  let s = rawSpec.trim();
  // "주문제작 가능", "주문 규격", "표준 규격" 등 안내/표시 사항 제거 -> 제품 사양 실제 규격만 유지
  s = s
    .replace(/,\s*주문제작\s*가능/gi, "")
    .replace(/주문제작\s*가능/gi, "")
    .replace(/주문\s*제작\s*가능/gi, "")
    .replace(/,\s*주문제작/gi, "")
    .replace(/주문제작/gi, "")
    .replace(/^주문\s*규격$/gi, "")
    .replace(/^표준\s*규격$/gi, "")
    .trim();
  s = s.replace(/^[,/\s\-|]+|[,/\s\-|]+$/g, "").trim();
  return s;
}

export function createEmptyOrderRow(
  overrides?: Partial<OrderLineItem>,
): OrderLineItem {
  return {
    productId: undefined,
    productName: "",
    spec: "",
    color: "",
    unit: "EA",
    quantity: "",
    note: "",
    ...overrides,
  };
}

export function createInitialOrderRows(
  count = INITIAL_ORDER_ROW_COUNT,
): OrderLineItem[] {
  return Array.from({ length: count }, () => createEmptyOrderRow());
}

export function createDefaultOrderDraft(): OrderDraftState {
  return {
    activeSession: false,
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    deliveryAddress: "",
    desiredDate: "",
    shippingMethod: "화물",
    memo: "",
    items: createInitialOrderRows(INITIAL_ORDER_ROW_COUNT),
    attachments: [],
    updatedAt: new Date().toISOString(),
    unitOrderV2: true,
    initialV20: true,
  };
}

export function loadOrderDraft(): OrderDraftState {
  if (typeof window === "undefined") {
    return createDefaultOrderDraft();
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultOrderDraft();
    const parsed = JSON.parse(raw) as Partial<OrderDraftState>;
    const needsUnitMigration = !parsed.unitOrderV2;
    const initialV20Applied = Boolean(parsed.initialV20);
    let items =
      Array.isArray(parsed.items) && parsed.items.length > 0
        ? parsed.items.map((r) => {
            const normalized = createEmptyOrderRow(r);
            const isCompletelyEmpty =
              !normalized.productId &&
              !normalized.productName.trim() &&
              !normalized.spec.trim() &&
              !(normalized.color || "").trim() &&
              !normalized.quantity.trim() &&
              !normalized.note.trim();
            if (
              needsUnitMigration &&
              isCompletelyEmpty &&
              normalized.unit === "SET"
            ) {
              normalized.unit = "EA";
            }
            normalized.spec = sanitizeSpecification(normalized.spec);
            return normalized;
          })
        : createInitialOrderRows(INITIAL_ORDER_ROW_COUNT);

    // If user's stored draft was previously the old 15 empty rows, upgrade to 20 rows
    if (!initialV20Applied) {
      const allEmpty = items.every(
        (r) =>
          !r.productId &&
          !r.productName.trim() &&
          !r.spec.trim() &&
          !r.quantity.trim() &&
          !r.note.trim(),
      );
      if (allEmpty && items.length < INITIAL_ORDER_ROW_COUNT) {
        items = createInitialOrderRows(INITIAL_ORDER_ROW_COUNT);
      }
    }

    while (items.length < INITIAL_ORDER_ROW_COUNT) {
      items.push(createEmptyOrderRow());
    }
    return {
      activeSession: Boolean(parsed.activeSession),
      companyName: parsed.companyName || "",
      contactName: parsed.contactName || "",
      phone: formatKoreanPhoneNumber(parsed.phone || ""),
      email: parsed.email || "",
      deliveryAddress: parsed.deliveryAddress || "",
      desiredDate: parsed.desiredDate || "",
      shippingMethod:
        parsed.shippingMethod === "택배" || parsed.shippingMethod === "방문수령"
          ? parsed.shippingMethod
          : "화물",
      memo: parsed.memo || "",
      items,
      attachments: Array.isArray(parsed.attachments) ? parsed.attachments : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      unitOrderV2: true,
      initialV20: true,
    };
  } catch {
    return createDefaultOrderDraft();
  }
}

export function saveOrderDraft(draft: OrderDraftState): void {
  if (typeof window === "undefined") return;
  try {
    const next: OrderDraftState = {
      ...draft,
      unitOrderV2: true,
      initialV20: true,
      updatedAt: new Date().toISOString(),
    };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    // ignore storage quota errors
  }
}

export function clearOrderDraft(keepActiveSession = true): OrderDraftState {
  const fresh: OrderDraftState = {
    ...createDefaultOrderDraft(),
    activeSession: keepActiveSession,
  };
  saveOrderDraft(fresh);
  return fresh;
}

export function markOrderSessionActive(active = true): void {
  const current = loadOrderDraft();
  if (current.activeSession !== active) {
    saveOrderDraft({
      ...current,
      activeSession: active,
    });
  }
}

export function inferDefaultUnitAndSpec(
  code: string,
  title = "",
  specHint = "",
): { unit: "SET" | "EA"; color: string; spec: string } {
  const hay = `${code} ${title} ${specHint}`.toUpperCase();
  const isRailOrGuide =
    hay.includes("SL-") ||
    hay.includes("레일") ||
    hay.includes("커버") ||
    hay.includes("가이드") ||
    hay.includes("SD-01") ||
    hay.includes("SD-02");
  const unit: "SET" | "EA" = isRailOrGuide ? "EA" : "SET";
  const color = unit === "EA" ? "실버/기본" : "기본";
  const clean = sanitizeSpecification(specHint);
  const spec = clean || (unit === "SET" ? "기본 세트 구성" : "");
  return { unit, color, spec };
}

export function addItemToOrderDraft(input: {
  productId?: string;
  code: string;
  title?: string;
  spec?: string;
  unit?: "SET" | "EA";
  color?: string;
}): {
  rowIdx: number;
  qty: number;
  itemCount: number;
  displayFull: string;
} {
  const draft = loadOrderDraft();
  const code = input.code.trim();
  const title = (input.title || "").trim();
  const displayFull =
    title && title !== code ? `${code} (${title})` : code;

  const inferred = inferDefaultUnitAndSpec(code, title, input.spec || "");
  const unit = input.unit || inferred.unit;
  const color = input.color || inferred.color;
  const cleanInputSpec = sanitizeSpecification(input.spec);
  const spec = cleanInputSpec || inferred.spec;

  const nextItems = [...draft.items];

  const existingIdx = nextItems.findIndex((r) => {
    if (input.productId && r.productId && r.productId === input.productId) {
      return true;
    }
    const pName = r.productName.trim();
    return (
      pName === displayFull ||
      pName === code ||
      pName.startsWith(`${code} (`)
    );
  });

  let targetRowIdx = 0;
  let updatedQty = 1;

  if (existingIdx !== -1) {
    const curQty =
      parseInt(nextItems[existingIdx].quantity.replace(/[^0-9]/g, ""), 10) || 0;
    updatedQty = curQty + 1;
    nextItems[existingIdx] = {
      ...nextItems[existingIdx],
      productId: nextItems[existingIdx].productId || input.productId,
      quantity: String(updatedQty),
    };
    targetRowIdx = existingIdx;
  } else {
    const emptyIdx = nextItems.findIndex(
      (r) => !r.productId && !r.productName.trim(),
    );
    const newRow = createEmptyOrderRow({
      productId: input.productId,
      productName: displayFull,
      spec,
      color,
      unit,
      quantity: "1",
    });
    if (emptyIdx !== -1) {
      nextItems[emptyIdx] = newRow;
      targetRowIdx = emptyIdx;
    } else {
      targetRowIdx = nextItems.length;
      nextItems.push(newRow);
    }
  }

  const nextDraft: OrderDraftState = {
    ...draft,
    activeSession: true,
    items: nextItems,
  };
  saveOrderDraft(nextDraft);

  const itemCount = nextItems.filter((r) => r.productName.trim().length > 0)
    .length;

  return {
    rowIdx: targetRowIdx,
    qty: updatedQty,
    itemCount,
    displayFull,
  };
}

export function useOrderDraftSummary() {
  const [draft, setDraft] = useState<OrderDraftState>(() => loadOrderDraft());

  useEffect(() => {
    const sync = () => {
      setDraft(loadOrderDraft());
    };
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const validItems = draft.items.filter((r) => r.productName.trim().length > 0);
  const itemCount = validItems.length;
  const totalQty = validItems.reduce((acc, r) => {
    const n = parseFloat(String(r.quantity || "").replace(/[^0-9.]/g, ""));
    return acc + (Number.isNaN(n) ? 0 : n);
  }, 0);

  const getItemQty = useCallback(
    (code: string, title?: string): number => {
      const cleanCode = code.trim();
      const cleanTitle = (title || "").trim();
      const displayFull =
        cleanTitle && cleanTitle !== cleanCode
          ? `${cleanCode} (${cleanTitle})`
          : cleanCode;

      let sum = 0;
      for (const r of draft.items) {
        const pName = r.productName.trim();
        if (!pName) continue;
        if (
          pName === displayFull ||
          pName === cleanCode ||
          pName.startsWith(`${cleanCode} (`)
        ) {
          const q =
            parseFloat(String(r.quantity || "").replace(/[^0-9.]/g, "")) || 1;
          sum += q;
        }
      }
      return sum;
    },
    [draft.items],
  );

  return {
    draft,
    itemCount,
    totalQty,
    hasActiveSession: draft.activeSession || itemCount > 0,
    getItemQty,
    addItem: addItemToOrderDraft,
    dismissSession: () => markOrderSessionActive(false),
  };
}

export interface SavedBuyerProfile {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  shippingMethod: "화물" | "택배" | "방문수령";
  updatedAt: string;
  useCount: number;
}

const BUYER_PROFILES_KEY = "coas_buyer_profiles_v1";

export function loadBuyerProfiles(): SavedBuyerProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BUYER_PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => p && typeof p.companyName === "string" && p.companyName.trim())
      .slice(0, 20);
  } catch {
    return [];
  }
}

function persistBuyerProfiles(list: SavedBuyerProfile[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BUYER_PROFILES_KEY, JSON.stringify(list.slice(0, 20)));
  } catch {}
}

export function formatKoreanPhoneNumber(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "").slice(0, 12);
  if (!digits) return "";

  // Seoul 02: 02-XXX-XXXX (9) or 02-XXXX-XXXX (10)
  if (digits.startsWith("02")) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    }
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }

  // Representative numbers: 15XX-XXXX, 16XX-XXXX, 18XX-XXXX
  if (/^1[568]/.test(digits)) {
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}`;
  }

  // 12-digit 050X numbers (e.g. 0505-1234-5678)
  if (digits.startsWith("050") && digits.length === 12) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
  }

  // Mobile / regional / 070 / 080 (up to 11 digits)
  const d = digits.slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 10) {
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

export function upsertBuyerProfile(
  profile: Omit<SavedBuyerProfile, "id" | "updatedAt" | "useCount">,
): SavedBuyerProfile[] {
  const cleanCompany = profile.companyName.trim();
  if (!cleanCompany) return loadBuyerProfiles();
  const cleanContact = profile.contactName.trim();
  const cleanPhone = formatKoreanPhoneNumber(profile.phone);
  const existing = loadBuyerProfiles();

  const matchKey = `${cleanCompany.toLowerCase()}::${cleanPhone.replace(/[^0-9]/g, "")}`;
  const idx = existing.findIndex(
    (p) =>
      `${p.companyName.trim().toLowerCase()}::${p.phone.replace(/[^0-9]/g, "")}` ===
      matchKey,
  );

  const now = new Date().toISOString();
  let next: SavedBuyerProfile[];
  if (idx !== -1) {
    const prev = existing[idx];
    const updated: SavedBuyerProfile = {
      ...prev,
      companyName: cleanCompany,
      contactName: cleanContact || prev.contactName,
      phone: cleanPhone || prev.phone,
      email: profile.email.trim() || prev.email,
      deliveryAddress: profile.deliveryAddress.trim() || prev.deliveryAddress,
      shippingMethod: profile.shippingMethod || prev.shippingMethod,
      updatedAt: now,
      useCount: (prev.useCount || 1) + 1,
    };
    next = [updated, ...existing.filter((_, i) => i !== idx)];
  } else {
    const created: SavedBuyerProfile = {
      id: `bp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      companyName: cleanCompany,
      contactName: cleanContact,
      phone: cleanPhone,
      email: profile.email.trim(),
      deliveryAddress: profile.deliveryAddress.trim(),
      shippingMethod: profile.shippingMethod || "화물",
      updatedAt: now,
      useCount: 1,
    };
    next = [created, ...existing];
  }

  persistBuyerProfiles(next);
  return next.slice(0, 20);
}

export function deleteBuyerProfile(id: string): SavedBuyerProfile[] {
  const next = loadBuyerProfiles().filter((p) => p.id !== id);
  persistBuyerProfiles(next);
  return next;
}

export function mergeAndSaveBuyerProfiles(
  remoteList: SavedBuyerProfile[],
): SavedBuyerProfile[] {
  const map = new Map<string, SavedBuyerProfile>();
  const keyOf = (p: SavedBuyerProfile) =>
    `${p.companyName.trim().toLowerCase()}::${p.phone.replace(/[^0-9]/g, "")}`;

  for (const item of [...loadBuyerProfiles(), ...remoteList]) {
    if (!item?.companyName?.trim()) continue;
    const k = keyOf(item);
    const prev = map.get(k);
    if (!prev || String(item.updatedAt || "") >= String(prev.updatedAt || "")) {
      map.set(k, item);
    }
  }

  const merged = Array.from(map.values())
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))
    .slice(0, 20);
  persistBuyerProfiles(merged);
  return merged;
}

export interface ParsedSmartBuyer {
  companyName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  deliveryAddress?: string;
}

/**
 * Parses KakaoTalk / SMS / spreadsheet-copied multi-field buyer lines like:
 * "(주)코아스인테리어 / 김철수 과장 / 010-1234-5678 / 경기도 화성시 OO동 123"
 */
export function parseSmartBuyerPaste(rawText: string): ParsedSmartBuyer | null {
  const text = rawText.trim();
  if (!text) return null;

  const phoneMatch = text.match(
    /(?:01[016789]|02|0[3-9][0-9])[-.\s]?\d{3,4}[-.\s]?\d{4}/,
  );
  const emailMatch = text.match(
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  );
  const rawTokens = text
    .split(/[\n\r/\t|]+/)
    .map((t) =>
      t
        .replace(
          /^(업체명|상호|발주처|거래처|담당자|담당|연락처|전화번호|전화|휴대폰|이메일|메일|납품주소|배송주소|주소)\s*[:：]\s*/i,
          "",
        )
        .trim(),
    )
    .filter(Boolean);

  if (rawTokens.length < 2 && !phoneMatch && !emailMatch) {
    return null;
  }

  const result: ParsedSmartBuyer = {};
  if (phoneMatch) result.phone = formatKoreanPhoneNumber(phoneMatch[0]);
  if (emailMatch) result.email = emailMatch[0];

  const remaining = rawTokens.filter((tok) => {
    if (phoneMatch && tok.includes(phoneMatch[0])) {
      const stripped = tok.replace(phoneMatch[0], "").trim();
      return stripped.length > 0;
    }
    if (emailMatch && tok.includes(emailMatch[0])) {
      const stripped = tok.replace(emailMatch[0], "").trim();
      return stripped.length > 0;
    }
    return true;
  });

  for (const tok of remaining) {
    const cleanTok = tok
      .replace(phoneMatch?.[0] || "", "")
      .replace(emailMatch?.[0] || "", "")
      .trim();
    if (!cleanTok) continue;

    const looksAddress =
      /(시|도|군|구|동|읍|면|로|길|번지|지점|영업소|화물|아파트|빌딩|호|층)(\s|\d|$)/.test(
        cleanTok,
      ) && cleanTok.length >= 6;
    const looksContact =
      /(실장|과장|대리|부장|팀장|소장|차장|대표|이사|사원|님)$/.test(cleanTok) ||
      (/^[가-힣]{2,4}$/.test(cleanTok) && Boolean(result.companyName));

    if (!result.deliveryAddress && looksAddress && result.companyName) {
      result.deliveryAddress = cleanTok;
    } else if (!result.companyName && !looksAddress) {
      result.companyName = cleanTok;
    } else if (!result.contactName && looksContact) {
      result.contactName = cleanTok;
    } else if (!result.deliveryAddress && cleanTok.length >= 8) {
      result.deliveryAddress = cleanTok;
    } else if (!result.companyName) {
      result.companyName = cleanTok;
    }
  }

  const filledCount = Object.values(result).filter(Boolean).length;
  return filledCount >= 2 ? result : null;
}
