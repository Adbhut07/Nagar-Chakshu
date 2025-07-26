"use client"
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import UserSubmitReport from "@/components/UserSubmitReport"
import Chatbot from "@/components/Chatbot"
import { Plus, FileText } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { updateUserLocation, fetchProcessedData, fetchSummarizedData } from "@/lib/api"
import { toast } from "sonner"
import LiveData from "@/components/LiveData"
import ProtectedRoute from "@/components/AuthGuard"
import SummarizedData from "@/components/SummarizedData"
import MoodMap from "@/components/MoodMap"
import { useRouter } from "next/navigation"

// Define proper types
interface Location {
  latitude: number
  longitude: number
}

interface ProcessedData {
  [key: string]: any
}

const fadeInTexts = [
  "Mood map of your city",
  "Live Incidents",
  "Real-time sentiment analysis"
]

export default function HomePage() {
  const [showReportModal, setShowReportModal] = useState(false)
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 })
  const [processedData, setProcessedData] = useState<any>(null)
  const [summarizedData, setSummarizedData] = useState<any>(null)
  const [hideLiveData, setHideLiveData] = useState<boolean>(false)
  const [visibleTexts, setVisibleTexts] = useState<number[]>([])

  const router = useRouter();





  useEffect(() => {
    fadeInTexts.forEach((_, index) => {
      setTimeout(
        () => {
          setVisibleTexts((prev) => [...prev, index])
        },
        index * 200 + 500,
      ) // Start after 500ms, then 200ms intervals
    })
  }, [])



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
        // Only set if not already set or if coordinates are different
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

  async function updateLocation() {
    try {
      if (!user) {
        console.log("No user available for location update")
        return
      }
      // Check if location is valid
      if (location.latitude === 0 && location.longitude === 0) {
        console.log("Invalid location coordinates, skipping update")
        return
      }

      const token = await user.getIdToken(true)
      if (!token) {
        console.log("No auth token available")
        return
      }

      console.log("Updating location:", { lat: location.latitude, lng: location.longitude })
      const result = await updateUserLocation({ lat: location.latitude, lng: location.longitude }, token)
      console.log("Location updated successfully:", result)
    } catch (error) {
      console.error("Failed to update location:", error)
    }
  }

  async function getProcessedData() {
    try {
      if (!user) {
        console.log("No user available for processed data")
        return
      }
      // Check if location is valid
      if (location.latitude === 0 && location.longitude === 0) {
        console.log("Invalid location coordinates, skipping processed data fetch")
        return
      }

      const token = await user.getIdToken(true)
      if (!token) {
        console.log("No auth token available for processed data")
        return
      }

      //TODO: change this to (userProfile?.radius_km || 5) * 1000
      const radius = 10000000
      const result = await fetchProcessedData({ lat: location.latitude, lng: location.longitude }, radius, token)
      setProcessedData(result.processed_data)
    } catch (error) {
      console.error("Failed to fetch processed data:", error)
      // Only show toast for non-auth errors
      if ((error as Error).message && !(error as Error).message.includes("auth")) {
        toast.error("Failed to fetch processed data")
      }
    }
  }

  async function getSummarizedData() {
    try {
      if (!user) {
        console.log("No user available for summarized data")
        return
      }
      // Check if location is valid
      if (location.latitude === 0 && location.longitude === 0) {
        console.log("Invalid location coordinates, skipping summarized data fetch")
        return
      }

      const token = await user.getIdToken(true)
      if (!token) {
        console.log("No auth token available for summarized data")
        return
      }

      //TODO: change this to (userProfile?.radius_km || 5) * 1000
      const radius = 10000000
      const result = await fetchSummarizedData({ lat: location.latitude, lng: location.longitude }, radius, token)
      setSummarizedData(result.incidents)
    } catch (error) {
      console.error("Failed to fetch summarized data:", error)
      // Only show toast for non-auth errors
      if ((error as Error).message && !(error as Error).message.includes("auth")) {
        toast.error("Failed to fetch summarized data")
      }
    }
  }

  // Trigger updates after location is available
  useEffect(() => {
    // Don't proceed if location is not set or user is not available
    if (location.latitude === 0 && location.longitude === 0) {
      console.log("Location not yet available")
      return
    }
    if (!user) {
      console.log("User not yet available")
      return
    }
    if (!locationFetched.current) {
      console.log("Location not yet fetched")
      return
    }

    // Add a small delay to ensure auth state is stable
    const timeoutId = setTimeout(() => {
      updateLocation()
      getProcessedData()
      getSummarizedData()
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [location.latitude, location.longitude, user, userProfile])




  const handleClickMap = () => {

    router.push('/map')
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen  bg-black">
        {/* Responsive Layout Container */}
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-200px)]">
          {/* Left Column - Processed Data & Submit Report */}
          <div className="w-full lg:flex-[2] border-b lg:border-b-0 lg:border-r border-gray-800 p-3 sm:p-4 lg:p-6 overflow-y-auto">
            <div className="space-y-4 lg:space-y-6">
              {/* Processed Data Section */}
              {!hideLiveData && (
                <div className="h-full">
                  <LiveData processedData={processedData} />
                </div>
              )}

              {/* Summarized Data Section */}
              <div className="h-full">
                <SummarizedData setHideLiveData={setHideLiveData} summarizedData={summarizedData} />
              </div>

              {/* Submit Report Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-black rounded-xl p-4 lg:p-6 border border-black w-full max-w-[460px] mx-auto lg:mx-0"
              >
                <motion.button
                  onClick={openModal}
                  className="group relative overflow-hidden bg-gradient-to-r from-purple-500 to-orange-500 text-white font-medium py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl w-full text-sm sm:text-base"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Background animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Button content */}
                  <div className="relative flex items-center justify-center space-x-2 sm:space-x-3">
                    <motion.div
                      animate={{ rotate: [0, 180, 360] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-4 h-4 sm:w-5 sm:h-5"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.div>
                    <span className="whitespace-nowrap">Submit a Report</span>
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                    >
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                    </motion.div>
                  </div>

                  {/* Shine effect */}
                  <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </motion.button>
              </motion.div>
            </div>
          </div>

          {/* Middle Column - Responsive Layout */}
          <div className="w-full justify-center lg:flex-[3] border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 p-2 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col items-center justify-center space-y-8">
                {/* Main Title Section */}
                <div className="text-center ">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-2xl sm:text-sm lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-orange-500 via-purple-500 to-orange-500 bg-clip-text text-transparent leading-tight"
                  >
                    Visualizing the Pulse of City
                  </motion.h1>
                </div>

                {/* Animated Tags Section */}
                <div className="w-full max-w-4xl">
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-2">
                    <AnimatePresence>
                      {fadeInTexts.map((text, index) => (
                        <motion.span
                          key={index}
                          initial={{ opacity: 0, scale: 0.8, y: 20 }}
                          animate={
                            visibleTexts.includes(index)
                              ? {
                                opacity: 1,
                                scale: 1,
                                y: 0,
                              }
                              : {
                                opacity: 0,
                                scale: 0.8,
                                y: 20,
                              }
                          }
                          transition={{
                            duration: 0.6,
                            ease: [0.25, 0.46, 0.45, 0.94],
                            delay: index * 0.1,
                          }}
                          className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs sm:text-sm font-medium border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
                        >
                          <div className="w-1.5 h-1.5 bg-gradient-to-r from-orange-400 to-purple-400 rounded-full mr-2"></div>
                          {text}
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Main Content Area */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                  className="w-full flex justify-center"
                >
                  <MoodMap />
                </motion.div>

                {/* Additional Info Section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
                  className="text-center flex justify-center items-center gap-6"
                >

                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                      Powered by real-time data analytics and machine learning
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-xs text-gray-400 dark:text-gray-600">
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse"></div>
                        Live Data
                      </span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-1.5"></div>
                        Updated Every 5min
                      </span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mr-1.5"></div>
                        AI Insights
                      </span>
                    </div>
                  </div>

                  <div className="text-white">
                    <button
                      onClick={handleClickMap}
                      className="text-xs px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors duration-200 backdrop-blur-sm border border-white/20 shadow-sm"
                    >
                      View full map 🔗
                    </button>
                  </div>

                </motion.div>
              </div>
            </div>
          </div>


          {/* Right Column - Responsive Layout */}
          <div className="w-full lg:flex-2 p-3 sm:p-4 lg:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="h-full min-h-[200px] lg:min-h-0 bg-gray-900/30 rounded-xl border border-gray-800 border-dashed flex items-center justify-center"
            >
              {/* <div className="text-center text-gray-500 p-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-700 rounded"></div>
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-2">Right Section</h3>
                <p className="text-xs sm:text-sm">Add your component here</p>
              </div> */}
              <Chatbot />

            </motion.div>
          </div>
        </div>

        {/* Responsive Floating Elements */}
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
            className="absolute top-1/4 left-1/4 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full"
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
            className="absolute bottom-1/3 left-1/3 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white/30 rounded-full"
          />
        </div>

        {/* Submit Report Modal */}
        <AnimatePresence>{showReportModal && <UserSubmitReport onClose={closeModal} />}</AnimatePresence>
      </div>
    </ProtectedRoute>
  )
}
