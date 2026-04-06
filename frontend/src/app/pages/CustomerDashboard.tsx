import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth.store";
import { apiGet } from "../lib/api";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  DollarSign,
  Star,
  CheckCircle,
  Home,
  Heart,
  User,
  RefreshCw,
  MapPin,
} from "lucide-react";
import PaymentModal from "./PaymentModal";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "work_completed"
  | "reschedule_requested";

type Booking = {
  _id: string;
  date: string;
  time: string;
  status: BookingStatus;
  payment_status: "pending" | "paid" | "failed" | "refunded";

  address?: string;
  notes?: string;

  total_amount?: number;
  currency?: string;

  service_id?: { service_name?: string; description?: string; price?: number };
  provider_id?: {
    full_name?: string;
    email?: string;
    phone?: string;
    profile_image?: string;
  };

  reschedule?: {
    requested?: boolean;
    proposed_date?: string | null;
    proposed_time?: string | null;
    reason?: string;
    requested_by?: "provider" | "customer" | null;
    previous_status?: string | null;
    decision?: "pending" | "accepted" | "rejected" | null;
    rejection_reason?: string;
    rejection_message?: string;
  };
};

const API_BASE =
  ((import.meta as any).env?.VITE_API_BASE as string) ||
  "http://localhost:5001";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data as T;
}

type SectionTab = "overview" | "bookings" | "favorites" | "profile";
type BookingTab = "active" | "past";

