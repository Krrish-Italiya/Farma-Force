"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import userImg from "@/assets/user img.jpg";
import bannerBg from "@/assets/banner bg.jpg";
import { useAuth } from "@/contexts/AuthContext";

// Import SVG icons
import CalendarIcon from "@/assets/Calander.svg";
import KPIIcon from "@/assets/KPI Dashboard.svg";
import AIIcon from "@/assets/AI.svg";
import AlertsIcon from "@/assets/Alerts.svg";
import CommunicationIcon from "@/assets/Communication.svg";
import PerformanceIcon from "@/assets/Performance.svg";
import ProfileIcon from "@/assets/Profile.svg";
import HomeIcon from "@/assets/home-dashboard.png";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const menuItems = [
    { title: "Home", icon: HomeIcon },
    { title: "Navigation & Scheduling", icon: CalendarIcon },
    { title: "KPI Dashboard", icon: KPIIcon },
    { title: "Trend Analysis", icon: PerformanceIcon },
    { title: "AI Recommendation", icon: AIIcon },
    { title: "Alerts", icon: AlertsIcon },
    { title: "Communication", icon: CommunicationIcon },
    { title: "Profile", icon: ProfileIcon },
  ];

  //  Allow ESC key to close sidebar
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const handleMenuClick = (title: string) => {
    onClose();
    switch (title) {
      case "Navigation & Scheduling":
        router.push("/navigation");
        break;
      case "Home":
        router.push("/dashboard");
        break;
      case "Profile":
        router.push("/profile");
        break;
      case "KPI Dashboard":
        router.push("/kpi-dashboard");
        break;
      case "Trend Analysis":
        router.push("/trend-analysis");
        break;
      case "Alerts":
        router.push("/alerts");
        break;
      case "Communication":
        router.push("/communication");
        break;
      case "AI Recommendation":
        router.push("/ai-insights");
        break;
      // Add more navigation cases as needed
      default:
        break;
    }
  };

  return (
    <>
      {/* Backdrop with blur */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ease-in-out 
          ${isOpen ? "opacity-100 z-40" : "opacity-0 pointer-events-none z-0"}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-dvh max-h-screen w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0 z-50" : "-translate-x-full z-50"} flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]`}
      >
        {/* Header Section with Banner Background */}
        <div className="relative h-48 overflow-hidden">
          {/* Banner Background */}
          <div className="absolute inset-0">
            <Image
              src={bannerBg}
              alt="Banner Background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[rgba(73,28,124,0.88)]"></div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white hover:text-gray-200 transition-colors z-20"
          >
            <svg
              className="w-6 h-6"
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

                     {/* Profile Image */}
           <div className="relative z-10 flex flex-col items-center justify-center h-full">
             <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg mb-2">
               <Image
                 src={user?.profileImage || userImg}
                 alt="Profile"
                 width={80}
                 height={80}
                 className="w-full h-full object-cover"
               />
             </div>

            {/* User Info */}
            <h3 className="text-white font-semibold text-base">
              {user?.name || "User"}
            </h3>
            <p className="text-white text-sm opacity-80">
              {user?.employeeId ? `Employee ID: ${user.employeeId}` : "Sales Representative"}
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="py-2 flex-1 overflow-y-auto">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleMenuClick(item.title)}
                className="w-full flex items-center px-6 py-3 text-left hover:bg-gray-100 transition-colors"
              >
                <div className="w-6 h-6 mr-4 flex items-center justify-center">
                  {typeof item.icon === "string" ? (
                    <span className="text-lg">{item.icon}</span>
                  ) : (
                    <Image
                      src={item.icon}
                      alt={item.title}
                      className="w-5 h-5"
                    />
                  )}
                </div>
                <span className="text-gray-800 text-sm font-medium">
                  {item.title}
                </span>
              </button>
            ))}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-200 shrink-0">
            <button
              onClick={logout}
              className="w-full flex items-center px-6 py-3 text-left hover:bg-red-50 transition-colors"
            >
              <svg
                className="w-5 h-5 text-red-500 mr-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="text-red-500 text-sm font-medium">Log out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
