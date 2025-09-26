"use client";

import React, { useState } from "react";
import Image from "next/image";
import blueLogo from "@/assets/blue logo.png";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // TODO: Add API call for sending reset link
  };

  return (
    <div className="min-h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#f5faff] to-[#f6f7fa]">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 relative">
        {/* Close Icon */}
        <button className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-2xl" aria-label="Close">
          &times;
        </button>
        {/* Logo */}
        <div className="flex justify-center mb-6 mt-2">
          <Image src={blueLogo} alt="farmaforce" className="h-10 w-auto" />
        </div>
        {/* Title */}
        <h2 className="text-center text-xl font-bold mb-2 text-gray-800">Forgot your Password?</h2>
        <p className="text-center text-gray-500 text-sm mb-6">Enter your email address and we will send a link to create a new password.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email" className="block text-gray-700 text-sm mb-1">Enter Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 mb-6 bg-white"
            placeholder=""
          />
          <button
            type="submit"
            className="w-full bg-purple-800 hover:bg-purple-900 text-white font-semibold py-2 rounded-md transition-colors duration-200"
          >
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  );
}
