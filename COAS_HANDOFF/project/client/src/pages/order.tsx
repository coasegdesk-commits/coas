import React, { useState, useEffect, useMemo, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Minus,
  Upload,
  CheckCircle2,
  Paperclip,
  Loader2,
  ArrowLeft,
  Printer,
  RotateCcw,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ClipboardPaste,
  X,
  PanelLeftOpen,
  PanelLeftClose,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  FileText,
  Grid,
  Sparkles,
  FileSpreadsheet,
  ArrowLeftRight,
  Lock,
  Maximize2,
  Download,
  SlidersHorizontal,
  Save,
  Building2,
  Trash2,
  Pin,
  Check,
  ShieldCheck,
  Star,
  History,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  adminFetch,
  getAdminToken,
  resolveAssetUrl,
  setAdminToken,
  uploadOrderAttachment,
  useCmsBootstrap,
} from "@/lib/cms";
import {
  MIN_ORDER_ROW_COUNT,
  INITIAL_ORDER_ROW_COUNT,
  createEmptyOrderRow,
  createInitialOrderRows,
  loadOrderDraft,
  saveOrderDraft,
  clearOrderDraft,
  loadBuyerProfiles,
  upsertBuyerProfile,
  deleteBuyerProfile,
  mergeAndSaveBuyerProfiles,
  parseSmartBuyerPaste,
  formatKoreanPhoneNumber,
  sanitizeSpecification,
  type SavedBuyerProfile,
} from "@/lib/order-draft";
import { LayoutPresetManager } from "@/components/order/LayoutPresetManager";
import { OrderHistoryDrawer } from "@/components/order/OrderHistoryDrawer";
import { BuyerAuthModal } from "@/components/order/BuyerAuthModal";
import {
  type OrderLayoutPreset,
  loadAllPresets,
  saveCustomPresets,
  setDefaultPresetId,
  MAX_CUSTOM_PRESETS,
} from "@/lib/order-presets";
import {
  type OrderHistoryRecord,
  addOrderHistoryRecord,
} from "@/lib/order-history";
import {
  type BuyerSession,
  getBuyerSession,
  setBuyerSession,
  logoutBuyerSession,
} from "@/lib/order-auth";
import type {
  AdminAffinityAction,
  CmsProduct,
  DoorMaterialType,
  OrderAttachment,
  OrderLineItem,
  PartAffinityRecord,
  RecommendationSourceTier,
} from "@shared/cms-types";
import {
  classifySubPartRole,
  computeRelatedPartRecommendations,
  inferDefaultDoorType,
  isAnchorRollerItem,
  type RecommendedPartItem,
  type RecPartRole,
} from "@/lib/part-recommender";

interface QuickCatalogItem {
  id: string;
  code: string;
  title: string;
  specHint: string;
  page: string;
  categoryGroup: "sliding" | "damping" | "rail" | "glass";
  rawCategoryKo?: string;
  defaultUnit: "SET" | "EA";
  image?: string;
}

/**
 * Computes dynamic font-size (up to ~28% shrink) based on character weight vs column width
 * so overflowing text shrinks smoothly (20-30%) before wrapping cleanly onto 2-3 lines.
 */
function getDynamicCellTypography(
  text: string,
  colWidthPx: number,
  baseFontPx = 11.5,
): { fontSize: string; lineHeight: string } {
  const clean = text.trim();
  if (!clean) {
    return { fontSize: `${baseFontPx}px`, lineHeight: "1.35" };
  }
  let weight = 0;
  for (const ch of clean) {
    weight += /[\u3131-\uD79D]/.test(ch) ? 1.65 : 0.95;
  }
  const usablePx = Math.max(40, colWidthPx - 14);
  const estimatedPx = weight * (baseFontPx * 0.56);
  const ratio = estimatedPx / usablePx;

  if (ratio <= 1.0) {
    return { fontSize: `${baseFontPx}px`, lineHeight: "1.32" };
  }
  if (ratio <= 1.65) {
    // ~20% shrink (e.g., 11.5px -> 9.2px)
    return {
      fontSize: `${(baseFontPx * 0.8).toFixed(1)}px`,
      lineHeight: "1.25",
    };
  }
  // ~28% shrink (e.g., 11.5px -> 8.3px) for 2~3 line wrapping
  return {
    fontSize: `${(baseFontPx * 0.72).toFixed(1)}px`,
    lineHeight: "1.2",
  };
}

