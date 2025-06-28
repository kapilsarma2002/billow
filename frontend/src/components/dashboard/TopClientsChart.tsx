import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import axios from 'axios';

interface TopClientData {
  name: string;
  revenue: number;
}

interface KPIData {
  primary_currency: string;
}

export const TopClientsChart: React.FC = () => {
  const [topClientsData, setTopClientsData] = useState<TopClientData[]>([]);
  const [primaryCurrency, setPrimaryCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch top clients and KPI data for currency
        const [clientsResponse, kpiResponse] = await Promise.all([
          axios.get('http://localhost:8080/api/dashboard/top-clients'),
          axios.get('http://localhost:8080/api/dashboard/kpi')
        ]);
        
        setTopClientsData(clientsResponse.data || []);
        setPrimaryCurrency(kpiResponse.data.primary_currency || 'USD');
      } catch (error) {
        console.error('Error fetching top clients:', error);
        setTopClientsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number, currency: string = primaryCurrency) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency, 
      maximumFractionDigits: 0 
    }).format(amount);

  if (loading) {
    return (
      <Card className="p-6" variant="glass">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/2"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (topClientsData.length === 0) {
    return (
      <Card className="p-6" variant="glass">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Top Clients</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Highest revenue generating clients</p>
        </div>
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
          <p>No client data available</p>
        </div>
      </Card>
    );
  }

  const maxRevenue = Math.max(...topClientsData.map(d => d.revenue), 1); // Ensure at least 1 to avoid division by 0

  return (
    <Card className="p-6" variant="glass">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Top Clients</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Highest revenue generating clients (in {primaryCurrency})</p>
      </div>

      <div className="space-y-4">
        {topClientsData.map((client, index) => {
          const percentage = maxRevenue > 0 ? (client.revenue / maxRevenue) * 100 : 0;
          const gradients = [
            'from-blue-600 to-cyan-600',
            'from-emerald-600 to-teal-600',
            'from-purple-600 to-pink-600',
            'from-orange-600 to-red-600',
            'from-indigo-600 to-purple-600'
          ];

          return (
            <div key={client.name} className="group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {client.name}
                </span>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  {formatCurrency(client.revenue, primaryCurrency)}
                </span>
              </div>
              <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${gradients[index % gradients.length]} rounded-full transition-all duration-1000 ease-out group-hover:scale-105`}
                  style={{ width: `${Math.max(percentage, 2)}%` }} // Minimum 2% width for visibility
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};