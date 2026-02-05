export type UnitStatus = "available" | "reserved" | "sold" | "cancelled";
export type SaleStatus = "active" | "cancelled" | "completed";
export type PaymentType = "reservation" | "down_payment" | "financed_payment";

export type Project = {
  id: string;
  name: string;
  created_at: string;
};

export type Unit = {
  id: string;
  project_id: string;
  unit_number: string;
  price_with_tax: number;
  price_without_tax: number;
  down_payment_amount: number;
  status: UnitStatus;
  created_at: string;
};

export type Client = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
};

export type Sale = {
  id: string;
  project_id: string;
  unit_id: string;
  client_id: string;
  sales_rep_id: string;
  status: SaleStatus;
  sale_date: string;
  price_with_tax: number;
  price_without_tax: number;
  down_payment_amount: number;
  financed_amount: number;
  referral_name: string | null;
  referral_applies: boolean;
  promise_signed_date: string | null;
  deed_signed_date: string | null;
  created_at: string;
};

export type Payment = {
  id: string;
  sale_id: string;
  payment_date: string;
  amount: number;
  payment_type: PaymentType;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
};

export type Commission = {
  id: string;
  sale_id: string;
  payment_id: string;
  recipient_id: string;
  recipient_name: string;
  phase: number;
  rate: number;
  base_amount: number;
  commission_amount: number;
  paid: boolean;
  paid_date: string | null;
  created_at: string;
};

export type CommissionRate = {
  id: string;
  recipient_id: string;
  recipient_name: string;
  rate: number;
  recipient_type: string;
  description: string;
  always_paid: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CommissionPhase = {
  phase: number;
  name: string;
  percentage: number;
  description: string;
};
