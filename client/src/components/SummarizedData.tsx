"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { MapPin, Clock, Users, AlertCircle } from "lucide-react"

type SummarizedDataItem = {
  summary: string
  advice: string
  occurrences: number
  resolution_time: {
    _nanoseconds: number
  }
  categories: string[]
  location: string
}

type LiveDataProps = {
  summarizedData: SummarizedDataItem[]
  setHideLiveData: React.Dispatch<React.SetStateAction<boolean>>
}

const SummarizedData: React.FC<LiveDataProps> = ({ summarizedData, setHideLiveData }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [loadingStep, setLoadingStep] = useState(0)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const totalLoadingTime = 20000
  const stepDuration = totalLoadingTime / 4

  // Enhanced color palette for category badges
  const badgeColors = [
    "bg-gradient-to-r from-purple-500 to-purple-600",
    "bg-gradient-to-r from-red-500 to-red-600",
    "bg-gradient-to-r from-blue-500 to-blue-600",
    "bg-gradient-to-r from-green-500 to-green-600",
    "bg-gradient-to-r from-orange-500 to-orange-600",
    "bg-gradient-to-r from-pink-500 to-pink-600",
    "bg-gradient-to-r from-indigo-500 to-indigo-600",
    "bg-gradient-to-r from-teal-500 to-teal-600",
  ]

  const loadingSteps = [
    {
      title: "Initializing Data Synthesis",
      description: "Preparing to analyze live data streams from your location...",
      icon: "🔄",
      color: "from-blue-400 to-blue-600",
    },
    {
      title: "Injecting Live Data to Agent",
      description: "Collecting and processing real-time data streams...",
      icon: "📡",
      color: "from-purple-400 to-purple-600",
    },
    {
      title: "Creating Summarized Analysis",
      description: "AI agent is analyzing patterns and generating insights...",
      icon: "🧠",
      color: "from-green-400 to-green-600",
    },
    {
      title: "Finalizing Summary",
      description: "Preparing comprehensive insights for display...",
      icon: "✨",
      color: "from-orange-400 to-orange-600",
    },
  ]

  // Handle loading sequence with improved timing
  useEffect(() => {
    if (isLoading) {
      // Smooth progress animation
      progressIntervalRef.current = setInterval(() => {
        setLoadingProgress((prev) => {
          const increment = 100 / (stepDuration / 100)
          return Math.min(prev + increment, 100)
        })
      }, 100)

      // Step transitions with staggered timing
      const timeouts = loadingSteps.map((_, index) =>
        setTimeout(() => {
          setLoadingStep(index)
          setLoadingProgress(0)
        }, stepDuration * index),
      )

      // Final transition to data
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false)
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
        }
      }, totalLoadingTime)

      return () => {
        timeouts.forEach(clearTimeout)
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current)
        }
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
        }
      }
    }
  }, [isLoading, stepDuration, totalLoadingTime])

  const getBadgeColor = (index: number) => {
    return badgeColors[index % badgeColors.length]
  }

  const formatResolutionTime = (nanoseconds: number) => {
    const hours = Math.floor(nanoseconds / 3600000000000)
    const minutes = Math.floor((nanoseconds % 3600000000000) / 60000000000)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  useEffect(() => {
    if (!isLoading) {
      setHideLiveData(true)
    }
  }, [isLoading, setHideLiveData])

  // Loading State
  if (isLoading) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Enhanced Header */}
          <div className="relative px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse"></div>
                <h2 className="text-lg font-semibold text-white">Analyzing Local Events</h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                <span>Processing...</span>
              </div>
            </div>
          </div>

          {/* Enhanced Loading Content */}
          <div className="p-8 min-h-[320px] flex flex-col justify-center items-center space-y-8">
            {/* Current Step with Animation */}
            <div className="text-center space-y-6">
              <div className="relative">
                <div className={`text-6xl animate-bounce filter drop-shadow-lg`}>{loadingSteps[loadingStep].icon}</div>
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${loadingSteps[loadingStep].color} rounded-full blur-xl opacity-20 animate-pulse`}
                ></div>
              </div>

              <div className="space-y-3 max-w-sm">
                <h3 className="text-xl font-bold text-white tracking-tight">{loadingSteps[loadingStep].title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{loadingSteps[loadingStep].description}</p>
              </div>
            </div>

            {/* Enhanced Progress Section */}
            <div className="w-full max-w-sm space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="font-medium">
                  Step {loadingStep + 1} of {loadingSteps.length}
                </span>
                <span className="font-mono">{Math.round(loadingProgress)}%</span>
              </div>

              <div className="relative w-full bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className={`h-full bg-gradient-to-r ${loadingSteps[loadingStep].color} rounded-full transition-all duration-500 ease-out shadow-lg`}
                  style={{ width: `${loadingProgress}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
              </div>
            </div>

            {/* Enhanced Step Indicators */}
            <div className="flex space-x-4">
              {loadingSteps.map((step, index) => (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div
                    className={`w-4 h-4 rounded-full transition-all duration-700 shadow-lg ${
                      index < loadingStep
                        ? "bg-gradient-to-r from-green-400 to-green-500 shadow-green-400/50"
                        : index === loadingStep
                          ? `bg-gradient-to-r ${step.color} shadow-lg animate-pulse`
                          : "bg-slate-600 shadow-slate-600/30"
                    }`}
                  />
                  <div className="text-xs text-slate-500 font-medium opacity-60">{index + 1}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Empty State
  if (!summarizedData || summarizedData.length === 0) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl min-h-[320px] flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-300">No Data Available</h3>
              <p className="text-sm text-slate-500">No live events found for your location at this time.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Data Display State
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-gradient-to-br bg-black backdrop-blur-xl border border-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Enhanced Header */}
        <div className="relative px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
              <h2 className="text-lg font-semibold text-white">Local Event Summary</h2>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {summarizedData.length} event{summarizedData.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Enhanced Scrollable Content */}
        <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50">
          <div className="p-6 space-y-6">
            {summarizedData.map((data, index) => (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-slate-800/40 to-slate-700/20 hover:from-slate-700/60 hover:to-slate-600/30 p-5 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {/* Content */}
                <div className="space-y-4">
                  {/* Main Summary */}
                  <div className="space-y-3">
                    <p className="text-slate-200 leading-relaxed text-sm font-medium group-hover:text-white transition-colors duration-200">
                      {data.summary}
                    </p>

                    {data.advice && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-blue-200 text-sm leading-relaxed">
                          <span className="font-semibold text-blue-100">Advice: </span>
                          {data.advice}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Categories */}
                  {data.categories && data.categories.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {data.categories.slice(0, 3).map((category: string, idx: number) => (
                        <span
                          key={idx}
                          className={`${getBadgeColor(idx)} text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200`}
                        >
                          {category}
                        </span>
                      ))}
                      {data.categories.length > 3 && (
                        <span className="bg-gradient-to-r from-slate-600 to-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                          +{data.categories.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-700/30">
                    {data.location && (
                      <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-300 transition-colors duration-200">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs font-medium">{data.location}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-300 transition-colors duration-200">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-medium">{data.occurrences} reports</span>
                    </div>

                    {data.resolution_time?._nanoseconds && (
                      <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-300 transition-colors duration-200">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs font-medium">
                          ETA: {formatResolutionTime(data.resolution_time._nanoseconds)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Custom Styles */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-thumb-slate-600::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #64748b, #475569);
          border-radius: 4px;
          border: 1px solid #334155;
        }
        .scrollbar-thumb-slate-600::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #475569, #334155);
        }
        .scrollbar-track-slate-800::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 4px;
        }
        .overflow-y-auto {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  )
}

export default SummarizedData
