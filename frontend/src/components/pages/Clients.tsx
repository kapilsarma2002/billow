import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Client, ClientRevenueData } from '../../types';
import api from '../../utils/api';
import { Search, Plus, TrendingUp, Calendar, DollarSign, User, Mail, X, Building, AlertCircle } from 'lucide-react';

interface NewClient {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
}

export const Clients: React.FC = () => {
  const { user: clerkUser } = useUser();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [revenueData, setRevenueData] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newClient, setNewClient] = useState<NewClient>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: ''
  });

  // Configure axios to use Clerk ID
  const getAuthHeaders = () => {
    return {
      'X-Clerk-ID': clerkUser?.id || '',
      'Content-Type': 'application/json'
    };
  };

  // Fetch clients function
  const fetchClients = async (search?: string) => {
    try {
      const params = search ? { search } : {};
      const response = await api.get('/clients', { 
        params,
        headers: getAuthHeaders()
      });
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    }
  };

  // Single effect to handle initial load and debounced search
  useEffect(() => {
    if (!clerkUser?.id) return;
    
    const timeoutId = setTimeout(() => {
      fetchClients(searchTerm || undefined);
    }, searchTerm ? 300 : 0); // No delay for initial load, 300ms for search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, clerkUser?.id]);

  // Always format as USD since all calculations are done in USD on backend
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const openClientModal = async (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
    
    // Fetch revenue data for the client (already in USD from backend)
    try {
      const response = await api.get<ClientRevenueData>(`/clients/${client.id}/revenue-data`, {
        headers: getAuthHeaders()
      });
      setRevenueData(response.data.revenue_data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      setRevenueData([]);
    }
  };

  const handleInputChange = (field: keyof NewClient, value: string) => {
    setNewClient(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const handleSubmit = async () => {
    if (!newClient.name.trim()) {
      showError('Please enter a client name');
      return;
    }

    if (!newClient.email.trim()) {
      showError('Please enter a client email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newClient.email)) {
      showError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate a default avatar URL based on name
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(newClient.name)}&background=6366f1&color=ffffff&size=100`;
      
      const clientData = {
        ...newClient,
        avatar: avatarUrl,
        total_invoiced: 0,
        total_paid: 0,
        invoice_count: 0,
        average_invoice: 0,
        payment_delay: 0
      };

      await api.post('/clients', clientData, {
        headers: getAuthHeaders()
      });
      
      // Refresh the clients list
      await fetchClients();
      
      // Reset form and close modal
      resetForm();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error creating client:', error);
      showError('Failed to create client. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewClient({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: ''
    });
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    resetForm();
    setError(null);
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
      {/* Error notification */}
      {error && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-red-100 border border-red-200 text-red-800 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
                  src={client.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=6366f1&color=ffffff&size=100`}
                  alt={client.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-gray-700"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=6366f1&color=ffffff&size=100`;
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{client.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{client.email}</p>
                  {client.company && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">{client.company}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Invoiced</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(client.total_invoiced || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Paid</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(client.total_paid || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Invoices</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{client.invoice_count || 0}</span>
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
                      width: `${(client.total_invoiced || 0) > 0 ? ((client.total_paid || 0) / (client.total_invoiced || 1)) * 100 : 0}%` 
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {(client.total_invoiced || 0) > 0 ? Math.round(((client.total_paid || 0) / (client.total_invoiced || 1)) * 100) : 0}% paid
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
                src={selectedClient.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedClient.name)}&background=6366f1&color=ffffff&size=100`}
                alt={selectedClient.name}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-blue-500/20"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedClient.name)}&background=6366f1&color=ffffff&size=100`;
                }}
              />
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedClient.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedClient.email}</p>
                {selectedClient.company && (
                  <p className="text-sm text-gray-500 dark:text-gray-500">{selectedClient.company}</p>
                )}
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
                  {formatCurrency(selectedClient.average_invoice || 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Payment Rate</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {(selectedClient.total_invoiced || 0) > 0 ? Math.round(((selectedClient.total_paid || 0) / (selectedClient.total_invoiced || 1)) * 100) : 0}%
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl">
                <Calendar className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Delay</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedClient.payment_delay || 0} days
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
                  {formatCurrency(selectedClient.total_invoiced || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(selectedClient.total_paid || 0)}
                </p>
              </div>
            </div>

            {/* Contact Information */}
            {(selectedClient.phone || selectedClient.address) && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h4>
                <div className="space-y-2">
                  {selectedClient.phone && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedClient.phone}</span>
                    </div>
                  )}
                  {selectedClient.address && (
                    <div className="flex items-start space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedClient.address}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Add a new client to your database</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Client Name *
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
                Email Address *
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

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={newClient.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Building className="w-4 h-4 inline mr-2" />
                Company
              </label>
              <input
                type="text"
                value={newClient.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Company name"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <textarea
                value={newClient.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Full address"
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