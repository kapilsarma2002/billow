import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Client, ClientRevenueData } from '../../types';
import axios from 'axios';
import { Search, Plus, TrendingUp, Calendar, DollarSign, User, Mail, X, Building } from 'lucide-react';

interface NewClient {
  name: string;
  email: string;
  total_invoiced: number;
  total_paid: number;
  invoice_count: number;
  payment_delay: number;
  avatar: string;
}

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [revenueData, setRevenueData] = useState<number[]>([]);
  const [newClient, setNewClient] = useState<NewClient>({
    name: '',
    email: '',
    total_invoiced: 0,
    total_paid: 0,
    invoice_count: 0,
    payment_delay: 0,
    avatar: ''
  });

  // Fetch clients function
  const fetchClients = async (search?: string) => {
    try {
      const params = search ? { search } : {};
      const response = await axios.get('http://localhost:8080/api/clients', { params });
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    }
  };

  // Single effect to handle initial load and debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchClients(searchTerm || undefined);
    }, searchTerm ? 300 : 0); // No delay for initial load, 300ms for search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Always format as USD since all calculations are done in USD on backend
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const openClientModal = async (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
    
    // Fetch revenue data for the client (already in USD from backend)
    try {
      const response = await axios.get<ClientRevenueData>(`http://localhost:8080/api/clients/${client.id}/revenue-data`);
      setRevenueData(response.data.revenue_data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      setRevenueData([]);
    }
  };

  const handleInputChange = (field: keyof NewClient, value: string | number) => {
    setNewClient(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      // Generate a default avatar URL based on name
      const avatarUrl = `https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-symbol-image-default-avatar-profile-icon-vector-social-media-user-symbol-209498286.jpg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop`;
      
      const clientData = {
        ...newClient,
        avatar: newClient.avatar || avatarUrl
      };

      await axios.post('http://localhost:8080/api/clients', clientData);
      
      // Refresh the clients list
      await fetchClients();
      
      // Reset form and close modal
      resetForm();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error creating client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewClient({
      name: '',
      email: '',
      total_invoiced: 0,
      total_paid: 0,
      invoice_count: 0,
      payment_delay: 0,
      avatar: ''
    });
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    resetForm();
  };

  const SparklineChart: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-10 text-gray-400 text-sm">
          No data available
        </div>
      );
    }

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
          <p className="text-gray-600 dark:text-gray-400">
            Manage your client relationships and analytics • {clients.length} clients (All amounts in USD)
          </p>
        </div>
        <Button variant="gradient" onClick={() => setIsAddModalOpen(true)}>
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
            placeholder="Search clients by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </Card>

      {/* Clients Grid */}
      {clients.length === 0 ? (
        <Card className="p-12 text-center" variant="glass">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No clients found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm ? 'No clients match your search criteria' : 'Get started by adding your first client'}
              </p>
              {!searchTerm && (
                <Button variant="gradient" onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Client
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <Card key={client.id} className="p-6 hover:scale-105 transition-all duration-300 cursor-pointer" variant="glass">
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={client.avatar || `https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-symbol-image-default-avatar-profile-icon-vector-social-media-user-symbol-209498286.jpg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop`}
                  alt={client.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-gray-700"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-symbol-image-default-avatar-profile-icon-vector-social-media-user-symbol-209498286.jpg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop`;
                  }}
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
                    {formatCurrency(client.total_invoiced)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Paid</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(client.total_paid)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Invoices</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{client.invoice_count}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Payment Rate</span>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${client.total_invoiced > 0 ? (client.total_paid / client.total_invoiced) * 100 : 0}%` 
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {client.total_invoiced > 0 ? Math.round((client.total_paid / client.total_invoiced) * 100) : 0}% paid
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
      )}

      {/* Client Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedClient?.name || ''}
        size="lg"
      >
        {selectedClient && (
          <div className="space-y-6 dark:text-gray-500">
            <div className="flex items-center space-x-4">
              <img
                src={selectedClient.avatar || `https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-symbol-image-default-avatar-profile-icon-vector-social-media-user-symbol-209498286.jpg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop`}
                alt={selectedClient.name}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-blue-500/20"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-symbol-image-default-avatar-profile-icon-vector-social-media-user-symbol-209498286.jpg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop`;
                }}
              />
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedClient.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedClient.email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Client since {new Date(selectedClient.created_at || '').toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                <DollarSign className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Invoice</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(selectedClient.average_invoice)}
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Payment Rate</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedClient.total_invoiced > 0 ? Math.round((selectedClient.total_paid / selectedClient.total_invoiced) * 100) : 0}%
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl">
                <Calendar className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Delay</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedClient.payment_delay} days
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend (USD)</h4>
              <div className="h-20 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4">
                <SparklineChart data={revenueData} color="#8b5cf6" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Invoiced</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(selectedClient.total_invoiced)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(selectedClient.total_paid)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Client Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleModalClose}
        title="Add New Client"
        size="lg"
      >
        <form className="space-y-6 dark:text-gray-400">
          {/* Header with gradient */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-500/20">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Client Information</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add a new client to your database (amounts in USD)</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Client Name
              </label>
              <input
                type="text"
                required
                value={newClient.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter client name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={newClient.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="client@example.com"
              />
            </div>

            {/* Total Invoiced */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Total Invoiced (USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newClient.total_invoiced}
                onChange={(e) => handleInputChange('total_invoiced', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="0.00"
              />
            </div>

            {/* Total Paid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Total Paid (USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newClient.total_paid}
                onChange={(e) => handleInputChange('total_paid', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="0.00"
              />
            </div>

            {/* Invoice Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Invoice Count
              </label>
              <input
                type="number"
                min="0"
                value={newClient.invoice_count}
                onChange={(e) => handleInputChange('invoice_count', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="0"
              />
            </div>

            {/* Payment Delay */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Payment Delay (days)
              </label>
              <input
                type="number"
                min="0"
                value={newClient.payment_delay}
                onChange={(e) => handleInputChange('payment_delay', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="0"
              />
            </div>

            {/* Avatar URL (optional) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Avatar URL (optional)
              </label>
              <input
                type="url"
                value={newClient.avatar}
                onChange={(e) => handleInputChange('avatar', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="https://example.com/avatar.jpg"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty to use default avatar
              </p>
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
              disabled={isLoading}
              className="min-w-[120px]"
              onClick={handleSubmit}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Adding...</span>
                </div>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};