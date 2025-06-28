import React from 'react';
import { KPICards } from '../dashboard/KPICards';
import { RevenueChart } from '../dashboard/RevenueChart';
import { TopClientsChart } from '../dashboard/TopClientsChart';
import { RecentInvoices } from '../dashboard/RecentInvoices';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's an overview of your invoice analytics.
        </p>
      </div>

      {/* KPI Cards */}
      <KPICards />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <TopClientsChart />
        </div>
      </div>

      {/* Recent Invoices */}
      <RecentInvoices />
    </div>
  );
};