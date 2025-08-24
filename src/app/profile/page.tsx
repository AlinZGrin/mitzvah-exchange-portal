"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, MapPin, Globe, Shield, Save, ArrowLeft, Phone } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api";

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
  const [validationErrors, setValidationErrors] = useState({
    phone: ""
  });
  
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    city: "",
    neighborhood: "",
    phone: "",
    languages: [] as string[],
    skills: [] as string[],
    privacy: {
      showEmail: false,
      showPhone: false,
      showExactLocation: false
    }
  });

  // Validation functions
  const validatePhone = (phone: string): string => {
    if (!phone) return "";
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Check if it starts with 1 (11 digits total - remove country code)
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      return "Please enter phone number without country code";
    }
    
    // USA phone numbers should have exactly 10 digits
    if (digitsOnly.length !== 10) {
      return "Please enter a valid 10-digit US phone number";
    }
    
    return "";
  };

  // Format phone number for display (xxx) xxx-xxxx
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return "";
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length === 0) return "";
    if (digitsOnly.length <= 3) return digitsOnly;
    if (digitsOnly.length <= 6) return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
  };

  // Get clean phone number for storage (10 digits only)
  const getCleanPhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, '').slice(0, 10);
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    
    if (user?.profile) {
      let privacy = {
        showEmail: false,
        showPhone: false,
        showExactLocation: false
      };
      
      // Handle privacy data which might be a string or object
      if (user.profile.privacy) {
        if (typeof user.profile.privacy === 'string') {
          try {
            privacy = { ...privacy, ...JSON.parse(user.profile.privacy) };
          } catch (e) {
            console.warn('Failed to parse privacy settings:', e);
          }
        } else if (typeof user.profile.privacy === 'object') {
          privacy = { ...privacy, ...user.profile.privacy };
        }
      }
      
      setFormData({
        displayName: user.profile.displayName || "",
        bio: user.profile.bio || "",
        city: user.profile.city || "",
        neighborhood: (user.profile as any)?.neighborhood || "",
        phone: formatPhoneNumber((user.profile as any)?.phone || ""),
        languages: user.profile.languages || [],
        skills: user.profile.skills || [],
        privacy
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatPhoneNumber(value);
    setFormData(prev => ({ ...prev, phone: formatted }));
    
    // Clear previous validation error and validate
    setValidationErrors(prev => ({ ...prev, phone: "" }));
    if (value) {
      const error = validatePhone(formatted);
      setValidationErrors(prev => ({ ...prev, phone: error }));
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

    // Validate all fields before submitting
    const phoneError = formData.phone ? validatePhone(formData.phone) : "";
    
    setValidationErrors({
      phone: phoneError
    });

    // Don't submit if there are validation errors
    if (phoneError) {
      setError("Please fix the validation errors before saving");
      setIsSaving(false);
      return;
    }

    try {
      // Prepare data for submission with clean phone number
      const submitData = {
        ...formData,
        phone: formData.phone ? getCleanPhoneNumber(formData.phone) : ""
      };
      
      await apiClient.updateUserProfile(submitData);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      // Refresh user data
      if (updateProfile) {
        await updateProfile();
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error instanceof Error ? error.message : "Failed to update profile");
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
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  disabled={true}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none bg-gray-50 text-gray-500"
                  value={user?.email || ""}
                  readOnly
                />
                <p className="text-sm text-gray-500 mt-1">
                  Email address cannot be changed
                </p>
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
              
              <div>
                <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Neighborhood
                </label>
                <input
                  type="text"
                  id="neighborhood"
                  name="neighborhood"
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  value={formData.neighborhood}
                  onChange={handleChange}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Only city shown to public. Neighborhood revealed to users who claim your mitzvahs.
                </p>
              </div>
              
              {/* Hidden city field for backward compatibility */}
              <input
                type="hidden"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  disabled={!isEditing}
                  placeholder="(555) 123-4567"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-50 ${
                    validationErrors.phone 
                      ? "border-red-500 focus:ring-red-500" 
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  value={formData.phone}
                  onChange={handlePhoneChange}
                />
                {validationErrors.phone && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.phone}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Only shown to users who claim your mitzvah requests
                </p>
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
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label htmlFor="showEmail" className="text-sm font-medium text-gray-900">
                    Show email address
                  </label>
                  <p className="text-sm text-gray-500">
                    Allow other community members to see your email address
                  </p>
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    disabled={!isEditing}
                    onClick={() => {
                      if (isEditing) {
                        setFormData(prev => ({
                          ...prev,
                          privacy: {
                            ...prev.privacy,
                            showEmail: !prev.privacy.showEmail
                          }
                        }));
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      formData.privacy.showEmail ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                        formData.privacy.showEmail ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="ml-3 text-sm text-gray-700">
                    {formData.privacy.showEmail ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label htmlFor="showExactLocation" className="text-sm font-medium text-gray-900">
                    Show exact location
                  </label>
                  <p className="text-sm text-gray-500">
                    Display your specific address instead of just city/neighborhood
                  </p>
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    disabled={!isEditing}
                    onClick={() => {
                      if (isEditing) {
                        setFormData(prev => ({
                          ...prev,
                          privacy: {
                            ...prev.privacy,
                            showExactLocation: !prev.privacy.showExactLocation
                          }
                        }));
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      formData.privacy.showExactLocation ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                        formData.privacy.showExactLocation ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="ml-3 text-sm text-gray-700">
                    {formData.privacy.showExactLocation ? 'ON' : 'OFF'}
                  </span>
                </div>
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
                      neighborhood: (user.profile as any)?.neighborhood || "",
                      phone: (user.profile as any)?.phone || "",
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
