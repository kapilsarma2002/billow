import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { TrendingUp, TrendingDown, DollarSign, Users, Clock, CheckCircle } from 'lucide-react';
import axios from 'axios';

interface KPIData {
  total_invoiced: number;
  total_paid: number;
  outstanding: number;
  client_count: number;
}

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ReactNode;
  gradient: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, changeType, icon, gradient }) => {
  const isPositive = changeType === 'positive';
  
  return (
    <Card className="p-6 relative overflow-hidden group hover:scale-105 transition-all duration-300">
      <div className={`absolute inset-0 opacity-10 ${gradient}`} />
      <div className={`absolute -top-2 -right-2 w-24 h-24 ${gradient} rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${gradient.replace('bg-gradient-to-r', 'bg-gradient-to-br')} shadow-lg`}>
            {icon}
          </div>
          <div className={`flex items-center text-sm font-medium ${
            isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {change}
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
};

export const KPICards: React.FC = () => {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [previousKpiData, setPreviousKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [primaryCurrency, setPrimaryCurrency] = useState('USD');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch KPI data
        const kpiResponse = await axios.get('http://localhost:8080/api/dashboard/kpi');
        setKpiData(kpiResponse.data);

        // Fetch previous month KPI data for comparison (simplified - using current data with mock comparison)
        // In a real implementation, you'd fetch data for the previous period
        setPreviousKpiData({
          total_invoiced: kpiResponse.data.total_invoiced * 0.9, // Mock 10% less for previous period
          total_paid: kpiResponse.data.total_paid * 0.92, // Mock 8% less
          outstanding: kpiResponse.data.outstanding * 1.03, // Mock 3% more
          client_count: Math.max(0, kpiResponse.data.client_count - 2) // Mock 2 fewer clients
        });

        // Get primary currency from settings or default to USD
        // We'll use a more efficient approach - check if we have any invoices and get currency from there
        try {
          const invoicesResponse = await axios.get('http://localhost:8080/api/invoices?limit=1');
          if (invoicesResponse.data && invoicesResponse.data.length > 0) {
            const mostRecentInvoice = invoicesResponse.data[0];
            setPrimaryCurrency(mostRecentInvoice.currency_type || 'USD');
          }
        } catch (error) {
          console.log('No invoices found, using default currency USD');
          setPrimaryCurrency('USD');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
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

  const calculateChange = (current: number, previous: number): { change: string; changeType: 'positive' | 'negative' } => {
    if (previous === 0) {
      return { change: current > 0 ? '+100%' : '0%', changeType: current > 0 ? 'positive' : 'negative' };
    }
    
    const percentChange = ((current - previous) / previous) * 100;
    const isPositive = percentChange >= 0;
    
    return {
      change: `${isPositive ? '+' : ''}${percentChange.toFixed(1)}%`,
      changeType: isPositive ? 'positive' : 'negative'
    };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!kpiData || !previousKpiData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">Failed to load KPI data</p>
        </Card>
      </div>
    );
  }

  const totalInvoicedChange = calculateChange(kpiData.total_invoiced, previousKpiData.total_invoiced);
  const totalPaidChange = calculateChange(kpiData.total_paid, previousKpiData.total_paid);
  const outstandingChange = calculateChange(kpiData.outstanding, previousKpiData.outstanding);
  const clientCountChange = calculateChange(kpiData.client_count, previousKpiData.client_count);

  const cards: KPICardProps[] = [
    {
      title: 'Total Invoiced',
      value: formatCurrency(kpiData.total_invoiced),
      change: totalInvoicedChange.change,
      changeType: totalInvoicedChange.changeType,
      icon: <DollarSign className="w-6 h-6 text-white" />,
      gradient: 'bg-gradient-to-r from-blue-600 to-cyan-600'
    },
    {
      title: 'Total Paid',
      value: formatCurrency(kpiData.total_paid),
      change: totalPaidChange.change,
      changeType: totalPaidChange.changeType,
      icon: <CheckCircle className="w-6 h-6 text-white" />,
      gradient: 'bg-gradient-to-r from-emerald-600 to-teal-600'
    },
    {
      title: 'Outstanding',
      value: formatCurrency(kpiData.outstanding),
      change: outstandingChange.change,
      changeType: outstandingChange.changeType,
      icon: <Clock className="w-6 h-6 text-white" />,
      gradient: 'bg-gradient-to-r from-orange-600 to-red-600'
    },
    {
      title: 'Active Clients',
      value: kpiData.client_count.toString(),
      change: clientCountChange.change,
      changeType: clientCountChange.changeType,
      icon: <Users className="w-6 h-6 text-white" />,
      gradient: 'bg-gradient-to-r from-purple-600 to-pink-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <KPICard key={index} {...card} />
      ))}
    </div>
  );
};