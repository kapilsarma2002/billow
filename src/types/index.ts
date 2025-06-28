export interface Invoice {
  id: string;
  date: string;
  client: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue';
  dueDate: string;
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