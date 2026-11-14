/**
 * EGDesk User Data Configuration
 * Generated at: 2026-11-14T20:27:58.477Z
 *
 * This file contains type-safe definitions for your EGDesk tables.
 */

export const EGDESK_CONFIG = {
  apiUrl: 'http://localhost:8080',
  tunnelUrl: 'https://tunneling-service.onrender.com/t/lee-mac-pc-tg6t51',
  apiKey: 'c937e623-cb40-4ef1-b24e-f672d3ca1da4',
} as const;

export interface TableDefinition {
  name: string;
  displayName: string;
  description?: string;
  /** Omitted or unknown until synced / counted */
  rowCount?: number;
  columnCount: number;
  columns: string[];
}

export const TABLES = {
  table1: {
    name: 'coas_part_affinity',
    displayName: 'COAS 연관부품 학습',
    description: 'COAS 발주서 롤러-부속품 누적 학습 가중치 테이블',
    rowCount: 0,
    columnCount: 11,
    columns: ['id', '_version', 'pair_key', 'anchor_id', 'target_id', 'door_type', 'cart_count', 'order_count', 'pinned', 'excluded', 'updated_at']
  } as TableDefinition,
  table2: {
    name: 'coas_buyers',
    displayName: 'COAS 거래처 프로필',
    description: 'COAS 발주처(내 거래처) 저장 프로필 목록',
    rowCount: 1,
    columnCount: 12,
    columns: ['id', '_version', 'buyer_key', 'profile_id', 'company_name', 'contact_name', 'phone', 'email', 'delivery_address', 'shipping_method', 'use_count', 'updated_at']
  } as TableDefinition,
  table3: {
    name: 'coas_orders',
    displayName: 'COAS 발주서 접수',
    description: 'COAS 온라인 발주서 접수 내역',
    rowCount: 0,
    columnCount: 15,
    columns: ['id', '_version', 'order_id', 'order_number', 'company_name', 'contact_name', 'phone', 'email', 'delivery_address', 'desired_date', 'item_count', 'items_json', 'memo', 'status', 'created_at']
  } as TableDefinition,
  table4: {
    name: 'example_table',
    displayName: 'Example Table',
    rowCount: 0,
    columnCount: 4,
    columns: ['id', '_version', 'name', 'created_at']
  } as TableDefinition
} as const;


// Main table (first table by default)
export const MAIN_TABLE = TABLES.table1;


// Helper to get table by name
export function getTableByName(tableName: string): TableDefinition | undefined {
  return Object.values(TABLES).find(t => t.name === tableName);
}

// Export table names for easy access
export const TABLE_NAMES = {
  table1: 'coas_part_affinity',
  table2: 'coas_buyers',
  table3: 'coas_orders',
  table4: 'example_table'
} as const;
