import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Users,
  Briefcase,
  TrendingUp,
  Search,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  CheckCircle2,
  XCircle,
  RefreshCcw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) || "http://localhost:5001";

type ProviderStatus = "draft" | "pending" | "verified" | "rejected";

type ProviderRow = {
  _id: string;
  full_name?: string;
  email: string;
  role: "provider";
  provider_status?: ProviderStatus;
  is_profile_complete?: boolean;
  createdAt?: string;
  provider_profile?: {
    phone?: string;
    ssn_last4?: string;
    photo_url?: string;
    document_url?: string;
    verification_doc_url?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
};

type UserRow = {
  _id: string;
  full_name?: string;
  email: string;
  role: "customer" | "provider";
  is_active: boolean;
  deactivated_at?: string;
};

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data as T;
}

export function AdminDashboard() {
  const [timeRange, setTimeRange] = useState("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [providerSearch, setProviderSearch] = useState("");
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState<string>("");
  const [pendingProviders, setPendingProviders] = useState<ProviderRow[]>([]);
  const [actionBusy, setActionBusy] = useState<Record<string, boolean>>({});
  const [deactivatedUsers, setDeactivatedUsers] = useState<UserRow[]>([]);
  const [deactivatedLoading, setDeactivatedLoading] = useState(false);
  const [deactivatedError, setDeactivatedError] = useState("");
  const [categories, setCategories] = useState<
    { _id: string; category_name: string; icon?: string }[]
  >([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");
  const [catSaving, setCatSaving] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [reactivateBusy, setReactivateBusy] = useState<Record<string, boolean>>(
    {},
  );
  const [deactivatedSearch, setDeactivatedSearch] = useState("");
  const stats = {
    totalRevenue: 284500,
    revenueGrowth: 12.5,
    totalBookings: 1284,
    bookingsGrowth: 8.3,
    activeProviders: 156,
    providersGrowth: 5.2,
    platformCommission: 42675,
  };

  const monthlyRevenue = [
    { month: "Jan", revenue: 45000, bookings: 180 },
    { month: "Feb", revenue: 52000, bookings: 210 },
    { month: "Mar", revenue: 48000, bookings: 195 },
    { month: "Apr", revenue: 61000, bookings: 245 },
    { month: "May", revenue: 58000, bookings: 230 },
    { month: "Jun", revenue: 71000, bookings: 284 },
  ];

  const categoryDistribution = [
    { name: "Plumbing", value: 35, color: "#2563EB" },
    { name: "Electrical", value: 28, color: "#3B82F6" },
    { name: "Cleaning", value: 22, color: "#60A5FA" },
    { name: "Appliance Repair", value: 10, color: "#93C5FD" },
    { name: "Handyman", value: 5, color: "#BFDBFE" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  async function loadPendingProviders() {
    setProvidersError("");
    setProvidersLoading(true);
    try {
      const res = await apiFetch<{ providers: ProviderRow[] }>(
        "/api/admin/providers?status=pending_verification",
      );
      setPendingProviders(res.providers || []);
    } catch (e: any) {
      setProvidersError(e?.message || "Failed to load pending providers");
      setPendingProviders([]);
    } finally {
      setProvidersLoading(false);
    }
  }

  async function loadDeactivatedUsers() {
    setDeactivatedError("");
    setDeactivatedLoading(true);
    try {
      const res = await apiFetch<{ users: UserRow[] }>(
        "/api/admin/users?is_active=false",
      );
      setDeactivatedUsers(res.users || []);
    } catch (e: any) {
      setDeactivatedError(e?.message || "Failed to load deactivated users");
    } finally {
      setDeactivatedLoading(false);
    }
  }

  const filteredDeactivated = useMemo(() => {
    const q = deactivatedSearch.trim().toLowerCase();
    if (!q) return deactivatedUsers;
    return deactivatedUsers.filter((u) => {
      const name = (u.full_name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [deactivatedUsers, deactivatedSearch]);

  async function reactivateUser(id: string) {
    setReactivateBusy((s) => ({ ...s, [id]: true }));
    try {
      await apiFetch(`/api/admin/users/${id}/reactivate`, {
        method: "PATCH",
      });
      setDeactivatedUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (e: any) {
      setDeactivatedError(e?.message || "Failed to reactivate user");
    } finally {
      setReactivateBusy((s) => ({ ...s, [id]: false }));
    }
  }

  useEffect(() => {
    void loadPendingProviders();
    void loadDeactivatedUsers();
  }, []);

  const filteredPending = useMemo(() => {
    const q = providerSearch.trim().toLowerCase();
    if (!q) return pendingProviders;
    return pendingProviders.filter((p) => {
      const name = (p.full_name || "").toLowerCase();
      const email = (p.email || "").toLowerCase();
      const phone = (p.provider_profile?.phone || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [pendingProviders, providerSearch]);

  async function updateProviderStatus(id: string, status: ProviderStatus) {
    setProvidersError("");
    setActionBusy((s) => ({ ...s, [id]: true }));
    try {
      await apiFetch(`/api/admin/providers/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }), // ✅ changed from { provider_status: status }
      });
      setPendingProviders((prev) => prev.filter((p) => p._id !== id));
    } catch (e: any) {
      setProvidersError(e?.message || "Failed to update provider status");
    } finally {
      setActionBusy((s) => ({ ...s, [id]: false }));
    }
  }

  async function loadCategories() {
    setCatLoading(true);
    setCatError("");
    try {
      const res = await apiFetch<{ categories: any[] }>("/api/categories");
      setCategories(res.categories || []);
    } catch (e: any) {
      setCatError(e?.message || "Failed to load categories");
    } finally {
      setCatLoading(false);
    }
  }

  async function createCategory() {
    if (!newCatName.trim()) {
      setCatError("Category name is required");
      return;
    }
    setCatSaving(true);
    setCatError("");
    try {
      await apiFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({
          category_name: newCatName.trim(),
          icon: newCatIcon.trim(),
        }),
      });
      setNewCatName("");
      setNewCatIcon("");
      await loadCategories();
    } catch (e: any) {
      setCatError(e?.message || "Failed to create category");
    } finally {
      setCatSaving(false);
    }
  }

  async function updateCategory(id: string) {
    if (!editCatName.trim()) return;
    try {
      await apiFetch(`/api/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ category_name: editCatName.trim() }),
      });
      setEditCatId(null);
      setEditCatName("");
      await loadCategories();
    } catch (e: any) {
      setCatError(e?.message || "Failed to update category");
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category? Services under it may be affected."))
      return;
    try {
      await apiFetch(`/api/categories/${id}`, { method: "DELETE" });
      await loadCategories();
    } catch (e: any) {
      setCatError(e?.message || "Failed to delete category");
    }
  }

  useEffect(() => {
    void loadPendingProviders();
    void loadDeactivatedUsers();
    void loadCategories(); // ✅ add this
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Overview of platform performance and analytics
              </p>
            </div>
            <div className="flex gap-3">
              <select
                aria-label="Time range filter"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="quarter">Last 3 months</option>
                <option value="year">Last year</option>
              </select>
              <button className="flex items-center gap-2 bg-[#2563EB] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Download size={18} />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <DollarSign className="text-[#2563EB]" size={24} />
              </div>
              <span
                className={`flex items-center gap-1 text-sm ${
                  stats.revenueGrowth > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {stats.revenueGrowth > 0 ? (
                  <ArrowUpRight size={16} />
                ) : (
                  <ArrowDownRight size={16} />
                )}
                {Math.abs(stats.revenueGrowth)}%
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              ${stats.totalRevenue.toLocaleString()}
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Briefcase className="text-[#2563EB]" size={24} />
              </div>
              <span
                className={`flex items-center gap-1 text-sm ${
                  stats.bookingsGrowth > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {stats.bookingsGrowth > 0 ? (
                  <ArrowUpRight size={16} />
                ) : (
                  <ArrowDownRight size={16} />
                )}
                {Math.abs(stats.bookingsGrowth)}%
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Bookings</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalBookings}
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="text-[#2563EB]" size={24} />
              </div>
              <span
                className={`flex items-center gap-1 text-sm ${
                  stats.providersGrowth > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {stats.providersGrowth > 0 ? (
                  <ArrowUpRight size={16} />
                ) : (
                  <ArrowDownRight size={16} />
                )}
                {Math.abs(stats.providersGrowth)}%
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-1">Active Providers</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.activeProviders}
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-[#2563EB]" size={24} />
              </div>
              <span className="flex items-center gap-1 text-sm text-green-600">
                <ArrowUpRight size={16} />
                15%
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-1">Platform Commission</p>
            <p className="text-2xl font-bold text-gray-900">
              ${stats.platformCommission.toLocaleString()}
            </p>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Revenue Trend
              </h3>
              <BarChart3 className="text-gray-400" size={20} />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={{ fill: "#2563EB" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Service Category Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="bg-white rounded-xl p-6 border border-gray-200 mb-8"
        >
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Provider Verification
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Approve or reject provider onboarding. Only approved providers
                appear to customers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => void loadPendingProviders()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                disabled={providersLoading}
              >
                <RefreshCcw size={16} />
                Refresh
              </button>

              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search providers..."
                  value={providerSearch}
                  onChange={(e) => setProviderSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {providersError ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {providersError}
            </div>
          ) : null}

          {providersLoading ? (
            <div className="text-gray-600">Loading pending providers...</div>
          ) : filteredPending.length === 0 ? (
            <div className="text-gray-600">No pending providers.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Provider
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Phone
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Profile
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.map((p) => {
                    const busy = !!actionBusy[p._id];
                    const initials =
                      (p.full_name || p.email)
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((x) => x[0]?.toUpperCase())
                        .join("") || "P";

                    return (
                      <tr
                        key={p._id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#2563EB] rounded-full flex items-center justify-center text-white font-semibold">
                              {initials}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {p.full_name || "Provider"}
                              </div>
                              <div className="text-sm text-gray-600">
                                {p.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-gray-700">
                          {p.provider_profile?.phone || "—"}
                        </td>

                        <td className="py-3 px-4 text-gray-700">
                          <div className="text-sm">
                            {p.is_profile_complete ? "Complete" : "Incomplete"}
                          </div>
                          <div className="text-xs text-gray-500">
                            SSN:{" "}
                            {p.provider_profile?.ssn_last4
                              ? `****${p.provider_profile.ssn_last4}`
                              : "—"}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-3 py-1 text-xs font-semibold">
                            {p.provider_status || "pending"}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                void updateProviderStatus(p._id, "verified")
                              }
                              disabled={busy}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                            >
                              <CheckCircle2 size={16} />
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                void updateProviderStatus(p._id, "rejected")
                              }
                              disabled={busy}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                            >
                              <XCircle size={16} />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="bg-white rounded-xl p-6 border border-gray-200 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Monthly Bookings
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="bookings" fill="#2563EB" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-white rounded-xl p-6 border border-gray-200 mb-8"
        >
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Deactivated Accounts
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Users who deactivated their accounts. You can reactivate them
                here.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void loadDeactivatedUsers()}
                disabled={deactivatedLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <RefreshCcw size={16} />
                Refresh
              </button>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={deactivatedSearch}
                  onChange={(e) => setDeactivatedSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {deactivatedError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {deactivatedError}
            </div>
          )}

          {deactivatedLoading ? (
            <div className="text-gray-600">Loading deactivated users...</div>
          ) : filteredDeactivated.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No deactivated accounts found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      User
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Deactivated At
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeactivated.map((u) => {
                    const busy = !!reactivateBusy[u._id];
                    const initials =
                      (u.full_name || u.email)
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((x) => x[0]?.toUpperCase())
                        .join("") || "U";

                    return (
                      <tr
                        key={u._id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold">
                              {initials}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {u.full_name || "User"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              u.role === "provider"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-sm text-gray-600">
                          {u.deactivated_at
                            ? new Date(u.deactivated_at).toLocaleDateString()
                            : "—"}
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-semibold">
                            Deactivated
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex justify-end">
                            <button
                              onClick={() => void reactivateUser(u._id)}
                              disabled={busy}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 transition"
                            >
                              <CheckCircle2 size={16} />
                              {busy ? "Reactivating..." : "Reactivate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="bg-white rounded-xl p-6 border border-gray-200 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Service Categories
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage categories that providers use when creating services.
              </p>
            </div>
            <button
              onClick={() => void loadCategories()}
              disabled={catLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>

          {catError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {catError}
            </div>
          )}

          <div className="flex gap-3 mb-6">
            <input
              type="text"
              placeholder="Category name (e.g. Plumbing)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
            <input
              type="text"
              placeholder="Icon (optional)"
              value={newCatIcon}
              onChange={(e) => setNewCatIcon(e.target.value)}
              className="w-40 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
            <button
              onClick={() => void createCategory()}
              disabled={catSaving}
              className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {catSaving ? "Adding..." : "+ Add"}
            </button>
          </div>

          {/* Categories list */}
          {catLoading ? (
            <div className="text-gray-600">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-gray-500 py-8 text-center">
              No categories yet. Add one above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Category Name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Icon
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr
                      key={cat._id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        {editCatId === cat._id ? (
                          <input
                            value={editCatName}
                            onChange={(e) => setEditCatName(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB] w-full max-w-xs"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium text-gray-900">
                            {cat.category_name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {cat.icon || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          {editCatId === cat._id ? (
                            <>
                              <button
                                onClick={() => void updateCategory(cat._id)}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditCatId(null);
                                  setEditCatName("");
                                }}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditCatId(cat._id);
                                  setEditCatName(cat.category_name);
                                }}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => void deleteCategory(cat._id)}
                                className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Transactions
            </h3>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>
          <div className="text-gray-600">
            Keep your existing transaction UI here (unchanged).
          </div>
        </motion.div>
      </div>
    </div>
  );
}
