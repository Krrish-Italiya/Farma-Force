"use client";
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, Lightbulb } from 'lucide-react';
import { performanceAPI, alertsAPI, reportsAPI } from '@/services/apiService';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import blueLogo from '@/assets/blue logo.png';
import bellIcon from '@/assets/Bell Icon.svg';
import messageIcon from '@/assets/Message Icon.svg';

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  label: string;
  date?: string;
}

interface PerformanceData {
  data: Array<{
    month?: string;
    value?: number;
    sales?: number;
    calls?: number;
    coverage?: number;
    frequency?: number;
    target?: number;
    achieved?: number;
    date?: string;
  }>;
  summary?: {
    latestAmount?: number;
    growth?: number;
    growthType?: string;
    period?: string;
    company?: string;
    totalCalls?: number;
    avgCoverage?: string;
    avgFrequency?: string;
  };
}

interface Alert {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  isSelected: boolean;
  createdAt: string;
  description?: string;
  category: 'Coverage' | 'Frequency' | 'Product' | 'Appointment' | 'Territory';
}

export default function KPIDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("Daily");
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [crosshairX, setCrosshairX] = useState<number | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Alerts state
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Latest');
  // User KPI targets from profile
  const [kpiTargets, setKpiTargets] = useState<{ callRateTarget: number; customerCoverage: number; frequencyOfVisits: number }>({
    callRateTarget: 90,
    customerCoverage: 85,
    frequencyOfVisits: 15
  });

  // Load targets from user profile so changes on profile reflect here
  useEffect(() => {
    const loadTargets = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL;
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!API_BASE || !token) return;
        const res = await fetch(`${API_BASE}/api/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data?.kpiThresholds) {
            setKpiTargets({
              callRateTarget: Number(data.kpiThresholds.callRateTarget ?? 90),
              customerCoverage: Number(data.kpiThresholds.customerCoverage ?? 85),
              frequencyOfVisits: Number(data.kpiThresholds.frequencyOfVisits ?? 15)
            });
          }
        }
      } catch {}
    };

    loadTargets();
    // Refresh when returning to this tab
    const onVis = () => { if (!document.hidden) loadTargets(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  
  // Fetch performance data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const period = selectedPeriod.toLowerCase();
        const response = await performanceAPI.getPerformanceData('FarmaForce', period);
        setPerformanceData(response);
        
        // Trigger animation after data loads
        setTimeout(() => {
          setAnimationProgress(1);
        }, 300);
        
      } catch (err) {
        console.error('Error fetching performance data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod]);

  // Fetch alerts from backend
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setAlertsLoading(true);
        setAlertsError(null);
        
        const response = await alertsAPI.getAlerts();
        
        if (response.success) {
          // Sort alerts by priority (High > Medium > Low) and then by creation time (latest first)
          const sortedAlerts = response.data.sort((a: Alert, b: Alert) => {
            const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            
            if (priorityDiff !== 0) return priorityDiff;
            
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          
          setAlerts(sortedAlerts);
        } else {
          throw new Error('Failed to load alerts');
        }
      } catch (err) {
        console.error('Error fetching alerts:', err);
        setAlertsError(err instanceof Error ? err.message : 'Failed to fetch alerts');
        
        // Fallback to mock data
        const mockAlerts: Alert[] = [
          {
            id: "1",
            title: "Low coverage in North region",
            priority: "High",
            isSelected: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            category: "Coverage"
          },
          {
            id: "2",
            title: "Call frequency below target",
            priority: "Medium",
            isSelected: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
            category: "Frequency"
          },
          {
            id: "3",
            title: "Product samples running low",
            priority: "Low",
            isSelected: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
            category: "Product"
          },
          {
            id: "4",
            title: "Territory coverage gap identified",
            priority: "High",
            isSelected: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
            category: "Territory"
          },
          {
            id: "5",
            title: "Sales target achievement lagging",
            priority: "Medium",
            isSelected: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 13).toISOString(),
            category: "Product"
          }
        ];
        setAlerts(mockAlerts);
      } finally {
        setAlertsLoading(false);
      }
    };

    fetchAlerts();
  }, []);
  
  // Process chart data from backend
  const getChartData = (): Array<{ day: string; value: number; date?: string }> => {
    if (!performanceData?.data || performanceData.data.length === 0) {
      // Fallback mock data
      return [
        { day: 'Mon', value: 45 },
        { day: 'Tue', value: 52 },
        { day: 'Wed', value: 38 },
        { day: 'Thu', value: 61 },
        { day: 'Fri', value: 55 },
        { day: 'Sat', value: 67 },
        { day: 'Sun', value: 73 }
      ];
    }

    const data = performanceData.data.slice(-7); // Get last 7 data points
    return data.map((item: any, index: number) => ({
      day: item.month ? item.month.substring(0, 3) : `Day ${index + 1}`,
      value: item.value || item.sales || 0,
      date: item.date
    }));
  };
  
  const chartData = getChartData();
  const maxValue = chartData.length > 0 ? Math.max(...chartData.map(d => d.value)) : 0;
  const safeMaxValue = Math.max(1, maxValue);

  // Chart layout (in viewBox units)
  const viewBoxWidth = 300;
  const viewBoxHeight = 100;
  const marginLeft = 20;
  const marginRight = 20;
  const marginTop = 10;
  const marginBottom = 10;
  const plotWidth = viewBoxWidth - marginLeft - marginRight; // 260
  const plotHeight = viewBoxHeight - marginTop - marginBottom; // 80
  
  // Calculate chart points
  const pointCount = chartData.length;
  const xStep = pointCount > 1 ? plotWidth / (pointCount - 1) : 0;
  const yForValue = (v: number) => marginTop + (plotHeight - (v / safeMaxValue) * plotHeight);

  const currentData = chartData.map((point, index) => ({
    x: marginLeft + index * xStep,
    y: yForValue(point.value),
    value: point.value,
    label: point.day,
    date: point.date
  }));
  
  const pathPoints = currentData.map(point => `${point.x},${point.y}`).join(' ');

  // Axis ticks and formatters
  const yTicks = [0, Math.round(safeMaxValue * 0.5), safeMaxValue];
  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return `${n}`;
  };

  // Scrubbing interaction helpers
  const getNearestPointByClientX = (clientX: number) => {
    const element = svgRef.current;
    if (!element || currentData.length === 0) return null;
    const rect = element.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * viewBoxWidth;
    let nearest: ChartPoint | null = null;
    let minDist = Infinity;
    for (const p of currentData) {
      const dist = Math.abs(relX - p.x);
      if (dist < minDist) {
        minDist = dist;
        nearest = p;
      }
    }
    return nearest;
  };
  
  // Get sales data from backend
  const currentValue = performanceData?.summary?.latestAmount || 24000;
  const growthPercent = performanceData?.summary?.growth || 12;

  // Filter and sort alerts
  const getFilteredAlerts = (): Alert[] => {
    let filtered = alerts;

    // Apply filter based on selection
    if (selectedFilter !== 'Latest') {
      filtered = alerts.filter(alert => {
        const matches = alert.priority === selectedFilter;
        console.log(`Alert: ${alert.title}, Priority: ${alert.priority}, Filter: ${selectedFilter}, Matches: ${matches}`);
        return matches;
      });
    }

    console.log(`Filtered alerts count: ${filtered.length}, Selected filter: ${selectedFilter}`);

    // Sort by priority and then by creation time
    return filtered.sort((a, b) => {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }).slice(0, 3); // Show only top 3 alerts
  };

  const filteredAlerts = getFilteredAlerts();
  // Export handlers
  const [exportOpen, setExportOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const handleEmailReport = async () => {
    try {
      setExportLoading(true);
      const userJson = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = userJson ? JSON.parse(userJson) : null;
      const userName = user?.name || 'User';
      await reportsAPI.emailKPIReport({ period: selectedPeriod.toLowerCase(), userName, alerts: filteredAlerts });
      alert('Report emailed to your registered email.');
    } catch (e) {
      alert((e instanceof Error ? e.message : 'Failed to email report'));
    } finally {
      setExportLoading(false);
      setExportOpen(false);
    }
  };
  const handleDownloadReport = async () => {
    try {
      setExportLoading(true);
      await reportsAPI.downloadKPIReport({ period: selectedPeriod.toLowerCase() });
    } catch (e) {
      alert((e instanceof Error ? e.message : 'Failed to download report'));
    } finally {
      setExportLoading(false);
      setExportOpen(false);
    }
  };


  // Filter dropdown methods
  const handleFilterSelect = (filter: string) => {
    console.log('Filter selected:', filter);
    setSelectedFilter(filter);
    setShowFilterDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showFilterDropdown && !target.closest('.filter-dropdown')) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700 border-red-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Format time ago
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${diffInDays}d ago`;
    }
  };

  return (
    <ProtectedRoute>
      <div
        className="min-h-screen bg-gray-50 font-inter"
        style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
      >
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {/* Header - copied from Dashboard */}
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

        {/* Main Content */}
        <div className="px-4 py-6 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">KPI Dashboard</h1>
            <div className="relative">
              <button
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-black"
                onClick={() => setExportOpen((v) => !v)}
                disabled={exportLoading}
              >
                {exportLoading ? 'Processing…' : 'Export'}
              </button>
              {exportOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg border shadow-lg z-20">
                  <button onClick={handleEmailReport} className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50">Email report</button>
                  <button onClick={handleDownloadReport} className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50">Download PDF</button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end">
            <Link href="/profile" className="text-sm text-[rgba(73,28,124,1)] hover:text-purple-800 underline underline-offset-2">Adjust target</Link>
          </div>
        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 gap-4 p-0">
          {/* Call Rate Card */}
          <div className="bg-white rounded-2xl p-4 border-2 border-purple-200">
            <h3 className="text-sm font-medium text-gray-800 mb-3">Call Rate</h3>
            <div className="bg-[rgba(73,28,124,0.88)] rounded-xl p-4 text-center">
              <div className="text-lg font-bold text-white">75/{kpiTargets.callRateTarget}</div>
            </div>
          </div>

          {/* Frequency Card */}
          <div className="bg-white rounded-2xl p-4 border-2 border-purple-200">
            <h3 className="text-sm font-medium text-gray-800 mb-3">Frequency</h3>
            <div className="bg-[rgba(73,28,124,0.88)] rounded-xl p-4 text-center">
              <div className="text-lg font-bold text-white">12/{kpiTargets.frequencyOfVisits}</div>
            </div>
          </div>
        </div>

        {/* Customer Coverage Card */}
        <div className="bg-white rounded-2xl p-4 border-2 border-purple-200">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Customer Coverage</h3>
          <div className="bg-teal-500 rounded-xl p-6 text-center">
            <div className="text-lg font-bold text-black">82% / {kpiTargets.customerCoverage}%</div>
          </div>
        </div>

         {/* Alerts Section */}
         <div className="bg-white rounded-2xl p-6 shadow-sm">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center space-x-2">
               <AlertTriangle className="w-5 h-5 text-red-500" />
               <h3 className="text-lg font-semibold text-gray-800">Alerts</h3>
             </div>
             <div className="relative filter-dropdown">
               <button 
                 className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors px-3 py-1 rounded-lg hover:bg-gray-100"
                 onClick={(e) => {
                   e.stopPropagation();
                   setShowFilterDropdown(!showFilterDropdown);
                 }}
               >
                 <span className="text-sm">{selectedFilter}</span>
                 <svg className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                 </svg>
               </button>
               
               {showFilterDropdown && (
                 <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                   {['Latest', 'High', 'Medium', 'Low'].map((filter) => (
                     <button
                       key={filter}
                       onClick={(e) => {
                         e.stopPropagation();
                         handleFilterSelect(filter);
                       }}
                       className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                         selectedFilter === filter ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                       }`}
                     >
                       {filter}
                     </button>
                   ))}
                 </div>
               )}
             </div>
           </div>

           {alertsLoading ? (
             <div className="flex items-center justify-center py-8">
               <div className="animate-spin rounded-full  w-6 border-b-2 border-purple-600"></div>
             </div>
           ) : alertsError ? (
             <div className="text-center py-4 text-red-500 text-sm">
               Failed to load alerts
             </div>
           ) : filteredAlerts.length === 0 ? (
             <div className="text-center py-8 text-gray-500 text-sm">
               No alerts found
             </div>
           ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      alert.priority === 'High' ? 'text-red-500' : 
                      alert.priority === 'Medium' ? 'text-yellow-500' : 'text-green-500'
                    }`} />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 mb-2">
                        {alert.title}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          alert.priority === 'High' 
                            ? 'bg-red-500 text-white' 
                            : alert.priority === 'Medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {alert.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(alert.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
         </div>

         {/* Sales Performance Section */}
         <div className="bg-white rounded-2xl p-6 shadow-sm">
           <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Performance</h3>
           
           {/* Period Toggle */}
           <div className="flex space-x-2 mb-6">
             {["Daily", "Weekly", "Monthly"].map((period) => (
               <button
                 key={period}
                 onClick={() => setSelectedPeriod(period)}
                 className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                   selectedPeriod === period
                     ? "bg-[rgba(73,28,124,0.88)] text-white shadow-sm"
                     : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                 }`}
               >
                 {period}
               </button>
             ))}
           </div>

           {/* Sales Summary */}
           <div className="flex justify-between items-start mb-6">
             <div>
               <p className="text-sm text-gray-600 mb-2">Amount</p>
               <p className="text-sm text-gray-600">Summary</p>
             </div>
             <div className="text-right">
               <p className="text-xl font-bold text-gray-800 mb-2">
                 ${currentValue.toLocaleString()}
               </p>
               <p className={`text-sm font-medium ${
                 growthPercent >= 0 ? 'text-green-600' : 'text-red-600'
               }`}>
                 {growthPercent >= 0 ? '+' : ''}{growthPercent}% vs last period
               </p>
             </div>
           </div>

          {/* Interactive Line Chart */}
          <div className="h-40 bg-gray-50 rounded-lg p-4 relative">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 bg-[rgba(73,28,124,0.88)]"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full text-red-500 text-sm">
                Failed to load chart data
              </div>
            ) : (
              <>
                {/* Dynamic Y-axis labels and grid */}
                {yTicks.map((t, i) => (
                  <div
                    key={i}
                    className="absolute left-2 text-[10px] text-gray-400"
                    style={{ top: `${(marginTop + (plotHeight - (t / safeMaxValue) * plotHeight)) / viewBoxHeight * 100}%` }}
                  >
                    {formatNumber(t)}
                  </div>
                ))}
                {/* Grid lines matching ticks */}
                {yTicks.map((t, i) => (
                  <div
                    key={`grid-${i}`}
                    className="absolute left-4 right-4 border-b border-dashed border-gray-300"
                    style={{ top: `${(marginTop + (plotHeight - (t / safeMaxValue) * plotHeight)) / viewBoxHeight * 100}%` }}
                  />
                ))}

                {/* Mobile-friendly tooltip */}
                {hoveredPoint && (
                  <div 
                    className="absolute bg-white px-3 py-2 rounded-lg shadow-lg border text-xs font-medium z-10 transform -translate-x-1/2 -translate-y-full pointer-events-none"
                    style={{ 
                      left: `${((hoveredPoint.x - marginLeft) / plotWidth) * 100}%`, 
                      top: `${((hoveredPoint.y - marginTop) / plotHeight) * 100}%` 
                    }}
                  >
                    <div className="text-gray-600">{hoveredPoint.label}</div>
                    <div className="font-bold text-gray-800">${hoveredPoint.value.toLocaleString()}</div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                    </div>
                  </div>
                )}
                
                {/* Interactive SVG Chart */}
                <svg 
                  ref={svgRef}
                  className="w-full h-full cursor-crosshair" 
                  viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} 
                  preserveAspectRatio="none"
                  onMouseLeave={() => { setHoveredPoint(null); setCrosshairX(null); }}
                  onMouseMove={(e) => {
                    const nearest = getNearestPointByClientX(e.clientX);
                    if (nearest) {
                      setHoveredPoint(nearest);
                      setCrosshairX(nearest.x);
                    }
                  }}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    const nearest = getNearestPointByClientX(touch.clientX);
                    if (nearest) {
                      setHoveredPoint(nearest);
                      setCrosshairX(nearest.x);
                    }
                  }}
                  onTouchMove={(e) => {
                    const touch = e.touches[0];
                    const nearest = getNearestPointByClientX(touch.clientX);
                    if (nearest) {
                      setHoveredPoint(nearest);
                      setCrosshairX(nearest.x);
                    }
                  }}
                >
                  {/* Animated gradient area under the line */}
                  <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
                    </linearGradient>
                    <clipPath id="animationClip">
                      <rect 
                        x="0" 
                        y="0" 
                        width={`${animationProgress * 100}%`} 
                        height="100"
                        className="transition-all duration-2000 ease-out"
                      />
                    </clipPath>
                  </defs>
                  
                  {/* Area under the curve */}
                  <polygon
                    fill="url(#areaGradient)"
                    points={`${pathPoints} ${viewBoxWidth},${viewBoxHeight - marginBottom} ${marginLeft},${viewBoxHeight - marginBottom}`}
                    clipPath="url(#animationClip)"
                  />
                  
                  {/* Main line with animation */}
                  <polyline
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    points={pathPoints}
                    clipPath="url(#animationClip)"
                    className="drop-shadow-sm"
                  />
                  
                  {/* Crosshair */}
                  {crosshairX !== null && (
                    <line
                      x1={crosshairX}
                      y1={marginTop}
                      x2={crosshairX}
                      y2={viewBoxHeight - marginBottom}
                      stroke="#9CA3AF"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                  )}

                  {/* Interactive data points */}
                  {currentData.map((point, index) => (
                    <g key={index}>
                      {/* Invisible larger circle for easier touch interaction */}
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="12"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(point)}
                        onClick={() => setHoveredPoint(point)}
                      />
                      
                      {/* Visible data point */}
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={hoveredPoint === point ? "3.5" : "2"}
                        fill="#10B981"
                        stroke="white"
                        strokeWidth="1.5"
                        className="transition-all duration-200 cursor-pointer"
                        style={{
                          opacity: animationProgress > (index / (currentData?.length || 1)) ? 1 : 0
                        }}
                        onMouseEnter={() => setHoveredPoint(point)}
                        onClick={() => setHoveredPoint(point)}
                      />
                      
                      {/* Pulse animation on hover */}
                      {hoveredPoint === point && (
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="3.5"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="1.5"
                          opacity="0.6"
                          className="animate-ping"
                        />
                      )}
                    </g>
                  ))}
                </svg>

                {/* X-axis labels */}
                <div className="absolute left-4 right-4 bottom-1 flex justify-between text-[10px] text-gray-500">
                  {chartData.map((d, i) => (
                    <span key={`xl-${i}`} className="truncate" style={{ width: `${100 / Math.max(1, chartData.length)}%` }}>
                      {d.day}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* AI Suggestions Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-800">AI Suggestions</h3>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 mb-3">
              Based on your recent performance, increasing visit frequency to key customers could improve your overall coverage metrics.
            </p>
            <button className="bg-[rgba(73,28,124,0.88)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
              Take Action
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button - match Trend Analysis */}
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
    </ProtectedRoute>
  );
}