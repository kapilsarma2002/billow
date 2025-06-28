import React from 'react';
import { Card } from '../ui/Card';
import { revenueData } from '../../utils/mockData';

export const RevenueChart: React.FC = () => {
  const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
  const minRevenue = Math.min(...revenueData.map(d => d.revenue));
  const range = maxRevenue - minRevenue;

  const getYPosition = (revenue: number) => {
    const normalized = (revenue - minRevenue) / range;
    return 200 - (normalized * 160); // 200 is chart height, 160 is usable height (with padding)
  };

  const points = revenueData.map((data, index) => ({
    x: 50 + (index * 60), // 50 offset + 60px spacing
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
        <p className="text-sm text-gray-600 dark:text-gray-400">Revenue trends over the past 12 months</p>
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
          <path
            d={`${pathData} L ${points[points.length - 1].x} 240 L ${points[0].x} 240 Z`}
            fill="url(#revenueGradient)"
            opacity="0.6"
          />

          {/* Main line */}
          <path
            d={pathData}
            stroke="url(#lineGradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />

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

        {/* Hover tooltips would go here in a real implementation */}
      </div>
    </Card>
  );
};