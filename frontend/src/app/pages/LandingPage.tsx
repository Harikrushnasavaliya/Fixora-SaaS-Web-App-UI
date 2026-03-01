import { Link } from "react-router";
import {
  Search,
  Wrench,
  Zap,
  Sparkles,
  Home,
  Hammer,
  CheckCircle,
  Star,
  MapPin,
} from "lucide-react";
import { useState } from "react";

export function LandingPage() {
  const [searchService, setSearchService] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  const categories = [
    { name: "Plumbing", icon: Wrench, path: "plumbing" },
    { name: "Electrical", icon: Zap, path: "electrical" },
    { name: "Cleaning", icon: Sparkles, path: "cleaning" },
    { name: "Appliance Repair", icon: Home, path: "appliance-repair" },
    { name: "Handyman", icon: Hammer, path: "handyman" },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Search & Select",
      description: "Browse verified professionals in your area",
    },
    {
      step: "2",
      title: "Book Instantly",
      description: "Choose a time slot and confirm your booking",
    },
    {
      step: "3",
      title: "Get It Done",
      description: "Professional service delivered at your doorstep",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Homeowner",
      rating: 5,
      text: "Found an amazing plumber within minutes! The booking process was seamless and the service was top-notch.",
      image: "SJ",
    },
    {
      name: "Michael Chen",
      role: "Property Manager",
      rating: 5,
      text: "Fixora has become our go-to platform for all property maintenance needs. Reliable and professional every time.",
      image: "MC",
    },
    {
      name: "Emily Rodriguez",
      role: "Business Owner",
      rating: 5,
      text: "The quality of service providers on Fixora is exceptional. Saved us so much time and hassle!",
      image: "ER",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">Fixora</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/services" className="text-gray-600 hover:text-gray-900 hidden sm:block">
                Browse Services
              </Link>
              <Link to="/login" className="text-gray-600 hover:text-gray-900">
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-[#2563EB] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Book Trusted Home Services Instantly
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-12">
              Connect with verified local professionals for all your home service needs
            </p>

            {/* Search Bar */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="What service do you need?"
                    value={searchService}
                    onChange={(e) => setSearchService(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Your location"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                </div>
                <Link
                  to="/services"
                  className="bg-[#2563EB] text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  Search
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">
            Popular Services
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.name}
                  to={`/services/${category.path}`}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#2563EB] transition-all group"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors">
                    <Icon size={24} className="text-[#2563EB]" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {howItWorks.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-[#2563EB] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/role-selection"
              className="inline-flex items-center gap-2 bg-[#2563EB] text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CheckCircle size={20} />
              Become a Service Provider
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">
            What Our Customers Say
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={18} className="fill-[#2563EB] text-[#2563EB]" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6">{testimonial.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#2563EB] rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.image}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <span className="text-xl font-semibold">Fixora</span>
              </div>
              <p className="text-gray-400">
                Your trusted platform for home services
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/services/plumbing" className="hover:text-white">Plumbing</Link></li>
                <li><Link to="/services/electrical" className="hover:text-white">Electrical</Link></li>
                <li><Link to="/services/cleaning" className="hover:text-white">Cleaning</Link></li>
                <li><Link to="/services/handyman" className="hover:text-white">Handyman</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Safety</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Fixora. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}