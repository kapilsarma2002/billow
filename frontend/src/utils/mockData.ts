// This file is now deprecated as we're using real API data
// Keeping it for backward compatibility with Reports page

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
    client_name: 'TechCorp Solutions',
    amount: 12500,
    currency_type: 'USD',
    status: 'paid',
    due_date: '2024-02-15'
  },
  {
    id: 'INV-002',
    invoice_date: '2024-01-18',
    client_name: 'Digital Dynamics',
    amount: 8750,
    currency_type: 'USD',
    status: 'paid',
    due_date: '2024-02-18'
  },
  {
    id: 'INV-003',
    invoice_date: '2024-01-22',
    client_name: 'Innovation Labs',
    amount: 15200,
    currency_type: 'USD',
    status: 'unpaid',
    due_date: '2024-02-22'
  },
  {
    id: 'INV-004',
    invoice_date: '2024-01-25',
    client_name: 'Creative Studios',
    amount: 9800,
    currency_type: 'USD',
    status: 'overdue',
    due_date: '2024-02-10'
  },
  {
    id: 'INV-005',
    invoice_date: '2024-01-28',
    client_name: 'Growth Partners',
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
    total_invoiced: 124500,
    total_paid: 112000,
    invoice_count: 8,
    average_invoice: 15562,
    payment_delay: 12,
    avatar: 'https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-symbol-image-default-avatar-profile-icon-vector-social-media-user-symbol-209498286.jpg'
  },
  {
    id: '2',
    name: 'Digital Dynamics',
    email: 'hello@digitaldynamics.io',
    total_invoiced: 98700,
    total_paid: 98700,
    invoice_count: 6,
    average_invoice: 16450,
    payment_delay: 8,
    avatar: 'https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-symbol-image-default-avatar-profile-icon-vector-social-media-user-symbol-209498286.jpg'
  },
  {
    id: '3',
    name: 'Innovation Labs',
    email: 'team@innovationlabs.com',
    total_invoiced: 87200,
    total_paid: 72000,
    invoice_count: 5,
    average_invoice: 17440,
    payment_delay: 15,
    avatar: 'https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-symbol-image-default-avatar-profile-icon-vector-social-media-user-symbol-209498286.jpg'
  },
  {
    id: '4',
    name: 'Creative Studios',
    email: 'info@creativestudios.design',
    total_invoiced: 76800,
    total_paid: 67000,
    invoice_count: 7,
    average_invoice: 10971,
    payment_delay: 18,
    avatar: 'https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-symbol-image-default-avatar-profile-icon-vector-social-media-user-symbol-209498286.jpg'
  },
  {
    id: '5',
    name: 'Growth Partners',
    email: 'contact@growthpartners.co',
    total_invoiced: 65400,
    total_paid: 65400,
    invoice_count: 4,
    average_invoice: 16350,
    payment_delay: 5,
    avatar: 'https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-symbol-image-default-avatar-profile-icon-vector-social-media-user-symbol-209498286.jpg'
  }
];