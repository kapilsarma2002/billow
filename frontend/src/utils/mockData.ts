import { Invoice, Client, KPIData, ChartData } from '../types';

export const kpiData: KPIData = {
  totalInvoiced: 487250,
  totalPaid: 423180,
  outstanding: 64070,
  clientCount: 24
};

export const revenueData: ChartData[] = [
  { month: 'Jan', revenue: 42000 },
  { month: 'Feb', revenue: 38500 },
  { month: 'Mar', revenue: 45200 },
  { month: 'Apr', revenue: 41800 },
  { month: 'May', revenue: 49300 },
  { month: 'Jun', revenue: 52100 },
  { month: 'Jul', revenue: 48700 },
  { month: 'Aug', revenue: 54200 },
  { month: 'Sep', revenue: 51800 },
  { month: 'Oct', revenue: 58900 },
  { month: 'Nov', revenue: 62100 },
  { month: 'Dec', revenue: 67300 }
];

export const topClientsData = [
  { name: 'TechCorp Solutions', revenue: 124500 },
  { name: 'Digital Dynamics', revenue: 98700 },
  { name: 'Innovation Labs', revenue: 87200 },
  { name: 'Creative Studios', revenue: 76800 },
  { name: 'Growth Partners', revenue: 65400 }
];

export const invoices: Invoice[] = [
  {
    id: 'INV-001',
    invoice_date: '2024-01-15',
    client: 'TechCorp Solutions',
    amount: 12500,
    currency_type: 'USD',
    status: 'paid',
    due_date: '2024-02-15'
  },
  {
    id: 'INV-002',
    invoice_date: '2024-01-18',
    client: 'Digital Dynamics',
    amount: 8750,
    currency_type: 'USD',
    status: 'paid',
    due_date: '2024-02-18'
  },
  {
    id: 'INV-003',
    invoice_date: '2024-01-22',
    client: 'Innovation Labs',
    amount: 15200,
    currency_type: 'USD',
    status: 'unpaid',
    due_date: '2024-02-22'
  },
  {
    id: 'INV-004',
    invoice_date: '2024-01-25',
    client: 'Creative Studios',
    amount: 9800,
    currency_type: 'USD',
    status: 'overdue',
    due_date: '2024-02-10'
  },
  {
    id: 'INV-005',
    invoice_date: '2024-01-28',
    client: 'Growth Partners',
    amount: 11400,
    currency_type: 'USD',
    status: 'paid',
    due_date: '2024-02-28'
  }
];

export const clients: Client[] = [
  {
    id: '1',
    name: 'TechCorp Solutions',
    email: 'contact@techcorp.com',
    totalInvoiced: 124500,
    totalPaid: 112000,
    invoiceCount: 8,
    averageInvoice: 15562,
    paymentDelay: 12,
    avatar: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    revenueData: [12000, 15000, 18000, 22000, 19000, 25000, 13500]
  },
  {
    id: '2',
    name: 'Digital Dynamics',
    email: 'hello@digitaldynamics.io',
    totalInvoiced: 98700,
    totalPaid: 98700,
    invoiceCount: 6,
    averageInvoice: 16450,
    paymentDelay: 8,
    avatar: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    revenueData: [8000, 12000, 16000, 18000, 22000, 15700, 7000]
  },
  {
    id: '3',
    name: 'Innovation Labs',
    email: 'team@innovationlabs.com',
    totalInvoiced: 87200,
    totalPaid: 72000,
    invoiceCount: 5,
    averageInvoice: 17440,
    paymentDelay: 15,
    avatar: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    revenueData: [10000, 14000, 18000, 20000, 15200, 10000, 0]
  },
  {
    id: '4',
    name: 'Creative Studios',
    email: 'info@creativestudios.design',
    totalInvoiced: 76800,
    totalPaid: 67000,
    invoiceCount: 7,
    averageInvoice: 10971,
    paymentDelay: 18,
    avatar: 'https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    revenueData: [9000, 11000, 13000, 15000, 12800, 8000, 8000]
  },
  {
    id: '5',
    name: 'Growth Partners',
    email: 'contact@growthpartners.co',
    totalInvoiced: 65400,
    totalPaid: 65400,
    invoiceCount: 4,
    averageInvoice: 16350,
    paymentDelay: 5,
    avatar: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    revenueData: [15000, 18000, 16400, 16000, 0, 0, 0]
  }
];