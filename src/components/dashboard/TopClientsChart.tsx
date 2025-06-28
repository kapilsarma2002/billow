import React from 'react';
import { Card } from '../ui/Card';
import { topClientsData } from '../../utils/mockData';

export const TopClientsChart: React.FC = () => {
  const maxRevenue = Math.max(...topClientsData.map(d => d.revenue));
  
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  return (
    <Card className="p-6" variant="glass">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Top Clients</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Highest revenue generating clients</p>
      </div>

      <div className="space-y-4">
        {topClientsData.map((client, index) => {
          const percentage = (client.revenue / maxRevenue) * 100;
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
                  {formatCurrency(client.revenue)}
                </span>
              </div>
              <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${gradients[index]} rounded-full transition-all duration-1000 ease-out group-hover:scale-105`}
                  style={{ width: `${percentage}%` }}
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