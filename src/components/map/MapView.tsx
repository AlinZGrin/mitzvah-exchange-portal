"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Heart, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface MapViewProps {
  requests: any[];
  onClaimRequest: (requestId: string) => void;
  claimingId: string | null;
  isAuthenticated: boolean;
}

// Mock geocoding function - in production you'd use a real geocoding service
const getCoordinatesFromLocation = (location: string): [number, number] => {
  // This is a simplified mapping for demonstration
  // In production, you'd use a geocoding API or store coordinates in the database
  const locationMap: { [key: string]: [number, number] } = {
    // Original mock locations
    'Downtown': [40.7589, -73.9851], 
    'Downtown Medical Center': [40.7614, -73.9776],
    'Westside': [40.7505, -73.9934],
    'Westside Grocery Store': [40.7520, -73.9900],
    'East End': [40.7614, -73.9556],
    'East End Senior Living': [40.7600, -73.9540],
    'Central': [40.7549, -73.9840],
    'Central District': [40.7560, -73.9820],
    'Downtown Kitchen': [40.7580, -73.9820],
    
    // Real locations from database
    'Pinecrest, Florida': [25.6631, -80.3100],
    'Miami, Florida': [25.7617, -80.1918],
    'Fort Lauderdale, Florida': [26.1224, -80.1373],
    'West Palm Beach, Florida': [26.7153, -80.0534],
    'Coral Gables, Florida': [25.7217, -80.2685],
    'Aventura, Florida': [25.9565, -80.1393],
    'Doral, Florida': [25.8198, -80.3553],
    'Homestead, Florida': [25.4687, -80.4776],
    'Pembroke Pines, Florida': [26.0070, -80.2962],
    'Boca Raton, Florida': [26.3683, -80.1289],
    
    // Specific Miami area coordinates for exact addresses
    'Biscayne Blvd': [25.7850, -80.1900],  // Biscayne Boulevard area
    'Ocean Drive': [25.7850, -80.1300],    // South Beach Ocean Drive
    'Miracle Mile': [25.7217, -80.2685],   // Coral Gables Miracle Mile
    'Aventura Blvd': [25.9565, -80.1393], // Aventura area
    'Downtown Miami': [25.7825, -80.1998], // Downtown Miami
    'South Beach': [25.7850, -80.1300],    // South Beach
    'Coral Gables': [25.7217, -80.2685],   // Coral Gables
    'Miami Beach': [25.7907, -80.1300],    // Miami Beach
  };
  
  // First try exact match
  if (locationMap[location]) {
    return locationMap[location];
  }
  
  // Try to find partial matches for streets and landmarks
  const lowerLocation = location.toLowerCase();
  for (const [key, coords] of Object.entries(locationMap)) {
    if (lowerLocation.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerLocation)) {
      return coords;
    }
  }
  
  // Enhanced address parsing for specific street names
  if (lowerLocation.includes('biscayne')) {
    return [25.7850, -80.1900]; // Biscayne Boulevard area
  }
  if (lowerLocation.includes('ocean drive')) {
    return [25.7850, -80.1300]; // South Beach Ocean Drive
  }
  if (lowerLocation.includes('miracle mile')) {
    return [25.7217, -80.2685]; // Coral Gables Miracle Mile
  }
  if (lowerLocation.includes('aventura')) {
    return [25.9565, -80.1393]; // Aventura area
  }
  if (lowerLocation.includes('152nd') || lowerLocation.includes('zoo')) {
    return [25.6356, -80.4467]; // Zoo Miami / SW 152nd Street area
  }
  if (lowerLocation.includes('dixie hwy') || lowerLocation.includes('pinecrest')) {
    return [25.6631, -80.3100]; // Pinecrest area
  }
  if (lowerLocation.includes('kendall')) {
    return [25.6761, -80.3144]; // Kendall area
  }
  if (lowerLocation.includes('homestead')) {
    return [25.4687, -80.4776]; // Homestead area
  }
  
  // Try to extract city from various formats
  if (lowerLocation.includes('florida') || lowerLocation.includes('fl')) {
    // Default to Miami area for Florida locations
    return [25.7617, -80.1918];
  }
  
  if (lowerLocation.includes('new york') || lowerLocation.includes('ny') || lowerLocation.includes('nyc')) {
    return [40.7549, -73.9840];
  }
  
  if (lowerLocation.includes('california') || lowerLocation.includes('ca')) {
    return [34.0522, -118.2437]; // Los Angeles
  }
  
  // Default to Miami area (since sample data shows Florida)
  return [25.7617, -80.1918];
};

