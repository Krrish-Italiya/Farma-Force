"use client";

import React from "react";
import { usePathname } from "next/navigation";
import MobileBottomNav from "@/components/MobileBottomNav";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  const hideOnRoutes = new Set([
    "/",
    "/onboarding",
    "/auth/login",
    "/auth/signup",
    "/auth/forgot",
    "/auth/verify",
  ]);

  const shouldShowBottomNav = !hideOnRoutes.has(pathname);

  return (
    <>
      <div className={shouldShowBottomNav ? "pb-16 md:pb-0" : ""}>{children}</div>
      {shouldShowBottomNav && <MobileBottomNav />}
    </>
  );
}


