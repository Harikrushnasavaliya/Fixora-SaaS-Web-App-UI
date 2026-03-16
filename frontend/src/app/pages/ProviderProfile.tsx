import React, { JSX, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  MapPin,
  Clock,
  ShieldCheck,
  Star,
  Award,
  Calendar,
} from "lucide-react";

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) || "http://localhost:5001";

type ProviderStatus = "draft" | "pending" | "verified" | "rejected";

type ProviderProfile = {
  phone?: string;
  photo_url?: string;
  ssn_last4?: string;
  is_available?: boolean;
  title?: string;
  bio?: string;
  experience_years?: number;
  rating_avg?: number;
  total_reviews?: number;
};

type ProviderUser = {
  _id: string;
  full_name?: string;
  email?: string;
  role: "provider";
  provider_status?: ProviderStatus;
  is_profile_complete?: boolean;
  provider_profile?: ProviderProfile;
};

type Category = {
  _id: string;
  category_name?: string;
  name?: string;
  icon?: string;
};

type Service = {
  _id: string;
  service_name: string;
  description?: string;
  price?: number;
  is_active?: boolean;
  category_id?: Category | string;
  provider_id?: ProviderUser | string;
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

function initials(name?: string) {
  const v = (name || "").trim();
  if (!v) return "PR";
  const parts = v.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

function formatMoney(n?: number) {
  const val = Number(n || 0);
  return `$${val.toFixed(0)}`;
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const TIME_SLOTS = ["10:00", "13:00", "15:00", "17:00"];

export default function ProviderProfile(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<ProviderUser | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState("");

  const [date, setDate] = useState<string>(addDaysISO(1));
  const [time, setTime] = useState<string>(TIME_SLOTS[0]);
  const [address, setAddress] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);

  const verified = provider?.provider_status === "verified";
  const available = !!provider?.provider_profile?.is_available;
  const rating = Number(provider?.provider_profile?.rating_avg || 0);
  const reviews = Number(provider?.provider_profile?.total_reviews || 0);
  const experience = Number(provider?.provider_profile?.experience_years || 0);

  const activeServices = useMemo(
    () => services.filter((s) => s.is_active !== false),
    [services],
  );

  const minPrice = useMemo(() => {
    const prices = activeServices.map((s) => Number(s.price || 0));
    if (!prices.length) return 0;
    return Math.min(...prices);
  }, [activeServices]);

  async function load(): Promise<void> {
    setError("");
    setLoading(true);
    try {
      if (!id) throw new Error("Provider id missing");

      // You may already have an endpoint /api/provider/:id
      // If you don't, this fallback will still work if your Service listing populates provider_id.
      // We’ll first load all services, then extract provider from one of them.

      const all = await apiFetch<{ services: Service[] }>("/api/services");
      const allServices = all.services || [];

      const providerServices = allServices.filter((s) => {
        const p = s.provider_id as any;
        const pid =
          typeof p === "object" && p ? String(p._id) : String(p || "");
        return pid === String(id);
      });

      if (!providerServices.length) {
        throw new Error("Provider not found or not visible yet.");
      }

      const pObj = providerServices[0].provider_id as any;
      if (typeof pObj !== "object" || !pObj) {
        throw new Error("Provider data missing");
      }

      setProvider(pObj as ProviderUser);
      setServices(providerServices);

      if (providerServices.length)
        setSelectedServiceId(providerServices[0]._id);
    } catch (e: any) {
      setError(e?.message || "Failed to load provider");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function bookNow(): Promise<void> {
    setError("");

    if (!provider?._id) {
      setError("Provider not found");
      return;
    }
    if (!verified) {
      setError("This provider is not verified yet.");
      return;
    }
    if (!available) {
      setError("This provider is not available right now.");
      return;
    }
    if (!selectedServiceId) {
      setError("Please select a service.");
      return;
    }
    if (!address.trim()) {
      setError("Please enter your address.");
      return;
    }
    if (date <= todayISO()) {
      setError("Please select a future date.");
      return;
    }

    setBookingLoading(true);
    try {
      await apiFetch<{ message: string; booking: any }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          provider_id: provider._id,
          service_id: selectedServiceId,
          date,
          time,
          address: address.trim(),
          notes: notes.trim(),
        }),
      });

      navigate("/customer/dashboard");
    } catch (e: any) {
      setError(e?.message || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-40 bg-white border border-gray-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 h-80 bg-white border border-gray-200 rounded-2xl animate-pulse" />
          <div className="h-80 bg-white border border-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          {error || "Provider not found"}
        </div>
      </div>
    );
  }

  const title = provider.provider_profile?.title || "Service Professional";
  const bio =
    provider.provider_profile?.bio ||
    "Professional service provider. Complete profile details will appear here.";
  const chips = activeServices.slice(0, 8);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error ? (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
            {error}
          </div>
        ) : null}

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-28 h-28 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center text-4xl font-extrabold">
              {initials(provider.full_name)}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-extrabold text-gray-900">
                  {provider.full_name || "Provider"}
                </h1>

                {verified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    <BadgeCheck size={14} />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100">
                    Pending
                  </span>
                )}
              </div>

              <div className="text-gray-600 mt-1">{title}</div>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-700">
                <div className="inline-flex items-center gap-1">
                  <Star size={16} className="text-yellow-500" />
                  <span className="font-semibold">{rating || 0}</span>
                  <span className="text-gray-500">({reviews} reviews)</span>
                </div>

                <div className="inline-flex items-center gap-2 text-gray-600">
                  <MapPin size={16} />
                  <span>2.3 km away</span>
                </div>

                <div className="inline-flex items-center gap-2 text-gray-600">
                  <Award size={16} />
                  <span>{experience} years experience</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 text-sm">
                  <BadgeCheck size={16} />
                  342 jobs completed
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-sm">
                  <Clock size={16} />
                  Response time: &lt; 30 min
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100 text-sm">
                  <ShieldCheck size={16} />
                  Background verified
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-xl font-extrabold text-gray-900">About</h2>
              <p className="text-gray-700 mt-3 leading-7">{bio}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-xl font-extrabold text-gray-900">
                Skills & Services
              </h2>

              {chips.length === 0 ? (
                <div className="text-gray-600 mt-3">
                  No services listed yet.
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 mt-4">
                  {chips.map((s) => (
                    <button
                      key={s._id}
                      onClick={() => setSelectedServiceId(s._id)}
                      className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${
                        selectedServiceId === s._id
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100"
                      }`}
                      type="button"
                    >
                      {s.service_name}
                    </button>
                  ))}
                </div>
              )}

              {selectedServiceId ? (
                <div className="mt-5 text-sm text-gray-700">
                  {activeServices.find((x) => x._id === selectedServiceId)
                    ?.description || ""}
                </div>
              ) : null}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-xl font-extrabold text-gray-900">
                Certifications
              </h2>
              <div className="mt-4 space-y-3">
                {[
                  "Licensed Professional",
                  "Safety Certified",
                  "Background Checked",
                ].map((c) => (
                  <div
                    key={c}
                    className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Award className="text-green-700" size={18} />
                    </div>
                    <div className="font-semibold text-gray-900">{c}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 h-fit sticky top-24">
            <div className="text-gray-600 text-sm">Starting from</div>
            <div className="flex items-end gap-1 mt-1">
              <div className="text-3xl font-extrabold text-gray-900">
                {formatMoney(minPrice)}
              </div>
              <div className="text-gray-600 pb-1">/hr</div>
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Calendar size={16} />
                Select Date
              </div>

              <select
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-2 w-full border border-blue-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
              >
                {Array.from({ length: 10 }).map((_, i) => {
                  const d = addDaysISO(i + 1);
                  return (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Clock size={16} />
                Select Time
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                {TIME_SLOTS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTime(t)}
                    type="button"
                    className={`px-3 py-3 rounded-xl border font-semibold transition ${
                      time === t
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {t === "10:00"
                      ? "10:00 AM"
                      : t === "13:00"
                        ? "01:00 PM"
                        : t === "15:00"
                          ? "03:00 PM"
                          : "05:00 PM"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <div className="text-sm font-semibold text-gray-800">Address</div>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, City, State"
                className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold text-gray-800">Notes</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes for provider"
                rows={3}
                className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>

            <button
              onClick={() => void bookNow()}
              disabled={bookingLoading || !verified || !available}
              className={`mt-6 w-full py-3 rounded-xl font-extrabold transition ${
                bookingLoading || !verified || !available
                  ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {bookingLoading ? "Booking..." : "Book Now"}
            </button>

            <div className="text-xs text-gray-500 text-center mt-2">
              You won’t be charged yet
            </div>

            {!verified ? (
              <div className="mt-4 bg-yellow-50 border border-yellow-100 text-yellow-800 text-sm rounded-xl p-3">
                Provider is not verified yet (admin must approve).
              </div>
            ) : null}

            {verified && !available ? (
              <div className="mt-4 bg-red-50 border border-red-100 text-red-800 text-sm rounded-xl p-3">
                Provider is currently unavailable.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
