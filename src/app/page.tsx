import Link from "next/link";
import { Search, Plus, Heart, Users, Award, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Connect. Serve. Grow.
          </h1>
          <h2 className="text-3xl text-blue-600 mb-8">
            Mitzvah Exchange Portal
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Join our community platform where members post mitzvah opportunities and others fulfill them. 
            Build connections, earn recognition, and make a meaningful impact in your community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/discover"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
            >
              <Search className="mr-2 h-5 w-5" />
              Find Mitzvahs
            </Link>
            <Link
              href="/auth/register"
              className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors inline-flex items-center justify-center"
            >
              <Plus className="mr-2 h-5 w-5" />
              Join Community
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">500+</div>
              <div className="text-gray-600">Mitzvahs Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">200+</div>
              <div className="text-gray-600">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">50+</div>
              <div className="text-gray-600">Cities Served</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-16">
            How It Works
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-4">1. Post a Need</h4>
              <p className="text-gray-600">
                Community members post mitzvah opportunities - from transportation needs to visit requests, 
                errands, tutoring, and more.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold mb-4">2. Find & Claim</h4>
              <p className="text-gray-600">
                Browse available mitzvahs by category, location, or urgency. Claim ones that match 
                your skills and availability.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold mb-4">3. Complete & Earn</h4>
              <p className="text-gray-600">
                Fulfill the mitzvah, mark it complete, and earn recognition points. Build your 
                reputation and community impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-16">
            Mitzvah Categories
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Visits", icon: "👥", color: "bg-blue-100 text-blue-600" },
              { name: "Transportation", icon: "🚗", color: "bg-green-100 text-green-600" },
              { name: "Errands", icon: "🛍️", color: "bg-purple-100 text-purple-600" },
              { name: "Tutoring", icon: "📚", color: "bg-orange-100 text-orange-600" },
              { name: "Meals", icon: "🍜", color: "bg-red-100 text-red-600" },
              { name: "Household", icon: "🏠", color: "bg-yellow-100 text-yellow-600" },
              { name: "Technology", icon: "💻", color: "bg-indigo-100 text-indigo-600" },
              { name: "Other", icon: "❤️", color: "bg-pink-100 text-pink-600" },
            ].map((category) => (
              <div key={category.name} className="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-full ${category.color} flex items-center justify-center mx-auto mb-3`}>
                  <span className="text-2xl">{category.icon}</span>
                </div>
                <h4 className="font-semibold text-gray-800">{category.name}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-16">
            Platform Features
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Community Profiles</h4>
                <p className="text-gray-600">Build your reputation with detailed profiles, skills, and verified credentials.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Points & Recognition</h4>
                <p className="text-gray-600">Earn mitzvah points and badges for your community contributions.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-green-100 rounded-lg p-3">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Safe & Trusted</h4>
                <p className="text-gray-600">Verification, moderation, and safety features ensure community trust.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-6">Ready to Make a Difference?</h3>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of community members who are already connecting and serving through our platform.
          </p>
          <Link
            href="/auth/register"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
          >
            Get Started Today
          </Link>
        </div>
      </section>
    </div>
  );
}
