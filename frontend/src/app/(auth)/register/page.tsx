"use client";

import { useState } from "react";
import Image from "next/image";
import { useThemeStore } from "../../../Zustand_Store/ThemeStore";

function RegisterPage() {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement register logic
    console.log('Register form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <>
      <div className="overflow-hidden h-[100vh] bg-[url('/1355025.jpeg')] bg-cover bg-left-bottom">
        <div className="absolute inset-0 bg-[#111111b3]"></div>
        <div 
          className="h-auto min-h-[60vh] w-[90vw] sm:w-[70vw] md:w-[50vw] lg:w-[30vw] z-1 relative rounded-3xl top-[50vh] left-[50vw] -translate-x-[50%] -translate-y-[50%] flex justify-around text-center p-6 md:p-8 flex-col items-center shadow-2xl"
          style={{
            backgroundColor: `${primaryAccentColor}`,
          }}
        >
          <h1 className="text-3xl font-bold text-center mb-6 px-24">
            Welcome to HackMeet
          </h1>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4 mb-4">
            {/* Name Inputs */}
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-black/30 text-black placeholder-black/70 focus:outline-none focus:border-black/50 focus:ring-2 focus:ring-black/20 transition-all"
                  placeholder="First name"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-black/30 text-black placeholder-black/70 focus:outline-none focus:border-black/50 focus:ring-2 focus:ring-black/20 transition-all"
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-black/30 text-black placeholder-black/70 focus:outline-none focus:border-black/50 focus:ring-2 focus:ring-black/20 transition-all"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Input */}
            <div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-black/30 text-black placeholder-black/70 focus:outline-none focus:border-black/50 focus:ring-2 focus:ring-black/20 transition-all"
                placeholder="Create password"
              />
            </div>

            {/* Confirm Password Input */}
            <div>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-black/30 text-black placeholder-black/70 focus:outline-none focus:border-black/50 focus:ring-2 focus:ring-black/20 transition-all"
                placeholder="Confirm password"
              />
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center text-sm">
              <input
                type="checkbox"
                id="agreeToTerms"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                required
                className="h-4 w-4 rounded border-black/30 bg-white/20 checked:bg-black/40 focus:ring-2 focus:ring-black/20"
              />
              <label htmlFor="agreeToTerms" className="ml-2 text-black">
                I agree to the{" "}
                <a href="/terms" className="font-semibold hover:text-black/80 transition-colors" style={{ color: secondaryAccentColor }}>
                  Terms and Conditions
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full rounded-lg px-6 py-2 text-lg font-bold shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: `${secondaryAccentColor}`,
                color: '#222',
              }}
            >
              Create Account
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center w-full mb-4">
            <div className="flex-1 border-t border-black/30"></div>
            <span className="px-4 text-black/70">or</span>
            <div className="flex-1 border-t border-black/30"></div>
          </div>

          {/* Google Sign In */}
          <div className="w-full mb-4">
            <button
              className="w-full flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <Image src="/google.png" width={180} height={180} alt="Google logo" />
            </button>
          </div>

          {/* Sign In Link */}
          <p className="text-sm" style={{ color: 'black' }}>
            Already have an account?{" "}
            <a href="/login" className="font-semibold hover:text-white/50 transition-colors text-white/80">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

export default RegisterPage;
