"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import UserSubmitReport from "@/components/UserSubmitReport"
import { Plus, FileText } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { updateUserLocation, fetchProcessedData } from "@/lib/api"
import { toast } from "sonner"
import LiveData from "@/components/LiveData"
import ProtectedRoute from "@/components/AuthGuard"

export default function HomePage() {
  const [showReportModal, setShowReportModal] = useState(false)
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 })
  const [processedData, setProcessedData] = useState<unknown[]>([])

  // Single context call
  const { user, userProfile } = useAuth()

  const openModal = () => setShowReportModal(true)
  const closeModal = () => setShowReportModal(false)

  // Track whether location was successfully fetched and synced
  const locationFetched = useRef(false)

  // Fetch user location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        console.log("Location fetched:", newLocation)
        setLocation((prev) => {
          if (prev.latitude !== newLocation.latitude || prev.longitude !== newLocation.longitude) {
            locationFetched.current = true
            return newLocation
          }
          return prev
        })
      },
      (error) => {
        console.error("Geolocation error:", error)
        locationFetched.current = false
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Location access denied by user")
            break
          case error.POSITION_UNAVAILABLE:
            toast.error("Location information unavailable")
            break
          case error.TIMEOUT:
            toast.error("Location request timed out")
            break
          default:
            toast.error("Could not get location")
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      },
    )
  }, [])

  // Trigger updates after location is available - FIXED to prevent infinite loops
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const performUpdates = async () => {
      // Don't proceed if location is not set or user is not available
      if (location.latitude === 0 && location.longitude === 0) {
        return
      }

      if (!user || !locationFetched.current) {
        return
      }

      try {
        const token = await user.getIdToken(true)
        if (!token) return

        // Update location
        await updateUserLocation(
          { lat: location.latitude, lng: location.longitude },
          token
        )

        // Get processed data  
        const radius = (userProfile?.radius_km || 5) * 1000
        const result = await fetchProcessedData(
          { lat: location.latitude, lng: location.longitude },
          radius,
          token
        )
        setProcessedData(result.processed_data || [])
      } catch (error) {
        console.error("Failed to update data:", error)
      }
    }

    // Only run if we have valid location and user
    if (location.latitude !== 0 && location.longitude !== 0 && user && locationFetched.current) {
      timeoutId = setTimeout(performUpdates, 1000)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [location.latitude, location.longitude, user, userProfile?.radius_km])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black">
        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Left Column - LiveData Component */}
          <div className="w-full lg:w-1/2 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
            <LiveData processedData={processedData} />
          </div>

          {/* Right Column - Submit Report */}
          <div className="w-full lg:w-1/2 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-md w-full"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-4">
                  Nagar
                  <span className="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">
                    Chakshu
                  </span>
                </h1>
                <p className="text-white/60 text-base sm:text-lg mb-8">AI-powered civic monitoring platform</p>
              </motion.div>

              {/* Submit Report Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <motion.button
                  onClick={openModal}
                  className="group relative overflow-hidden bg-gradient-to-r from-purple-500 to-orange-500 text-white font-medium py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl w-full"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Background animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Button content */}
                  <div className="relative flex items-center justify-center space-x-3">
                    <motion.div
                      animate={{ rotate: [0, 180, 360] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-6 h-6"
                    >
                      <Plus className="w-6 h-6" />
                    </motion.div>
                    <span className="text-lg">Submit a Report</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                    >
                      <FileText className="w-5 h-5" />
                    </motion.div>
                  </div>

                  {/* Shine effect */}
                  <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </motion.button>
              </motion.div>

              {/* Additional Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-8 text-white/40 text-sm"
              >
                <p>Help improve your city by reporting civic issues</p>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-500 rounded-full"
          />
          <motion.div
            animate={{
              y: [0, -15, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute top-1/3 right-1/3 w-1 h-1 bg-orange-500 rounded-full"
          />
          <motion.div
            animate={{
              y: [0, -25, 0],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
            className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-white/30 rounded-full"
          />
        </div>

        {/* Submit Report Modal */}
        <AnimatePresence>
          {showReportModal && <UserSubmitReport onClose={closeModal} />}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  )
}
