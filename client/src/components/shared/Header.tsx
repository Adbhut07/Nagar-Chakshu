"use client"

import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Bell, Search, LogOut, User, Menu } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function Header() {
  const { user, signOut, loading, userProfile } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)

  const handleLogout = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      console.log("User signed out successfully")
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setIsSigningOut(false)
    }
  }

  const getUserInitials = () => {
    if (!user?.displayName) return "U"
    return user.displayName
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-12 sm:h-14">
        {/* Left side - Logo and Search */}
        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 flex-1 min-w-0">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="flex items-center gap-1">
              <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-200">
                Nagar
              </span>
              <span className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
                Chakshu
              </span>
            </div>
          </Link>

          {/* Search Bar - Hidden on mobile, visible on md+ */}
          <div className="hidden md:block relative flex-1 max-w-sm lg:max-w-md xl:max-w-lg">
            <div className={`relative transition-all duration-300 ${searchFocused ? "scale-105" : "scale-100"}`}>
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${
                  searchFocused ? "text-purple-500" : "text-gray-400"
                }`}
              />
              <Input
                type="text"
                placeholder="Search issues, reports..."
                className={`pl-10 w-full h-8 sm:h-9 bg-gray-50/80 border-gray-200 text-sm text-gray-900 placeholder:text-gray-500 
                  transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white
                  hover:bg-gray-50 ${searchFocused ? "shadow-md" : "shadow-sm"}`}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
          </div>
        </div>

        {/* Right side - Navigation and User */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-shrink-0">
          {/* Navigation - Hidden on mobile, visible on sm+ */}
          <nav className="hidden sm:flex items-center gap-1 sm:gap-2">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs sm:text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 h-7 sm:h-8 px-2 sm:px-3 font-medium transition-all duration-200 hover:scale-105"
              >
                Home
              </Button>
            </Link>
            <Link href="/submit-report">
              <Button
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 
                  text-white h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105
                  focus:ring-2 focus:ring-purple-500/20"
              >
                <span className="hidden sm:inline">Report Issue</span>
                <span className="sm:hidden">Report</span>
              </Button>
            </Link>
          </nav>

          {/* Mobile Search Button - Visible only on mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-1.5 h-7 w-7 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
          >
            <Search className="h-3.5 w-3.5" />
          </Button>

          {/* Notification Bell */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 h-7 w-7 text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-all duration-200 hover:scale-110"
            >
              <Bell className="h-3.5 w-3.5" />
            </Button>
            {/* Notification badge - Hidden on very small screens */}
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 h-3 w-3 sm:h-4 sm:w-4 p-0 flex items-center justify-center text-xs animate-pulse"
            >
              <span className="hidden sm:inline">3</span>
              <span className="sm:hidden">•</span>
            </Badge>
          </div>

          {/* User Avatar and Dropdown */}
          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-full p-0 hover:bg-gray-100 transition-all duration-200 hover:scale-110 focus:ring-2 focus:ring-purple-500/20"
                >
                  <Avatar className="h-6 w-6 sm:h-7 sm:w-7 ring-2 ring-transparent hover:ring-purple-200 transition-all duration-200">
                    <AvatarImage
                      src={userProfile?.profilePhotoUrl || user.photoURL || undefined}
                      alt={user.displayName || "User"}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-orange-500 text-white font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 sm:w-64 bg-white border border-gray-200 shadow-xl rounded-xl p-2"
                align="end"
                forceMount
                sideOffset={8}
              >
                <div className="flex flex-col space-y-2 p-2 sm:p-3 bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={userProfile?.profilePhotoUrl || user.photoURL || undefined} 
                        alt={user.displayName || "User"} 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-orange-500 text-white text-xs font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.displayName || "User"}</p>
                      <p className="text-xs text-gray-600 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator className="bg-gray-200" />

                <DropdownMenuItem
                  asChild
                  className="text-gray-700 focus:bg-gray-50 focus:text-gray-900 rounded-lg cursor-pointer transition-colors duration-150"
                >
                  <Link href="/profile" className="flex items-center gap-3 p-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Profile Settings</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-gray-200" />

                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 rounded-lg transition-colors duration-150 p-2"
                  onClick={handleLogout}
                  disabled={isSigningOut}
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium">{isSigningOut ? "Signing out..." : "Sign Out"}</span>
                  </div>
                  {isSigningOut && (
                    <div className="ml-auto">
                      <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                    </div>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 rounded-full transition-all duration-200">
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
              ) : (
                <User className="w-3.5 h-3.5 text-gray-500" />
              )}
            </div>
          )}

          {/* Mobile Menu Button - Visible only on mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="sm:hidden p-1.5 h-7 w-7 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
          >
            <Menu className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
