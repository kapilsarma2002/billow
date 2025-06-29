import React, { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Invoice, Client } from '../../types/index'
import axios from 'axios';
import { Search, Filter, Upload, Download, Plus, Calendar, DollarSign, User, FileText, X, SlidersHorizontal, ChevronDown } from 'lucide-react';

interface NewInvoice {
  client_id: string; // Changed to use client ID instead of name
  invoice_date: string;
  amount: number;
  currency_type: string;
  status: 'paid' | 'unpaid' | 'overdue' | 'processing';
  due_date: string;
}

interface SearchFilters {
  searchTerm: string;
  status: 'all' | 'paid' | 'unpaid' | 'overdue' | 'processing';
  currency: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

export const Invoices: React.FC = () => {
  const { user: clerkUser } = useUser();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [newInvoice, setNewInvoice] = useState<NewInvoice>({
    client_id: '',
    invoice_date: '',
    amount: 0,
    currency_type: 'USD',
    status: 'unpaid',
    due_date: ''
  });

  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    status: 'all',
    currency: 'all',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: ''
  });

  // Configure axios to use Clerk ID
  const getAuthHeaders = () => {
    return {
      'X-Clerk-ID': clerkUser?.id || '',
      'Content-Type': 'application/json'
    };
  };

  // Fetch invoices and clients
  const fetchInvoices = async () => {
    try {
      const response = await axios.get('/api/invoices', {
        headers: getAuthHeaders()
      });
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/clients', {
        headers: getAuthHeaders()
      });
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    if (clerkUser?.id) {
      fetchInvoices();
      fetchClients();
    }
  }, [clerkUser?.id]);

  // Enhanced filtering logic
  const filteredInvoices = invoices.filter(invoice => {
    // Text search - searches in client name and invoice ID
    const clientName = typeof invoice.client_name === 'string' ? invoice.client_name : 
                      typeof invoice.client === 'string' ? invoice.client :
                      typeof invoice.client === 'object' && invoice.client ? invoice.client.name : '';
    const matchesSearch = filters.searchTerm === '' || 
      clientName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      invoice.id.toString().toLowerCase().includes(filters.searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = filters.status === 'all' || invoice.status === filters.status;

    // Currency filter
    const matchesCurrency = filters.currency === 'all' || 
      invoice.currency_type === filters.currency ||
      (!invoice.currency_type && filters.currency === 'USD'); // Default to USD if no currency

    // Date range filter (invoice date)
    const matchesDateRange = (() => {
      if (!filters.dateFrom && !filters.dateTo) return true;
      if (!invoice.invoice_date) return false;
      
      const invoiceDate = new Date(invoice.invoice_date);
      const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

      if (fromDate && toDate) {
        return invoiceDate >= fromDate && invoiceDate <= toDate;
      } else if (fromDate) {
        return invoiceDate >= fromDate;
      } else if (toDate) {
        return invoiceDate <= toDate;
      }
      return true;
    })();

    // Amount range filter
    const matchesAmountRange = (() => {
      if (!filters.amountMin && !filters.amountMax) return true;
      
      const minAmount = filters.amountMin ? parseFloat(filters.amountMin) : 0;
      const maxAmount = filters.amountMax ? parseFloat(filters.amountMax) : Infinity;

      return invoice.amount >= minAmount && invoice.amount <= maxAmount;
    })();

    return matchesSearch && matchesStatus && matchesCurrency && matchesDateRange && matchesAmountRange;
  });

  // Get unique currencies from invoices for filter dropdown
  const availableCurrencies = Array.from(new Set(
    invoices.map(invoice => invoice.currency_type || 'USD').filter(Boolean)
  )).sort();

  const formatCurrency = (amount: number, currency_type: string) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: `${currency_type}`, maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
      case 'processing':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400`;
    }
  };

  const handleInputChange = (field: keyof NewInvoice, value: string | number) => {
    setNewInvoice(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      status: 'all',
      currency: 'all',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: ''
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.status !== 'all') count++;
    if (filters.currency !== 'all') count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.amountMin || filters.amountMax) count++;
    return count;
  };

  const handleSubmit = async () => {
    if (!newInvoice.client_id) {
      alert('Please select a client');
      return;
    }

    setIsLoading(true);

    try {
      await axios.post('/api/invoices', newInvoice, {
        headers: getAuthHeaders()
      });
      
      // Refresh the invoices list
      await fetchInvoices();
      
      // Reset form and close modal
      setNewInvoice({
        client_id: '',
        invoice_date: '',
        amount: 0,
        currency_type: 'USD',
        status: 'unpaid',
        due_date: ''
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewInvoice({
      client_id: '',
      invoice_date: '',
      amount: 0,
      currency_type: 'USD',
      status: 'unpaid',
      due_date: ''
    });
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    resetForm();
  };

  // CSV Download functionality for all invoices
  const downloadCSV = async () => {
    setIsDownloading(true);
    
    try {
      // Convert invoices to CSV format
      const csvHeaders = ['Invoice ID', 'Client', 'Invoice Date', 'Amount', 'Currency', 'Status', 'Due Date', 'Created At'];
      
      const csvData = invoices.map(invoice => [
        invoice.id,
        invoice.client_name || invoice.client || '',
        invoice.invoice_date,
        invoice.amount,
        invoice.currency_type || 'USD',
        invoice.status,
        invoice.due_date,
        invoice.created_at ? new Date(invoice.created_at).toISOString().split('T')[0] : ''
      ]);

      // Create CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(field => 
          typeof field === 'string' && field.includes(',') ? `"${field}"` : field
        ).join(','))
      ].join('\n');

      // Generate filename with format: kapil_sarma_YYYY-MM-DD
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const filename = `kapil_sarma_${currentDate}.csv`;

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading CSV:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Single invoice download functionality
  const downloadSingleInvoice = async (invoice: Invoice) => {
    setDownloadingInvoiceId(invoice.id);
    
    try {
      // Create CSV content for single invoice
      const csvHeaders = ['Invoice ID', 'Client', 'Invoice Date', 'Amount', 'Currency', 'Status', 'Due Date', 'Created At'];
      
      const csvData = [
        invoice.id,
        invoice.client_name || invoice.client || '',
        invoice.invoice_date,
        invoice.amount,
        invoice.currency_type || 'USD',
        invoice.status,
        invoice.due_date,
        invoice.created_at ? new Date(invoice.created_at).toISOString().split('T')[0] : ''
      ];

      // Create CSV content
      const csvContent = [
        csvHeaders.join(','),
        csvData.map(field => 
          typeof field === 'string' && field.includes(',') ? `"${field}"` : field
        ).join(',')
      ].join('\n');

      // Generate filename with invoice ID: {invoice_id}.csv
      const filename = `${invoice.id}.csv`;

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading single invoice:', error);
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  // Get selected client name for display
  const getSelectedClientName = () => {
    if (!newInvoice.client_id) return 'Select a client';
    const client = clients.find(c => c.id === newInvoice.client_id);
    return client ? client.name : 'Select a client';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Invoices</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and track all your invoices • {filteredInvoices.length} of {invoices.length} invoices
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary">
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
          </Button>
          <Button 
            variant="secondary" 
            onClick={downloadCSV}
            disabled={isDownloading || invoices.length === 0}
            className="relative"
          >
            {isDownloading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                <span>Downloading...</span>
              </div>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </>
            )}
          </Button>
          <Button variant="gradient" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <Card className="p-6" variant="glass">
        <div className="space-y-4 dark:text-gray-500">
          {/* Main search bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by client name or invoice ID..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {filters.searchTerm && (
                <button
                  onClick={() => handleFilterChange('searchTerm', '')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Quick filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="text-gray-400 w-5 h-5" />
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-3 bg-white dark:bg-gray-800 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="overdue">Overdue</option>
                  <option value="processing">Processing</option>
                </select>
              </div>

              <Button
                variant="secondary"
                onClick={() => setIsFilterModalOpen(true)}
                className="relative"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Advanced Filters
                {getActiveFilterCount() > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    {getActiveFilterCount()}
                  </span>
                )}
              </Button>

              {getActiveFilterCount() > 0 && (
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Active filters display */}
          {getActiveFilterCount() > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.searchTerm && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  Search: "{filters.searchTerm}"
                  <button
                    onClick={() => handleFilterChange('searchTerm', '')}
                    className="ml-2 hover:text-blue-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.status !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Status: {filters.status}
                  <button
                    onClick={() => handleFilterChange('status', 'all')}
                    className="ml-2 hover:text-emerald-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.currency !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                  Currency: {filters.currency}
                  <button
                    onClick={() => handleFilterChange('currency', 'all')}
                    className="ml-2 hover:text-purple-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(filters.dateFrom || filters.dateTo) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                  Date Range
                  <button
                    onClick={() => {
                      handleFilterChange('dateFrom', '');
                      handleFilterChange('dateTo', '');
                    }}
                    className="ml-2 hover:text-orange-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(filters.amountMin || filters.amountMax) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                  Amount Range
                  <button
                    onClick={() => {
                      handleFilterChange('amountMin', '');
                      handleFilterChange('amountMax', '');
                    }}
                    className="ml-2 hover:text-indigo-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
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
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <Search className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {invoices.length === 0 ? 'No invoices found' : 'No invoices match your search criteria'}
                      </p>
                      {getActiveFilterCount() > 0 && (
                        <Button variant="ghost" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice, index) => {
                  const clientName = typeof invoice.client_name === 'string' ? invoice.client_name : 
                                    typeof invoice.client === 'string' ? invoice.client :
                                    typeof invoice.client === 'object' && invoice.client ? invoice.client.name : '';
                  return (
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
                            {clientName.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{clientName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {invoice.currency_type ? formatCurrency(invoice.amount, invoice.currency_type) : `$${invoice.amount}`}
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
                          onClick={() => downloadSingleInvoice(invoice)}
                          disabled={downloadingInvoiceId === invoice.id}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          {downloadingInvoiceId === invoice.id ? (
                            <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Advanced Filters Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Advanced Filters"
        size="lg"
      >
        <div className="space-y-6 dark:text-gray-500">
          {/* Header with gradient */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-500/20">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
                <SlidersHorizontal className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Options</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Refine your search with advanced criteria</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Currency Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                value={filters.currency}
                onChange={(e) => handleFilterChange('currency', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">All Currencies</option>
                {availableCurrencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="overdue">Overdue</option>
                <option value="processing">Processing</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Amount Min */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Minimum Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={filters.amountMin}
                onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="0.00"
              />
            </div>

            {/* Amount Max */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Maximum Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={filters.amountMax}
                onChange={(e) => handleFilterChange('amountMax', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear All Filters
            </Button>
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={() => setIsFilterModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gradient" onClick={() => setIsFilterModalOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Add Invoice Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleModalClose}
        title="Create New Invoice"
        size="lg"
      >
        <form className="space-y-6 dark:text-gray-400">
          {/* Header with gradient */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-500/20">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invoice Details</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Fill in the information below to create a new invoice</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Client
              </label>
              <div className="relative">
                <select
                  value={newInvoice.client_id}
                  onChange={(e) => handleInputChange('client_id', e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.email && `(${client.email})`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              {clients.length === 0 && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  No clients found. Please add a client first.
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Amount
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={newInvoice.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="0.00"
              />
            </div>

            {/* Currency Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                value={newInvoice.currency_type}
                onChange={(e) => handleInputChange('currency_type', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={newInvoice.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="processing">Processing</option>
              </select>
            </div>

            {/* Invoice Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Invoice Date
              </label>
              <input
                type="date"
                required
                value={newInvoice.invoice_date}
                onChange={(e) => handleInputChange('invoice_date', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Due Date
              </label>
              <input
                type="date"
                required
                value={newInvoice.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={handleModalClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              disabled={isLoading || !newInvoice.client_id}
              className="min-w-[120px]"
              onClick={handleSubmit}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </div>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};