"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useRouter } from "next/navigation"

const SignIn: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [animationStep, setAnimationStep] = useState(0)
  const { signInWithGoogle, user, isUserRegistered, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const timeouts = [
      setTimeout(() => setAnimationStep(1), 500),
      setTimeout(() => setAnimationStep(2), 1200),
      setTimeout(() => setAnimationStep(3), 2000),
      setTimeout(() => setAnimationStep(4), 2800),
    ]
    return () => timeouts.forEach(clearTimeout)
  }, [])

  const handleGoogleSignIn = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      const signedInUser = await signInWithGoogle()
      console.log("Sign in completed for:", signedInUser.email)
    } catch (error: any) {
      console.error("Sign in error:", error)
      setError(error.message || "Failed to sign in with Google")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6">
            <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-white text-lg sm:text-xl font-light px-4">Initializing NagarChakshu AI...</p>
        </div>
      </div>
    )
  }

  if (user && isUserRegistered) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-light text-white mb-3 sm:mb-4 px-4">
            Welcome back, {user.displayName}!
          </h2>
          <p className="text-white/60 mb-6 sm:mb-8 px-4 text-sm sm:text-base">
            You are already signed in to NagarChakshu AI.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
          >
            Access Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (user && !isUserRegistered) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-orange-500 to-purple-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-light text-white mb-3 sm:mb-4 px-4">Almost there!</h2>
          <p className="text-white/60 mb-6 sm:mb-8 px-4 text-sm sm:text-base">
            Complete your registration to join NagarChakshu AI.
          </p>
          <button
            onClick={() => router.push("/register")}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
          >
            Complete Registration
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col lg:flex-row">
      {/* Left Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-16 order-2 lg:order-1">
        <div className="w-full max-w-md">
          <div className="mb-8 sm:mb-12">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="white"
                className="w-5 h-5 sm:w-6 sm:h-6"
              >
                <path d="M12 4.5C7.5 4.5 3.7 7.6 2 12c1.7 4.4 5.5 7.5 10 7.5s8.3-3.1 10-7.5c-1.7-4.4-5.5-7.5-10-7.5zm0 13a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11zm0-9a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white mb-2 sm:mb-3">Welcome to</h1>
            <p className="text-white text-2xl sm:text-3xl font-semibold tracking-wide">NagarChakshu AI</p>
            <p className="text-white/60 text-base sm:text-lg mt-2">Sign in to monitor the city's pulse</p>
          </div>

          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 border border-red-500/20 bg-red-500/5 text-red-400 rounded-lg animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-start">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-xs sm:text-sm leading-relaxed">{error}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full group relative bg-white hover:bg-white/95 text-black font-medium py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-white/10 text-sm sm:text-base"
          >
            <div className="flex items-center justify-center">
              {loading ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </div>
          </button>

          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-white/40 text-xs sm:text-sm">Secure authentication powered by Google</p>
          </div>
        </div>
      </div>

      {/* Right Side - Animated Info */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-16 relative overflow-hidden order-1 lg:order-2 min-h-[50vh] lg:min-h-screen">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-orange-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-lg w-full">
          <div
            className={`transition-all duration-1000 ease-out ${
              animationStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light text-white mb-6 sm:mb-8 leading-tight">
              NagarChakshu
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">
                AI Awaits
              </span>
            </h2>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div
              className={`flex items-start sm:items-center transition-all duration-700 ease-out delay-300 ${
                animationStep >= 2 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
            >
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 sm:mr-4 mt-2 sm:mt-0 flex-shrink-0"></div>
              <p className="text-white/80 text-sm sm:text-base lg:text-lg leading-relaxed">
                Synthesizes live data from across the city
              </p>
            </div>

            <div
              className={`flex items-start sm:items-center transition-all duration-700 ease-out delay-500 ${
                animationStep >= 3 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
            >
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-3 sm:mr-4 mt-2 sm:mt-0 flex-shrink-0"></div>
              <p className="text-white/80 text-sm sm:text-base lg:text-lg leading-relaxed">
                Supports multimodal geo-tagged citizen reports
              </p>
            </div>

            <div
              className={`flex items-start sm:items-center transition-all duration-700 ease-out delay-700 ${
                animationStep >= 4 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
            >
              <div className="w-2 h-2 bg-white rounded-full mr-3 sm:mr-4 mt-2 sm:mt-0 flex-shrink-0"></div>
              <p className="text-white/80 text-sm sm:text-base lg:text-lg leading-relaxed">
                Provides predictive alerts & personalized insights
              </p>
            </div>
          </div>

          <div
            className={`mt-8 sm:mt-12 transition-all duration-1000 ease-out delay-1000 ${
              animationStep >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p className="text-white/50 text-xs sm:text-sm leading-relaxed">
              City data is dynamic, fast, and noisy. NagarChakshu AI cuts through the chaos — giving citizens a
              real-time, intelligent pulse of the city through synthesized updates, smart alerts, and a powerful
              dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignIn
