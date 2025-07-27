"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { MapPin, Clock, Users, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { voteForIncident, removeVoteForIncident, checkUserVoteStatus, getIncidentVotes } from "@/lib/api"
import { toast } from "sonner"

type SummarizedDataItem = {
  id?: string
  summary: string
  advice: string
  occurrences: number
  resolution_time: any
  categories: string[]
  location: string
  votes?: number
  userHasVoted?: boolean
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
  
  // Voting state - simplified to just track vote counts
  const [votesData, setVotesData] = useState<{[key: string]: number}>({})
  const [votingLoading, setVotingLoading] = useState<{[key: string]: boolean}>({})
  const { user } = useAuth()

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

  // Voting functionality - simplified
  const handleVote = async (incidentId: string) => {
    if (!user || !incidentId) {
      toast.error("Please sign in to vote")
      return
    }

    setVotingLoading(prev => ({ ...prev, [incidentId]: true }))

    try {
      const token = await user.getIdToken()
      
      try {
        // First try to add a vote
        await voteForIncident(incidentId, token)
        // If successful, update local vote count
        setVotesData(prev => ({
          ...prev,
          [incidentId]: (prev[incidentId] || 0) + 1
        }))
        toast.success("Vote added successfully")
      } catch (voteError: any) {
        console.log("Vote Error:", voteError); // Debug log to see error structure
        
        // Check for 409 error in multiple ways
        const is409Error = 
          voteError.status === 409 || 
          voteError.message?.includes("409") ||
          voteError.message?.includes("already voted") ||
          voteError.message?.toLowerCase().includes("conflict");
        
        if (is409Error) {
          // Show beautiful toast confirmation for removing vote
          toast.custom((toastId) => (
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-600 rounded-xl p-4 shadow-2xl backdrop-blur-xl max-w-md">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
                  <h3 className="text-white font-semibold text-sm">Vote Already Cast</h3>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  You have already voted for this incident. Would you like to remove your vote?
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={async () => {
                      toast.dismiss(toastId);
                      try {
                        await removeVoteForIncident(incidentId, token);
                        setVotesData(prev => ({
                          ...prev,
                          [incidentId]: Math.max(0, (prev[incidentId] || 0) - 1)
                        }));
                        toast.success("Vote removed successfully");
                      } catch (removeError) {
                        console.error("Error removing vote:", removeError);
                        toast.error("Failed to remove vote");
                      }
                    }}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors duration-200"
                  >
                    Remove Vote
                  </button>
                  <button
                    onClick={() => {
                      toast.dismiss(toastId);
                      toast.info("Vote action cancelled");
                    }}
                    className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors duration-200"
                  >
                    Keep Vote
                  </button>
                </div>
              </div>
            </div>
          ), {
            duration: 10000, // 10 seconds to make decision
            position: 'top-center',
          });
        } else {
          // Handle other vote errors
          console.error("Error voting:", voteError)
          toast.error("Failed to add vote")
        }
      }
    } catch (error) {
      console.error("Error in voting process:", error)
      toast.error("Failed to process vote")
    } finally {
      setVotingLoading(prev => ({ ...prev, [incidentId]: false }))
    }
  }

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


 

const getEtaText = (data: SummarizedDataItem) => {
  const etaInSeconds = data.resolution_time._seconds;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const remainingSeconds = etaInSeconds - nowInSeconds;

  if (remainingSeconds > 0) {
    const days = Math.floor(remainingSeconds / 86400);
    const hours = Math.floor((remainingSeconds % 86400) / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    
    let etaText = '';
    
    if (days > 0) {
      etaText = hours > 0 ? `${days}d ${hours}h ${minutes}m` : `${days}d ${minutes}m`;
    } else if (hours > 0) {
      etaText = `${hours}h ${minutes}m`;
    } else {
      etaText = `${minutes}m`;
    }

    return <p>ETA: {etaText}</p>;
  } else {
    return <p>Resolved</p>;
  }
};

  useEffect(() => {
    if (!isLoading) {
      setHideLiveData(true)
    }
  }, [isLoading, setHideLiveData])

  // Initialize vote counts from data
  useEffect(() => {
    if (summarizedData && summarizedData.length > 0) {
      // Initialize voting data with existing votes from data
      const initialVotesData: {[key: string]: number} = {}
      
      summarizedData.forEach((item, index) => {
        const incidentId = item.id || `incident_${index}`
        initialVotesData[incidentId] = item.votes || 0 // Use existing votes from data or default to 0
      })
      
      setVotesData(initialVotesData)
    }
  }, [summarizedData])

  // Loading State
  if (isLoading) {
    return (
<div className="w-full max-w-md mx-auto">
  <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-xl overflow-hidden">
    
    {/* Compact Header */}
    <div className="relative px-4 py-3 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse"></div>
          <h2 className="font-semibold text-white">Analyzing Events</h2>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></div>
          <span>Processing</span>
        </div>
      </div>
    </div>

    {/* Compact Body */}
    <div className="p-5 min-h-[180px] flex flex-col justify-center items-center space-y-4">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="text-4xl animate-bounce drop-shadow-md">{loadingSteps[loadingStep].icon}</div>
          <div className={`absolute inset-0 bg-gradient-to-r ${loadingSteps[loadingStep].color} rounded-full blur-lg opacity-20 animate-pulse`} />
        </div>

        <div className="space-y-1 max-w-xs">
          <h3 className="text-base font-semibold text-white tracking-tight">{loadingSteps[loadingStep].title}</h3>
          <p className="text-xs text-slate-300">{loadingSteps[loadingStep].description}</p>
        </div>
      </div>

      {/* Compact Progress Section */}
      <div className="w-full max-w-xs space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>Step {loadingStep + 1}/{loadingSteps.length}</span>
          <span className="font-mono">{Math.round(loadingProgress)}%</span>
        </div>

        <div className="relative w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${loadingSteps[loadingStep].color} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${loadingProgress}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
        </div>
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
                         {getEtaText(data)}
                        </span>
                      </div>
                    )}

                    {/* Voting Section */}
                    {user && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVote(data.id || `incident_${index}`)}
                          disabled={votingLoading[data.id || `incident_${index}`]}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                            votingLoading[data.id || `incident_${index}`]
                              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                              : 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                          }`}
                        >
                          {votingLoading[data.id || `incident_${index}`] ? 'Processing...' : 'Vote'}
                        </button>
                        <span className="text-xs font-medium text-slate-400">
                          {votesData[data.id || `incident_${index}`] || 0} votes
                        </span>
                      </div>
                    )}

                    {/* Show vote count for non-logged users */}
                    {!user && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <span className="text-xs font-medium">
                          {votesData[data.id || `incident_${index}`] || 0} votes
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
