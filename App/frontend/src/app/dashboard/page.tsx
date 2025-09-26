"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import userImg from "@/assets/user img.jpg";
import blueLogo from "@/assets/blue logo.png";
import bannerBg from "@/assets/banner bg.jpg";
import bellIcon from "@/assets/Bell Icon.svg";
import messageIcon from "@/assets/Message Icon.svg";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";

// Import SVG icons
import CalendarIcon from "@/assets/Calander.svg";
import KPIIcon from "@/assets/KPI Dashboard.svg";
import AIIcon from "@/assets/AI.svg";
import AlertsIcon from "@/assets/Alerts.svg";
import CommunicationIcon from "@/assets/Communication.svg";
import PerformanceIcon from "@/assets/Performance.svg";

interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  time: string;
  profileImg?: any;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [greeting, setGreeting] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good Morning");
    } else if (hour < 17) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }
  }, []);

  const quickAccessItems = [
    { title: "Navigation & Scheduling", icon: CalendarIcon, bgColor: "bg-blue-50", href: "/navigation" },
    { title: "KPI Dashboard", icon: KPIIcon, bgColor: "bg-green-50", href: "/kpi-dashboard" },
    { title: "Trend Analysis", icon: PerformanceIcon, bgColor: "bg-cyan-50", href: "/trend-analysis" },
    { title: "AI Recommendation", icon: AIIcon, bgColor: "bg-purple-50", href: "/ai-insights" },
    
    { title: "Alerts", icon: AlertsIcon, bgColor: "bg-orange-50", href: "/alerts" },
    { title: "Communication", icon: CommunicationIcon, bgColor: "bg-pink-50", href: "/communication" },
    
  ];

  const appointments: Appointment[] = [
    {
      id: "1",
      doctorName: "Dr. Mehta",
      specialty: "Cardiologist",
      time: "11:30 AM",
      profileImg: userImg,
    },
    {
      id: "2",
      doctorName: "Dr. Johnson",
      specialty: "Neurologist",
      time: "2:00 PM",
      profileImg: userImg,
    },
  ];

  return (
    <ProtectedRoute>
      <div
        className="min-h-screen bg-gray-50 font-inter"
        style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
      >
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
            <Image src={blueLogo} alt="farmaforce" className="h-8 w-auto" />
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
        <div className="px-4 py-6 space-y-6">
          {/* Greeting and Profile */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{greeting}</h1>
              <p className="text-gray-600">{user?.name || "Dr. John Smith"}</p>
            </div>
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md">
              <Image
                src={user?.profileImage || userImg}
                alt="User Profile"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Today's Target with Banner Background */}
          <div className="relative rounded-2xl overflow-hidden">
            {/* Banner Background */}
            <div className="absolute inset-0">
              <Image
                src={bannerBg}
                alt="Banner Background"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[rgba(73,28,124,0.88)]"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
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
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs opacity-90 font-medium">
                      Today's Target
                    </p>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-2xl font-bold">87%</span>
                      <span className="text-sm font-medium">Achieved</span>
                    </div>
                  </div>
                </div>

                {/* Progress Circle */}
                <div className="relative">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-600">
                      87%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Access */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Quick Access
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {quickAccessItems.map((item, index) => (
                <button
                  key={index}
                  className={`${item.bgColor} p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200`}
                  onClick={() => item.href && (window.location.href = item.href)}
                >
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <Image
                        src={item.icon}
                        alt={item.title}
                        className="w-8 h-8"
                      />
                    </div>
                    <p className="text-xs font-medium text-gray-700 leading-tight">
                      {item.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Today's Appointments */}
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Today's Appointments
            </h2>

            <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4"
                >
                  {/* Doctor Image + Info */}
                  <div className="flex items-center space-x-8">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      {appointment.profileImg ? (
                        <Image
                          src={appointment.profileImg}
                          alt={appointment.doctorName}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {appointment.doctorName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {appointment.specialty} • {appointment.time}
                      </p>
                    </div>
                  </div>

                  {/* Details Button */}
                  <button 
                    onClick={() => router.push('/navigation')}
                    className="bg-[rgba(73,28,124,0.88)] text-white px-4 py-1.5 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors"
                  >
                    Details
                  </button>
                </div>
              ))}
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
      </div>
    </ProtectedRoute>
  );
}
