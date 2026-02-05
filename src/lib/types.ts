export type UnitStatus = "active" | "available" | "reserved" | "sold";
export type SaleStatus = "pending" | "confirmed" | "cancelled";
export type PaymentType = "reservation" | "down_payment" | "installment" | "final";

export type Project = {
  id: string;
  name: string;
  created_at: string;
};

export type Unit = {
  id: string;
  project_id: string;
  label: string | null;
  unit_number?: string | null;
  status: UnitStatus;
  price: number;
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
  sales_rep_id: string | null;
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
  payment_id?: string | null;
  amount: number;
  recipient_id?: string | null;
  paid?: boolean;
  created_at: string;
};

export type CommissionRate = {
  id: string;
  recipient_id: string | null;
  recipient_type: string;
  rate: number;
  active: boolean;
  created_at: string;
};

export type CommissionPhase = {
  id: string;
  name: string;
  percentage: number;
  trigger: string;
  active: boolean;
  created_at: string;
};
