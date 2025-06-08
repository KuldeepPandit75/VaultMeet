"use client";

import { useState } from "react";
import Image from "next/image";
import { useThemeStore } from "../../../Zustand_Store/ThemeStore";
import useAuthStore from "@/Zustand_Store/AuthStore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

function LoginPage() {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const { error, login } = useAuthStore();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success("Logged in successfully");
      router.push('/');
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
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
        <div className="h-auto min-h-[60vh] w-[90vw] sm:w-[70vw] md:w-[50vw] lg:w-[30vw] z-1 relative rounded-3xl top-[50vh] left-[50vw] -translate-x-[50%] -translate-y-[50%] flex justify-around text-center p-8 md:p-10 flex-col items-center shadow-2xl"
        style={{
          backgroundColor: `${primaryAccentColor}`,
        }}
        >
          <h1 className="text-3xl font-bold text-center mb-6 px-1">
            Welcome Back to HackMeet!
          </h1>

          {error && (
            <div className="w-full p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-6 mb-8">
            {/* Email Input */}
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-black/30 text-black placeholder-black/70 focus:outline-none focus:border-black/50 focus:ring-2 focus:ring-black/20 transition-all"
                placeholder="Enter your email"
                disabled={isLoading}
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
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-black/30 text-black placeholder-black/70 focus:outline-none focus:border-black/50 focus:ring-2 focus:ring-black/20 transition-all"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-black/30 bg-white/20 checked:bg-black/40 focus:ring-2 focus:ring-black/20"
                  disabled={isLoading}
                />
                <label htmlFor="rememberMe" className="ml-2 text-black">
                  Remember me
                </label>
              </div>
              <a href="/forgot-password" className="text-black hover:text-black/80 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full rounded-lg px-6 py-3 text-lg font-bold shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: `${secondaryAccentColor}`,
                color: '#222',
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center w-full mb-8">
            <div className="flex-1 border-t border-black/30"></div>
            <span className="px-4 text-black/70">or</span>
            <div className="flex-1 border-t border-black/30"></div>
          </div>

          {/* Google Sign In */}
          <div className="w-full mb-8">
            <button
              className="w-full flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-transform"
              disabled={isLoading}
            >
              <Image src="/google.png" width={200} height={200} alt="Google logo" />
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="text-sm" style={{ color: 'black' }}>
            Don&apos;t have an account?{" "}
            <a href="/register" className="font-semibold hover:text-white/50 transition-colors text-white/80">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

export default LoginPage;
