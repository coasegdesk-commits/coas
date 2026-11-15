import fs from "fs";
import path from "path";
import type {
  B2BCompanyProfile,
  B2BStaffContact,
  B2BAuthLog,
} from "../shared/cms-types";
import { DATA_DIR } from "./cms-store";
import {
  ensureCoasTables,
  callEgdeskUserDataTool,
} from "./egdesk-sync";

const B2B_FILE = path.join(DATA_DIR, "b2b-store.json");

const SEED_COMPANIES: B2BCompanyProfile[] = [
  {
    id: "comp_coas",
    companyName: "(주)코아스인테리어",
    bizNumber: "123-45-67890",
    deliveryAddress: "경기도 화성시 동탄첨단산업1로 27, A동 302호",
    shippingMethod: "화물",
    memo: "주요 거래처 / 수도권 현장 직송 자주 발주",
    staffContacts: [
      {
        id: "staff_coas_1",
        name: "김담당 실장",
        phone: "010-1234-5678",
        role: "구매발주 총괄",
        isPrimary: true,
        createdAt: "2026-11-01T09:00:00.000Z",
      },
      {
        id: "staff_coas_2",
        name: "박과장",
        phone: "010-2222-3333",
        role: "시공 1팀장",
        isPrimary: false,
        createdAt: "2026-11-05T14:20:00.000Z",
      },
      {
        id: "staff_coas_3",
        name: "이소장",
        phone: "010-4444-5555",
        role: "동탄 현장소장",
        isPrimary: false,
        createdAt: "2026-11-10T11:15:00.000Z",
      },
    ],
    useCount: 14,
    updatedAt: "2026-11-15T10:00:00.000Z",
  },
  {
    id: "comp_hanssem",
    companyName: "한샘인테리어 디자인",
    bizNumber: "214-88-12345",
    deliveryAddress: "서울시 강남구 테헤란로 152 한샘빌딩 5층 자재부",
    shippingMethod: "화물",
    memo: "강남/서초 쇼룸 및 인테리어 시공 전문",
    staffContacts: [
      {
        id: "staff_hanssem_1",
        name: "박과장",
        phone: "010-9876-5432",
        role: "자재구매팀",
        isPrimary: true,
        createdAt: "2026-11-02T10:30:00.000Z",
      },
      {
        id: "staff_hanssem_2",
        name: "정주임",
        phone: "010-3333-8888",
        role: "현장발주 담당",
        isPrimary: false,
        createdAt: "2026-11-08T16:45:00.000Z",
      },
    ],
    useCount: 8,
    updatedAt: "2026-11-15T09:30:00.000Z",
  },
  {
    id: "comp_younglim",
    companyName: "영림도어 하드웨어",
    bizNumber: "110-81-99887",
    deliveryAddress: "인천광역시 서구 원창동 382-1 물류센터",
    shippingMethod: "택배",
    memo: "도어 제작 공방 및 철물 부속 납품",
    staffContacts: [
      {
        id: "staff_younglim_1",
        name: "이소장",
        phone: "010-5555-7777",
        role: "영업/자재부",
        isPrimary: true,
        createdAt: "2026-11-03T08:15:00.000Z",
      },
      {
        id: "staff_younglim_2",
        name: "최대리",
        phone: "010-7777-9999",
        role: "출하검수",
        isPrimary: false,
        createdAt: "2026-11-12T13:00:00.000Z",
      },
    ],
    useCount: 5,
    updatedAt: "2026-11-14T17:00:00.000Z",
  },
];

const SEED_AUTH_LOGS: B2BAuthLog[] = [
  {
    id: "auth_log_1",
    companyName: "(주)코아스인테리어",
    contactName: "김담당 실장",
    phone: "010-1234-5678",
    loginMethod: "social_kakao",
    status: "success",
    loggedAt: "2026-11-15T17:35:10.000Z",
  },
  {
    id: "auth_log_2",
    companyName: "(주)코아스인테리어",
    contactName: "이소장",
    phone: "010-4444-5555",
    loginMethod: "biz_phone",
    status: "success",
    loggedAt: "2026-11-15T16:42:25.000Z",
  },
  {
    id: "auth_log_3",
    companyName: "한샘인테리어 디자인",
    contactName: "박과장",
    phone: "010-9876-5432",
    loginMethod: "biz_phone",
    status: "success",
    loggedAt: "2026-11-15T15:10:00.000Z",
  },
  {
    id: "auth_log_4",
    companyName: "영림도어 하드웨어",
    contactName: "이소장",
    phone: "010-5555-7777",
    loginMethod: "biz_phone",
    status: "success",
    loggedAt: "2026-11-15T11:20:45.000Z",
  },
  {
    id: "auth_log_5",
    companyName: "(주)코아스인테리어",
    contactName: "박과장",
    phone: "010-2222-3333",
    loginMethod: "biz_phone",
    status: "success",
    loggedAt: "2026-11-14T18:05:12.000Z",
  },
];

