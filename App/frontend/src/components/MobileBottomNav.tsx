"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import HomeIcon from "@/assets/home-dashboard.png";
import CalendarIcon from "@/assets/Calander.svg";
import KPIIcon from "@/assets/KPI Dashboard.svg";
import PerformanceIcon from "@/assets/Performance.svg";
import AIIcon from "@/assets/AI.svg";

type NavItem = {
  href: string;
  label: string;
  icon: any;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/navigation", label: "Navigate", icon: CalendarIcon },
  { href: "/kpi-dashboard", label: "KPI", icon: KPIIcon },
  { href: "/trend-analysis", label: "Trends", icon: PerformanceIcon },
  { href: "/ai-insights", label: "AI", icon: AIIcon },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Hide bottom nav on auth pages, onboarding, and home page
  const shouldHide =
    pathname === "/" || pathname?.startsWith("/auth") || pathname === "/onboarding";
  if (shouldHide) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white backdrop-blur md:hidden">
      <ul className="mx-auto grid w-full max-w-screen-sm grid-cols-5 items-center gap-1 px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <li key={item.href} className="flex justify-center">
              <Link
                href={item.href}
                className={`flex w-full flex-col items-center gap-1 rounded-md px-2 py-1 text-xs ${
                  isActive ? "text-[rgb(73,28,124)]" : "text-gray-600"
                }`}
              >
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded ${isActive ? "" : "opacity-80"}`}>
                  <Image src={item.icon} alt={item.label} className="h-6 w-6" />
                </span>
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}


