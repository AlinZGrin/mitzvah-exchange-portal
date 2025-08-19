"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, MapPin, Globe, Shield, Save, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/api";

const skillOptions = [
  "VISITS", "TRANSPORTATION", "ERRANDS", "TUTORING", 
  "MEALS", "HOUSEHOLD", "TECHNOLOGY", "OTHER"
];

const languageOptions = [
  "English", "Spanish", "Hebrew", "French", "Arabic", "Russian", "Other"
];

export default function ProfilePage() {
  const { user, isAuthenticated, loading, updateProfile } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    city: "",
    languages: [] as string[],
    skills: [] as string[],
    privacy: {
      showEmail: false,
      showPhone: false,
      showExactLocation: false
    }
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    
    if (user?.profile) {
      setFormData({
        displayName: user.profile.displayName || "",
        bio: user.profile.bio || "",
        city: user.profile.city || "",
        languages: user.profile.languages || [],
        skills: user.profile.skills || [],
        privacy: user.profile.privacy || {
          showEmail: false,
          showPhone: false,
          showExactLocation: false
        }
      });
    }
  }, [user, isAuthenticated, loading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    
    if (name.startsWith("privacy.")) {
      const privacyField = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        privacy: {
          ...prev.privacy,
          [privacyField]: isCheckbox ? (e.target as HTMLInputElement).checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
        // Refresh user data
        if (updateProfile) {
          await updateProfile();
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update profile");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600">Manage your profile information and privacy settings</p>
            </div>
          </div>
          
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700">{success}</p>
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <User className="h-6 w-6" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  disabled={!isEditing}
                  maxLength={50}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  value={formData.displayName}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  disabled={!isEditing}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  placeholder="Tell the community about yourself..."
                  value={formData.bio}
                  onChange={handleChange}
                />
                <p className="text-sm text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
              </div>
            </div>
          </div>

          {/* Skills & Languages */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Globe className="h-6 w-6" />
              Skills & Languages
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Skills (Types of help you can provide)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {skillOptions.map((skill) => (
                    <div
                      key={skill}
                      className={`relative cursor-pointer rounded-lg border-2 p-3 text-center ${
                        !isEditing ? "opacity-60" : ""
                      } ${
                        formData.skills.includes(skill)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={isEditing ? () => toggleSkill(skill) : undefined}
                    >
                      <span className="text-sm font-medium">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Languages
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {languageOptions.map((language) => (
                    <div
                      key={language}
                      className={`relative cursor-pointer rounded-lg border-2 p-3 text-center ${
                        !isEditing ? "opacity-60" : ""
                      } ${
                        formData.languages.includes(language)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={isEditing ? () => toggleLanguage(language) : undefined}
                    >
                      <span className="text-sm font-medium">{language}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Privacy Settings
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="showEmail" className="text-sm font-medium text-gray-900">
                    Show email address
                  </label>
                  <p className="text-sm text-gray-500">
                    Allow other community members to see your email address
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="showEmail"
                  name="privacy.showEmail"
                  disabled={!isEditing}
                  checked={formData.privacy.showEmail}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="showExactLocation" className="text-sm font-medium text-gray-900">
                    Show exact location
                  </label>
                  <p className="text-sm text-gray-500">
                    Display your specific address instead of just city/neighborhood
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="showExactLocation"
                  name="privacy.showExactLocation"
                  disabled={!isEditing}
                  checked={formData.privacy.showExactLocation}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Account Information (Read-only) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Account Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  value={user?.email || ""}
                />
                <p className="text-xs text-gray-500 mt-1">Contact support to change your email</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Since
                </label>
                <input
                  type="text"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  value={new Date().toLocaleDateString()}
                />
                <p className="text-xs text-gray-500 mt-1">Member since account creation</p>
              </div>
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setError("");
                  setSuccess("");
                  // Reset form data
                  if (user?.profile) {
                    setFormData({
                      displayName: user.profile.displayName || "",
                      bio: user.profile.bio || "",
                      city: user.profile.city || "",
                      languages: user.profile.languages || [],
                      skills: user.profile.skills || [],
                      privacy: user.profile.privacy || {
                        showEmail: false,
                        showPhone: false,
                        showExactLocation: false
                      }
                    });
                  }
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
