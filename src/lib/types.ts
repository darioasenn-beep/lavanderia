export type BagStatus = "Available" | "Assigned" | "In-Laundry";
export type OrderStatus = "Pending" | "Processing" | "Ready" | "Delivered";
export type ServiceType = "Regular" | "Delicado";
export type ProfileType = "RESIDENT" | "CORPORATE" | "WALK_IN";
export type PaymentStatus = "Pending" | "Paid";
export type PaymentMethod = "MercadoPago" | "Cash" | "Transfer" | "Other";
export type AfipStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  room_number: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
}

export interface ClientProfile {
  id: string;
  user_id: string;
  profile_type: ProfileType;
  corporate_id: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export interface CorporateDetails {
  id: string;
  name: string;
  cuit: string;
  business_name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Bag {
  qr_id: string;
  user_id: string | null;
  status: BagStatus;
  created_at: string;
}

export interface Order {
  order_id: string;
  user_id: string;
  qr_id: string;
  item_count: number;
  service_type: ServiceType;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  billing_data: Record<string, unknown> | null;
  profile_type: ProfileType;
  corporate_id: string | null;
  mp_preference_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderWithUser extends Order {
  users: Pick<User, "room_number" | "last_name">;
  client_profiles?: { phone: string | null } | null;
  corporate_details?: Pick<CorporateDetails, "name" | "cuit"> | null;
}

export interface BagWithUser extends Bag {
  users: Pick<User, "room_number" | "last_name"> | null;
}

export interface Remito {
  id: string;
  order_id: string;
  remito_number: string;
  pdf_url: string | null;
  validation_qr: string | null;
  afip_cae: string | null;
  afip_status: AfipStatus;
  created_at: string;
}

export interface Promotion {
  id: string;
  user_id: string;
  total_orders: number;
  free_orders_earned: number;
  free_orders_used: number;
  updated_at: string;
}

// ── B2B Corporate Remitos Module ──

export interface Company {
  id: string;
  name: string;
  razon_social: string;
  cuit: string;
  address: string;
  created_at: string;
}

export interface PriceListItem {
  id: string;
  company_id: string;
  item_description: string;
  unit_price: number;
  created_at: string;
}

export interface RemitoItem {
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CorporateRemito {
  id: string;
  company_id: string;
  remito_number: number;
  items: RemitoItem[];
  total_amount: number;
  status: "Pending" | "Delivered";
  billed_at: string | null;
  billing_entity: "ACME" | "ESTEVE" | null;
  created_at: string;
}

export function formatRemitoNumber(n: number): string {
  return `0001-${(20000 + n - 1).toString().padStart(8, "0")}`;
}
