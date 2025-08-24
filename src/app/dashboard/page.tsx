"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Users, 
  Calendar, 
  Star, 
  TrendingUp, 
  MapPin, 
  Clock,
  CheckCircle,
  Award,
  Plus,
  Heart,
  ClipboardList,
  AlertCircle,
  MessageSquare,
  Trophy,
  Target,
  Zap,
  Phone
} from "lucide-react";
import Link from "next/link";
import { useAssignments } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { UserStats } from "@/lib/types";

function DashboardContent() {
  const { user, stats, isAuthenticated, loading, updateProfile } = useAuth();
  const { assignments, loading: assignmentsLoading, completeAssignment, confirmAssignment, releaseAssignment } = useAssignments();
  const [activeTab, setActiveTab] = useState("overview");
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  // Check for tab query parameter and set active tab
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "assignments") {
      setActiveTab("assignments");
    }
  }, [searchParams]);

  const handleCompleteAssignment = async (assignmentId: string) => {
    try {
      setCompletingId(assignmentId);
      const result = await completeAssignment(assignmentId, "Assignment completed successfully");
      
      // Refresh user stats to show updated points immediately
      await updateProfile();
      
      // Show success message with points awarded
      if (result.pointsAwarded) {
        setSuccessMessage(`🎉 Assignment completed! ${result.pointsAwarded} points awarded!`);
        setTimeout(() => setSuccessMessage(null), 5000); // Clear message after 5 seconds
      }
      
      // Navigate to overview tab to show updated stats
      setActiveTab("overview");
    } catch (error) {
      console.error("Error completing assignment:", error);
    } finally {
      setCompletingId(null);
    }
  };

  const handleConfirmAssignment = async (assignmentId: string, confirmed: boolean) => {
    try {
      setConfirmingId(assignmentId);
      await confirmAssignment(assignmentId, confirmed, confirmed ? "Great job!" : "Needs revision");
    } catch (error) {
      console.error("Error confirming assignment:", error);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleReleaseAssignment = async (assignmentId: string) => {
    try {
      setReleasingId(assignmentId);
      await releaseAssignment(assignmentId, "User changed their mind");
    } catch (error) {
      console.error("Error releasing assignment:", error);
    } finally {
      setReleasingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CLAIMED": return "bg-blue-100 text-blue-800";
      case "COMPLETED": return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getAchievements = () => {
    const points = stats?.totalPoints || 0;
    const completed = stats?.requestsCompleted || 0;
    const posted = stats?.requestsPosted || 0;
    
    const achievements = [];
    
    // Points-based achievements
    if (points >= 100) achievements.push({ name: "Century Club", icon: "💯", description: "Earned 100+ points" });
    if (points >= 500) achievements.push({ name: "Point Master", icon: "⭐", description: "Earned 500+ points" });
    if (points >= 1000) achievements.push({ name: "Community Champion", icon: "🏆", description: "Earned 1000+ points" });
    
    // Activity-based achievements
    if (completed >= 5) achievements.push({ name: "Helper", icon: "🤝", description: "Completed 5+ mitzvahs" });
    if (completed >= 25) achievements.push({ name: "Super Helper", icon: "⚡", description: "Completed 25+ mitzvahs" });
    if (posted >= 3) achievements.push({ name: "Community Builder", icon: "🏗️", description: "Posted 3+ requests" });
    
    // Special achievements
    if (user?.role === 'ADMIN') achievements.push({ name: "Administrator", icon: "👑", description: "Platform administrator" });
    if (stats?.averageRating && stats.averageRating >= 4.5) achievements.push({ name: "Five Star Helper", icon: "🌟", description: "4.5+ star rating" });
    
    return achievements;
  };

  const getPointsProgress = () => {
    const points = stats?.totalPoints || 0;
    const nextMilestone = points < 100 ? 100 : points < 500 ? 500 : points < 1000 ? 1000 : (Math.ceil(points / 1000) + 1) * 1000;
    const progress = (points / nextMilestone) * 100;
    return { current: points, next: nextMilestone, progress };
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-700 hover:text-green-900"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.profile?.displayName || "Community Member"}!
          </h1>
          <p className="mt-2 text-gray-600">
            Here&apos;s what&apos;s happening in your mitzvah journey.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/create" className="bg-blue-600 text-white p-4 md:p-6 rounded-lg hover:bg-blue-700 transition-colors">
            <div className="flex items-center gap-3">
              <Plus className="h-6 w-6 md:h-8 md:w-8" />
              <div>
                <h3 className="text-base md:text-lg font-semibold">Post a Mitzvah</h3>
                <p className="text-blue-100 text-sm">Share an opportunity for others to help</p>
              </div>
            </div>
          </Link>
          
          <Link href="/discover" className="bg-purple-600 text-white p-4 md:p-6 rounded-lg hover:bg-purple-700 transition-colors">
            <div className="flex items-center gap-3">
              <Heart className="h-6 w-6 md:h-8 md:w-8" />
              <div>
                <h3 className="text-base md:text-lg font-semibold">Find Mitzvahs</h3>
                <p className="text-purple-100 text-sm">Discover ways to help in your area</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-3 md:p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Award className="h-6 w-6 md:h-8 md:w-8 text-yellow-500" />
              </div>
              <div className="ml-3 md:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">
                    Total Points
                  </dt>
                  <dd className="text-lg md:text-2xl font-bold text-gray-900">
                    {stats?.totalPoints || 0}
                  </dd>
                  <dd className="text-xs text-yellow-600 font-medium hidden md:block">
                    +{Math.floor((stats?.totalPoints || 0) / 10)} this week
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 md:p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
              </div>
              <div className="ml-3 md:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">
                    Requests Posted
                  </dt>
                  <dd className="text-lg md:text-2xl font-bold text-gray-900">
                    {stats?.requestsPosted || 0}
                  </dd>
                  <dd className="text-xs text-blue-600 font-medium hidden md:block">
                    Community impact
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 md:p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
              </div>
              <div className="ml-3 md:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">
                    Mitzvahs Done
                  </dt>
                  <dd className="text-lg md:text-2xl font-bold text-gray-900">
                    {stats?.requestsCompleted || 0}
                  </dd>
                  <dd className="text-xs text-green-600 font-medium hidden md:block">
                    Lives touched
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 md:p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
              </div>
              <div className="ml-3 md:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">
                    Rank
                  </dt>
                  <dd className="text-lg md:text-2xl font-bold text-gray-900">
                    #{stats?.currentRank || '?'}
                  </dd>
                  <dd className="text-xs text-purple-600 font-medium hidden md:block">
                    {stats?.averageRating ? `${stats.averageRating.toFixed(1)} ⭐ rating` : 'No ratings yet'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("assignments")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "assignments"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                My Assignments ({assignments.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Points Progress & Achievements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Points Progress */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="h-6 w-6 text-yellow-500" />
                  Points Progress
                </h2>
                
                {(() => {
                  const { current, next, progress } = getPointsProgress();
                  return (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-3xl font-bold text-gray-900">{current}</span>
                        <span className="text-sm text-gray-500">/ {next} points</span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        {next - current} points until next milestone
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="text-gray-600">
                          Rank #{stats?.currentRank || '?'} in community
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Achievements */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-purple-500" />
                  Achievements
                </h2>
                
                {(() => {
                  const achievements = getAchievements();
                  return achievements.length > 0 ? (
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {achievements.map((achievement, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-2xl">{achievement.icon}</span>
                          <div>
                            <h3 className="font-medium text-gray-900">{achievement.name}</h3>
                            <p className="text-sm text-gray-600">{achievement.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">Complete your first mitzvah to earn achievements!</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Profile Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
              </div>
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Display Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user?.profile?.displayName || 'Not set'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">City</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user?.profile?.city || 'Not specified'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Role</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        user?.role === 'MODERATOR' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user?.role}
                      </span>
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Bio</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user?.profile?.bio || 'No bio provided'}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Skills</dt>
                    <dd className="mt-1">
                      <div className="flex flex-wrap gap-2">
                        {user?.profile?.skills?.length ? (
                          user.profile.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">No skills listed</span>
                        )}
                      </div>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                <Link
                  href="/create"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Post New Request
                </Link>
                <Link
                  href="/discover"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Find Mitzvahs
                </Link>
              </div>
            </div>

            {stats && stats.totalReviews > 0 && (
              <div className="mt-6 bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Community Impact</h2>
                </div>
                <div className="px-6 py-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-500 mb-2">
                      ⭐ {stats.averageRating.toFixed(1)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          </div>
          <div className="px-6 py-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by posting a request or helping someone in your community.
            </p>
          </div>
        </div>
        </div>
        )}

        {/* Assignments Tab */}
        {activeTab === "assignments" && (
          <div className="space-y-6">
            {assignmentsLoading ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading assignments...</p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Claim a mitzvah request to see your assignments here.
                </p>
                <Link
                  href="/discover"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Find Mitzvahs
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="bg-white rounded-lg shadow p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 space-y-2 md:space-y-0">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {assignment.request.title}
                        </h3>
                        <p className="text-gray-600 mt-1 text-sm md:text-base">{assignment.request.description}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {assignment.request.locationDisplay}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(assignment.request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full self-start ${getStatusColor(assignment.status)}`}>
                        {assignment.status}
                      </span>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                        <div className="text-sm text-gray-600 space-y-1">
                          {assignment.request.ownerId === user?.id ? (
                            <div>
                              <span>You requested this • Performed by {assignment.performer?.profile?.displayName || 'Community Member'}</span>
                              {assignment.performer?.profile?.phone && assignment.performer?.profile?.showPhone && (
                                <div className="text-blue-600 font-medium">
                                  📞 {assignment.performer.profile.phone}
                                </div>
                              )}
                              {assignment.performer?.profile?.email && assignment.performer?.profile?.showEmail && (
                                <div className="text-blue-600">
                                  ✉️ {assignment.performer.profile.email}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span>Requested by {
                                (() => {
                                  const owner = assignment.request.owner;
                                  const privacy = owner?.profile?.privacy ? JSON.parse(owner.profile.privacy) : { showEmail: false, showExactLocation: false };
                                  return owner?.profile?.displayName || 'Community Member';
                                })()
                              }</span>
                              {assignment.request.owner?.profile?.phone && assignment.request.owner?.profile?.showPhone && (
                                <div className="text-blue-600 font-medium">
                                  📞 {assignment.request.owner.profile.phone}
                                </div>
                              )}
                              {assignment.request.owner?.profile?.email && assignment.request.owner?.profile?.showEmail && (
                                <div className="text-blue-600">
                                  ✉️ {assignment.request.owner.profile.email}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          {/* Actions for performer */}
                          {assignment.performerId === user?.id && assignment.status === "CLAIMED" && (
                            <>
                              <button
                                onClick={() => handleCompleteAssignment(assignment.id)}
                                disabled={completingId === assignment.id}
                                className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                {completingId === assignment.id ? "Completing..." : "Mark Complete"}
                              </button>
                              <button
                                onClick={() => handleReleaseAssignment(assignment.id)}
                                disabled={releasingId === assignment.id}
                                className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                              >
                                {releasingId === assignment.id ? "Releasing..." : "Release"}
                              </button>
                            </>
                          )}
                          
                          {/* Note: Since assignments now auto-confirm and award points immediately, 
                               we no longer need separate confirmation buttons for request owners */}
                          
                          {assignment.status === "CONFIRMED" && (
                            <span className="text-sm text-green-600 font-medium">✅ Complete & Points Awarded</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
