import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../lib/api";
import { Link } from "react-router-dom";
import { Calendar, Clock, DollarSign, Star, CheckCircle } from "lucide-react";
import PaymentModal from "./PaymentModal";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

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

  service_id?: { service_name?: string; description?: string };
  provider_id?: {
    full_name?: string;
    email?: string;
    phone?: string;
    profile_image?: string;
  };
};

type User = { id: string; full_name: string; email: string; role: string };

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) || "http://localhost:5001";

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

export function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);

  const [user, setUser] = useState<User | null>(null);
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

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet<{ user: User }>("/api/auth/me");
        setUser(data.user);
      } catch {
        setUser(null);
      }
    })();
  }, []);

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
        (b) => b.status === "pending" || b.status === "confirmed",
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

  const totalSpent = 0;

  const reviewsLeft = pastBookings.filter(
    (b) => b.status === "completed",
  ).length;

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your bookings and service history
            {user?.full_name ? `, ${user.full_name}` : ""}
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">Active Bookings</h3>
              <Calendar className="text-blue-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {activeBookings.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">Completed</h3>
              <CheckCircle className="text-green-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {pastBookings.filter((b) => b.status === "completed").length}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">Total Spent</h3>
              <DollarSign className="text-purple-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">${totalSpent}</p>
            <p className="text-xs text-gray-500 mt-1">
              (Add amount later in Booking model)
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">Reviews Left</h3>
              <Star className="text-yellow-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{reviewsLeft}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md mb-8">
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

          {activeTab === "active" && (
            <div className="p-6">
              {loadingBookings ? (
                <p className="text-gray-600">Loading bookings...</p>
              ) : activeBookings.length === 0 ? (
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
                      key={booking._id}
                      className="border border-gray-200 rounded-xl p-4 hover:border-[#2563EB] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          <div className="w-14 h-14 bg-[#2563EB] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                            {initials(booking.provider_id?.full_name)}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {booking.provider_id?.full_name || "Provider"}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {booking.service_id?.service_name ||
                                    "Service"}
                                </p>
                              </div>

                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge(
                                  booking.status,
                                )}`}
                              >
                                {booking.status.charAt(0).toUpperCase() +
                                  booking.status.slice(1)}
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
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => openRescheduleModal(booking._id)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Reschedule
                        </button>

                        <button
                          onClick={() => cancelBooking(booking._id)}
                          className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Cancel
                        </button>

                        {booking.status === "confirmed" &&
                          booking.payment_status !== "paid" && (
                            <button
                              onClick={() => openPay(booking)}
                              className="flex-1 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Pay Now
                            </button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "past" && (
            <div className="p-6">
              {loadingBookings ? (
                <p className="text-gray-600">Loading bookings...</p>
              ) : (
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="border border-gray-200 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-bold flex-shrink-0">
                            {initials(booking.provider_id?.full_name)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {booking.provider_id?.full_name || "Provider"}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {booking.service_id?.service_name ||
                                    "Service"}
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge(
                                  booking.status,
                                )}`}
                              >
                                {booking.status.charAt(0).toUpperCase() +
                                  booking.status.slice(1)}
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
                            </div>
                          </div>
                        </div>
                      </div>

                      {booking.status === "completed" && (
                        <button
                          onClick={() => {
                            setSelectedBooking(booking._id);
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
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Payment History
          </h2>
          <p className="text-gray-600">
            Payment module will be added in Sprint 2 (Stripe integration).
          </p>
        </div>
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

      {rescheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeRescheduleModal}
          />

          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Reschedule Booking
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Choose a new date & time.
                </p>
              </div>
              <button
                onClick={closeRescheduleModal}
                className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                ✕
              </button>
            </div>

            {rescheduleError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {rescheduleError}
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={closeRescheduleModal}
                disabled={rescheduleLoading}
                className="px-5 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 font-semibold disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                onClick={submitReschedule}
                disabled={rescheduleLoading}
                className="px-6 py-3 rounded-xl bg-[#2563EB] text-white hover:bg-blue-700 font-semibold disabled:opacity-60"
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
