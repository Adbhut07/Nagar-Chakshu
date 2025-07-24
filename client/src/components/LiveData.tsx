"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"

interface ProcessedDataItem {
  description: string
  categories?: string[]
  location?: string
  [key: string]: unknown
}

type LiveDataProps = {
  processedData: ProcessedDataItem[]
}

const LiveData: React.FC<LiveDataProps> = ({ processedData }) => {
  const [visibleData, setVisibleData] = useState<ProcessedDataItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const itemsToShow = 5
  const transitionDuration = 500 // ms
  const displayDuration = 3000 // ms

  // Color palette for category badges
  const badgeColors = ["bg-purple-600", "bg-red-600", "bg-blue-600", "bg-green-600", "bg-orange-600", "bg-pink-600"]

  // Initialize visible data
  useEffect(() => {
    if (processedData && processedData.length > 0) {
      const initialData = processedData.slice(0, Math.min(itemsToShow, processedData.length))
      setVisibleData(initialData)
      setCurrentIndex(0)
    }
  }, [processedData])

  // Handle mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle auto-rotation
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Only start rotation if we have more data than what we can show
    if (!processedData || processedData.length <= itemsToShow) {
      return
    }

    const startRotation = () => {
      intervalRef.current = setInterval(() => {
        setIsTransitioning(true)
        
        setTimeout(() => {
          setCurrentIndex((prevIndex) => {
            const maxIndex = processedData.length - itemsToShow
            const newIndex = prevIndex >= maxIndex ? 0 : prevIndex + 1
            const newData = processedData.slice(newIndex, newIndex + itemsToShow)
            setVisibleData(newData)
            return newIndex
          })
          
          setTimeout(() => {
            setIsTransitioning(false)
          }, 50) // Small delay to ensure smooth transition
        }, transitionDuration / 2)
        
      }, displayDuration)
    }

    startRotation()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [processedData, itemsToShow, displayDuration, transitionDuration])

  const getBadgeColor = (index: number) => {
    return badgeColors[index % badgeColors.length]
  }

  if (!processedData || processedData.length === 0) {
    return (
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl h-10 sm:h-12">
        <div className="bg-gray-950/90 backdrop-blur-xl border border-gray-800/50 rounded-xl shadow-2xl h-full flex items-center justify-center px-4">
          <p className="text-gray-400 text-xs sm:text-sm text-center">Fetching live data from different sources</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl h-60 sm:h-64 lg:h-72">
      <div className="bg-black backdrop-blur-xl border border-white rounded-xl shadow-2xl h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-800/50">
          <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2 flex-1 min-w-0">
            <span className="truncate">Live Data</span>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0"></div>
            <p className="text-xs hidden sm:inline-block">{processedData.length}+ events in your location</p>
          </h2>
          <span className="text-xs text-gray-400 hidden sm:inline-block">Real-time updates</span>
        </div>

        {/* Feed Container */}
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 h-48 sm:h-52 lg:h-60 overflow-hidden">
          <div 
            className={`space-y-3 sm:space-y-4 transition-all duration-500 ease-in-out ${
              isTransitioning ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
            }`}
          >
            {visibleData.map((data, index) => (
              <div
                key={`${currentIndex}-${index}`}
                className="group transform transition-all duration-300 ease-out"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: isTransitioning ? 'none' : `slideInUp 0.6s ease-out ${index * 100}ms both`
                }}
              >
                <div className="space-y-1 sm:space-y-2">
                  {/* Main content with categories inline */}
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300 line-clamp-2">
                        {data.description}
                      </p>
                    </div>

                    {/* Categories */}
                    {data.categories && data.categories.length > 0 && (
                      <div className="flex gap-1 flex-shrink-0 flex-wrap sm:flex-nowrap">
                        {data.categories.slice(0, isMobile ? 1 : 2).map((category: string, idx: number) => (
                          <span
                            key={idx}
                            className={`${getBadgeColor(idx)} text-white text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-nowrap transition-all duration-300 group-hover:scale-105`}
                          >
                            {category.length > 8 ? `${category.substring(0, 8)}...` : category}
                          </span>
                        ))}
                        {data.categories.length > (isMobile ? 1 : 2) && (
                          <span className="bg-gray-700 text-gray-300 text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-all duration-300 group-hover:scale-105">
                            +{data.categories.length - (isMobile ? 1 : 2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  {data.location && (
                    <div className="flex items-center gap-1 text-gray-500 group-hover:text-gray-400 transition-colors duration-300">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="text-xs truncate max-w-[200px] sm:max-w-none">{data.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom CSS for slide-in animation */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default LiveData