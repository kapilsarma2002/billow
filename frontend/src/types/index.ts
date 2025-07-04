export interface Invoice {
  id: string;
  client_id?: string;
  client?: Client;
  client_name?: string; // For backward compatibility and display
  invoice_date: string;
  amount: number;
  currency_type: string;
  status: 'paid' | 'unpaid' | 'overdue' | 'processing';
  due_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  total_invoiced: number;
  total_paid: number;
  invoice_count: number;
  average_invoice: number;
  payment_delay: number;
  avatar: string;
  created_at?: string;
  updated_at?: string;
  invoices?: Invoice[];
}

export interface KPIData {
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  clientCount: number;
}

export interface ChartData {
  month: string;
  revenue: number;
}

export interface ClientRevenueData {
  client_id: string;
  months: number;
  revenue_data: number[];
}