function splitCodeAndTitle(rawName: string): { code: string; title: string } {
  const trimmed = rawName.trim();
  if (!trimmed) return { code: "", title: "" };
  const match = trimmed.match(/^([^\s(]+)\s*\((.+)\)$/);
  if (match) {
    return { code: match[1].trim(), title: match[2].trim() };
  }
  return { code: trimmed, title: "" };
}

const ORDER_ATTACHMENT_ACCEPT =
  ".pdf,.dwg,.dxf,.dwf,.dwfx,.stp,.step,.igs,.iges,.stl,.3dm,.skp,.plt,.ai,.eps,.svg,.xlsx,.xls,.xlsm,.xlsb,.csv,.tsv,.ods,.json,.xml,.txt,.doc,.docx,.hwp,.hwpx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.bmp,.tif,.tiff,.heic,.zip,.7z,.rar,.tar,.gz";

function formatAttachmentSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAttachmentTypeMeta(name: string): {
  label: string;
  badgeClass: string;
} {
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (
    [
      "dwg",
      "dxf",
      "dwf",
      "dwfx",
      "stp",
      "step",
      "igs",
      "iges",
      "stl",
      "3dm",
      "skp",
      "plt",
      "ai",
      "eps",
    ].includes(ext)
  ) {
    return {
      label: "CAD도면",
      badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
    };
  }
  if (ext === "pdf") {
    return {
      label: "PDF",
      badgeClass: "bg-red-100 text-red-700 border-red-300",
    };
  }
  if (["xlsx", "xls", "xlsm", "xlsb", "csv", "tsv", "ods"].includes(ext)) {
    return {
      label: "엑셀/표",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    };
  }
  if (
    ["png", "jpg", "jpeg", "gif", "webp", "bmp", "tif", "tiff", "heic", "svg"].includes(
      ext,
    )
  ) {
    return {
      label: "이미지",
      badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
    };
  }
  if (["zip", "7z", "rar", "tar", "gz"].includes(ext)) {
    return {
      label: "압축파일",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    };
  }
  if (["hwp", "hwpx", "doc", "docx", "ppt", "pptx"].includes(ext)) {
    return {
      label: "문서",
      badgeClass: "bg-sky-100 text-sky-800 border-sky-300",
    };
  }
  return {
    label: "데이터",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
  };
}

interface AutoWrapCellProps {
  value: string;
  onChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  dataCell: string;
  colWidthPx: number;
  minHeightPx?: number;
  maxHeightPx?: number;
  placeholder?: string;
  className?: string;
}

function AutoWrapCell({
  value,
  onChange,
  onKeyDown,
  dataCell,
  colWidthPx,
  minHeightPx = 27,
  maxHeightPx = 52,
  placeholder,
  className = "",
}: AutoWrapCellProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const baseFontPx = minHeightPx <= 23 ? 10 : minHeightPx <= 26 ? 10.5 : 11;
  const typo = useMemo(() => {
    const computed = getDynamicCellTypography(value, colWidthPx, baseFontPx);
    if (minHeightPx <= 26 && !value.includes("\n") && value.trim().length <= 18) {
      return { fontSize: computed.fontSize, lineHeight: "1.2" };
    }
    return computed;
  }, [value, colWidthPx, baseFontPx, minHeightPx]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Empty cells must never expand to multi-line placeholder scrollHeight
    if (!value.trim()) {
      el.style.height = `${minHeightPx}px`;
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.max(
      minHeightPx,
      Math.min(el.scrollHeight, Math.max(minHeightPx, maxHeightPx)),
    )}px`;
  }, [value, colWidthPx, minHeightPx, maxHeightPx, typo.fontSize]);

  const padClass = minHeightPx <= 25 ? "px-1.5 py-[2px]" : "px-1.5 py-0.5";

  return (
    <>
      <textarea
        ref={ref}
        rows={1}
        data-cell={dataCell}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        style={{ ...typo, height: `${minHeightPx}px`, minHeight: `${minHeightPx}px` }}
        className={`w-full ${padClass} font-semibold placeholder:text-[9.5px] placeholder:font-normal bg-transparent resize-none overflow-hidden whitespace-pre-wrap break-words focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#FF7B00] focus:bg-amber-50/50 align-middle block no-print ${className}`}
      />
      <div
        style={{ ...typo, minHeight: `${minHeightPx}px` }}
        className={`hidden print:block ${padClass} font-semibold whitespace-pre-wrap break-words ${className}`}
      >
        {value}
      </div>
    </>
  );
}

export default function OrderPage() {
  const { toast } = useToast();
  const { cms } = useCmsBootstrap();
  const { data: allProducts = [] } = useQuery<CmsProduct[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Load persisted draft on mount so round-trip navigation (/parts-index, /new-products, /product/:id) never loses work
  const initialDraft = useMemo(() => loadOrderDraft(), []);

  // Left Sliding Catalog Drawer State (Open by default on desktop)
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState<
    "all" | "sliding" | "damping" | "rail" | "glass"
  >("all");
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);

  // 600x610px Hover-or-Click Image Zoom Popup State + Hover Bridge Timers
  const [zoomedItem, setZoomedItem] = useState<QuickCatalogItem | null>(null);
  const [zoomPinned, setZoomPinned] = useState(false);
  const zoomPopupRef = useRef<HTMLDivElement | null>(null);
  const hoverZoomOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const hoverZoomCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const closeZoomPopup = () => {
    if (hoverZoomOpenTimerRef.current) {
      clearTimeout(hoverZoomOpenTimerRef.current);
      hoverZoomOpenTimerRef.current = null;
    }
    if (hoverZoomCloseTimerRef.current) {
      clearTimeout(hoverZoomCloseTimerRef.current);
      hoverZoomCloseTimerRef.current = null;
    }
    setZoomedItem(null);
    setZoomPinned(false);
  };

  // Self-Learning Related-Parts Recommendation Docking Popup State (Column 2)
  const drawerAsideRef = useRef<HTMLElement | null>(null);
  const recPopupRef = useRef<HTMLDivElement | null>(null);
  const [activeAnchorId, setActiveAnchorId] = useState<string | null>(null);
  const [recDoorType, setRecDoorType] = useState<DoorMaterialType>("wood");
  const [recRoleTab, setRecRoleTab] = useState<RecPartRole>("all");
  const [recSourceFilter, setRecSourceFilter] = useState<
    "all" | RecommendationSourceTier
  >("all");
  const [recTrayOpen, setRecTrayOpen] = useState(false);
  const [recPopupPinned, setRecPopupPinned] = useState(false);
  const [recTrayDismissed, setRecTrayDismissed] = useState(false);
  const [affinityRecords, setAffinityRecords] = useState<PartAffinityRecord[]>(
    [],
  );
  const [totalLearnedOrders, setTotalLearnedOrders] = useState(0);

  // Admin-only Curation Mode State (Customers never see edit buttons unless Admin unlocks)
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [isAdminRecMode, setIsAdminRecMode] = useState(false);
  const [adminAuthModalOpen, setAdminAuthModalOpen] = useState(false);
  const [adminPwInput, setAdminPwInput] = useState("");
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [adminAddPartQuery, setAdminAddPartQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/part-affinity")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        if (Array.isArray(data.records)) setAffinityRecords(data.records);
        if (typeof data.totalLearnedOrders === "number") {
          setTotalLearnedOrders(data.totalLearnedOrders);
        }
      })
      .catch(() => {});

    // Silently check if browser already holds a valid COAS Admin session token
    const token = getAdminToken();
    if (token) {
      fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => {
          if (mounted && r.ok) {
            setIsAdminVerified(true);
          }
        })
        .catch(() => {});
    }

    return () => {
      mounted = false;
      if (hoverZoomOpenTimerRef.current) {
        clearTimeout(hoverZoomOpenTimerRef.current);
      }
      if (hoverZoomCloseTimerRef.current) {
        clearTimeout(hoverZoomCloseTimerRef.current);
      }
    };
  }, []);

  // Zoom Popup Bottom Hint Visibility State (Persisted in localStorage)
  const [showZoomHint, setShowZoomHint] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("coas_show_zoom_hint") !== "false";
  });

  const toggleZoomHint = (val?: boolean) => {
    setShowZoomHint((prev) => {
      const next = typeof val === "boolean" ? val : !prev;
      try {
        localStorage.setItem("coas_show_zoom_hint", String(next));
      } catch {}
      return next;
    });
  };

  // Excel Paste Modal State
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  // Locked Product Cell Picker Dialog State + Split Hover Preview
  const [rowPickerIdx, setRowPickerIdx] = useState<number | null>(null);
  const [rowPickerSearch, setRowPickerSearch] = useState("");
  const [rowPickerPreviewId, setRowPickerPreviewId] = useState<string | null>(
    null,
  );

  // Floating hover thumbnail preview when hovering a filled product cell in the main A4 table
  const [hoveredRowPreview, setHoveredRowPreview] = useState<{
    cat: QuickCatalogItem;
    top: number;
    left: number;
  } | null>(null);

  // Buyer / Delivery Info State (restored from draft)
  const [companyName, setCompanyName] = useState(initialDraft.companyName);
  const [contactName, setContactName] = useState(initialDraft.contactName);
  const [phone, setPhone] = useState(() =>
    formatKoreanPhoneNumber(initialDraft.phone),
  );
  const [email, setEmail] = useState(initialDraft.email);
  const [deliveryAddress, setDeliveryAddress] = useState(
    initialDraft.deliveryAddress,
  );
  const [desiredDate, setDesiredDate] = useState(initialDraft.desiredDate);
  const [shippingMethod, setShippingMethod] = useState<
    "화물" | "택배" | "방문수령"
  >(initialDraft.shippingMethod);
  const [memo, setMemo] = useState(initialDraft.memo);

  // Minimum 15-Row Fixed A4 Excel Grid State (restored from draft, enforced >= 15 rows)
  const [items, setItems] = useState<OrderLineItem[]>(() => {
    const base = [...initialDraft.items];
    while (base.length < MIN_ORDER_ROW_COUNT) {
      base.push(createEmptyOrderRow());
    }
    return base;
  });
  const [rowCountDraft, setRowCountDraft] = useState<string>(() =>
    String(Math.max(MIN_ORDER_ROW_COUNT, initialDraft.items.length)),
  );
  const [attachments, setAttachments] = useState<OrderAttachment[]>(
    initialDraft.attachments,
  );
  const [attachmentTabOpen, setAttachmentTabOpen] = useState(false);
  const [attachmentDragging, setAttachmentDragging] = useState(false);
  const attachmentWidgetRef = useRef<HTMLDivElement | null>(null);
  const attachmentFileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState<
    string | null
  >(null);

  // A4 Page Row Preset (Minimum 10 rows): "10" | "15" | "20" | "25" | "30" | "custom"
  const [a4Preset, setA4Preset] = useState<
    "10" | "15" | "20" | "25" | "30" | "custom"
  >(() => {
    const len = Math.max(MIN_ORDER_ROW_COUNT, initialDraft.items.length);
    if (len === 10) return "10";
    if (len === 15) return "15";
    if (len === 20) return "20";
    if (len === 25) return "25";
    if (len === 30) return "30";
    return "custom";
  });

  useEffect(() => {
    setRowCountDraft(String(items.length));
    if (items.length === 10) setA4Preset("10");
    else if (items.length === 15) setA4Preset("15");
    else if (items.length === 20) setA4Preset("20");
    else if (items.length === 25) setA4Preset("25");
    else if (items.length === 30) setA4Preset("30");
    else setA4Preset("custom");
  }, [items.length]);

  useEffect(() => {
    if (!attachmentTabOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (attachmentWidgetRef.current?.contains(target)) return;
      if (
        target instanceof Element &&
        target.closest("[data-attachment-toggle]")
      ) {
        return;
      }
      setAttachmentTabOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAttachmentTabOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [attachmentTabOpen]);

  // Load persisted View & Print Layout Preferences
  const savedLayoutPrefs = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("coas_order_view_prefs_v1");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // Page Zoom (%), A4 Orientation, Row Height (px)
  const [zoomPct, setZoomPct] = useState<number>(() =>
    typeof savedLayoutPrefs?.zoomPct === "number"
      ? Math.max(60, Math.min(160, savedLayoutPrefs.zoomPct))
      : 100,
  );
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(() =>
    savedLayoutPrefs?.orientation === "landscape" ? "landscape" : "portrait",
  );
  const [rowHeightPx, setRowHeightPx] = useState<number>(() =>
    typeof savedLayoutPrefs?.rowHeightPx === "number"
      ? Math.max(22, Math.min(56, savedLayoutPrefs.rowHeightPx))
      : 32,
  );
  const [rowHeightDraft, setRowHeightDraft] = useState<string>(() =>
    String(
      typeof savedLayoutPrefs?.rowHeightPx === "number"
        ? savedLayoutPrefs.rowHeightPx
        : 32,
    ),
  );
  const [colsCustomEdited, setColsCustomEdited] = useState(false);
  const [layoutPopoverOpen, setLayoutPopoverOpen] = useState(false);
  const layoutPopoverRef = useRef<HTMLDivElement | null>(null);
  const layoutTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Saved Buyer Profiles & Quick Company Entry State
  const [buyerProfiles, setBuyerProfiles] = useState<SavedBuyerProfile[]>(() =>
    loadBuyerProfiles(),
  );
  const [egdeskConnected, setEgdeskConnected] = useState(false);
  const [companyPickerOpen, setCompanyPickerOpen] = useState(false);
  const companyPickerRef = useRef<HTMLDivElement | null>(null);
  const companyInputRef = useRef<HTMLInputElement | null>(null);
  const companyTriggerRef = useRef<HTMLButtonElement | null>(null);
  const deliveryAddressInputRef = useRef<HTMLInputElement | null>(null);

  const deliveryAddressPlaceholder = useMemo(() => {
    if (shippingMethod === "화물") {
      return "예: 경동화물 화성팔탄영업소 / 또는 현장 하차지";
    }
    if (shippingMethod === "택배") {
      return "예: 경기 화성시 팔탄면 OO로 123, 101호";
    }
    return "본사 직접 방문수령 (차량번호·방문시간 기재 가능)";
  }, [shippingMethod]);

  useEffect(() => {
    let active = true;
    fetch("/api/buyer-profiles")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (data.connected) setEgdeskConnected(true);
        if (Array.isArray(data.buyers) && data.buyers.length > 0) {
          setBuyerProfiles(mergeAndSaveBuyerProfiles(data.buyers));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!companyPickerOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        companyPickerRef.current?.contains(target) ||
        companyInputRef.current?.contains(target) ||
        companyTriggerRef.current?.contains(target)
      ) {
        return;
      }
      setCompanyPickerOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCompanyPickerOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [companyPickerOpen]);

  const filteredBuyerProfiles = useMemo(() => {
    const q = companyName.trim().toLowerCase();
    if (!q) return buyerProfiles;
    const matched = buyerProfiles.filter(
      (p) =>
        p.companyName.toLowerCase().includes(q) ||
        p.contactName.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.deliveryAddress.toLowerCase().includes(q),
    );
    return matched.length > 0 ? matched : buyerProfiles;
  }, [buyerProfiles, companyName]);

  const handleApplyBuyerProfile = (p: SavedBuyerProfile) => {
    setCompanyName(p.companyName);
    if (p.contactName) setContactName(p.contactName);
    if (p.phone) setPhone(formatKoreanPhoneNumber(p.phone));
    if (p.email) setEmail(p.email);
    if (p.deliveryAddress) setDeliveryAddress(p.deliveryAddress);
    if (p.shippingMethod) setShippingMethod(p.shippingMethod);
    setCompanyPickerOpen(false);
    toast({
      title: `거래처 [${p.companyName}] 정보가 자동 입력되었습니다.`,
      description: p.contactName
        ? `담당자: ${p.contactName}${p.phone ? ` · ${p.phone}` : ""}`
        : undefined,
    });
  };

  const handleSaveCurrentBuyerProfile = () => {
    if (!companyName.trim()) {
      toast({
        title: "저장할 업체명을 먼저 입력해주세요.",
        variant: "destructive",
      });
      companyInputRef.current?.focus();
      return;
    }
    const payload = {
      companyName,
      contactName,
      phone,
      email,
      deliveryAddress,
      shippingMethod,
    };
    const updated = upsertBuyerProfile(payload);
    setBuyerProfiles(updated);

    fetch("/api/buyer-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.synced) {
          setEgdeskConnected(true);
          if (Array.isArray(data.buyers)) {
            setBuyerProfiles(mergeAndSaveBuyerProfiles(data.buyers));
          }
        }
      })
      .catch(() => {});

    toast({
      title: `거래처 [${companyName.trim()}] 프로필이 저장되었습니다.`,
      description: egdeskConnected
        ? "EGDesk My DB와 브라우저에 함께 저장되었습니다."
        : "다음부터 업체명 클릭 한 번으로 모든 항목을 불러옵니다.",
    });
  };

  const handleDeleteBuyerProfile = (
    id: string,
    label: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setBuyerProfiles(deleteBuyerProfile(id));
    fetch(`/api/buyer-profiles/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).catch(() => {});
    toast({ title: `저장된 거래처 [${label}]을(를) 삭제했습니다.` });
  };

  const handleToggleCompanyPrefix = (prefix: "(주)" | "주식회사 " | "(유)") => {
    setCompanyName((prev) => {
      const stripped = prev
        .replace(/^\(주\)\s*/, "")
        .replace(/^주식회사\s+/, "")
        .replace(/^\(유\)\s*/, "")
        .trimStart();
      if (prev.startsWith(prefix.trim())) {
        return stripped;
      }
      return `${prefix}${stripped}`;
    });
    companyInputRef.current?.focus();
  };

  const handleCompanySmartPaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    const pasted = e.clipboardData.getData("text");
    const parsed = parseSmartBuyerPaste(pasted);
    if (!parsed) return;
    e.preventDefault();
    if (parsed.companyName) setCompanyName(parsed.companyName);
    if (parsed.contactName) setContactName(parsed.contactName);
    if (parsed.phone) setPhone(parsed.phone);
    if (parsed.email) setEmail(parsed.email);
    if (parsed.deliveryAddress) setDeliveryAddress(parsed.deliveryAddress);
    setCompanyPickerOpen(false);
    toast({
      title: "복사한 발주처 정보를 각 칸에 자동 분리 입력했습니다.",
      description: [
        parsed.companyName,
        parsed.contactName,
        parsed.phone,
      ]
        .filter(Boolean)
        .join(" · "),
    });
  };

  useEffect(() => {
    if (!layoutPopoverOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        layoutPopoverRef.current?.contains(target) ||
        layoutTriggerRef.current?.contains(target)
      ) {
        return;
      }
      setLayoutPopoverOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLayoutPopoverOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [layoutPopoverOpen]);

  // Strict A4 Paper Dimensions (@ 96 DPI: 210mm × 297mm = 794px × 1123px)
  const sheetBaseWidth = orientation === "landscape" ? 1123 : 794;
  const sheetBaseHeight = orientation === "landscape" ? 794 : 1123;
  const a4PageGapPx = 24;
  const innerTableWidth = sheetBaseWidth - 96; // 698px (portrait) | 1027px (landscape)

  const sheetFormRef = useRef<HTMLFormElement | null>(null);
  const gridTableRef = useRef<HTMLTableElement | null>(null);

  // Excel-like Column Widths (Total = 698px portrait | 1027px landscape; index 4 = 단위 58px so "SET" never clips)
  const DEFAULT_COL_WIDTHS = useMemo(
    () => [32, 186, 138, 68, 58, 50, 136, 30],
    [],
  );
  const DEFAULT_LANDSCAPE_WIDTHS = useMemo(
    () => [36, 286, 210, 96, 62, 58, 245, 34],
    [],
  );
  const MIN_COL_WIDTHS = useMemo(
    () => [28, 100, 80, 50, 56, 42, 70, 28],
    [],
  );
  const [colWidths, setColWidths] = useState<number[]>(() => {
    const targetSum = orientation === "landscape" ? 1027 : 698;
    if (
      Array.isArray(savedLayoutPrefs?.colWidths) &&
      savedLayoutPrefs.colWidths.length === 8
    ) {
      const curSum = savedLayoutPrefs.colWidths.reduce(
        (a: number, b: number) => a + b,
        0,
      );
      if (curSum === targetSum) {
        return savedLayoutPrefs.colWidths;
      }
      const diff = targetSum - curSum;
      const adjusted = [...savedLayoutPrefs.colWidths];
      adjusted[6] = Math.max(MIN_COL_WIDTHS[6], adjusted[6] + diff);
      return adjusted;
    }
    return orientation === "landscape"
      ? [36, 286, 210, 96, 62, 58, 245, 34]
      : [32, 186, 138, 68, 58, 50, 136, 30];
  });

  const handleChangeOrientation = (nextOrient: "portrait" | "landscape") => {
    if (nextOrient === orientation) return;
    setCustomMemoHeightPx(null);
    const targetSum = nextOrient === "landscape" ? 1027 : 698;
    const curSum = colWidths.reduce((a, b) => a + b, 0) || 698;
    const scale = targetSum / curSum;
    const scaled = colWidths.map((w, idx) =>
      Math.max(MIN_COL_WIDTHS[idx], Math.round(w * scale)),
    );
    const diff = targetSum - scaled.reduce((a, b) => a + b, 0);
    scaled[1] = Math.max(MIN_COL_WIDTHS[1], scaled[1] + diff);
    setOrientation(nextOrient);
    setColWidths(scaled);
    try {
      const all = loadAllPresets();
      const matched = all.find(
        (p) => p.orientation === nextOrient && p.rowCount === items.length,
      );
      if (matched) {
        setActivePresetId(matched.id);
      }
    } catch {}
  };

  const handleFitToScreen = () => {
    const availW = Math.max(360, window.innerWidth - 116);
    const fitPct = Math.max(
      60,
      Math.min(130, Math.floor(((availW / sheetBaseWidth) * 100) / 5) * 5),
    );
    setZoomPct((prev) => (prev === fitPct ? 100 : fitPct));
  };

  const applyRowHeight = (px: number) => {
    const clamped = Math.max(22, Math.min(56, Math.round(px)));
    setRowHeightPx(clamped);
    setRowHeightDraft(String(clamped));
  };

  const [activePresetId, setActivePresetId] = useState<string>(() => {
    if (typeof window === "undefined") return "builtin-portrait-15";
    try {
      const all = loadAllPresets();
      const def = all.find((p) => p.isDefault);
      return def ? def.id : "builtin-portrait-15";
    } catch {
      return "builtin-portrait-15";
    }
  });

  const handleApplyLayoutPreset = (preset: OrderLayoutPreset) => {
    setActivePresetId(preset.id);
    setCustomMemoHeightPx(null);

    if (preset.orientation !== orientation) {
      handleChangeOrientation(preset.orientation);
    }
    setTargetRowCount(preset.rowCount);
    applyRowHeight(preset.rowHeightPx);

    if (preset.colWidths && preset.colWidths.length === colWidths.length) {
      setColWidths([...preset.colWidths]);
      setColsCustomEdited(true);
    }
    if (preset.zoomPct) {
      setZoomPct(preset.zoomPct);
    }
  };

  // On mount: check for user default preset from order-presets
  useEffect(() => {
    try {
      const all = loadAllPresets();
      const defaultPreset = all.find((p) => p.isDefault);
      if (defaultPreset) {
        setActivePresetId(defaultPreset.id);
        const draft = loadOrderDraft();
        const isEmptyDraft = draft.items.every((r) => !r.productName.trim());
        if (!draft.activeSession && isEmptyDraft) {
          handleApplyLayoutPreset(defaultPreset);
        }
      }
    } catch {}
  }, []);

  // Right Drawer: Customer Order History State & Handlers
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  // Buyer Session State for Company Authentication (Easy Login)
  const [buyerSession, setBuyerSessionState] = useState<BuyerSession>(() =>
    getBuyerSession(),
  );
  const [buyerAuthModalOpen, setBuyerAuthModalOpen] = useState(false);

  // Sync session changes from other tabs/events
  useEffect(() => {
    const handleSessionChange = (e: any) => {
      if (e.detail) setBuyerSessionState(e.detail);
    };
    window.addEventListener("coas-buyer-session-change", handleSessionChange);
    return () =>
      window.removeEventListener("coas-buyer-session-change", handleSessionChange);
  }, []);

  // When buyer logs in successfully, prefill buyer form
  const handleBuyerLoginSuccess = (session: BuyerSession) => {
    setBuyerSessionState(session);
    if (session.companyName) setCompanyName(session.companyName);
    if (session.contactName) setContactName(session.contactName);
    if (session.phone) setPhone(session.phone);
    if (session.email) setEmail(session.email);
    if (session.deliveryAddress) setDeliveryAddress(session.deliveryAddress);
    if (session.shippingMethod) setShippingMethod(session.shippingMethod);
  };

  const handleBuyerLogout = () => {
    const empty = logoutBuyerSession();
    setBuyerSessionState(empty);
    toast({
      title: "로그아웃되었습니다.",
      description: "거래처 간편로그인 상태가 해제되었습니다.",
    });
  };

  // 1. Apply Full Order from History (Supports "replace" to start fresh OR "append" to merge with existing items!)
  const handleApplyFullHistoryOrder = (
    order: OrderHistoryRecord,
    mode: "replace" | "append" = "replace",
  ) => {
    if (mode === "replace") {
      // Replace Entire Order Form
      if (order.companyName) setCompanyName(order.companyName);
      if (order.contactName) setContactName(order.contactName);
      if (order.phone) setPhone(order.phone);
      if (order.email) setEmail(order.email);
      if (order.deliveryAddress) setDeliveryAddress(order.deliveryAddress);
      if (order.shippingMethod) setShippingMethod(order.shippingMethod);
      if (order.desiredDate) setDesiredDate(order.desiredDate);
      if (order.memo) setMemo(order.memo);

      const importedRows = order.items.map((it) => createEmptyOrderRow(it));
      const targetLength = Math.max(MIN_ORDER_ROW_COUNT, importedRows.length);
      while (importedRows.length < targetLength) {
        importedRows.push(createEmptyOrderRow());
      }
      setItems(importedRows);

      toast({
        title: `[${order.orderDate} 주문] 새로 채우기 완료`,
        description: `총 ${order.items.length}개 품목이 입력되었습니다. 수량을 자유롭게 수정해 주세요.`,
      });
    } else {
      // Append & Merge to Existing Items
      if (!deliveryAddress.trim() && order.deliveryAddress) {
        setDeliveryAddress(order.deliveryAddress);
      }
      if (order.memo?.trim()) {
        setMemo((prev) => {
          const cleanPrev = prev.trim();
          if (!cleanPrev) return order.memo!.trim();
          if (cleanPrev.includes(order.memo!.trim())) return cleanPrev;
          return `${cleanPrev}\n[추가] ${order.memo!.trim()}`;
        });
      }

      setItems((prev) => {
        const next = [...prev];
        let addIdx = 0;
        const toAdd = order.items;

        // 1) First fill any completely empty rows
        for (let i = 0; i < next.length && addIdx < toAdd.length; i++) {
          const r = next[i];
          const isEmpty =
            !r.productId &&
            !r.productName.trim() &&
            !r.spec.trim() &&
            !r.quantity.trim();
          if (isEmpty) {
            next[i] = createEmptyOrderRow(toAdd[addIdx]);
            addIdx++;
          }
        }

        // 2) If still items remaining, append new rows
        while (addIdx < toAdd.length) {
          next.push(createEmptyOrderRow(toAdd[addIdx]));
          addIdx++;
        }

        // Keep minimum row count
        while (next.length < MIN_ORDER_ROW_COUNT) {
          next.push(createEmptyOrderRow());
        }

        return next;
      });

      toast({
        title: `[${order.orderDate} 주문] 기존 발주서에 합치기 완료!`,
        description: `기존 품목 아래에 ${order.items.length}개 품목이 성공적으로 추가되었습니다.`,
      });
    }
  };

  // 2. Add Selected Items from History to empty rows or append
  const handleAddHistorySelectedItems = (toAdd: OrderLineItem[]) => {
    setItems((prev) => {
      const next = [...prev];
      let addIdx = 0;

      for (let i = 0; i < next.length && addIdx < toAdd.length; i++) {
        const r = next[i];
        const isEmpty =
          !r.productId &&
          !r.productName.trim() &&
          !r.spec.trim() &&
          !r.quantity.trim();
        if (isEmpty) {
          next[i] = createEmptyOrderRow(toAdd[addIdx]);
          addIdx++;
        }
      }

      while (addIdx < toAdd.length) {
        next.push(createEmptyOrderRow(toAdd[addIdx]));
        addIdx++;
      }

      return next;
    });
  };

  // 3. Save Current Order Form as History Record
  const handleSaveCurrentToHistory = () => {
    const validItems = items.filter(
      (r) => r.productId || r.productName.trim() || r.spec.trim(),
    );
    if (validItems.length === 0) {
      toast({
        title: "보관할 품목이 없습니다.",
        description: "품목 명세 표에 1개 이상의 품목을 입력한 후 저장해 주세요.",
        variant: "destructive",
      });
      return;
    }

    const company = companyName.trim() || "상호 미입력";
    const totalQty = validItems.reduce(
      (acc, it) => acc + (parseInt(it.quantity, 10) || 1),
      0,
    );
    const summary =
      validItems
        .slice(0, 3)
        .map((it) => `${it.productName || it.spec} ${it.quantity || 1}${it.unit || "EA"}`)
        .join(", ") +
      (validItems.length > 3 ? ` 외 ${validItems.length - 3}건` : "");

    const todayStr = new Date().toISOString().slice(0, 10);
    const orderNum = `ORD-${todayStr.replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    addOrderHistoryRecord({
      orderNumber: orderNum,
      orderDate: todayStr,
      companyName: company,
      contactName: contactName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      deliveryAddress: deliveryAddress.trim(),
      shippingMethod,
      desiredDate,
      memo: memo.trim(),
      items: validItems,
      itemCount: validItems.length,
      totalQuantity: totalQty,
      summary,
      isFavorite: false,
    });

    toast({
      title: "현재 발주서가 거래처 히스토리에 보관되었습니다.",
      description: `[${company}] ${validItems.length}개 품목 보관 완료`,
    });
  };

  const handleSaveDefaultPrefs = () => {
    try {
      const all = loadAllPresets();
      // 1. Check if an existing preset matches current orientation and row count
      let matched = all.find(
        (p) =>
          p.orientation === orientation &&
          p.rowCount === items.length,
      );

      let targetId = matched?.id;
      let targetName = matched?.name;

      // 2. If no preset matches (e.g. customized row count/colWidths), create a new custom preset
      if (!matched) {
        const customs = all.filter((p) => !p.isBuiltIn);
        if (customs.length < MAX_CUSTOM_PRESETS) {
          const newPreset: OrderLayoutPreset = {
            id: `custom-${Date.now()}`,
            name: `내 기본 양식 (${orientation === "landscape" ? "가로" : "세로"} ${items.length}행)`,
            orientation,
            rowCount: items.length,
            rowHeightPx,
            colWidths: [...colWidths],
            zoomPct,
            isBuiltIn: false,
            isDefault: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          saveCustomPresets([...customs, newPreset]);
          targetId = newPreset.id;
          targetName = newPreset.name;
        }
      }

      // 3. Mark target preset as default
      if (targetId) {
        setDefaultPresetId(targetId);
        setActivePresetId(targetId);
      }

      // 4. Save view prefs cache with row count & presetId
      localStorage.setItem(
        "coas_order_view_prefs_v1",
        JSON.stringify({
          zoomPct,
          orientation,
          rowCount: items.length,
          rowHeightPx,
          colWidths,
          presetId: targetId,
        }),
      );

      // 5. Notify LayoutPresetManager and active components
      window.dispatchEvent(
        new CustomEvent("coas-preset-change", { detail: { id: targetId } }),
      );

      toast({
        title: "현재 설정이 기본값으로 저장되었습니다.",
        description: `[${targetName || `${items.length}행`}] (${
          orientation === "landscape" ? "A4 가로" : "A4 세로"
        } · ${items.length}행 · 행높이 ${rowHeightPx}px)이 기본 양식으로 지정되었습니다.`,
      });
    } catch (err) {
      console.error("Failed to save default prefs:", err);
    }
  };

  const handleRestoreDefaultPrefs = () => {
    try {
      localStorage.removeItem("coas_order_view_prefs_v1");
      setDefaultPresetId("builtin-std-20");
      setActivePresetId("builtin-std-20");
      window.dispatchEvent(
        new CustomEvent("coas-preset-change", { detail: { id: "builtin-std-20" } }),
      );
    } catch {}
    setZoomPct(100);
    setOrientation("portrait");
    setRowHeightPx(32);
    setRowHeightDraft("32");
    setColWidths(DEFAULT_COL_WIDTHS);
    setColsCustomEdited(false);
    setTargetRowCount(20);
    toast({
      title: "당사 기본값(A4 세로 · 20행 · 100% · 32px)으로 복원되었습니다.",
    });
  };

  const startColResize = (
    colIdx: number,
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (colIdx >= colWidths.length - 1) return;

    const startX = e.clientX;
    const startLeft = colWidths[colIdx];
    const startRight = colWidths[colIdx + 1];
    const pairTotal = startLeft + startRight;
    const minLeft = MIN_COL_WIDTHS[colIdx];
    const minRight = MIN_COL_WIDTHS[colIdx + 1];
    const zoomScale = zoomPct / 100;

    const onMouseMove = (moveEvt: MouseEvent) => {
      const delta = (moveEvt.clientX - startX) / zoomScale;
      const clampedLeft = Math.max(
        minLeft,
        Math.min(pairTotal - minRight, startLeft + delta),
      );
      const clampedRight = pairTotal - clampedLeft;
      setColWidths((prev) => {
        const next = [...prev];
        next[colIdx] = Math.round(clampedLeft);
        next[colIdx + 1] = Math.round(clampedRight);
        return next;
      });
      setColsCustomEdited(true);
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
    };

    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleAutoFitColumns = () => {
    const filled = items.filter(
      (r) => r.productName.trim() || r.spec.trim() || r.note.trim(),
    );
    if (filled.length === 0) {
      setColWidths(
        orientation === "landscape"
          ? DEFAULT_LANDSCAPE_WIDTHS
          : DEFAULT_COL_WIDTHS,
      );
      setColsCustomEdited(false);
      toast({
        title: "셀 폭이 A4 표준 비율로 자동 정렬되었습니다.",
      });
      return;
    }

    // Measure max character weight for flexible columns (1: 품명, 2: 규격, 3: 색상, 6: 비고)
    const measureWeight = (val: string) => {
      let w = 0;
      for (const ch of val) {
        w += /[\u3131-\uD79D]/.test(ch) ? 1.7 : 1.0;
      }
      return w;
    };

    const maxProd = Math.max(
      14,
      ...filled.map((r) => measureWeight(r.productName)),
    );
    const maxSpec = Math.max(12, ...filled.map((r) => measureWeight(r.spec)));
    const maxColor = Math.max(
      6,
      ...filled.map((r) => measureWeight(r.color || "")),
    );
    const maxNote = Math.max(10, ...filled.map((r) => measureWeight(r.note)));

    const fixedNo = orientation === "landscape" ? 36 : 32;
    const fixedUnit = orientation === "landscape" ? 62 : 58;
    const fixedQty = orientation === "landscape" ? 58 : 50;
    const fixedDel = orientation === "landscape" ? 34 : 30;
    const remaining =
      innerTableWidth - (fixedNo + fixedUnit + fixedQty + fixedDel);
    const weights = [maxProd, maxSpec, maxColor, maxNote];
    const totalW = weights.reduce((a, b) => a + b, 0);

    let wProd = Math.max(120, Math.round((weights[0] / totalW) * remaining));
    let wSpec = Math.max(100, Math.round((weights[1] / totalW) * remaining));
    let wColor = Math.max(56, Math.round((weights[2] / totalW) * remaining));
    let wNote = remaining - (wProd + wSpec + wColor);

    if (wNote < 75) {
      const deficit = 75 - wNote;
      wProd = Math.max(120, wProd - Math.ceil(deficit / 2));
      wSpec = Math.max(100, wSpec - Math.floor(deficit / 2));
      wNote = remaining - (wProd + wSpec + wColor);
    }

    setColWidths([
      fixedNo,
      wProd,
      wSpec,
      wColor,
      fixedUnit,
      fixedQty,
      wNote,
      fixedDel,
    ]);
    setColsCustomEdited(false);
    toast({
      title: "입력된 내용 길이에 맞춰 셀 폭이 자동 정렬되었습니다.",
    });
  };

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const autoDocNo = useMemo(
    () => `ORD-${todayStr.replace(/-/g, "")}-자동생성`,
    [todayStr],
  );

  // Save draft to sessionStorage whenever any field changes so user can freely browse other pages and come back
  useEffect(() => {
    if (submittedOrderNumber) return;
    saveOrderDraft({
      activeSession: true,
      companyName,
      contactName,
      phone,
      email,
      deliveryAddress,
      desiredDate,
      shippingMethod,
      memo,
      items,
      attachments,
      updatedAt: new Date().toISOString(),
    });
  }, [
    companyName,
    contactName,
    phone,
    email,
    deliveryAddress,
    desiredDate,
    shippingMethod,
    memo,
    items,
    attachments,
    submittedOrderNumber,
  ]);

  // Close 600x610 zoom popup and unpinned 2nd-column recommendation popup on outside click/tap or ESC
  useEffect(() => {
    const recOpen = Boolean(drawerOpen && recTrayOpen && !submittedOrderNumber);
    if (!zoomedItem && !recOpen) return;

    const handlePointerDownOutside = (e: PointerEvent) => {
      if (adminAuthModalOpen) return;
      const target = e.target as Node | null;
      if (!target) return;

      const insideZoom = Boolean(zoomPopupRef.current?.contains(target));
      const insideRec = Boolean(recPopupRef.current?.contains(target));
      const insideDrawer = Boolean(drawerAsideRef.current?.contains(target));
      const onZoomTrigger =
        target instanceof Element && Boolean(target.closest("[data-zoom-trigger]"));

      if (zoomedItem && !insideZoom && !onZoomTrigger) {
        closeZoomPopup();
      }

      if (recOpen && !recPopupPinned && !insideRec && !insideZoom && !insideDrawer) {
        setRecTrayOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (adminAuthModalOpen) return;
      if (e.key === "Escape") {
        if (zoomedItem) {
          closeZoomPopup();
        } else if (recOpen) {
          setRecTrayOpen(false);
        }
      }
    };

    document.addEventListener("pointerdown", handlePointerDownOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDownOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    zoomedItem,
    drawerOpen,
    recTrayOpen,
    recPopupPinned,
    submittedOrderNumber,
    adminAuthModalOpen,
  ]);

  // Responsive initial drawer state on small screens
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1180) {
      setDrawerOpen(false);
    }
  }, []);

  // Pre-fill or append product from URL query ?product=... without wiping existing draft rows
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get("product")?.trim();
    if (!prefill) return;

    setItems((prev) => {
      const next = [...prev];
      const existingIdx = next.findIndex(
        (r) => r.productName.trim() === prefill,
      );
      if (existingIdx !== -1) {
        flashRow(existingIdx);
        return next;
      }

      const isRail = prefill.toUpperCase().includes("SL-");
      const newRow = createEmptyOrderRow({
        productName: prefill,
        spec: isRail ? "표준 규격" : "기본 세트 구성",
        color: isRail ? "실버/기본" : "기본",
        unit: isRail ? "EA" : "SET",
        quantity: "1",
      });

      const emptyIdx = next.findIndex((r) => !r.productName.trim());
      if (emptyIdx !== -1) {
        next[emptyIdx] = newRow;
        flashRow(emptyIdx);
        return next;
      }
      flashRow(next.length);
      return [...next, newRow];
    });

    // Clean query string so refreshing does not re-trigger
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, "", cleanUrl);
  }, []);

  // Build deduplicated Quick Catalog List combining partsSections + allProducts
  const catalogList = useMemo<QuickCatalogItem[]>(() => {
    const map = new Map<string, QuickCatalogItem>();

    const classify = (
      code: string,
      title: string,
      catKo = "",
    ): {
      group: QuickCatalogItem["categoryGroup"];
      unit: "SET" | "EA";
    } => {
      const hay = `${code} ${title} ${catKo}`.toUpperCase();
      if (hay.includes("SL-") || hay.includes("레일") || hay.includes("커버")) {
        return { group: "rail", unit: "EA" };
      }
      if (
        hay.includes("DP") ||
        hay.includes("1 BODY") ||
        hay.includes("1BODY") ||
        hay.includes("원바디") ||
        hay.includes("댐핑")
      ) {
        return { group: "damping", unit: "SET" };
      }
      if (
        hay.includes("GSD") ||
        hay.includes("GDP") ||
        hay.includes("유리") ||
        hay.includes("샤워") ||
        hay.includes("큐비클") ||
        hay.includes("가이드") ||
        hay.includes("SD-01") ||
        hay.includes("SD-02")
      ) {
        const isGuide =
          hay.includes("가이드") ||
          hay.includes("SD-01") ||
          hay.includes("SD-02");
        return { group: "glass", unit: isGuide ? "EA" : "SET" };
      }
      return { group: "sliding", unit: "SET" };
    };

    // 1. Visual parts from partsSections first (most frequently ordered items)
    for (const sec of cms.partsSections) {
      if (sec.visible === false) continue;
      for (const card of sec.items) {
        if (card.visible === false) continue;
        const key = card.productId || card.id;
        if (map.has(key)) continue;
        const matchedProd = allProducts.find((p) => p.id === card.productId);
        const { group, unit } = classify(
          card.name,
          matchedProd?.nameKo || card.subtitle || "",
          sec.title,
        );
        map.set(key, {
          id: key,
          code: card.name,
          title:
            matchedProd?.nameKo && matchedProd.nameKo !== card.name
              ? matchedProd.nameKo
              : card.subtitle || sec.title,
          specHint:
            sanitizeSpecification(matchedProd?.specifications || card.subtitle) ||
            (unit === "SET" ? "기본 세트 구성" : ""),
          page:
            card.page ||
            (matchedProd?.pageNumber ? `${matchedProd.pageNumber}p` : ""),
          categoryGroup: group,
          rawCategoryKo: matchedProd?.categoryKo || sec.title,
          defaultUnit: unit,
          image: card.image || matchedProd?.imageUrl || undefined,
        });
      }
    }

    // 2. Remaining products from allProducts
    for (const p of allProducts) {
      if (map.has(p.id) || p.id.endsWith("-wide")) continue;
      const { group, unit } = classify(p.name, p.nameKo, p.categoryKo);
      map.set(p.id, {
        id: p.id,
        code: p.name,
        title: p.nameKo,
        specHint:
          sanitizeSpecification(p.specifications) ||
          (unit === "SET" ? "기본 세트 구성" : ""),
        page: p.pageNumber ? `${p.pageNumber}p` : "",
        categoryGroup: group,
        rawCategoryKo: p.categoryKo,
        defaultUnit: unit,
        image: p.imageUrl || undefined,
      });
    }

    return Array.from(map.values());
  }, [cms.partsSections, allProducts]);

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    return catalogList.filter((item) => {
      if (
        catalogCategory !== "all" &&
        item.categoryGroup !== catalogCategory
      ) {
        return false;
      }
      if (!q) return true;
      return (
        item.code.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.specHint.toLowerCase().includes(q) ||
        item.page.toLowerCase().includes(q)
      );
    });
  }, [catalogList, catalogSearch, catalogCategory]);

  // Fast lookup map + live resolver against master catalog (Single Source of Truth)
  const findMasterCatalogItem = (
    row: Pick<OrderLineItem, "productId" | "productName">,
  ): QuickCatalogItem | undefined => {
    if (catalogList.length === 0) return undefined;
    if (row.productId) {
      const byId = catalogList.find((c) => c.id === row.productId);
      if (byId) return byId;
    }
    const raw = row.productName.trim();
    if (!raw) return undefined;
    const { code } = splitCodeAndTitle(raw);
    const upperRaw = raw.toUpperCase();
    const upperCode = code.toUpperCase();

    return (
      catalogList.find((c) => c.code.toUpperCase() === upperCode) ||
      catalogList.find(
        (c) =>
          upperRaw === c.code.toUpperCase() ||
          upperRaw.startsWith(`${c.code.toUpperCase()} `) ||
          upperRaw.startsWith(`${c.code.toUpperCase()}(`),
      ) ||
      catalogList.find((c) => c.title.toUpperCase() === upperRaw)
    );
  };

  // Resolve always-fresh code + title from master data so master edits immediately propagate
  const resolveRowMasterDisplay = (row: OrderLineItem) => {
    const master = findMasterCatalogItem(row);
    if (master) {
      const displayFull =
        master.title && master.title !== master.code
          ? `${master.code} (${master.title})`
          : master.code;
      return {
        productId: master.id,
        code: master.code,
        title: master.title,
        displayFull,
        isLockedMaster: true,
        masterItem: master,
      };
    }
    const parsed = splitCodeAndTitle(row.productName);
    return {
      productId: row.productId,
      code: parsed.code,
      title: parsed.title,
      displayFull: row.productName.trim(),
      isLockedMaster: false,
      masterItem: undefined as QuickCatalogItem | undefined,
    };
  };

  // Filtered catalog items & active split-preview item inside Row Picker Modal
  const filteredPickerCatalog = useMemo(() => {
    const q = rowPickerSearch.trim().toLowerCase();
    if (!q) return catalogList;
    return catalogList.filter(
      (cat) =>
        cat.code.toLowerCase().includes(q) ||
        cat.title.toLowerCase().includes(q) ||
        cat.specHint.toLowerCase().includes(q),
    );
  }, [catalogList, rowPickerSearch]);

  useEffect(() => {
    if (rowPickerIdx === null) return;
    if (filteredPickerCatalog.length === 0) {
      setRowPickerPreviewId(null);
      return;
    }
    if (
      !rowPickerPreviewId ||
      !filteredPickerCatalog.some((c) => c.id === rowPickerPreviewId)
    ) {
      setRowPickerPreviewId(filteredPickerCatalog[0].id);
    }
  }, [rowPickerIdx, filteredPickerCatalog, rowPickerPreviewId]);

  const activePickerPreview = useMemo(() => {
    if (filteredPickerCatalog.length === 0) return null;
    return (
      filteredPickerCatalog.find((c) => c.id === rowPickerPreviewId) ||
      filteredPickerCatalog[0]
    );
  }, [filteredPickerCatalog, rowPickerPreviewId]);

  // Live-sync draft rows whenever master catalog data loads or updates
  useEffect(() => {
    if (catalogList.length === 0) return;
    setItems((prev) => {
      let changed = false;
      const next = prev.map((row) => {
        if (!row.productId && !row.productName.trim()) return row;
        const master = findMasterCatalogItem(row);
        if (!master) return row;
        const freshFull =
          master.title && master.title !== master.code
            ? `${master.code} (${master.title})`
            : master.code;
        if (row.productId !== master.id || row.productName !== freshFull) {
          changed = true;
          return {
            ...row,
            productId: master.id,
            productName: freshFull,
          };
        }
        return row;
      });
      return changed ? next : prev;
    });
  }, [catalogList]);

  // Map of how many quantities of each catalog item are currently in the sheet
  const addedItemMap = useMemo(() => {
    const map = new Map<string, { rowIdx: number; qty: number }>();
    items.forEach((row, idx) => {
      const name = row.productName.trim();
      if (!name && !row.productId) return;
      const matched = findMasterCatalogItem(row);
      if (matched) {
        const parsed = parseFloat(row.quantity.replace(/[^0-9.]/g, "")) || 1;
        const prev = map.get(matched.id);
        map.set(matched.id, {
          rowIdx: prev ? prev.rowIdx : idx,
          qty: (prev ? prev.qty : 0) + parsed,
        });
      }
    });
    return map;
  }, [items, catalogList]);

  // Resolve Active Anchor Roller (explicitly selected, or auto-inferred from first roller in order sheet)
  const activeAnchorItem = useMemo<QuickCatalogItem | null>(() => {
    if (recTrayDismissed) return null;
    if (activeAnchorId) {
      const found = catalogList.find((c) => c.id === activeAnchorId);
      if (found) return found;
    }
    for (const row of items) {
      if (!row.productId && !row.productName.trim()) continue;
      const cat = catalogList.find(
        (c) =>
          c.id === row.productId ||
          row.productName.trim() === c.code ||
          row.productName.trim().startsWith(`${c.code} (`),
      );
      if (cat && isAnchorRollerItem(cat)) {
        return cat;
      }
    }
    return null;
  }, [activeAnchorId, recTrayDismissed, catalogList, items]);

  const recommendationBundle = useMemo(() => {
    if (!activeAnchorItem) {
      return {
        all: [] as RecommendedPartItem<QuickCatalogItem>[],
        filtered: [] as RecommendedPartItem<QuickCatalogItem>[],
        adminDesignated: [] as RecommendedPartItem<QuickCatalogItem>[],
        verifiedShipment: [] as RecommendedPartItem<QuickCatalogItem>[],
        catalogCompatible: [] as RecommendedPartItem<QuickCatalogItem>[],
        excludedItems: [] as QuickCatalogItem[],
        excludedCount: 0,
        roleCounts: {
          all: 0,
          upper_rail: 0,
          lower: 0,
          handle: 0,
          bracket: 0,
        },
        sourceCounts: {
          all: 0,
          admin_designated: 0,
          verified_shipment: 0,
          catalog_compatible: 0,
        },
      };
    }
    const {
      items: allRecs,
      excludedItems,
      excludedCount,
    } = computeRelatedPartRecommendations(
      activeAnchorItem,
      catalogList,
      recDoorType,
      affinityRecords,
    );
    const roleCounts = {
      all: allRecs.length,
      upper_rail: allRecs.filter((r) => r.role === "upper_rail").length,
      lower: allRecs.filter((r) => r.role === "lower").length,
      handle: allRecs.filter((r) => r.role === "handle").length,
      bracket: allRecs.filter((r) => r.role === "bracket").length,
    };
    const roleFiltered =
      recRoleTab === "all"
        ? allRecs
        : allRecs.filter((r) => r.role === recRoleTab);

    const sourceCounts = {
      all: roleFiltered.length,
      admin_designated: roleFiltered.filter(
        (r) => r.sourceTier === "admin_designated",
      ).length,
      verified_shipment: roleFiltered.filter(
        (r) => r.sourceTier === "verified_shipment",
      ).length,
      catalog_compatible: roleFiltered.filter(
        (r) => r.sourceTier === "catalog_compatible",
      ).length,
    };

    const filtered =
      recSourceFilter === "all"
        ? roleFiltered
        : roleFiltered.filter((r) => r.sourceTier === recSourceFilter);

    return {
      all: allRecs,
      filtered,
      adminDesignated: filtered.filter(
        (r) => r.sourceTier === "admin_designated",
      ),
      verifiedShipment: filtered.filter(
        (r) => r.sourceTier === "verified_shipment",
      ),
      catalogCompatible: filtered.filter(
        (r) => r.sourceTier === "catalog_compatible",
      ),
      excludedItems,
      excludedCount,
      roleCounts,
      sourceCounts,
    };
  }, [
    activeAnchorItem,
    catalogList,
    recDoorType,
    affinityRecords,
    recRoleTab,
    recSourceFilter,
  ]);

  // Searchable non-anchor catalog parts for Admin direct designation inside Column 2
  const adminAddableParts = useMemo(() => {
    if (!isAdminRecMode || !activeAnchorItem) return [];
    const q = adminAddPartQuery.trim().toLowerCase();
    if (!q) return [];
    const alreadyDesignatedIds = new Set(
      affinityRecords
        .filter(
          (r) =>
            r.anchorId === activeAnchorItem.id &&
            r.doorType === recDoorType &&
            r.pinned,
        )
        .map((r) => r.targetId),
    );
    return catalogList
      .filter(
        (c) =>
          c.id !== activeAnchorItem.id &&
          !isAnchorRollerItem(c) &&
          !alreadyDesignatedIds.has(c.id) &&
          (c.code.toLowerCase().includes(q) ||
            c.title.toLowerCase().includes(q) ||
            c.specHint.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [
    isAdminRecMode,
    activeAnchorItem,
    adminAddPartQuery,
    affinityRecords,
    recDoorType,
    catalogList,
  ]);

  const addedRolesSet = useMemo(() => {
    const roles = new Set<Exclude<RecPartRole, "all">>();
    for (const [id] of Array.from(addedItemMap.entries())) {
      const cat = catalogList.find((c) => c.id === id);
      const role = cat ? classifySubPartRole(cat) : null;
      if (role) roles.add(role);
    }
    return roles;
  }, [addedItemMap, catalogList]);

  const hasUpperRailInOrder = addedRolesSet.has("upper_rail");
  const recPopupVisible = Boolean(
    drawerOpen && activeAnchorItem && recTrayOpen && !submittedOrderNumber,
  );

  // Admin-only curation API caller (requires valid Bearer admin token)
  const adminCurateAffinity = async (
    anchorId: string,
    targetId: string,
    doorType: DoorMaterialType,
    action: AdminAffinityAction,
    successMessage?: string,
  ) => {
    try {
      const data = await adminFetch<{
        records?: PartAffinityRecord[];
        totalLearnedOrders?: number;
      }>("/api/admin/part-affinity/curate", {
        method: "POST",
        body: JSON.stringify({ anchorId, targetId, doorType, action }),
      });
      if (data && Array.isArray(data.records)) {
        setAffinityRecords(data.records);
      }
      if (typeof data?.totalLearnedOrders === "number") {
        setTotalLearnedOrders(data.totalLearnedOrders);
      }
      if (successMessage) {
        toast({ title: successMessage });
      }
    } catch (err: any) {
      if (err?.message === "UNAUTHORIZED") {
        setIsAdminVerified(false);
        setIsAdminRecMode(false);
        setAdminAuthModalOpen(true);
        toast({
          title: "관리자 인증이 만료되었습니다.",
          description: "관리자 비밀번호를 다시 입력해주세요.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "추천 설정 저장 오류",
        description: err?.message || "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleToggleAdminRecMode = () => {
    if (isAdminRecMode) {
      setIsAdminRecMode(false);
      setAdminAddPartQuery("");
      return;
    }
    if (isAdminVerified && getAdminToken()) {
      setIsAdminRecMode(true);
      toast({
        title: "관리자 추천 편집 모드가 켜졌습니다.",
        description:
          "★ 관리자 지정 추천 등록 및 부적합 부품 제외를 설정하실 수 있습니다.",
      });
      return;
    }
    setAdminPwInput("");
    setAdminAuthModalOpen(true);
  };

  const handleAdminUnlockLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPwInput.trim()) return;
    setAdminLoggingIn(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPwInput }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.token) {
        throw new Error(json.error || "관리자 비밀번호가 일치하지 않습니다.");
      }
      setAdminToken(json.token);
      setIsAdminVerified(true);
      setIsAdminRecMode(true);
      setAdminPwInput("");
      setAdminAuthModalOpen(false);
      toast({
        title: "관리자 인증 완료 — 추천 편집 모드가 활성화되었습니다.",
      });
    } catch (err: any) {
      toast({
        title: "관리자 인증 실패",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setAdminLoggingIn(false);
    }
  };

  const handleSelectAnchorForRec = (item: QuickCatalogItem) => {
    if (recTrayOpen && activeAnchorItem?.id === item.id) {
      setRecTrayOpen(false);
      closeZoomPopup();
      return;
    }
    setActiveAnchorId(item.id);
    setRecDoorType(inferDefaultDoorType(item));
    setRecRoleTab("all");
    setRecSourceFilter("all");
    setAdminAddPartQuery("");
    setRecTrayOpen(true);
    setRecTrayDismissed(false);
  };

  const handleResetExcludedRecs = async () => {
    if (!activeAnchorItem || !isAdminRecMode) return;
    try {
      const data = await adminFetch<{ records?: PartAffinityRecord[] }>(
        "/api/admin/part-affinity/reset-exclusions",
        {
          method: "POST",
          body: JSON.stringify({
            anchorId: activeAnchorItem.id,
            doorType: recDoorType,
          }),
        },
      );
      if (data && Array.isArray(data.records)) {
        setAffinityRecords(data.records);
        toast({ title: "제외했던 부품 목록이 복원되었습니다." });
      }
    } catch (err: any) {
      if (err?.message === "UNAUTHORIZED") {
        setIsAdminVerified(false);
        setIsAdminRecMode(false);
        setAdminAuthModalOpen(true);
      }
    }
  };

  const handleHoverZoomEnter = (item: QuickCatalogItem) => {
    if (hoverZoomCloseTimerRef.current) {
      clearTimeout(hoverZoomCloseTimerRef.current);
      hoverZoomCloseTimerRef.current = null;
    }
    if (zoomPinned) return;
    if (hoverZoomOpenTimerRef.current) {
      clearTimeout(hoverZoomOpenTimerRef.current);
    }
    hoverZoomOpenTimerRef.current = setTimeout(() => {
      setZoomedItem(item);
      setZoomPinned(false);
    }, 140);
  };

  const handleHoverZoomLeave = () => {
    if (hoverZoomOpenTimerRef.current) {
      clearTimeout(hoverZoomOpenTimerRef.current);
      hoverZoomOpenTimerRef.current = null;
    }
    if (zoomPinned) return;
    if (hoverZoomCloseTimerRef.current) {
      clearTimeout(hoverZoomCloseTimerRef.current);
    }
    hoverZoomCloseTimerRef.current = setTimeout(() => {
      setZoomedItem(null);
    }, 240);
  };

  const flashRow = (rowIdx: number) => {
    setHighlightedRow(rowIdx);
    setTimeout(() => {
      setHighlightedRow((prev) => (prev === rowIdx ? null : prev));
    }, 1100);
  };

  // Click item in Left Sliding Drawer -> Insert or increment in Type A Excel Sheet
  // Note: Unauthenticated customer clicks NEVER mutate global recommendation rankings.
  const handleAddCatalogItem = (cat: QuickCatalogItem) => {
    if (isAnchorRollerItem(cat)) {
      setActiveAnchorId(cat.id);
      setRecDoorType(inferDefaultDoorType(cat));
      setRecRoleTab("all");
      setRecSourceFilter("all");
      setRecTrayOpen(true);
      setRecTrayDismissed(false);
    }
    const displayFull =
      cat.title && cat.title !== cat.code
        ? `${cat.code} (${cat.title})`
        : cat.code;

    setItems((prev) => {
      const next = [...prev];
      const existingIdx = next.findIndex(
        (r) =>
          (r.productId && r.productId === cat.id) ||
          r.productName.trim() === displayFull ||
          r.productName.trim() === cat.code,
      );

      if (existingIdx !== -1) {
        const curQty =
          parseInt(next[existingIdx].quantity.replace(/[^0-9]/g, ""), 10) || 0;
        next[existingIdx] = {
          ...next[existingIdx],
          productId: cat.id,
          productName: displayFull,
          quantity: String(curQty + 1),
        };
        flashRow(existingIdx);
        return next;
      }

      const emptyIdx = next.findIndex(
        (r) => !r.productId && !r.productName.trim(),
      );
      const newRow = createEmptyOrderRow({
        productId: cat.id,
        productName: displayFull,
        spec: sanitizeSpecification(cat.specHint),
        color: cat.defaultUnit === "EA" ? "실버/기본" : "기본",
        unit: cat.defaultUnit,
        quantity: "1",
      });

      if (emptyIdx !== -1) {
        next[emptyIdx] = newRow;
        flashRow(emptyIdx);
        return next;
      } else {
        const appendedIdx = next.length;
        flashRow(appendedIdx);
        return [...next, newRow];
      }
    });
  };

  // Assign a locked master product into a specific row from the row-picker dialog
  const handleAssignProductToRow = (rowIdx: number, cat: QuickCatalogItem) => {
    const displayFull =
      cat.title && cat.title !== cat.code
        ? `${cat.code} (${cat.title})`
        : cat.code;
    setItems((prev) =>
      prev.map((row, idx) =>
        idx === rowIdx
          ? {
              ...row,
              productId: cat.id,
              productName: displayFull,
              spec: sanitizeSpecification(row.spec.trim() || cat.specHint),
              color:
                (row.color || "").trim() ||
                (cat.defaultUnit === "EA" ? "실버/기본" : "기본"),
              unit: cat.defaultUnit,
              quantity: row.quantity.trim() || "1",
            }
          : row,
      ),
    );
    flashRow(rowIdx);
    setRowPickerIdx(null);
    setRowPickerSearch("");
  };

  // Toggle 600x610px image zoom popup when clicking thumbnail cell (pins open until closed)
  const handleToggleZoom = (item: QuickCatalogItem) => {
    if (hoverZoomOpenTimerRef.current) {
      clearTimeout(hoverZoomOpenTimerRef.current);
      hoverZoomOpenTimerRef.current = null;
    }
    if (hoverZoomCloseTimerRef.current) {
      clearTimeout(hoverZoomCloseTimerRef.current);
      hoverZoomCloseTimerRef.current = null;
    }
    if (zoomedItem?.id === item.id && zoomPinned) {
      setZoomedItem(null);
      setZoomPinned(false);
    } else {
      setZoomedItem(item);
      setZoomPinned(true);
    }
  };

  const [pendingRowTrimConfirm, setPendingRowTrimConfirm] = useState<{
    targetCount: number;
    presetHint?: "10" | "15" | "20" | "25" | "30" | "custom";
  } | null>(null);

  const [customMemoHeightPx, setCustomMemoHeightPx] = useState<number | null>(
    null,
  );

  // Helper to find the index of the last row containing entered data (product, spec, qty, note)
  const getLastFilledRowIndex = (rowList: typeof items) => {
    for (let i = rowList.length - 1; i >= 0; i--) {
      const r = rowList[i];
      if (
        r.productId ||
        r.productName.trim() ||
        r.spec.trim() ||
        r.quantity.trim() ||
        r.note.trim()
      ) {
        return i;
      }
    }
    return -1;
  };

  const itemsSnapshotRef = useRef(items);
  itemsSnapshotRef.current = items;

  // Enforce minimum rows when adjusting row count directly or via presets
  const setTargetRowCount = (
    rawCount: number,
    presetHint?: "10" | "15" | "20" | "25" | "30" | "custom",
    forceTrim = false,
  ) => {
    if (Number.isNaN(rawCount)) return;
    const clamped = Math.max(
      MIN_ORDER_ROW_COUNT,
      Math.min(200, Math.round(rawCount)),
    );
    const curItems = itemsSnapshotRef.current;

    if (clamped < curItems.length && !forceTrim) {
      const hasDataInTail = curItems
        .slice(clamped)
        .some(
          (r) =>
            r.productId ||
            r.productName.trim() ||
            r.spec.trim() ||
            r.quantity.trim() ||
            r.note.trim(),
        );
      if (hasDataInTail) {
        setRowCountDraft(String(curItems.length));
        setPendingRowTrimConfirm({ targetCount: clamped, presetHint });
        return;
      }
    }

    setItems((prev) => {
      if (clamped === prev.length) return prev;
      if (clamped > prev.length) {
        const added = createInitialOrderRows(clamped - prev.length);
        return [...prev, ...added];
      }
      return prev.slice(0, clamped);
    });

    if (presetHint) {
      setA4Preset(presetHint);
    }
  };

  // Apply A4 Paper Row Count Preset (Minimum 10 rows)
  const handleApplyA4Preset = (
    preset: "10" | "15" | "20" | "25" | "30" | "custom",
    customCount?: number,
  ) => {
    setCustomMemoHeightPx(null);
    const targetCount =
      customCount ??
      (preset === "custom" ? items.length : parseInt(preset, 10));
    setTargetRowCount(targetCount, preset);

    try {
      const all = loadAllPresets();
      const matched = all.find(
        (p) => p.orientation === orientation && p.rowCount === targetCount,
      );
      if (matched) {
        setActivePresetId(matched.id);
      }
    } catch {}
  };

  const addRows = (count = 5) => {
    setItems((prev) => {
      const target = Math.min(200, Math.max(MIN_ORDER_ROW_COUNT, prev.length + count));
      if (target <= prev.length) return prev;
      return [...prev, ...createInitialOrderRows(target - prev.length)];
    });
  };

  const removeRows = (count = 1) => {
    setTargetRowCount(Math.max(MIN_ORDER_ROW_COUNT, items.length - count));
  };

  const clearOrRemoveRow = (idx: number) => {
    setItems((prev) => {
      const filtered = prev.filter((_, i) => i !== idx);
      while (filtered.length < MIN_ORDER_ROW_COUNT) {
        filtered.push(createEmptyOrderRow());
      }
      return filtered;
    });
  };

  // Shared cell visual-line & inner-height estimator matching getDynamicCellTypography + AutoWrapCell 1-to-1
  const estimateCellMetrics = (
    text: string,
    colWidthPx: number,
    baseFontPx: number,
    baseInnerPx: number,
  ): { visualLines: number; requiredInnerPx: number } => {
    const clean = (text || "").trim();
    if (!clean) {
      return { visualLines: 1, requiredInnerPx: baseInnerPx };
    }
    const usablePx = Math.max(40, colWidthPx - 14);
    let totalCharW = 0;
    for (const ch of clean) {
      if (ch !== "\n") {
        totalCharW += /[\u3131-\uD79D]/.test(ch) ? 1.65 : 0.95;
      }
    }
    const baseRatio = (totalCharW * (baseFontPx * 0.56)) / usablePx;
    const effectiveFontPx =
      baseRatio <= 1.0
        ? baseFontPx
        : baseRatio <= 1.65
          ? baseFontPx * 0.8
          : baseFontPx * 0.72;
    const lineH =
      baseRatio <= 1.0 ? 1.32 : baseRatio <= 1.65 ? 1.25 : 1.2;

    const segments = clean.split("\n");
    let visualLines = 0;
    for (const seg of segments) {
      if (!seg) {
        visualLines += 1;
        continue;
      }
      let segW = 0;
      for (const ch of seg) {
        segW += /[\u3131-\uD79D]/.test(ch) ? 1.65 : 0.95;
      }
      const segPx = segW * (effectiveFontPx * 0.56);
      visualLines += Math.max(1, Math.ceil(segPx / usablePx));
    }

    const padY = baseInnerPx <= 25 ? 4 : 5;
    const rawInnerPx = Math.ceil(visualLines * effectiveFontPx * lineH + padY);
    const maxAllowed = Math.max(baseInnerPx * 1.75, 40);
    return {
      visualLines,
      requiredInnerPx: Math.max(
        baseInnerPx,
        Math.min(rawInnerPx, maxAllowed),
      ),
    };
  };

  // Count how many filled rows genuinely wrap to 2+ visual lines inside current column widths
  const multiLineCount = useMemo(() => {
    const refInner = Math.max(20, rowHeightPx - 1);
    const cellFont = refInner <= 23 ? 10 : refInner <= 26 ? 10.5 : 11;
    return items.filter((r) => {
      if (
        !r.productId &&
        !r.productName.trim() &&
        !r.spec.trim() &&
        !r.note.trim()
      ) {
        return false;
      }
      const resolved = resolveRowMasterDisplay(r);
      const inlineLabel = [
        resolved.code ? `[${resolved.code}]` : "",
        resolved.title,
      ]
        .filter(Boolean)
        .join(" ");
      return (
        estimateCellMetrics(
          inlineLabel,
          Math.max(70, colWidths[1] - 18),
          10,
          refInner,
        ).visualLines >= 2 ||
        estimateCellMetrics(r.spec, colWidths[2], cellFont, refInner)
          .visualLines >= 2 ||
        estimateCellMetrics(r.color || "", colWidths[3], cellFont, refInner)
          .visualLines >= 2 ||
        estimateCellMetrics(r.note, colWidths[6], cellFont, refInner)
          .visualLines >= 2
      );
    }).length;
  }, [items, colWidths, rowHeightPx, catalogList]);

  // Sequential numbering only for rows with filled code/product
  const filledItemNumbers = useMemo(() => {
    const map: Record<number, number> = {};
    let num = 0;
    items.forEach((r, i) => {
      const res = resolveRowMasterDisplay(r);
      if (res.code || res.title || r.productName.trim()) {
        num += 1;
        map[i] = num;
      }
    });
    return map;
  }, [items, catalogList]);

  // Interactive 6-Dot Drag Resizing between Line Items Table and 특기사항/배송메모 Table
  const isResizingMemoRef = useRef(false);
  const resizeStartYRef = useRef(0);
  const resizeStartItemsLenRef = useRef(0);
  const resizeStartCustomMemoHRef = useRef<number>(58);
  const [isResizingMemo, setIsResizingMemo] = useState(false);

  const handleStartMemoResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingMemoRef.current = true;
    resizeStartYRef.current = e.clientY;
    resizeStartItemsLenRef.current = items.length;

    const baseMemoH = orientation === "landscape" ? 46 : 58;
    resizeStartCustomMemoHRef.current = customMemoHeightPx ?? baseMemoH;
    setIsResizingMemo(true);

    const stopResize = () => {
      isResizingMemoRef.current = false;
      setIsResizingMemo(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (moveEvt: MouseEvent) => {
      if (!isResizingMemoRef.current) return;
      const deltaY = moveEvt.clientY - resizeStartYRef.current;
      // Dragging UP (deltaY < 0): expands memo upwards -> reduces empty rows
      // Dragging DOWN (deltaY > 0): shrinks memo downwards -> increases rows or shrinks expanded memo

      const curItems = itemsSnapshotRef.current;
      const lastFilledIdx = getLastFilledRowIndex(curItems);
      const minKeepRows = Math.max(MIN_ORDER_ROW_COUNT, lastFilledIdx + 1);
      const startLen = resizeStartItemsLenRef.current;
      const baseMemoH = orientation === "landscape" ? 46 : 58;

      if (deltaY < 0) {
        // Dragging UPWARDS:
        // 1. If curItems has trailing empty rows (startLen > minKeepRows):
        //    Reduce empty items in items down to minKeepRows.
        const emptyItemsToReduce = Math.max(0, startLen - minKeepRows);
        const rowsDelta = Math.floor(-deltaY / 28);
        const itemsToCut = Math.min(emptyItemsToReduce, rowsDelta);
        const newLen = startLen - itemsToCut;

        if (newLen !== curItems.length && newLen >= minKeepRows) {
          setTargetRowCount(newLen, undefined, true);
        }

        // 2. Any additional upward drag beyond empty items expands customMemoHeightPx!
        const leftoverUpPx = -deltaY - itemsToCut * 28;
        if (leftoverUpPx > 0) {
          const targetMemoH = Math.min(
            450,
            resizeStartCustomMemoHRef.current + leftoverUpPx,
          );
          setCustomMemoHeightPx(Math.round(targetMemoH));
        }
      } else {
        // Dragging DOWNWARDS:
        // 1. If customMemoHeightPx was expanded above baseMemoH:
        //    Shrink memo height back down towards baseMemoH!
        const memoExpansion = Math.max(
          0,
          resizeStartCustomMemoHRef.current - baseMemoH,
        );
        if (memoExpansion > 0) {
          const newMemoH = Math.max(
            baseMemoH,
            resizeStartCustomMemoHRef.current - deltaY,
          );
          setCustomMemoHeightPx(
            newMemoH <= baseMemoH ? null : Math.round(newMemoH),
          );
        }

        // 2. If memo is at or returned to baseMemoH, dragging downwards adds rows!
        const leftoverDownPx = deltaY - memoExpansion;
        if (leftoverDownPx > 0) {
          const singleMaxRows = orientation === "landscape" ? 20 : 25;
          const maxRows = startLen > singleMaxRows ? 200 : singleMaxRows;
          const addCount = Math.floor(leftoverDownPx / 28);
          const targetCount = Math.min(maxRows, startLen + addCount);
          if (targetCount !== curItems.length) {
            setTargetRowCount(targetCount);
          }
        }
      }
    };

    const onMouseUp = () => {
      stopResize();
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Flexible & Pixel-Accurate A4 Multi-Page Pagination Engine:
  // • Dynamically adapts row height & per-page item packing to any requested row count (10~200 rows).
  // • Single-page mode (10~25 Portrait / 10~20 Landscape): keeps all rows + 합계 + 배송메모 on 1 A4 sheet.
  // • Multi-page mode (26+ Portrait / 21+ Landscape): non-last pages have NO memo/summary, so actual
  //   item rows (품목) pack all the way down to the exact ~13mm (50px) bottom margin with elastic stretch.
  const a4Pages = useMemo(() => {
    const innerSheetH = orientation === "landscape" ? 722 : 1016;
    const singlePageTopChrome = orientation === "landscape" ? 215 : 252;
    const firstPageTopChrome = orientation === "landscape" ? 215 : 272;
    const nextPageTopChrome = orientation === "landscape" ? 41 : 44;
    const lastPageMinBottomChrome = orientation === "landscape" ? 85 : 100;
    const lastPageComfortBottomChrome = orientation === "landscape" ? 98 : 118;

    const singlePageMaxRows = orientation === "landscape" ? 20 : 25;
    const minOuterRowPx = orientation === "landscape" ? 21 : 26;

    const baseMemoH = orientation === "landscape" ? 46 : 58;
    const effectiveMemoH =
      customMemoHeightPx !== null
        ? Math.max(baseMemoH, customMemoHeightPx)
        : baseMemoH;
    const extraMemoH = effectiveMemoH - baseMemoH;

    const singlePageBodyBudget =
      innerSheetH - singlePageTopChrome - lastPageMinBottomChrome - extraMemoH; // 664 portrait | 422 landscape
    const firstPageBodyBudget = innerSheetH - firstPageTopChrome; // 744 portrait | 507 landscape
    const midPageBodyBudget = innerSheetH - nextPageTopChrome; // 972 portrait | 681 landscape
    const lastPageFitBudget =
      innerSheetH - nextPageTopChrome - lastPageMinBottomChrome - extraMemoH; // 872 portrait | 596 landscape
    const lastPageFillerBudget =
      innerSheetH - nextPageTopChrome - lastPageComfortBottomChrome - extraMemoH; // 854 portrait | 583 landscape

    const getRowRequiredOuterPx = (
      row: (typeof items)[number],
      baseOuterPx: number,
    ): number => {
      const baseInnerPx = Math.max(19, Math.floor(baseOuterPx - 1));
      const cellFontPx =
        baseInnerPx <= 23 ? 10 : baseInnerPx <= 26 ? 10.5 : 11;
      const specH = estimateCellMetrics(
        row.spec,
        colWidths[2],
        cellFontPx,
        baseInnerPx,
      ).requiredInnerPx;
      const colorH = estimateCellMetrics(
        row.color || "",
        colWidths[3],
        cellFontPx,
        baseInnerPx,
      ).requiredInnerPx;
      const noteH = estimateCellMetrics(
        row.note,
        colWidths[6],
        cellFontPx,
        baseInnerPx,
      ).requiredInnerPx;
      const maxInner = Math.max(baseInnerPx, specH, colorH, noteH);
      return Math.max(baseOuterPx, maxInner + 1);
    };

    const allEntries = items.map((row, globalIdx) => ({ row, globalIdx }));

    // 1. Single-Page Mode: whenever requested row count <= singlePageMaxRows and fits within A4 budget
    if (allEntries.length <= singlePageMaxRows) {
      const preferredOuter =
        orientation === "portrait"
          ? Math.max(rowHeightPx, allEntries.length <= 15 ? 35 : 32)
          : Math.max(rowHeightPx, 28);

      const minRequiredSum = allEntries.reduce(
        (sum, e) => sum + getRowRequiredOuterPx(e.row, minOuterRowPx),
        0,
      );

      if (minRequiredSum <= singlePageBodyBudget + 6) {
        let bestOuter = minOuterRowPx;
        for (
          let cand = preferredOuter;
          cand >= minOuterRowPx;
          cand = Math.round((cand - 0.5) * 10) / 10
        ) {
          const totalPx = allEntries.reduce(
            (sum, e) => sum + getRowRequiredOuterPx(e.row, cand),
            0,
          );
          if (totalPx <= singlePageBodyBudget) {
            bestOuter = cand;
            break;
          }
        }
        return [
          {
            pageIndex: 0,
            isFirst: true,
            isLast: true,
            rows: allEntries,
            effectiveOuterRowPx: bestOuter,
            cellInnerPx: Math.max(19, Math.floor(bestOuter - 1)),
            fillerCount: 0,
          },
        ];
      }
    }

    // 2. Multi-Page Mode: pack non-last pages completely full with actual item rows (품목) down to 13mm margin
    const multiBaseOuterPx =
      orientation === "landscape"
        ? rowHeightPx <= 24
          ? Math.max(21, rowHeightPx)
          : rowHeightPx >= 36
            ? Math.min(rowHeightPx, 30)
            : 24
        : rowHeightPx <= 28
          ? Math.max(26, rowHeightPx)
          : rowHeightPx >= 36
            ? Math.min(rowHeightPx, 36)
            : 28;

    const pages: {
      pageIndex: number;
      isFirst: boolean;
      isLast: boolean;
      rows: typeof allEntries;
      effectiveOuterRowPx: number;
      cellInnerPx: number;
      fillerCount: number;
    }[] = [];

    let cursor = 0;
    let pageIdx = 0;

    while (cursor < allEntries.length) {
      const isFirst = pageIdx === 0;
      const remainingEntries = allEntries.slice(cursor);

      // Check if all remaining items fit on this continuation page as the final sheet (with 합계 + 배송메모)
      if (!isFirst) {
        const minRemPx = remainingEntries.reduce(
          (sum, e) => sum + getRowRequiredOuterPx(e.row, minOuterRowPx),
          0,
        );
        if (minRemPx <= lastPageFitBudget) {
          let lastOuter = minOuterRowPx;
          for (
            let cand = multiBaseOuterPx;
            cand >= minOuterRowPx;
            cand = Math.round((cand - 0.5) * 10) / 10
          ) {
            const candPx = remainingEntries.reduce(
              (sum, e) => sum + getRowRequiredOuterPx(e.row, cand),
              0,
            );
            if (candPx <= lastPageFitBudget) {
              lastOuter = cand;
              break;
            }
          }
          const usedPx = remainingEntries.reduce(
            (sum, e) => sum + getRowRequiredOuterPx(e.row, lastOuter),
            0,
          );
          const fillerCount = Math.max(
            0,
            Math.floor((lastPageFillerBudget - usedPx) / lastOuter),
          );
          pages.push({
            pageIndex: pageIdx,
            isFirst: false,
            isLast: true,
            rows: remainingEntries,
            effectiveOuterRowPx: lastOuter,
            cellInnerPx: Math.max(19, Math.floor(lastOuter - 1)),
            fillerCount,
          });
          cursor = allEntries.length;
          break;
        }
      }

      // Non-last page (Page 1 or intermediate sheet): fill full budget with actual items, leaving >= 1 item for next sheet
      const pageBudget = isFirst ? firstPageBodyBudget : midPageBodyBudget;
      const pageMaxRows = isFirst
        ? orientation === "landscape"
          ? 20
          : 26
        : orientation === "landscape"
          ? 30
          : 38;
      const maxExclusive = Math.min(
        cursor + pageMaxRows,
        Math.max(cursor + 1, allEntries.length - 1),
      );

      let usedPx = 0;
      let end = cursor;
      while (end < maxExclusive) {
        const rowPx = getRowRequiredOuterPx(
          allEntries[end].row,
          multiBaseOuterPx,
        );
        if (end > cursor && usedPx + rowPx > pageBudget) {
          break;
        }
        usedPx += rowPx;
        end += 1;
      }
      if (end === cursor) {
        end = Math.min(allEntries.length, cursor + 1);
        usedPx = getRowRequiredOuterPx(
          allEntries[cursor].row,
          multiBaseOuterPx,
        );
      }

      const pageRows = allEntries.slice(cursor, end);
      const leftoverPx = Math.max(0, pageBudget - usedPx);
      const extraPerRow = leftoverPx / Math.max(1, pageRows.length);
      const stretchedOuter =
        extraPerRow > 0 && extraPerRow <= 5
          ? Math.floor((multiBaseOuterPx + extraPerRow) * 10) / 10
          : multiBaseOuterPx;
      const stretchedUsedPx = pageRows.reduce(
        (sum, e) => sum + getRowRequiredOuterPx(e.row, stretchedOuter),
        0,
      );
      const fillerCount = Math.max(
        0,
        Math.floor((pageBudget - stretchedUsedPx) / stretchedOuter),
      );

      pages.push({
        pageIndex: pageIdx,
        isFirst,
        isLast: false,
        rows: pageRows,
        effectiveOuterRowPx: stretchedOuter,
        cellInnerPx: Math.max(19, Math.floor(stretchedOuter - 1)),
        fillerCount,
      });
      cursor = end;
      pageIdx += 1;
    }

    if (pages.length > 0 && !pages[pages.length - 1].isLast) {
      pages[pages.length - 1].isLast = true;
    }

    return pages;
  }, [items, orientation, rowHeightPx, colWidths, catalogList, customMemoHeightPx]);

  const pageRowCapacity = orientation === "landscape" ? 20 : 25;

  const estimatedPages = a4Pages.length;
  const totalStackHeight =
    a4Pages.length * sheetBaseHeight +
    Math.max(0, a4Pages.length - 1) * a4PageGapPx;

  const handleTrimEmptyRows = () => {
    const lastFilledIdx = (() => {
      for (let i = items.length - 1; i >= 0; i--) {
        const r = items[i];
        if (
          r.productId ||
          r.productName.trim() ||
          r.spec.trim() ||
          r.quantity.trim() ||
          r.note.trim()
        ) {
          return i;
        }
      }
      return -1;
    })();
    const minKeep = Math.max(MIN_ORDER_ROW_COUNT, lastFilledIdx + 1);
    setItems((prev) => {
      const next = prev.slice(0, minKeep);
      while (next.length < MIN_ORDER_ROW_COUNT) {
        next.push(createEmptyOrderRow());
      }
      return next;
    });
    toast({
      title: `빈 행을 정리하여 총 ${minKeep}행(최소 ${MIN_ORDER_ROW_COUNT}행 유지)으로 맞췄습니다.`,
    });
  };

  const handleExportCsv = () => {
    const esc = (v: string) => {
      const s = String(v ?? "");
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rowsCsv: string[] = [];
    rowsCsv.push(
      ["문서제목", "COAS 발주서 (PURCHASE ORDER)", "발주일자", todayStr, "문서번호", autoDocNo]
        .map(esc)
        .join(","),
    );
    rowsCsv.push(
      [
        "발주처",
        companyName || "",
        "담당자",
        contactName || "",
        "연락처",
        phone || "",
        "배송방법",
        shippingMethod,
      ]
        .map(esc)
        .join(","),
    );
    rowsCsv.push(
      ["납품주소", deliveryAddress || "", "희망납기", desiredDate || "", "이메일", email || ""]
        .map(esc)
        .join(","),
    );
    rowsCsv.push("");
    rowsCsv.push(
      ["No", "모델코드", "품명", "규격/레일길이(mm)", "색상/재질", "단위", "수량", "비고"]
        .map(esc)
        .join(","),
    );
    items.forEach((row, i) => {
      const resolved = resolveRowMasterDisplay(row);
      const hasAny =
        resolved.code ||
        resolved.title ||
        row.spec.trim() ||
        row.quantity.trim() ||
        row.note.trim();
      if (!hasAny) return;
      rowsCsv.push(
        [
          String(i + 1),
          resolved.code,
          resolved.title,
          row.spec.trim(),
          (row.color || "").trim(),
          row.unit || "EA",
          row.quantity.trim() || "1",
          row.note.trim(),
        ]
          .map(esc)
          .join(","),
      );
    });
    if (memo.trim()) {
      rowsCsv.push("");
      rowsCsv.push(["특기사항/배송메모", memo.trim()].map(esc).join(","));
    }

    const blob = new Blob(["\uFEFF" + rowsCsv.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `COAS_발주서_${todayStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "엑셀 호환 발주서(.csv) 파일이 다운로드되었습니다.",
    });
  };

  const resetAll = () => {
    if (
      !window.confirm(
        "입력하신 발주 품목과 내용을 초기 상태로 비우시겠습니까?",
      )
    )
      return;
    const fresh = clearOrderDraft(true);
    setItems(fresh.items);
    setAttachments([]);
    setMemo("");
  };

  const updateCell = (
    idx: number,
    field: keyof OrderLineItem,
    value: string,
  ) => {
    setItems((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    );
  };

  // Apply multi-row / multi-column tab-separated paste from Excel
  const applySpreadsheetPaste = (
    rawText: string,
    startRowIdx = 0,
    startColIdx = 0,
  ) => {
    const lines = rawText
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .filter((line) => line.trim().length > 0);
    if (lines.length === 0) return;

    const colFields: (keyof OrderLineItem)[] = [
      "productName",
      "spec",
      "color",
      "unit",
      "quantity",
      "note",
    ];

    let matchedCount = 0;
    let skippedUnregistered = 0;

    setItems((prev) => {
      const neededRows = Math.max(prev.length, startRowIdx + lines.length + 2);
      const next = [...prev];
      while (next.length < neededRows) {
        next.push(createEmptyOrderRow());
      }

      lines.forEach((line, rOffset) => {
        const cells = line.split("\t").map((c) => c.trim());
        const targetRow = startRowIdx + rOffset;
        const updated = { ...next[targetRow] };

        const bindProductField = (rawVal: string) => {
          const master = findMasterCatalogItem({ productName: rawVal });
          if (master) {
            updated.productId = master.id;
            updated.productName =
              master.title && master.title !== master.code
                ? `${master.code} (${master.title})`
                : master.code;
            matchedCount += 1;
          } else {
            skippedUnregistered += 1;
          }
        };

        if (cells.length === 1) {
          const field = colFields[startColIdx] || "productName";
          if (field === "productName") {
            bindProductField(cells[0]);
          } else {
            (updated as Record<string, string | undefined>)[field] = cells[0];
          }
        } else {
          cells.forEach((cellVal, cOffset) => {
            const field = colFields[startColIdx + cOffset];
            if (!field || cellVal === "") return;
            if (field === "productName") {
              bindProductField(cellVal);
            } else {
              (updated as Record<string, string | undefined>)[field] = cellVal;
            }
          });
          if (!updated.quantity) updated.quantity = "1";
          if (!updated.unit) updated.unit = "EA";
        }
        next[targetRow] = updated;
      });

      return next;
    });

    toast({
      title: `엑셀 데이터 ${lines.length}행 처리 완료`,
      description:
        skippedUnregistered > 0
          ? `공식 품목 ${matchedCount}건 연동 완료 · 카탈로그 미등록 품명 ${skippedUnregistered}건은 셀 클릭으로 선택해 주세요.`
          : `공식 카탈로그 마스터 품목 ${matchedCount}건이 정확히 연동되었습니다.`,
    });
  };

  // Keyboard navigation (Enter / ArrowUp / ArrowDown) across multi-page A4 Excel Grid
  const handleCellKeyDown = (
    e: React.KeyboardEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    rowIdx: number,
    colIdx: number,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const nextRow = rowIdx + 1;
      if (nextRow >= items.length) {
        addRows(1);
      }
      setTimeout(() => {
        const el = sheetFormRef.current?.querySelector<HTMLElement>(
          `[data-cell="${nextRow}-${colIdx}"]`,
        );
        el?.focus();
      }, 25);
    } else if (e.key === "ArrowDown" && e.currentTarget.tagName !== "TEXTAREA") {
      e.preventDefault();
      const nextRow = rowIdx + 1;
      if (nextRow >= items.length) {
        addRows(1);
      }
      setTimeout(() => {
        const el = sheetFormRef.current?.querySelector<HTMLElement>(
          `[data-cell="${nextRow}-${colIdx}"]`,
        );
        el?.focus();
      }, 25);
    } else if (
      e.key === "ArrowUp" &&
      rowIdx > 0 &&
      e.currentTarget.tagName !== "TEXTAREA"
    ) {
      e.preventDefault();
      const el = sheetFormRef.current?.querySelector<HTMLElement>(
        `[data-cell="${rowIdx - 1}-${colIdx}"]`,
      );
      el?.focus();
    }
  };

  // Summary calculation (unit display order: EA -> SET -> BOX -> 식)
  const summary = useMemo(() => {
    const valid = items.filter((r) => r.productName.trim().length > 0);
    let totalQty = 0;
    const unitCounts: Record<string, number> = {};
    for (const r of valid) {
      const q = parseFloat(String(r.quantity || "").replace(/[^0-9.]/g, ""));
      const num = Number.isNaN(q) ? 0 : q;
      totalQty += num;
      const u = (r.unit || "EA").toUpperCase();
      unitCounts[u] = (unitCounts[u] || 0) + num;
    }
    const unitOrder = ["EA", "SET", "BOX", "식"];
    const unitSummary = Object.entries(unitCounts)
      .sort(([a], [b]) => {
        const ia = unitOrder.indexOf(a);
        const ib = unitOrder.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      })
      .map(([u, n]) => `${u} ${n}`)
      .join(" / ");
    return {
      itemCount: valid.length,
      totalQty,
      unitSummary: unitSummary || "단위별 수량 합산",
    };
  }, [items]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploadedList: OrderAttachment[] = [];
      for (const file of Array.from(files)) {
        const uploaded = await uploadOrderAttachment(file);
        uploadedList.push(uploaded);
      }
      setAttachments((prev) => [...prev, ...uploadedList]);
      toast({
        title: "첨부파일 등록 완료",
        description: `${uploadedList.length}개의 파일이 발주서에 첨부되었습니다.`,
      });
    } catch (err: any) {
      toast({
        title: "파일 업로드 실패",
        description: err.message || "파일 형식을 확인해주세요.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast({
        title: "발주처 업체명(상호)을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    if (!contactName.trim()) {
      toast({
        title: "담당자 성함을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    if (!phone.trim()) {
      toast({
        title: "연락처를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    if (shippingMethod !== "방문수령" && !deliveryAddress.trim()) {
      toast({
        title:
          shippingMethod === "화물"
            ? "납품주소 또는 수령 화물 지점명을 입력해주세요."
            : "택배 수령지 주소를 입력해주세요.",
        description:
          "본사 직접 수령인 경우 배송방법을 [방문수령]으로 선택해주세요.",
        variant: "destructive",
      });
      deliveryAddressInputRef.current?.focus();
      return;
    }

    const validItems = items
      .filter((i) => i.productName.trim() || i.productId)
      .map((i) => {
        const resolved = resolveRowMasterDisplay(i);
        return {
          productId: resolved.productId,
          productName: resolved.displayFull || i.productName.trim(),
          spec: i.spec.trim(),
          color: (i.color || "").trim(),
          unit: (i.unit || "EA").trim(),
          quantity: i.quantity.trim() || "1",
          note: i.note.trim(),
        };
      });

    if (validItems.length === 0 && attachments.length === 0) {
      toast({
        title: "발주 품목 또는 첨부파일을 확인해주세요",
        description:
          "표에 품목을 1개 이상 입력하시거나 우측 견출 탭에서 PDF·캐드도면·엑셀 파일을 첨부해주세요.",
        variant: "destructive",
      });
      setAttachmentTabOpen(true);
      return;
    }

    const combinedMemo = [
      shippingMethod ? `[배송방법: ${shippingMethod}]` : "",
      memo.trim(),
    ]
      .filter(Boolean)
      .join(" ");

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          contactName: contactName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          deliveryAddress: deliveryAddress.trim(),
          desiredDate: desiredDate.trim(),
          doorType: recDoorType,
          items: validItems,
          attachments,
          memo: combinedMemo,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "발주서 접수 중 오류가 발생했습니다.");
      }
      fetch("/api/part-affinity")
        .then((r) => (r.ok ? r.json() : null))
        .then((aff) => {
          if (aff && Array.isArray(aff.records)) setAffinityRecords(aff.records);
          if (typeof aff?.totalLearnedOrders === "number") {
            setTotalLearnedOrders(aff.totalLearnedOrders);
          }
        })
        .catch(() => {});
      // Save buyer profile automatically for quick reuse on next order
      const buyerPayload = {
        companyName,
        contactName,
        phone,
        email,
        deliveryAddress,
        shippingMethod,
      };
      setBuyerProfiles(upsertBuyerProfile(buyerPayload));
      fetch("/api/buyer-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buyerPayload),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((syncRes) => {
          if (syncRes?.synced && Array.isArray(syncRes.buyers)) {
            setBuyerProfiles(mergeAndSaveBuyerProfiles(syncRes.buyers));
          }
        })
        .catch(() => {});
      // Clear active draft session upon successful submission
      clearOrderDraft(false);
      setRecTrayOpen(false);
      closeZoomPopup();
      // Automatically archive submitted order into Customer Order History
      const submittedValidItems = items.filter(
        (r) => r.productId || r.productName.trim() || r.spec.trim(),
      );
      if (submittedValidItems.length > 0) {
        addOrderHistoryRecord({
          orderNumber: data.orderNumber,
          orderDate: new Date().toISOString().slice(0, 10),
          companyName: companyName.trim() || "상호 미입력",
          contactName: contactName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          deliveryAddress: deliveryAddress.trim(),
          shippingMethod,
          desiredDate,
          memo: memo.trim(),
          items: submittedValidItems,
          itemCount: submittedValidItems.length,
          totalQuantity: submittedValidItems.reduce(
            (acc, it) => acc + (parseInt(it.quantity, 10) || 1),
            0,
          ),
          summary:
            submittedValidItems
              .slice(0, 3)
              .map(
                (it) =>
                  `${it.productName || it.spec} ${it.quantity || 1}${it.unit || "EA"}`,
              )
              .join(", ") +
            (submittedValidItems.length > 3
              ? ` 외 ${submittedValidItems.length - 3}건`
              : ""),
          isFavorite: false,
        });
      }

      setSubmittedOrderNumber(data.orderNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      toast({
        title: "발주서 접수 오류",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const company = cms.design.company;
  const zoomedAddedInfo = zoomedItem ? addedItemMap.get(zoomedItem.id) : null;

  return (
    <Layout>
      <Helmet>
        <title>발주서 작성 | E-COAS</title>
        <meta
          name="description"
          content="코아스(E-COAS) 온라인 엑셀 발주서 작성 페이지. 좌측 부품 카탈로그에서 클릭하여 담거나 엑셀 표에 직접 입력하여 발주하실 수 있습니다."
        />
      </Helmet>

      {/* Print Styles: Strict multi-page A4 layout respecting exact 210×297 / 297×210 physical dimensions */}
      <style>{`
        @media print {
          @page {
            size: A4 ${orientation};
            margin: 0;
          }
          header, footer, .no-print {
            display: none !important;
          }
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-sheet-wrapper {
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          .print-zoom-outer {
            width: auto !important;
            height: auto !important;
          }
          .print-zoom-inner {
            width: 100% !important;
            transform: none !important;
          }
          .print-form-stack {
            gap: 0 !important;
          }
          .a4-sheet-page {
            width: ${orientation === "landscape" ? "297mm" : "210mm"} !important;
            min-width: ${orientation === "landscape" ? "297mm" : "210mm"} !important;
            max-width: ${orientation === "landscape" ? "297mm" : "210mm"} !important;
            height: ${orientation === "landscape" ? "210mm" : "297mm"} !important;
            min-height: ${orientation === "landscape" ? "210mm" : "297mm"} !important;
            max-height: ${orientation === "landscape" ? "210mm" : "297mm"} !important;
            padding: ${orientation === "landscape" ? "7mm 11mm 13mm 15mm" : "15mm 12.7mm 13mm 12.7mm"} !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            break-after: page;
            page-break-after: always;
          }
          .a4-sheet-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }
          input::placeholder,
          textarea::placeholder {
            color: transparent !important;
            opacity: 0 !important;
          }
        }
      `}</style>

      {/* Fixed Top Header Dark Backdrop (56px = h-14) so main navbar is always dark and crisp */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 z-50 no-print pointer-events-none" />

      {/* =====================================================================
          FIXED TOP SUB-HEADER CONTROL BAR (1-Row Full-Width Ribbon under Header)
          • Compact Zoom (- / % / + / Fit) + Orientation + Row Adjuster (min 15) + Layout Popover
          • Strictly 1 single row (whitespace-nowrap, h-11 / 44px)
         ===================================================================== */}
      {!submittedOrderNumber && (
        <div
          data-testid="external-a4-control-bar"
          className="fixed top-14 left-0 right-0 h-11 z-50 bg-slate-800/95 backdrop-blur-md text-white border-b border-slate-700 shadow-md px-3 flex items-center justify-center no-print"
        >
          <div className="flex items-center gap-1.5 whitespace-nowrap overflow-x-auto max-w-full py-1">
            <span className="px-2 py-0.5 rounded bg-[#FF7B00] text-white text-[11px] font-bold shrink-0">
              A4 정사이즈
            </span>

            {/* Page Zoom Controls: - | 100% | + | Fit */}
            <div
              className="flex items-center bg-slate-900 border border-slate-600 rounded overflow-hidden shrink-0"
              title="화면 배율을 조절합니다 (A4 종이 비율 및 인쇄 정사이즈는 항상 동일 유지)"
            >
              <button
                type="button"
                onClick={() => setZoomPct((z) => Math.max(60, z - 10))}
                disabled={zoomPct <= 60}
                data-testid="button-zoom-out"
                className="px-2 py-1 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold border-r border-slate-700 cursor-pointer"
                title="화면 축소 (-10%)"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => setZoomPct(100)}
                data-testid="button-zoom-reset"
                className="px-2 py-1 hover:bg-slate-700 text-[11px] font-extrabold text-orange-300 min-w-[44px] text-center cursor-pointer"
                title="클릭 시 100% 원본 크기로 복원"
              >
                {zoomPct}%
              </button>
              <button
                type="button"
                onClick={() => setZoomPct((z) => Math.min(160, z + 10))}
                disabled={zoomPct >= 160}
                data-testid="button-zoom-in"
                className="px-2 py-1 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold border-l border-slate-700 cursor-pointer"
                title="화면 확대 (+10%)"
              >
                +
              </button>
              <button
                type="button"
                onClick={handleFitToScreen}
                data-testid="button-zoom-fit"
                className="px-2 py-1 hover:bg-slate-700 text-sky-300 border-l border-slate-700 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                title="현재 창 너비에 맞춰 발주서 배율 자동 맞춤 (재클릭 시 100%)"
              >
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">맞춤</span>
              </button>
            </div>

            {/* 1-Click A4 Orientation Toggle */}
            <div
              className="flex items-center bg-slate-900 border border-slate-600 rounded overflow-hidden shrink-0"
              title="A4 세로(210×297mm) / A4 가로(297×210mm) 정사이즈 비율 전환"
            >
              <button
                type="button"
                onClick={() => handleChangeOrientation("portrait")}
                data-testid="button-orient-portrait"
                className={`px-2 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                  orientation === "portrait"
                    ? "bg-[#FF7B00] text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                A4 세로
              </button>
              <button
                type="button"
                onClick={() => handleChangeOrientation("landscape")}
                data-testid="button-orient-landscape"
                className={`px-2 py-1 text-[11px] font-bold border-l border-slate-700 cursor-pointer transition-colors ${
                  orientation === "landscape"
                    ? "bg-[#FF7B00] text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                A4 가로
              </button>
            </div>

            {/* Direct Row Count Adjuster (Minimum 15 Rows, Preserves Exact A4 Aspect Ratio) */}
            <div
              className="flex items-center bg-slate-900 border border-orange-500/60 rounded overflow-hidden shrink-0"
              title={`발주 품목 행 수를 조절합니다 (최소 ${MIN_ORDER_ROW_COUNT}행 · A4 비율 고정 유지)`}
            >
              <button
                type="button"
                onClick={() => removeRows(1)}
                disabled={items.length <= MIN_ORDER_ROW_COUNT}
                data-testid="button-row-minus"
                className="px-1.5 py-1 hover:bg-slate-700 disabled:opacity-35 text-slate-200 border-r border-slate-700 cursor-pointer"
                title={`1행 줄이기 (최소 ${MIN_ORDER_ROW_COUNT}행)`}
              >
                <Minus className="w-3 h-3" />
              </button>
              <div className="flex items-center px-1.5 py-0.5 bg-slate-950/80">
                <input
                  type="number"
                  min={MIN_ORDER_ROW_COUNT}
                  max={200}
                  value={rowCountDraft}
                  data-testid="input-row-count"
                  onChange={(e) => {
                    setRowCountDraft(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const parsed = parseInt(rowCountDraft, 10);
                      if (!Number.isNaN(parsed)) {
                        setTargetRowCount(parsed);
                      } else {
                        setRowCountDraft(String(items.length));
                      }
                    }
                  }}
                  onBlur={() => {
                    const parsed = parseInt(rowCountDraft, 10);
                    if (!Number.isNaN(parsed)) {
                      setTargetRowCount(parsed);
                    } else {
                      setRowCountDraft(String(items.length));
                    }
                  }}
                  className="w-8 text-[11px] font-extrabold text-center text-orange-300 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[10px] font-bold text-slate-300">행</span>
              </div>
              <button
                type="button"
                onClick={() => addRows(1)}
                data-testid="button-row-plus"
                className="px-1.5 py-1 hover:bg-slate-700 text-slate-200 border-l border-slate-700 cursor-pointer"
                title="1행 추가"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => addRows(5)}
                data-testid="button-row-plus-5"
                className="px-2 py-1 hover:bg-slate-700 text-orange-300 text-[11px] font-bold border-l border-slate-700 cursor-pointer"
                title="5행 추가 (페이지 초과 시 다음 A4 장으로 자동 분할)"
              >
                +5행
              </button>
            </div>

            {/* Unified Print, Page Orientation, Row Height, Column Fit & Export Popover */}
            <button
              ref={layoutTriggerRef}
              type="button"
              onClick={() => setLayoutPopoverOpen((o) => !o)}
              data-testid="button-layout-popover"
              className={`px-2.5 py-1 rounded border text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                layoutPopoverOpen
                  ? "border-[#FF7B00] bg-slate-700 text-white"
                  : "border-sky-400/60 bg-slate-900 hover:bg-slate-700 text-sky-100"
              }`}
              title="용지설정, 행 프리셋, 열 폭 정렬 및 내보내기"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-300" />
              <span>용지설정</span>
              <span className="text-[10px] text-sky-300 font-semibold px-1 py-0.2 rounded bg-sky-950/60 border border-sky-400/40">
                총 {estimatedPages}장
              </span>
              <ChevronDown
                className={`w-3 h-3 text-slate-400 transition-transform ${
                  layoutPopoverOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {layoutPopoverOpen && (
              <div
                ref={layoutPopoverRef}
                style={{
                  left: layoutTriggerRef.current
                    ? `${Math.max(12, Math.min(window.innerWidth - 482, layoutTriggerRef.current.getBoundingClientRect().left))}px`
                    : "50%",
                }}
                className="fixed top-[104px] z-50 w-[470px] max-w-[95vw] p-3.5 bg-white text-slate-900 border border-slate-300 shadow-2xl rounded-lg space-y-3 whitespace-normal"
              >
                {/* Quick Actions: Print & Excel CSV */}
                <div className="space-y-1.5 pb-2.5 border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Printer className="w-3.5 h-3.5 text-[#FF7B00]" />
                      인쇄 / PDF 저장 (A4 100% 정사이즈 · 총 {estimatedPages}장)
                    </span>
                    <span className="text-[10px] text-slate-300">
                      Ctrl + P
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      엑셀 호환 파일 저장 (.csv)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      입력 품목 전체
                    </span>
                  </button>
                </div>

                {/* 1 & 2 & 3: Visual Thumbnail Carousel + 5-Item Pulldown Manager (Up to 20 Custom Presets) */}
                <LayoutPresetManager
                  currentSettings={{
                    orientation,
                    rowCount: items.length,
                    rowHeightPx,
                    colWidths,
                    zoomPct,
                  }}
                  onApplyPreset={handleApplyLayoutPreset}
                  activePresetId={activePresetId}
                />

                {/* Orientation & Row Count Manual Controls */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-600 w-14 shrink-0">
                      용지 방향
                    </span>
                    <div className="flex items-center gap-1.5 flex-1">
                      <button
                        type="button"
                        onClick={() => handleChangeOrientation("portrait")}
                        className={`flex-1 py-1 rounded border text-[11px] font-bold cursor-pointer transition-colors ${
                          orientation === "portrait"
                            ? "bg-orange-50 border-[#FF7B00] text-[#FF7B00]"
                            : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        A4 세로 (210×297)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeOrientation("landscape")}
                        className={`flex-1 py-1 rounded border text-[11px] font-bold cursor-pointer transition-colors ${
                          orientation === "landscape"
                            ? "bg-orange-50 border-[#FF7B00] text-[#FF7B00]"
                            : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        A4 가로 (297×210)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-600 w-14 shrink-0">
                      표 행 수
                    </span>
                    <div className="flex items-center gap-1 flex-1 flex-wrap">
                      {(["10", "15", "20", "25", "30"] as const).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleApplyA4Preset(preset)}
                          className={`px-2 py-1 rounded border text-[11px] font-bold cursor-pointer transition-colors ${
                            a4Preset === preset
                              ? "bg-orange-50 border-[#FF7B00] text-[#FF7B00]"
                              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {preset === "10"
                            ? "10행(메모확대)"
                            : preset === "20"
                              ? "20행(기본)"
                              : preset === "15"
                                ? "15행"
                                : preset === "25" && orientation === "portrait"
                                  ? "25행(1장최대)"
                                  : `${preset}행`}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => addRows(5)}
                        className="px-2 py-1 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold cursor-pointer"
                      >
                        +5행
                      </button>
                      <button
                        type="button"
                        onClick={handleTrimEmptyRows}
                        className="px-2 py-1 rounded border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold cursor-pointer ml-auto"
                        title={`품목이 비어 있는 하단 여백 행을 정리합니다 (최소 ${MIN_ORDER_ROW_COUNT}행 유지)`}
                      >
                        빈 행 정리
                      </button>
                    </div>
                  </div>

                  {/* Row Height (Narrow / Standard / Wide / Exact px) */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-600 w-14 shrink-0">
                      행 높이
                    </span>
                    <div className="flex items-center gap-1 flex-1 flex-wrap">
                      {[
                        { label: "좁게 26", px: 26 },
                        { label: "표준 32", px: 32 },
                        { label: "넓게 40", px: 40 },
                      ].map((opt) => (
                        <button
                          key={opt.px}
                          type="button"
                          onClick={() => applyRowHeight(opt.px)}
                          className={`px-2 py-1 rounded border text-[11px] font-bold cursor-pointer transition-colors ${
                            rowHeightPx === opt.px
                              ? "bg-orange-50 border-[#FF7B00] text-[#FF7B00]"
                              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                      <div className="flex items-center border border-slate-300 rounded px-1.5 py-0.5 bg-white">
                        <input
                          type="number"
                          min={22}
                          max={56}
                          value={rowHeightDraft}
                          onChange={(e) => {
                            setRowHeightDraft(e.target.value);
                            const v = parseInt(e.target.value, 10);
                            if (!isNaN(v) && v >= 22 && v <= 56) {
                              setRowHeightPx(v);
                            }
                          }}
                          onBlur={() => setRowHeightDraft(String(rowHeightPx))}
                          className="w-10 text-[11px] font-bold text-right text-slate-900 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500 ml-0.5">
                          px
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 ml-auto">
                        1장 최대 {pageRowCapacity}행 ·{" "}
                        <strong className="text-slate-900">
                          A4 {estimatedPages}장
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Column Width Status & Auto Fit */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-600 w-14 shrink-0">
                      열 폭
                    </span>
                    <div className="flex items-center justify-between gap-2 flex-1">
                      <span className="text-[11px] text-slate-700 font-semibold">
                        {colsCustomEdited ? "직접 정함" : "자동 균형"} ·{" "}
                        <span className="text-[#FF7B00] font-bold">
                          두 줄 이상 {multiLineCount}건
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={handleAutoFitColumns}
                        data-testid="button-autofit-columns"
                        className="px-2.5 py-1 rounded border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>셀 폭 자동정렬</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save / Restore Default Preferences */}
                <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleRestoreDefaultPrefs}
                    className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold cursor-pointer"
                  >
                    당사 기본값(32px·100%)으로
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDefaultPrefs}
                    className="px-2.5 py-1 rounded bg-[#FF7B00] hover:bg-[#e66f00] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3 h-3" />
                    <span>현재 설정을 기본값으로 저장</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Toggle for Right-Edge 견출 첨부파일 Tab */}
            <button
              type="button"
              data-attachment-toggle="true"
              onClick={() => setAttachmentTabOpen((o) => !o)}
              className={`px-2 py-1 rounded border text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                attachments.length > 0
                  ? "border-emerald-400 bg-emerald-950/70 text-emerald-200 hover:bg-emerald-900/80"
                  : attachmentTabOpen
                    ? "border-[#FF7B00] bg-slate-700 text-white"
                    : "border-slate-600 bg-slate-700 hover:bg-slate-600 text-white"
              }`}
              title="발주서 우측 견출 탭에서 PDF, 캐드도면(.dwg/.dxf), 엑셀(.xlsx) 파일을 첨부합니다"
            >
              <Paperclip className="w-3.5 h-3.5 text-orange-300" />
              <span>
                첨부{attachments.length > 0 ? `(${attachments.length})` : ""}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPasteModalOpen(true)}
              className="px-2 py-1 rounded border border-slate-600 bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title="엑셀 복사 데이터를 표에 붙여넣기합니다"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-orange-300" />
              <span>엑셀 붙여넣기</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setDrawerOpen((o) => {
                  const next = !o;
                  if (!next) {
                    setRecTrayOpen(false);
                    closeZoomPopup();
                  }
                  return next;
                })
              }
              className="px-2 py-1 rounded border border-slate-600 bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold transition-colors cursor-pointer shrink-0"
            >
              {drawerOpen ? "◀ 부품창 닫기" : "▶ 부품 빠른담기"}
            </button>

            {/* Quick Toggle for Right-Edge 거래처 히스토리 Drawer */}
            <button
              type="button"
              onClick={() => setHistoryDrawerOpen((o) => !o)}
              className={`px-2 py-1 rounded border text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                historyDrawerOpen
                  ? "border-[#FF7B00] bg-orange-600 text-white"
                  : "border-slate-600 bg-slate-700 hover:bg-slate-600 text-white"
              }`}
              title="거래처별 과거 발주 이력을 확인하고 발주서에 불러옵니다"
            >
              <History className="w-3.5 h-3.5 text-orange-300" />
              <span>거래처 히스토리</span>
            </button>

            {/* Buyer Authentication Status / Quick Login Button */}
            {buyerSession.isAuthenticated ? (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 shrink-0 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span
                  className="font-bold text-slate-200 truncate max-w-[130px]"
                  title={buyerSession.companyName}
                >
                  {buyerSession.companyName}
                </span>
                <button
                  type="button"
                  onClick={handleBuyerLogout}
                  className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                  title="로그아웃"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setBuyerAuthModalOpen(true)}
                className="px-2 py-1 rounded bg-[#FF7B00] hover:bg-[#e66f00] text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-xs"
                title="사업자/휴대폰/카카오/네이버로 간편로그인하여 우리 회사 발주 이력을 불러옵니다"
              >
                <span>🔑 업체 간편로그인</span>
              </button>
            )}

            <div className="h-3.5 w-[1px] bg-slate-600 mx-0.5 shrink-0" />

            <button
              type="button"
              onClick={() => window.print()}
              className="px-2.5 py-1 rounded border border-slate-500 bg-white text-slate-900 hover:bg-slate-100 text-[11px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title="A4 용지 규격으로 인쇄하거나 PDF로 저장합니다"
            >
              <Printer className="w-3.5 h-3.5 text-[#FF7B00]" />
              <span>인쇄/PDF</span>
            </button>

            <button
              type="button"
              onClick={resetAll}
              className="px-2 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-red-950/60 hover:border-red-500/50 text-slate-300 hover:text-red-200 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title="입력된 모든 내용을 초기화합니다"
            >
              <RotateCcw className="w-3 h-3" />
              <span>초기화</span>
            </button>

            <div className="h-3.5 w-[1px] bg-slate-600 mx-0.5 shrink-0" />

            <button
              type="submit"
              form="order-excel-form"
              disabled={submitting || uploading}
              data-testid="button-submit-order"
              className="px-3 py-1 rounded bg-[#FF7B00] hover:bg-[#e66f00] disabled:opacity-60 text-white text-[11px] font-extrabold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-colors cursor-pointer shrink-0"
              title="작성한 A4 발주서를 코아스로 즉시 접수합니다"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>접수 중...</span>
                </>
              ) : (
                <span>발주서 접수하기 →</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          LEFT SLIDING CATALOG DRAWER (TYPE C)
          Fixed width 420px, slides in/out from left without resizing Type A!
         ===================================================================== */}
      {!submittedOrderNumber && (
        <aside
          ref={drawerAsideRef}
          className={`fixed top-[100px] bottom-0 left-0 z-40 w-[420px] bg-white border-r-2 border-[#FF7B00] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out no-print ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-label="부품 빠른 검색 및 원클릭 담기"
        >
          {/* Always-Visible Orange Slide Toggle Handle on Right Edge of Drawer */}
          <button
            type="button"
            onClick={() => {
              setDrawerOpen((o) => {
                const next = !o;
                if (!next) {
                  setRecTrayOpen(false);
                  closeZoomPopup();
                }
                return next;
              });
            }}
            className="absolute left-full top-1/2 -translate-y-1/2 bg-[#FF7B00] hover:bg-[#e66f00] text-white rounded-r-lg px-2 py-4 shadow-lg border border-l-0 border-orange-600 flex flex-col items-center gap-1.5 cursor-pointer transition-colors"
            title={drawerOpen ? "부품창 닫기" : "부품 빠른 검색창 열기"}
          >
            {drawerOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span className="text-[11px] font-bold leading-tight [writing-mode:vertical-rl] tracking-wider">
              {drawerOpen ? "부품창 닫기" : "부품 빠른검색 · 담기"}
            </span>
          </button>

          {/* Drawer Top Bar */}
          <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF7B00]" />
                부품 빠른 검색 / 원클릭 담기
              </h2>
              <p className="text-[11px] text-slate-300 mt-0.5">
                이미지 클릭 시 <strong className="text-orange-300">600×610 확대</strong> · [+담기] 클릭 시 표에 입력
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                setRecTrayOpen(false);
                closeZoomPopup();
              }}
              className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              닫기
            </button>
          </div>

          {/* Search, Category Filter Tabs & Quick Navigation to Parts Index / New Products */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="모델명, 하중(60kg), 레일(SL-3332) 검색..."
                className="w-full h-9 pl-9 pr-7 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-[#FF7B00]"
              />
              {catalogSearch && (
                <button
                  type="button"
                  onClick={() => setCatalogSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1">
              {(
                [
                  { id: "all", label: "전체" },
                  { id: "sliding", label: "슬라이딩" },
                  { id: "damping", label: "댐핑(DP)" },
                  { id: "rail", label: "SL레일" },
                  { id: "glass", label: "유리/기타" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCatalogCategory(tab.id)}
                  className={`py-1.5 text-[11px] font-bold border rounded transition-colors whitespace-nowrap ${
                    catalogCategory === tab.id
                      ? "bg-[#FF7B00] text-white border-[#FF7B00]"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Direct Round-Trip Links to Parts Index & New Products */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <Link
                href="/parts-index"
                className="py-1.5 px-2 rounded bg-orange-50 hover:bg-orange-100 border border-orange-300 text-[#c25900] font-bold text-[11px] flex items-center justify-center gap-1 whitespace-nowrap transition-colors"
              >
                <span>부품 인덱스에서 찾기</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </Link>
              <Link
                href="/new-products"
                className="py-1.5 px-2 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-[11px] flex items-center justify-center gap-1 whitespace-nowrap transition-colors"
              >
                <span>신제품 페이지 보기</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </Link>
            </div>
          </div>

          {/* Scrollable Excel-Style Part Selector List (100% Full Height Preserved!) */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            {filteredCatalog.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                검색 조건에 맞는 부품이 없습니다.
                <br />
                우측 발주서 셀에 직접 입력하실 수 있습니다.
              </div>
            ) : (
              filteredCatalog.map((item) => {
                const addedInfo = addedItemMap.get(item.id);
                const isZoomed = zoomedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={`grid grid-cols-[84px_minmax(0,1fr)_72px] items-stretch border rounded overflow-hidden text-xs transition-all ${
                      isZoomed
                        ? "border-2 border-[#FF7B00] bg-orange-50/90 shadow-md"
                        : addedInfo
                          ? "border-orange-300 bg-orange-50/50"
                          : "border-slate-300 bg-white hover:border-slate-400"
                    }`}
                  >
                    {/* Thumbnail Cell — Image fills the card area, Hover reveals Zoom Overlay */}
                    <button
                      type="button"
                      data-zoom-trigger="true"
                      onClick={() => handleToggleZoom(item)}
                      data-testid={`button-zoom-${item.id}`}
                      title={
                        isZoomed
                          ? "클릭하면 확대창이 닫힙니다"
                          : "클릭하면 600×610 픽셀로 크게 확대합니다"
                      }
                      className={`border-r relative group cursor-pointer overflow-hidden p-1 flex items-center justify-center transition-colors min-h-[76px] ${
                        isZoomed
                          ? "bg-orange-50 border-orange-300"
                          : "bg-slate-50/80 hover:bg-white border-slate-300"
                      }`}
                    >
                      {item.image ? (
                        <img
                          src={resolveAssetUrl(item.image)}
                          alt={item.code}
                          loading="lazy"
                          className="w-full h-full max-h-[70px] object-contain transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                          NO IMG
                        </div>
                      )}

                      {/* Hover Overlay: Hidden normally, smoothly revealed on mouse hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-0.5 text-white select-none">
                        <div className="w-7 h-7 rounded-full bg-[#FF7B00] text-white flex items-center justify-center shadow-md transform scale-90 group-hover:scale-100 transition-transform">
                          <ZoomIn className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[9px] font-bold tracking-tight text-white drop-shadow">
                          600×610
                        </span>
                      </div>

                      {/* Active Zoom State Indicator */}
                      {isZoomed && (
                        <div className="absolute inset-0 bg-[#FF7B00]/25 border-2 border-[#FF7B00] flex flex-col items-center justify-center select-none">
                          <div className="w-6 h-6 rounded-full bg-[#FF7B00] text-white flex items-center justify-center shadow">
                            <ZoomOut className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[9px] font-bold text-[#FF7B00] bg-white/95 px-1 rounded shadow-sm mt-0.5">
                            축소
                          </span>
                        </div>
                      )}
                    </button>

                    {/* Middle Info Cell: Model code on top row + Title + Drawing link */}
                    <div className="px-2.5 py-1.5 flex flex-col justify-center min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
                        <span className="font-extrabold text-slate-900 text-xs truncate bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {item.code}
                        </span>
                        {item.page && (
                          <span className="text-[10px] text-[#FF7B00] font-bold shrink-0 whitespace-nowrap">
                            {item.page}
                          </span>
                        )}
                      </div>
                      <p
                        className="font-semibold text-slate-700 truncate text-[11px] leading-tight"
                        title={item.title}
                      >
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {item.specHint}
                      </p>
                      <div className="flex items-center justify-between gap-1.5 mt-1 min-w-0">
                        <Link
                          href={`/product/${item.id}`}
                          className="text-[10px] font-semibold text-slate-500 hover:text-[#FF7B00] hover:underline inline-flex items-center gap-0.5 whitespace-nowrap shrink-0"
                        >
                          <span>상세/도면 전체보기</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </Link>
                        {isAnchorRollerItem(item) && (
                          <button
                            type="button"
                            onClick={() => handleSelectAnchorForRec(item)}
                            className={`text-[10px] font-bold inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                              recPopupVisible && activeAnchorItem?.id === item.id
                                ? "bg-[#FF7B00] text-white border-[#FF7B00] shadow-sm"
                                : "bg-orange-50 text-[#c25900] border-orange-200 hover:bg-orange-100"
                            }`}
                            title="우측에 맞춤 레일·가이드·손잡이 추천 팝업 열기"
                          >
                            <Sparkles className="w-2.5 h-2.5 shrink-0" />
                            <span>추천부속</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right Action Cell: One-Click Add to Order Sheet */}
                    <button
                      type="button"
                      onClick={() => handleAddCatalogItem(item)}
                      className={`font-bold text-[11px] whitespace-nowrap flex flex-col items-center justify-center border-l transition-colors py-2 ${
                        addedInfo
                          ? "bg-slate-800 hover:bg-slate-900 text-white border-slate-800"
                          : "bg-[#FF7B00] hover:bg-[#e66f00] text-white border-[#FF7B00]"
                      }`}
                    >
                      <span>{addedInfo ? "담김" : "+ 담기"}</span>
                      {addedInfo && (
                        <span className="text-[10px] text-orange-300 font-extrabold mt-0.5">
                          ({addedInfo.qty}개)
                        </span>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer Note */}
          <div className="p-3 bg-orange-50 border-t border-orange-200 text-center shrink-0">
            <p className="text-[11px] font-bold text-orange-800">
              썸네일 클릭 시 600×610 확대 · [+담기] 클릭 시 자동 입력!
            </p>
            <p className="text-[10px] text-orange-700 mt-0.5">
              상세/부품인덱스 페이지 이동 시에도 작성 중인 발주서가 유지됩니다.
            </p>
          </div>
        </aside>
      )}

      {/* =====================================================================
          RIGHT SLIDING CUSTOMER ORDER HISTORY DRAWER
          Matches left catalog drawer style with always-visible orange tab!
         ===================================================================== */}
      {!submittedOrderNumber && (
        <>
          <OrderHistoryDrawer
            isOpen={historyDrawerOpen}
            onToggle={() => setHistoryDrawerOpen((o) => !o)}
            onClose={() => setHistoryDrawerOpen(false)}
            buyerSession={buyerSession}
            onOpenLoginModal={() => setBuyerAuthModalOpen(true)}
            onLogout={handleBuyerLogout}
            onApplyFullOrder={handleApplyFullHistoryOrder}
            onAddSelectedItems={handleAddHistorySelectedItems}
            onSaveCurrentAsHistory={handleSaveCurrentToHistory}
          />

          {/* All-in-One B2B Buyer Authentication Modal (1, 2, 3 options) */}
          <BuyerAuthModal
            isOpen={buyerAuthModalOpen}
            onClose={() => setBuyerAuthModalOpen(false)}
            onSuccess={handleBuyerLoginSuccess}
          />
        </>
      )}

      {/* =====================================================================
          COLUMN 2: DOCKING RELATED-PARTS RECOMMENDATION POPUP (392px Wide)
          • Strict Permission Separation: General customers are 100% Read/Add-Only
          • Separate Classification:
            1) ★ 관리자 지정 공식 추천 (Shown FIRST)
            2) ✓ 출고확정(처리완료) 발주 자동 학습 (Shown SECOND, separately classified)
            3) 카탈로그 규격 호환 부품 (Shown THIRD)
         ===================================================================== */}
      {recPopupVisible && activeAnchorItem && (
        <div
          ref={recPopupRef}
          data-testid="popup-related-part-recommendations"
          className="fixed top-[104px] bottom-4 left-3 lg:left-[430px] z-[45] w-[392px] max-w-[calc(100vw-24px)] bg-white rounded-xl border-2 border-[#FF7B00] shadow-2xl flex flex-col overflow-hidden no-print transition-all duration-200"
        >
          {/* Popup Header Bar */}
          <div className="px-3 py-2.5 bg-slate-900 text-white flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="w-4 h-4 text-[#FF7B00] shrink-0" />
              <span className="text-xs font-extrabold truncate">
                <span className="text-[#FF7B00]">[{activeAnchorItem.code}]</span>{" "}
                맞춤 추천 부속
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Discreet COAS Admin Lock / Curation Mode Toggle */}
              <button
                type="button"
                onClick={handleToggleAdminRecMode}
                data-testid="button-toggle-admin-rec-mode"
                className={`px-2 py-1 rounded border text-[10px] font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer transition-colors ${
                  isAdminRecMode
                    ? "bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700"
                }`}
                title={
                  isAdminRecMode
                    ? "관리자 추천 편집 모드 종료"
                    : "코아스 관리자 전용 추천 부속 지정·제외 설정"
                }
              >
                {isAdminRecMode ? (
                  <>
                    <ShieldCheck className="w-3 h-3 shrink-0" />
                    <span>편집중</span>
                  </>
                ) : (
                  <Lock className="w-3 h-3 shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setRecPopupPinned((p) => !p)}
                className={`px-2 py-1 rounded border text-[10.5px] font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer transition-colors ${
                  recPopupPinned
                    ? "bg-[#FF7B00] text-white border-[#FF7B00]"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                }`}
                title={
                  recPopupPinned
                    ? "창 고정 해제 (발주서 클릭 시 자동으로 닫힙니다)"
                    : "켜두면 우측 발주서를 클릭해도 추천창이 닫히지 않고 유지됩니다"
                }
              >
                <Pin className="w-3 h-3 shrink-0" />
                <span>{recPopupPinned ? "창고정됨" : "창고정"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRecTrayOpen(false);
                  closeZoomPopup();
                }}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                title="추천 부속 팝업 닫기 (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Admin-Only Curation & Direct Part Search-Add Bar (Hidden from General Customers!) */}
          {isAdminRecMode && (
            <div className="px-3 py-2 bg-slate-800 text-white border-b border-slate-700 space-y-1.5 shrink-0">
              <div className="flex items-center justify-between gap-2 text-[10.5px]">
                <span className="font-extrabold text-amber-300 flex items-center gap-1 truncate">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  관리자 편집 모드 ({recDoorType === "glass" ? "유리 도어" : "목재·일반 도어"})
                </span>
                <Link
                  href="/admin"
                  className="text-[10px] font-bold text-slate-300 hover:text-amber-300 underline whitespace-nowrap shrink-0"
                >
                  관리자 센터 ↗
                </Link>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={adminAddPartQuery}
                  onChange={(e) => setAdminAddPartQuery(e.target.value)}
                  placeholder="카탈로그 전체에서 공식 추천 부품 검색·지정 추가..."
                  className="w-full h-7 pl-7 pr-6 rounded bg-slate-900 border border-slate-600 focus:border-amber-400 text-[11px] text-white placeholder:text-slate-400 focus:outline-none"
                />
                {adminAddPartQuery && (
                  <button
                    type="button"
                    onClick={() => setAdminAddPartQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {adminAddPartQuery.trim() && (
                <div className="max-h-36 overflow-y-auto rounded border border-slate-700 bg-slate-900 divide-y divide-slate-800">
                  {adminAddableParts.length === 0 ? (
                    <div className="px-2.5 py-2 text-[10.5px] text-slate-400 text-center">
                      일치하거나 추가 가능한 부속 품목이 없습니다.
                    </div>
                  ) : (
                    adminAddableParts.map((cand) => (
                      <div
                        key={cand.id}
                        className="px-2 py-1.5 flex items-center justify-between gap-2 text-[11px]"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-amber-300 mr-1.5">
                            {cand.code}
                          </span>
                          <span className="text-slate-300 truncate">
                            {cand.title}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            adminCurateAffinity(
                              activeAnchorItem.id,
                              cand.id,
                              recDoorType,
                              "pin",
                              `★ [${cand.code}] 품목을 관리자 공식 추천으로 지정했습니다.`,
                            );
                            setAdminAddPartQuery("");
                          }}
                          className="px-2 py-0.5 rounded bg-[#FF7B00] hover:bg-[#e66f00] text-white text-[10px] font-bold whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          ★ 지정추가
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sub-part Role Completion Check Badges + Door Switch + Source Tier Filter + Role Tabs */}
          <div className="px-3 py-2 bg-orange-50/90 border-b border-orange-200/80 space-y-1.5 shrink-0">
            {/* Role Checklist Badges (Clickable to filter) */}
            <div className="grid grid-cols-4 gap-1">
              {(
                [
                  { id: "upper_rail", short: "레일" },
                  { id: "lower", short: "가이드" },
                  { id: "handle", short: "손잡이" },
                  { id: "bracket", short: "브라켓" },
                ] as const
              ).map((badge) => {
                const isAdded = addedRolesSet.has(badge.id);
                const isSelectedTab = recRoleTab === badge.id;
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() =>
                      setRecRoleTab((prev) =>
                        prev === badge.id ? "all" : badge.id,
                      )
                    }
                    title={`${badge.short} 추천 품목만 필터링 (${isAdded ? "발주서에 담김" : "미선택"})`}
                    className={`py-1 px-1.5 rounded border text-[10.5px] font-extrabold flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer transition-colors ${
                      isAdded
                        ? "bg-emerald-50 border-emerald-400 text-emerald-800"
                        : isSelectedTab
                          ? "bg-orange-100 border-[#FF7B00] text-[#c25900]"
                          : "bg-white border-slate-200 text-slate-500 hover:border-orange-300"
                    }`}
                  >
                    <span>{badge.short}</span>
                    {isAdded ? (
                      <Check className="w-3 h-3 text-emerald-600 shrink-0 stroke-[3]" />
                    ) : (
                      <span className="text-slate-300">·</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Door Material Context Switch */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
                도어 재질 기준:
              </span>
              <div className="inline-flex rounded-md border border-orange-300 bg-white p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setRecDoorType("wood")}
                  className={`px-2.5 py-0.5 rounded text-[10.5px] font-extrabold whitespace-nowrap transition-colors cursor-pointer ${
                    recDoorType === "wood"
                      ? "bg-[#FF7B00] text-white shadow-sm"
                      : "text-slate-600 hover:bg-orange-50"
                  }`}
                >
                  목재·일반 도어
                </button>
                <button
                  type="button"
                  onClick={() => setRecDoorType("glass")}
                  className={`px-2.5 py-0.5 rounded text-[10.5px] font-extrabold whitespace-nowrap transition-colors cursor-pointer ${
                    recDoorType === "glass"
                      ? "bg-[#FF7B00] text-white shadow-sm"
                      : "text-slate-600 hover:bg-orange-50"
                  }`}
                >
                  유리 도어
                </button>
              </div>
            </div>

            {/* Missing Upper Rail Smart Guard */}
            {addedItemMap.has(activeAnchorItem.id) && !hasUpperRailInOrder && (
              <div className="px-2.5 py-1 rounded bg-amber-100/90 border border-amber-300 text-[10.5px] font-bold text-amber-900 flex items-center justify-between gap-1.5">
                <span className="truncate">
                  💡 상부레일 미담김 — 호환 레일을 선택하세요
                </span>
                {recRoleTab !== "upper_rail" && (
                  <button
                    type="button"
                    onClick={() => setRecRoleTab("upper_rail")}
                    className="underline text-[#c25900] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    레일 보기
                  </button>
                )}
              </div>
            )}

            {/* Sub-part Role Filter Tabs */}
            <div className="grid grid-cols-5 gap-1">
              {(
                [
                  { id: "all", label: "전체" },
                  { id: "upper_rail", label: "상부레일" },
                  { id: "lower", label: "하부·가이드" },
                  { id: "handle", label: "손잡이" },
                  { id: "bracket", label: "브라켓·외" },
                ] as const
              ).map((t) => {
                const cnt = recommendationBundle.roleCounts[t.id];
                const active = recRoleTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setRecRoleTab(t.id)}
                    className={`py-1 px-1 rounded border text-[10px] font-bold whitespace-nowrap truncate transition-colors cursor-pointer ${
                      active
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-orange-50"
                    }`}
                  >
                    {t.label}
                    {cnt > 0 ? `(${cnt})` : ""}
                  </button>
                );
              })}
            </div>

            {/* Separate Source Classification Filter Bar (관리자지정 vs 출고확정 vs 규격호환) */}
            <div className="grid grid-cols-4 gap-1 pt-0.5">
              {(
                [
                  {
                    id: "all",
                    label: "분류전체",
                    cnt: recommendationBundle.sourceCounts.all,
                    activeClass: "bg-slate-700 text-white border-slate-700",
                  },
                  {
                    id: "admin_designated",
                    label: "★관리자지정",
                    cnt: recommendationBundle.sourceCounts.admin_designated,
                    activeClass: "bg-[#FF7B00] text-white border-[#FF7B00]",
                  },
                  {
                    id: "verified_shipment",
                    label: "✓출고학습",
                    cnt: recommendationBundle.sourceCounts.verified_shipment,
                    activeClass: "bg-emerald-600 text-white border-emerald-600",
                  },
                  {
                    id: "catalog_compatible",
                    label: "규격호환",
                    cnt: recommendationBundle.sourceCounts.catalog_compatible,
                    activeClass: "bg-slate-600 text-white border-slate-600",
                  },
                ] as const
              ).map((sf) => {
                const isSelected = recSourceFilter === sf.id;
                return (
                  <button
                    key={sf.id}
                    type="button"
                    onClick={() => setRecSourceFilter(sf.id)}
                    className={`py-0.5 px-1 rounded border text-[9.5px] font-extrabold whitespace-nowrap truncate transition-colors cursor-pointer ${
                      isSelected
                        ? sf.activeClass
                        : "bg-white/90 text-slate-600 border-slate-200 hover:border-orange-300"
                    }`}
                  >
                    {sf.label}({sf.cnt})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full-Height Separately Classified Recommended Parts List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-3 bg-slate-50/60">
            {recommendationBundle.filtered.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">
                해당 분류에 등록·학습된 추천 부품이 없습니다.
                {recSourceFilter !== "all" && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setRecSourceFilter("all")}
                      className="text-[11px] font-bold text-[#FF7B00] underline cursor-pointer"
                    >
                      전체 추천 분류 보기
                    </button>
                  </div>
                )}
              </div>
            ) : (
              (
                [
                  {
                    tier: "admin_designated" as const,
                    title: "★ 관리자 지정 공식 추천",
                    subtitle: "코아스 기술팀 공식 지정",
                    headerClass:
                      "bg-orange-100/90 border-orange-300 text-[#9a4400]",
                    items: recommendationBundle.adminDesignated,
                  },
                  {
                    tier: "verified_shipment" as const,
                    title: "✓ 출고확정 발주 자동학습",
                    subtitle:
                      totalLearnedOrders > 0
                        ? `출고확정 누적 ${totalLearnedOrders}건`
                        : "처리완료 발주 학습",
                    headerClass:
                      "bg-emerald-50 border-emerald-300 text-emerald-900",
                    items: recommendationBundle.verifiedShipment,
                  },
                  {
                    tier: "catalog_compatible" as const,
                    title: "카탈로그 규격 호환 부품",
                    subtitle: "하중·시리즈 호환 후보",
                    headerClass:
                      "bg-slate-200/75 border-slate-300 text-slate-700",
                    items: recommendationBundle.catalogCompatible,
                  },
                ]
              )
                .filter(
                  (sec) =>
                    sec.items.length > 0 ||
                    (isAdminRecMode &&
                      recSourceFilter === "all" &&
                      sec.tier === "admin_designated"),
                )
                .map((sec) => (
                  <div key={sec.tier} className="space-y-1.5">
                    {/* Distinct Section Classification Header */}
                    <div
                      className={`px-2.5 py-1 rounded-md border flex items-center justify-between gap-2 text-[10.5px] font-extrabold ${sec.headerClass}`}
                    >
                      <span className="truncate">
                        {sec.title} ({sec.items.length})
                      </span>
                      <span className="text-[9.5px] font-bold opacity-80 whitespace-nowrap shrink-0">
                        {sec.subtitle}
                      </span>
                    </div>

                    {sec.items.length === 0 ? (
                      <div className="px-2.5 py-2 rounded border border-dashed border-orange-300 bg-white/80 text-[10.5px] text-slate-500 text-center">
                        아직 지정된 공식 추천 부품이 없습니다. 아래 후보의{" "}
                        <strong className="text-[#FF7B00]">[★ 지정]</strong>을
                        누르거나 상단 검색창에서 추가하세요.
                      </div>
                    ) : (
                      sec.items.slice(0, 18).map((rec, idx) => {
                        const recAdded = addedItemMap.get(rec.item.id);
                        const recZoomed = zoomedItem?.id === rec.item.id;
                        return (
                          <div
                            key={rec.item.id}
                            className={`grid grid-cols-[74px_minmax(0,1fr)_68px] items-stretch border rounded-lg overflow-hidden text-xs transition-all ${
                              recZoomed
                                ? "border-2 border-[#FF7B00] bg-orange-50 shadow-md"
                                : recAdded
                                  ? "border-orange-300 bg-orange-50/70"
                                  : sec.tier === "admin_designated"
                                    ? "border-orange-300 bg-white hover:border-[#FF7B00]"
                                    : sec.tier === "verified_shipment"
                                      ? "border-emerald-300 bg-white hover:border-emerald-500"
                                      : "border-slate-300 bg-white hover:border-[#FF7B00]"
                            }`}
                          >
                            {/* Always-Visible Mini Thumbnail — Cursor Hover Opens 3rd-Column 600×610 Zoom */}
                            <button
                              type="button"
                              data-zoom-trigger="true"
                              onMouseEnter={() => handleHoverZoomEnter(rec.item)}
                              onMouseLeave={handleHoverZoomLeave}
                              onClick={() => handleToggleZoom(rec.item)}
                              title="커서를 올리면 우측 3단에 600×610 확대·상세창이 열리고, 클릭하면 고정됩니다"
                              className={`border-r relative group cursor-pointer overflow-hidden p-1 flex items-center justify-center min-h-[66px] transition-colors ${
                                recZoomed
                                  ? "bg-orange-50 border-orange-300"
                                  : "bg-slate-50 hover:bg-white border-slate-200"
                              }`}
                            >
                              {rec.item.image ? (
                                <img
                                  src={resolveAssetUrl(rec.item.image)}
                                  alt={rec.item.code}
                                  loading="lazy"
                                  className="w-full h-full max-h-[58px] object-contain transition-transform duration-150 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-center leading-tight px-0.5">
                                  <FileText className="w-4 h-4 text-slate-400 mb-0.5" />
                                  <span className="text-[9.5px] font-bold text-slate-500">
                                    {rec.item.page || "상세보기"}
                                  </span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col items-center justify-center text-white pointer-events-none">
                                <ZoomIn className="w-3.5 h-3.5 text-orange-300" />
                                <span className="text-[9px] font-bold">
                                  호버확대
                                </span>
                              </div>
                            </button>

                            {/* Middle Info + Source Classification Badge + Admin-Only Curation Buttons */}
                            <div
                              onMouseEnter={() => handleHoverZoomEnter(rec.item)}
                              onMouseLeave={handleHoverZoomLeave}
                              className="px-2 py-1.5 flex flex-col justify-center min-w-0"
                            >
                              <div className="flex items-center justify-between gap-1 min-w-0">
                                <div className="flex items-center gap-1 min-w-0">
                                  {sec.tier === "admin_designated" ? (
                                    <span className="px-1 py-0 rounded bg-[#FF7B00] text-white text-[9.5px] font-extrabold whitespace-nowrap shrink-0">
                                      ★지정
                                    </span>
                                  ) : sec.tier === "verified_shipment" ? (
                                    <span className="px-1 py-0 rounded bg-emerald-600 text-white text-[9.5px] font-extrabold whitespace-nowrap shrink-0">
                                      ✓출고{rec.orderCount}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-black text-slate-400 shrink-0">
                                      {idx + 1}
                                    </span>
                                  )}
                                  <span className="font-extrabold text-slate-900 text-[11.5px] truncate bg-slate-100 px-1.5 py-0 rounded border border-slate-200">
                                    {rec.item.code}
                                  </span>
                                  {rec.item.page && (
                                    <span className="text-[9.5px] text-slate-500 font-semibold whitespace-nowrap shrink-0">
                                      {rec.item.page}
                                    </span>
                                  )}
                                </div>

                                {/* Strictly Admin-Only Curation Buttons (NEVER rendered for Customers!) */}
                                {isAdminRecMode && (
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        adminCurateAffinity(
                                          activeAnchorItem.id,
                                          rec.item.id,
                                          recDoorType,
                                          "toggle_pin",
                                          rec.pinned
                                            ? `[${rec.item.code}] 관리자 공식 지정을 해제했습니다.`
                                            : `★ [${rec.item.code}] 품목을 관리자 공식 추천으로 지정했습니다.`,
                                        );
                                      }}
                                      title={
                                        rec.pinned
                                          ? "관리자 공식 지정 해제"
                                          : "★ 관리자 공식 추천으로 최상단 지정"
                                      }
                                      className={`px-1 py-0.5 rounded text-[9.5px] font-bold flex items-center gap-0.5 cursor-pointer border ${
                                        rec.pinned
                                          ? "bg-[#FF7B00] text-white border-[#FF7B00]"
                                          : "bg-slate-50 text-slate-600 border-slate-300 hover:border-[#FF7B00] hover:text-[#FF7B00]"
                                      }`}
                                    >
                                      <Star className="w-2.5 h-2.5 shrink-0" />
                                      <span>{rec.pinned ? "지정됨" : "지정"}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        adminCurateAffinity(
                                          activeAnchorItem.id,
                                          rec.item.id,
                                          recDoorType,
                                          "toggle_exclude",
                                          `[${rec.item.code}] 품목을 이 롤러 추천에서 제외했습니다.`,
                                        );
                                      }}
                                      title="이 롤러 추천 목록에서 영구 제외 (관리자 전용)"
                                      className="p-0.5 rounded border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-300 cursor-pointer"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              <p className="text-[11px] font-semibold text-slate-700 truncate leading-tight mt-0.5">
                                {rec.item.title}
                              </p>

                              <div className="flex items-center justify-between gap-1.5 mt-0.5">
                                <span
                                  className={`text-[10px] font-bold truncate ${
                                    sec.tier === "admin_designated"
                                      ? "text-[#c25900]"
                                      : sec.tier === "verified_shipment"
                                        ? "text-emerald-700"
                                        : "text-slate-500"
                                  }`}
                                >
                                  {sec.tier === "admin_designated" &&
                                  rec.orderCount > 0
                                    ? `출고확정 ${rec.orderCount}건 · ${rec.matchReason}`
                                    : sec.tier === "verified_shipment"
                                      ? `출고확정 ${rec.orderCount}건 · ${rec.matchReason}`
                                      : rec.matchReason}
                                </span>
                                <Link
                                  href={`/product/${rec.item.id}`}
                                  className="text-[10px] font-bold text-slate-500 hover:text-[#FF7B00] hover:underline whitespace-nowrap shrink-0 inline-flex items-center gap-0.5"
                                >
                                  <span>상세</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                </Link>
                              </div>
                            </div>

                            {/* One-Click Add Button */}
                            <button
                              type="button"
                              onClick={() => handleAddCatalogItem(rec.item)}
                              className={`font-bold text-[11px] whitespace-nowrap flex flex-col items-center justify-center border-l transition-colors cursor-pointer ${
                                recAdded
                                  ? "bg-slate-800 hover:bg-slate-900 text-white border-slate-800"
                                  : "bg-[#FF7B00] hover:bg-[#e66f00] text-white border-[#FF7B00]"
                              }`}
                            >
                              <span>{recAdded ? "담김" : "+ 담기"}</span>
                              {recAdded && (
                                <span className="text-[10px] text-orange-300 font-extrabold mt-0.5">
                                  ({recAdded.qty}개)
                                </span>
                              )}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                ))
            )}

            {/* Admin-Only Excluded Parts Management Box */}
            {isAdminRecMode && recommendationBundle.excludedCount > 0 && (
              <div className="p-2 rounded-lg border border-slate-300 bg-white space-y-1.5">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="font-bold text-slate-700">
                    관리자 제외 품목 ({recommendationBundle.excludedCount}개)
                  </span>
                  <button
                    type="button"
                    onClick={handleResetExcludedRecs}
                    className="text-[10px] font-bold text-[#FF7B00] underline cursor-pointer"
                  >
                    전체 복원
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {recommendationBundle.excludedItems.map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() =>
                        adminCurateAffinity(
                          activeAnchorItem.id,
                          ex.id,
                          recDoorType,
                          "unexclude",
                          `[${ex.code}] 제외 설정을 해제했습니다.`,
                        )
                      }
                      title="클릭하면 추천 목록으로 복원됩니다"
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-orange-50 border border-slate-300 text-[10px] font-semibold text-slate-600 hover:text-[#FF7B00] cursor-pointer"
                    >
                      {ex.code} ↺
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Popup Bottom Guide Footer */}
          <div className="px-3 py-2 bg-orange-50 border-t border-orange-200 flex items-center justify-between gap-2 text-[10.5px] font-semibold text-orange-900 shrink-0">
            <span className="truncate">썸네일 호버 시 우측 600×610 도면 확대</span>
            <span className="text-orange-700 whitespace-nowrap shrink-0">
              {recPopupPinned ? "📌 창 고정 중" : "발주서 클릭 시 자동 닫힘"}
            </span>
          </div>
        </div>
      )}

      {/* =====================================================================
          COLUMN 3: 600 × 610 PIXEL FLOATING IMAGE ZOOM POPUP
          • Automatically shifts to 3rd column when 2nd-column rec popup is open!
          • Zero margin left/right, pure white canvas, zero crop, true 1:1 ratio!
         ===================================================================== */}
      {zoomedItem && !submittedOrderNumber && (
        <div
          ref={zoomPopupRef}
          data-testid="popup-image-zoom-600x610"
          onMouseEnter={() => {
            if (hoverZoomCloseTimerRef.current) {
              clearTimeout(hoverZoomCloseTimerRef.current);
              hoverZoomCloseTimerRef.current = null;
            }
          }}
          onMouseLeave={handleHoverZoomLeave}
          style={{ width: "600px", height: "610px" }}
          className={`fixed top-[104px] z-50 w-[600px] h-[610px] max-w-[95vw] bg-white rounded-xl border-2 border-[#FF7B00] shadow-2xl flex flex-col overflow-hidden no-print transition-all duration-200 ${
            drawerOpen
              ? recPopupVisible
                ? "left-4 lg:left-[min(834px,calc(100vw-616px))]"
                : "left-4 lg:left-[434px]"
              : "left-4 lg:left-12"
          }`}
        >
          {/* Top Bar (44px) */}
          <div className="h-[44px] bg-slate-900 text-white px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded bg-[#FF7B00] text-white text-[11px] font-bold shrink-0">
                {zoomPinned ? "📌 고정 확대" : "600×610 대화면"}
              </span>
              <span className="font-bold text-sm truncate">
                [{zoomedItem.code}] {zoomedItem.title}
              </span>
              {zoomedItem.page && (
                <span className="text-xs text-orange-300 font-semibold shrink-0">
                  ({zoomedItem.page})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* User Option: Toggle Bottom Hint Badge on/off */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleZoomHint();
                  toast({
                    title: !showZoomHint
                      ? "하단 축소 안내 문구가 활성화되었습니다. (마우스 호버 시 표시)"
                      : "하단 축소 안내 문구가 숨김 처리되었습니다.",
                  });
                }}
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border ${
                  showZoomHint
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-500 border-slate-700"
                }`}
                title={
                  showZoomHint
                    ? "클릭하면 하단 '축소 안내 문구'를 완전히 숨깁니다"
                    : "클릭하면 하단 '축소 안내 문구'를 다시 켭니다"
                }
              >
                <span>안내문구:</span>
                <span
                  className={
                    showZoomHint
                      ? "text-orange-400 font-bold"
                      : "text-slate-500"
                  }
                >
                  {showZoomHint ? "ON" : "OFF"}
                </span>
              </button>

              <button
                type="button"
                onClick={closeZoomPopup}
                data-testid="button-close-zoom-popup"
                className="px-2.5 py-1 rounded bg-[#FF7B00] hover:bg-[#e66f00] text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
                <span>× 축소 (닫기)</span>
              </button>
            </div>
          </div>

          {/* High-Res Image Area (450px) — Exact 4:3 Ratio (600x450), Zero Crop, Pure White Canvas! */}
          <div
            onClick={closeZoomPopup}
            title="이미지 또는 팝업 바깥 영역을 클릭하면 축소(닫기)됩니다"
            className="h-[450px] w-full bg-white relative flex items-center justify-center p-0 cursor-zoom-out select-none group border-b border-slate-200 overflow-hidden"
          >
            {zoomedItem.image ? (
              <img
                src={resolveAssetUrl(zoomedItem.image)}
                alt={`${zoomedItem.code} (${zoomedItem.title})`}
                className="w-full h-full object-contain select-none transition-transform duration-200 group-hover:scale-[0.99]"
              />
            ) : (
              <div className="text-center px-6 space-y-2">
                <div className="w-14 h-14 rounded-full bg-orange-50 text-[#FF7B00] flex items-center justify-center mx-auto border border-orange-200">
                  <FileText className="w-7 h-7" />
                </div>
                <p className="text-base font-extrabold text-slate-800">
                  [{zoomedItem.code}] {zoomedItem.title}
                </p>
                <p className="text-xs text-slate-500">
                  기본 규격: {zoomedItem.specHint} · 단위: {zoomedItem.defaultUnit}
                  {zoomedItem.page ? ` · 카탈로그 ${zoomedItem.page}` : ""}
                </p>
                <p className="text-xs text-slate-400">
                  하단 [제품 상세 / 도면 전체보기] 또는 [발주서에 바로 담기]를 이용하세요.
                </p>
              </div>
            )}

            {/* Hover-only Shrink Hint: Hidden by default (deleted look), appears smoothly on hover, and can be toggled on/off by user */}
            {showZoomHint && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-3 right-3 bg-slate-900/85 hover:bg-slate-900 text-white text-[11px] font-semibold pl-3 pr-2 py-1.5 rounded-full flex items-center gap-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none pointer-events-auto"
              >
                <div
                  onClick={closeZoomPopup}
                  className="flex items-center gap-1.5 cursor-pointer"
                  title="클릭하면 확대창이 닫힙니다"
                >
                  <ZoomOut className="w-3.5 h-3.5 text-[#FF7B00]" />
                  <span>이미지 또는 팝업 바깥을 클릭하면 닫힙니다</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    toggleZoomHint(false);
                    toast({
                      title: "안내 문구가 숨겨졌습니다.",
                      description:
                        "상단 '안내문구: OFF' 버튼을 눌러 언제든 다시 켤 수 있습니다.",
                    });
                  }}
                  className="text-slate-400 hover:text-white pl-1.5 border-l border-slate-700 text-[10px] hover:underline"
                  title="이 안내 문구를 완전히 숨깁니다 (상단에서 다시 켤 수 있습니다)"
                >
                  숨기기
                </button>
              </div>
            )}
          </div>

          {/* Spec Summary Bar (52px) */}
          <div className="h-[52px] bg-orange-50/70 px-4 border-b border-orange-200 flex items-center justify-between text-xs shrink-0">
            <div className="min-w-0 pr-3">
              <div className="font-bold text-slate-900 truncate">
                모델명: <span className="text-[#FF7B00]">{zoomedItem.code}</span>{" "}
                · 품명: {zoomedItem.title}
              </div>
              <div className="text-[11px] text-slate-600 truncate mt-0.5">
                기본 규격: {zoomedItem.specHint} / 기본 단위:{" "}
                {zoomedItem.defaultUnit}
                {zoomedItem.page ? ` / 카탈로그 ${zoomedItem.page}` : ""}
              </div>
            </div>

            {zoomedAddedInfo ? (
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-white text-[11px] font-bold shrink-0">
                현재 발주서 담김: {zoomedAddedInfo.qty} {zoomedItem.defaultUnit}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-white border border-slate-300 text-slate-600 text-[11px] font-semibold shrink-0">
                미담김
              </span>
            )}
          </div>

          {/* Bottom Action Buttons Bar (64px) */}
          <div className="h-[64px] bg-white px-4 flex items-center justify-between gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleAddCatalogItem(zoomedItem)}
              className="flex-1 h-10 rounded-lg bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>
                {zoomedAddedInfo
                  ? `발주서 수량 +1 추가 (현재 ${zoomedAddedInfo.qty})`
                  : "발주서에 바로 담기"}
              </span>
            </button>

            <Link
              href={`/product/${zoomedItem.id}`}
              className="h-10 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-orange-400" />
              <span>제품 상세 / 도면 전체보기 ↗</span>
            </Link>

            <Link
              href={`/parts-index#${zoomedItem.id}`}
              className="h-10 px-3 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors shrink-0"
            >
              <span>부품 인덱스 ↗</span>
            </Link>
          </div>
        </div>
      )}

      {/* =====================================================================
          RIGHT MAIN WORKSPACE: STRICT A4 STANDARD ORDER SHEET
          • Portrait: 794 × 1,123px (210 × 297mm)
          • Landscape: 1,123 × 794px (297 × 210mm)
          • Every sheet page is strictly locked to true A4 proportions (1 : 1.414)
         ===================================================================== */}
      <div
        className="bg-[#EBF0F5] min-h-screen pt-[132px] pb-12 px-4 overflow-x-auto print-sheet-wrapper"
      >
        <div className="flex justify-center">
          {submittedOrderNumber ? (
            <div className="w-[760px] bg-white rounded-xl border border-slate-300 shadow-lg p-12 text-center space-y-6 my-8">
              <div className="w-20 h-20 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-11 h-11" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#FF7B00] mb-1">
                  발주서 접수가 정상적으로 완료되었습니다
                </p>
                <h2 className="text-3xl font-bold text-slate-900">
                  문서번호: {submittedOrderNumber}
                </h2>
                <p className="text-slate-600 mt-3 max-w-lg mx-auto text-sm leading-relaxed">
                  코아스 담당자가 접수된 발주 내역을 확인한 후 입력하신 연락처(
                  <strong>{phone}</strong>)로 출고 및 납기 안내를 드립니다.
                  <br />
                  긴급 출고 문의:{" "}
                  <strong className="text-slate-900">{company.phone}</strong>
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-4">
                <Link href="/">
                  <Button variant="outline" size="lg" className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    홈으로 이동
                  </Button>
                </Link>
                <Button
                  size="lg"
                  onClick={() => {
                    setSubmittedOrderNumber(null);
                    const fresh = clearOrderDraft(true);
                    setItems(fresh.items);
                    setAttachments([]);
                    setMemo("");
                  }}
                  className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold"
                >
                  새 발주서 계속 작성하기
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center pr-14 print:pr-0">
              {/* =====================================================================
                  SCALED A4 OFFICIAL DOCUMENT STACK + RIGHT-EDGE 견출 타입 첨부파일 탭
                  • .print-zoom-outer stays crisp at screen coordinates so the 견출 탭
                    remains glued flush to the right edge of Page 1 at any zoom level
                 ===================================================================== */}
              <div
                className="print-zoom-outer relative transition-[width,height] duration-150 ease-out"
                style={{
                  width: `${Math.round(sheetBaseWidth * (zoomPct / 100))}px`,
                  height: `${Math.round(totalStackHeight * (zoomPct / 100))}px`,
                }}
              >
                {/* RIGHT-EDGE 견출 타입 첨부파일 발송 WIDGET (PDF · CAD 도면 · 엑셀 · 문서) */}
                <div
                  ref={attachmentWidgetRef}
                  className="no-print"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!attachmentDragging) setAttachmentDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (
                      e.currentTarget.contains(e.relatedTarget as Node | null)
                    ) {
                      return;
                    }
                    setAttachmentDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setAttachmentDragging(false);
                    setAttachmentTabOpen(true);
                    if (e.dataTransfer?.files?.length) {
                      handleFileUpload(e.dataTransfer.files);
                    }
                  }}
                >
                  <input
                    ref={attachmentFileInputRef}
                    id="order-index-tab-file-upload"
                    type="file"
                    multiple
                    accept={ORDER_ATTACHMENT_ACCEPT}
                    className="hidden"
                    onChange={(e) => {
                      handleFileUpload(e.target.files);
                      e.currentTarget.value = "";
                    }}
                  />

                  {/* Protruding 견출지 Index Tab on Upper-Right Edge of A4 Sheet */}
                  <button
                    type="button"
                    data-testid="button-attachment-index-tab"
                    onClick={() => setAttachmentTabOpen((o) => !o)}
                    title="클릭하거나 파일을 드래그하여 PDF · 캐드도면(.dwg/.dxf) · 엑셀(.xlsx) 등 첨부파일을 발주서와 함께 발송합니다"
                    className={`absolute left-full top-[26px] -ml-[1px] z-10 w-[48px] min-h-[172px] py-2.5 px-1 rounded-r-xl border border-l-slate-200 shadow-lg flex flex-col items-center justify-between gap-1.5 cursor-pointer select-none transition-all ${
                      attachmentDragging
                        ? "bg-sky-50 border-sky-400 border-r-[6px] border-r-sky-500 scale-[1.03]"
                        : attachmentTabOpen
                          ? "bg-orange-50 border-[#FF7B00] border-r-[6px] border-r-[#FF7B00] shadow-xl"
                          : attachments.length > 0
                            ? "bg-emerald-50/95 hover:bg-emerald-100/90 border-emerald-400 border-r-[6px] border-r-emerald-500"
                            : "bg-white hover:bg-orange-50/80 border-slate-300 border-r-[6px] border-r-[#FF7B00]"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          attachments.length > 0
                            ? "bg-emerald-600 text-white"
                            : "bg-[#FF7B00] text-white"
                        }`}
                      >
                        {uploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Paperclip className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9.5px] font-black leading-none ${
                          attachments.length > 0
                            ? "bg-emerald-700 text-white"
                            : "bg-slate-800 text-orange-300"
                        }`}
                      >
                        {attachments.length > 0
                          ? `${attachments.length}건`
                          : "첨부"}
                      </span>
                    </div>

                    <div className="flex flex-col items-center text-[11px] font-black text-slate-900 leading-[1.18] tracking-tight py-0.5">
                      <span>첨</span>
                      <span>부</span>
                      <span>파</span>
                      <span>일</span>
                    </div>

                    <div className="flex flex-col items-center gap-0.5 pt-1 border-t border-slate-200/90 w-full">
                      <span className="text-[8px] font-extrabold text-red-600 leading-none">
                        PDF
                      </span>
                      <span className="text-[8px] font-extrabold text-indigo-700 leading-none">
                        CAD
                      </span>
                      <span className="text-[8px] font-extrabold text-emerald-700 leading-none">
                        XLS
                      </span>
                    </div>
                  </button>

                  {/* Opened 견출 첨부파일 발송함 Popover Panel (Anchored flush inside upper-right edge so it never overflows screen) */}
                  {attachmentTabOpen && (
                    <div
                      data-testid="popover-attachment-index-panel"
                      className="absolute right-0 top-[26px] z-30 w-[368px] max-w-[90vw] bg-white border-2 border-[#FF7B00] rounded-l-xl rounded-br-xl shadow-2xl overflow-hidden"
                    >
                      {/* Panel Top Header */}
                      <div className="bg-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-1.5 py-0.5 rounded bg-[#FF7B00] text-white text-[10px] font-black shrink-0">
                            견출 첨부함
                          </span>
                          <span className="text-xs font-extrabold truncate">
                            첨부파일 발송 (도면·데이터)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachmentTabOpen(false)}
                          className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                          title="첨부함 닫기"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-3.5 space-y-3">
                        {/* Supported File Format Badges */}
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded border border-red-200 bg-red-50 text-red-700 text-[10px] font-extrabold">
                            PDF 문서
                          </span>
                          <span className="px-1.5 py-0.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold">
                            CAD도면 (.dwg·.dxf·.stp)
                          </span>
                          <span className="px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold">
                            엑셀/데이터 (.xlsx·.csv)
                          </span>
                          <span className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-700 text-[10px] font-bold">
                            한글·이미지·ZIP
                          </span>
                        </div>

                        {/* Click or Drag & Drop Upload Box */}
                        <div
                          onClick={() =>
                            attachmentFileInputRef.current?.click()
                          }
                          className={`rounded-lg border-2 border-dashed p-3.5 text-center cursor-pointer transition-colors ${
                            attachmentDragging
                              ? "border-sky-500 bg-sky-50"
                              : "border-orange-300 bg-orange-50/50 hover:bg-orange-50 hover:border-[#FF7B00]"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            {uploading ? (
                              <Loader2 className="w-5 h-5 text-[#FF7B00] animate-spin" />
                            ) : (
                              <Upload className="w-5 h-5 text-[#FF7B00]" />
                            )}
                            <p className="text-xs font-extrabold text-slate-900">
                              {uploading
                                ? "첨부파일 업로드 중..."
                                : "+ 클릭하거나 파일을 이곳에 끌어다 놓으세요"}
                            </p>
                            <p className="text-[10.5px] font-medium text-slate-500">
                              PDF · 캐드도면 · 엑셀 · 수기발주서 사진 (파일당 최대
                              50MB)
                            </p>
                          </div>
                        </div>

                        {/* Uploaded Attachments List */}
                        {attachments.length > 0 ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-extrabold text-slate-800">
                                발송 대기 첨부파일 ({attachments.length}건)
                              </span>
                              <button
                                type="button"
                                onClick={() => setAttachments([])}
                                className="text-[10px] font-bold text-slate-400 hover:text-red-600 cursor-pointer"
                              >
                                전체 비우기
                              </button>
                            </div>
                            <div className="max-h-[195px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-slate-50/60">
                              {attachments.map((att, idx) => {
                                const meta = getAttachmentTypeMeta(att.name);
                                return (
                                  <div
                                    key={`${att.url}-${idx}`}
                                    className="px-2.5 py-2 flex items-center justify-between gap-2 hover:bg-white transition-colors"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span
                                        className={`px-1.5 py-0.5 rounded border text-[9.5px] font-extrabold shrink-0 ${meta.badgeClass}`}
                                      >
                                        {meta.label}
                                      </span>
                                      <div className="min-w-0">
                                        <a
                                          href={resolveAssetUrl(att.url)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="block text-[11px] font-bold text-slate-900 hover:text-[#FF7B00] truncate"
                                          title={att.name}
                                        >
                                          {att.name}
                                        </a>
                                        {formatAttachmentSize(att.size) && (
                                          <span className="text-[9.5px] text-slate-400 font-medium">
                                            {formatAttachmentSize(att.size)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAttachments((prev) =>
                                          prev.filter((_, i) => i !== idx),
                                        )
                                      }
                                      className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer shrink-0"
                                      title="첨부 제외"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 text-[11px] text-slate-600 leading-relaxed">
                            표에 품목을 직접 입력하지 않고{" "}
                            <strong className="text-slate-900">
                              기존 엑셀 발주서, PDF, 캐드 도면 파일만 첨부하여
                              바로 발송
                            </strong>
                            하셔도 정상 접수됩니다.
                          </div>
                        )}

                        {/* Direct Submit Action inside 견출 Panel */}
                        <div className="pt-1 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              attachmentFileInputRef.current?.click()
                            }
                            disabled={uploading}
                            className="px-2.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-[11px] font-bold cursor-pointer shrink-0"
                          >
                            + 파일 추가
                          </button>
                          <button
                            type="submit"
                            form="order-excel-form"
                            disabled={submitting || uploading}
                            className="flex-1 py-2 px-3 rounded-lg bg-[#FF7B00] hover:bg-[#e66f00] disabled:opacity-60 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>발송 중...</span>
                              </>
                            ) : (
                              <span>
                                {attachments.length > 0
                                  ? `첨부 ${attachments.length}건 포함 발주서 발송 →`
                                  : "발주서 접수하기 →"}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className="print-zoom-inner origin-top-left transition-transform duration-150 ease-out"
                  style={{
                    width: `${sheetBaseWidth}px`,
                    transform:
                      zoomPct === 100
                        ? undefined
                        : `scale(${zoomPct / 100})`,
                  }}
                >
                  <form
                    ref={sheetFormRef}
                    id="order-excel-form"
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-[24px] print-form-stack"
                  >
                    <datalist id="coas-product-suggestions">
                      {allProducts.map((p) => (
                        <option key={p.id} value={`${p.name} (${p.nameKo})`} />
                      ))}
                    </datalist>

                    {a4Pages.map((page) => {
                      const pageOuterRowPx = page.effectiveOuterRowPx;
                      const pageCellInnerPx = page.cellInnerPx;
                      return (
                        <div
                          key={page.pageIndex}
                          data-testid={`a4-sheet-page-${page.pageIndex + 1}`}
                          style={{
                            width: `${sheetBaseWidth}px`,
                            minWidth: `${sheetBaseWidth}px`,
                            maxWidth: `${sheetBaseWidth}px`,
                            height: `${sheetBaseHeight}px`,
                            minHeight: `${sheetBaseHeight}px`,
                            maxHeight: `${sheetBaseHeight}px`,
                          }}
                          className={`a4-sheet-page shrink-0 bg-white rounded-sm border border-slate-300 shadow-2xl flex flex-col justify-start ${
                            orientation === "landscape"
                              ? "pt-[22px] pb-[50px] pl-[57px] pr-[39px]"
                              : "pt-[57px] pb-[50px] px-[48px]"
                          }`}
                        >
                          <div className="flex flex-col flex-1 min-h-0">
                            {page.isFirst ? (
                              <>
                                {/* 1. Document Top Title Bar */}
                                <div
                                  className={`flex items-end justify-between border-b border-slate-800 ${
                                    orientation === "landscape"
                                      ? "pb-1.5 mb-1.5"
                                      : "pb-2 mb-2"
                                  }`}
                                >
                                  <div
                                    className={`text-[10px] text-slate-700 w-[210px] font-semibold ${
                                      orientation === "landscape"
                                        ? "space-y-0 leading-[1.22]"
                                        : "space-y-0.5 leading-snug"
                                    }`}
                                  >
                                    <div>
                                      발주일자:{" "}
                                      <span className="text-slate-900 font-bold">
                                        {todayStr}
                                      </span>
                                    </div>
                                    <div className="whitespace-nowrap">
                                      문서번호:{" "}
                                      <span className="font-mono font-semibold text-slate-900">
                                        {autoDocNo}
                                      </span>
                                    </div>
                                    <div className="text-[9.5px] text-emerald-700 font-bold no-print">
                                      ● 입력 내용 실시간 자동보관 중
                                    </div>
                                  </div>

                                  <div className="text-center flex-1">
                                    <h2
                                      style={{
                                        fontSize:
                                          orientation === "landscape"
                                            ? "25px"
                                            : "30px",
                                        letterSpacing: "0.48em",
                                      }}
                                      className="font-black text-slate-900 leading-none pl-[0.48em]"
                                    >
                                      발 주 서
                                    </h2>
                                    <p
                                      style={{
                                        fontSize:
                                          orientation === "landscape"
                                            ? "10.5px"
                                            : "12.5px",
                                        letterSpacing: "0.32em",
                                      }}
                                      className={`font-bold text-slate-600 leading-none pl-[0.32em] ${
                                        orientation === "landscape"
                                          ? "mt-1"
                                          : "mt-1.5"
                                      }`}
                                    >
                                      PURCHASE ORDER
                                    </p>
                                  </div>

                                  <div
                                    className={`text-right w-[210px] text-[10px] text-slate-600 font-semibold ${
                                      orientation === "landscape"
                                        ? "space-y-0 leading-[1.22]"
                                        : "space-y-0.5 leading-snug"
                                    }`}
                                  >
                                    <div className="text-slate-800">
                                      {orientation === "landscape"
                                        ? "규격: A4 가로 (297 × 210mm)"
                                        : "규격: A4 세로 (210 × 297mm)"}
                                    </div>
                                    <div>수신: {company.name} 출고담당</div>
                                    {a4Pages.length > 1 && (
                                      <div className="text-[#FF7B00] font-extrabold">
                                        페이지: 1 / {a4Pages.length}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* 2. Upper Left-Right Text-Aligned Buyer & Supplier Section */}
                                <div className="flex items-stretch gap-[20px]">
                                  {/* Left Column: 발주처 (flex-1, 4 rows) */}
                                  <div className="flex-1 min-w-0 flex flex-col relative">
                                    <div
                                      className={`h-[26px] border-b border-slate-700 pb-0.5 flex items-center justify-between gap-2 ${
                                        orientation === "landscape"
                                          ? "mb-1 h-[22px]"
                                          : "mb-1.5"
                                      }`}
                                    >
                                      <span className="text-[10.5px] font-semibold tracking-[0.14em] text-slate-900 leading-none">
                                        발주처 (발주자 정보)
                                      </span>
                                      <div className="flex items-center gap-1.5 leading-none">
                                        <button
                                          ref={companyTriggerRef}
                                          type="button"
                                          onClick={() =>
                                            setCompanyPickerOpen((o) => !o)
                                          }
                                          data-testid="button-saved-buyers"
                                          className="no-print inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-50 hover:bg-orange-100 border border-orange-300/80 text-[#FF7B00] text-[9.5px] font-bold transition-colors cursor-pointer leading-none"
                                          title="저장된 거래처 불러오기 또는 현재 업체명 저장"
                                        >
                                          <Building2 className="w-2.5 h-2.5" />
                                          <span>
                                            내 거래처
                                            {buyerProfiles.length > 0
                                              ? ` (${buyerProfiles.length})`
                                              : ""}
                                          </span>
                                          {egdeskConnected && (
                                            <span
                                              className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                                              title="EGDesk My DB 실시간 연동됨"
                                            />
                                          )}
                                          <ChevronDown
                                            className={`w-2.5 h-2.5 transition-transform ${
                                              companyPickerOpen
                                                ? "rotate-180"
                                                : ""
                                            }`}
                                          />
                                        </button>
                                        <span className="text-[9.5px] font-medium text-slate-500 leading-none">
                                          * 필수 입력 항목
                                        </span>
                                      </div>
                                    </div>

                                    <div
                                      className={`${
                                        orientation === "landscape"
                                          ? "space-y-[3px]"
                                          : "space-y-[5px]"
                                      } text-[10px] font-medium text-slate-700`}
                                    >
                      {/* Row 1: 업체명 & 담당자 */}
                      <div
                        className={`${
                          orientation === "landscape" ? "h-[17px]" : "h-[18px]"
                        } grid grid-cols-2 gap-4 items-center border-b border-slate-200 pb-0.5`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="tracking-[0.1em] text-slate-600 shrink-0 leading-none">
                            업체명<span className="text-[#FF7B00]">*</span> :
                          </span>
                          <input
                            ref={companyInputRef}
                            type="text"
                            required
                            value={companyName}
                            onFocus={() => setCompanyPickerOpen(true)}
                            onChange={(e) => {
                              setCompanyName(e.target.value);
                              if (!companyPickerOpen) setCompanyPickerOpen(true);
                            }}
                            onPaste={handleCompanySmartPaste}
                            placeholder="(주)코아스인테리어"
                            autoComplete="organization"
                            className="w-full min-w-0 text-[10.5px] font-semibold text-slate-900 bg-transparent focus:outline-none focus:bg-yellow-50/70 rounded px-1 py-0 leading-tight"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="tracking-[0.1em] text-slate-600 shrink-0 leading-none">
                            담당자<span className="text-[#FF7B00]">*</span> :
                          </span>
                          <input
                            type="text"
                            required
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="김담당 실장"
                            className="w-full min-w-0 text-[10.5px] font-semibold text-slate-900 bg-transparent focus:outline-none focus:bg-yellow-50/70 rounded px-1 py-0 leading-tight"
                          />
                        </div>
                      </div>

                      {/* Row 2: 연락처 & 이메일 */}
                      <div
                        className={`${
                          orientation === "landscape" ? "h-[17px]" : "h-[18px]"
                        } grid grid-cols-2 gap-4 items-center border-b border-slate-200 pb-0.5`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="tracking-[0.1em] text-slate-600 shrink-0 leading-none">
                            연락처<span className="text-[#FF7B00]">*</span> :
                          </span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            required
                            maxLength={14}
                            value={phone}
                            onChange={(e) =>
                              setPhone(formatKoreanPhoneNumber(e.target.value))
                            }
                            placeholder="010-1234-5678"
                            className="w-full min-w-0 text-[10.5px] font-semibold text-slate-900 bg-transparent focus:outline-none focus:bg-yellow-50/70 rounded px-1 py-0 leading-tight"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="tracking-[0.1em] text-slate-600 shrink-0 leading-none">
                            이메일 :
                          </span>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@company.com"
                            className="w-full min-w-0 text-[10.5px] font-semibold text-slate-900 bg-transparent focus:outline-none focus:bg-yellow-50/70 rounded px-1 py-0 leading-tight"
                          />
                        </div>
                      </div>

                      {/* Row 3: 희망납기 & 배송방법 */}
                      <div
                        className={`${
                          orientation === "landscape" ? "h-[17px]" : "h-[18px]"
                        } flex items-center justify-between gap-3 border-b border-slate-200 pb-0.5`}
                      >
                        <div className="flex items-center gap-1.5 w-[155px] shrink-0">
                          <span className="tracking-[0.08em] text-slate-600 shrink-0 leading-none">
                            희망납기 :
                          </span>
                          <input
                            type="date"
                            value={desiredDate}
                            onChange={(e) => setDesiredDate(e.target.value)}
                            className="w-full min-w-0 text-[10px] font-semibold text-slate-900 bg-transparent focus:outline-none focus:bg-yellow-50/70 rounded px-0.5 py-0 leading-none"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="tracking-[0.08em] text-slate-600 shrink-0 leading-none">
                            배송방법 :
                          </span>
                          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-800 whitespace-nowrap leading-none">
                            {(["화물", "택배", "방문수령"] as const).map(
                              (m) => (
                                <label
                                  key={m}
                                  className="inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name="shippingMethod"
                                    checked={shippingMethod === m}
                                    onChange={() => setShippingMethod(m)}
                                    className="accent-[#FF7B00] w-3 h-3"
                                  />
                                  <span>{m}</span>
                                </label>
                              ),
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Row 4: 납품주소 */}
                      <div
                        className={`${
                          orientation === "landscape" ? "h-[17px]" : "h-[18px]"
                        } flex items-center gap-1.5 border-b border-slate-300 pb-0.5`}
                      >
                        <span className="tracking-[0.1em] text-slate-600 shrink-0 leading-none">
                          납품주소
                          {shippingMethod !== "방문수령" && (
                            <span className="text-[#FF7B00]">*</span>
                          )}{" "}
                          :
                        </span>
                        <input
                          ref={deliveryAddressInputRef}
                          type="text"
                          required={shippingMethod !== "방문수령"}
                          value={deliveryAddress}
                          onChange={(e) =>
                            setDeliveryAddress(e.target.value)
                          }
                          placeholder={deliveryAddressPlaceholder}
                          className="no-print w-full min-w-0 text-[10.5px] font-semibold text-slate-900 bg-transparent focus:outline-none focus:bg-yellow-50/70 rounded px-1 py-0 leading-none truncate"
                        />
                        <div
                          className="hidden print:block w-full min-w-0 text-[10.5px] font-semibold text-slate-900 px-1 py-0 leading-none truncate"
                        >
                          {deliveryAddress.trim() ||
                            (shippingMethod === "방문수령" ? "본사 방문수령" : "")}
                        </div>
                      </div>
                    </div>

                    {/* Quick Company Entry & Saved Buyer Profile Dropdown (.no-print) */}
                    {companyPickerOpen && (
                      <div
                        ref={companyPickerRef}
                        data-testid="popover-company-quick-entry"
                        className="no-print absolute left-0 top-[50px] z-50 w-[385px] max-w-full bg-white border-2 border-[#FF7B00] rounded-lg shadow-2xl overflow-hidden"
                      >
                        {/* Top Quick Legal Prefix Chips + Save Current Profile */}
                        <div className="bg-orange-50/90 px-2.5 py-1.5 border-b border-orange-200 flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-600 mr-0.5">
                              빠른 입력:
                            </span>
                            {(["(주)", "주식회사 ", "(유)"] as const).map(
                              (prefix) => (
                                <button
                                  key={prefix}
                                  type="button"
                                  onClick={() => handleToggleCompanyPrefix(prefix)}
                                  className="px-1.5 py-0.5 rounded bg-white hover:bg-orange-100 border border-orange-300 text-slate-800 text-[10px] font-bold cursor-pointer transition-colors"
                                >
                                  {prefix.trim()}
                                </button>
                              ),
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleSaveCurrentBuyerProfile}
                            className="px-2 py-0.5 rounded bg-[#FF7B00] hover:bg-[#e66f00] text-white text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Save className="w-2.5 h-2.5" />
                            <span>현재 정보 저장</span>
                          </button>
                        </div>

                        {/* Saved Buyer Profiles List */}
                        <div className="max-h-[190px] overflow-y-auto divide-y divide-slate-100">
                          {filteredBuyerProfiles.length === 0 ? (
                            <div className="px-3 py-4 text-center text-[11px] text-slate-500">
                              <p className="font-semibold text-slate-700">
                                아직 저장된 거래처가 없습니다.
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                발주서 입력 후 우측 상단{" "}
                                <strong className="text-[#FF7B00]">
                                  [현재 정보 저장]
                                </strong>
                                을 누르면 다음부터 클릭 한 번으로 자동 완성됩니다.
                              </p>
                            </div>
                          ) : (
                            filteredBuyerProfiles.map((p) => (
                              <div
                                key={p.id}
                                onClick={() => handleApplyBuyerProfile(p)}
                                className="px-2.5 py-2 hover:bg-orange-50/70 flex items-center justify-between gap-2 cursor-pointer transition-colors group"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-extrabold text-slate-900 truncate">
                                      {p.companyName}
                                    </span>
                                    {p.contactName && (
                                      <span className="text-[10px] font-semibold text-slate-600 shrink-0">
                                        · {p.contactName}
                                      </span>
                                    )}
                                    {p.shippingMethod && (
                                      <span className="px-1 py-0 rounded bg-slate-100 text-slate-600 text-[9px] font-bold shrink-0">
                                        {p.shippingMethod}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                    {[p.phone, p.deliveryAddress]
                                      .filter(Boolean)
                                      .join(" · ") || "저장된 연락처 없음"}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="px-1.5 py-0.5 rounded bg-orange-100 text-[#FF7B00] text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                    적용
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      handleDeleteBuyerProfile(
                                        p.id,
                                        p.companyName,
                                        e,
                                      )
                                    }
                                    className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                                    title="이 거래처 삭제"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Smart Paste Tip & Close Bar */}
                        <div className="bg-slate-50 px-2.5 py-1.5 border-t border-slate-200 flex items-center justify-between gap-2">
                          <span className="text-[9.5px] text-slate-500 truncate">
                            💡 카톡 &quot;업체명 / 담당자 / 연락처 / 주소&quot; 붙여넣기 시 자동 분리
                          </span>
                          <button
                            type="button"
                            onClick={() => setCompanyPickerOpen(false)}
                            className="text-[10px] font-bold text-slate-500 hover:text-slate-900 shrink-0 cursor-pointer"
                          >
                            닫기
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Subtle Center Vertical Divider */}
                  <div className="w-[1px] bg-slate-200 shrink-0 self-stretch" />

                  {/* Right Column: 공급자 E-COAS (4 rows — Top & Bottom lines strictly aligned with Left 4 rows) */}
                  <div
                    className={`${orientation === "landscape" ? "w-[330px]" : "w-[272px]"} shrink-0 flex flex-col`}
                  >
                    <div
                      className={`h-[26px] border-b border-slate-700 pb-0.5 flex items-center justify-between ${
                        orientation === "landscape" ? "mb-1 h-[22px]" : "mb-1.5"
                      }`}
                    >
                      <span className="text-[10.5px] font-semibold tracking-[0.14em] text-[#FF7B00] leading-none">
                        공급자 (E-COAS)
                      </span>
                      <span className="text-[9.5px] text-transparent select-none leading-none">
                        .
                      </span>
                    </div>

                    <div
                      className={`${
                        orientation === "landscape"
                          ? "space-y-[3px]"
                          : "space-y-[5px]"
                      } text-[10px] font-medium text-slate-700`}
                    >
                      {/* Row 1: 상호 & 대표전화 */}
                      <div
                        className={`${
                          orientation === "landscape" ? "h-[17px]" : "h-[18px]"
                        } flex items-center justify-between gap-2 border-b border-slate-200 pb-0.5`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-[52px] tracking-[0.12em] text-slate-600 shrink-0 leading-none">
                            상 호 :
                          </span>
                          <span className="text-[10.5px] font-semibold text-slate-900 truncate leading-none">
                            {company.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="tracking-[0.08em] text-slate-600 shrink-0 leading-none">
                            전화 :
                          </span>
                          <span className="text-[10.5px] font-bold text-[#FF7B00] whitespace-nowrap leading-none">
                            {company.phone}
                          </span>
                        </div>
                      </div>

                      {/* Row 2: 이메일 */}
                      <div
                        className={`${
                          orientation === "landscape" ? "h-[17px]" : "h-[18px]"
                        } flex items-center gap-2 border-b border-slate-200 pb-0.5`}
                      >
                        <span className="w-[52px] tracking-[0.12em] text-slate-600 shrink-0 leading-none">
                          이 메 일 :
                        </span>
                        <span className="text-[10px] font-semibold text-slate-900 truncate leading-none">
                          {company.email}
                        </span>
                      </div>

                      {/* Row 3: 사업장 */}
                      <div
                        className={`${
                          orientation === "landscape" ? "h-[17px]" : "h-[18px]"
                        } flex items-center gap-2 border-b border-slate-200 pb-0.5`}
                      >
                        <span className="w-[52px] tracking-[0.12em] text-slate-600 shrink-0 leading-none">
                          사 업 장 :
                        </span>
                        <span
                          className="text-[9.5px] font-semibold text-slate-800 leading-none truncate"
                          title={company.address}
                        >
                          {company.address.replace(/\s*\(관리자[^)]*\)/g, "")}
                        </span>
                      </div>

                      {/* Row 4: 발주안내 (Bottom border aligns cleanly with Left Row 4) */}
                      <div
                        className={`${
                          orientation === "landscape" ? "h-[17px]" : "h-[18px]"
                        } flex items-center gap-2 border-b border-slate-300 pb-0.5`}
                      >
                        <span className="w-[52px] tracking-[0.12em] text-slate-600 shrink-0 leading-none">
                          발주안내 :
                        </span>
                        <span className="text-[9.5px] font-medium text-slate-600 truncate leading-none">
                          좌측 부품창 클릭 또는 우측 견출 탭 도면 첨부
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                              </>
                            ) : (
                              /* Continuation Official Header on Page 2+ */
                              <div className="flex items-center justify-between pb-1 mb-0">
                                <div className="flex items-center gap-3 text-[11px] font-black text-slate-900 leading-none">
                                  <span className="tracking-[0.18em]">
                                    발 주 서 (품목 명세 계속)
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-600">
                                    문서번호: {autoDocNo}
                                  </span>
                                </div>
                                <div className="text-[10.5px] font-extrabold text-slate-800 leading-none">
                                  페이지{" "}
                                  <span className="text-[#FF7B00]">
                                    {page.pageIndex + 1}
                                  </span>{" "}
                                  / {a4Pages.length}
                                </div>
                              </div>
                            )}

                            {/* 3. Section Heading & Exact A4 Line-Items Table */}
                            <div
                              className={`${
                                page.isFirst
                                  ? orientation === "landscape"
                                    ? "mt-[18px]"
                                    : "mt-6"
                                  : "mt-0"
                              } ${!page.isLast ? "flex-1 flex flex-col min-h-0" : ""}`}
                            >
                              {page.isFirst && (
                                <div className="flex items-center justify-between px-0.5 mb-1 shrink-0">
                                  <div className="text-[11px] font-black text-slate-900 flex items-center gap-2 leading-none">
                                    <span>
                                      ■ 발주 품목 명세 (ITEM SPECIFICATION)
                                    </span>
                                    <span className="text-[9.5px] font-bold text-slate-500 no-print">
                                      {a4Pages.length > 1
                                        ? `(총 ${items.length}행 · 1페이지 ${page.rows.length}행 / 총 ${a4Pages.length}장)`
                                        : `(총 ${items.length}행 · 1장 최대 ${pageRowCapacity}행)`}
                                    </span>
                                  </div>
                                  <span className="text-[9.5px] font-semibold text-slate-500 leading-none no-print">
                                    ※ 헤더 경계선 드래그로 열 폭 조절 · Tab/Enter
                                    이동
                                  </span>
                                </div>
                              )}

                              <table
                                ref={page.isFirst ? gridTableRef : undefined}
                                style={{
                                  width: `${colWidths.reduce((a, b) => a + b, 0)}px`,
                                }}
                                className={`table-fixed border-collapse border border-slate-400 border-t-2 border-t-slate-800 border-b-2 border-b-slate-800 text-xs ${
                                  !page.isLast ? "flex-1 h-full" : ""
                                }`}
                              >
                                <colgroup>
                                  {colWidths.map((w, cIdx) => (
                                    <col key={cIdx} style={{ width: `${w}px` }} />
                                  ))}
                                </colgroup>
                                <thead>
                                  <tr
                                    className={`bg-slate-200 text-slate-900 select-none text-[10.5px] ${
                                      orientation === "landscape"
                                        ? "h-[24px]"
                                        : "h-[26px]"
                                    }`}
                                  >
                                    {[
                                      { label: "No", extraClass: "" },
                                      {
                                        label: "코드 · 품명",
                                        extraClass: "",
                                      },
                                      {
                                        label: "규격·레일길이(mm)",
                                        extraClass: "",
                                      },
                                      { label: "색상/재질", extraClass: "" },
                                      { label: "단위", extraClass: "" },
                                      { label: "수량 *", extraClass: "" },
                                      { label: "비\u00A0\u00A0고", extraClass: "" },
                                      { label: "삭제", extraClass: "no-print" },
                                    ].map((col, cIdx) => (
                                      <th
                                        key={cIdx}
                                        className={`relative border border-slate-400 text-center font-black text-slate-900 px-0.5 truncate ${col.extraClass}`}
                                      >
                                        <span>{col.label}</span>
                                        {cIdx < 7 && (
                                          <div
                                            onMouseDown={(e) =>
                                              startColResize(cIdx, e)
                                            }
                                            title="마우스로 좌우 드래그하여 열 너비를 조절합니다"
                                            className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[#FF7B00]/60 transition-colors no-print z-10"
                                          />
                                        )}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {page.rows.map(({ row, globalIdx }) => {
                                    const idx = globalIdx;
                                    const isFlashed = highlightedRow === idx;
                                    const resolved =
                                      resolveRowMasterDisplay(row);
                                    const hasProduct = Boolean(
                                      resolved.code || resolved.title,
                                    );
                                    const titleTypo = getDynamicCellTypography(
                                      [resolved.code, resolved.title]
                                        .filter(Boolean)
                                        .join(" "),
                                      Math.max(80, colWidths[1] - 18),
                                      pageCellInnerPx <= 24 ? 9.5 : 10,
                                    );

                                    return (
                                      <tr
                                        key={idx}
                                        style={{
                                          height: `${pageOuterRowPx}px`,
                                          minHeight: `${pageOuterRowPx}px`,
                                        }}
                                        className={`item-row transition-colors ${
                                          isFlashed
                                            ? "bg-orange-100/90"
                                            : hasProduct
                                              ? "bg-white"
                                              : "bg-white hover:bg-slate-50/60"
                                        }`}
                                      >
                                        {/* No: 코드·품명이 입력된 행에만 순번 표시, 빈 행은 공백 유지 */}
                                        <td className="bg-slate-100 text-slate-700 font-extrabold text-center border border-slate-400 select-none align-middle text-[10.5px] leading-none">
                                          {filledItemNumbers[idx] ?? ""}
                                        </td>

                                        {/* Locked Master Code + Product Name */}
                                        <td className="border border-slate-400 p-0 align-middle">
                                          <button
                                            type="button"
                                            data-cell={`${idx}-0`}
                                            style={{
                                              minHeight: `${pageCellInnerPx}px`,
                                            }}
                                            onClick={() => {
                                              setHoveredRowPreview(null);
                                              setRowPickerIdx(idx);
                                              setRowPickerSearch("");
                                              setRowPickerPreviewId(
                                                resolved.masterItem?.id || null,
                                              );
                                            }}
                                            onMouseEnter={(e) => {
                                              if (!resolved.masterItem?.image)
                                                return;
                                              const rect =
                                                e.currentTarget.getBoundingClientRect();
                                              const spaceRight =
                                                window.innerWidth - rect.right;
                                              const left =
                                                spaceRight >= 250
                                                  ? rect.right + 10
                                                  : Math.max(
                                                      12,
                                                      rect.left - 242,
                                                    );
                                              const top = Math.min(
                                                window.innerHeight - 270,
                                                Math.max(70, rect.top - 40),
                                              );
                                              setHoveredRowPreview({
                                                cat: resolved.masterItem,
                                                top,
                                                left,
                                              });
                                            }}
                                            onMouseLeave={() =>
                                              setHoveredRowPreview(null)
                                            }
                                            title={
                                              hasProduct
                                                ? "코드번호·품명은 원본 데이터 연동으로 직접 수정할 수 없습니다. 클릭하면 다른 공식 부품으로 교체할 수 있습니다."
                                                : "클릭하여 공식 카탈로그 부품을 선택하세요"
                                            }
                                            className={`w-full h-full px-1.5 ${
                                              pageCellInnerPx <= 26
                                                ? "py-0"
                                                : "py-0.5"
                                            } text-left flex items-center justify-between gap-1 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#FF7B00] ${
                                              hasProduct
                                                ? "bg-slate-50/60 hover:bg-orange-50/40"
                                                : "hover:bg-slate-50"
                                            }`}
                                          >
                                            {hasProduct ? (
                                              <>
                                                <div
                                                  style={titleTypo}
                                                  className="min-w-0 flex-1 flex items-center gap-1 flex-wrap leading-tight overflow-hidden line-clamp-2"
                                                >
                                                  <span className="inline-block font-black text-[9.5px] text-slate-900 bg-slate-200/80 px-1 py-0 rounded leading-tight shrink-0">
                                                    [{resolved.code}]
                                                  </span>
                                                  {resolved.title && (
                                                    <span className="font-bold text-slate-900 break-keep">
                                                      {resolved.title}
                                                    </span>
                                                  )}
                                                </div>
                                                <Lock
                                                  className="w-2.5 h-2.5 text-slate-400 shrink-0 no-print"
                                                  aria-hidden="true"
                                                />
                                              </>
                                            ) : (
                                              <span className="text-[9.5px] text-slate-400 font-normal truncate leading-none no-print">
                                                {idx === 0
                                                  ? "좌측 [+담기] 또는 클릭 선택"
                                                  : ""}
                                              </span>
                                            )}
                                          </button>
                                        </td>

                                        {/* 규격 / 레일길이 */}
                                        <td className="border border-slate-400 p-0 align-middle">
                                          <AutoWrapCell
                                            dataCell={`${idx}-1`}
                                            value={row.spec}
                                            onChange={(val) =>
                                              updateCell(idx, "spec", val)
                                            }
                                            onKeyDown={(e) =>
                                              handleCellKeyDown(e, idx, 1)
                                            }
                                            colWidthPx={colWidths[2]}
                                            minHeightPx={pageCellInnerPx}
                                            maxHeightPx={Math.max(
                                              pageCellInnerPx * 1.75,
                                              40,
                                            )}
                                            placeholder={
                                              idx === 0
                                                ? orientation === "landscape"
                                                  ? "예: 3,000mm"
                                                  : "예: 3,000mm"
                                                : ""
                                            }
                                            className="text-slate-900"
                                          />
                                        </td>

                                        {/* 색상 / 재질 */}
                                        <td className="border border-slate-400 p-0 align-middle">
                                          <AutoWrapCell
                                            dataCell={`${idx}-2`}
                                            value={row.color || ""}
                                            onChange={(val) =>
                                              updateCell(idx, "color", val)
                                            }
                                            onKeyDown={(e) =>
                                              handleCellKeyDown(e, idx, 2)
                                            }
                                            colWidthPx={colWidths[3]}
                                            minHeightPx={pageCellInnerPx}
                                            maxHeightPx={Math.max(
                                              pageCellInnerPx * 1.75,
                                              40,
                                            )}
                                            placeholder={
                                              idx === 0 ? "예: 실버" : ""
                                            }
                                            className="text-slate-900"
                                          />
                                        </td>

                                        {/* 단위 */}
                                        <td className="border border-slate-400 p-0 align-middle">
                                          <select
                                            data-cell={`${idx}-3`}
                                            value={row.unit || "SET"}
                                            onChange={(e) =>
                                              updateCell(
                                                idx,
                                                "unit",
                                                e.target.value,
                                              )
                                            }
                                            onKeyDown={(e) =>
                                              handleCellKeyDown(e, idx, 3)
                                            }
                                            style={{
                                              height: `${pageCellInnerPx}px`,
                                              WebkitAppearance: "none",
                                              MozAppearance: "none",
                                              appearance: "none",
                                              textAlignLast: "center",
                                            }}
                                            className="w-full h-full appearance-none px-0 text-[10.5px] font-semibold text-center text-slate-800 bg-transparent leading-none focus:outline-none focus:bg-yellow-50/70 hover:bg-slate-50/60 cursor-pointer select-none"
                                          >
                                            <option value="SET">SET</option>
                                            <option value="EA">EA</option>
                                            <option value="BOX">BOX</option>
                                            <option value="식">식</option>
                                          </select>
                                        </td>

                                        {/* 수량 */}
                                        <td className="border border-slate-400 p-0 align-middle">
                                          <input
                                            type="text"
                                            data-cell={`${idx}-4`}
                                            value={row.quantity}
                                            onChange={(e) =>
                                              updateCell(
                                                idx,
                                                "quantity",
                                                e.target.value,
                                              )
                                            }
                                            onKeyDown={(e) =>
                                              handleCellKeyDown(e, idx, 4)
                                            }
                                            placeholder={hasProduct ? "1" : ""}
                                            style={{
                                              height: `${pageCellInnerPx}px`,
                                            }}
                                            className="w-full px-2 py-0 text-[11px] font-black text-right text-slate-900 bg-transparent leading-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#FF7B00] focus:bg-amber-50/50"
                                          />
                                        </td>

                                        {/* 비고 */}
                                        <td className="border border-slate-400 p-0 align-middle">
                                          <AutoWrapCell
                                            dataCell={`${idx}-5`}
                                            value={row.note}
                                            onChange={(val) =>
                                              updateCell(idx, "note", val)
                                            }
                                            onKeyDown={(e) =>
                                              handleCellKeyDown(e, idx, 5)
                                            }
                                            colWidthPx={colWidths[6]}
                                            minHeightPx={pageCellInnerPx}
                                            maxHeightPx={Math.max(
                                              pageCellInnerPx * 1.75,
                                              40,
                                            )}
                                            placeholder={
                                              idx === 0 ? "예: 301동" : ""
                                            }
                                            className="text-slate-800"
                                          />
                                        </td>

                                        {/* 삭제 */}
                                        <td className="border border-slate-400 text-center p-0 no-print align-middle">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              clearOrRemoveRow(idx)
                                            }
                                            style={{
                                              height: `${pageCellInnerPx}px`,
                                            }}
                                            className="w-full py-0 leading-none text-slate-400 hover:text-red-600 font-bold transition-colors cursor-pointer"
                                            title={`행 비우기 / 삭제 (최소 ${MIN_ORDER_ROW_COUNT}행 유지)`}
                                          >
                                            ×
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}

                                  {/* Ruled Blank Form Rows to Fill A4 Proportions down to Bottom Margin */}
                                  {page.fillerCount > 0 &&
                                    Array.from({
                                      length: page.fillerCount,
                                    }).map((_, fIdx) => (
                                      <tr
                                        key={`filler-${page.pageIndex}-${fIdx}`}
                                        style={{
                                          height: `${pageOuterRowPx}px`,
                                          minHeight: `${pageOuterRowPx}px`,
                                        }}
                                        className="bg-white select-none pointer-events-none"
                                      >
                                        <td className="bg-slate-100 border border-slate-400 text-center text-[10px] text-slate-300" />
                                        <td className="border border-slate-400" />
                                        <td className="border border-slate-400" />
                                        <td className="border border-slate-400" />
                                        <td className="border border-slate-400" />
                                        <td className="border border-slate-400" />
                                        <td className="border border-slate-400" />
                                        <td className="border border-slate-400 no-print" />
                                      </tr>
                                    ))}

                                  {/* Page Bottom Summary or Continuation Row */}
                                  {page.isLast ? (
                                    <tr
                                      className={`bg-orange-50/90 font-black border-b-2 border-b-slate-800 ${
                                        orientation === "landscape"
                                          ? "h-[25px]"
                                          : "h-[28px]"
                                      }`}
                                    >
                                      <td
                                        colSpan={5}
                                        className="border border-slate-400 border-b-2 border-b-slate-800 text-center text-slate-900 text-[11px]"
                                      >
                                        합 계 (입력된 품목 수 : 총{" "}
                                        <span className="text-[#FF7B00]">
                                          {summary.itemCount}
                                        </span>
                                        종)
                                      </td>
                                      <td className="border border-slate-400 border-b-2 border-b-slate-800 px-2 text-right text-[#FF7B00] text-xs font-black">
                                        {summary.totalQty}
                                      </td>
                                      <td
                                        className="border border-slate-400 border-b-2 border-b-slate-800 px-2 text-center text-[10.5px] font-extrabold text-slate-700"
                                      >
                                        {summary.unitSummary}
                                      </td>
                                      <td className="border border-slate-400 border-b-2 border-b-slate-800 no-print" />
                                    </tr>
                                  ) : null}
                                </tbody>
                              </table>
                            </div>

                          {/* 4. Expanded 100% Full-Width 특기사항 / 배송메모 Table (Automatically expands to fill A4 sheet down to bottom 13mm margin) */}
                          {page.isLast && (
                            <>
                              {/* 6-Dot Height Resizer Handle between Line Items Table & Memo */}
                              <div
                                onMouseDown={handleStartMemoResize}
                                data-testid="memo-resize-handle"
                                style={{
                                  width: `${colWidths.reduce((a, b) => a + b, 0) + 1}px`,
                                }}
                                className={`no-print group relative h-[8px] my-0 flex items-center justify-center cursor-ns-resize select-none z-20 transition-colors ${
                                  isResizingMemo
                                    ? "bg-[#FF7B00] cursor-ns-resize"
                                    : "bg-transparent hover:bg-[#FF7B00]"
                                }`}
                              >
                                {/* 6-Dot Grip Icon: Distinctly spaced round dots, tight gap to top/bottom lines without touching */}
                                <div
                                  className={`relative z-10 flex items-center justify-center transition-colors pointer-events-none ${
                                    isResizingMemo
                                      ? "text-white"
                                      : "text-slate-400 group-hover:text-black"
                                  }`}
                                >
                                  <svg
                                    className="w-5 h-[8px] fill-current"
                                    viewBox="0 0 24 8"
                                  >
                                    <circle cx="5" cy="2.1" r="1" />
                                    <circle cx="12" cy="2.1" r="1" />
                                    <circle cx="19" cy="2.1" r="1" />
                                    <circle cx="5" cy="5.9" r="1" />
                                    <circle cx="12" cy="5.9" r="1" />
                                    <circle cx="19" cy="5.9" r="1" />
                                  </svg>
                                </div>

                                {/* Orange Floating Badge during Dragging */}
                                {isResizingMemo && (
                                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 px-2.5 py-0.5 rounded bg-[#FF7B00] text-white text-[10.5px] font-black shadow-lg flex items-center gap-1 whitespace-nowrap pointer-events-none">
                                    <span>행 수: {items.length}행</span>
                                    {customMemoHeightPx !== null ? (
                                      <span className="text-orange-100 text-[9px] font-normal">
                                        (메모 높이 {customMemoHeightPx}px · 빈행
                                        축소)
                                      </span>
                                    ) : (
                                      <span className="text-orange-100 text-[9px] font-normal">
                                        (빈행 조절)
                                      </span>
                                    )}
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#FF7B00]" />
                                  </div>
                                )}
                              </div>

                              <div
                                style={
                                  customMemoHeightPx !== null
                                    ? {
                                        height: `${customMemoHeightPx}px`,
                                        minHeight: `${customMemoHeightPx}px`,
                                      }
                                    : undefined
                                }
                                className={`flex-1 ${
                                  orientation === "landscape"
                                    ? "min-h-[46px]"
                                    : "min-h-[58px]"
                                } flex flex-col mt-0`}
                              >
                                <table
                                  style={{
                                    width: `${colWidths.reduce((a, b) => a + b, 0)}px`,
                                  }}
                                  className="w-full h-full flex-1 table-fixed border-collapse border border-slate-400 border-b-2 border-b-slate-800 text-xs"
                                >
                                  <colgroup>
                                    <col style={{ width: "108px" }} />
                                    <col
                                      style={{
                                        width: `${Math.max(
                                          200,
                                          colWidths.reduce((a, b) => a + b, 0) -
                                            108,
                                        )}px`,
                                      }}
                                    />
                                  </colgroup>
                                  <tbody>
                                    <tr className="h-full border-b-2 border-b-slate-800">
                                      <th className="h-full bg-slate-100 text-slate-900 font-black text-center border border-slate-400 border-b-2 border-b-slate-800 leading-snug text-[11px] px-2 align-middle">
                                        특기사항 /
                                        <br />
                                        배송메모
                                      </th>
                                      <td className="h-full border border-slate-400 border-b-2 border-b-slate-800 p-0 align-top">
                                        <div className="w-full h-full flex flex-col justify-between">
                                          <textarea
                                            value={memo}
                                            onChange={(e) => setMemo(e.target.value)}
                                            placeholder="예: 11/15 오전 화물 발송 후 송장번호 문자 부탁드립니다. / 현장 하차지 연락처 별도 기재 / 도면·엑셀 파일은 우측 견출 탭에서 첨부"
                                            className={`no-print w-full flex-1 px-2.5 text-[11px] font-semibold text-slate-900 bg-transparent resize-none overflow-hidden focus:outline-none focus:bg-yellow-50/60 leading-snug ${
                                              orientation === "landscape"
                                                ? "py-1"
                                                : "py-1.5"
                                            }`}
                                          />
                                          <div className="hidden print:block w-full flex-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-900 whitespace-pre-wrap break-words leading-snug">
                                            {memo}
                                          </div>
                                          {attachments.length > 0 && (
                                            <div className="px-2.5 py-0.5 bg-emerald-50/80 border-t border-emerald-200/80 text-[10px] font-bold text-emerald-800 flex items-center justify-between gap-2 truncate shrink-0">
                                              <span className="truncate">
                                                📎 별첨 발송 파일 ({attachments.length}
                                                건):{" "}
                                                {attachments
                                                  .map((a) => a.name)
                                                  .join(", ")}
                                              </span>
                                              <button
                                                type="button"
                                                data-attachment-toggle="true"
                                                onClick={() =>
                                                  setAttachmentTabOpen(true)
                                                }
                                                className="no-print text-[#FF7B00] hover:underline shrink-0 cursor-pointer"
                                              >
                                                견출 첨부함 보기
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                    })}
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Excel Multi-Row Paste Modal */}
      <Dialog open={pasteModalOpen} onOpenChange={setPasteModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>엑셀(Excel) 영역 복사 · 붙여넣기</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs text-slate-600">
            <p>
              엑셀 시트에서 <strong>[품명 / 규격 / 색상 / 단위 / 수량 / 비고]</strong> 열을 드래그하여 복사(<kbd className="px-1.5 py-0.5 bg-slate-100 border rounded">Ctrl+C</kbd>)한 뒤 아래 칸에 붙여넣기(<kbd className="px-1.5 py-0.5 bg-slate-100 border rounded">Ctrl+V</kbd>) 하시면 여러 행이 한 번에 입력됩니다.
            </p>
            <Textarea
              rows={7}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`예시:\nDP-60\t상부롤러+양방향댐퍼\t기본\tSET\t12\t안방 중문\nSL-3332\t3,000mm\t실버\tEA\t6\t3M 원장`}
              className="font-mono text-xs"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPasteModalOpen(false)}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={() => {
                const firstEmpty = items.findIndex(
                  (r) => !r.productName.trim(),
                );
                applySpreadsheetPaste(
                  pasteText,
                  firstEmpty === -1 ? items.length : firstEmpty,
                  0,
                );
                setPasteText("");
                setPasteModalOpen(false);
              }}
              className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold"
            >
              발주서 표에 일괄 적용
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Row Count Reduction Confirmation Modal (COAS Orange Theme) */}
      <Dialog
        open={Boolean(pendingRowTrimConfirm)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRowTrimConfirm(null);
            setRowCountDraft(String(items.length));
          }
        }}
      >
        <DialogContent className="max-w-md border-t-4 border-t-[#FF7B00]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF7B00] shrink-0" />
              <span>표 행 수 축소 확인</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-xs leading-relaxed text-slate-700 space-y-1">
            {pendingRowTrimConfirm && (() => {
              const target = pendingRowTrimConfirm.targetCount;
              const startRow = target + 1;
              const endRow = items.length;
              const deletedItems = items.slice(target);
              const filledDeletedCount = deletedItems.filter(
                (r) =>
                  r.productId ||
                  r.productName.trim() ||
                  r.spec.trim() ||
                  r.quantity.trim() ||
                  r.note.trim(),
              ).length;
              const rowRangeText =
                startRow === endRow
                  ? `${startRow}번째 행`
                  : `${startRow}번째 ~ ${endRow}번째 행`;

              return (
                <>
                  <p>
                    표 행 수를{" "}
                    <strong className="text-[#FF7B00] font-extrabold">
                      {target}행
                    </strong>
                    으로 줄이시면{" "}
                    <strong className="text-slate-900 font-extrabold">
                      {rowRangeText}
                    </strong>
                    에 이미 입력된 품목 내용
                    {filledDeletedCount > 0
                      ? ` (총 ${filledDeletedCount}건)`
                      : ""}
                    이 삭제됩니다.
                  </p>
                  <p className="text-slate-500 font-medium">
                    계속 진행하시겠습니까?
                  </p>
                </>
              );
            })()}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPendingRowTrimConfirm(null);
                setRowCountDraft(String(items.length));
              }}
              className="border-slate-300 text-slate-700 hover:bg-slate-100 font-bold"
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!pendingRowTrimConfirm) return;
                const { targetCount, presetHint } = pendingRowTrimConfirm;
                setPendingRowTrimConfirm(null);
                setTargetRowCount(targetCount, presetHint, true);
              }}
              className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold"
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Hover Image Preview for Filled Table Rows */}
      {hoveredRowPreview && rowPickerIdx === null && !zoomedItem && (
        <div
          style={{
            top: `${hoveredRowPreview.top}px`,
            left: `${hoveredRowPreview.left}px`,
          }}
          className="fixed z-50 w-[232px] bg-white rounded-lg border-2 border-[#FF7B00] shadow-2xl overflow-hidden pointer-events-none no-print"
        >
          <div className="bg-slate-900 text-white px-2.5 py-1.5 flex items-center justify-between text-[10px]">
            <span className="font-bold text-orange-300 truncate">
              [{hoveredRowPreview.cat.code}]
            </span>
            <span className="text-slate-400 shrink-0">제품 미리보기</span>
          </div>
          <div className="h-[155px] bg-white p-2 flex items-center justify-center border-b border-slate-100">
            {hoveredRowPreview.cat.image && (
              <img
                src={resolveAssetUrl(hoveredRowPreview.cat.image)}
                alt={hoveredRowPreview.cat.code}
                className="w-full h-full object-contain"
              />
            )}
          </div>
          <div className="px-2.5 py-2 bg-orange-50/60">
            <p className="text-[11px] font-bold text-slate-900 truncate">
              {hoveredRowPreview.cat.title}
            </p>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">
              {hoveredRowPreview.cat.specHint}
            </p>
          </div>
        </div>
      )}

      {/* Locked Master Product Cell Picker Modal (Left-Right Split Real-Time Hover Preview) */}
      <Dialog
        open={rowPickerIdx !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRowPickerIdx(null);
            setRowPickerSearch("");
            setRowPickerPreviewId(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Lock className="w-4 h-4 text-[#FF7B00]" />
              <span>
                {rowPickerIdx !== null ? `${rowPickerIdx + 1}번 행 ` : ""}공식
                부품 선택 (원본 데이터 연동)
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-[11px] text-slate-500">
              코드번호·품명은 원본 데이터 연동으로{" "}
              <strong>직접 수정할 수 없으며</strong>, 목록에 마우스 커서를
              올리면 우측에서 즉시 제품 이미지를 확인할 수 있습니다.
            </p>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={rowPickerSearch}
                onChange={(e) => setRowPickerSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (filteredPickerCatalog.length === 0) return;
                  const curIdx = filteredPickerCatalog.findIndex(
                    (c) => c.id === activePickerPreview?.id,
                  );
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    const nextIdx =
                      curIdx < filteredPickerCatalog.length - 1 ? curIdx + 1 : 0;
                    setRowPickerPreviewId(filteredPickerCatalog[nextIdx].id);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    const prevIdx =
                      curIdx > 0 ? curIdx - 1 : filteredPickerCatalog.length - 1;
                    setRowPickerPreviewId(filteredPickerCatalog[prevIdx].id);
                  } else if (
                    e.key === "Enter" &&
                    activePickerPreview &&
                    rowPickerIdx !== null
                  ) {
                    e.preventDefault();
                    handleAssignProductToRow(rowPickerIdx, activePickerPreview);
                  }
                }}
                placeholder="코드번호(DP-60, SL-3332) 또는 품명 검색 (↑↓ 이동 / Enter 즉시 적용)..."
                className="w-full h-9 pl-9 pr-3 text-xs border-2 border-orange-300 focus:border-[#FF7B00] rounded-md focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
              {/* Left Column: Search List with Mini Thumbnails */}
              <div className="md:col-span-7 max-h-[340px] overflow-y-auto divide-y divide-slate-200 border border-slate-200 rounded-md bg-white">
                {filteredPickerCatalog.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    검색 조건에 일치하는 공식 부품이 없습니다.
                  </div>
                ) : (
                  filteredPickerCatalog.map((cat) => {
                    const isPreview = activePickerPreview?.id === cat.id;
                    return (
                      <div
                        key={cat.id}
                        onMouseEnter={() => setRowPickerPreviewId(cat.id)}
                        onClick={() => {
                          if (rowPickerIdx !== null) {
                            handleAssignProductToRow(rowPickerIdx, cat);
                          }
                        }}
                        className={`w-full px-2.5 py-2 flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                          isPreview
                            ? "bg-orange-50/90 ring-1 ring-inset ring-[#FF7B00]"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-11 h-11 rounded border border-slate-200 bg-white p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                            {cat.image ? (
                              <img
                                src={resolveAssetUrl(cat.image)}
                                alt={cat.code}
                                loading="lazy"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <span className="text-[9px] text-slate-400">
                                NO IMG
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-xs text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {cat.code}
                              </span>
                              {cat.page && (
                                <span className="text-[10px] font-bold text-[#FF7B00]">
                                  {cat.page}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-medium text-slate-700 truncate mt-0.5">
                              {cat.title}
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-[#FF7B00] hover:bg-[#e66f00] text-white text-[11px] font-bold shrink-0">
                          선택
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Real-Time Large Hover Image Preview Panel */}
              <div className="md:col-span-5 border border-slate-200 rounded-md bg-slate-50/90 p-3 flex flex-col justify-between">
                {activePickerPreview ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-white text-[10px] font-bold">
                          실시간 호버 미리보기
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          1:1 무손실 원본 비율
                        </span>
                      </div>
                      <div className="h-[195px] w-full bg-white rounded border border-slate-200 flex items-center justify-center p-1 overflow-hidden">
                        {activePickerPreview.image ? (
                          <img
                            src={resolveAssetUrl(activePickerPreview.image)}
                            alt={activePickerPreview.code}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">
                            등록된 이미지가 없습니다.
                          </span>
                        )}
                      </div>
                      <div className="mt-2.5 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-[#FF7B00] text-white text-[11px] font-bold shrink-0">
                            {activePickerPreview.code}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {activePickerPreview.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 truncate">
                          기본 단위: {activePickerPreview.defaultUnit} · 규격:{" "}
                          {activePickerPreview.specHint}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 space-y-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (rowPickerIdx !== null) {
                            handleAssignProductToRow(
                              rowPickerIdx,
                              activePickerPreview,
                            );
                          }
                        }}
                        className="w-full py-2 rounded-md bg-[#FF7B00] hover:bg-[#e66f00] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        {activePickerPreview.code} 선택 적용하기
                      </button>
                      <div className="text-center">
                        <Link
                          href={`/product/${activePickerPreview.id}`}
                          className="text-[11px] font-semibold text-slate-600 hover:text-[#FF7B00] inline-flex items-center gap-0.5"
                        >
                          <span>상세/도면 보기</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 text-center py-12">
                    좌측 목록에 마우스 커서를 올리면
                    <br />
                    제품 이미지가 크게 표시됩니다.
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              ※ ↑↓ 키보드로 이동하거나 마우스를 올리면 우측 이미지가 즉시
              전환됩니다.
            </span>
            <div className="flex items-center gap-2 ml-auto">
              {rowPickerIdx !== null && items[rowPickerIdx]?.productName && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (rowPickerIdx !== null) {
                      clearOrRemoveRow(rowPickerIdx);
                      setRowPickerIdx(null);
                      setRowPickerPreviewId(null);
                    }
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                >
                  이 행 비우기
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRowPickerIdx(null);
                  setRowPickerSearch("");
                  setRowPickerPreviewId(null);
                }}
                className="text-xs"
              >
                닫기
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* COAS Admin Unlock Modal for On-Page Recommendation Curation */}
      <Dialog
        open={adminAuthModalOpen}
        onOpenChange={(open) => {
          setAdminAuthModalOpen(open);
          if (!open) setAdminPwInput("");
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="w-5 h-5 text-[#FF7B00]" />
              <span>코아스 관리자 추천 설정 인증</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdminUnlockLogin} className="space-y-3 py-1">
            <p className="text-xs text-slate-600 leading-relaxed">
              추천 부속의 <strong>★ 공식 지정 등록</strong> 및{" "}
              <strong>부적합 품목 제외</strong>는 코아스 관리자만 변경할 수
              있습니다. 관리자 비밀번호를 입력해주세요.
            </p>
            <input
              type="password"
              autoFocus
              value={adminPwInput}
              onChange={(e) => setAdminPwInput(e.target.value)}
              placeholder="관리자 비밀번호 입력"
              className="w-full h-10 px-3 text-sm border border-slate-300 focus:border-[#FF7B00] rounded-md focus:outline-none"
            />
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdminAuthModalOpen(false)}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={adminLoggingIn}
                className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold"
              >
                {adminLoggingIn && (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                )}
                인증 후 편집 모드 켜기
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
