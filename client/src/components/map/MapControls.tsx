'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, RotateCcw } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
}

interface Incident {
  categories: string[];
}

interface Filters {
  categories: string[];
  radius: number;
  location: Location | null;
}

interface MapControlsProps {
  filters: Filters;
  incidents: Incident[];
  onFilterChange: (filters: Partial<Filters>) => void;
}

const radiusOptions = [
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 20000, label: '20 km' },
  { value: 50000, label: '50 km' },
];

const MapControls = ({ filters, incidents, onFilterChange }: MapControlsProps) => {
  const allCategories = Array.from(
    new Set(incidents.flatMap(incident => incident.categories))
  ).sort();

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    onFilterChange({ categories: newCategories });
  };

  const clearFilters = () => {
    onFilterChange({ categories: [] });
  };

  return (
    <Card className="w-64 sm:w-80 max-w-[calc(100vw-2rem)]">
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center">
          <Filter className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div>
          <label className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 block">Search Radius</label>
          <select
            value={filters.radius.toString()}
            onChange={(e) => onFilterChange({ radius: parseInt(e.target.value) })}
            className="w-full px-2 py-1 sm:px-3 sm:py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {radiusOptions.map((option) => (
              <option key={option.value} value={option.value.toString()}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <label className="text-xs sm:text-sm font-medium">Categories</label>
            {filters.categories.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-auto p-1 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1 sm:gap-2 max-h-24 sm:max-h-32 overflow-y-auto">
            {allCategories.map((category) => (
              <Badge
                key={category}
                variant={filters.categories.includes(category) ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => toggleCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
          
          {allCategories.length === 0 && (
            <p className="text-xs text-gray-500">No categories available</p>
          )}
        </div>

        <div className="pt-2 border-t text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Total Incidents:</span>
            <span className="font-medium">{incidents.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapControls;
