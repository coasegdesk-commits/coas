import type { OrderLineItem } from "@shared/cms-types";

export interface OrderHistoryRecord {
  id: string;
  orderNumber: string;
  orderDate: string; // YYYY-MM-DD
  companyName: string;
  contactName: string;
  phone: string;
  email?: string;
  deliveryAddress?: string;
  shippingMethod?: "화물" | "택배" | "방문수령";
  desiredDate?: string;
  memo?: string;
  items: OrderLineItem[];
  itemCount: number;
  totalQuantity: number;
  summary: string;
  isFavorite?: boolean;
  createdAt: string;
}

export const STORAGE_ORDER_HISTORY_KEY = "coas_order_history_v1";

// Initial realistic seed history so user immediately sees rich, functional data
export const SEED_ORDER_HISTORY: OrderHistoryRecord[] = [
  {
    id: "hist-seed-1",
    orderNumber: "ORD-20261110-0914",
    orderDate: "2026-11-10",
    companyName: "(주)코아스인테리어",
    contactName: "김담당 실장",
    phone: "010-1234-5678",
    email: "example@company.com",
    deliveryAddress: "경기도 화성시 동탄첨단산업1로 27, A동 302호",
    shippingMethod: "화물",
    desiredDate: "2026-11-12",
    memo: "11/12 오전 화물 발송 부탁드립니다. 현장 도착 전 김실장 연락 필수.",
    items: [
      {
        productId: "p-sd-60",
        productName: "60kg(SD) 슬라이딩도어 하드웨어",
        spec: "기본 세트",
        color: "기본",
        unit: "SET",
        quantity: "8",
        note: "안방 중문용",
      },
      {
        productId: "p-sl-3332",
        productName: "SL-3332 알루미늄 상부 레일",
        spec: "3,000mm",
        color: "실버",
        unit: "EA",
        quantity: "4",
        note: "3M 원장 재단 없이 출고",
      },
      {
        productId: "p-dp-80",
        productName: "80kg(SD) 슬라이딩도어 댐퍼 세트",
        spec: "양방향 댐핑",
        color: "실버",
        unit: "SET",
        quantity: "4",
        note: "거실 포켓도어",
      },
    ],
    itemCount: 3,
    totalQuantity: 16,
    summary: "60kg(SD) 8SET, SL-3332 레일 4EA, 80kg 댐퍼 4SET",
    isFavorite: true,
    createdAt: "2026-11-10T09:14:00.000Z",
  },
  {
    id: "hist-seed-2",
    orderNumber: "ORD-20261104-1422",
    orderDate: "2026-11-04",
    companyName: "(주)코아스인테리어",
    contactName: "김담당 실장",
    phone: "010-1234-5678",
    email: "example@company.com",
    deliveryAddress: "서울시 강남구 테헤란로 152 강남파이낸스센터 18층",
    shippingMethod: "택배",
    desiredDate: "2026-11-06",
    memo: "로젠택배 또는 경동택배 발송 요망",
    items: [
      {
        productId: "p-m80",
        productName: "M-80 슬라이딩 댐핑 폴딩 하드웨어",
        spec: "기본 세트",
        color: "블랙",
        unit: "SET",
        quantity: "6",
        note: "회의실 폴딩도어",
      },
      {
        productId: "p-sl-3332",
        productName: "SL-3332 알루미늄 상부 레일",
        spec: "2,000mm",
        color: "블랙",
        unit: "EA",
        quantity: "3",
        note: "2M 절단",
      },
    ],
    itemCount: 2,
    totalQuantity: 9,
    summary: "M-80 폴딩 6SET, SL-3332 레일 3EA",
    isFavorite: false,
    createdAt: "2026-11-04T14:22:00.000Z",
  },
  {
    id: "hist-seed-3",
    orderNumber: "ORD-20261028-1108",
    orderDate: "2026-10-28",
    companyName: "한샘인테리어 디자인",
    contactName: "박과장",
    phone: "010-9876-5432",
    email: "park@hanssem-partner.com",
    deliveryAddress: "인천광역시 남동구 남동서로 205",
    shippingMethod: "화물",
    desiredDate: "2026-10-30",
    memo: "하차지 지게차 대기 중",
    items: [
      {
        productId: "p-sd-150",
        productName: "150kg(SD) 중량형 슬라이딩도어",
        spec: "강화 세트",
        color: "실버",
        unit: "SET",
        quantity: "12",
        note: "복도 슬라이딩 도어",
      },
      {
        productId: "p-sd-250",
        productName: "250kg(SD) 특중량 슬라이딩도어",
        spec: "특수 베어링",
        color: "실버",
        unit: "SET",
        quantity: "4",
        note: "메인 현관문",
      },
    ],
    itemCount: 2,
    totalQuantity: 16,
    summary: "150kg 중량형 12SET, 250kg 특중량 4SET",
    isFavorite: true,
    createdAt: "2026-10-28T11:08:00.000Z",
  },
];

export function loadOrderHistory(): OrderHistoryRecord[] {
  if (typeof window === "undefined") return SEED_ORDER_HISTORY;
  try {
    const raw = localStorage.getItem(STORAGE_ORDER_HISTORY_KEY);
    if (!raw) {
      // Initialize with seed data
      localStorage.setItem(
        STORAGE_ORDER_HISTORY_KEY,
        JSON.stringify(SEED_ORDER_HISTORY),
      );
      return SEED_ORDER_HISTORY;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SEED_ORDER_HISTORY;
  } catch {
    return SEED_ORDER_HISTORY;
  }
}

export function saveOrderHistory(list: OrderHistoryRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_ORDER_HISTORY_KEY,
      JSON.stringify(list.slice(0, 100)),
    );
  } catch {}
}

export function addOrderHistoryRecord(
  record: Omit<OrderHistoryRecord, "id" | "createdAt">,
): OrderHistoryRecord[] {
  const current = loadOrderHistory();
  const newRecord: OrderHistoryRecord = {
    ...record,
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newRecord, ...current].slice(0, 100);
  saveOrderHistory(updated);
  return updated;
}

export function deleteOrderHistoryRecord(id: string): OrderHistoryRecord[] {
  const current = loadOrderHistory();
  const updated = current.filter((r) => r.id !== id);
  saveOrderHistory(updated);
  return updated;
}

export function toggleOrderHistoryFavorite(id: string): OrderHistoryRecord[] {
  const current = loadOrderHistory();
  const updated = current.map((r) =>
    r.id === id ? { ...r, isFavorite: !r.isFavorite } : r,
  );
  saveOrderHistory(updated);
  return updated;
}
