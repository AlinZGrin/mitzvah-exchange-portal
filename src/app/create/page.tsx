"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Clock, AlertCircle, Camera } from "lucide-react";
import { useAuth } from "@/lib/api";

const categories = [
  { id: "VISITS", name: "Visits", icon: "👥", description: "Companionship and social visits" },
  { id: "TRANSPORTATION", name: "Transportation", icon: "🚗", description: "Rides and travel assistance" },
  { id: "ERRANDS", name: "Errands", icon: "🛍️", description: "Shopping and pickup/delivery" },
  { id: "TUTORING", name: "Tutoring", icon: "📚", description: "Educational support and teaching" },
  { id: "MEALS", name: "Meals", icon: "🍜", description: "Food preparation and delivery" },
  { id: "HOUSEHOLD", name: "Household", icon: "🏠", description: "Home maintenance and organization" },
  { id: "TECHNOLOGY", name: "Technology", icon: "💻", description: "Computer and device help" },
  { id: "OTHER", name: "Other", icon: "❤️", description: "Other community needs" },
];

const urgencyLevels = [
  { id: "LOW", name: "Low", description: "Flexible timing, no rush" },
  { id: "NORMAL", name: "Normal", description: "Preferred timeframe" },
  { id: "HIGH", name: "High", description: "Needed soon" },
  { id: "URGENT", name: "Urgent", description: "Immediate need" },
];

export default function CreateRequestPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    locationDisplay: "",
    urgency: "NORMAL",
    timeWindowStart: "",
    timeWindowEnd: "",
    isFlexible: true,
    requirements: [] as string[],
    recipientDetails: "",
    language: "",
    isRecurring: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated (after loading is complete)
  if (!isAuthenticated) {
    router.push("/auth/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const requestData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        urgency: formData.urgency,
        locationDisplay: formData.locationDisplay,
        timeWindowStart: formData.isFlexible ? null : formData.timeWindowStart || null,
        timeWindowEnd: formData.isFlexible ? null : formData.timeWindowEnd || null,
        requirements: formData.requirements,
        attachments: []
      };

      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const result = await response.json();
        router.push("/dashboard?tab=requests");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create request");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    
    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const toggleRequirement = (requirement: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.includes(requirement)
        ? prev.requirements.filter(r => r !== requirement)
        : [...prev.requirements, requirement]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a Mitzvah Request</h1>
            <p className="text-gray-600">Share an opportunity for community members to help</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Request Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    maxLength={100}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief, clear title for your request"
                    value={formData.title}
                    onChange={handleChange}
                  />
                  <p className="text-sm text-gray-500 mt-1">{formData.title.length}/100 characters</p>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={4}
                    maxLength={500}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Provide details about what you need help with..."
                    value={formData.description}
                    onChange={handleChange}
                  />
                  <p className="text-sm text-gray-500 mt-1">{formData.description.length}/500 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Category *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className={`relative cursor-pointer rounded-lg border-2 p-4 hover:bg-gray-50 ${
                          formData.category === category.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                      >
                        <input
                          type="radio"
                          name="category"
                          value={category.id}
                          checked={formData.category === category.id}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <span className="text-2xl mb-2 block">{category.icon}</span>
                          <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">{category.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Timing */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Location & Timing</h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Location *
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="locationDisplay"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City, neighborhood, or general area"
                    value={formData.locationDisplay}
                    onChange={handleChange}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    For privacy, only provide general location. Exact address shared after assignment.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Time Preference
                  </label>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isFlexible"
                        name="isFlexible"
                        checked={formData.isFlexible}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isFlexible" className="ml-2 text-sm text-gray-700">
                        Flexible timing - I can work around helper&apos;s schedule
                      </label>
                    </div>
                    
                    {!formData.isFlexible && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="timeWindowStart" className="block text-sm font-medium text-gray-700 mb-1">
                            Preferred Start
                          </label>
                          <input
                            type="datetime-local"
                            id="timeWindowStart"
                            name="timeWindowStart"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.timeWindowStart}
                            onChange={handleChange}
                          />
                        </div>
                        <div>
                          <label htmlFor="timeWindowEnd" className="block text-sm font-medium text-gray-700 mb-1">
                            Preferred End
                          </label>
                          <input
                            type="datetime-local"
                            id="timeWindowEnd"
                            name="timeWindowEnd"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.timeWindowEnd}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-2">
                    <AlertCircle className="inline h-4 w-4 mr-1" />
                    Urgency Level
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {urgencyLevels.map((level) => (
                      <div
                        key={level.id}
                        className={`relative cursor-pointer rounded-lg border-2 p-3 text-center hover:bg-gray-50 ${
                          formData.urgency === level.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, urgency: level.id }))}
                      >
                        <input
                          type="radio"
                          name="urgency"
                          value={level.id}
                          checked={formData.urgency === level.id}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <h3 className="text-sm font-medium text-gray-900">{level.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{level.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Details</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Special Requirements (optional)
                  </label>
                  <div className="space-y-2">
                    {[
                      "Must have car/license",
                      "Background check required",
                      "Experience preferred",
                      "Lift heavy items",
                      "Speak specific language",
                      "Available weekends only"
                    ].map((req) => (
                      <div key={req} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`req-${req}`}
                          checked={formData.requirements.includes(req)}
                          onChange={() => toggleRequirement(req)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`req-${req}`} className="ml-2 text-sm text-gray-700">
                          {req}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Language (optional)
                  </label>
                  <select
                    id="language"
                    name="language"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.language}
                    onChange={handleChange}
                  >
                    <option value="">Any language</option>
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="hebrew">Hebrew</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    name="isRecurring"
                    checked={formData.isRecurring}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isRecurring" className="ml-2 text-sm text-gray-700">
                    This is a recurring need (weekly, monthly, etc.)
                  </label>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.title || !formData.description || !formData.category || !formData.locationDisplay}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating..." : "Post Mitzvah Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
