import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

type UserRole = "customer" | "provider" | "admin";
type AuthUser = {
  id: string;
  full_name?: string;
  email: string;
  role: UserRole;
};

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) || "http://localhost:5001";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const isLandingPage = location.pathname === "/";

  async function loadMe() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Not logged in");
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    loadMe();
    window.addEventListener("auth:changed", loadMe as EventListener);
    return () =>
      window.removeEventListener("auth:changed", loadMe as EventListener);
  }, []);

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    setUser(null);
    setMobileMenuOpen(false);
    navigate("/login");
  };

  // ✅ safe: after hooks
  if (isLandingPage) return <Outlet />;

  const displayName = user?.full_name?.trim() || user?.email;

  const showCustomerLinks = user?.role === "customer";
  const showProviderLinks = user?.role === "provider";
  const showAdminLinks = user?.role === "admin";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">
                Fixora
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/services"
                className="text-gray-600 hover:text-gray-900"
              >
                Find Services
              </Link>

              {showCustomerLinks && (
                <Link
                  to="/customer/dashboard"
                  className="text-gray-600 hover:text-gray-900"
                >
                  My Bookings
                </Link>
              )}
              {showProviderLinks && (
                <Link
                  to="/provider/dashboard"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Provider Dashboard
                </Link>
              )}
              {showAdminLinks && (
                <Link
                  to="/admin/dashboard"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Admin Dashboard
                </Link>
              )}

              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-[#2563EB] text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-gray-700">
                    Hi, <span className="font-semibold">{displayName}</span>
                  </span>
                  <button
                    onClick={logout}
                    className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2">
              <Link
                to="/services"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Find Services
              </Link>

              {showCustomerLinks && (
                <Link
                  to="/customer/dashboard"
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Bookings
                </Link>
              )}

              {!user ? (
                <>
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
                </>
              ) : (
                <div className="px-4 pt-2 space-y-2">
                  <div className="text-gray-700">
                    Hi, <span className="font-semibold">{displayName}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              )}
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
