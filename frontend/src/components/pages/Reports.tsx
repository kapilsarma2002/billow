import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Download, Trophy, Clock, TrendingUp, Calendar } from 'lucide-react';
import axios from 'axios';

interface KPIData {
  total_invoiced: number;
  total_paid: number;
  outstanding: number;
  client_count: number;
}

interface TopClient {
  name: string;
  revenue: number;
}

export const Reports: React.FC = () => {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [primaryCurrency, setPrimaryCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch KPI data
        const kpiResponse = await axios.get('http://localhost:8080/api/dashboard/kpi');
        setKpiData(kpiResponse.data);

        // Fetch top clients
        const clientsResponse = await axios.get('http://localhost:8080/api/dashboard/top-clients');
        setTopClients(clientsResponse.data || []);

        // Fetch primary currency from most recent invoice
        const invoicesResponse = await axios.get('http://localhost:8080/api/invoices?limit=1');
        if (invoicesResponse.data && invoicesResponse.data.length > 0) {
          const mostRecentInvoice = invoicesResponse.data[0];
          setPrimaryCurrency(mostRecentInvoice.currency_type || 'USD');
        }
      } catch (error) {
        console.error('Error fetching reports data:', error);
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
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const mostValuableClient = topClients.length > 0 ? topClients[0] : null;
  const mostDelayedClient = topClients.length > 1 ? topClients[1] : null; // Placeholder logic
  const topMonth = "Current Month"; // This would be calculated from revenue data

  const reports = [
    {
      title: "Monthly Revenue Report",
      description: "Comprehensive breakdown of monthly revenue trends and patterns",
      icon: <TrendingUp className="w-6 h-6" />,
      gradient: "from-blue-600 to-cyan-600",
      data: kpiData ? formatCurrency(kpiData.total_invoiced) : formatCurrency(0)
    },
    {
      title: "Client Performance Report",
      description: "Detailed analysis of client payment behaviors and profitability",
      icon: <Trophy className="w-6 h-6" />,
      gradient: "from-emerald-600 to-teal-600",
      data: `${kpiData?.client_count || 0} clients`
    },
    {
      title: "Outstanding Invoices Report",
      description: "Summary of unpaid invoices and collection priorities",
      icon: <Clock className="w-6 h-6" />,
      gradient: "from-orange-600 to-red-600",
      data: kpiData ? formatCurrency(kpiData.outstanding) : formatCurrency(0)
    },
    {
      title: "Annual Financial Summary",
      description: "Year-to-date financial performance and tax preparation data",
      icon: <Calendar className="w-6 h-6" />,
      gradient: "from-purple-600 to-pink-600",
      data: "2024 Summary"
    }
  ];

  const highlights = [
    {
      title: "Most Valuable Client",
      value: mostValuableClient?.name || "No data",
      subtext: mostValuableClient ? formatCurrency(mostValuableClient.revenue) : formatCurrency(0),
      gradient: "from-blue-600 to-purple-600",
      icon: <Trophy className="w-5 h-5" />
    },
    {
      title: "Collection Rate",
      value: kpiData && kpiData.total_invoiced > 0 
        ? `${Math.round((kpiData.total_paid / kpiData.total_invoiced) * 100)}%`
        : "0%",
      subtext: "Payment success rate",
      gradient: "from-emerald-600 to-teal-600",
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      title: "Top Revenue Month",
      value: topMonth,
      subtext: "Highest performing period",
      gradient: "from-orange-600 to-red-600",
      icon: <Calendar className="w-5 h-5" />
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Generate and export detailed business reports</p>
        </div>
        <Button variant="gradient">
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Key Highlights */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Key Highlights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlights.map((highlight, index) => (
            <Card key={index} className="p-6 relative overflow-hidden group hover:scale-105 transition-all duration-300">
              <div className={`absolute inset-0 opacity-5 bg-gradient-to-r ${highlight.gradient}`} />
              <div className={`absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-r ${highlight.gradient} rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${highlight.gradient} mb-4`}>
                  <div className="text-white">
                    {highlight.icon}
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {highlight.title}
                </h3>
                <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {highlight.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {highlight.subtext}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Report Cards */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report, index) => (
            <Card key={index} className="p-8 hover:scale-105 transition-all duration-300 group" variant="glass">
              <div className="flex items-start space-x-4">
                <div className={`p-4 rounded-2xl bg-gradient-to-r ${report.gradient} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                  <div className="text-white">
                    {report.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {report.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {report.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {report.data}
                    </span>
                    <Button variant="secondary" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      {kpiData && (
        <Card className="p-8" variant="gradient">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Quick Statistics</h3>
            <p className="text-gray-600 dark:text-gray-400">Overview of your business performance</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {formatCurrency(kpiData.total_invoiced)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                {kpiData.total_invoiced > 0 ? Math.round((kpiData.total_paid / kpiData.total_invoiced) * 100) : 0}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Collection Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {kpiData.client_count}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Clients</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {kpiData.client_count > 0 ? formatCurrency(kpiData.total_invoiced / kpiData.client_count).replace(/[^\d]/g, '').slice(0, -3) + 'K' : '0K'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg per Client</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};