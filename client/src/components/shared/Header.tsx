// src/components/shared/Header.tsx
'use client';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, Search, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Header() {
  const { user, signOut, loading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      // You could add a toast notification here to show the error
    } finally {
      setIsSigningOut(false);
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.displayName) return 'U';
    return user.displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="w-full px-2 sm:px-4 py-2 bg-white dark:bg-gray-950 shadow-md sticky top-0 z-50 flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <Link href="/" className="text-base sm:text-xl font-bold text-primary hover:text-primary/80 transition-colors truncate">
          <span className="hidden sm:inline">Bengaluru City Pulse</span>
          <span className="sm:hidden">City Pulse</span>
        </Link>
        <div className="relative hidden md:block">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search city data..."
            className="pl-8 w-48 lg:w-72"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
        <nav className="hidden md:flex items-center gap-2 lg:gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">Home</Button>
          </Link>
          <Link href="/submit-report">
            <Button variant="ghost" size="sm">Report Issue</Button>
          </Link>
        </nav>

        <ThemeToggle />
        
        <Bell className="text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-800 dark:hover:text-gray-100 transition-colors w-5 h-5 sm:w-6 sm:h-6" />
        
        {/* User Avatar and Dropdown */}
        {!loading && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={user.photoURL || undefined} 
                    alt={user.displayName || 'User'} 
                  />
                  <AvatarFallback className="text-xs">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                onClick={handleLogout}
                disabled={isSigningOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isSigningOut ? 'Signing out...' : 'Logout'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // Fallback avatar for non-authenticated users or while loading
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
            {loading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <User className="w-4 h-4 text-gray-500" />
            )}
          </div>
        )}
      </div>
    </header>
  );
}