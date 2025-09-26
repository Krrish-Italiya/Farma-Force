"use client";

import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Tooltip } from "recharts";
import Image from "next/image";
import Link from "next/link";
import blueLogo from "@/assets/blue logo.png";
import bellIcon from "@/assets/Bell Icon.svg";
import messageIcon from "@/assets/Message Icon.svg";
import Sidebar from "@/components/Sidebar";

interface SalesPoint {
  year: number;
  sales: number;
}

interface SalesTrend {
  company: string;
  metric: string;
  unit: string;
  data: SalesPoint[];
}

interface PerformanceData {
  month: string;
  value: number;
  calls: number;
  coverage: number;
  frequency: number;
  target: number;
  achieved: number;
}

interface PerformanceResponse {
  success: boolean;
  data: PerformanceData[];
  fiscalYearData?: {
    fiscal_year: number;
    monthly_sales_aud: Record<string, number>;
    total_revenue_aud: number;
    note: string;
  };
  summary: {
    latestAmount: number;
    growth: number;
    growthType: 'positive' | 'negative' | 'neutral';
    period: string;
    company: string;
    totalCalls: number;
    avgCoverage: string;
    avgFrequency: string;
  };
}

interface ProductCategory {
  name: string;
  sales_aud: number;
  percentage: number;
  growth: number;
  target: number;
  achieved: number;
}

interface ProductCategoriesResponse {
  success: boolean;
  data: {
    company: string;
    fiscal_year: number;
    categories: ProductCategory[];
    total_sales: number;
    note: string;
  };
}

interface ProductData {
  name: string;
  value: number;
  color: string;
}

interface MarketShareData {
  company: string;
  share: number;
  color: string;
}

const TrendAnalysisPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePeriod, setActivePeriod] = useState("Today");
  const [activeMetric, setActiveMetric] = useState("Product Sales");
  const [trend, setTrend] = useState<SalesTrend | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [fiscalYearData, setFiscalYearData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const periods = ["Today", "Weekly", "Monthly", "Quarterly", "Custom"];
  const metrics = ["Call Rate", "Customer Coverage", "Frequency", "Product Sales"];

  const marketShareData: MarketShareData[] = [
    { company: "FarmaForce", share: 50, color: "#1e40af" },
    { company: "Competitor 1", share: 20, color: "#a78bfa" },
    { company: "Competitor 2", share: 30, color: "#f59e0b" },
  ];

  useEffect(() => {
    const loadPerformanceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const metricParam = (
          activeMetric === 'Product Sales' ? 'sales' :
          activeMetric === 'Call Rate' ? 'calls' :
          activeMetric === 'Customer Coverage' ? 'coverage' :
          activeMetric === 'Frequency' ? 'frequency' : 'sales'
        );
        const params = new URLSearchParams();
        params.set('company', 'FarmaForce');
        params.set('metric', metricParam);
        if (activePeriod === 'Custom' && customStartDate && customEndDate) {
          params.set('period', 'custom');
          params.set('start', customStartDate);
          params.set('end', customEndDate);
        } else {
          params.set('period', activePeriod.toLowerCase());
        }

        const response = await fetch(`${apiUrl}/api/trends/performance?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: PerformanceResponse = await response.json();
        
        if (data.success) {
          setPerformanceData(data.data);
          setFiscalYearData(data.fiscalYearData || null);
          
          // Update trend data for compatibility
          setTrend({
            company: data.summary.company,
            metric: metricParam,
            unit: metricParam === 'sales' ? 'USD' : metricParam === 'calls' ? 'Calls' : metricParam === 'coverage' ? '%' : 'Visits',
            data: data.data.map((item, index) => ({ year: index + 1, sales: item.value }))
          });
        } else {
          throw new Error('Failed to load performance data');
        }
      } catch (error) {
        console.error("Error loading performance data:", error);
        setError(error instanceof Error ? error.message : 'Failed to load data');
        // Fallback to mock data if API fails
        setPerformanceData([
          { month: "Jan", value: 20000, calls: 150, coverage: 85, frequency: 3.2, target: 22000, achieved: 91 },
          { month: "Feb", value: 18000, calls: 140, coverage: 82, frequency: 3.0, target: 20000, achieved: 90 },
          { month: "Mar", value: 22000, calls: 165, coverage: 88, frequency: 3.5, target: 21000, achieved: 105 },
          { month: "Apr", value: 21000, calls: 160, coverage: 86, frequency: 3.3, target: 21500, achieved: 98 },
          { month: "May", value: 23000, calls: 175, coverage: 90, frequency: 3.7, target: 22500, achieved: 102 },
          { month: "Jun", value: 24000, calls: 180, coverage: 92, frequency: 3.8, target: 23000, achieved: 104 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    const loadProductCategories = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const response = await fetch(`${apiUrl}/api/trends/product-categories?company=FarmaForce`);
        
        if (response.ok) {
          const data: ProductCategoriesResponse = await response.json();
          if (data.success) {
            setProductCategories(data.data.categories);
          }
        }
      } catch (error) {
        console.error("Error loading product categories:", error);
      }
    };
    
    loadPerformanceData();
    loadProductCategories();
  }, [activePeriod, activeMetric, customStartDate, customEndDate]);

  const latestAmount = performanceData.length > 0 ? performanceData[performanceData.length - 1].value : 24000;
  const latestDisplay = activePeriod === "Monthly" && fiscalYearData 
    ? `AUD $${(latestAmount / 1000000).toFixed(1)}M` 
    : `$${latestAmount}`;

  // Calculate growth percentage
  const getGrowthPercentage = () => {
    if (activePeriod === "Monthly" && fiscalYearData) {
      return 0; // No growth for fiscal year data as all values are equal
    }
    
    if (performanceData.length < 2) return 12; // Default fallback
    const latest = performanceData[performanceData.length - 1];
    const previous = performanceData[performanceData.length - 2];
    return previous ? Math.round(((latest.value - previous.value) / previous.value) * 100) : 12;
  };

  const growthPercentage = getGrowthPercentage();
  const isGrowthPositive = growthPercentage > 0;
  const isGrowthNeutral = growthPercentage === 0;

  // Transform product categories for charts
  const productData: ProductData[] = productCategories.map((category, index) => {
    const colors = ["#8b5cf6", "#1e40af", "#f59e0b", "#10b981", "#ef4444", "#06b6d4"];
    return {
      name: category.name,
      value: category.percentage,
      color: colors[index % colors.length]
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm">
        <button 
          className="p-1"
          onClick={() => setSidebarOpen(true)}
        >
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div className="flex items-center justify-center flex-1">
          <Link href="/dashboard" aria-label="Go to dashboard">
            <Image src={blueLogo} alt="farmaforce" className="h-8 w-auto" />
          </Link>
        </div>

        <div className="flex items-center space-x-1">
          <Link href="/alerts" aria-label="Go to alerts" className="p-1">
            <Image src={bellIcon} alt="Notifications" className="w-6 h-6" />
          </Link>
          <Link href="/communication" aria-label="Go to communication" className="p-1">
            <Image src={messageIcon} alt="Messages" className="w-6 h-6" />
          </Link>
        </div>
      </div>

      {/* Page Content */}
      <div className="px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Trend Analysis</h1>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">Error: {error}</p>
          </div>
        )}

        {/* Period Filter */}
        <div className="relative">
          <div className="flex gap-2 overflow-auto pb-2">
            {periods.map((period) => (
              <button
                key={period}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                  activePeriod === period 
                    ? "bg-[rgba(73,28,124,0.88)] text-white" 
                    : "bg-white text-gray-700 border border-gray-200 hover:border-purple-300"
                }`}
                onClick={() => {
                  setActivePeriod(period);
                  if (period === 'Custom') {
                    setIsCustomOpen(true);
                  } else {
                    setIsCustomOpen(false);
                  }
                }}
              >
                {period}
              </button>
            ))}
          </div>

          {activePeriod === 'Custom' && (
            <div className="flex items-center gap-2 pb-2">
              {customStartDate && customEndDate ? (
                <span className="text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-2 py-1">
                  {customStartDate} → {customEndDate}
                </span>
              ) : (
                <span className="text-xs text-gray-500">Select a custom date range</span>
              )}
            </div>
          )}

          {isCustomOpen && activePeriod === 'Custom' && (
            <div className="absolute z-20 mt-1 w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">Start date</label>
                  <input
                    type="date"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    max={customEndDate || undefined}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">End date</label>
                  <input
                    type="date"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    min={customStartDate || undefined}
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setIsCustomOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-2 text-sm rounded-lg bg-[rgba(73,28,124,0.88)] text-white hover:bg-purple-700 disabled:opacity-50"
                  disabled={!customStartDate || !customEndDate}
                  onClick={() => {
                    setIsCustomOpen(false);
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {metrics.map((metric) => (
            <button
              key={metric}
              className={`px-3 py-3 rounded-xl text-sm border transition-all min-h-[48px] flex items-center justify-center ${
                activeMetric === metric 
                  ? "bg-white border-blue-500 text-gray-900 shadow-lg ring-2 ring-blue-200" 
                  : "bg-white border-gray-200 text-gray-700 hover:border-blue-300"
              }`}
              onClick={() => setActiveMetric(metric)}
            >
              {metric}
            </button>
          ))}
        </div>

        {/* Performance Over Time Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              {activePeriod === "Monthly" && activeMetric === 'Product Sales' ? 'Fiscal Year Sales' : `${activeMetric} Over Time`}
            </h3>
            <div className="mt-3 flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500">
                  {activeMetric === 'Product Sales' ? (activePeriod === 'Monthly' ? 'Monthly Revenue (AUD)' : 'Amount') : activeMetric}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {activeMetric === 'Product Sales' ? latestDisplay : performanceData.length > 0 ? performanceData[performanceData.length - 1].value : 0}
                </p>
                {activePeriod === "Monthly" && fiscalYearData && (
                  <p className="text-xs text-gray-500 mt-1">
                    Total: AUD ${(fiscalYearData.total_revenue_aud / 1000000).toFixed(1)}M
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Summary</p>
                <p className={`text-sm font-semibold ${
                  isGrowthNeutral ? 'text-gray-600' : 
                  isGrowthPositive ? 'text-green-600' : 'text-red-500'
                }`}>
                  {isGrowthNeutral ? '0%' : 
                   isGrowthPositive ? '+' : '-'}{growthPercentage}% vs last period
                </p>
                {activePeriod === "Monthly" && fiscalYearData && (
                  <p className="text-xs text-gray-500 mt-1">{fiscalYearData.note}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="h-48">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgba(73,28,124,0.88)]"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value) => {
                        const label = activeMetric === 'Product Sales' ? 'Sales' : activeMetric;
                        if (activeMetric === 'Product Sales') {
                          return [activePeriod === 'Monthly' ? `AUD $${(Number(value) / 1000).toFixed(0)}K` : `$${value}`, label];
                        }
                        return [String(value), label];
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#22c55e" 
                      strokeWidth={3}
                      dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#16a34a' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Product Categories Card - Only show for Monthly */}
        {activePeriod === "Monthly" && productCategories.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Product Categories Performance</h3>
              <div className="mt-3 flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Sales (AUD)</p>
                  <p className="text-xl font-bold text-gray-900">
                    AUD ${(productCategories.reduce((sum, cat) => sum + (Number(cat.sales_aud) || 0), 0) / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Fiscal Year</p>
                  <p className="text-sm font-semibold text-gray-900">2022</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Categories List */}
                <div className="space-y-3">
                  {productCategories.map((category) => (
                    <div key={category.name} className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: productData.find(p => p.name === category.name)?.color || '#6b7280' }}
                        ></div>
                        <div>
                          <span className="font-medium text-gray-900">{category.name}</span>
                          <p className="text-xs text-gray-500">
                            AUD ${((category.sales_aud || 0) / 1000000).toFixed(1)}M ({category.percentage}%)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${
                          category.growth >= 0 ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {category.growth >= 0 ? '+' : ''}{category.growth}%
                        </span>
                        <p className="text-xs text-gray-500">
                          Target: {category.achieved.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pie Chart */}
                <div className="flex justify-center">
                  <div className="w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={productData}
                          cx="50%"
                          cy="50%"
                          innerRadius={0}
                          outerRadius={80}
                          dataKey="value"
                          startAngle={90}
                          endAngle={450}
                        >
                          {productData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`${value}%`, 'Share']}
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Metrics Card - Only show for non-Monthly periods */}
        {activePeriod !== "Monthly" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Comparison Metrics</h3>
            </div>
            
            <div className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500">Sales by Product Category</p>
                  <p className="text-lg font-bold text-gray-900">$12,500</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Summary</p>
                  <p className="text-sm font-semibold text-red-500">-3% vs last period</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="space-y-3 mb-4">
                  {productData.map((product) => (
                    <div key={product.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: product.color }}
                        ></div>
                        <span className="text-gray-700">{product.name}</span>
                      </div>
                      <span className="font-medium text-gray-900">{product.value}%</span>
                    </div>
                  ))}
                </div>

                {/* Interactive Pie Chart */}
                <div className="flex justify-center">
                  <div className="w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={productData}
                          cx="50%"
                          cy="50%"
                          innerRadius={0}
                          outerRadius={70}
                          dataKey="value"
                          startAngle={90}
                          endAngle={450}
                        >
                          {productData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`${value}%`, 'Share']}
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Market Share Distribution Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Market Share Distribution</h3>
            <div className="mt-3 flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500">Amount</p>
                <p className="text-xl font-bold text-gray-900">32%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Summary</p>
                <p className="text-sm font-semibold text-green-600">+2% vs last period</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="space-y-3 mb-4">
                {marketShareData.map((company) => (
                  <div key={company.company} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: company.color }}
                      ></div>
                      <span className="text-gray-700">{company.company}</span>
                    </div>
                    <span className="font-medium text-gray-900">~{company.share}%</span>
                  </div>
                ))}
              </div>

              {/* Interactive Bar Chart */}
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={marketShareData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis 
                      dataKey="company" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      interval={0}
                    />
                    <YAxis hide />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Market Share']}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar 
                      dataKey="share" 
                      radius={[6, 6, 0, 0]}
                      fill="#8884d8"
                    >
                      {marketShareData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary Card */}
        <div className="mb-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">AI Summary</h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              {activePeriod === "Monthly" 
                ? "Your fiscal year 2022 shows consistent monthly revenue of AUD $966,667 with Cardiovascular products leading at 25% of total sales. The equal-split monthly distribution indicates stable performance throughout the year."
                : "Your product sales trend shows a steady increase over the last 3 months. However, Competitor B outperformed in Customer Coverage by 15%."
              }
            </p>
            <button className="mt-4 w-full bg-[rgba(73,28,124,0.88)] hover:bg-purple-200 text-white py-3 rounded-xl text-sm font-medium transition-colors">
              View AI Recommendations
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-16 right-6 z-50">
        <button className="w-14 h-14 bg-cyan-500 hover:bg-cyan-600 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TrendAnalysisPage;