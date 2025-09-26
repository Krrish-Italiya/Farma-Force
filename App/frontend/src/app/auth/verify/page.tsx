"use client";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import blueLogo from "@/assets/blue logo.png";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(5); // 5 seconds cooldown

  useEffect(() => {
    if (!email) {
      router.push('/auth/signup');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Resend cooldown timer
    const resendTimer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(resendTimer);
    };
  }, [email, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

            // Auto-focus next input
        if (value && index < 3) {
          const nextInput = document.getElementById(`otp-${index + 1}`);
          if (nextInput) nextInput.focus();
        }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = async () => {
    if (otp.join('').length !== 4) {
      setError("Please enter the complete 4-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Get user data from localStorage (set during signup)
      const userData = localStorage.getItem('tempUserData');
      if (!userData) {
        setError("Session expired. Please sign up again.");
        router.push('/auth/signup');
        return;
      }

      const parsedUserData = JSON.parse(userData);
      console.log('Retrieved user data from localStorage:', parsedUserData);

      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: otp.join(''),
          userData: parsedUserData
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        localStorage.removeItem('tempUserData'); // Clean up
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch('http://localhost:5000/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("OTP resent successfully!");
        setTimeLeft(600); // Reset timer
        setResendCooldown(5); // Reset resend cooldown
        setCanResend(false);
        setOtp(['', '', '', '']); // Clear OTP fields
        
        // Log the new OTP for testing (remove in production)
        if (data.otp) {
          console.log(`New OTP received: ${data.otp}`);
        }
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden flex flex-col bg-[#F9FAFB] px-6">
      <div className="w-full max-w-xs mx-auto pt-12">
        {/* Header with Logo and Close Button */}
        <div className="flex items-center justify-between mb-8">
          <Image 
            src={blueLogo} 
            alt="farmaforce" 
            className="h-8 w-auto"
            priority
          />
          <Link href="/auth/login" className="text-gray-600 hover:text-gray-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
        </div>

        {/* Verification Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-[#491C7C] rounded-full flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#491C7C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Title and Instructions */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-black mb-4">Verify your email address</h1>
          <p className="text-black text-sm leading-relaxed">
            We sent a verification code to verify your email address.<br />
            Enter the 4-digit code in the field below.
          </p>
        </div>

        {/* OTP Input Fields */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-black mb-4">OTP Code</label>
          <div className="flex gap-3 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-14 h-14 text-center text-xl font-semibold text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#491C7C] focus:border-[#491C7C]"
                placeholder=""
              />
            ))}
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={loading || otp.join('').length !== 4}
          className="w-full bg-[#491C7C] hover:bg-[#3d1666] disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#491C7C] focus:ring-offset-2 mb-6"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

        {/* Resend Section */}
        <div className="text-center">
          <p className="text-sm text-black mb-2">
            Didn't get the code?{" "}
            <button
              onClick={handleResend}
              disabled={!canResend || loading}
              className="text-blue-500 hover:text-blue-600 disabled:text-gray-400 font-medium"
            >
              Resend
            </button>
          </p>
          <p className="text-xs text-black">
            Expires in {formatTime(timeLeft)}
            {!canResend && resendCooldown > 0 && (
              <span className="block mt-1">Resend available in {resendCooldown}s</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <VerifyContent />
    </Suspense>
  );
}
