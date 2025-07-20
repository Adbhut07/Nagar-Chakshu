// src/components/shared/Header.tsx
'use client';

import { ThemeToggle } from './ThemeToggle';
import { Input } from '@/components/ui/input';
import { Bell, Search } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full px-4 py-2 bg-white dark:bg-gray-950 shadow-md sticky top-0 z-50 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-primary">Bengaluru City Pulse</h1>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search city data..."
            className="pl-8 w-72"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Bell className="text-gray-600 dark:text-gray-300" />
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full" />
      </div>
    </header>
  );
}
