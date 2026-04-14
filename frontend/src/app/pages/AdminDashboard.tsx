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
  ((import.meta as any).env?.VITE_API_BASE as string) ||
  "http://localhost:5001";
const PAGE_SIZE = 5;

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

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        Page <span className="font-semibold">{page}</span> of{" "}
        <span className="font-semibold">{totalPages}</span>
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          «
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ‹ Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | "...")[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "..." ? (
              <span
                key={`dot-${i}`}
                className="px-2 py-1.5 text-gray-400 text-sm"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${
                  page === p
                    ? "bg-[#2563EB] text-white border-[#2563EB]"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ),
          )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next ›
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          »
        </button>
      </div>
    </div>
  );
}

function AdminIssueActions({
  issue,
  onUpdate,
}: {
  issue: any;
  onUpdate: () => void;
}) {
  const [resolutionType, setResolutionType] = useState("none");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function resolve() {
    if (resolutionType !== "none" && !amount) {
      setError("Please enter amount");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/issues/${issue._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          resolution_type: resolutionType,
          resolution_amount: Number(amount) || 0,
          resolution_note: note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setOpen(false);
      onUpdate();
    } catch (e: any) {
      setError(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function markInReview() {
    try {
      await fetch(`${API_BASE}/api/issues/${issue._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_review" }),
      });
      onUpdate();
    } catch (error) {
      console.error("requestReschedule error:", error);
    }
  }

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      {!open ? (
        <div className="flex gap-2 flex-wrap">
          {issue.status === "open" && (
            <button
              onClick={markInReview}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            >
              👁 Mark In Review
            </button>
          )}
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700"
          >
            ✅ Resolve Issue
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="font-semibold text-gray-900 mb-3">
            Resolve this issue:
          </div>
          {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

          <div className="grid grid-cols-1 gap-2 mb-4">
            <button
              onClick={() => setResolutionType("none")}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border transition ${
                resolutionType === "none"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              ✅ Resolve — No Action Needed
            </button>

            {issue.refund_requested && (
              <button
                onClick={() => setResolutionType("refund")}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border transition ${
                  resolutionType === "refund"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                💰 Approve Refund to Customer
              </button>
            )}

            <button
              onClick={() => setResolutionType("extra_charge")}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border transition ${
                resolutionType === "extra_charge"
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              💳 Extra Charge to Customer
            </button>
          </div>

          {resolutionType !== "none" && (
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Amount ($)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Resolution Note (shown to customer)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Explain what action was taken..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={resolve}
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60"
            >
              {loading ? "Resolving..." : "Confirm Resolution"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-5 py-2 rounded-lg border border-gray-200 font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminDashboard() {
  const [timeRange, setTimeRange] = useState("month");
  const [searchTerm, setSearchTerm] = useState("");

  // ── Provider state ──
  const [providerSearch, setProviderSearch] = useState("");
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState<string>("");
  const [pendingProviders, setPendingProviders] = useState<ProviderRow[]>([]);
  const [actionBusy, setActionBusy] = useState<Record<string, boolean>>({});
  const [providerPage, setProviderPage] = useState(1);
  const [providerTotalPages, setProviderTotalPages] = useState(1);
  const [providerTotal, setProviderTotal] = useState(0);

  // ── Deactivated state ──
  const [deactivatedUsers, setDeactivatedUsers] = useState<UserRow[]>([]);
  const [deactivatedLoading, setDeactivatedLoading] = useState(false);
  const [deactivatedError, setDeactivatedError] = useState("");
  const [deactivatedSearch, setDeactivatedSearch] = useState("");
  const [reactivateBusy, setReactivateBusy] = useState<Record<string, boolean>>(
    {},
  );
  const [deactivatedPage, setDeactivatedPage] = useState(1);
  const [deactivatedTotalPages, setDeactivatedTotalPages] = useState(1);
  const [deactivatedTotal, setDeactivatedTotal] = useState(0);

  // ── Categories state ──
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");
  const [catSaving, setCatSaving] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [newCatMinPrice, setNewCatMinPrice] = useState("");
  const [newCatMaxPrice, setNewCatMaxPrice] = useState("");
  const [newCatAllowFixed, setNewCatAllowFixed] = useState(true);
  const [newCatAllowHourly, setNewCatAllowHourly] = useState(true);
  const [catSearch, setCatSearch] = useState("");
  const [catPage, setCatPage] = useState(1);
  const [catTotalPages, setCatTotalPages] = useState(1);
  const [catTotal, setCatTotal] = useState(0);
  type CategoryRow = {
    _id: string;
    category_name: string;
    icon?: string;
    is_active?: boolean;
    min_price?: number;
    max_price?: number;
    allowed_pricing_types?: string[];
  };

  const [categories, setCategories] = useState<CategoryRow[]>([]);

  // ── Services state ──
  const [allServices, setAllServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [servicesPage, setServicesPage] = useState(1);
  const [servicesTotalPages, setServicesTotalPages] = useState(1);
  const [servicesTotal, setServicesTotal] = useState(0);

  // ── Reviews state ──
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewsSearch, setReviewsSearch] = useState("");
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [reviewsTotal, setReviewsTotal] = useState(0);

  // ── Issues state ──
  const [issues, setIssues] = useState<any[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesError, setIssuesError] = useState("");

  const adminIssues = useMemo(() => {
    return issues.filter(
      (i) => i.refund_requested === true && i.status !== "resolved",
    );
  }, [issues]);

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

  // ── Load Functions ──

  async function loadPendingProviders(
    page = providerPage,
    search = providerSearch,
  ) {
    setProvidersError("");
    setProvidersLoading(true);
    try {
      const res = await apiFetch<{
        providers: ProviderRow[];
        totalPages: number;
        total: number;
      }>(
        `/api/admin/providers?status=pending_verification&page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(search)}`,
      );
      setPendingProviders(res.providers || []);
      setProviderTotalPages(res.totalPages || 1);
      setProviderTotal(res.total || 0);
    } catch (e: any) {
      setProvidersError(e?.message || "Failed to load pending providers");
      setPendingProviders([]);
    } finally {
      setProvidersLoading(false);
    }
  }

  async function loadDeactivatedUsers(
    page = deactivatedPage,
    search = deactivatedSearch,
  ) {
    setDeactivatedError("");
    setDeactivatedLoading(true);
    try {
      const res = await apiFetch<{
        users: UserRow[];
        totalPages: number;
        total: number;
      }>(
        `/api/admin/users?is_active=false&page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(search)}`,
      );
      setDeactivatedUsers(res.users || []);
      setDeactivatedTotalPages(res.totalPages || 1);
      setDeactivatedTotal(res.total || 0);
    } catch (e: any) {
      setDeactivatedError(e?.message || "Failed to load deactivated users");
    } finally {
      setDeactivatedLoading(false);
    }
  }

  async function loadCategories(page = catPage, search = catSearch) {
    setCatLoading(true);
    setCatError("");
    try {
      const res = await apiFetch<{
        categories: any[];
        totalPages: number;
        total: number;
      }>(
        `/api/categories?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(search)}`,
      );
      setCategories(res.categories || []);
      setCatTotalPages(res.totalPages || 1);
      setCatTotal(res.total || 0);
    } catch (e: any) {
      setCatError(e?.message || "Failed to load categories");
    } finally {
      setCatLoading(false);
    }
  }

  async function loadAllServices(page = servicesPage, search = serviceSearch) {
    setServicesLoading(true);
    setServicesError("");
    try {
      const res = await apiFetch<{
        services: any[];
        totalPages: number;
        total: number;
      }>(
        `/api/admin/services?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(search)}`,
      );
      setAllServices(res.services || []);
      setServicesTotalPages(res.totalPages || 1);
      setServicesTotal(res.total || 0);
    } catch (e: any) {
      setServicesError(e?.message || "Failed to load services");
    } finally {
      setServicesLoading(false);
    }
  }

  async function loadReviews(page = reviewsPage, search = reviewsSearch) {
    setReviewsLoading(true);
    setReviewsError("");
    try {
      const res = await apiFetch<{
        reviews: any[];
        totalPages: number;
        total: number;
      }>(
        `/api/reviews?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(search)}`,
      );
      setReviews(res.reviews || []);
      setReviewsTotalPages(res.totalPages || 1);
      setReviewsTotal(res.total || 0);
    } catch (e: any) {
      setReviewsError(e?.message || "Failed to load reviews");
    } finally {
      setReviewsLoading(false);
    }
  }

  async function loadIssues() {
    setIssuesLoading(true);
    setIssuesError("");
    try {
      const res = await apiFetch<{ issues: any[] }>("/api/issues");
      setIssues(res.issues || []);
    } catch (e: any) {
      setIssuesError(e?.message || "Failed to load issues");
    } finally {
      setIssuesLoading(false);
    }
  }

  // ── Initial load ──
  useEffect(() => {
    void loadPendingProviders(1, "");
    void loadDeactivatedUsers(1, "");
    void loadCategories(1, "");
    void loadAllServices(1, "");
    void loadReviews(1, "");
    void loadIssues();
  }, []);

  // ── Search + page effects ──
  useEffect(() => {
    setProviderPage(1);
    void loadPendingProviders(1, providerSearch);
  }, [providerSearch]);
  useEffect(() => {
    void loadPendingProviders(providerPage, providerSearch);
  }, [providerPage]);

  useEffect(() => {
    setDeactivatedPage(1);
    void loadDeactivatedUsers(1, deactivatedSearch);
  }, [deactivatedSearch]);
  useEffect(() => {
    void loadDeactivatedUsers(deactivatedPage, deactivatedSearch);
  }, [deactivatedPage]);

  useEffect(() => {
    setCatPage(1);
    void loadCategories(1, catSearch);
  }, [catSearch]);
  useEffect(() => {
    void loadCategories(catPage, catSearch);
  }, [catPage]);

  useEffect(() => {
    setServicesPage(1);
    void loadAllServices(1, serviceSearch);
  }, [serviceSearch]);
  useEffect(() => {
    void loadAllServices(servicesPage, serviceSearch);
  }, [servicesPage]);

  useEffect(() => {
    setReviewsPage(1);
    void loadReviews(1, reviewsSearch);
  }, [reviewsSearch]);
  useEffect(() => {
    void loadReviews(reviewsPage, reviewsSearch);
  }, [reviewsPage]);

  // ── Actions ──

  async function reactivateUser(id: string) {
    setReactivateBusy((s) => ({ ...s, [id]: true }));
    try {
      await apiFetch(`/api/admin/users/${id}/reactivate`, { method: "PATCH" });
      void loadDeactivatedUsers(deactivatedPage, deactivatedSearch);
    } catch (e: any) {
      setDeactivatedError(e?.message || "Failed to reactivate user");
    } finally {
      setReactivateBusy((s) => ({ ...s, [id]: false }));
    }
  }

  async function updateProviderStatus(id: string, status: ProviderStatus) {
    setProvidersError("");
    setActionBusy((s) => ({ ...s, [id]: true }));
    try {
      await apiFetch(`/api/admin/providers/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      void loadPendingProviders(providerPage, providerSearch);
    } catch (e: any) {
      setProvidersError(e?.message || "Failed to update provider status");
    } finally {
      setActionBusy((s) => ({ ...s, [id]: false }));
    }
  }

  async function createCategory() {
    if (!newCatName.trim()) {
      setCatError("Category name is required");
      return;
    }
    const allowed_pricing_types = [
      ...(newCatAllowFixed ? ["fixed"] : []),
      ...(newCatAllowHourly ? ["hourly"] : []),
    ];
    if (allowed_pricing_types.length === 0) {
      setCatError("Select at least one pricing type");
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
          min_price: Number(newCatMinPrice) || 0,
          max_price: Number(newCatMaxPrice) || 9999,
          allowed_pricing_types,
        }),
      });
      setNewCatName("");
      setNewCatIcon("");
      setNewCatMinPrice("");
      setNewCatMaxPrice("");
      setNewCatAllowFixed(true);
      setNewCatAllowHourly(true);
      void loadCategories(1, catSearch);
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
      void loadCategories(catPage, catSearch);
    } catch (e: any) {
      setCatError(e?.message || "Failed to update category");
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category? Services under it may be affected."))
      return;
    try {
      await apiFetch(`/api/categories/${id}`, { method: "DELETE" });
      void loadCategories(catPage, catSearch);
    } catch (e: any) {
      setCatError(e?.message || "Failed to delete category");
    }
  }

  async function toggleService(id: string) {
    try {
      await apiFetch(`/api/admin/services/${id}/toggle`, { method: "PATCH" });
      void loadAllServices(servicesPage, serviceSearch);
    } catch (e: any) {
      setServicesError(e?.message || "Failed to toggle service");
    }
  }

  async function toggleCategory(id: string) {
    try {
      await apiFetch(`/api/categories/${id}/toggle`, { method: "PATCH" });
      void loadCategories(catPage, catSearch);
    } catch (e: any) {
      setCatError(e?.message || "Failed to toggle category");
    }
  }

  async function toggleReview(id: string) {
    try {
      await apiFetch(`/api/reviews/${id}/toggle`, { method: "PATCH" });
      void loadReviews(reviewsPage, reviewsSearch);
    } catch (e: any) {
      setReviewsError(e?.message || "Failed to toggle review");
    }
  }

  async function deleteReview(id: string) {
    if (!confirm("Delete this review permanently?")) return;
    try {
      await apiFetch(`/api/reviews/${id}`, { method: "DELETE" });
      void loadReviews(reviewsPage, reviewsSearch);
    } catch (e: any) {
      setReviewsError(e?.message || "Failed to delete review");
    }
  }

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
        {/* ── Stats ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {[
            {
              label: "Total Revenue",
              value: `$${stats.totalRevenue.toLocaleString()}`,
              growth: stats.revenueGrowth,
              Icon: DollarSign,
            },
            {
              label: "Total Bookings",
              value: stats.totalBookings,
              growth: stats.bookingsGrowth,
              Icon: Briefcase,
            },
            {
              label: "Active Providers",
              value: stats.activeProviders,
              growth: stats.providersGrowth,
              Icon: Users,
            },
            {
              label: "Platform Commission",
              value: `$${stats.platformCommission.toLocaleString()}`,
              growth: 15,
              Icon: TrendingUp,
            },
          ].map(({ label, value, growth, Icon }) => (
            <motion.div
              key={label}
              variants={itemVariants}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Icon className="text-[#2563EB]" size={24} />
                </div>
                <span
                  className={`flex items-center gap-1 text-sm ${growth > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {growth > 0 ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <ArrowDownRight size={16} />
                  )}
                  {Math.abs(growth)}%
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-1">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Charts ── */}
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

        {/* ── Provider Verification ── */}
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
                Approve or reject provider onboarding.{" "}
                <span className="text-gray-400 text-xs">
                  ({providerTotal} total)
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  void loadPendingProviders(providerPage, providerSearch)
                }
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                disabled={providersLoading}
              >
                <RefreshCcw size={16} /> Refresh
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

          {providersError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {providersError}
            </div>
          )}

          {providersLoading ? (
            <div className="text-gray-600">Loading pending providers...</div>
          ) : pendingProviders.length === 0 ? (
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
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Rating
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingProviders.map((p) => {
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
                          {(p as any).provider_profile?.rating_avg > 0 ? (
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-400">★</span>
                              <span className="font-semibold text-gray-900">
                                {Number(
                                  (p as any).provider_profile?.rating_avg || 0,
                                ).toFixed(1)}
                              </span>
                              <span className="text-xs text-gray-500">
                                (
                                {(p as any).provider_profile?.rating_count || 0}
                                )
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              No reviews
                            </span>
                          )}
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
                              <CheckCircle2 size={16} /> Approve
                            </button>
                            <button
                              onClick={() =>
                                void updateProviderStatus(p._id, "rejected")
                              }
                              disabled={busy}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                            >
                              <XCircle size={16} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pagination
                page={providerPage}
                totalPages={providerTotalPages}
                onPageChange={(p) => setProviderPage(p)}
              />
            </div>
          )}
        </motion.div>

        {/* ── Monthly Bookings Chart ── */}
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

        {/* ── Deactivated Accounts ── */}
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
                Users who deactivated their accounts.{" "}
                <span className="text-gray-400 text-xs">
                  ({deactivatedTotal} total)
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  void loadDeactivatedUsers(deactivatedPage, deactivatedSearch)
                }
                disabled={deactivatedLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <RefreshCcw size={16} /> Refresh
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
          ) : deactivatedUsers.length === 0 ? (
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
                  {deactivatedUsers.map((u) => {
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
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${u.role === "provider" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}
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
              <Pagination
                page={deactivatedPage}
                totalPages={deactivatedTotalPages}
                onPageChange={(p) => setDeactivatedPage(p)}
              />
            </div>
          )}
        </motion.div>

        {/* ── Service Categories ── */}
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
                Manage categories that providers use when creating services.{" "}
                <span className="text-gray-400 text-xs">
                  ({catTotal} total)
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void loadCategories(catPage, catSearch)}
                disabled={catLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <RefreshCcw size={16} /> Refresh
              </button>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {catError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {catError}
            </div>
          )}

          <div className="space-y-3 mb-6">
            <div className="flex gap-3">
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
                className="w-36 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">
                  Min $
                </span>
                <input
                  type="number"
                  placeholder="0"
                  value={newCatMinPrice}
                  onChange={(e) => setNewCatMinPrice(e.target.value)}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">
                  Max $
                </span>
                <input
                  type="number"
                  placeholder="9999"
                  value={newCatMaxPrice}
                  onChange={(e) => setNewCatMaxPrice(e.target.value)}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
              <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2">
                <span className="text-sm font-semibold text-gray-700">
                  Allow:
                </span>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCatAllowFixed}
                    onChange={(e) => setNewCatAllowFixed(e.target.checked)}
                    className="rounded"
                  />
                  💰 Fixed
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCatAllowHourly}
                    onChange={(e) => setNewCatAllowHourly(e.target.checked)}
                    className="rounded"
                  />
                  ⏱️ Hourly
                </label>
              </div>
              <button
                onClick={() => void createCategory()}
                disabled={catSaving}
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {catSaving ? "Adding..." : "+ Add Category"}
              </button>
            </div>
          </div>

          {catLoading ? (
            <div className="text-gray-600">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-gray-500 py-8 text-center">
              No categories yet.
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
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Price Range
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Pricing Types
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Status
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
                      <td className="py-3 px-4 text-sm text-gray-600">
                        ${cat.min_price ?? 0} — ${cat.max_price ?? 9999}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 flex-wrap">
                          {(
                            cat.allowed_pricing_types || ["fixed", "hourly"]
                          ).map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-semibold"
                            >
                              {t === "hourly" ? "⏱️ Hourly" : "💰 Fixed"}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cat.is_active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                        >
                          {cat.is_active !== false ? "Active" : "Disabled"}
                        </span>
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
                                onClick={() => void toggleCategory(cat._id)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${cat.is_active !== false ? "border border-red-200 text-red-600 hover:bg-red-50" : "border border-green-200 text-green-600 hover:bg-green-50"}`}
                              >
                                {cat.is_active !== false ? "Disable" : "Enable"}
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
              <Pagination
                page={catPage}
                totalPages={catTotalPages}
                onPageChange={(p) => setCatPage(p)}
              />
            </div>
          )}
        </motion.div>

        {/* ── Services Management ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="bg-white rounded-xl p-6 border border-gray-200 mb-8"
        >
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Services Management
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Enable or disable services created by providers.{" "}
                <span className="text-gray-400 text-xs">
                  ({servicesTotal} total)
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  void loadAllServices(servicesPage, serviceSearch)
                }
                disabled={servicesLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <RefreshCcw size={16} /> Refresh
              </button>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {servicesError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {servicesError}
            </div>
          )}

          {servicesLoading ? (
            <div className="text-gray-600">Loading services...</div>
          ) : allServices.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No services found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Service
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Provider
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Category
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Price
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
                  {allServices.map((s) => (
                    <tr
                      key={s._id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {s.service_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {s.description || "—"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        <div>{s.provider_id?.full_name || "—"}</div>
                        <div className="text-xs text-gray-500">
                          {s.provider_id?.email || ""}
                        </div>
                        {s.provider_id?.provider_profile?.rating_avg > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-yellow-400 text-xs">★</span>
                            <span className="text-xs font-semibold text-gray-700">
                              {Number(
                                s.provider_id?.provider_profile?.rating_avg ||
                                  0,
                              ).toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-400">
                              (
                              {s.provider_id?.provider_profile?.rating_count ||
                                0}
                              )
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {s.category_id?.category_name || "—"}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        <div className="font-semibold">
                          ${Number(s.price || 0).toFixed(2)}
                          {s.pricing_type === "hourly" ? "/hr" : " fixed"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {s.pricing_type === "hourly"
                            ? "⏱️ Hourly"
                            : "💰 Fixed"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${s.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                        >
                          {s.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end">
                          <button
                            onClick={() => void toggleService(s._id)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${s.is_active ? "border border-red-200 text-red-600 hover:bg-red-50" : "border border-green-200 text-green-600 hover:bg-green-50"}`}
                          >
                            {s.is_active ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                page={servicesPage}
                totalPages={servicesTotalPages}
                onPageChange={(p) => setServicesPage(p)}
              />
            </div>
          )}
        </motion.div>

        {/* ── Customer Reviews ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="bg-white rounded-xl p-6 border border-gray-200 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Customer Reviews & Feedback
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage all customer reviews.{" "}
                <span className="text-gray-400 text-xs">
                  ({reviewsTotal} total)
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void loadReviews(reviewsPage, reviewsSearch)}
                disabled={reviewsLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <RefreshCcw size={16} /> Refresh
              </button>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={reviewsSearch}
                  onChange={(e) => setReviewsSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {reviewsError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {reviewsError}
            </div>
          )}

          {reviewsLoading ? (
            <div className="text-gray-600">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No reviews yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Customer
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Provider
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Rating
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Comment
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr
                      key={r._id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {r.customer_id?.full_name || "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {r.customer_id?.email || ""}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {r.provider_id?.full_name || "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {r.provider_id?.email || ""}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span
                              key={s}
                              className={
                                s <= r.rating
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {r.rating}/5
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
                        {r.comment || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${r.is_visible ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                        >
                          {r.is_visible ? "Visible" : "Hidden"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => void toggleReview(r._id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${r.is_visible ? "border border-orange-200 text-orange-600 hover:bg-orange-50" : "border border-green-200 text-green-600 hover:bg-green-50"}`}
                          >
                            {r.is_visible ? "Hide" : "Show"}
                          </button>
                          <button
                            onClick={() => void deleteReview(r._id)}
                            className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                page={reviewsPage}
                totalPages={reviewsTotalPages}
                onPageChange={(p) => setReviewsPage(p)}
              />
            </div>
          )}
        </motion.div>

        {/* ── Service Issues / Refund Requests ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          className="bg-white rounded-xl p-6 border border-gray-200 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Refund Requests
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Only issues where customer requested a refund appear here.
                {issues.filter(
                  (i) => i.refund_requested && i.status !== "resolved",
                ).length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                    💰{" "}
                    {
                      issues.filter(
                        (i) => i.refund_requested && i.status !== "resolved",
                      ).length
                    }{" "}
                    pending
                  </span>
                )}
              </p>
              {issues.filter(
                (i) => i.refund_requested && i.status !== "resolved",
              ).length > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                  💰{" "}
                  {
                    issues.filter(
                      (i) => i.refund_requested && i.status !== "resolved",
                    ).length
                  }{" "}
                  refund requested
                </span>
              )}
              {issues.filter((i) => i.status === "open" && !i.refund_requested)
                .length > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                  🔴{" "}
                  {
                    issues.filter(
                      (i) => i.status === "open" && !i.refund_requested,
                    ).length
                  }{" "}
                  open
                </span>
              )}
            </div>
            <button
              onClick={() => void loadIssues()}
              disabled={issuesLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <RefreshCcw size={16} /> Refresh
            </button>
          </div>

          {issuesError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {issuesError}
            </div>
          )}

          {issuesLoading ? (
            <div className="text-gray-600">Loading issues...</div>
          ) : adminIssues.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              🎉 No issues reported yet!
            </div>
          ) : (
            <div className="space-y-4">
              {adminIssues.map((issue) => (
                <div
                  key={issue._id}
                  className={`rounded-xl border p-5 ${
                    issue.status === "open"
                      ? "border-red-200 bg-red-50"
                      : issue.status === "in_review"
                        ? "border-yellow-200 bg-yellow-50"
                        : issue.status === "resolved"
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                      ⚠️ {issue.issue_type?.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        issue.status === "open"
                          ? "bg-red-200 text-red-800"
                          : issue.status === "in_review"
                            ? "bg-yellow-200 text-yellow-800"
                            : issue.status === "resolved"
                              ? "bg-green-200 text-green-800"
                              : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {issue.status?.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <div className="font-semibold text-gray-500 text-xs mb-1">
                        CUSTOMER
                      </div>
                      <div className="text-gray-900 font-medium">
                        {issue.customer_id?.full_name || "—"}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {issue.customer_id?.email || ""}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-500 text-xs mb-1">
                        PROVIDER
                      </div>
                      <div className="text-gray-900 font-medium">
                        {issue.provider_id?.full_name || "—"}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {issue.provider_id?.email || ""}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-3 flex gap-4 flex-wrap">
                    <span>🔧 {issue.service_id?.service_name || "—"}</span>
                    <span>📅 {issue.booking_id?.date || "—"}</span>
                    <span>⏰ {issue.booking_id?.time || "—"}</span>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3">
                    <div className="text-xs font-bold text-gray-500 mb-1">
                      CUSTOMER COMPLAINT:
                    </div>
                    <div className="text-sm text-gray-800">
                      "{issue.description}"
                    </div>
                  </div>

                  {issue.provider_response ? (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 mb-3">
                      <div className="text-xs font-bold text-blue-600 mb-1">
                        PROVIDER RESPONSE:
                      </div>
                      <div className="text-sm text-blue-800">
                        "{issue.provider_response}"
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 mb-3">
                      ⏳ Provider has not responded yet
                    </div>
                  )}

                  {issue.status === "resolved" && issue.resolution_note && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100 mb-3">
                      <div className="text-xs font-bold text-green-700 mb-1">
                        RESOLUTION:
                      </div>
                      {issue.resolution_type === "refund" && (
                        <div className="text-sm font-bold text-green-800 mb-1">
                          💰 Refund: ${issue.resolution_amount}
                        </div>
                      )}
                      {issue.resolution_type === "extra_charge" && (
                        <div className="text-sm font-bold text-orange-800 mb-1">
                          💳 Extra charge: ${issue.resolution_amount}
                        </div>
                      )}
                      <div className="text-sm text-green-700">
                        {issue.resolution_note}
                      </div>
                    </div>
                  )}

                  {issue.status !== "resolved" && issue.status !== "closed" && (
                    <AdminIssueActions
                      issue={issue}
                      onUpdate={() => void loadIssues()}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Recent Transactions ── */}
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
