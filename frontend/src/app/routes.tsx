import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

import { LandingPage } from "./pages/LandingPage";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { RoleSelection } from "./pages/RoleSelection";
import { ServiceListing } from "./pages/ServiceListing";
import ProviderProfile from "./pages/ProviderProfile";
import { CustomerDashboard } from "./pages/CustomerDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Layout } from "./components/Layout";
import { VerifyEmail } from "./pages/VerifyEmail";
import ProviderDashboard from "./pages/ProviderDashboard";
// import ProviderOnboarding from "./pages/ProviderOnboarding";

type Role = "provider" | "customer" | "admin";

type MeUser = {
  id?: string;
  _id?: string;
  full_name?: string;
  email?: string;
  role: Role;
  is_profile_complete?: boolean;
  has_created_service?: boolean;
};

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE || "http://localhost:5001";

function RequireRole({ role }: { role: Role }) {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeUser | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error("not logged in");
        if (mounted) setMe(data.user || null);
      } catch {
        if (mounted) setMe(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    window.addEventListener("auth:changed", load as any);
    return () => {
      mounted = false;
      window.removeEventListener("auth:changed", load as any);
    };
  }, []);

  if (loading) return null;
  if (!me) return <Navigate to="/login" replace />;
  if (me.role !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: LandingPage },
      { path: "login", Component: Login },
      { path: "signup", Component: Signup },
      { path: "role-selection", Component: RoleSelection },
      { path: "services/:category?", Component: ServiceListing },
      { path: "provider/:id", Component: ProviderProfile },
      { path: "verify-email", Component: VerifyEmail },

      {
        element: <RequireRole role="customer" />,
        children: [
          { path: "customer/dashboard", Component: CustomerDashboard },
        ],
      },

      {
        element: <RequireRole role="provider" />,
        children: [
          {
            path: "customer/dashboard",
            Component: CustomerDashboard as React.ComponentType,
          },
          { path: "provider/dashboard", Component: ProviderDashboard },
        ],
      },

      {
        element: <RequireRole role="admin" />,
        children: [{ path: "admin/dashboard", Component: AdminDashboard }],
      },
    ],
  },
]);
