"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, MapPin, Clock, User, Heart, Loader2 } from "lucide-react";
import { useRequests } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { MitzvahRequestWithRelations } from "@/lib/types";
import { UserContactInfo } from "@/lib/privacy-utils";
import dynamic from "next/dynamic";

// Dynamically import MapView to avoid SSR issues
const MapView = dynamic(() => import("@/components/map/MapView"), { 
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
      <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
        <div className="text-gray-500">
          <MapPin className="h-16 w-16 mx-auto mb-2" />
          <p>Loading map...</p>
        </div>
      </div>
    </div>
  )
});

const categories = ["All", "VISITS", "TRANSPORTATION", "ERRANDS", "TUTORING", "MEALS", "HOUSEHOLD", "TECHNOLOGY", "OTHER"];
const urgencyLevels = ["All", "LOW", "NORMAL", "HIGH"];

export default function DiscoverPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedUrgency, setSelectedUrgency] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  
  // Build filters object
  const filters = {
    ...(selectedCategory !== "All" && { category: selectedCategory }),
    ...(selectedUrgency !== "All" && { urgency: selectedUrgency }),
  };

  const { requests, loading, error, total, hasMore, loadRequests } = useRequests(filters);  // Filter requests by search term locally
  const filteredRequests = requests.filter(request =>
    searchTerm === "" || 
    request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClaimRequest = async (requestId: string) => {
    if (!isAuthenticated) {
      alert("Please log in to claim a mitzvah request");
      return;
    }

    setClaimingId(requestId);
    try {
      const response = await fetch(`/api/requests/${requestId}/claim`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Reload requests to reflect the status change
        loadRequests();
        // Redirect to dashboard with assignments tab active
        router.push("/dashboard?tab=assignments");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to claim request");
      }
    } catch (error) {
      console.error('Error claiming request:', error);
      alert("An error occurred while claiming the request");
    } finally {
      setClaimingId(null);
    }
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

  const formatCategory = (category: string) => {
    return category.charAt(0) + category.slice(1).toLowerCase();
  };

  const formatTimeWindow = (request: any) => {
    if (request.timeWindowStart) {
      const start = new Date(request.timeWindowStart);
      const end = request.timeWindowEnd ? new Date(request.timeWindowEnd) : null;
      
      if (end) {
        return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
    }
    return "Flexible timing";
  };

  const calculatePoints = (request: any) => {
    // Base points by category (matching our seed data logic)
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
    
    // Add urgency modifier
    if (request.urgency === 'HIGH') points += 5;
    
    return points;
  };

  if (loading && requests.length === 0) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading available mitzvahs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Mitzvahs</h1>
          <p className="text-gray-600">Discover meaningful opportunities to help in your community</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search mitzvahs..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
              >
                {urgencyLevels.map(urgency => (
                  <option key={urgency} value={urgency}>{urgency === "All" ? "All Urgency" : urgency}</option>
                ))}
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                More Filters
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`px-4 py-2 ${viewMode === "map" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                Map
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Distance</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Any distance</option>
                    <option>Within 1 mile</option>
                    <option>Within 5 miles</option>
                    <option>Within 10 miles</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Window</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Any time</option>
                    <option>Today</option>
                    <option>This week</option>
                    <option>This month</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Points Range</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Any points</option>
                    <option>5-10 points</option>
                    <option>10-15 points</option>
                    <option>15+ points</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">
            {filteredRequests.length} mitzvah{filteredRequests.length !== 1 ? 's' : ''} found
            {total && filteredRequests.length < total && ` (${total} total available)`}
          </p>
          <select className="px-3 py-1 border border-gray-300 rounded text-sm">
            <option>Sort by relevance</option>
            <option>Sort by distance</option>
            <option>Sort by urgency</option>
            <option>Sort by points</option>
          </select>
        </div>

        {error && requests.length === 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center gap-2">
              <span>Error loading requests: {error}</span>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            {!loading && (
              <button 
                onClick={() => loadRequests()}
                className="mt-2 text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded transition-colors"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {/* Request Cards */}
        {viewMode === "list" && (
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No mitzvahs found</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedCategory !== "All" || selectedUrgency !== "All"
                    ? "Try adjusting your search criteria or filters"
                    : "Check back later for new opportunities to help"}
                </p>
              </div>
            ) : (
              filteredRequests.map((request: any) => (
                <div key={request.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl">{getCategoryIcon(request.category)}</span>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{request.title}</h3>
                          <p className="text-gray-600 text-sm mb-2">{request.description}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              {formatCategory(request.category)}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getUrgencyColor(request.urgency)}`}>
                              {formatCategory(request.urgency)} Priority
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              request.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                              request.status === 'CLAIMED' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {formatCategory(request.status)}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {request.locationDisplay}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatTimeWindow(request)}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              Posted by {request.owner?.profile?.displayName || 'Community Member'}
                              {request.owner?.profile?.showEmail && request.owner?.profile?.email && (
                                <span className="text-xs ml-1">
                                  ({request.owner.profile.email})
                                </span>
                              )}
                            </div>
                          </div>

                          {request.requirements && request.requirements.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 font-medium">Requirements:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {request.requirements.map((req: string, index: number) => (
                                  <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                    {req}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="lg:ml-6 lg:text-right">
                      <div className="mb-3">
                        <div className="flex items-center gap-1 text-blue-600 font-semibold">
                          <Heart className="h-4 w-4" />
                          {calculatePoints(request)} points
                        </div>
                      </div>
                      
                      {request.status === 'OPEN' ? (
                        <button 
                          onClick={() => handleClaimRequest(request.id)}
                          disabled={claimingId === request.id || !isAuthenticated}
                          className="w-full lg:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {claimingId === request.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Claiming...
                            </>
                          ) : (
                            <>
                              {!isAuthenticated ? 'Login to Claim' : 'Claim Mitzvah'}
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="inline-block w-full lg:w-auto text-center px-6 py-2 bg-gray-100 text-gray-600 rounded-lg">
                          {request.status === 'CLAIMED' ? 'Already Claimed' : 
                           request.status === 'CONFIRMED' ? 'Completed' : 
                           formatCategory(request.status)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {hasMore && (
              <div className="text-center py-4">
                <button
                  onClick={() => loadRequests()}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Map View */}
        {viewMode === "map" && (
          <MapView 
            requests={filteredRequests}
            onClaimRequest={handleClaimRequest}
            claimingId={claimingId}
            isAuthenticated={isAuthenticated}
          />
        )}
      </div>
    </div>
  );
}
