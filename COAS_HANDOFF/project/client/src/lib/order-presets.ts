export interface OrderLayoutPreset {
  id: string;
  name: string;
  orientation: "portrait" | "landscape";
  rowCount: number;
  rowHeightPx: number;
  colWidths?: number[];
  zoomPct?: number;
  isBuiltIn?: boolean;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const MAX_CUSTOM_PRESETS = 20;
export const STORAGE_CUSTOM_PRESETS_KEY = "coas_order_custom_presets_v2";
export const STORAGE_DEFAULT_PRESET_KEY = "coas_order_default_preset_id_v2";

export const BUILTIN_LAYOUT_PRESETS: OrderLayoutPreset[] = [
  {
    id: "builtin-memo-10",
    name: "10행 메모확대 (세로)",
    orientation: "portrait",
    rowCount: 10,
    rowHeightPx: 32,
    zoomPct: 100,
    isBuiltIn: true,
    isDefault: false,
    createdAt: "2026-11-15T00:00:00.000Z",
    updatedAt: "2026-11-15T00:00:00.000Z",
  },
  {
    id: "builtin-portrait-15",
    name: "15행 실무형 (세로)",
    orientation: "portrait",
    rowCount: 15,
    rowHeightPx: 32,
    zoomPct: 100,
    isBuiltIn: true,
    isDefault: false,
    createdAt: "2026-11-15T00:00:00.000Z",
    updatedAt: "2026-11-15T00:00:00.000Z",
  },
  {
    id: "builtin-std-20",
    name: "20행 표준규격 (세로)",
    orientation: "portrait",
    rowCount: 20,
    rowHeightPx: 32,
    zoomPct: 100,
    isBuiltIn: true,
    isDefault: true,
    createdAt: "2026-11-15T00:00:00.000Z",
    updatedAt: "2026-11-15T00:00:00.000Z",
  },
  {
    id: "builtin-max-25",
    name: "25행 1장최대 (세로)",
    orientation: "portrait",
    rowCount: 25,
    rowHeightPx: 28,
    zoomPct: 100,
    isBuiltIn: true,
    isDefault: false,
    createdAt: "2026-11-15T00:00:00.000Z",
    updatedAt: "2026-11-15T00:00:00.000Z",
  },
  {
    id: "builtin-wide-15",
    name: "15행 와이드 (가로)",
    orientation: "landscape",
    rowCount: 15,
    rowHeightPx: 32,
    zoomPct: 100,
    isBuiltIn: true,
    isDefault: false,
    createdAt: "2026-11-15T00:00:00.000Z",
    updatedAt: "2026-11-15T00:00:00.000Z",
  },
];

export function loadAllPresets(): OrderLayoutPreset[] {
  if (typeof window === "undefined") return BUILTIN_LAYOUT_PRESETS;

  let defaultId = "";
  try {
    defaultId = localStorage.getItem(STORAGE_DEFAULT_PRESET_KEY) || "";
  } catch {}

  let customs: OrderLayoutPreset[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        customs = parsed.filter(
          (p) => p && typeof p.id === "string" && typeof p.name === "string",
        );
      }
    }
  } catch {}

  // If no default explicitly selected, builtin-std-20 is default
  const effectiveDefaultId = defaultId || "builtin-std-20";

  const all = [...BUILTIN_LAYOUT_PRESETS, ...customs].map((p) => ({
    ...p,
    isDefault: p.id === effectiveDefaultId,
  }));

  return all;
}

export function saveCustomPresets(customs: OrderLayoutPreset[]): void {
  if (typeof window === "undefined") return;
  try {
    const clean = customs
      .filter((p) => !p.isBuiltIn)
      .slice(0, MAX_CUSTOM_PRESETS);
    localStorage.setItem(STORAGE_CUSTOM_PRESETS_KEY, JSON.stringify(clean));
  } catch {}
}

export function setDefaultPresetId(presetId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_DEFAULT_PRESET_KEY, presetId);
  } catch {}
}
