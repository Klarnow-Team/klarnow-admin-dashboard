"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiService, ApiError } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check for access denied error from URL
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("error") === "access_denied") {
        setError(
          "Access denied. You are not authorized to access the admin panel."
        );
      }
    } catch (error) {
      // Silently handle URL parsing errors
      if (process.env.NODE_ENV === "development") {
        console.error("Error parsing URL params:", error);
      }
    }
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Validate email before sending
      if (!email || !email.trim()) {
        setError("Please enter a valid email address.");
        setLoading(false);
        return;
      }

      const response = await apiService.sendOTP({ email });

      // If we get here without an error, the OTP was sent successfully
      // The API service throws errors for non-2xx responses, so if we're here, it succeeded

      // Check if OTP is provided (development mode)
      if (response?.otp && process.env.NODE_ENV === "development") {
        setSuccess(
          `OTP has been sent to your email address. Development OTP: ${response.otp}`
        );
      } else {
        setSuccess(
          "OTP has been sent to your email address. Please check your inbox."
        );
      }

      // Always transition to OTP step on successful response (no error thrown)
      setStep("otp");
    } catch (error: unknown) {
      // Ensure all errors are caught and handled
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (error instanceof ApiError) {
        // Use the friendly message from ApiError which handles status codes
        errorMessage = error.getFriendlyMessage();

        if (process.env.NODE_ENV === "development") {
          console.error(`❌ Send OTP error [${error.status}]:`, error.message);
        }
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
        if (process.env.NODE_ENV === "development") {
          console.error("❌ Send OTP error:", error);
        }
      } else {
        if (process.env.NODE_ENV === "development") {
          console.error("❌ Send OTP unknown error:", error);
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate inputs before sending
      if (!email || !email.trim()) {
        setError("Please enter a valid email address.");
        setLoading(false);
        return;
      }

      if (!otp || otp.length !== 6) {
        setError("Please enter a valid 6-digit OTP code.");
        setLoading(false);
        return;
      }

      const response = await apiService.login({ email, otp_code: otp });

      // If we get here without an error, the login was successful
      // The API service throws errors for non-2xx responses, so if we're here, it succeeded

      if (process.env.NODE_ENV === "development") {
        console.log(
          "✅ Login successful! Redirecting to dashboard...",
          response
        );
      }

      // Always redirect on successful response (no error thrown)
      // Wrap router operations in try-catch to prevent Next.js errors
      try {
        router.push("/dashboard");
        router.refresh();
      } catch (routerError) {
        // If router fails, still show success but log the error
        if (process.env.NODE_ENV === "development") {
          console.error("❌ Router error:", routerError);
        }
        // Fallback: use window.location as backup
        if (typeof window !== "undefined") {
          window.location.href = "/dashboard";
        }
      }
    } catch (error: unknown) {
      // Ensure all errors are caught and handled
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (error instanceof ApiError) {
        // Use the friendly message from ApiError which handles status codes
        errorMessage = error.getFriendlyMessage();

        if (process.env.NODE_ENV === "development") {
          console.error(`❌ Login error [${error.status}]:`, error.message);
        }
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
        if (process.env.NODE_ENV === "development") {
          console.error("❌ Login error:", error);
        }
      } else {
        if (process.env.NODE_ENV === "development") {
          console.error("❌ Login unknown error:", error);
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setOtp("");
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src="/assets/klarnow.svg"
              alt="Klarnow"
              className="h-4 w-auto"
            />
          </div>
        </div>

        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back
          </h1>
          <p className="text-gray-600">
            Glad to see you again 👋 Login to your account below
          </p>
        </div>

        {/* Login Form */}
        {step === "email" ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-900 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-gray-300 focus:border-[#8359ee] focus:ring-[#8359ee] rounded-full"
                placeholder="enter email..."
              />
            </div>

            {/* Send OTP Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#8359ee] hover:bg-[#7245e8] text-white font-medium rounded-full"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending OTP...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send OTP
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Email Display */}
            <div className="space-y-2">
              <Label className="text-gray-900 font-medium">Email</Label>
              <div className="h-12 px-4 flex items-center bg-gray-50 border border-gray-300 rounded-full text-gray-700">
                {email}
              </div>
            </div>

            {/* OTP Field */}
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-gray-900 font-medium">
                Enter OTP
              </Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                maxLength={6}
                className="h-12 border-gray-300 focus:border-[#8359ee] focus:ring-[#8359ee] rounded-full text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
              />
              <p className="text-xs text-gray-500 text-center mt-1">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full h-12 bg-[#8359ee] hover:bg-[#7245e8] text-white font-medium rounded-full"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                "Login"
              )}
            </Button>

            {/* Back to Email Button */}
            <Button
              type="button"
              onClick={handleBackToEmail}
              variant="outline"
              className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-full"
            >
              Change Email
            </Button>
          </form>
        )}

        {/* Info */}
        {/* <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-4 font-medium">
            How to Login
          </p>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-600">1. Enter your email address</p>
            <p className="text-sm text-gray-600">
              2. Check your email for the OTP code
            </p>
            <p className="text-sm text-gray-600">
              3. Enter the 6-digit OTP to login
            </p>
          </div>
        </div> */}
      </div>
    </div>
  );
}
