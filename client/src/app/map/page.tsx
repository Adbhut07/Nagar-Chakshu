'use client';

import { useAuth } from '@/contexts/AuthContext';
import { fetchSummarizedData } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';

const Map = () => {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const { user } = useAuth();
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const [summarizedData, setSummarizedData] = useState<any[]>([]);
    const markersRef = useRef<google.maps.Marker[]>([]);

    // Custom marker icons using images
    const getMarkerIcon = (category: string) => {
        const iconBase = {
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 32)
        };

        // Create colored circle icons as fallback
        const createFallbackIcon = (color: string, text: string) => {
            return {
                ...iconBase,
                url: 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="14" fill="${color}" stroke="#fff" stroke-width="2"/>
                        <text x="16" y="20" text-anchor="middle" fill="white" font-size="8" font-weight="bold">${text}</text>
                    </svg>
                `)
            };
        };

        switch (category.toLowerCase()) {
            case 'traffic':
                // Try to use image first, fallback to colored circle
                if (window.location.origin + '/images/traffic.png') {
                    return {
                        ...iconBase,
                        url: '/images/traffic.png'
                    };
                }
                return createFallbackIcon('#ff4444', 'TFC');
                
            case 'water-logging':
                return createFallbackIcon('#4444ff', 'H2O');
                
            case 'events':
                return createFallbackIcon('#9c27b0', 'EVT');
                
            case 'stampede':
                return createFallbackIcon('#e91e63', 'STP');
                
            case 'emergency':
                return createFallbackIcon('#f44336', 'EMG');
                
            case 'infrastructure':
                return createFallbackIcon('#607d8b', 'INF');
                
            case 'weather':
                return createFallbackIcon('#2196f3', 'WTH');
                
            case 'public-transport':
                if (window.location.origin + '/images/public-transport.png') {
                    return {
                        ...iconBase,
                        url: '/images/public-transport.png'
                    };
                }
                return createFallbackIcon('#4caf50', 'PUB');
                
            case 'civic-issues':
                return createFallbackIcon('#795548', 'CIV');
                
            case 'security':
                return createFallbackIcon('#ff5722', 'SEC');
                
            case 'utility':
                return createFallbackIcon('#ff9800', 'UTL');
                
            // Legacy categories (keeping for backward compatibility)
            case 'pothole':
                return createFallbackIcon('#8B4513', 'POT');
                
            case 'accident':
                return createFallbackIcon('#ff8800', 'ACC');
                
            case 'construction':
                return createFallbackIcon('#ffaa00', 'CON');
                
            default:
                return createFallbackIcon('#666666', 'DEF');
        }
    };

    // Check if location is within map bounds
    const isWithinBounds = (lat: number, lng: number) => {
        if (!map) return false;
        
        const bounds = map.getBounds();
        if (!bounds) return false;
        
        const position = new google.maps.LatLng(lat, lng);
        return bounds.contains(position);
    };

    // Function to clear all markers
    const clearMarkers = () => {
        markersRef.current.forEach(marker => {
            marker.setMap(null);
        });
        markersRef.current = [];
    };

    // Function to format resolution time
    const formatResolutionTime = (resolution_time: any) => {
        if (!resolution_time || !resolution_time.__seconds) {
            return 'Not specified';
        }
        
        const seconds = resolution_time.__seconds;
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        
        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
            return 'Less than 1 hour';
        }
    };

    // Function to add incident markers from real data
    const addIncidentMarkers = () => {
        if (!map || !summarizedData || summarizedData.length === 0) return;

        // Clear existing markers
        clearMarkers();

        // Add new markers for each incident from summarized data
        summarizedData.forEach((incident, index) => {
            // Check if incident has required location data
            if (!incident.coordinates || !incident.coordinates.lat || !incident.coordinates.lng) {
                console.log(`Skipping incident ${index} - missing coordinates`);
                return;
            }

            // Check if incident is within current map bounds
            if (!isWithinBounds(incident.coordinates.lat, incident.coordinates.lng)) {
                console.log(`Skipping incident at ${incident.location} - outside map bounds`);
                return;
            }

            try {
                // Get first category for marker icon
                const category = incident.categories && incident.categories.length > 0 
                    ? incident.categories[0] 
                    : 'default';

                const markerIcon = getMarkerIcon(category);

                const marker = new google.maps.Marker({
                    position: { lat: incident.coordinates.lat, lng: incident.coordinates.lng },
                    map: map,
                    title: incident.location || `Incident ${index + 1}`,
                    icon: markerIcon
                });

                // Create info window with real data
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div style="padding: 12px; max-width: 280px; font-family: Arial, sans-serif;">
                            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px; font-weight: bold;">
                                ${incident.location || 'Unknown Location'}
                            </h3>
                            <p style="margin: 0 0 10px 0; color: #666; font-size: 13px; line-height: 1.4;">
                                ${incident.advice || 'No advice available'}
                            </p>
                            <div style="margin-bottom: 8px;">
                                <span style="background: ${getIncidentColor(category)}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; text-transform: uppercase; font-weight: bold;">
                                    ${category}
                                </span>
                            </div>
                            <div style="color: #888; font-size: 12px;">
                                <strong>Resolution Time:</strong> ${formatResolutionTime(incident.resolution_time)}
                            </div>
                        </div>
                    `
                });

                // Add click listener to show info window
                marker.addListener('click', () => {
                    infoWindow.open(map, marker);
                });

                markersRef.current.push(marker);
            } catch (error) {
                console.error(`Failed to create marker for incident at ${incident.location}:`, error);
            }
        });

        console.log(`Added ${markersRef.current.length} real incident markers to map`);
    };

    // Get color for incident category
    const getIncidentColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'traffic': return '#ff4444';
            case 'water-logging': return '#4444ff';
            case 'events': return '#9c27b0';
            case 'stampede': return '#e91e63';
            case 'emergency': return '#f44336';
            case 'infrastructure': return '#607d8b';
            case 'weather': return '#2196f3';
            case 'public-transport': return '#4caf50';
            case 'civic-issues': return '#795548';
            case 'security': return '#ff5722';
            case 'utility': return '#ff9800';
            // Legacy categories
            case 'pothole': return '#8B4513';
            case 'accident': return '#ff8800';
            case 'construction': return '#ffaa00';
            default: return '#666666';
        }
    };

    // Simple function to call API
    const callAPI = async (lat: number, lng: number, radius: number) => {
        try {
            if (!user) {
                console.log("No user available");
                return;
            }

            console.log('Getting API data for:', { lat, lng, radius });
            
            const token = await user.getIdToken(true);
            if (!token) {
                console.log("No token available");
                return;
            }

            const radiusInMeters = Math.round(radius * 1000);
            
            const response = await fetchSummarizedData(
                { lat, lng }, 
                radiusInMeters, 
                token
            );
            
            console.log('API Response:', response);
            
            // Set the real data
            if (response && response.incidents) {
                setSummarizedData(response.incidents);
            } else {
                setSummarizedData([]);
            }
            
        } catch (error) {
            console.error('API call failed:', error);
            setSummarizedData([]);
        }
    };

    // Simple function to calculate map radius
    const getMapRadius = (mapInstance: google.maps.Map) => {
        const bounds = mapInstance.getBounds();
        const center = mapInstance.getCenter();

        if (!bounds || !center) return null;

        const centerLat = center.lat();
        const centerLng = center.lng();
        const ne = bounds.getNorthEast();
        
        // Simple distance calculation
        const R = 6371; // Earth radius in km
        const dLat = (ne.lat() - centerLat) * Math.PI / 180;
        const dLng = (ne.lng() - centerLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                 Math.cos(centerLat * Math.PI / 180) * Math.cos(ne.lat() * Math.PI / 180) * 
                 Math.sin(dLng/2) * Math.sin(dLng/2);
        const radius = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return { lat: centerLat, lng: centerLng, radius };
    };

    // Handle map changes with debouncing
    const handleMapChange = () => {
        if (!map || !user) return;

        console.log('Map changed, debouncing API call...');
        
        // Clear previous timeout
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Set new timeout
        debounceRef.current = setTimeout(() => {
            const mapData = getMapRadius(map);
            if (mapData) {
                callAPI(mapData.lat, mapData.lng, mapData.radius);
            }
        }, 1500);
    };

    // Update markers when summarized data changes
    useEffect(() => {
        if (map && summarizedData) {
            addIncidentMarkers();
        }
    }, [summarizedData, map]);

    // Load Google Maps
    useEffect(() => {
        if (window.google?.maps) {
            setIsLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
        script.onload = () => setIsLoaded(true);
        script.onerror = () => console.error('Failed to load Google Maps');
        
        document.head.appendChild(script);
        
        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    // Initialize map
    useEffect(() => {
        if (!isLoaded || !mapRef.current || map) return;

        console.log('Initializing map...');

        const mapInstance = new google.maps.Map(mapRef.current, {
            center: { lat: 20.5937, lng: 78.9629 }, // Center of India
            zoom: 5,
            mapTypeId: 'roadmap'
        });

        setMap(mapInstance);
    }, [isLoaded]);

    // Add event listeners when map is ready
    useEffect(() => {
        if (!map || !user) return;

        console.log('Adding event listeners...');

        // Add event listeners for map changes
        const listeners = [
            map.addListener('bounds_changed', handleMapChange),
            map.addListener('center_changed', handleMapChange),
            map.addListener('zoom_changed', handleMapChange)
        ];

        // Call API immediately when everything is ready
        const mapData = getMapRadius(map);
        if (mapData) {
            callAPI(mapData.lat, mapData.lng, mapData.radius);
        }

        // Cleanup listeners
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            
            listeners.forEach(listener => {
                google.maps.event.removeListener(listener);
            });

            clearMarkers();
        };
    }, [map, user]);

    if (!isLoaded) {
        return (
            <div style={{
                width: '400px',
                height: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: '8px'
            }}>
                Loading Google Maps...
            </div>
        );
    }

    return (
        <div style={{ width: '400px', height: '400px' }}>
            <div
                ref={mapRef}
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '8px'
                }}
            />
            {/* Debug info */}
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                Incidents on map: {markersRef.current.length} | Total data: {summarizedData.length}
            </div>
        </div>
    );
};

export default Map;