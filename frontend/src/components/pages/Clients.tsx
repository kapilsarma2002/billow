import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { clients } from '../../utils/mockData';
import { Search, Plus, TrendingUp, Calendar, DollarSign } from 'lucide-react';

export const Clients: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<typeof clients[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const openClientModal = (client: typeof clients[0]) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const SparklineChart: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => ({
      x: (index / (data.length - 1)) * 100,
      y: 100 - ((value - min) / range) * 100
    }));

    const pathData = points.reduce((path, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      return `${path} L ${point.x} ${point.y}`;
    }, '');

    return (
      <svg width="100%" height="40" viewBox="0 0 100 100" className="overflow-visible">
        <path
          d={pathData}
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Clients</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your client relationships and analytics</p>
        </div>
        <Button variant="gradient">
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Search */}
      <Card className="p-6" variant="glass">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </Card>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <Card key={client.id} className="p-6 hover:scale-105 transition-all duration-300 cursor-pointer" variant="glass">
            <div className="flex items-center space-x-4 mb-4">
              <img
                src={client.avatar}
                alt={client.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-gray-700"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{client.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{client.email}</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Invoiced</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(client.totalInvoiced)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Paid</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(client.totalPaid)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Invoices</span>
                <span className="font-semibold text-gray-900 dark:text-white">{client.invoiceCount}</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Revenue Trend</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="h-10">
                <SparklineChart data={client.revenueData} color="#10b981" />
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => openClientModal(client)}
            >
              View Details
            </Button>
          </Card>
        ))}
      </div>

      {/* Client Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedClient?.name || ''}
        size="lg"
      >
        {selectedClient && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <img
                src={selectedClient.avatar}
                alt={selectedClient.name}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-blue-500/20"
              />
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedClient.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedClient.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                <DollarSign className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Invoice</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(selectedClient.averageInvoice)}
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Payment Rate</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {Math.round((selectedClient.totalPaid / selectedClient.totalInvoiced) * 100)}%
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl">
                <Calendar className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Delay</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedClient.paymentDelay} days
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend</h4>
              <div className="h-20 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4">
                <SparklineChart data={selectedClient.revenueData} color="#8b5cf6" />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};