export function CustomerDashboard() {
  const [sectionTab, setSectionTab] = useState<SectionTab>("overview");
  const [bookingTab, setBookingTab] = useState<BookingTab>("active");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(
    null,
  );
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [payBookingId, setPayBookingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payCurrency, setPayCurrency] = useState<string>("USD");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectBookingId, setRejectBookingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectMessage, setRejectMessage] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectError, setRejectError] = useState("");
  const rejectionOptions = [
    "I am not available at that time",
    "I need the original schedule",
    "The proposed time does not work for me",
    "Please suggest another time",
    "Other",
  ];

  const navigate = useNavigate();
  const storeUser = useAuthStore((s) => s.me);
  const clear = useAuthStore((s) => s.clear);

  const user = storeUser
    ? {
        id: storeUser._id,
        full_name: storeUser.full_name || "",
        email: storeUser.email || "",
        role: storeUser.role,
      }
    : null;

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
    clear();
    navigate("/login");
  };

  const loadBookings = async () => {
    setLoadingBookings(true);
    try {
      const data = await apiGet<{ bookings: Booking[] }>("/api/bookings/my");
      setBookings(data.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const activeBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.status === "pending" ||
          b.status === "confirmed" ||
          b.status === "work_completed" ||
          b.status === "reschedule_requested",
      ),
    [bookings],
  );

  const pastBookings = useMemo(
    () =>
      bookings.filter(
        (b) => b.status === "completed" || b.status === "cancelled",
      ),
    [bookings],
  );

  const completedBookings = useMemo(
    () => pastBookings.filter((b) => b.status === "completed"),
    [pastBookings],
  );

  const totalSpent = useMemo(
    () =>
      bookings.reduce((sum, b) => {
        const amount = Number(b.total_amount ?? 0);
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0),
    [bookings],
  );

  // const reviewsLeft = completedBookings.length;

  const favoriteProviders = useMemo(() => {
    const providerMap = new Map<
      string,
      {
        name: string;
        email?: string;
        phone?: string;
        count: number;
      }
    >();

    completedBookings.forEach((b) => {
      const name = b.provider_id?.full_name || "Provider";
      const key = `${name}-${b.provider_id?.email || ""}`;
      const existing = providerMap.get(key);

      if (existing) {
        existing.count += 1;
      } else {
        providerMap.set(key, {
          name,
          email: b.provider_id?.email,
          phone: b.provider_id?.phone,
          count: 1,
        });
      }
    });

    return Array.from(providerMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [completedBookings]);

  const cancelBooking = async (id: string) => {
    if (!confirm("Cancel this booking?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/bookings/${id}/cancel`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Cancel failed");

      await loadBookings();
    } catch (e: any) {
      alert(e.message || "Cancel failed");
    }
  };

  const initials = (name?: string) => {
    const base = (name || "P").trim();
    return base
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const statusBadge = (status: BookingStatus) => {
    if (status === "confirmed") return "bg-green-100 text-green-700";
    if (status === "pending") return "bg-yellow-100 text-yellow-700";
    if (status === "work_completed") return "bg-blue-100 text-blue-700";
    if (status === "reschedule_requested")
      return "bg-purple-100 text-purple-700";
    if (status === "completed") return "bg-gray-100 text-gray-700";
    return "bg-red-100 text-red-700";
  };

  function openPay(booking: Booking) {
    setPayBookingId(booking._id);
    const amt = Number(booking.total_amount ?? 0);
    setPayAmount(Number.isFinite(amt) ? amt : 0);
    setPayCurrency(booking.currency || "USD");
    setPayOpen(true);
  }

  function openRescheduleModal(bookingId: string) {
    setRescheduleError("");
    setRescheduleBookingId(bookingId);
    setNewDate("");
    setNewTime("");
    setRescheduleOpen(true);
  }

  function closeRescheduleModal() {
    setRescheduleOpen(false);
    setRescheduleBookingId(null);
    setNewDate("");
    setNewTime("");
    setRescheduleError("");
  }

  async function approveRescheduleRequest(bookingId: string) {
    try {
      await apiFetch(`/api/bookings/${bookingId}/reschedule/approve`, {
        method: "PATCH",
      });
      await loadBookings();
    } catch (e: any) {
      alert(e?.message || "Failed to approve reschedule");
    }
  }

  // async function rejectRescheduleRequest(bookingId: string) {
  //   try {
  //     await apiFetch(`/api/bookings/${bookingId}/reschedule/reject`, {
  //       method: "PATCH",
  //     });
  //     await loadBookings();
  //   } catch (e: any) {
  //     alert(e?.message || "Failed to reject reschedule");
  //   }
  // }

  function openRejectRescheduleModal(bookingId: string) {
    console.log("openRejectRescheduleModal clicked", bookingId);
    setRejectBookingId(bookingId);
    setRejectReason("");
    setRejectMessage("");
    setRejectError("");
    setRejectModalOpen(true);
  }

  function closeRejectRescheduleModal() {
    setRejectModalOpen(false);
    setRejectBookingId(null);
    setRejectReason("");
    setRejectMessage("");
    setRejectError("");
  }

  async function submitRejectReschedule() {
    if (!rejectBookingId) return;

    if (!rejectReason) {
      setRejectError("Please select a reason.");
      return;
    }

    if (rejectReason === "Other" && !rejectMessage.trim()) {
      setRejectError("Please enter your message.");
      return;
    }

    try {
      setRejectLoading(true);
      setRejectError("");

      await apiFetch(`/api/bookings/${rejectBookingId}/reschedule/reject`, {
        method: "PATCH",
        body: JSON.stringify({
          rejection_reason: rejectReason,
          rejection_message: rejectMessage,
        }),
      });

      closeRejectRescheduleModal();
      await loadBookings();
    } catch (e: any) {
      setRejectError(e?.message || "Failed to reject reschedule");
    } finally {
      setRejectLoading(false);
    }
  }

  async function submitReschedule() {
    if (!rescheduleBookingId) return;

    if (!newDate || !newTime) {
      setRescheduleError("Please select both date and time.");
      return;
    }

    setRescheduleLoading(true);
    setRescheduleError("");

    try {
      await apiFetch<{ message?: string }>(
        `/api/bookings/${rescheduleBookingId}/reschedule`,
        {
          method: "PATCH",
          body: JSON.stringify({ date: newDate, time: newTime }),
        },
      );

      closeRescheduleModal();
      await loadBookings();
    } catch (e: any) {
      setRescheduleError(e?.message || "Reschedule failed");
    } finally {
      setRescheduleLoading(false);
    }
  }

  const renderActionButtons = (booking: Booking) => (
    <div className="mt-4 flex flex-wrap gap-3">
      {booking.status === "reschedule_requested" &&
        booking.reschedule?.requested_by === "provider" && (
          <>
            <button
              onClick={() => approveRescheduleRequest(booking._id)}
              className="rounded-xl bg-[#2563EB] px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700"
            >
              Accept Reschedule
            </button>

            <button
              onClick={() => openRejectRescheduleModal(booking._id)}
              className="rounded-xl border border-red-300 px-4 py-2.5 font-semibold text-red-700 transition hover:bg-red-50"
            >
              Reject Reschedule
            </button>
          </>
        )}

      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeRejectRescheduleModal}
          />

          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Reject Reschedule
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Tell the provider why you are rejecting this request.
                </p>
              </div>
              <button
                onClick={closeRejectRescheduleModal}
                className="rounded-lg border border-gray-200 px-3 py-1 hover:bg-gray-50"
              >
                ✕
              </button>
            </div>

            {rejectError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {rejectError}
              </div>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Reason
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="">Select reason</option>
                  {rejectionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Message {rejectReason === "Other" ? "*" : "(optional)"}
                </label>
                <textarea
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                  rows={4}
                  placeholder="Write your message to provider"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeRejectRescheduleModal}
                disabled={rejectLoading}
                className="rounded-xl border border-gray-200 px-5 py-3 font-semibold hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                onClick={submitRejectReschedule}
                disabled={rejectLoading}
                className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {rejectLoading ? "Sending..." : "Send Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {booking.status === "reschedule_requested" &&
        booking.reschedule?.requested_by === "customer" && (
          <span className="rounded-xl bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700">
            Waiting for provider approval
          </span>
        )}

      {booking.reschedule?.decision === "rejected" && (
        <span className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
          Reschedule rejected. Original booking remains active.
        </span>
      )}

      {(booking.status === "pending" || booking.status === "confirmed") &&
        booking.reschedule?.decision !== "rejected" && (
          <>
            <button
              onClick={() => openRescheduleModal(booking._id)}
              className="rounded-xl border border-gray-300 px-4 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Reschedule
            </button>

            <button
              onClick={() => cancelBooking(booking._id)}
              className="rounded-xl border border-red-300 px-4 py-2.5 font-semibold text-red-700 transition hover:bg-red-50"
            >
              Cancel
            </button>
          </>
        )}

      {booking.status === "work_completed" &&
        booking.payment_status !== "paid" && (
          <button
            onClick={() => openPay(booking)}
            className="rounded-xl border border-blue-300 px-4 py-2.5 font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            Pay Now
          </button>
        )}

      {(booking.status === "completed" ||
        booking.status === "work_completed") && (
        <button
          onClick={() => {
            setSelectedBooking(booking._id);
            setShowReviewModal(true);
          }}
          className="rounded-xl bg-[#2563EB] px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700"
        >
          Leave Review
        </button>
      )}
    </div>
  );

  const renderBookingCard = (booking: Booking, muted = false) => (
    <div
      key={booking._id}
      className={`rounded-3xl border border-gray-200 bg-white p-5 shadow-sm ${
        muted ? "" : "hover:border-[#2563EB]"
      } transition`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-1 gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-bold ${
              muted ? "bg-gray-300 text-gray-700" : "bg-[#2563EB] text-white"
            }`}
          >
            {initials(booking.provider_id?.full_name)}
          </div>

          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {booking.provider_id?.full_name || "Provider"}
                </h3>
                <p className="text-sm text-gray-600">
                  {booking.service_id?.service_name || "Service"}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${statusBadge(
                  booking.status,
                )}`}
              >
                {booking.status === "reschedule_requested"
                  ? "Reschedule Pending"
                  : booking.status.charAt(0).toUpperCase() +
                    booking.status.slice(1)}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <Calendar size={16} />
                <span>{booking.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={16} />
                <span>{booking.time}</span>
              </div>
              {booking.address ? (
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} />
                  <span>{booking.address}</span>
                </div>
              ) : null}
            </div>
            {booking.status === "reschedule_requested" &&
              booking.reschedule?.requested_by === "provider" && (
                <div className="mt-4 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-800">
                  <div className="font-semibold">
                    Provider requested a new time:
                    <span className="ml-2 font-bold">
                      {booking.reschedule?.proposed_date || "—"}{" "}
                      {booking.reschedule?.proposed_time
                        ? `at ${booking.reschedule.proposed_time}`
                        : ""}
                    </span>
                  </div>

                  {booking.reschedule?.reason ? (
                    <div className="mt-1">
                      <span className="font-semibold">Note:</span>{" "}
                      {booking.reschedule.reason}
                    </div>
                  ) : null}
                </div>
              )}

            {booking.notes ? (
              <p className="mt-3 text-sm text-gray-500">{booking.notes}</p>
            ) : null}

            {renderActionButtons(booking)}
          </div>
        </div>

        <div className="min-w-[120px] text-left lg:text-right">
          <div className="text-3xl font-bold text-gray-900">
            ${Number(booking.total_amount ?? 0).toFixed(0)}
          </div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">
            {booking.payment_status}
          </div>
        </div>
      </div>
    </div>
  );

  const activeOverviewBookings = activeBookings.slice(0, 2);

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="flex flex-col justify-between border-r border-gray-200 bg-white px-4 py-6">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Link to="/" className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3156d3] text-2xl font-bold text-white">
                  F
                </div>
                <div>
                  <div className="text-[18px] font-bold text-gray-900">
                    Fixora
                  </div>
                  <div className="text-sm text-gray-500">Customer Portal</div>
                </div>
              </Link>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-[#f4f7ff] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3156d3] text-lg font-bold text-white">
                  {initials(user?.full_name || "C")}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[18px] font-bold text-gray-900">
                    {user?.full_name || "Customer"}
                  </div>
                  <div className="truncate text-sm text-gray-500">
                    Premium Member
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">Active Bookings</div>
                  <div className="font-bold text-gray-900">
                    {activeBookings.length}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Total Spent</div>
                  <div className="font-bold text-gray-900">
                    ${totalSpent.toFixed(0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <button
                onClick={() => setSectionTab("overview")}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold transition ${
                  sectionTab === "overview"
                    ? "bg-gradient-to-r from-[#2448d8] to-[#4b6ef3] text-white shadow-lg shadow-blue-100"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Home size={18} />
                Overview
              </button>

              <button
                onClick={() => setSectionTab("bookings")}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold transition ${
                  sectionTab === "bookings"
                    ? "bg-gradient-to-r from-[#2448d8] to-[#4b6ef3] text-white shadow-lg shadow-blue-100"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Calendar size={18} />
                My Bookings
              </button>

              <button
                onClick={() => setSectionTab("favorites")}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold transition ${
                  sectionTab === "favorites"
                    ? "bg-gradient-to-r from-[#2448d8] to-[#4b6ef3] text-white shadow-lg shadow-blue-100"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Heart size={18} />
                Favorites
              </button>

              <button
                onClick={() => setSectionTab("profile")}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold transition ${
                  sectionTab === "profile"
                    ? "bg-gradient-to-r from-[#2448d8] to-[#4b6ef3] text-white shadow-lg shadow-blue-100"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <User size={18} />
                Profile
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              to="/services"
              className="block rounded-2xl bg-[#57c265] px-4 py-3 text-center font-semibold text-white transition hover:bg-green-600"
            >
              + Book New Service
            </Link>

            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold text-red-600 transition hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="w-full min-w-0 p-5 lg:p-6">
          {sectionTab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
                <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#3156d3] text-xl font-bold text-white">
                      {initials(user?.full_name || "C")}
                    </div>
                    <div>
                      <div className="text-[26px] font-bold leading-tight text-gray-900">
                        {user?.full_name || "Customer"}
                      </div>
                      <div className="text-sm text-gray-500">
                        Premium Member
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">
                        Active Bookings
                      </div>
                      <div className="text-3xl font-bold text-gray-900">
                        {activeBookings.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Total Spent</div>
                      <div className="text-3xl font-bold text-gray-900">
                        ${totalSpent.toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100">
                      <Calendar className="text-blue-600" size={22} />
                    </div>
                    <div className="text-sm text-gray-500">Active Bookings</div>
                    <div className="mt-2 text-4xl font-bold text-gray-900">
                      {activeBookings.length}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
                      <CheckCircle className="text-green-600" size={22} />
                    </div>
                    <div className="text-sm text-gray-500">Completed</div>
                    <div className="mt-2 text-4xl font-bold text-gray-900">
                      {completedBookings.length}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100">
                      <DollarSign className="text-purple-600" size={22} />
                    </div>
                    <div className="text-sm text-gray-500">Total Spent</div>
                    <div className="mt-2 text-4xl font-bold text-gray-900">
                      ${totalSpent.toFixed(0)}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100">
                      <Heart className="text-orange-600" size={22} />
                    </div>
                    <div className="text-sm text-gray-500">Favorites</div>
                    <div className="mt-2 text-4xl font-bold text-gray-900">
                      {favoriteProviders.length}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      Active Bookings
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Your upcoming and in-progress bookings
                    </div>
                  </div>
                  <button
                    onClick={loadBookings}
                    className="flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <RefreshCw size={16} />
                    Refresh
                  </button>
                </div>

                {loadingBookings ? (
                  <p className="text-gray-600">Loading bookings...</p>
                ) : activeOverviewBookings.length === 0 ? (
                  <div className="py-10 text-center">
                    <Calendar
                      size={48}
                      className="mx-auto mb-4 text-gray-300"
                    />
                    <p className="mb-4 text-gray-600">No active bookings</p>
                    <Link
                      to="/services"
                      className="inline-block rounded-xl bg-[#2563EB] px-6 py-3 text-white transition hover:bg-blue-700"
                    >
                      Book a Service
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeOverviewBookings.map((booking) =>
                      renderBookingCard(booking),
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5 text-2xl font-bold text-gray-900">
                  Your Favorite Providers
                </div>

                {favoriteProviders.length === 0 ? (
                  <p className="text-gray-500">
                    Complete some bookings to see your favorite providers here.
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {favoriteProviders.map((provider, index) => (
                      <div
                        key={`${provider.name}-${index}`}
                        className="rounded-3xl border border-gray-200 p-6 text-center"
                      >
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#3156d3] text-xl font-bold text-white">
                          {initials(provider.name)}
                        </div>
                        <div className="mt-4 text-xl font-bold text-gray-900">
                          {provider.name}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Repeat bookings: {provider.count}
                        </div>
                        <div className="mt-3 text-sm font-semibold text-yellow-500">
                          ★ 4.8
                        </div>
                        <Link
                          to="/services"
                          className="mt-4 inline-block text-sm font-semibold text-[#2563EB]"
                        >
                          Book Again
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {sectionTab === "bookings" && (
            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-5">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    My Bookings
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage your active and past bookings
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setBookingTab("active")}
                    className={`rounded-2xl px-5 py-3 font-semibold transition ${
                      bookingTab === "active"
                        ? "bg-[#2563EB] text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Active ({activeBookings.length})
                  </button>
                  <button
                    onClick={() => setBookingTab("past")}
                    className={`rounded-2xl px-5 py-3 font-semibold transition ${
                      bookingTab === "past"
                        ? "bg-[#2563EB] text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Past ({pastBookings.length})
                  </button>
                </div>
              </div>

              <div className="p-6">
                {loadingBookings ? (
                  <p className="text-gray-600">Loading bookings...</p>
                ) : bookingTab === "active" ? (
                  activeBookings.length === 0 ? (
                    <div className="py-12 text-center">
                      <Calendar
                        size={48}
                        className="mx-auto mb-4 text-gray-300"
                      />
                      <p className="mb-4 text-gray-600">No active bookings</p>
                      <Link
                        to="/services"
                        className="inline-block rounded-xl bg-[#2563EB] px-6 py-3 text-white transition hover:bg-blue-700"
                      >
                        Book a Service
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeBookings.map((booking) =>
                        renderBookingCard(booking),
                      )}
                    </div>
                  )
                ) : pastBookings.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    No past bookings yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastBookings.map((booking) =>
                      renderBookingCard(booking, true),
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {sectionTab === "favorites" && (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-gray-900">Favorites</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Providers you booked most often
                </p>
              </div>

              {favoriteProviders.length === 0 ? (
                <div className="py-12 text-center">
                  <Heart size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">
                    No favorite providers yet. Book and complete services first.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {favoriteProviders.map((provider, index) => (
                    <div
                      key={`${provider.name}-${index}`}
                      className="rounded-3xl border border-gray-200 p-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#3156d3] text-xl font-bold text-white">
                          {initials(provider.name)}
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">
                            {provider.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Repeat bookings: {provider.count}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                        <div>Email: {provider.email || "N/A"}</div>
                        <div className="mt-1">
                          Phone: {provider.phone || "N/A"}
                        </div>
                      </div>

                      <Link
                        to="/services"
                        className="mt-4 inline-block rounded-xl bg-[#2563EB] px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700"
                      >
                        Book Again
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {sectionTab === "profile" && (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Your account information
                </p>
              </div>

              <div className="mx-auto max-w-3xl">
                <div className="mb-8 text-center">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#3156d3] text-4xl font-bold text-white">
                    {initials(user?.full_name || "C")}
                  </div>
                  <div className="mt-4 text-3xl font-bold text-gray-900">
                    {user?.full_name || "Customer"}
                  </div>
                  <div className="mt-2 text-gray-500">{user?.email || "—"}</div>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-700">
                    <Star size={16} fill="currentColor" />
                    Premium Member
                  </div>
                </div>

                <div className="grid gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Full Name
                    </label>
                    <input
                      value={user?.full_name || ""}
                      readOnly
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Email
                    </label>
                    <input
                      value={user?.email || ""}
                      readOnly
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Role
                    </label>
                    <input
                      value={user?.role || "customer"}
                      readOnly
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3 capitalize focus:outline-none"
                    />
                  </div>

                  <button className="mt-2 rounded-2xl bg-[#2563EB] px-6 py-3 font-semibold text-white transition hover:bg-blue-700">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <PaymentModal
        open={payOpen}
        bookingId={payBookingId}
        amount={payAmount}
        currency={payCurrency}
        onClose={() => setPayOpen(false)}
        onSuccess={async () => {
          await loadBookings();
        }}
      />

      {showReviewModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900">Leave Review</h3>
            <p className="mt-2 text-sm text-gray-500">
              Review modal integration can be connected here.
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Selected booking: {selectedBooking}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedBooking(null);
                }}
                className="rounded-xl border border-gray-200 px-4 py-2 font-semibold hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {rescheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeRescheduleModal}
          />

          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Reschedule Booking
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Choose a new date & time.
                </p>
              </div>
              <button
                onClick={closeRescheduleModal}
                className="rounded-lg border border-gray-200 px-3 py-1 hover:bg-gray-50"
              >
                ✕
              </button>
            </div>

            {rescheduleError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {rescheduleError}
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  New Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  New Time
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeRescheduleModal}
                disabled={rescheduleLoading}
                className="rounded-xl border border-gray-200 px-5 py-3 font-semibold hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                onClick={submitReschedule}
                disabled={rescheduleLoading}
                className="rounded-xl bg-[#2563EB] px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {rescheduleLoading ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
