"use client";

import { useState } from "react";
import { useThemeStore } from "../../../Zustand_Store/ThemeStore";
import useAuthStore from "@/Zustand_Store/AuthStore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AxiosError } from "axios";

function ForgetPasswordPage() {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const { error, sendOTP, verifyOTP, resetPassword } = useAuthStore();
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendOTP(formData.email);
      toast.success("OTP sent to your email");
      setStep('otp');
    } catch (err) {
      console.error('Failed to send OTP:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await verifyOTP(formData.email, formData.otp);
      if (result.result === "VERIFIED" || result.result === "VALID") {
        toast.success("OTP verified successfully");
        setStep('password');
      } else {
        toast.error("Invalid OTP");
      }
    } catch (err) {
      console.log("Error in verifyOTP", err);
      toast.error(
        err instanceof AxiosError ? err.response?.data?.result : "Failed to verify OTP"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(formData.email, formData.otp, formData.newPassword);
      toast.success("Password reset successfully");
      router.push('/login');
    } catch (err) {
      console.error('Failed to reset password:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
            Reset Your Password
          </h1>

          {error && (
            <div className="w-full p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="w-full space-y-6 mb-8">
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

              <button
                type="submit"
                className="w-full rounded-lg px-6 py-3 text-lg font-bold shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: `${secondaryAccentColor}`,
                  color: '#222',
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOTPSubmit} className="w-full space-y-6 mb-8">
              <div>
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-black/30 text-black placeholder-black/70 focus:outline-none focus:border-black/50 focus:ring-2 focus:ring-black/20 transition-all"
                  placeholder="Enter OTP"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg px-6 py-3 text-lg font-bold shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: `${secondaryAccentColor}`,
                  color: '#222',
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="w-full space-y-6 mb-8">
              <div>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-black/30 text-black placeholder-black/70 focus:outline-none focus:border-black/50 focus:ring-2 focus:ring-black/20 transition-all"
                  placeholder="Enter new password"
                  disabled={isLoading}
                />
              </div>

              <div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-black/30 text-black placeholder-black/70 focus:outline-none focus:border-black/50 focus:ring-2 focus:ring-black/20 transition-all"
                  placeholder="Confirm new password"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg px-6 py-3 text-lg font-bold shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: `${secondaryAccentColor}`,
                  color: '#222',
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <p className="text-sm" style={{ color: 'black' }}>
            Remember your password?{" "}
            <a href="/login" className="font-semibold hover:text-white/50 transition-colors text-white/80">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

export default ForgetPasswordPage;
