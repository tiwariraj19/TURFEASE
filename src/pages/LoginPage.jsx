import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("manager@wembleyturf.com");
  const [password, setPassword] = useState("owner1234");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [buttonText, setButtonText] = useState("Sign In to Command Center");
  const [alert, setAlert] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setAlert(null);

    if (!email || !password) {
      setAlert({
        type: "error",
        title: "Access Restriction",
        message: "Please enter valid turf administrator credentials."
      });
      return;
    }

    setIsLoading(true);
    setButtonText("Authenticating Turf...");

    setTimeout(() => {
      setButtonText("Access Granted!");
      setTimeout(() => {
        setButtonText("Launching Dashboard...");
        login(email, password);
        navigate("/dashboard");
      }, 600);
    }, 900);
  };

  const handleForgotPassword = () => {
    setAlert({
      type: "info",
      title: "Password Reset Dispatched",
      message: "Owner security reset link sent to your registered clubhouse phone and backup email."
    });
  };

  const handleQuickDemoLogin = () => {
    setEmail("manager@wembleyturf.com");
    setPassword("owner1234");
    setIsLoading(true);
    setButtonText("Access Granted!");
    setTimeout(() => {
      login("manager@wembleyturf.com", "owner1234");
      navigate("/dashboard");
    }, 500);
  };

  return (
    <div className="bg-background font-body text-on-surface antialiased flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col relative w-full bg-background min-h-screen">
        <div className="flex flex-col w-full pb-8">
          {/* Hero Branding Visual Section */}
          <div className="relative w-full h-64 overflow-hidden rounded-b-3xl">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDT-O3p-zc8AZfoe9ixZRromIz_eP-tBE5cE2zkU0k3DgUjM0giBYPmfTDREgwGgI5u3La_lNwJmBsqislbvB-IqEYncZJsgAe--RW13eGWBex4Tv-ElWJtRWYve1xNPJqWUlA2wRrf64606QaCxfCXrUwOOturSM-1YlB_h6_wTaYivWMuP738xBoKE5Q_ayzk12DQXx9f2borBkPvh7xZePOdxSzyrD4P4Lt3Zzs0_P5COvtwFY2gNg')",
              }}
            />
            {/* Dark Editorial Gradient Scrims */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary-container via-primary-container/75 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-transparent to-primary-container" />

            {/* Branding Header Overlay */}
            <div className="relative z-10 flex flex-col items-center justify-end h-full px-5 pb-6 text-center">
              {/* Tagline Chip */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full bg-secondary-container/90 text-on-secondary-fixed shadow-sm">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  sports_soccer
                </span>
                <span className="font-heading text-xs uppercase tracking-wider font-semibold text-primary">
                  Smart Turf Management
                </span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl text-on-primary tracking-tight font-bold mb-1 drop-shadow-sm">
                Welcome to TurfEase
              </h1>
              <p className="font-body text-xs sm:text-sm text-surface-container-highest max-w-xs leading-snug font-medium">
                Your Turf. Your Business. All in One Place.
              </p>
            </div>
          </div>

          {/* Main Card Container */}
          <div className="px-4 -mt-3 relative z-20 w-full max-w-md mx-auto">
            <div className="w-full bg-surface-container-lowest rounded-2xl shadow-xl shadow-primary-container/10 p-5 sm:p-6 space-y-5 border border-surface-container/60">
              {/* Card Header & Owner Privilege Badge */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-xl text-on-surface font-bold tracking-tight">
                      Owner Login
                    </h2>
                    <p className="font-body text-xs text-on-surface-variant">
                      Sign in to manage your turf operations
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-surface-container flex items-center justify-center text-primary shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">
                      shield_person
                    </span>
                  </div>
                </div>

                {/* Authorized Access Pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-secondary-container">
                  <span className="material-symbols-outlined text-[16px] text-secondary">
                    verified_user
                  </span>
                  <span className="font-heading text-[11px] uppercase tracking-wide font-semibold text-secondary">
                    Authorized Turf Owners Only
                  </span>
                </div>
              </div>

              {/* Alert Feedback Simulation */}
              {alert && (
                <div
                  className={`rounded-xl p-3 transition-all duration-300 ${
                    alert.type === "error"
                      ? "bg-error-container text-on-error-container"
                      : "bg-secondary-container text-on-secondary-container"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-lg mt-0.5">
                      {alert.type === "error" ? "error" : "info"}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-heading text-xs font-semibold">
                        {alert.title}
                      </h4>
                      <p className="font-body text-xs leading-tight mt-0.5">
                        {alert.message}
                      </p>
                    </div>
                    <button
                      onClick={() => setAlert(null)}
                      className="hover:opacity-75"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">
                        close
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="ownerEmail"
                    className="block font-heading text-[11px] uppercase tracking-wider text-on-surface font-semibold"
                  >
                    Owner Email
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 material-symbols-outlined text-[20px] text-on-surface-variant pointer-events-none">
                      mail
                    </span>
                    <input
                      id="ownerEmail"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@turfclub.com"
                      className="w-full bg-surface-container-low text-on-surface font-body text-sm rounded-xl pl-11 pr-10 py-3 focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary shadow-inner border border-transparent focus:border-primary/20"
                    />
                    <span className="absolute right-3.5 material-symbols-outlined text-[18px] text-secondary pointer-events-none">
                      check_circle
                    </span>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="ownerPassword"
                      className="block font-heading text-[11px] uppercase tracking-wider text-on-surface font-semibold"
                    >
                      Password
                    </label>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 material-symbols-outlined text-[20px] text-on-surface-variant pointer-events-none">
                      lock
                    </span>
                    <input
                      id="ownerPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your security key"
                      className="w-full bg-surface-container-low text-on-surface font-body text-sm rounded-xl pl-11 pr-12 py-3 focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary shadow-inner border border-transparent focus:border-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Control Row: Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shadow-sm transition-colors ${
                        rememberMe
                          ? "bg-primary text-tertiary-fixed"
                          : "bg-surface-container-high text-transparent"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px] font-bold">
                        check
                      </span>
                    </div>
                    <span className="font-body text-xs text-on-surface-variant font-medium">
                      Keep active
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="font-heading text-xs text-secondary hover:text-primary transition-colors font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Primary Action Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full relative overflow-hidden rounded-full py-3.5 px-6 bg-gradient-to-r from-primary-container via-secondary to-primary-container text-on-primary font-heading text-sm font-semibold shadow-lg shadow-primary-container/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-90 cursor-pointer"
                  >
                    {isLoading ? (
                      <svg
                        className="animate-spin h-5 w-5 text-on-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                    ) : (
                      <span className="material-symbols-outlined text-[20px]">
                        login
                      </span>
                    )}
                    <span>{buttonText}</span>
                  </button>
                </div>
              </form>

              {/* Quick Demo Access Helper */}
              <div className="pt-1 flex flex-col items-center gap-2 border-t border-surface-container/60">
                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  className="w-full py-2 px-3 rounded-xl bg-surface-container text-primary font-heading text-xs font-bold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">
                    bolt
                  </span>
                  <span>1-Click Owner Demo Login</span>
                </button>
                <div className="flex items-center gap-1.5 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px] text-secondary">
                    lock
                  </span>
                  <span className="font-heading text-[10px]">
                    256-Bit SSL Encrypted Enterprise Gateway
                  </span>
                </div>
              </div>
            </div>

            {/* Telemetry & Facility Status Snapshot */}
            <div className="mt-4 p-4 rounded-2xl bg-surface-container/60 shadow-sm flex items-center justify-between border border-secondary/15">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim animate-pulse" />
                <div>
                  <div className="font-heading text-xs text-on-surface font-semibold">
                    Turf Engine Connected
                  </div>
                  <div className="font-body text-[11px] text-on-surface-variant">
                    Pitch 1 &amp; 2 Lighting Ready
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 rounded bg-surface-container-lowest text-secondary font-heading text-[11px] font-semibold">
                  99.8% Online
                </span>
              </div>
            </div>

            {/* App Identity & Version Footer */}
            <div className="mt-6 text-center space-y-1">
              <p className="font-heading text-xs text-on-surface-variant">
                TurfEase Management Suite • v2.4 Commercial Edition
              </p>
              <p className="font-body text-[11px] text-on-surface-variant opacity-75">
                Authorized owner control panel. All operations encrypted.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
