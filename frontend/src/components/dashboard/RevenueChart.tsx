import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card } from '../ui/Card';
import axios from 'axios';

interface RevenueData {
  month: string;
  revenue: number; // Already in USD from backend
}

export const RevenueChart: React.FC = () => {
  const { user: clerkUser } = useUser();
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);

  // Configure axios to use Clerk ID
  const getAuthHeaders = () => {
    return {
      'X-Clerk-ID': clerkUser?.id || '',
      'Content-Type': 'application/json'
    };
  };

  useEffect(() => {
    if (!clerkUser?.id) return;

    const fetchRevenueData = async () => {
      try {
        // Fetch revenue data (already converted to USD on backend)
        const response = await axios.get('/api/dashboard/revenue-chart', {
          headers: getAuthHeaders()
        });
        setRevenueData(response.data || []);
      } catch (error) {
        console.error('Error fetching revenue data:', error);
        // Fallback to empty data
        setRevenueData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [clerkUser?.id]);

  if (loading) {
    return (
      <Card className="p-6" variant="glass">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  if (revenueData.length === 0) {
    return (
      <Card className="p-6" variant="glass">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Monthly Revenue</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Revenue trends over the past 12 months (in USD)</p>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <p>No revenue data available</p>
        </div>
      </Card>
    );
  }

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
  const minRevenue = Math.min(...revenueData.map(d => d.revenue));
  const range = maxRevenue - minRevenue || 1;

  const getYPosition = (revenue: number) => {
    const normalized = (revenue - minRevenue) / range;
    return 200 - (normalized * 160); // 200 is chart height, 160 is usable height (with padding)
  };

  const points = revenueData.map((data, index) => ({
    x: 50 + (index * (700 / Math.max(revenueData.length - 1, 1))), // Distribute evenly across width
    y: getYPosition(data.revenue),
    revenue: data.revenue,
    month: data.month
  }));

  const pathData = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    const prevPoint = points[index - 1];
    const cpx1 = prevPoint.x + 20;
    const cpx2 = point.x - 20;
    return `${path} C ${cpx1} ${prevPoint.y} ${cpx2} ${point.y} ${point.x} ${point.y}`;
  }, '');

  return (
    <Card className="p-6" variant="glass">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Monthly Revenue</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Revenue trends over the past 12 months (in USD)</p>
      </div>

      <div className="relative">
        <svg width="100%" height="280" viewBox="0 0 800 280" className="overflow-visible">
          {/* Grid lines */}
          <defs>
            <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" />
              <stop offset="50%" stopColor="rgb(147, 51, 234)" />
              <stop offset="100%" stopColor="rgb(79, 70, 229)" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          {points.length > 0 && (
            <path
              d={`${pathData} L ${points[points.length - 1].x} 240 L ${points[0].x} 240 Z`}
              fill="url(#revenueGradient)"
              opacity="0.6"
            />
          )}

          {/* Main line */}
          {points.length > 0 && (
            <path
              d={pathData}
              stroke="url(#lineGradient)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-sm"
            />
          )}

          {/* Data points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill="white"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                className="drop-shadow-sm hover:r-8 transition-all duration-200 cursor-pointer"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="2"
                fill="url(#lineGradient)"
              />
            </g>
          ))}

          {/* X-axis labels */}
          {points.map((point, index) => (
            <text
              key={index}
              x={point.x}
              y="260"
              textAnchor="middle"
              className="text-xs fill-gray-600 dark:fill-gray-400"
            >
              {revenueData[index].month}
            </text>
          ))}
        </svg>
      </div>
    </Card>
  );
};