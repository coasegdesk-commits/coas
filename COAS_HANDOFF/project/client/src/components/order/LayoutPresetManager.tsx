import React, { useState, useEffect, useRef } from "react";
import {
  Star,
  Check,
  Plus,
  Trash2,
  ChevronDown,
  Layout,
  SlidersHorizontal,
  BookmarkCheck,
  AlertCircle,
  Copy,
} from "lucide-react";
import {
  type OrderLayoutPreset,
  MAX_CUSTOM_PRESETS,
  loadAllPresets,
  saveCustomPresets,
  setDefaultPresetId,
} from "@/lib/order-presets";
import { useToast } from "@/hooks/use-toast";

interface LayoutPresetManagerProps {
  currentSettings: {
    orientation: "portrait" | "landscape";
    rowCount: number;
    rowHeightPx: number;
    colWidths: number[];
    zoomPct: number;
  };
  onApplyPreset: (preset: OrderLayoutPreset) => void;
  activePresetId?: string;
}

export function LayoutPresetManager({
  currentSettings,
  onApplyPreset,
  activePresetId,
}: LayoutPresetManagerProps) {
  const { toast } = useToast();
  const [presets, setPresets] = useState<OrderLayoutPreset[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load presets on mount and listen for preset change events
  useEffect(() => {
    const reload = () => setPresets(loadAllPresets());
    reload();
    window.addEventListener("coas-preset-change", reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener("coas-preset-change", reload);
      window.removeEventListener("storage", reload);
    };
  }, []);

  const customCount = presets.filter((p) => !p.isBuiltIn).length;

  // Determine active preset:
  // 1) Match current settings (orientation + rowCount)
  // 2) Or match by activePresetId
  // 3) Or default preset
  const matchedBySettings = presets.find(
    (p) =>
      p.orientation === currentSettings.orientation &&
      p.rowCount === currentSettings.rowCount,
  );
  const matchedById = presets.find((p) => p.id === activePresetId);
  const activePreset = matchedBySettings || matchedById;
  const activeId = activePreset?.id || activePresetId;

  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Handle Save Current Settings as New Preset
  const handleSaveCurrent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (customCount >= MAX_CUSTOM_PRESETS) {
      toast({
        title: "저장 한도 도달 (최대 20개)",
        description:
          "커스텀 용지설정은 최대 20개까지 저장할 수 있습니다. 기존 설정을 삭제한 후 다시 시도해 주세요.",
        variant: "destructive",
      });
      return;
    }

    const defaultName = `내 용지설정 ${customCount + 1} (${
      currentSettings.orientation === "landscape" ? "가로" : "세로"
    } ${currentSettings.rowCount}행)`;
    const finalName = newPresetName.trim() || defaultName;

    const newPreset: OrderLayoutPreset = {
      id: `custom-${Date.now()}`,
      name: finalName,
      orientation: currentSettings.orientation,
      rowCount: currentSettings.rowCount,
      rowHeightPx: currentSettings.rowHeightPx,
      colWidths: [...currentSettings.colWidths],
      zoomPct: currentSettings.zoomPct,
      isBuiltIn: false,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextCustoms = [
      ...presets.filter((p) => !p.isBuiltIn),
      newPreset,
    ];
    saveCustomPresets(nextCustoms);
    setPresets(loadAllPresets());
    setNewPresetName("");
    setShowSaveInput(false);

    toast({
      title: "새 용지설정이 저장되었습니다.",
      description: `"${finalName}" (최대 20개 중 ${nextCustoms.length}개 보관)`,
    });

    onApplyPreset(newPreset);
  };

  // Delete Custom Preset
  const handleDeletePreset = (id: string, name: string) => {
    const nextCustoms = presets.filter((p) => !p.isBuiltIn && p.id !== id);
    saveCustomPresets(nextCustoms);
    setPresets(loadAllPresets());
    toast({
      title: "용지설정이 삭제되었습니다.",
      description: `"${name}"이 보관함에서 제거되었습니다.`,
    });
  };

  // Toggle Default Preset (★)
  const handleSetDefault = (id: string, name: string) => {
    setDefaultPresetId(id);
    setPresets(loadAllPresets());
    toast({
      title: "기본 용지설정이 지정되었습니다.",
      description: `앞으로 발주서 접속 시 "${name}"이 기본으로 적용됩니다.`,
    });
  };

  return (
    <div className="space-y-2.5 pb-2.5 border-b border-slate-200">
      {/* 1. Header Bar: Title + Storage Count + Save Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Layout className="w-3.5 h-3.5 text-[#FF7B00]" />
          <span className="text-[12px] font-black text-slate-800">
            용지설정 보관함
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
            내 저장 {customCount}/{MAX_CUSTOM_PRESETS}개
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowSaveInput((prev) => !prev)}
          className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border ${
            showSaveInput
              ? "bg-orange-50 border-[#FF7B00] text-[#FF7B00]"
              : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
          }`}
          title="현재 설정(행 수, 방향, 높이)을 새 용지설정으로 저장"
        >
          <Plus className="w-3 h-3 text-[#FF7B00]" />
          <span>현재 용지설정 저장</span>
        </button>
      </div>

      {/* Save Input Row (Collapsible) */}
      {showSaveInput && (
        <form
          onSubmit={handleSaveCurrent}
          className="p-2 rounded-md bg-orange-50/70 border border-orange-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder={`용지설정 이름 (예: ${currentSettings.rowCount}행 ${
              currentSettings.orientation === "landscape" ? "가로" : "세로"
            } 맞춤형)`}
            className="flex-1 px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-300 rounded focus:outline-none focus:border-[#FF7B00]"
            maxLength={30}
            autoFocus
          />
          <button
            type="submit"
            className="px-2.5 py-1 rounded bg-[#FF7B00] hover:bg-[#e66f00] text-white text-[11px] font-bold shrink-0 cursor-pointer"
          >
            저장
          </button>
          <button
            type="button"
            onClick={() => setShowSaveInput(false)}
            className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 text-[11px] font-bold shrink-0 cursor-pointer"
          >
            취소
          </button>
        </form>
      )}

      {/* 2. Horizontal Scrolling Mini Thumbnails Carousel */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
          <span>미니 썸네일 미리보기 (가로 스크롤)</span>
          <span className="text-slate-400">← 좌우 휠/드래그 →</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 px-0.5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          {presets.map((preset) => {
            const isActive = preset.id === activeId;
            const isLandscape = preset.orientation === "landscape";

            // Visual height proportion of line items vs. memo
            // 10 rows: table ~38%, memo ~55%
            // 20 rows: table ~65%, memo ~28%
            // 25 rows: table ~78%, memo ~15%
            const tableRatioPct = Math.min(
              82,
              Math.max(34, Math.round((preset.rowCount / 25) * 78)),
            );
            const memoRatioPct = Math.max(12, 92 - tableRatioPct);

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyPreset(preset)}
                className={`relative shrink-0 flex flex-col items-center p-1 rounded-md border text-left cursor-pointer transition-all ${
                  isActive
                    ? "bg-orange-50/80 border-[#FF7B00] shadow-sm ring-2 ring-orange-400/40"
                    : "bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                }`}
                style={{
                  width: isLandscape ? "84px" : "66px",
                }}
                title={`[${preset.name}] 클릭 시 양식 즉시 적용`}
              >
                {/* Active Checkmark Badge */}
                {isActive && (
                  <span className="absolute -top-1 -right-1 z-10 w-4 h-4 rounded-full bg-[#FF7B00] text-white flex items-center justify-center shadow-sm">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}

                {/* Default Star Badge */}
                {preset.isDefault && (
                  <span
                    className="absolute -top-1 -left-1 z-10 w-3.5 h-3.5 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-sm"
                    title="기본 열림 양식"
                  >
                    <Star className="w-2.5 h-2.5 fill-current" />
                  </span>
                )}

                {/* Mini A4 Sheet Representation */}
                <div
                  className={`bg-white border rounded-[2px] shadow-2xs overflow-hidden flex flex-col p-1 gap-0.5 ${
                    isActive ? "border-orange-300" : "border-slate-300"
                  }`}
                  style={{
                    width: isLandscape ? "74px" : "54px",
                    height: isLandscape ? "52px" : "72px",
                  }}
                >
                  {/* Mini Header Bar */}
                  <div className="w-full h-1 bg-slate-800 rounded-xs shrink-0" />
                  <div className="w-3/5 h-0.5 bg-orange-400 rounded-xs shrink-0" />

                  {/* Mini Line-Items Table Graphic */}
                  <div
                    style={{ height: `${tableRatioPct}%` }}
                    className="w-full border border-slate-300 rounded-xs bg-slate-50/80 flex flex-col justify-evenly px-0.5 py-0.2 overflow-hidden shrink-0"
                  >
                    {Array.from({
                      length: Math.min(6, Math.max(3, Math.round(preset.rowCount / 4))),
                    }).map((_, idx) => (
                      <div
                        key={idx}
                        className="w-full h-[1px] bg-slate-200"
                      />
                    ))}
                  </div>

                  {/* Mini Memo Area Graphic (Expands significantly when rowCount is 10) */}
                  <div
                    style={{ height: `${memoRatioPct}%` }}
                    className={`w-full rounded-xs border border-dashed flex items-center justify-center text-[7px] font-black shrink-0 ${
                      preset.rowCount <= 12
                        ? "bg-amber-100/80 border-amber-400 text-amber-900"
                        : "bg-slate-100 border-slate-300 text-slate-500"
                    }`}
                  >
                    <span className="scale-[0.8] leading-none">메모</span>
                  </div>
                </div>

                {/* Card Bottom Meta */}
                <div className="w-full mt-1 text-center">
                  <div className="text-[10px] font-extrabold text-slate-800 truncate leading-tight">
                    {preset.rowCount}행
                  </div>
                  <div className="text-[8.5px] font-medium text-slate-500 truncate leading-none mt-0.5">
                    {isLandscape ? "가로" : "세로"}·{preset.rowHeightPx}px
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 5-Item Height Pulldown Menu with Scrollbar */}
      <div ref={dropdownRef} className="relative">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
          <span>저장된 용지설정 (5개 스크롤)</span>
          {activePreset && (
            <span className="text-[#FF7B00] font-black">
              현재: {activePreset.name}
            </span>
          )}
        </div>

        {/* Pulldown Trigger Button */}
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className={`w-full px-3 py-1.5 rounded-md border text-left flex items-center justify-between cursor-pointer transition-colors ${
            dropdownOpen
              ? "bg-slate-50 border-[#FF7B00] text-slate-900 shadow-sm"
              : "bg-white border-slate-300 hover:border-slate-400 text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <BookmarkCheck className="w-3.5 h-3.5 text-[#FF7B00] shrink-0" />
            <span className="text-[11px] font-bold truncate">
              {activePreset ? activePreset.name : "용지설정을 선택하세요"}
            </span>
            {activePreset && (
              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold shrink-0">
                {activePreset.orientation === "landscape" ? "가로" : "세로"} ·{" "}
                {activePreset.rowCount}행
              </span>
            )}
            {activePreset?.isDefault && (
              <span className="text-amber-500 text-[10px] flex items-center gap-0.5 font-bold shrink-0">
                <Star className="w-2.5 h-2.5 fill-current" />
                기본
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${
              dropdownOpen ? "rotate-180 text-[#FF7B00]" : ""
            }`}
          />
        </button>

        {/* Pulldown Content: Exactly 5 items visible height (max-h-[195px]) */}
        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-300 rounded-md shadow-xl overflow-hidden">
            <div className="max-h-[195px] overflow-y-auto divide-y divide-slate-100 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
              {presets.map((preset) => {
                const isActive = preset.id === activeId;
                return (
                  <div
                    key={preset.id}
                    className={`px-2.5 py-1.5 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors ${
                      isActive ? "bg-orange-50/60" : ""
                    }`}
                  >
                    {/* Left: Info */}
                    <div
                      onClick={() => {
                        onApplyPreset(preset);
                        setDropdownOpen(false);
                      }}
                      className="flex-1 min-w-0 cursor-pointer flex items-center gap-2"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(preset.id, preset.name);
                        }}
                        className={`p-0.5 rounded hover:bg-slate-200 transition-colors cursor-pointer shrink-0 ${
                          preset.isDefault
                            ? "text-amber-500"
                            : "text-slate-300 hover:text-amber-400"
                        }`}
                        title={
                          preset.isDefault
                            ? "현재 기본 접속 용지설정입니다"
                            : "이 설정을 기본 접속 용지설정으로 지정 (★)"
                        }
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            preset.isDefault ? "fill-current" : ""
                          }`}
                        />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[11px] font-bold truncate ${
                              isActive ? "text-[#FF7B00]" : "text-slate-800"
                            }`}
                          >
                            {preset.name}
                          </span>
                          {preset.isBuiltIn && (
                            <span className="text-[8.5px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-medium shrink-0">
                              기본
                            </span>
                          )}
                        </div>
                        <div className="text-[9.5px] text-slate-500 font-medium flex items-center gap-1.5">
                          <span>
                            {preset.orientation === "landscape"
                              ? "A4 가로"
                              : "A4 세로"}
                          </span>
                          <span>·</span>
                          <span>{preset.rowCount}행</span>
                          <span>·</span>
                          <span>{preset.rowHeightPx}px</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onApplyPreset(preset);
                          setDropdownOpen(false);
                        }}
                        className={`px-2 py-0.5 rounded text-[10.5px] font-bold cursor-pointer transition-colors ${
                          isActive
                            ? "bg-[#FF7B00] text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {isActive ? "적용됨" : "적용"}
                      </button>

                      {!preset.isBuiltIn && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDeletePreset(preset.id, preset.name)
                          }
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="용지설정 삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Footer in Pulldown */}
            <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-600">
              <span className="font-semibold">
                총 {presets.length}개 (기본 4 + 커스텀 {customCount}/20)
              </span>
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  setShowSaveInput(true);
                }}
                className="text-[#FF7B00] hover:underline font-bold cursor-pointer"
              >
                + 현재 용지설정 새로 등록
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
