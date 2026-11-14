import { useQuery } from "@tanstack/react-query";
import {
  defaultDesign,
  defaultNewProducts,
  defaultPartsSections,
  defaultSidebarFilters,
} from "@shared/cms-defaults";
import type { CmsBootstrapPayload, MediaItem } from "@shared/cms-types";

export const CMS_BOOTSTRAP_KEY = ["/api/cms/bootstrap"] as const;
const ADMIN_TOKEN_KEY = "coas_admin_token";

export const fallbackBootstrap: CmsBootstrapPayload = {
  design: defaultDesign,
  newProducts: defaultNewProducts,
  partsSections: defaultPartsSections,
  sidebarFilters: defaultSidebarFilters,
};

export function useCmsBootstrap() {
  const query = useQuery<CmsBootstrapPayload>({
    queryKey: CMS_BOOTSTRAP_KEY,
    queryFn: async () => {
      const res = await fetch("/api/cms/bootstrap");
      if (!res.ok) throw new Error("Failed to load CMS configuration");
      return res.json();
    },
    placeholderData: fallbackBootstrap,
    staleTime: 1000 * 30,
  });

  return {
    ...query,
    cms: query.data || fallbackBootstrap,
  };
}

export function resolveAssetUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  return encodeURI(url);
}

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // ignore storage errors
  }
}

export function clearAdminToken(): void {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

export async function adminFetch<T = any>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAdminToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (
    options.body &&
    typeof options.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearAdminToken();
    throw new Error("UNAUTHORIZED");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || "요청 처리 중 오류가 발생했습니다.");
  }
  return data as T;
}

export async function uploadAdminFile(
  file: File,
  folder: "products" | "banners" | "catalogs" | "general" = "products",
): Promise<{ media: MediaItem; url: string }> {
  const token = getAdminToken();
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/octet-stream",
      "X-File-Name": encodeURIComponent(file.name),
      "X-Upload-Folder": folder,
      "X-Mime-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (res.status === 401) {
    clearAdminToken();
    throw new Error("UNAUTHORIZED");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "파일 업로드에 실패했습니다.");
  }
  return data;
}

export async function uploadOrderAttachment(
  file: File,
): Promise<{ name: string; url: string; size: number }> {
  const res = await fetch("/api/upload/order-attachment", {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "X-File-Name": encodeURIComponent(file.name),
      "X-Mime-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "첨부파일 업로드에 실패했습니다.");
  }
  return data;
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
): void {
  const escapeCell = (val: string | number | null | undefined) => {
    const str = String(val ?? "");
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvLines = [
    headers.map(escapeCell).join(","),
    ...rows.map((r) => r.map(escapeCell).join(",")),
  ];
  // UTF-8 BOM for Excel Korean compatibility
  const blob = new Blob(["\uFEFF" + csvLines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
