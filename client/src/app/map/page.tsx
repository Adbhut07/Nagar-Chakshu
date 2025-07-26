'use client';

import { useAuth } from '@/contexts/AuthContext';
import { fetchSentimentData, fetchSummarizedData } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';

const Map = () => {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const { user, userProfile } = useAuth();
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const [summarizedData, setSummarizedData] = useState<any[]>([]);
    const [sentimentData, setSentimentData] = useState<any[]>([]);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const [isSentiment, setIsSentiment] = useState(false);



    // Custom marker icons using images
    const getMarkerIconForSummarizedData = (category: string) => {
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
                if (window.location.origin + '/images/water-logging.png') {
                    return {
                        ...iconBase,
                        url: '/images/water-logging.png'
                    };
                }
                return createFallbackIcon('#4444ff', 'H2O');

            case 'events':
                if (window.location.origin + '/images/event.png') {
                    return {
                        ...iconBase,
                        url: '/images/event.png'
                    };
                }
                return createFallbackIcon('#9c27b0', 'EVT');

            case 'stampede':
                if (window.location.origin + '/images/stampede.png') {
                    return {
                        ...iconBase,
                        url: '/images/stampede.png'
                    };
                }

                return createFallbackIcon('#e91e63', 'STP');

            case 'emergency':
                if (window.location.origin + '/images/emergency.png') {
                    return {
                        ...iconBase,
                        url: '/images/emergency.png'
                    };
                }
                return createFallbackIcon('#f44336', 'EMG');

            case 'infrastructure':
                if (window.location.origin + '/images/infrastructure.png') {
                    return {
                        ...iconBase,
                        url: '/images/infrastructure.png'
                    };
                }
                return createFallbackIcon('#607d8b', 'INF');

            case 'weather':
                if (window.location.origin + '/images/weather.png') {
                    return {
                        ...iconBase,
                        url: '/images/weather.png'
                    };
                }
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
                if (window.location.origin + '/images/civic-issues.png') {
                    return {
                        ...iconBase,
                        url: '/images/civic-issues.png'
                    };
                }
                return createFallbackIcon('#795548', 'CIV');

            case 'security':
                if (window.location.origin + '/images/security.png') {
                    return {
                        ...iconBase,
                        url: '/images/security.png'
                    };
                }
                return createFallbackIcon('#ff5722', 'SEC');

            case 'utility':
                if (window.location.origin + '/images/utility.png') {
                    return {
                        ...iconBase,
                        url: '/images/utility.png'
                    };
                }
                return createFallbackIcon('#ff9800', 'UTL');

            // Legacy categories (keeping for backward compatibility)
            case 'pothole':
                if (window.location.origin + '/images/pothole.png') {
                    return {
                        ...iconBase,
                        url: '/images/pothole.png'
                    };
                }
                return createFallbackIcon('#8B4513', 'POT');

            case 'accident':
                if (window.location.origin + '/images/accident.png') {
                    return {
                        ...iconBase,
                        url: '/images/accident.png'
                    };
                }
                return createFallbackIcon('#ff8800', 'ACC');

            case 'construction':
                if (window.location.origin + '/images/construction.png') {
                    return {
                        ...iconBase,
                        url: '/images/construction.png'
                    };
                }
                return createFallbackIcon('#ffaa00', 'CON');

            default:
                if (window.location.origin + '/images/default.png') {
                    return {
                        ...iconBase,
                        url: '/images/default.png'
                    };
                }
                return createFallbackIcon('#666666', 'DEF');
        }
    };


    const getMarkerIconForSentimentData = (sentiment: string) => {
        const iconBase = {
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 32)
        };

        // Create colored circle icons as fallback
        const createFallbackIcon = (color: string, text: string) => {
            return {
                ...iconBase,
                url: 'data:image/svg+xml;base64,' + btoa(
                    `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="14" fill="${color}" stroke="#fff" stroke-width="2"/>
                    <text x="16" y="20" text-anchor="middle" fill="white" font-size="8" font-weight="bold">${text}</text>
                </svg>`
                )
            };
        };

        switch (sentiment.toLowerCase()) {
            // Positive sentiments - Green tones
            case 'happy':
                if (window.location.origin + '/images/happy.png') {
                    return {
                        ...iconBase,
                        url: '/images/happy.png'
                    };
                }
                return createFallbackIcon('#4caf50', 'HAP');

            case 'excited':
                if (window.location.origin + '/images/excited.png') {
                    return {
                        ...iconBase,
                        url: '/images/excited.png'
                    };
                }
                return createFallbackIcon('#8bc34a', 'EXC');

            case 'hopeful':
                if (window.location.origin + '/images/hopeful.png') {
                    return {
                        ...iconBase,
                        url: '/images/hopeful.png'
                    };
                }
                return createFallbackIcon('#66bb6a', 'HOP');

            case 'grateful':
                if (window.location.origin + '/images/grateful.png') {
                    return {
                        ...iconBase,
                        url: '/images/grateful.png'
                    };
                }
                return createFallbackIcon('#43a047', 'GRT');

            case 'proud':
                if (window.location.origin + '/images/proud.png') {
                    return {
                        ...iconBase,
                        url: '/images/proud.png'
                    };
                }
                return createFallbackIcon('#2e7d32', 'PRD');

            // Neutral sentiments - Blue/Gray tones
            case 'calm':
                if (window.location.origin + '/images/calm.png') {
                    return {
                        ...iconBase,
                        url: '/images/calm.png'
                    };
                }
                return createFallbackIcon('#2196f3', 'CAL');

            case 'indifferent':
                if (window.location.origin + '/images/indifferent.png') {
                    return {
                        ...iconBase,
                        url: '/images/indifferent.png'
                    };
                }
                return createFallbackIcon('#9e9e9e', 'IND');

            case 'uncertain':
                if (window.location.origin + '/images/uncertain.png') {
                    return {
                        ...iconBase,
                        url: '/images/uncertain.png'
                    };
                }
                return createFallbackIcon('#607d8b', 'UNC');

            case 'waiting':
                if (window.location.origin + '/images/waiting.png') {
                    return {
                        ...iconBase,
                        url: '/images/waiting.png'
                    };
                }
                return createFallbackIcon('#90a4ae', 'WAI');

            // Negative sentiments - Red/Orange tones
            case 'frustrated':
                if (window.location.origin + '/images/frustrated.png') {
                    return {
                        ...iconBase,
                        url: '/images/frustrated.png'
                    };
                }
                return createFallbackIcon('#ff9800', 'FRS');

            case 'angry':
                if (window.location.origin + '/images/angry.png') {
                    return {
                        ...iconBase,
                        url: '/images/angry.png'
                    };
                }
                return createFallbackIcon('#f44336', 'ANG');

            case 'worried':
                if (window.location.origin + '/images/worried.png') {
                    return {
                        ...iconBase,
                        url: '/images/worried.png'
                    };
                }
                return createFallbackIcon('#ff5722', 'WOR');

            case 'disappointed':
                if (window.location.origin + '/images/disappointed.png') {
                    return {
                        ...iconBase,
                        url: '/images/disappointed.png'
                    };
                }
                return createFallbackIcon('#e91e63', 'DIS');

            case 'helpless':
                if (window.location.origin + '/images/helpless.png') {
                    return {
                        ...iconBase,
                        url: '/images/helpless.png'
                    };
                }
                return createFallbackIcon('#d32f2f', 'HLP');

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
    const addIncidentMarkersForSummarizedData = () => {
        if (!map || !summarizedData || summarizedData.length === 0) return;




        // Clear existing markers
        clearMarkers();

        const lat = userProfile?.location.lat || 20.5937; // Default to center of India
        const lng = userProfile?.location.lng || 78.9629; // Default to center of India


        const markerDefault = new google.maps.Marker({
            position: { lat: lat, lng: lng },
            map: map
        });

        markersRef.current.push(markerDefault);





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

                const markerIcon = getMarkerIconForSummarizedData(category);

                const marker = new google.maps.Marker({
                    position: { lat: incident.coordinates.lat, lng: incident.coordinates.lng },
                    map: map,
                    title: incident.location || `Incident ${index + 1}`,
                    icon: markerIcon
                });
                // Create info window with real data and close button
                const infoWindow = new google.maps.InfoWindow({
                    content: `
        <div style="padding: 12px; max-width: 280px; font-family: Arial, sans-serif; position: relative;">
            <button onclick="this.closest('.gm-info-window').previousSibling.click()" 
                    style="position: absolute; top: 8px; right: 8px; background: #f44336; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px; line-height: 1; display: flex; align-items: center; justify-content: center;">
                ×
            </button>
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px; font-weight: bold; padding-right: 30px;">
                ${incident.location || 'Unknown Location'}
            </h3>
            <p style="margin: 0 0 10px 0; color: #666; font-size: 13px; line-height: 1.4;">
                ${incident.summary || 'No summary available'}
            </p>
            <div style="margin-bottom: 8px;">
                <span style="background: ${getIncidentColor(category)}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; text-transform: uppercase; font-weight: bold;">
                    ${incident.categories && incident.categories.length > 0 ? incident.categories[0] : 'Unknown'}
                </span>
                ${incident.categories && incident.categories.length > 1 ? `
                <span style="background: ${getIncidentColor(category)}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; text-transform: uppercase; font-weight: bold; margin-left: 4px;">
                    ${incident.categories[1]}
                </span>` : ''}
            </div>
            <div style="color: #888; font-size: 12px;">
                <strong>Resolution Time: ${getEtaText(incident)}</strong>
            </div>
        </div>
    `
                });

                // Add click listener to show info window
                marker.addListener('click', () => {
                    infoWindow.open(map, marker);
                });

                marker.addListener('mouseout', () => {
                    infoWindow.close();
                });

                markersRef.current.push(marker);
            } catch (error) {
                console.error(`Failed to create marker for incident at ${incident.location}:`, error);
            }
        });

        console.log(`Added ${markersRef.current.length} real incident markers to map`);
    };

    const addIncidentMarkersForSentimentData = () => {


        if (!map || !sentimentData || sentimentData.length === 0) return;


        // Clear existing markers
        clearMarkers();

        const lat = userProfile?.location.lat || 20.5937; // Default to center of India
        const lng = userProfile?.location.lng || 78.9629; // Default to center of India


        const markerDefault = new google.maps.Marker({
            position: { lat: lat, lng: lng },
            map: map
        });

        markersRef.current.push(markerDefault);



        sentimentData.forEach((incident, index) => {
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

                const sentiment = incident.sentiment || 'default';

                const markerIcon = getMarkerIconForSentimentData(sentiment);

                const marker = new google.maps.Marker({
                    position: { lat: incident.coordinates.lat, lng: incident.coordinates.lng },
                    map: map,
                    title: incident.location || `Incident ${index + 1}`,
                    icon: markerIcon
                });

                markersRef.current.push(marker);
            } catch (error) {
                console.error(`Failed to create marker for sentiment at ${incident.location}:`, error);
            }
        });

        console.log(`Added ${markersRef.current.length} sentiment markers to map`);


    }



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
    const callAPISummarized = async (lat: number, lng: number, radius: number) => {
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


    // Simple function to call API
    const callAPISentiment = async (lat: number, lng: number, radius: number) => {
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

            const response = await fetchSentimentData(
                { lat, lng },
                radiusInMeters,
                token
            );

            console.log('API Response:', response);

            // Set the real data
            if (response && response.incidents) {
                setSentimentData(response.incidents);
            } else {
                setSentimentData([]);
            }

        } catch (error) {
            console.error('API call failed:', error);
            setSentimentData([]);
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
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(centerLat * Math.PI / 180) * Math.cos(ne.lat() * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const radius = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

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
            if (mapData && !isSentiment) {
                callAPISummarized(mapData.lat, mapData.lng, mapData.radius);
            }
            else if (mapData && isSentiment) {
                callAPISentiment(mapData.lat, mapData.lng, mapData.radius);
            }
        }, 1500);
    };

    // Update markers when summarized data changes
    useEffect(() => {
        if (map && summarizedData && !isSentiment) {
            addIncidentMarkersForSummarizedData();
        }

        if (map && sentimentData && isSentiment) {
            addIncidentMarkersForSentimentData();
        }
    }, [summarizedData, sentimentData, map, isSentiment]);

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
        if (!isLoaded || !mapRef.current || map || !userProfile) return;

        console.log('Initializing map...');

        const lat = userProfile?.location.lat || 20.5937; // Default to center of India
        const lng = userProfile?.location.lng || 78.9629; // Default to center of India


        const mapInstance = new google.maps.Map(mapRef.current, {
            center: { lat: lat, lng: lng }, // Center of India
            zoom: 14,
            mapTypeId: 'roadmap'
        });

        setMap(mapInstance);
    }, [isLoaded, userProfile]);

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
        if (mapData && !isSentiment) {
            callAPISummarized(mapData.lat, mapData.lng, mapData.radius);
        }
        if (mapData && isSentiment) {
            callAPISentiment(mapData.lat, mapData.lng, mapData.radius);
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
    }, [map, user, isSentiment]);

    if (!isLoaded || !userProfile) {
        return (
            <div style={{
                width: '900px',
                height: '600px',
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


    const handleToggle = () => {

        setIsSentiment(!isSentiment);

    }

   const getEtaText = (data:any)=>{

   
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

        return etaText
    } else {
        return "Resolved"
    }

}

    return (
        <div style={{ width: '900px', height: '600px' }}>
            <div
                ref={mapRef}
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '8px'
                }}
            />

            <button onClick={handleToggle}>
                {
                    isSentiment ? 'Show Summarized Data' : 'Show Sentiment Data'
                }
            </button>
        </div>
    );
};

export default Map;