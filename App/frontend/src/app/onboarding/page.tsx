import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import bgImage from "@/assets/banner bg.jpg";
import frontBanner from "@/assets/front banner.png";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["700"] });

export default function Onboarding() {
  return (
    <main className="h-screen overflow-hidden flex flex-col bg-white">
      {/* Top Section with Background Image, Overlay, and Woman's Photo */}
      <section
        className="relative w-full rounded-b-[40px] overflow-hidden"
        style={{ height: "55vh" }}
      >
        {/* Background Image */}
        <Image
          src={bgImage}
          alt="Background"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        
        {/* Semi-transparent Purple Overlay */}
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(73,28,124,0.88)" }} />

        {/* Woman's Photo */}
        <div className="relative z-10 h-full w-full flex items-end justify-center mt-2">
          <Image 
            src={frontBanner} 
            alt="Healthcare Professional" 
            className="w-80 h-80 object-cover rounded-full"
            priority
          />
        </div>
      </section>

      {/* Bottom Section with Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-6">
        {/* Welcome Text */}
        <div className="self-start text-left mb-6">
          <h1 className={`${montserrat.className} text-2xl font-bold text-[#491C7C] mb-1`}>
            Welcome to
          </h1>
          <h1 className={`${montserrat.className} text-2xl font-bold text-[#491C7C] mb-3`}>
            FarmaForce
          </h1>
          <h2 className="text-base font-semibold text-[#491C7C] mb-3">
            Optimize Your Sales Journey
          </h2>
          <p className="text-gray-600 text-xs leading-relaxed max-w-sm">
            Connect with healthcare professionals, manage your schedule, and track performance with our intuitive platform.
          </p>
        </div>

        {/* Page Indicators */}
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2 h-2 rounded-full bg-[#6f3aa8] opacity-40" />
          <span className="w-6 h-2 rounded-full bg-[#6f3aa8]" />
        </div>

        {/* Navigation Button */}
        <Link href="/auth/login" className="group" aria-label="Go to login">
          <div className="w-14 h-14 rounded-full bg-[#491C7C] shadow-md shadow-[#491C7C]/30 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              className="w-6 h-6 text-white group-hover:translate-x-0.5 transition-transform"
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
