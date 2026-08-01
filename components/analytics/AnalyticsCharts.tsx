'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  DayActivityData,
  CategoryData,
  PriorityData,
} from '@/lib/analytics';
import { useTheme } from '@/components/ui/ThemeProvider';

interface AnalyticsChartsProps {
  trendData: DayActivityData[];
  categoryData: CategoryData[];
  priorityData: PriorityData[];
}

// Distinct purple/indigo palette for categories with high contrast & full saturation
const CATEGORY_COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#64748B', // Slate
];

export function AnalyticsCharts({
  trendData,
  categoryData,
  priorityData,
}: AnalyticsChartsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartTextColor = isDark ? '#E8E8E8' : '#2D3748';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  const tooltipBg = isDark ? '#2D3142' : '#E0E5EC';
  const tooltipBorder = isDark ? '#363B52' : '#A3B1C6';

  return (
    <div className="space-y-6">
      {/* 2-Column Grid: Completion Trend Line Chart | Created vs Completed Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Trend Line Chart */}
        <div className="bg-[var(--bg-base)] neu-raised p-6 rounded-3xl">
          <div className="mb-4">
            <h2 className="text-base font-extrabold text-[var(--text-main)]">
              14-Day Completion Trend
            </h2>
            <p className="text-xs text-[var(--text-main)] opacity-70 font-medium">
              Tasks completed per day over the last two weeks
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke={chartTextColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: gridColor }}
                />
                <YAxis
                  stroke={chartTextColor}
                  fontSize={11}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={{ stroke: gridColor }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '16px',
                    fontSize: '12px',
                    color: isDark ? '#E8E8E8' : '#2D3748',
                    boxShadow: isDark
                      ? '4px 4px 10px #24273A, -4px -4px 10px #363B52'
                      : '4px 4px 10px #A3B1C6, -4px -4px 10px #FFFFFF',
                  }}
                  formatter={(value: any) => [`${value} tasks completed`, 'Completed']}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Completed Tasks"
                  stroke="#7C3AED"
                  strokeWidth={3.5}
                  dot={{ r: 5, fill: '#7C3AED', strokeWidth: 2, stroke: '#FFFFFF' }}
                  activeDot={{ r: 7, fill: '#6D28D9' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tasks Created vs Completed Bar Chart */}
        <div className="bg-[var(--bg-base)] neu-raised p-6 rounded-3xl">
          <div className="mb-4">
            <h2 className="text-base font-extrabold text-[var(--text-main)]">
              Tasks Created vs Completed
            </h2>
            <p className="text-xs text-[var(--text-main)] opacity-70 font-medium">
              Comparison of task creation & resolution rate over 14 days
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke={chartTextColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: gridColor }}
                />
                <YAxis
                  stroke={chartTextColor}
                  fontSize={11}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={{ stroke: gridColor }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '16px',
                    fontSize: '12px',
                    color: isDark ? '#E8E8E8' : '#2D3748',
                    boxShadow: isDark
                      ? '4px 4px 10px #24273A, -4px -4px 10px #363B52'
                      : '4px 4px 10px #A3B1C6, -4px -4px 10px #FFFFFF',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                />
                <Bar dataKey="created" name="Created" fill="#818CF8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Category Breakdown Pie Chart | Priority Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Pie Chart */}
        <div className="bg-[var(--bg-base)] neu-raised p-6 rounded-3xl">
          <div className="mb-4">
            <h2 className="text-base font-extrabold text-[var(--text-main)]">
              Category Breakdown
            </h2>
            <p className="text-xs text-[var(--text-main)] opacity-70 font-medium">
              Distribution of tasks across categories
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {categoryData.length === 0 ? (
              <p className="text-xs font-semibold text-[var(--text-main)] opacity-60">No categories found</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '16px',
                      fontSize: '12px',
                      color: isDark ? '#E8E8E8' : '#2D3748',
                    }}
                    formatter={(value: any, name: any, item: any) => [
                      `${value} tasks (${item.payload.percentage}%)`,
                      item.payload.name,
                    ]}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Priority Distribution Horizontal Bar Chart */}
        <div className="bg-[var(--bg-base)] neu-raised p-6 rounded-3xl">
          <div className="mb-4">
            <h2 className="text-base font-extrabold text-[var(--text-main)]">
              Priority Distribution
            </h2>
            <p className="text-xs text-[var(--text-main)] opacity-70 font-medium">
              Task count color-coded by priority level
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={priorityData}
                margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" stroke={chartTextColor} fontSize={11} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke={chartTextColor}
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '16px',
                    fontSize: '12px',
                    color: isDark ? '#E8E8E8' : '#2D3748',
                  }}
                  formatter={(value: any) => [`${value} tasks`, 'Count']}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-priority-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
