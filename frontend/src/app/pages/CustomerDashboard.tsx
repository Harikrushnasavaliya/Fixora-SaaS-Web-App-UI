import { useState } from "react";
import { Link } from "react-router";
import { Calendar, Clock, DollarSign, Star, MapPin, CheckCircle, XCircle } from "lucide-react";
import { motion } from "motion/react";

export function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<number | null>(null);

  const activeBookings = [
    {
      id: 1,
      provider: "John Smith",
      service: "Plumbing",
      date: "Feb 15, 2026",
      time: "09:00 AM",
      status: "confirmed",
      price: 150,
      image: "JS",
    },
    {
      id: 2,
      provider: "Sarah Johnson",
      service: "Electrical",
      date: "Feb 18, 2026",
      time: "02:00 PM",
      status: "pending",
      price: 120,
      image: "SJ",
    },
  ];

  const pastBookings = [
    {
      id: 3,
      provider: "Michael Chen",
      service: "Cleaning",
      date: "Feb 10, 2026",
      time: "10:00 AM",
      status: "completed",
      price: 80,
      image: "MC",
      reviewed: false,
    },
    {
      id: 4,
      provider: "Emily Davis",
      service: "Appliance Repair",
      date: "Feb 5, 2026",
      time: "03:00 PM",
      status: "completed",
      price: 110,
      image: "ED",
      reviewed: true,
    },
    {
      id: 5,
      provider: "David Wilson",
      service: "Handyman",
      date: "Jan 28, 2026",
      time: "11:00 AM",
      status: "completed",
      price: 90,
      image: "DW",
      reviewed: true,
    },
  ];

  const paymentHistory = [
    { id: 1, date: "Feb 10, 2026", service: "Cleaning", amount: 80, status: "paid" },
    { id: 2, date: "Feb 5, 2026", service: "Appliance Repair", amount: 110, status: "paid" },
    { id: 3, date: "Jan 28, 2026", service: "Handyman", amount: 90, status: "paid" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-gray-600">Manage your bookings and service history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">Active Bookings</h3>
              <Calendar className="text-blue-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{activeBookings.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">Completed</h3>
              <CheckCircle className="text-green-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{pastBookings.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">Total Spent</h3>
              <DollarSign className="text-purple-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ${paymentHistory.reduce((sum, p) => sum + p.amount, 0)}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">Reviews Left</h3>
              <Star className="text-yellow-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {pastBookings.filter((b) => b.reviewed).length}
            </p>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="bg-white rounded-2xl shadow-md mb-8">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab("active")}
                className={`px-6 py-4 font-semibold transition-colors ${
                  activeTab === "active"
                    ? "text-[#2563EB] border-b-2 border-[#2563EB]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Active Bookings ({activeBookings.length})
              </button>
              <button
                onClick={() => setActiveTab("past")}
                className={`px-6 py-4 font-semibold transition-colors ${
                  activeTab === "past"
                    ? "text-[#2563EB] border-b-2 border-[#2563EB]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Past Bookings ({pastBookings.length})
              </button>
            </div>
          </div>

          {/* Active Bookings */}
          {activeTab === "active" && (
            <div className="p-6">
              {activeBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 mb-4">No active bookings</p>
                  <Link
                    to="/services"
                    className="inline-block bg-[#2563EB] text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Book a Service
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border border-gray-200 rounded-xl p-4 hover:border-[#2563EB] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          <div className="w-14 h-14 bg-[#2563EB] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                            {booking.image}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900">{booking.provider}</h3>
                                <p className="text-sm text-gray-600">{booking.service}</p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  booking.status === "confirmed"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar size={16} />
                                <span>{booking.date}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={16} />
                                <span>{booking.time}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign size={16} />
                                <span>${booking.price}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                          Reschedule
                        </button>
                        <button className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Past Bookings */}
          {activeTab === "past" && (
            <div className="p-6">
              <div className="space-y-4">
                {pastBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4 flex-1">
                        <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-bold flex-shrink-0">
                          {booking.image}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{booking.provider}</h3>
                              <p className="text-sm text-gray-600">{booking.service}</p>
                            </div>
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                              Completed
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar size={16} />
                              <span>{booking.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={16} />
                              <span>{booking.time}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign size={16} />
                              <span>${booking.price}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {!booking.reviewed && (
                      <button
                        onClick={() => {
                          setSelectedBooking(booking.id);
                          setShowReviewModal(true);
                        }}
                        className="w-full mt-4 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Leave a Review
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Service</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-4 text-gray-900">{payment.date}</td>
                    <td className="py-3 px-4 text-gray-900">{payment.service}</td>
                    <td className="py-3 px-4 text-gray-900 font-semibold">${payment.amount}</td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Leave a Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} className="hover:scale-110 transition-transform">
                      <Star size={32} className="text-gray-300 hover:text-yellow-400" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  placeholder="Share your experience..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert("Review submitted!");
                    setShowReviewModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}