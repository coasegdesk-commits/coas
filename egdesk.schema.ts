/**
 * egdesk.schema.ts — committed seed schema
 *
 * COMMIT THIS FILE TO GIT.
 *
 * When someone opens this project in their EGDesk, these tables are created
 * automatically in their dev database on first server start.
 *
 * Unlike egdesk.config.ts (auto-generated, gitignored), this file is the
 * portable source of truth for your app's database structure.
 *
 * Edit this file when you add/remove tables or columns. Do NOT edit
 * egdesk.config.ts — EGDesk regenerates it from the live database.
 */

export const TABLES = {
  coas_orders: {
    name: 'coas_orders',
    displayName: 'COAS 발주서 접수',
    columns: [
      'order_id',
      'order_number',
      'company_name',
      'contact_name',
      'phone',
      'email',
      'delivery_address',
      'desired_date',
      'item_count',
      'items_json',
      'memo',
      'status',
      'created_at',
    ],
    columnCount: 13,
    rowCount: 0,
  },
  coas_buyers: {
    name: 'coas_buyers',
    displayName: 'COAS 거래처 프로필',
    columns: [
      'buyer_key',
      'profile_id',
      'company_name',
      'contact_name',
      'phone',
      'email',
      'delivery_address',
      'shipping_method',
      'use_count',
      'updated_at',
    ],
    columnCount: 10,
    rowCount: 0,
  },
  coas_part_affinity: {
    name: 'coas_part_affinity',
    displayName: 'COAS 연관부품 학습',
    columns: [
      'pair_key',
      'anchor_id',
      'target_id',
      'door_type',
      'cart_count',
      'order_count',
      'pinned',
      'excluded',
      'updated_at',
    ],
    columnCount: 9,
    rowCount: 0,
  },
} as const;

export type TableName = keyof typeof TABLES;
export const TABLE_NAMES = Object.keys(TABLES) as TableName[];
