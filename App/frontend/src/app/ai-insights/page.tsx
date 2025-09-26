"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import blueLogo from "@/assets/blue logo.png";
import bellIcon from "@/assets/Bell Icon.svg";
import messageIcon from "@/assets/Message Icon.svg";
import mapImg from "@/assets/Map Icon.svg";        // Add your images here
import productImg from "@/assets/Product.svg";
import calendarImg from "@/assets/calendar 1.svg";
import Sidebar from "@/components/Sidebar";
// no external API needed for like/dislike; persist locally per card

export default function AIInsightsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Per-card preference map to keep each card independent
  const [aiPrefs, setAiPrefs] = useState<Record<string, string | null>>({});
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem('aiLikedMap');
      const parsed = raw ? JSON.parse(raw) : {} as Record<string, unknown>;
      const sanitized: Record<string, 'like' | 'dislike' | null> = {} as Record<string, 'like' | 'dislike' | null>;
      Object.keys(parsed || {}).forEach((k) => {
        const v = parsed[k];
        const value: 'like' | 'dislike' | null = v === 'like' ? 'like' : v === 'dislike' ? 'dislike' : null;
        sanitized[k] = value;
      });
      setAiPrefs(sanitized as any);
    } catch {}
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1000);
  };

  const handleLike = (cardKey: string, liked: boolean) => {
    const next: Record<string, string | null> = { ...aiPrefs, [cardKey]: liked ? 'like' : 'dislike' };
    setAiPrefs(next);
    try { localStorage.setItem('aiLikedMap', JSON.stringify(next)); } catch {}
    showToast(liked ? 'Liked — AI preference has updated' : 'Disliked — AI preference has updated');
  };

  // Shared UI classes for consistent buttons
  const btnClass = (state: string | null, type: 'like' | 'dislike') => {
    if (!mounted) return 'w-9 h-9 inline-flex items-center justify-center rounded-lg border text-sm bg-white border-gray-300 text-gray-700';
    const active = state === type;
    if (type === 'like') return `w-9 h-9 inline-flex items-center justify-center rounded-lg border text-sm ${active ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`;
    return `w-9 h-9 inline-flex items-center justify-center rounded-lg border text-sm ${active ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`;
  };

  return (
    <div 
      className="min-h-screen bg-white font-inter"
      style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
    >
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header (yours) */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm">
        <button className="p-1" onClick={() => setSidebarOpen(true)}>
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
        {/* Heading */}
        <h1 className="text-lg font-semibold text-center text-gray-900">
          AI Insights & Recommendations
        </h1>

        {/* Overall Recommendation */}
        <div className="bg-[rgba(73,28,124,0.9)] rounded-2xl p-4 text-white">
          <h2 className="text-base font-semibold mb-2">Overall Recommendation</h2>
          <p className="text-sm leading-relaxed">
            Your Call Rate is down in Region A. Focusing on Dr. Harper and Product X could boost
            performance by 12% this week
          </p>
        </div>

        {/* AI Recommendations */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-[#491C7C]">AI Recommendations</h2>

          {/* Card 1 */}
          <div className="border rounded-xl p-4 flex items-start space-x-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                Improve Coverage in South Region
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Based on your current routes to increase coverage schedule, you could optimize by
                15%.
              </p>
              <div className="flex items-center gap-2">
                <button className="bg-[#491C7C] text-white px-4 py-1.5 rounded-lg text-sm font-medium">
                  Action
                </button>
                <button aria-label="Like suggestion" onClick={() => handleLike('coverage-south', true)} className={btnClass(aiPrefs['coverage-south'] || null, 'like')} title="Like">👍</button>
                <button aria-label="Dislike suggestion" onClick={() => handleLike('coverage-south', false)} className={btnClass(aiPrefs['coverage-south'] || null, 'dislike')} title="Dislike">👎</button>
              </div>
            </div>
            <Image src={mapImg} alt="Map" className="w-16 h-16 rounded-lg object-cover" />
          </div>

          {/* Card 2 */}
          <div className="border rounded-xl p-4 flex items-start space-x-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Focus on Key Products</h3>
              <p className="text-sm text-gray-600 mb-3">
                Your top-performing products have seen a decline in the last month. Consider
                increasing promotion
              </p>
              <div className="flex items-center gap-2">
                <button className="bg-[#491C7C] text-white px-4 py-1.5 rounded-lg text-sm font-medium">
                  Action
                </button>
                <button aria-label="Like suggestion" onClick={() => handleLike('key-products', true)} className={btnClass(aiPrefs['key-products'] || null, 'like')} title="Like">👍</button>
                <button aria-label="Dislike suggestion" onClick={() => handleLike('key-products', false)} className={btnClass(aiPrefs['key-products'] || null, 'dislike')} title="Dislike">👎</button>
              </div>
            </div>
            <Image src={productImg} alt="Products" className="w-16 h-16 rounded-lg object-cover" />
          </div>

          {/* Card 3 */}
          <div className="border rounded-xl p-4 flex items-start space-x-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Schedule Optimization</h3>
              <p className="text-sm text-gray-600 mb-3">
                Rearranging your weekly schedule could save 3 hours of travel time
              </p>
              <div className="flex items-center gap-2">
                <button className="bg-[#491C7C] text-white px-4 py-1.5 rounded-lg text-sm font-medium">
                  Action
                </button>
                <button aria-label="Like suggestion" onClick={() => handleLike('schedule-optimization', true)} className={btnClass(aiPrefs['schedule-optimization'] || null, 'like')} title="Like">👍</button>
                <button aria-label="Dislike suggestion" onClick={() => handleLike('schedule-optimization', false)} className={btnClass(aiPrefs['schedule-optimization'] || null, 'dislike')} title="Dislike">👎</button>
              </div>
            </div>
            <Image src={calendarImg} alt="Calendar" className="w-16 h-16 rounded-lg object-cover" />
          </div>
        </div>

        {/* Input */}
        <div className="border rounded-xl p-3 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Ask AI for more insights..."
            className="flex-1 text-sm text-gray-700 placeholder-gray-500 border-none outline-none"
          />
          <button className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
        {toast && (
          <div className="fixed bottom-6 right-6 bg-black text-white text-xs px-3 py-2 rounded opacity-90 z-50">
            {toast}
          </div>
        )}
      </div>

      {/* Floating Support Chat Button (consistent with other pages) */}
      <div className="fixed bottom-16 right-6 z-50">
        <button aria-label="Open support chat" className="w-14 h-14 bg-cyan-500 hover:bg-cyan-600 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
