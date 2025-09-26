"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import bgImage from "@/assets/banner bg.jpg";
import logoWhite from "@/assets/logo white.png";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Redirect to dashboard if user is logged in
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eef2f6]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#491C7C] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show landing page if user is logged in
  if (user) {
    return null;
  }

  return (
    <main className="h-screen overflow-hidden flex flex-col bg-[#eef2f6]">
      <section
        className="relative w-full rounded-b-[40px] overflow-hidden"
        style={{ height: "78vh" }}
      >
        <Image
          src={bgImage}
          alt="Background"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(73,28,124,0.88)" }} />

        <div className="relative z-10 h-full w-full flex items-center justify-center">
          <Image src={logoWhite} alt="farmaforce" className="w-[220px] h-auto" />
        </div>
      </section>

      <div className="flex flex-col items-center justify-center gap-6 pb-10 mt-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-2 rounded-full bg[#6f3aa8] bg-[#6f3aa8]" />
          <span className="w-2 h-2 rounded-full bg-[#6f3aa8] opacity-40" />
        </div>

        <Link href="/onboarding" className="group" aria-label="Go to onboarding">
          <div className="w-16 h-16 rounded-full bg-[#491C7C] shadow-md shadow-[#491C7C]/30 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              className="w-7 h-7 text-white group-hover:translate-x-0.5 transition-transform"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </div>
        </Link>
      </div>
    </main>
  );
}
