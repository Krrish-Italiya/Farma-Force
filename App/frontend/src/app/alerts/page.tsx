"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import blueLogo from "@/assets/blue logo.png";
import bellIcon from "@/assets/Bell Icon.svg";
import messageIcon from "@/assets/Message Icon.svg";
import Sidebar from "@/components/Sidebar";

interface Alert {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  isSelected: boolean;
  createdAt: string;
  description?: string;
  category: 'Coverage' | 'Frequency' | 'Product' | 'Appointment' | 'Territory';
}

const AlertsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters = ["All", "High", "Medium", "Low", "Coverage", "Frequency"];

  // Fetch alerts from backend API
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const response = await fetch(`${apiUrl}/api/alerts`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Sort alerts by creation time (latest first)
          const sortedAlerts = data.data.sort((a: Alert, b: Alert) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setAlerts(sortedAlerts);
        } else {
          throw new Error('Failed to load alerts');
        }
      } catch (error) {
        console.error("Error loading alerts:", error);
        setError(error instanceof Error ? error.message : 'Failed to load alerts');
        
        // Fallback to mock data if API fails
        const mockAlerts: Alert[] = [
          {
            id: "1",
            title: "Low coverage in North region",
            priority: "High",
            isSelected: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            category: "Coverage"
          },
          {
            id: "2",
            title: "Call frequency below target",
            priority: "Medium",
            isSelected: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            category: "Frequency"
          },
          {
            id: "3",
            title: "Product X samples running low",
            priority: "Low",
            isSelected: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
            category: "Product"
          },
          {
            id: "4",
            title: "Missed appointments this week",
            priority: "Medium",
            isSelected: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
            category: "Appointment"
          },
          {
            id: "5",
            title: "Territory coverage gap identified",
            priority: "High",
            isSelected: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
            category: "Territory"
          }
        ];
        setAlerts(mockAlerts);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

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

  const toggleAlertSelection = async (id: string) => {
    try {
      const alert = alerts.find(a => a.id === id);
      if (!alert) return;
      
      const newSelectionState = !alert.isSelected;
      
      // Update local state immediately for better UX
      setAlerts(alerts.map(a => 
        a.id === id ? { ...a, isSelected: newSelectionState } : a
      ));
      
      // Sync with backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/alerts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isSelected: newSelectionState }),
      });
      
      if (!response.ok) {
        console.error('Failed to update alert selection');
        // Revert local state if API fails
        setAlerts(alerts.map(a => 
          a.id === id ? { ...a, isSelected: !newSelectionState } : a
        ));
      }
    } catch (error) {
      console.error('Error updating alert selection:', error);
      // Revert local state if API fails
      setAlerts(alerts.map(a => 
        a.id === id ? { ...a, isSelected: !a.isSelected } : a
      ));
    }
  };

  const dismissAlert = async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/alerts/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove alert from local state
        setAlerts(alerts.filter(alert => alert.id !== id));
      } else {
        console.error('Failed to dismiss alert');
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
      // Fallback: remove from local state even if API fails
      setAlerts(alerts.filter(alert => alert.id !== id));
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "All" || 
                        activeFilter === alert.priority || 
                        (activeFilter === "Coverage" && alert.category === "Coverage") ||
                        (activeFilter === "Frequency" && alert.category === "Frequency");
    
    return matchesSearch && matchesFilter;
  });

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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header - match Dashboard */}
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
        <h1 className="text-2xl font-bold text-gray-800">Alerts</h1>
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
  type="text"
  placeholder="Search alerts..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg text-sm 
             placeholder-gray-500 text-gray-700 focus:outline-none focus:ring-2 
             focus:ring-purple-200 focus:border-purple-300"
/>

        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                activeFilter === filter 
                  ? "bg-purple-100 text-[rgba(73,28,124,0.88)] border border-[rgba(73,28,124,0.88)]" 
                  : "bg-white text-gray-700 border border-gray-200 hover:border-[rgba(73,28,124,0.88)]"
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">Error: {error}</p>
          </div>
        )}

        {/* Alerts List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-start justify-between"
              >
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() => toggleAlertSelection(alert.id)}
                    className="mt-1"
                  >
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                      alert.isSelected 
                        ? "bg-purple-600 border-purple-600" 
                        : "border-gray-300"
                    }`}>
                      {alert.isSelected && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        {alert.title}
                      </p>
                      <span className="text-xs text-gray-500">
                        {getTimeAgo(alert.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(alert.priority)}`}>
                        {alert.priority}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {alert.category}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredAlerts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No alerts found</p>
          </div>
        )}
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

export default AlertsPage;
