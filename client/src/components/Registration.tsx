"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

interface AdditionalUserData {
  radius_km?: number;
  categories?: string[];
  notifications?: {
    enabled?: boolean;
    quietHours?: any;
  };
  preferences?: {
    useCurrentLocation?: boolean;
    manualLocality?: string | null;
  };
  fcmToken?: string;
}

const Registration: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState<number>(5);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "Events",
    "Traffic",
  ]);
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [currentUseCaseIndex, setCurrentUseCaseIndex] = useState(0);
  const {
    user,
    registerUser,
    fcmToken,
    isTokenReady,
    notificationPermissionStatus,
    requestTokenManually,
  } = useAuth();
  const router = useRouter();
  const [fcmTokenStatus, setFcmTokenStatus] = useState<string>('Checking...')


  const useCases = [
    "Monitor real-time traffic conditions and find optimal routes",
    "Get instant alerts about water-logging in your area",
    "Stay informed about local events and community activities",
    "Report and track infrastructure issues like fallen trees",
    "Receive emergency notifications for fire incidents",
    "Access educational resources and transportation updates",
  ];

  const availableCategories = [
    { name: "Water-Logging", color: "bg-blue-500" },
    { name: "Events", color: "bg-purple-500" },
    { name: "Traffic", color: "bg-red-500" },
    { name: "Tree Falling", color: "bg-green-500" },
    { name: "Fire", color: "bg-orange-500" },
    { name: "Education", color: "bg-indigo-500" },
    { name: "Transportation", color: "bg-yellow-500" },
    { name: "Services", color: "bg-pink-500" },
  ];

  useEffect(() => {
  if (isTokenReady) {
    if (fcmToken) {
      setFcmTokenStatus('✓ Ready')
    } else if (notificationPermissionStatus === 'denied') {
      setFcmTokenStatus('Notifications disabled')
    } else {
      setFcmTokenStatus('Not available')
    }
  } else {
    setFcmTokenStatus('Loading...')
  }
}, [fcmToken, isTokenReady, notificationPermissionStatus])


  // Animate use cases
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setCurrentUseCaseIndex((prev) => (prev + 1) % useCases.length);
  //   }, 3000);
  //   return () => clearInterval(interval);
  // }, [useCases.length]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleRegistration = async (): Promise<void> => {
  if (!user) {
    setError("No user found. Please sign in first.")
    return
  }

  try {
    setLoading(true)
    setError(null)

    // If notifications are enabled but no token and not ready, try to get it
    if (notificationsEnabled && !fcmToken && !isTokenReady) {
      console.log('Attempting to get FCM token before registration...')
      try {
        await requestTokenManually()
        // Wait a bit for the token to be set
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.log('Could not get FCM token, proceeding without it')
      }
    }

    const additionalData: AdditionalUserData = {
      radius_km: radius,
      categories: selectedCategories,
      notifications: {
        enabled: notificationsEnabled,
        quietHours: null,
      },
      preferences: {
        useCurrentLocation: useCurrentLocation,
        manualLocality: useCurrentLocation ? null : "Manual location not set",
      },
    }

    console.log('Starting registration with FCM token:', fcmToken ? 'Available' : 'Not available')
    await registerUser(additionalData)
    router.push("/")
  } catch (error: any) {
    console.error("Registration error:", error)
    setError(error.message || "Failed to complete registration")
  } finally {
    setLoading(false)
  }
}

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-orange-500 rounded-lg flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-white/60 mb-6 text-lg">
            Please sign in first to continue
          </p>
          <button
            onClick={() => router.push("/signIn")}
            className="px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-all duration-300"
          >
            Go to Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col lg:flex-row">
      {/* Left Half - Use Cases */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-16">
        <div className="max-w-lg w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 lg:mb-12"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white mb-4">
              Nagar
              <span className="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">
                Chakshu
              </span>
            </h1>
            <p className="text-white/60 text-base sm:text-lg">
              AI-powered civic monitoring platform
            </p>
          </motion.div>

          {/* Fixed height container to prevent layout shifts */}
          <div className="relative h-24 sm:h-32 lg:h-40 flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentUseCaseIndex}
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center"
              >
                <p className="text-white/80 text-lg sm:text-xl lg:text-2xl leading-relaxed">
                  {useCases[currentUseCaseIndex]}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right Half - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-16 border-t lg:border-t-0 lg:border-l border-white/10">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="mb-6 lg:mb-8">
            <h2 className="text-xl sm:text-2xl font-light text-white mb-2">
              Complete Registration
            </h2>
            <p className="text-white/60 text-sm">Set up your preferences</p>
          </div>

          {/* User Info */}
          <div className="flex items-center mb-6 pb-6 border-b border-white/10">
            <img
              src={user.photoURL || ""}
              alt={user.displayName || "User"}
              className="w-10 h-10 rounded-full mr-3 border border-white/20"
            />
            <div>
              <div className="text-white text-sm font-medium">
                {user.displayName}
              </div>
              <div className="text-white/50 text-xs">{user.email}</div>
            </div>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            {/* Search Radius */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Search Radius:{" "}
                <span className="text-purple-400">{radius} km</span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-white/40 mt-1">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-white text-sm font-medium mb-3">
                Categories of Interest
              </label>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => handleCategoryToggle(category.name)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                      selectedCategories.includes(category.name)
                        ? `${category.color} text-white shadow-lg`
                        : "bg-white/10 text-white/60 hover:bg-white/20"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCurrentLocation}
                  onChange={(e) => setUseCurrentLocation(e.target.checked)}
                  className="w-4 h-4 text-purple-500 bg-transparent border-white/30 rounded focus:ring-purple-500 focus:ring-2"
                />
                <span className="text-white/80 text-sm">
                  Use current location
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="w-4 h-4 text-orange-500 bg-transparent border-white/30 rounded focus:ring-orange-500 focus:ring-2"
                />
                <span className="text-white/80 text-sm">
                  Enable notifications
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleRegistration}
              disabled={loading || selectedCategories.length === 0}
              className="w-full bg-white hover:bg-white/90 text-black font-medium py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2"></div>
                  Processing...
                </div>
              ) : (
                "Complete Registration"
              )}
            </button>
          </div>

          {/* FCM Token Status */}
<div className="mb-4 p-3 bg-white/5 border border-white/10 rounded text-sm">
  <div className="flex justify-between items-center">
    <span className="text-white/60">Notification Token:</span>
    <span className={`text-xs ${
      fcmTokenStatus === '✓ Ready' ? 'text-green-400' : 
      fcmTokenStatus === 'Notifications disabled' ? 'text-yellow-400' : 
      'text-white/40'
    }`}>
      {fcmTokenStatus}
    </span>
  </div>
  {fcmToken && (
    <div className="text-xs text-white/30 mt-1 font-mono">
      {fcmToken.substring(0, 20)}...
    </div>
  )}
</div>

          <div className="mt-6 text-center">
            <p className="text-white/40 text-xs">
              Selected {selectedCategories.length} of{" "}
              {availableCategories.length} categories
            </p>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, rgb(168 85 247), rgb(251 146 60));
          cursor: pointer;
          border: 2px solid white;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, rgb(168 85 247), rgb(251 146 60));
          cursor: pointer;
          border: 2px solid white;
        }
      `}</style>
    </div>
  );
};

export default Registration;
