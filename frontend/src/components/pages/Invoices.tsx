import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Invoice } from '../../types/index'
import axios from 'axios';
import { Search, Filter, Upload, Download, Plus } from 'lucide-react';

export const Invoices: React.FC = () => {

  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {

    const getInvoices = () => {
      axios.get('http://localhost:8080/api/invoices')
      .then(res => {
        console.log('res is: ', res)
        setInvoices(res.data);
      })
    }

    getInvoices();
  }, []);


  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number, currency_type: string) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: `${currency_type}`, maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'paid':
        return `${baseClasses} bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400`;
      case 'unpaid':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`;
      case 'overdue':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400`;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Invoices</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and track all your invoices</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary">
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
          </Button>
          <Button variant="gradient">
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6" variant="glass">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex items-center space-x-4">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card className="overflow-hidden" variant="glass">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Invoice ID</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Client</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Due Date</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice, index) => (
                <tr 
                  key={invoice.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all duration-200 group"
                >
                  <td className="py-4 px-6">
                    <span className="font-medium text-blue-600 dark:text-blue-400">{invoice.id}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-700 dark:text-gray-300">{formatDate(invoice.invoice_date)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {invoice.client.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{invoice.client}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(invoice.amount, invoice.currency_type)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={getStatusBadge(invoice.status)}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-600 dark:text-gray-400">{formatDate(invoice.due_date)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};