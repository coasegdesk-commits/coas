import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { adminFetch, resolveAssetUrl } from "@/lib/cms";
import { ImagePicker } from "./image-picker";
import type {
  CmsProduct,
  HomeCategoryCard,
  HomeFeaturedProduct,
  MediaItem,
  SiteDesignSettings,
} from "@shared/cms-types";
import {
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  Building2,
  Sparkles,
  LayoutGrid,
  Star,
} from "lucide-react";

interface AdminDesignTabProps {
  design: SiteDesignSettings;
  products: CmsProduct[];
  mediaList: MediaItem[];
  onSaved: () => void;
  onMediaUploaded: (item: MediaItem) => void;
}

export function AdminDesignTab({
  design,
  products,
  mediaList,
  onSaved,
  onMediaUploaded,
}: AdminDesignTabProps) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<SiteDesignSettings>(design);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(design);
  }, [design]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminFetch("/api/admin/design", {
        method: "PUT",
        body: JSON.stringify(draft),
      });
      toast({
        title: "홈 & 사이트 디자인 설정이 저장되었습니다.",
        description: "쇼핑몰 화면에 즉시 반영되었습니다.",
      });
      onSaved();
    } catch (err: any) {
      toast({
        title: "저장 실패",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Category helpers
  const updateCategory = (idx: number, patch: Partial<HomeCategoryCard>) => {
    setDraft((prev) => {
      const next = [...prev.categories];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, categories: next };
    });
  };

  const addCategory = () => {
    setDraft((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        {
          id: `cat-${Date.now()}`,
          title: "새 카테고리",
          desc: "카테고리 설명",
          image: "",
          href: "/parts-index",
        },
      ],
    }));
  };

  const removeCategory = (idx: number) => {
    setDraft((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== idx),
    }));
  };

  const moveCategory = (idx: number, dir: -1 | 1) => {
    setDraft((prev) => {
      const next = [...prev.categories];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...prev, categories: next };
    });
  };

  // Featured product helpers
  const updateFeatured = (idx: number, patch: Partial<HomeFeaturedProduct>) => {
    setDraft((prev) => {
      const next = [...prev.featuredProducts];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, featuredProducts: next };
    });
  };

  const addFeatured = () => {
    setDraft((prev) => ({
      ...prev,
      featuredProducts: [
        ...prev.featuredProducts,
        {
          id: `fp-${Date.now()}`,
          productId: "sd-60",
          name: "신규 인기 제품",
          page: "",
          image: "",
        },
      ],
    }));
  };

  const removeFeatured = (idx: number) => {
    setDraft((prev) => ({
      ...prev,
      featuredProducts: prev.featuredProducts.filter((_, i) => i !== idx),
    }));
  };

  const moveFeatured = (idx: number, dir: -1 | 1) => {
    setDraft((prev) => {
      const next = [...prev.featuredProducts];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...prev, featuredProducts: next };
    });
  };

  return (
    <div className="space-y-6">
      {/* Sticky Top Save Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            홈 화면 · 회사 정보 · 배너 디자인 관리
          </h2>
          <p className="text-xs text-gray-500">
            메인 배너, 발주서 버튼 문구, 카테고리 카드, 인기 제품 및 상·하단 연락처를 수정합니다.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold px-6 shrink-0"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              변경사항 저장하기
            </>
          )}
        </Button>
      </div>

      {/* 1. Hero Main Banner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-5 h-5 text-[#FF7B00]" />
            1. 홈 상단 메인 배너 (Hero 영역)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Live Mini Hero Preview */}
          <div className="relative rounded-xl overflow-hidden border border-gray-200 h-56 flex items-center bg-slate-900">
            {draft.hero.bgImageUrl && (
              <img
                src={resolveAssetUrl(draft.hero.bgImageUrl)}
                alt="배너 미리보기"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div
              className="absolute inset-0 bg-slate-950"
              style={{
                opacity: Math.min(0.95, Math.max(0, draft.hero.overlayOpacity / 100)),
              }}
            />
            <div className="relative z-10 px-6 md:px-10 text-white space-y-2 max-w-2xl">
              <span className="inline-block text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/30 bg-white/10">
                {draft.hero.badgeText}
              </span>
              <h3 className="text-xl md:text-2xl font-bold leading-tight">
                {draft.hero.titleLine1}
                <br />
                {draft.hero.titleLine2}
              </h3>
              <p className="text-xs text-gray-200 line-clamp-2 whitespace-pre-line">
                {draft.hero.subtitle}
              </p>
              <div className="flex gap-2 pt-1">
                <span className="px-3 py-1.5 rounded bg-white text-gray-900 text-xs font-semibold">
                  {draft.hero.primaryBtnText}
                </span>
                <span className="px-3 py-1.5 rounded bg-[#FF7B00] text-white text-xs font-semibold">
                  {draft.hero.orderBtnText} →
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <ImagePicker
                label="배경 이미지"
                value={draft.hero.bgImageUrl}
                onChange={(url) =>
                  setDraft((p) => ({
                    ...p,
                    hero: { ...p.hero, bgImageUrl: url },
                  }))
                }
                folder="banners"
                mediaList={mediaList}
                onUploaded={onMediaUploaded}
              />

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">
                    배경 어둡기 (텍스트 가독성 조절)
                  </span>
                  <span className="font-bold text-[#FF7B00]">
                    {draft.hero.overlayOpacity}%
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={95}
                  value={draft.hero.overlayOpacity}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      hero: {
                        ...p.hero,
                        overlayOpacity: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full accent-[#FF7B00]"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  상단 영문 배지 문구
                </label>
                <Input
                  value={draft.hero.badgeText}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      hero: { ...p.hero, badgeText: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    메인 타이틀 (1줄)
                  </label>
                  <Input
                    value={draft.hero.titleLine1}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        hero: { ...p.hero, titleLine1: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    메인 타이틀 (2줄)
                  </label>
                  <Input
                    value={draft.hero.titleLine2}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        hero: { ...p.hero, titleLine2: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  서브 설명 문구
                </label>
                <Textarea
                  rows={3}
                  value={draft.hero.subtitle}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      hero: { ...p.hero, subtitle: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    좌측 흰색 버튼 문구
                  </label>
                  <Input
                    value={draft.hero.primaryBtnText}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        hero: { ...p.hero, primaryBtnText: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    좌측 버튼 이동 경로
                  </label>
                  <Input
                    value={draft.hero.primaryBtnHref}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        hero: { ...p.hero, primaryBtnHref: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    우측 오렌지 버튼 문구 (발주서)
                  </label>
                  <Input
                    value={draft.hero.orderBtnText}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        hero: { ...p.hero, orderBtnText: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    우측 오렌지 버튼 이동 경로
                  </label>
                  <Input
                    value={draft.hero.orderBtnHref}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        hero: { ...p.hero, orderBtnHref: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Company & Header/Footer Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-5 h-5 text-[#FF7B00]" />
            2. 회사 기본 정보 (상단바 · 푸터 · 문의하기 자동 연동)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImagePicker
              label="회사 로고 이미지"
              value={draft.company.logoUrl}
              onChange={(url) =>
                setDraft((p) => ({
                  ...p,
                  company: { ...p.company, logoUrl: url },
                }))
              }
              folder="banners"
              mediaList={mediaList}
              onUploaded={onMediaUploaded}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  상호명
                </label>
                <Input
                  value={draft.company.name}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      company: { ...p.company, name: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  대표 전화번호
                </label>
                <Input
                  value={draft.company.phone}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      company: { ...p.company, phone: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  대표 이메일
                </label>
                <Input
                  value={draft.company.email}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      company: { ...p.company, email: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                사업장 주소 (문의하기 · 푸터 표시)
              </label>
              <Input
                value={draft.company.address}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    company: { ...p.company, address: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                영업시간 안내
              </label>
              <Input
                value={draft.company.businessHours}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    company: { ...p.company, businessHours: e.target.value },
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              푸터 회사 소개 문구
            </label>
            <Textarea
              rows={2}
              value={draft.company.footerDesc}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  company: { ...p.company, footerDesc: e.target.value },
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Curated Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <LayoutGrid className="w-5 h-5 text-[#FF7B00]" />
            3. 홈 주요 카테고리 카드 ({draft.categories.length}개)
          </CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={addCategory}>
            <Plus className="w-4 h-4 mr-1" />
            카테고리 추가
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                섹션 제목
              </label>
              <Input
                value={draft.categoriesSectionTitle}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    categoriesSectionTitle: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                섹션 부제목
              </label>
              <Input
                value={draft.categoriesSectionSubtitle}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    categoriesSectionSubtitle: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {draft.categories.map((cat, idx) => (
              <div
                key={cat.id}
                className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">
                    카드 #{idx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => moveCategory(idx, -1)}
                      disabled={idx === 0}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => moveCategory(idx, 1)}
                      disabled={idx === draft.categories.length - 1}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-500 hover:text-red-700"
                      onClick={() => removeCategory(idx)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <ImagePicker
                  compact
                  value={cat.image}
                  onChange={(url) => updateCategory(idx, { image: url })}
                  folder="banners"
                  mediaList={mediaList}
                  onUploaded={onMediaUploaded}
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={cat.title}
                    onChange={(e) => updateCategory(idx, { title: e.target.value })}
                    placeholder="카테고리명"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={cat.desc}
                    onChange={(e) => updateCategory(idx, { desc: e.target.value })}
                    placeholder="부연 설명"
                    className="h-8 text-sm"
                  />
                </div>
                <Input
                  value={cat.href}
                  onChange={(e) => updateCategory(idx, { href: e.target.value })}
                  placeholder="이동 링크 (예: /parts-index)"
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4. Featured Products on Home */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="w-5 h-5 text-[#FF7B00]" />
            4. 홈 인기 제품 진열 ({draft.featuredProducts.length}개)
          </CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={addFeatured}>
            <Plus className="w-4 h-4 mr-1" />
            인기 제품 추가
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              인기 제품 섹션 제목
            </label>
            <Input
              value={draft.featuredSectionTitle}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  featuredSectionTitle: e.target.value,
                }))
              }
            />
          </div>

          <datalist id="admin-design-product-ids">
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nameKo} ({p.name})
              </option>
            ))}
          </datalist>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {draft.featuredProducts.map((fp, idx) => (
              <div
                key={fp.id}
                className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">
                    진열 #{idx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => moveFeatured(idx, -1)}
                      disabled={idx === 0}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => moveFeatured(idx, 1)}
                      disabled={idx === draft.featuredProducts.length - 1}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-500 hover:text-red-700"
                      onClick={() => removeFeatured(idx)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <ImagePicker
                  compact
                  value={fp.image}
                  onChange={(url) => updateFeatured(idx, { image: url })}
                  folder="products"
                  mediaList={mediaList}
                  onUploaded={onMediaUploaded}
                />

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-0.5">
                      연결 제품 ID
                    </label>
                    <Input
                      list="admin-design-product-ids"
                      value={fp.productId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        const matched = products.find((p) => p.id === pid);
                        updateFeatured(idx, {
                          productId: pid,
                          ...(matched && !fp.name
                            ? { name: matched.name }
                            : {}),
                        });
                      }}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-0.5">
                      표시 이름
                    </label>
                    <Input
                      value={fp.name}
                      onChange={(e) =>
                        updateFeatured(idx, { name: e.target.value })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-0.5">
                      카탈로그 p
                    </label>
                    <Input
                      value={fp.page}
                      onChange={(e) =>
                        updateFeatured(idx, { page: e.target.value })
                      }
                      placeholder="48 p"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
