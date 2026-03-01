import { Outlet, Link, useLocation } from "react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Don't show header on landing page
  const isLandingPage = location.pathname === '/';
  
  if (isLandingPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">Fixora</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/services" className="text-gray-600 hover:text-gray-900">
                Find Services
              </Link>
              <Link to="/customer/dashboard" className="text-gray-600 hover:text-gray-900">
                My Bookings
              </Link>
              <Link to="/provider/dashboard" className="text-gray-600 hover:text-gray-900">
                Provider Dashboard
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

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2">
              <Link
                to="/services"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Find Services
              </Link>
              <Link
                to="/customer/dashboard"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Bookings
              </Link>
              <Link
                to="/provider/dashboard"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Provider Dashboard
              </Link>
              <Link
                to="/login"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="block px-4 py-2 bg-[#2563EB] text-white rounded-lg text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
