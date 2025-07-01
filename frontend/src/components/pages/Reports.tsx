import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Download, Trophy, Clock, TrendingUp, Calendar } from 'lucide-react';
import api from '../../utils/api';

interface ReportsSummaryData {
  total_revenue: number; // Already in USD from backend
  collection_rate: number;
  top_client: string;
  top_client_revenue: number; // Already in USD from backend
  top_revenue_month: string;
  client_count: number;
  average_per_client: number; // Already in USD from backend
  primary_currency: string; // Always "USD"
}

interface ReportData {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  data: string;
  endpoint?: string;
}

export const Reports: React.FC = () => {
  const { user: clerkUser } = useUser();
  const [summaryData, setSummaryData] = useState<ReportsSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);

  // Configure axios to use Clerk ID
  const getAuthHeaders = () => {
    return {
      'X-Clerk-ID': clerkUser?.id || '',
      'Content-Type': 'application/json'
    };
  };

  useEffect(() => {
    if (!clerkUser?.id) return;

    const fetchData = async () => {
      try {
        // Fetch reports summary (all amounts already in USD from backend)
        const summaryResponse = await api.get('/dashboard/reports-summary', {
          headers: getAuthHeaders()
        });
        setSummaryData(summaryResponse.data);
      } catch (error) {
        console.error('Error fetching reports data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clerkUser?.id]);

  // Always format as USD since all amounts are in USD from backend
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      maximumFractionDigits: 0 
    }).format(amount);

  const downloadReport = async (reportTitle: string, endpoint?: string) => {
    setDownloadingReport(reportTitle);
    
    try {
      let data: any = {};
      
      // Fetch specific data based on report type
      if (endpoint) {
        const response = await api.get(`/dashboard/${endpoint}`, {
          headers: getAuthHeaders()
        });
        data = response.data;
      } else {
        // Use summary data for general reports
        data = summaryData;
      }

      // Generate CSV content based on report type
      let csvContent = '';
      let filename = '';

      switch (reportTitle) {
        case 'Monthly Revenue Report':
          const revenueResponse = await api.get('/dashboard/revenue-chart', {
            headers: getAuthHeaders()
          });
          const revenueData = revenueResponse.data || [];
          
          csvContent = [
            'Month,Revenue (USD)',
            ...revenueData.map((item: any) => `${item.month},${item.revenue}`)
          ].join('\n');
          filename = `monthly_revenue_report_${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'Client Performance Report':
          const clientsResponse = await api.get('/dashboard/top-clients', {
            headers: getAuthHeaders()
          });
          const clientsData = clientsResponse.data || [];
          
          csvContent = [
            'Client Name,Revenue (USD)',
            ...clientsData.map((client: any) => `"${client.name}",${client.revenue}`)
          ].join('\n');
          filename = `client_performance_report_${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'Outstanding Invoices Report':
          const invoicesResponse = await api.get('/invoices', {
            headers: getAuthHeaders()
          });
          const invoicesData = invoicesResponse.data || [];
          const outstandingInvoices = invoicesData.filter((invoice: any) => 
            invoice.status === 'unpaid' || invoice.status === 'overdue'
          );
          
          csvContent = [
            'Invoice ID,Client,Amount,Currency,Status,Due Date',
            ...outstandingInvoices.map((invoice: any) => 
              `${invoice.id},"${invoice.client_name || invoice.client || ''}",${invoice.amount},${invoice.currency_type || 'USD'},${invoice.status},${invoice.due_date}`
            )
          ].join('\n');
          filename = `outstanding_invoices_report_${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'Annual Financial Summary':
          csvContent = [
            'Metric,Value,Currency',
            `Total Revenue,${summaryData?.total_revenue || 0},USD`,
            `Collection Rate,${summaryData?.collection_rate || 0}%,N/A`,
            `Top Client,"${summaryData?.top_client || 'N/A'}",N/A`,
            `Top Client Revenue,${summaryData?.top_client_revenue || 0},USD`,
            `Client Count,${summaryData?.client_count || 0},N/A`,
            `Average Per Client,${summaryData?.average_per_client || 0},USD`,
            `Top Revenue Month,"${summaryData?.top_revenue_month || 'N/A'}",N/A`
          ].join('\n');
          filename = `annual_financial_summary_${new Date().getFullYear()}.csv`;
          break;

        default:
          csvContent = 'No data available';
          filename = `report_${new Date().toISOString().split('T')[0]}.csv`;
      }

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
      console.error('Error downloading report:', error);
    } finally {
      setDownloadingReport(null);
    }
  };

  const downloadAllReports = async () => {
    setDownloadingReport('all');
    
    try {
      // Download all reports sequentially
      const reports = ['Monthly Revenue Report', 'Client Performance Report', 'Outstanding Invoices Report', 'Annual Financial Summary'];
      
      for (const report of reports) {
        await downloadReport(report);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error downloading all reports:', error);
    } finally {
      setDownloadingReport(null);
    }
  };

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

  const reports: ReportData[] = [
    {
      title: "Monthly Revenue Report",
      description: "Comprehensive breakdown of monthly revenue trends and patterns",
      icon: <TrendingUp className="w-6 h-6" />,
      gradient: "from-blue-600 to-cyan-600",
      data: formatCurrency(summaryData?.total_revenue || 0),
      endpoint: "revenue-chart"
    },
    {
      title: "Client Performance Report",
      description: "Detailed analysis of client payment behaviors and profitability",
      icon: <Trophy className="w-6 h-6" />,
      gradient: "from-emerald-600 to-teal-600",
      data: `${summaryData?.client_count || 0} clients`,
      endpoint: "top-clients"
    },
    {
      title: "Outstanding Invoices Report",
      description: "Summary of unpaid invoices and collection priorities",
      icon: <Clock className="w-6 h-6" />,
      gradient: "from-orange-600 to-red-600",
      data: formatCurrency((summaryData?.total_revenue || 0) - ((summaryData?.total_revenue || 0) * (summaryData?.collection_rate || 0) / 100))
    },
    {
      title: "Annual Financial Summary",
      description: "Year-to-date financial performance and tax preparation data",
      icon: <Calendar className="w-6 h-6" />,
      gradient: "from-purple-600 to-pink-600",
      data: `${new Date().getFullYear()} Summary`
    }
  ];

  const highlights = [
    {
      title: "Most Valuable Client",
      value: summaryData?.top_client || "No data",
      subtext: formatCurrency(summaryData?.top_client_revenue || 0),
      gradient: "from-blue-600 to-purple-600",
      icon: <Trophy className="w-5 h-5" />
    },
    {
      title: "Collection Rate",
      value: `${Math.round(summaryData?.collection_rate || 0)}%`,
      subtext: "Payment success rate",
      gradient: "from-emerald-600 to-teal-600",
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      title: "Top Revenue Month",
      value: summaryData?.top_revenue_month || "Current Month",
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
          <p className="text-gray-600 dark:text-gray-400">Generate and export detailed business reports (All amounts in USD)</p>
        </div>
        <Button 
          variant="gradient" 
          onClick={downloadAllReports}
          disabled={downloadingReport === 'all'}
        >
          {downloadingReport === 'all' ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Exporting...</span>
            </div>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export All
            </>
          )}
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
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => downloadReport(report.title, report.endpoint)}
                      disabled={downloadingReport === report.title}
                    >
                      {downloadingReport === report.title ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Export CSV
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      {summaryData && (
        <Card className="p-8" variant="gradient">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Quick Statistics</h3>
            <p className="text-gray-600 dark:text-gray-400">Overview of your business performance (All amounts in USD)</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {formatCurrency(summaryData.total_revenue)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                {Math.round(summaryData.collection_rate)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Collection Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {summaryData.client_count}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Clients</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {summaryData.client_count > 0 ? formatCurrency(summaryData.average_per_client).replace(/[^\d]/g, '').slice(0, -3) + 'K' : '0K'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg per Client</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};