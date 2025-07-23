"use client"

import type React from "react"
import { useState, useEffect } from "react"

type LiveDataProps = {
  processedData: any[]
}

const LiveData: React.FC<LiveDataProps> = ({ processedData }) => {
  console.log("Processed Data received at live data comp:", processedData)

  const [visibleData, setVisibleData] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [fadeKey, setFadeKey] = useState(0)

  const itemsToShow = 4

  // Color palette matching NagarChakshu theme
  const badgeColors = [
    "bg-purple-600", // Primary purple from theme
    "bg-red-600", // Red accent from theme
    "bg-purple-500",
    "bg-red-500",
    "bg-purple-700",
    "bg-red-700",
  ]

  useEffect(() => {
    if (processedData && processedData.length > 0) {
      const initialData = processedData.slice(0, Math.min(itemsToShow, processedData.length))
      setVisibleData(initialData)
    }
  }, [processedData])

  useEffect(() => {
    if (!processedData || processedData.length <= itemsToShow) return

    const interval = setInterval(() => {
      setFadeKey((prev) => prev + 1) // Trigger fade animation

      setTimeout(() => {
        setCurrentIndex((prevIndex) => {
          const newIndex = (prevIndex + 1) % Math.max(1, processedData.length - itemsToShow + 1)
          const newData = processedData.slice(newIndex, newIndex + itemsToShow)
          setVisibleData(newData)
          return newIndex
        })
      }, 300) // Fade out duration
    }, 3000)

    return () => clearInterval(interval)
  }, [currentIndex, processedData, itemsToShow])

  const getBadgeColor = (index: number) => {
    return badgeColors[index % badgeColors.length]
  }

  if (!processedData || processedData.length === 0) {
    return (
      <div className="w-[420px] h-80">
        <div className="bg-black border border-gray-800 rounded-lg shadow-2xl h-full flex items-center justify-center">
          <p className="text-gray-400 text-sm">No live data available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[500px] h-80">
      <div className="bg-black border border-gray-800 rounded-lg shadow-2xl h-full overflow-hidden">
        {/* Header matching NagarChakshu theme */}
        <div className="bg-gray-900/50 border-b border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white flex items-center gap-3">
              Live Data
              <div className="relative">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-2 h-2 bg-red-600 rounded-full animate-ping opacity-75"></div>
              </div>
            </h2>
            <div className="text-xs text-gray-400">Real-time updates</div>
          </div>
        </div>

        {/* Feed Container with fade animation */}
        <div className="p-4 space-y-3 h-64 overflow-hidden">
          <div key={fadeKey} className="space-y-3 animate-in fade-in duration-700 ease-out">
            {visibleData.map((data, index) => (
              <div
                key={`${currentIndex}-${index}`}
                className="group"
                style={{
                  animationDelay: `${index * 150}ms`,
                }}
              >
                <div className="bg-gray-900/80 border h-30 border-gray-800 rounded-lg p-3 hover:border-purple-600/50 transition-all duration-300 hover:bg-gray-900">
                  <div className="space-y-2">
                    {/* Title */}
                    <h3 className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors duration-300 line-clamp-1">
                      {data.description}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{data.advice}</p>

                    {/* Location and Categories */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {/* Location */}
                      {data.location && (
                        <div className="flex items-center gap-1 text-gray-500 min-w-0">
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
                          <span className="text-xs truncate">{data.location}</span>
                        </div>
                      )}

                      {/* Categories */}
                      {data.categories && data.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-end">
                          {data.categories.slice(0, 2).map((category: string, idx: number) => (
                            <span
                              key={idx}
                              className={`${getBadgeColor(idx)} text-white text-xs font-medium px-2 py-1 rounded transition-all duration-200 hover:scale-105`}
                            >
                              {category}
                            </span>
                          ))}
                          {data.categories.length > 2 && (
                            <span className="text-xs text-gray-500 px-1">+{data.categories.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status indicator */}
        <div className="absolute bottom-2 right-3">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <div className="w-1 h-1 bg-purple-600 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveData
