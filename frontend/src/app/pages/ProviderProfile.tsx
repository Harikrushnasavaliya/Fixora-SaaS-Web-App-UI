import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Star,
  MapPin,
  Award,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  Shield,
} from "lucide-react";

export function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // Mock provider data
  const provider = {
    id: 1,
    name: "John Smith",
    service: "Plumbing",
    rating: 4.9,
    reviews: 127,
    experience: "8 years",
    distance: "2.3 km",
    startingPrice: 50,
    image: "JS",
    verified: true,
    bio: "Professional plumber with over 8 years of experience. Specialized in residential and commercial plumbing repairs, installations, and maintenance. Committed to providing high-quality service and customer satisfaction.",
    skills: [
      "Pipe Installation & Repair",
      "Drain Cleaning",
      "Water Heater Service",
      "Leak Detection",
      "Emergency Repairs",
      "Bathroom & Kitchen Plumbing",
    ],
    certifications: [
      "Licensed Master Plumber",
      "EPA Certified",
      "OSHA Safety Certified",
    ],
    completedJobs: 342,
    responseTime: "< 30 min",
  };

  const reviews = [
    {
      id: 1,
      author: "Sarah M.",
      rating: 5,
      date: "2 days ago",
      comment: "Excellent service! John was professional, on time, and fixed our leaking pipe quickly. Highly recommend!",
    },
    {
      id: 2,
      author: "Michael R.",
      rating: 5,
      date: "1 week ago",
      comment: "Very knowledgeable and efficient. Explained everything clearly and the pricing was fair. Will definitely use again.",
    },
    {
      id: 3,
      author: "Emily T.",
      rating: 4,
      date: "2 weeks ago",
      comment: "Great work installing our new water heater. The only minor issue was running a bit late, but the quality made up for it.",
    },
  ];

  const availableSlots = [
    { date: "2026-02-13", times: ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"] },
    { date: "2026-02-14", times: ["10:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"] },
    { date: "2026-02-15", times: ["09:00 AM", "12:00 PM", "02:00 PM"] },
  ];

  const handleBooking = () => {
    if (selectedDate && selectedTime) {
      alert(`Booking confirmed for ${selectedDate} at ${selectedTime}`);
      navigate("/customer/dashboard");
    } else {
      alert("Please select a date and time");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Profile Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-32 h-32 bg-[#2563EB] rounded-2xl flex items-center justify-center text-white font-bold text-4xl flex-shrink-0">
              {provider.image}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-3xl font-bold text-gray-900">{provider.name}</h1>
                    {provider.verified && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircle size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-lg text-gray-600">{provider.service} Specialist</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star size={18} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-gray-900">{provider.rating}</span>
                  <span className="text-gray-600">({provider.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={18} />
                  <span>{provider.distance} away</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Award size={18} />
                  <span>{provider.experience} experience</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                  <CheckCircle size={16} />
                  <span>{provider.completedJobs} jobs completed</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                  <Clock size={16} />
                  <span>Response time: {provider.responseTime}</span>
                </div>
                <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm">
                  <Shield size={16} />
                  <span>Background verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed">{provider.bio}</p>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Skills & Services</h2>
              <div className="flex flex-wrap gap-2">
                {provider.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Certifications</h2>
              <div className="space-y-3">
                {provider.certifications.map((cert, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Award size={20} className="text-green-600" />
                    </div>
                    <span className="text-gray-700">{cert}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Reviews ({provider.reviews})
              </h2>
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-semibold">
                          {review.author.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{review.author}</p>
                          <p className="text-sm text-gray-500">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-600">Starting from</p>
                  <p className="text-2xl font-bold text-gray-900">${provider.startingPrice}<span className="text-base font-normal text-gray-600">/hr</span></p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    Select Date
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime("");
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  >
                    <option value="">Choose a date</option>
                    {availableSlots.map((slot) => (
                      <option key={slot.date} value={slot.date}>
                        {new Date(slot.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock size={16} className="inline mr-1" />
                      Select Time
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots
                        .find((slot) => slot.date === selectedDate)
                        ?.times.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`py-2 px-3 rounded-lg border transition-colors ${
                              selectedTime === time
                                ? "bg-[#2563EB] text-white border-[#2563EB]"
                                : "bg-white text-gray-700 border-gray-300 hover:border-[#2563EB]"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleBooking}
                className="w-full bg-[#2563EB] text-white py-3 rounded-lg hover:bg-blue-700 transition-colors mb-3"
              >
                Book Now
              </button>
              <p className="text-xs text-center text-gray-500">
                You won't be charged yet
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
