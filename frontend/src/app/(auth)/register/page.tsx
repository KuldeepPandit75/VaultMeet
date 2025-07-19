"use client";

import { useState } from "react";
import { useThemeStore } from "../../../Zustand_Store/ThemeStore";
import useAuthStore from "@/Zustand_Store/AuthStore";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { CredentialResponse } from "@react-oauth/google";
import { GoogleLogin } from "@react-oauth/google";

function RegisterPage() {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const { error, register, checkUsernameAvailability, googleLogin } = useAuthStore();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [formErrors, setFormErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
  });

  const handleCheckUsername = async (username: string) => {
    if (!username) return true;
    setIsCheckingUsername(true);
    try {
      const isAvailable = await checkUsernameAvailability(username);
      return isAvailable;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.([^\s@]{2,})+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return false;
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
    return passwordRegex.test(password);
  };

  const validateFullName = (firstName: string, lastName: string) => {
    const nameRegex = /^[a-zA-Z\s]{2,20}$/;
    return nameRegex.test(firstName) && nameRegex.test(lastName);
  };

  const validateForm = async () => {
    const errors = {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      username: "",
    };
    let isValid = true;

    // First Name and Last Name validation
    if (!validateFullName(formData.firstName, formData.lastName)) {
      errors.fullName = "First and last name must be 2-20 characters long and contain only letters";
      isValid = false;
    }

    // Email validation
    if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }
    // Password validation
    if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
      isValid = false;
    } else if (!validatePassword(formData.password)) {
      errors.password = "Password must contain at least 8 characters, 1 capital letter, 1 number, and 1 special character";
      isValid = false;
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    // Username validation
    if (!formData.username) {
      errors.username = "Username is required";
      isValid = false;
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters long";
      isValid = false;
    }

    // Terms and conditions validation
    if (!formData.agreeToTerms) {
      errors.username = "You must agree to the Terms and Conditions";
      isValid = false;
    }

    setFormErrors(errors);
    
    if (isValid) {
      const isUsernameAvailable = await handleCheckUsername(formData.username);
      if (!isUsernameAvailable) {
        errors.username = "Username is already taken";
        setFormErrors(errors);
        return false;
      }
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await validateForm())) return;

    setIsLoading(true);
    try {
      await register({
        fullname: {
          firstname: formData.firstName,
          lastname: formData.lastName
        },
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      router.push('/');
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse | undefined) => {
    try {
      setIsLoading(true);
      // Decode the JWT token
      const decodedToken = JSON.parse(atob(credentialResponse?.credential?.split('.')[1] || ''));

      console.log(decodedToken)
      
      await googleLogin({
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        googleId: decodedToken.sub
      });
      
      toast.success("Logged in successfully with Google");
      router.push('/');
    } catch (err) {
      console.error('Google login failed:', err);
      toast.error("Failed to login with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Google login failed");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear validation error when user starts typing
    if (validationError) setValidationError(null);
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
            Welcome to VaultMeet
          </h1>

          {(error || Object.values(formErrors).some(error => error)) && (
            <div className="w-full p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
              {error || Object.values(formErrors).find(error => error)}
            </div>
          )}

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
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Username Input */}
            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-black/30 text-black placeholder-black/70 focus:outline-none focus:border-black/50 focus:ring-2 focus:ring-black/20 transition-all"
                placeholder="Enter your username"
                disabled={isLoading}
              />
              {isCheckingUsername && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-black/30 border-t-black rounded-full"></div>
                </div>
              )}
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
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-black/30 text-black placeholder-black/70 focus:outline-none focus:border-black/50 focus:ring-2 focus:ring-black/20 transition-all"
                placeholder="Create password"
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
              className="w-full rounded-lg px-6 py-2 text-lg font-bold shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: `${secondaryAccentColor}`,
                color: '#222',
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center w-full mb-4">
            <div className="flex-1 border-t border-black/30"></div>
            <span className="px-4 text-black/70">or</span>
            <div className="flex-1 border-t border-black/30"></div>
          </div>

          {/* Google Sign In */}
          <div className="w-full mb-8 flex justify-center items-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="filled_black"
              shape="rectangular"
              text="signin_with"
              locale="en"
            />
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

