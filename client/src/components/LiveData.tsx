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

  // Color palette for category badges
  const badgeColors = ["bg-purple-600", "bg-red-600", "bg-blue-600", "bg-green-600", "bg-orange-600", "bg-pink-600"]

  useEffect(() => {
    if (processedData && processedData.length > 0) {
      const initialData = processedData.slice(0, Math.min(itemsToShow, processedData.length))
      setVisibleData(initialData)
    }
  }, [processedData])

  useEffect(() => {
    if (!processedData || processedData.length <= itemsToShow) return

    const interval = setInterval(() => {
      setFadeKey((prev) => prev + 1)

      setTimeout(() => {
        setCurrentIndex((prevIndex) => {
          const newIndex = (prevIndex + 1) % Math.max(1, processedData.length - itemsToShow + 1)
          const newData = processedData.slice(newIndex, newIndex + itemsToShow)
          setVisibleData(newData)
          return newIndex
        })
      }, 100)
    }, 1000)

    return () => clearInterval(interval)
  }, [currentIndex, processedData, itemsToShow])

  const getBadgeColor = (index: number) => {
    return badgeColors[index % badgeColors.length]
  }

  if (!processedData || processedData.length === 0) {
    return (
      <div className="w-[480px] h-96">
        <div className="bg-gray-950/90 backdrop-blur-xl border border-gray-800/50 rounded-xl shadow-2xl h-full flex items-center justify-center">
          <p className="text-gray-400 text-sm">No live data available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[550px] h-96">
      <div className="bg-gray-950/90 backdrop-blur-xl border border-gray-800/50 rounded-xl shadow-2xl h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            Live Data
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </h2>
          <span className="text-xs text-gray-400">Real-time updates</span>
        </div>

        {/* Feed Container */}
        <div className="p-4 space-y-4 h-80 overflow-hidden">
          <div key={fadeKey} className="space-y-4 animate-in fade-in duration-700 ease-out">
            {visibleData.map((data, index) => (
              <div
                key={`${currentIndex}-${index}`}
                className="group"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className="space-y-2">
                  {/* Main content with categories inline */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                        {data.description}
                      </p>
                    </div>

                    {/* Categories */}
                    {data.categories && data.categories.length > 0 && (
                      <div className="flex gap-1 flex-shrink-0">
                        {data.categories.slice(0, 2).map((category: string, idx: number) => (
                          <span
                            key={idx}
                            className={`${getBadgeColor(idx)} text-white text-xs font-medium px-2 py-1 rounded text-nowrap`}
                          >
                            {category}
                          </span>
                        ))}
                        {data.categories.length > 2 && (
                          <span className="bg-gray-700 text-gray-300 text-xs font-medium px-2 py-1 rounded">
                            +{data.categories.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  {data.location && (
                    <div className="flex items-center gap-1 text-gray-500">
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
                      <span className="text-xs">{data.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveData
