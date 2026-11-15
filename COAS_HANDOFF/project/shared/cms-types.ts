export interface CmsProduct {
  id: string;
  name: string;
  nameKo: string;
  category: string;
  categoryKo: string;
  description: string | null;
  descriptionKo: string | null;
  specifications: string | null;
  weightCapacity: string | null;
  pageNumber: string | null;
  imageUrl: string | null;
  detailImages: string[];
  searchText: string | null;
}

export interface NewProductItem {
  id: string;
  productId: string;
  name: string;
  desc: string;
  image: string;
  wide: boolean;
  baseScale: number;
  hoverScale: number;
  showBadge: boolean;
  visible: boolean;
  showInNav: boolean;
  order: number;
}

export interface PartCardItem {
  id: string;
  productId: string;
  name: string;
  subtitle?: string;
  page?: string;
  image: string;
  wide?: boolean;
  rowGroup?: number;
  visible: boolean;
}

export interface PartsSection {
  id: string;
  title: string;
  showHeader: boolean;
  headerColor: "dark" | "orange" | "slate";
  columns: 4 | 5;
  visible: boolean;
  order: number;
  items: PartCardItem[];
}

export interface SidebarSubItem {
  id: string;
  label: string;
  href: string;
}

export interface SidebarFilterCategory {
  id: string;
  title: string;
  expanded?: boolean;
  subItems: SidebarSubItem[];
}

export interface HomeCategoryCard {
  id: string;
  title: string;
  desc: string;
  image: string;
  href: string;
}

export interface HomeFeaturedProduct {
  id: string;
  productId: string;
  name: string;
  page: string;
  image: string;
}

export interface SiteDesignSettings {
  company: {
    name: string;
    logoUrl: string;
    phone: string;
    email: string;
    address: string;
    businessHours: string;
    footerDesc: string;
  };
  hero: {
    badgeText: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    bgImageUrl: string;
    overlayOpacity: number;
    primaryBtnText: string;
    primaryBtnHref: string;
    orderBtnText: string;
    orderBtnHref: string;
  };
  categoriesSectionTitle: string;
  categoriesSectionSubtitle: string;
  categories: HomeCategoryCard[];
  featuredSectionTitle: string;
  featuredProducts: HomeFeaturedProduct[];
  ecatalog: {
    title: string;
    description: string;
    pdfUrl: string | null;
    pdfFileName: string | null;
    previewImages: string[];
    requireInfoForDownload: boolean;
  };
}

export type SubmissionStatus = "new" | "in_progress" | "completed";

export interface CatalogRequestRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  catalogType: string;
  status: SubmissionStatus;
  adminMemo: string;
  createdAt: string;
}

export interface InquiryRecord {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: SubmissionStatus;
  adminMemo: string;
  createdAt: string;
}

export interface OrderLineItem {
  productId?: string;
  productName: string;
  spec: string;
  color?: string;
  unit?: string;
  quantity: string;
  unitPrice?: number;
  amount?: number;
  note: string;
}

export interface OrderAttachment {
  name: string;
  url: string;
  size: number;
}

export type ShippingStatus = "pending" | "packed" | "shipped" | "delivered";

export interface OrderRecord {
  id: string;
  orderNumber: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  desiredDate: string;
  doorType?: DoorMaterialType;
  items: OrderLineItem[];
  attachments: OrderAttachment[];
  memo: string;
  status: SubmissionStatus;
  adminMemo: string;
  shippingMethod?: "화물" | "택배" | "방문수령" | "용차";
  shippingCarrier?: string;
  trackingNumber?: string;
  shippingStatus?: ShippingStatus;
  shippedAt?: string;
  totalAmount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface DailyDispatchSummary {
  date: string;
  totalOrders: number;
  pendingOrders: number;
  packedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  byMethod: {
    freight: number;
    courier: number;
    direct: number;
    pickup: number;
  };
  pickingList: Array<{
    productName: string;
    spec: string;
    totalQuantity: number;
    unit: string;
  }>;
  orders: OrderRecord[];
}

export interface AccountRevenueRecord {
  companyName: string;
  bizNumber?: string;
  contactName: string;
  phone: string;
  deliveryAddress: string;
  shippingMethod: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  lastOrderDate: string;
  pendingCount: number;
  topProducts: string[];
  orders: OrderRecord[];
}

export interface RevenueKpiSummary {
  period: "daily" | "weekly" | "monthly" | "yearly" | "all";
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  shippedRate: number;
  revenueGrowthRate: number;
  orderGrowthRate: number;
  trend: Array<{
    periodKey: string;
    label: string;
    revenue: number;
    orderCount: number;
  }>;
  topAccounts: Array<{
    name: string;
    revenue: number;
    orderCount: number;
    percentage: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
}

export interface MediaItem {
  id: string;
  fileName: string;
  originalName: string;
  url: string;
  folder: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface UserManualItem {
  id: string;
  title: string;
  category: string;
  description: string;
  version?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileExt: string;
  downloadCount: number;
  visible: boolean;
  order: number;
  uploadedAt: string;
  updatedAt?: string;
}

export interface CmsBootstrapPayload {
  design: SiteDesignSettings;
  newProducts: NewProductItem[];
  partsSections: PartsSection[];
  sidebarFilters: SidebarFilterCategory[];
  manuals?: UserManualItem[];
}

export interface CmsStoreData {
  version: number;
  adminPasswordHash: string;
  design: SiteDesignSettings;
  products: CmsProduct[];
  newProducts: NewProductItem[];
  partsSections: PartsSection[];
  sidebarFilters: SidebarFilterCategory[];
  catalogRequests: CatalogRequestRecord[];
  inquiries: InquiryRecord[];
  orders: OrderRecord[];
  media: MediaItem[];
  manuals?: UserManualItem[];
}

export type DoorMaterialType = "wood" | "glass";

export type RecommendationSourceTier =
  | "admin_designated"
  | "verified_shipment"
  | "catalog_compatible";

export type AdminAffinityAction =
  | "pin"
  | "unpin"
  | "toggle_pin"
  | "exclude"
  | "unexclude"
  | "toggle_exclude"
  | "reset_order_count";

export interface PartAffinityRecord {
  pairKey: string; // `${anchorId}::${doorType}::${targetId}`
  anchorId: string;
  targetId: string;
  doorType: DoorMaterialType;
  cartCount: number;
  orderCount: number;
  pinned: boolean;
  excluded: boolean;
  updatedAt: string;
}

export interface PartAffinitySnapshot {
  connected: boolean;
  totalLearnedOrders: number;
  learnedOrderIds: string[];
  records: PartAffinityRecord[];
}

export interface B2BStaffContact {
  id: string;
  name: string;
  phone: string;
  role?: string;
  isPrimary?: boolean;
  createdAt: string;
}

export interface B2BCompanyProfile {
  id: string;
  companyName: string;
  bizNumber: string;
  deliveryAddress: string;
  shippingMethod: "화물" | "택배" | "방문수령";
  memo?: string;
  staffContacts: B2BStaffContact[];
  useCount?: number;
  updatedAt: string;
}

export interface B2BAuthLog {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  loginMethod: string;
  status: "success" | "fail";
  loggedAt: string;
}

export interface StockAdjustmentLog {
  id: string;
  type: "inbound" | "outbound" | "adjustment";
  quantity: number; // 변동 수량 (입고 시 +, 출고/폐기 시 -, 조정 시 변경 차이)
  previousStock: number;
  newStock: number;
  reason: string; // 예: "신규 공장 입고", "발주 출고", "파손 폐기", "정기 재고실사 차이조정"
  operator: string; // 담당자명 (예: "물류팀장", "시스템자동")
  timestamp: string;
}

export interface InventoryItem {
  id: string;
  sku: string; // 바코드/관리코드 (예: "COAS-SL-060")
  productName: string; // 제품명 (예: "60kg(SD)")
  category: string; // 슬라이딩, 댐퍼, 원바디, 유리, 레일/부속 등
  spec: string; // 규격 (예: "목문용 상부 롤러 세트")
  unit: string; // 단위 (SET, EA, M 등)
  currentStock: number; // 현재 실재고 수량
  safetyStock: number; // 적정/안전 재고 수량
  incomingStock: number; // 입고 예정 수량
  outgoingStock: number; // 출고 대기 수량
  unitCost: number; // 매입 원가 (원)
  sellingPrice: number; // 공급 단가 (원)
  warehouseLocation: string; // 적치 위치 (예: "A동 1열-03")
  status: "in_stock" | "low_stock" | "out_of_stock"; // 정상, 안전재고미달(위험), 품절
  lastStockUpdated: string; // 최근 변동 일시
  history: StockAdjustmentLog[];
}

export interface InventorySummary {
  totalItems: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalAssetValuation: number; // 총 재고 평가액 (currentStock * unitCost)
  items: InventoryItem[];
}

