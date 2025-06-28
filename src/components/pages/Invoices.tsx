import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { apiService } from '../../services/api';
import { Invoice, CreateInvoiceRequest } from '../../types';
import { Search, Filter, Upload, Download, Plus, Loader2, AlertCircle } from 'lucide-react';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state for creating new invoice
  const [newInvoice, setNewInvoice] = useState<CreateInvoiceRequest>({
    client: '',
    invoice_date: '',
    amount: 0,
    currency_type: 'INR',
    status: 'unpaid'
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getInvoices();
      setInvoices(data);
    } catch (err) {
      setError('Failed to fetch invoices. Please check if the backend server is running.');
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newInvoice.client || !newInvoice.amount) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsCreating(true);
      const createdInvoice = await apiService.createInvoice(newInvoice);
      setInvoices(prev => [createdInvoice, ...prev]);
      setIsCreateModalOpen(false);
      setNewInvoice({
        client: '',
        invoice_date: '',
        amount: 0,
        currency_type: 'INR',
        status: 'unpaid'
      });
    } catch (err) {
      alert('Failed to create invoice. Please try again.');
      console.error('Error creating invoice:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toString().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    if (currency === 'INR' || !currency) {
      return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: 'INR', 
        maximumFractionDigits: 0 
      }).format(amount);
    }
    return `${currency} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600 dark:text-gray-400">Loading invoices...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="p-8 max-w-md mx-auto text-center" variant="glass">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Connection Error
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={fetchInvoices} variant="gradient">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Invoices</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and track all your invoices ({invoices.length} total)
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary">
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
          </Button>
          <Button variant="gradient" onClick={() => setIsCreateModalOpen(true)}>
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
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      {searchTerm || statusFilter !== 'all' ? 'No invoices match your filters' : 'No invoices found'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr 
                    key={invoice.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all duration-200 group"
                  >
                    <td className="py-4 px-6">
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        INV-{invoice.id.toString().padStart(3, '0')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-700 dark:text-gray-300">
                        {formatDate(invoice.invoice_date)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {invoice.client.charAt(0).toUpperCase()}
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
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-all duration-200"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Invoice"
        size="md"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Client Name *
            </label>
            <input
              type="text"
              required
              value={newInvoice.client}
              onChange={(e) => setNewInvoice(prev => ({ ...prev, client: e.target.value }))}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter client name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Invoice Date
            </label>
            <input
              type="date"
              value={newInvoice.invoice_date}
              onChange={(e) => setNewInvoice(prev => ({ ...prev, invoice_date: e.target.value }))}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={newInvoice.amount || ''}
                onChange={(e) => setNewInvoice(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                value={newInvoice.currency_type}
                onChange={(e) => setNewInvoice(prev => ({ ...prev, currency_type: e.target.value }))}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={newInvoice.status}
              onChange={(e) => setNewInvoice(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="gradient"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Invoice'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};