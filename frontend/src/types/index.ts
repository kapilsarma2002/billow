export interface Invoice {
  id: string;
  client: string;
  invoice_date: string;
  amount: number;
  currency_type: string;
  status: 'paid' | 'unpaid' | 'overdue';
  due_date: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  totalInvoiced: number;
  totalPaid: number;
  invoiceCount: number;
  averageInvoice: number;
  paymentDelay: number;
  avatar: string;
  revenueData: number[];
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