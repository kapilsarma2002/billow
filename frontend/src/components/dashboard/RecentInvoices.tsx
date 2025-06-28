import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Download } from 'lucide-react';
import { Invoice } from '../../types';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const RecentInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentInvoices = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/dashboard/recent-invoices');
        setInvoices(response.data || []);
      } catch (error) {
        console.error('Error fetching recent invoices:', error);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentInvoices();
  }, []);

  const formatCurrency = (amount: number, currency_type?: string) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency_type || 'USD', 
      maximumFractionDigits: 0 
    }).format(amount);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
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

  // Single invoice download functionality
  const downloadSingleInvoice = async (invoice: Invoice) => {
    setDownloadingInvoiceId(invoice.id);
    
    try {
      // Create CSV content for single invoice
      const csvHeaders = ['Invoice ID', 'Client', 'Invoice Date', 'Amount', 'Currency', 'Status', 'Due Date', 'Created At'];
      
      const clientName = invoice.client_name || 
                        (typeof invoice.client === 'string' ? invoice.client : 
                         typeof invoice.client === 'object' && invoice.client ? invoice.client.name : '');
      
      const csvData = [
        invoice.id,
        clientName,
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

  if (loading) {
    return (
      <Card className="p-6" variant="glass">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6" variant="glass">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Recent Invoices</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Latest invoice transactions</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
          View All
        </Button>
      </div>

      {invoices.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
          <p>No recent invoices found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400 text-sm">Invoice</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400 text-sm">Client</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400 text-sm">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400 text-sm">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400 text-sm">Due Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const clientName = invoice.client_name || 
                                  (typeof invoice.client === 'string' ? invoice.client : 
                                   typeof invoice.client === 'object' && invoice.client ? invoice.client.name : '');
                
                return (
                  <tr 
                    key={invoice.id} 
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900 dark:text-white">{invoice.id}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-700 dark:text-gray-300">{clientName}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(invoice.amount, invoice.currency_type)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={getStatusBadge(invoice.status)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-600 dark:text-gray-400">{formatDate(invoice.due_date)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => downloadSingleInvoice(invoice)}
                        disabled={downloadingInvoiceId === invoice.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title={`Download ${invoice.id}`}
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
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};