import { useState } from "react";
import { 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  User,
  MapPin,
  Star,
  Edit,
} from "lucide-react";

export function ProviderDashboard() {
  const [isAvailable, setIsAvailable] = useState(true);
  const [activeTab, setActiveTab] = useState<"requests" | "earnings">("requests");

  const jobRequests = [
    {
      id: 1,
      customer: "Sarah Mitchell",
      service: "Plumbing - Leak Repair",
      date: "Feb 15, 2026",
      time: "09:00 AM",
      location: "123 Oak Street, 2.3 km away",
      estimatedPrice: 150,
      status: "pending",
      image: "SM",
    },
    {
      id: 2,
      customer: "Robert Johnson",
      service: "Plumbing - Water Heater Installation",
      date: "Feb 16, 2026",
      time: "02:00 PM",
      location: "456 Pine Avenue, 3.7 km away",
      estimatedPrice: 300,
      status: "pending",
      image: "RJ",
    },
    {
      id: 3,
      customer: "Emily Chen",
      service: "Plumbing - Drain Cleaning",
      date: "Feb 14, 2026",
      time: "11:00 AM",
      location: "789 Maple Drive, 1.5 km away",
      estimatedPrice: 100,
      status: "accepted",
      image: "EC",
    },
  ];

  const earningsData = {
    today: 450,
    thisWeek: 1850,
    thisMonth: 6200,
    total: 18450,
  };

  const recentEarnings = [
    { id: 1, date: "Feb 10, 2026", customer: "John Doe", service: "Leak Repair", amount: 150 },
    { id: 2, date: "Feb 9, 2026", customer: "Jane Smith", service: "Pipe Installation", amount: 200 },
    { id: 3, date: "Feb 8, 2026", customer: "Mike Brown", service: "Water Heater", amount: 300 },
    { id: 4, date: "Feb 7, 2026", customer: "Lisa White", service: "Drain Cleaning", amount: 100 },
  ];

  const handleAccept = (id: number) => {
    alert(`Job request #${id} accepted!`);
  };

  const handleReject = (id: number) => {
    alert(`Job request #${id} rejected!`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Dashboard</h1>
            <p className="text-gray-600">Manage your jobs and track earnings</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {isAvailable ? "Available for jobs" : "Unavailable"}
            </span>
            <button
              onClick={() => setIsAvailable(!isAvailable)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isAvailable ? "bg-[#22C55E]" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isAvailable ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">Today's Earnings</h3>
              <DollarSign className="text-green-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">${earningsData.today}</p>
            <p className="text-xs text-green-600 mt-1">↑ 12% from yesterday</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">This Week</h3>
              <TrendingUp className="text-blue-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">${earningsData.thisWeek}</p>
            <p className="text-xs text-green-600 mt-1">↑ 8% from last week</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">This Month</h3>
              <Calendar className="text-purple-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">${earningsData.thisMonth}</p>
            <p className="text-xs text-green-600 mt-1">↑ 15% from last month</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">Total Earnings</h3>
              <CheckCircle className="text-orange-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">${earningsData.total}</p>
            <p className="text-xs text-gray-500 mt-1">342 jobs completed</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-md mb-6">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("requests")}
                    className={`px-6 py-4 font-semibold transition-colors ${
                      activeTab === "requests"
                        ? "text-[#2563EB] border-b-2 border-[#2563EB]"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Job Requests ({jobRequests.filter((j) => j.status === "pending").length})
                  </button>
                  <button
                    onClick={() => setActiveTab("earnings")}
                    className={`px-6 py-4 font-semibold transition-colors ${
                      activeTab === "earnings"
                        ? "text-[#2563EB] border-b-2 border-[#2563EB]"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Earnings History
                  </button>
                </div>
              </div>

              {/* Job Requests */}
              {activeTab === "requests" && (
                <div className="p-6">
                  <div className="space-y-4">
                    {jobRequests.map((request) => (
                      <div
                        key={request.id}
                        className="border border-gray-200 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex gap-3">
                            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-bold flex-shrink-0">
                              {request.image}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{request.customer}</h3>
                              <p className="text-sm text-gray-600">{request.service}</p>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              request.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={16} className="text-gray-400" />
                            <span>{request.date} at {request.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin size={16} className="text-gray-400" />
                            <span>{request.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-900 font-semibold">
                            <DollarSign size={16} className="text-gray-400" />
                            <span>Estimated: ${request.estimatedPrice}</span>
                          </div>
                        </div>

                        {request.status === "pending" && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleAccept(request.id)}
                              className="flex-1 px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {jobRequests.filter((j) => j.status === "pending").length === 0 && (
                      <div className="text-center py-12">
                        <Clock size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600">No pending job requests</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Earnings History */}
              {activeTab === "earnings" && (
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Date</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Customer</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Service</th>
                          <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentEarnings.map((earning) => (
                          <tr key={earning.id} className="border-b border-gray-100 last:border-0">
                            <td className="py-3 px-2 text-sm text-gray-900">{earning.date}</td>
                            <td className="py-3 px-2 text-sm text-gray-900">{earning.customer}</td>
                            <td className="py-3 px-2 text-sm text-gray-600">{earning.service}</td>
                            <td className="py-3 px-2 text-sm text-gray-900 font-semibold">
                              ${earning.amount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">My Profile</h3>
                <button className="text-[#2563EB] hover:text-blue-700">
                  <Edit size={18} />
                </button>
              </div>
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-[#2563EB] rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">
                  JS
                </div>
                <h4 className="font-semibold text-gray-900">John Smith</h4>
                <p className="text-sm text-gray-600">Plumbing Specialist</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900">4.9</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Reviews</span>
                  <span className="font-semibold text-gray-900">127</span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Experience</span>
                  <span className="font-semibold text-gray-900">8 years</span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Jobs Completed</span>
                  <span className="font-semibold text-gray-900">342</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-blue-50 text-[#2563EB] rounded-lg hover:bg-blue-100 transition-colors text-left">
                  Update Availability
                </button>
                <button className="w-full px-4 py-3 bg-blue-50 text-[#2563EB] rounded-lg hover:bg-blue-100 transition-colors text-left">
                  Edit Profile
                </button>
                <button className="w-full px-4 py-3 bg-blue-50 text-[#2563EB] rounded-lg hover:bg-blue-100 transition-colors text-left">
                  Manage Certifications
                </button>
                <button className="w-full px-4 py-3 bg-blue-50 text-[#2563EB] rounded-lg hover:bg-blue-100 transition-colors text-left">
                  Payment Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
