import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { invoices } from '../../utils/mockData';
import { ExternalLink, Download } from 'lucide-react';

export const RecentInvoices: React.FC = () => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

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
    <Card className="p-6" variant="glass">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Recent Invoices</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Latest invoice transactions</p>
        </div>
        <Button variant="ghost" size="sm">
          <ExternalLink className="w-4 h-4 mr-2" />
          View All
        </Button>
      </div>

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
            {invoices.map((invoice) => (
              <tr 
                key={invoice.id} 
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
              >
                <td className="py-4 px-4">
                  <span className="font-medium text-gray-900 dark:text-white">{invoice.id}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-gray-700 dark:text-gray-300">{invoice.client}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(invoice.amount)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className={getStatusBadge(invoice.status)}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-gray-600 dark:text-gray-400">{formatDate(invoice.dueDate)}</span>
                </td>
                <td className="py-4 px-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
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
  );
};