interface B2BStoreState {
  companies: B2BCompanyProfile[];
  authLogs: B2BAuthLog[];
  lastSyncedAt?: string;
}

class B2BStore {
  private state: B2BStoreState = {
    companies: structuredClone(SEED_COMPANIES),
    authLogs: structuredClone(SEED_AUTH_LOGS),
  };

  private loaded = false;

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    if (this.loaded) return;
    try {
      if (fs.existsSync(B2B_FILE)) {
        const raw = fs.readFileSync(B2B_FILE, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.companies)) {
          this.state = parsed;
        }
      } else {
        this.saveToDisk();
      }
    } catch {
      this.state = {
        companies: structuredClone(SEED_COMPANIES),
        authLogs: structuredClone(SEED_AUTH_LOGS),
      };
    }
    this.loaded = true;
  }

  private saveToDisk(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(B2B_FILE, JSON.stringify(this.state, null, 2), "utf8");
    } catch {}
  }

  // --- Companies & Staff Phone Directory ---

  public listCompanies(): B2BCompanyProfile[] {
    this.loadFromDisk();
    return this.state.companies;
  }

  public findCompanyByPhone(phone: string): {
    company: B2BCompanyProfile;
    staff: B2BStaffContact;
  } | null {
    this.loadFromDisk();
    const clean = phone.replace(/[^0-9]/g, "");
    if (!clean) return null;

    for (const comp of this.state.companies) {
      for (const staff of comp.staffContacts) {
        const staffClean = staff.phone.replace(/[^0-9]/g, "");
        if (staffClean === clean) {
          return { company: comp, staff };
        }
      }
    }
    return null;
  }

  public upsertCompany(input: Partial<B2BCompanyProfile> & { companyName: string }): B2BCompanyProfile {
    this.loadFromDisk();
    const id = input.id || `comp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const existingIndex = this.state.companies.findIndex((c) => c.id === id);

    const now = new Date().toISOString();
    const updated: B2BCompanyProfile = {
      id,
      companyName: input.companyName.trim(),
      bizNumber: input.bizNumber?.trim() || "123-45-67890",
      deliveryAddress: input.deliveryAddress?.trim() || "",
      shippingMethod: input.shippingMethod || "화물",
      memo: input.memo?.trim() || "",
      staffContacts: Array.isArray(input.staffContacts) ? input.staffContacts : [],
      useCount: input.useCount ?? 1,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      this.state.companies[existingIndex] = updated;
    } else {
      this.state.companies.unshift(updated);
    }
    this.saveToDisk();

    // Async sync with EGDesk My DB
    void this.syncCompanyToEgdesk(updated);

    return updated;
  }

  public deleteCompany(id: string): boolean {
    this.loadFromDisk();
    const initialLen = this.state.companies.length;
    this.state.companies = this.state.companies.filter((c) => c.id !== id);
    const deleted = this.state.companies.length < initialLen;
    if (deleted) {
      this.saveToDisk();
    }
    return deleted;
  }

  public addStaffPhone(
    companyId: string,
    staffInput: { name: string; phone: string; role?: string; isPrimary?: boolean },
  ): B2BCompanyProfile | null {
    this.loadFromDisk();
    const comp = this.state.companies.find((c) => c.id === companyId);
    if (!comp) return null;

    const cleanPhone = staffInput.phone.replace(/[^0-9]/g, "");
    const formattedPhone =
      cleanPhone.length === 11
        ? `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 7)}-${cleanPhone.slice(7)}`
        : cleanPhone.length === 10
          ? `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`
          : staffInput.phone;

    const newStaff: B2BStaffContact = {
      id: `staff_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: staffInput.name.trim() || "담당자",
      phone: formattedPhone,
      role: staffInput.role?.trim() || "담당자",
      isPrimary: !!staffInput.isPrimary,
      createdAt: new Date().toISOString(),
    };

    if (newStaff.isPrimary) {
      comp.staffContacts.forEach((s) => (s.isPrimary = false));
    }

    comp.staffContacts.push(newStaff);
    comp.updatedAt = new Date().toISOString();
    this.saveToDisk();

    void this.syncCompanyToEgdesk(comp);
    return comp;
  }

  public removeStaffPhone(companyId: string, phoneId: string): B2BCompanyProfile | null {
    this.loadFromDisk();
    const comp = this.state.companies.find((c) => c.id === companyId);
    if (!comp) return null;

    comp.staffContacts = comp.staffContacts.filter((s) => s.id !== phoneId);
    comp.updatedAt = new Date().toISOString();
    this.saveToDisk();

    void this.syncCompanyToEgdesk(comp);
    return comp;
  }

  // --- Authentication Logs (Audit Trail) ---

  public recordAuthLog(input: {
    companyName: string;
    contactName: string;
    phone: string;
    loginMethod: string;
    status?: "success" | "fail";
  }): B2BAuthLog {
    this.loadFromDisk();
    const log: B2BAuthLog = {
      id: `auth_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      companyName: input.companyName.trim(),
      contactName: input.contactName.trim() || "담당자",
      phone: input.phone.trim(),
      loginMethod: input.loginMethod,
      status: input.status || "success",
      loggedAt: new Date().toISOString(),
    };

    this.state.authLogs.unshift(log);
    // Keep last 500 logs locally
    if (this.state.authLogs.length > 500) {
      this.state.authLogs = this.state.authLogs.slice(0, 500);
    }
    this.saveToDisk();

    // Async sync with EGDesk My DB
    void this.syncAuthLogToEgdesk(log);

    return log;
  }

  public listAuthLogs(limit = 100): B2BAuthLog[] {
    this.loadFromDisk();
    return this.state.authLogs.slice(0, limit);
  }

  // --- EGDesk My DB Sync Engine ---

  private async syncCompanyToEgdesk(comp: B2BCompanyProfile): Promise<void> {
    try {
      const ready = await ensureCoasTables();
      if (!ready) return;

      const primaryStaff =
        comp.staffContacts.find((s) => s.isPrimary) || comp.staffContacts[0];

      await callEgdeskUserDataTool("user_data_insert_rows", {
        tableName: "coas_buyers",
        rows: [
          {
            buyer_key: `${comp.companyName.toLowerCase().trim()}::${comp.bizNumber.replace(/[^0-9]/g, "")}`,
            profile_id: comp.id,
            company_name: comp.companyName,
            contact_name: primaryStaff?.name || "",
            phone: primaryStaff?.phone || "",
            email: "",
            delivery_address: comp.deliveryAddress,
            shipping_method: comp.shippingMethod,
            use_count: comp.useCount ?? 1,
            updated_at: comp.updatedAt,
          },
        ],
      });
    } catch {}
  }

  private async syncAuthLogToEgdesk(log: B2BAuthLog): Promise<void> {
    try {
      const ready = await ensureCoasTables();
      if (!ready) return;

      await callEgdeskUserDataTool("user_data_insert_rows", {
        tableName: "coas_auth_logs",
        rows: [
          {
            log_id: log.id,
            company_name: log.companyName,
            contact_name: log.contactName,
            phone: log.phone,
            login_method: log.loginMethod,
            status: log.status,
            logged_at: log.loggedAt,
          },
        ],
      });
    } catch {}
  }

  public async syncAllToEgdesk(): Promise<{ synced: boolean; companiesCount: number; logsCount: number }> {
    this.loadFromDisk();
    try {
      const ready = await ensureCoasTables();
      if (!ready) {
        return {
          synced: false,
          companiesCount: this.state.companies.length,
          logsCount: this.state.authLogs.length,
        };
      }

      for (const comp of this.state.companies) {
        await this.syncCompanyToEgdesk(comp);
      }

      for (const log of this.state.authLogs.slice(0, 50)) {
        await this.syncAuthLogToEgdesk(log);
      }

      this.state.lastSyncedAt = new Date().toISOString();
      this.saveToDisk();

      return {
        synced: true,
        companiesCount: this.state.companies.length,
        logsCount: this.state.authLogs.length,
      };
    } catch {
      return {
        synced: false,
        companiesCount: this.state.companies.length,
        logsCount: this.state.authLogs.length,
      };
    }
  }
}

export const b2bStore = new B2BStore();