const formatCategory = (category: string) => {
  return category.charAt(0) + category.slice(1).toLowerCase();
};

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case "LOW": return "bg-green-100 text-green-800";
    case "NORMAL": return "bg-blue-100 text-blue-800";
    case "HIGH": return "bg-orange-100 text-orange-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "TRANSPORTATION": return "🚗";
    case "VISITS": return "👥";
    case "ERRANDS": return "🛍️";
    case "TECHNOLOGY": return "💻";
    case "MEALS": return "🍽️";
    case "HOUSEHOLD": return "🏠";
    case "TUTORING": return "📚";
    default: return "❤️";
  }
};

const calculatePoints = (request: any) => {
  const basePoints = {
    'VISITS': 10,
    'TRANSPORTATION': 15,
    'ERRANDS': 8,
    'TUTORING': 12,
    'MEALS': 10,
    'HOUSEHOLD': 10,
    'TECHNOLOGY': 12,
    'OTHER': 8
  };
  
  let points = basePoints[request.category as keyof typeof basePoints] || 8;
  if (request.urgency === 'HIGH') points += 5;
  return points;
};

export default function MapView({ requests, onClaimRequest, claimingId, isAuthenticated }: MapViewProps) {
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState<any>(null);
  const [currentIndexByCoords, setCurrentIndexByCoords] = useState<{ [key: string]: number }>({});

  // Group requests by coordinates
  const groupRequestsByCoordinates = (requests: any[]) => {
    const groups: { [key: string]: any[] } = {};
    
    requests.forEach((request) => {
      const locationForMap = request.location || request.locationDisplay;
      const coordinates = getCoordinatesFromLocation(locationForMap);
      const coordKey = `${coordinates[0]},${coordinates[1]}`;
      
      if (!groups[coordKey]) {
        groups[coordKey] = [];
      }
      groups[coordKey].push(request);
    });
    
    return groups;
  };

  const requestGroups = groupRequestsByCoordinates(requests);

  // Navigation functions for paginated popups
  const navigateToNext = (e: React.MouseEvent, coordKey: string, totalCount: number) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndexByCoords(prev => ({
      ...prev,
      [coordKey]: ((prev[coordKey] || 0) + 1) % totalCount
    }));
  };

  const navigateToPrevious = (e: React.MouseEvent, coordKey: string, totalCount: number) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndexByCoords(prev => ({
      ...prev,
      [coordKey]: ((prev[coordKey] || 0) - 1 + totalCount) % totalCount
    }));
  };

  useEffect(() => {
    setIsClient(true);
    // Import Leaflet on the client side
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
      
      // Fix for default markers
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    });
  }, []);

  // Custom icon function
  const createCustomIcon = (urgency: string, category: string) => {
    if (!L) return null;
    
    const color = urgency === 'HIGH' ? '#ef4444' : urgency === 'NORMAL' ? '#3b82f6' : '#10b981';
    const emoji = getCategoryIcon(category);
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          font-size: 14px;
        ">
          ${emoji}
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  if (!isClient) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
          <div className="text-gray-500">
            <MapPin className="h-16 w-16 mx-auto mb-2" />
            <p>Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Map Legend */}
      <div className="p-4 border-b bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-2">Map Legend</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Normal Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Low Priority</span>
          </div>
          <div className="text-gray-600">
            Showing {requests.length} mitzvah{requests.length !== 1 ? 's' : ''} in your area
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div style={{ height: '500px', position: 'relative' }}>
        <MapContainer
          center={[25.7617, -80.1918]} // Miami, FL center
          zoom={10}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {Object.entries(requestGroups).map(([coordKey, groupRequests]) => {
            const currentIndex = currentIndexByCoords[coordKey] || 0;
            const currentRequest = groupRequests[currentIndex];
            const totalCount = groupRequests.length;
            
            // Use complete address if available, otherwise fall back to general area
            const locationForMap = currentRequest.location || currentRequest.locationDisplay;
            const coordinates = getCoordinatesFromLocation(locationForMap);
            
            // Create a custom icon that shows the count if multiple requests
            const createGroupIcon = (urgency: string, category: string, count: number) => {
              if (!L) return null;
              
              const color = urgency === 'HIGH' ? '#ef4444' : urgency === 'NORMAL' ? '#3b82f6' : '#10b981';
              const emoji = getCategoryIcon(category);
              
              return L.divIcon({
                className: 'custom-marker',
                html: `
                  <div style="
                    background-color: ${color};
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    font-size: 14px;
                    position: relative;
                  ">
                    ${emoji}
                    ${count > 1 ? `
                      <div style="
                        position: absolute;
                        top: -5px;
                        right: -5px;
                        background-color: #dc2626;
                        color: white;
                        border-radius: 50%;
                        width: 16px;
                        height: 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 10px;
                        font-weight: bold;
                        border: 1px solid white;
                      ">
                        ${count}
                      </div>
                    ` : ''}
                  </div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 15],
              });
            };
            
            const customIcon = createGroupIcon(currentRequest.urgency, currentRequest.category, totalCount);
            
            return (
              <Marker
                key={`${coordKey}-${currentIndex}`}
                position={coordinates}
                icon={customIcon}
              >
                <Popup maxWidth={320} className="mitzvah-popup">
                  <div className="p-2">
                    {/* Pagination header if multiple requests */}
                    {totalCount > 1 && (
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                        <button
                          onClick={(e) => navigateToPrevious(e, coordKey, totalCount)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                          aria-label="Previous mitzvah"
                        >
                          <ChevronLeft className="h-4 w-4 text-gray-600" />
                        </button>
                        
                        <div className="text-sm text-gray-600 font-medium">
                          {currentIndex + 1} of {totalCount} mitzvahs here
                        </div>
                        
                        <button
                          onClick={(e) => navigateToNext(e, coordKey, totalCount)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                          aria-label="Next mitzvah"
                        >
                          <ChevronRight className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-xl">{getCategoryIcon(currentRequest.category)}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{currentRequest.title}</h4>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{currentRequest.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {formatCategory(currentRequest.category)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getUrgencyColor(currentRequest.urgency)}`}>
                        {formatCategory(currentRequest.urgency)}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {(() => {
                          const owner = currentRequest.owner;
                          const privacy = owner?.profile?.privacy ? 
                            (typeof owner.profile.privacy === 'string' ? 
                              JSON.parse(owner.profile.privacy) : 
                              owner.profile.privacy
                            ) : { showExactLocation: false };
                          
                          // Show exact location if available and user has enabled showExactLocation
                          return (privacy.showExactLocation && currentRequest.location) ? 
                            currentRequest.location : 
                            currentRequest.locationDisplay;
                        })()}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {currentRequest.owner?.profile?.displayName || 'Community Member'}
                        {(() => {
                          const owner = currentRequest.owner;
                          if (!owner?.profile?.privacy) return '';
                          
                          let privacy;
                          try {
                            privacy = typeof owner.profile.privacy === 'string' ? 
                              JSON.parse(owner.profile.privacy) : 
                              owner.profile.privacy;
                          } catch (e) {
                            privacy = { showEmail: false };
                          }
                          
                          return privacy.showEmail && owner?.profile?.email ? 
                            ` (${owner.profile.email})` : '';
                        })()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {calculatePoints(currentRequest)} points
                      </div>
                    </div>

                    {currentRequest.status === 'OPEN' ? (
                      <button 
                        onClick={() => onClaimRequest(currentRequest.id)}
                        disabled={claimingId === currentRequest.id || !isAuthenticated}
                        className="w-full bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {claimingId === currentRequest.id ? 'Claiming...' : 
                         !isAuthenticated ? 'Login to Claim' : 'Claim Mitzvah'}
                      </button>
                    ) : (
                      <div className="w-full text-center px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-sm">
                        {currentRequest.status === 'CLAIMED' ? 'Already Claimed' : 
                         currentRequest.status === 'CONFIRMED' ? 'Completed' : 
                         formatCategory(currentRequest.status)}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-gray-50 border-t">
        <p className="text-sm text-gray-600">
          💡 <strong>Tip:</strong> Click on the colored markers to see mitzvah details and claim opportunities. 
          Different colors represent urgency levels, and emojis show the category type. 
          When multiple mitzvahs are in the same area, use the arrow buttons to navigate between them.
        </p>
      </div>
    </div>
  );
}
