import React, { JSX, useEffect, useMemo, useState } from "react";
import ProviderOnboarding from "./ProviderOnboarding";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE || "http://localhost:5001";

type Role = "provider" | "customer" | "admin";

type ProviderProfile = {
  is_available?: boolean;
  phone?: string;
  photo_url?: string;
  ssn_last4?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zip?: string;
};

type MeUser = {
  _id: string;
  full_name?: string;
  email?: string;
  role: Role;
  provider_status?: string;
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
};

type BookingStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed"
  | "reschedule_requested";

type Booking = {
  _id: string;
  status: BookingStatus;
  date?: string;
  time?: string;
  address?: string;
  notes?: string;
  service_id?: { service_name?: string; price?: number } | string;
  customer_id?: { full_name?: string; email?: string } | string;
  reschedule?: {
    requested?: boolean;
    proposed_date?: string;
    proposed_time?: string;
    reason?: string;
    requested_by?: "provider" | "customer";
    previous_status?: string;
    decision?: "pending" | "accepted" | "rejected" | null;
    rejection_reason?: string;
    rejection_message?: string;
    decision_at?: string;
  };
};

type ApiMeResponse = { user: MeUser };
type ApiCategoriesResponse = { categories: Category[] } | Category[];
type ApiMyServicesResponse = { services: Service[] };

type SidebarSection =
  | "dashboard"
  | "requests"
  | "earnings"
  | "profile"
  | "services"
  | "add";

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

function StatusPill({ status }: { status: BookingStatus }): JSX.Element {
  const map: Record<BookingStatus, { bg: string; fg: string; label: string }> =
    {
      pending: { bg: "#FEF3C7", fg: "#92400E", label: "Pending" },
      confirmed: { bg: "#ECFDF3", fg: "#027A48", label: "Confirmed" },
      rejected: { bg: "#FEF2F2", fg: "#B42318", label: "Rejected" },
      cancelled: { bg: "#F2F4F7", fg: "#475467", label: "Cancelled" },
      completed: { bg: "#EEF4FF", fg: "#1D4ED8", label: "Completed" },
      reschedule_requested: {
        bg: "#F5F3FF",
        fg: "#6D28D9",
        label: "Reschedule Requested",
      },
    };

  const c = map[status] || map.pending;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "7px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        background: c.bg,
        color: c.fg,
        whiteSpace: "nowrap",
      }}
    >
      {c.label}
    </span>
  );
}

function SidebarButton(props: {
  active: boolean;
  label: string;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      onClick={props.onClick}
      style={{
        width: "100%",
        textAlign: "left",
        border: "none",
        cursor: "pointer",
        fontWeight: 800,
        fontSize: 16,
        borderRadius: 18,
        padding: "14px 16px",
        color: props.active ? "white" : "#374151",
        background: props.active
          ? "linear-gradient(90deg, #2F56E5 0%, #4B6EF3 100%)"
          : "transparent",
        boxShadow: props.active ? "0 10px 18px rgba(37,99,235,0.18)" : "none",
      }}
    >
      {props.label}
    </button>
  );
}

function StatCard(props: {
  title: string;
  value: string | number;
  accent: string;
  subtitle?: string;
}): JSX.Element {
  const { title, value, accent, subtitle } = props;
  return (
    <div
      style={{
        minHeight: 140,
        background: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 24,
        padding: 20,
        boxShadow: "0 2px 10px rgba(16,24,40,0.04)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          background: accent,
        }}
      />
      <div style={{ marginTop: 16, fontSize: 15, color: "#6B7280" }}>
        {title}
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: 24,
          fontWeight: 900,
          color: "#111827",
          textTransform: "capitalize",
        }}
      >
        {value}
      </div>
      {subtitle ? (
        <div style={{ marginTop: 8, fontSize: 12, color: "#9CA3AF" }}>
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

export function ProviderDashboard(): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeUser | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileFullName, setProfileFullName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] =
    useState<SidebarSection>("dashboard");
  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string>("");
  const [resDate, setResDate] = useState("");
  const [resTime, setResTime] = useState("");
  const [resReason, setResReason] = useState("");
  const btnPrimarySmall =
    "px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700";
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editServiceId, setEditServiceId] = useState<string>("");
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");

  const needsProfile = useMemo(() => {
    if (!me) return false;
    return me.role === "provider" && me.is_profile_complete === false;
  }, [me]);

  const needsFirstService = useMemo(() => {
    if (!me) return false;
    if (needsProfile) return false;
    return myServices.length === 0;
  }, [me, needsProfile, myServices.length]);

  const pendingRequests = useMemo(
    () => bookings.filter((b) => b.status === "pending"),
    [bookings],
  );

  const confirmedRequests = useMemo(
    () => bookings.filter((b) => b.status === "confirmed"),
    [bookings],
  );

  const completedRequests = useMemo(
    () => bookings.filter((b) => b.status === "completed"),
    [bookings],
  );

  const totalEarnings = useMemo(() => {
    return completedRequests.reduce((sum, b) => {
      const amount =
        typeof b.service_id === "object" && b.service_id?.price
          ? Number(b.service_id.price)
          : 0;
      return sum + amount;
    }, 0);
  }, [completedRequests]);

  const thisWeekEarnings = useMemo(() => {
    return Math.round(totalEarnings * 0.35);
  }, [totalEarnings]);

  const thisMonthEarnings = useMemo(() => {
    return Math.round(totalEarnings * 0.6);
  }, [totalEarnings]);

  const todaysEarnings = useMemo(() => {
    return Math.round(totalEarnings * 0.08);
  }, [totalEarnings]);

  const monthLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthlySeries = useMemo(() => {
    const monthlyTotals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    completedRequests.forEach((b) => {
      if (!b?.date) return;
      const d = new Date(b.date);
      if (Number.isNaN(d.getTime())) return;
      const month = d.getMonth();
      const amount =
        typeof b.service_id === "object" && b.service_id?.price
          ? Number(b.service_id.price)
          : 0;
      monthlyTotals[month] += Number.isFinite(amount) ? amount : 0;
    });

    return monthlyTotals;
  }, [completedRequests]);

  function CustomEarningsTooltip({ active, payload, label }: any) {
    if (!active || !payload || !payload.length) return null;
    return (
      <div
        style={{
          background: "white",
          border: "1px solid #E5E7EB",
          borderRadius: 16,
          padding: "14px 18px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          minWidth: 160,
        }}
      >
        <div
          style={{
            fontWeight: 900,
            fontSize: 15,
            color: "#111827",
            marginBottom: 8,
          }}
        >
          {label}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#3F62E6",
            }}
          />
          <span style={{ fontSize: 13, color: "#6B7280" }}>Earnings</span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 900,
              color: "#3F62E6",
              marginLeft: "auto",
            }}
          >
            ${payload[0].value.toFixed(2)}
          </span>
        </div>
        {payload[0].value > 0 && (
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid #F3F4F6",
              fontSize: 12,
              color: "#6B7280",
            }}
          >
            ✅ Active month
          </div>
        )}
        {payload[0].value === 0 && (
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid #F3F4F6",
              fontSize: 12,
              color: "#9CA3AF",
            }}
          >
            No earnings this month
          </div>
        )}
      </div>
    );
  }

  function CustomWeeklyTooltip({ active, payload, label }: any) {
    if (!active || !payload || !payload.length) return null;
    const value = payload[0].value;
    return (
      <div
        style={{
          background: "white",
          border: "1px solid #E5E7EB",
          borderRadius: 16,
          padding: "14px 18px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          minWidth: 160,
        }}
      >
        <div
          style={{
            fontWeight: 900,
            fontSize: 15,
            color: "#111827",
            marginBottom: 8,
          }}
        >
          {label}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#3F62E6",
            }}
          />
          <span style={{ fontSize: 13, color: "#6B7280" }}>Activity</span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 900,
              color: "#3F62E6",
              marginLeft: "auto",
            }}
          >
            {value}
          </span>
        </div>
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid #F3F4F6",
            fontSize: 12,
            color: "#6B7280",
          }}
        >
          {value > 8
            ? "🔥 Very busy day"
            : value > 5
              ? "📈 Good activity"
              : value > 3
                ? "📊 Moderate"
                : "💤 Light day"}
        </div>
      </div>
    );
  }

  const weeklySeries = useMemo(() => {
    return [
      pendingRequests.length + 3,
      confirmedRequests.length + 4,
      myServices.length + 2,
      completedRequests.length + 5,
      confirmedRequests.length + 3,
      3,
      2,
    ];
  }, [
    pendingRequests.length,
    confirmedRequests.length,
    myServices.length,
    completedRequests.length,
  ]);

  async function loadProviderBookings() {
    setBookingLoading(true);
    try {
      const data = await apiFetch<{ bookings: Booking[] }>(
        "/api/bookings/provider",
      );
      setBookings(data.bookings || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load bookings");
    } finally {
      setBookingLoading(false);
    }
  }

  function getProviderRescheduleNote(b: Booking) {
    if (b.reschedule?.decision === "rejected") {
      return "Customer rejected reschedule";
    }

    if (
      b.status === "reschedule_requested" &&
      b.reschedule?.requested_by === "provider"
    ) {
      return "Waiting for customer approval";
    }

    return "";
  }

  async function loadMyServices() {
    try {
      const myRes = await apiFetch<ApiMyServicesResponse>("/api/services/my");
      setMyServices(myRes.services || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load services");
    }
  }

  async function completeBooking(id: string) {
    setError("");
    try {
      await apiFetch(`/api/bookings/${id}/complete`, { method: "PATCH" });
      await loadProviderBookings();
    } catch (e: any) {
      setError(e?.message || "Failed to complete booking");
    }
  }

  async function submitProviderReschedule() {
    setError("");
    if (!rescheduleBookingId || !resDate || !resTime) {
      setError("Date and time are required");
      return;
    }
    try {
      await apiFetch(`/api/bookings/${rescheduleBookingId}/reschedule`, {
        method: "PATCH",
        body: JSON.stringify({
          date: resDate,
          time: resTime,
          reason: resReason,
        }),
      });

      setShowReschedule(false);
      setRescheduleBookingId("");
      setResDate("");
      setResTime("");
      setResReason("");

      await loadProviderBookings();
    } catch (e: any) {
      setError(e?.message || "Reschedule failed");
    }
  }

  async function loadAll(): Promise<void> {
    setError("");
    setLoading(true);
    try {
      const meRes = await apiFetch<ApiMeResponse>("/api/provider/me");
      setMe(meRes.user);

      const catRes = await apiFetch<ApiCategoriesResponse>("/api/categories");
      const cats = Array.isArray(catRes) ? catRes : catRes.categories || [];
      setCategories(cats);

      if (meRes.user?.is_profile_complete) {
        await loadMyServices();
      } else {
        setMyServices([]);
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }

    await loadProviderBookings();
  }

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!me) return;
    if (needsProfile) return;
    if (needsFirstService) {
      setActiveSection("add");
      return;
    }
    setActiveSection("dashboard");
  }, [me, needsProfile, needsFirstService]);

  useEffect(() => {
    if (!me) return;

    setProfileFullName(me.full_name || "");
    setProfileEmail(me.email || "");
    setProfilePhone(me.provider_profile?.phone || "");
    setProfileAddress(
      [
        me.provider_profile?.address_line1,
        me.provider_profile?.city,
        me.provider_profile?.state,
        me.provider_profile?.zip,
      ]
        .filter(Boolean)
        .join(", "),
    );
  }, [me]);

  async function saveProfile() {
    setError("");
    setProfileMsg("");

    try {
      setProfileSaving(true);

      const parts = profileAddress.split(",").map((p) => p.trim());

      const address_line1 = parts[0] || "";
      const city = parts[1] || "";
      const state = parts[2] || "";
      const zip = parts[3] || "";

      const res = await apiFetch<{ user?: MeUser; message?: string }>(
        "/api/provider/me",
        {
          method: "PATCH",
          body: JSON.stringify({
            full_name: profileFullName,
            email: profileEmail,
            provider_profile: {
              phone: profilePhone,
              address_line1,
              city,
              state,
              zip,
            },
          }),
        },
      );

      if (res?.user) {
        setMe(res.user);
      } else {
        await loadAll();
      }

      setProfileMsg("Profile updated successfully.");
    } catch (e: any) {
      setError(e?.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  }

  async function acceptReschedule(id: string) {
    setError("");
    try {
      await apiFetch(`/api/bookings/${id}/reschedule/approve`, {
        method: "PATCH",
      });
      await loadProviderBookings();
    } catch (e: any) {
      setError(e?.message || "Failed to approve reschedule");
    }
  }

  async function rejectReschedule(id: string) {
    setError("");
    try {
      await apiFetch(`/api/bookings/${id}/reschedule/reject`, {
        method: "PATCH",
      });
      await loadProviderBookings();
    } catch (e: any) {
      setError(e?.message || "Failed to reject reschedule");
    }
  }

  async function handleCreateService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!serviceName.trim() || !categoryId || price === "") {
      setError("Please fill Service Name, Category, and Price.");
      return;
    }

    setSaving(true);
    try {
      await apiFetch("/api/services", {
        method: "POST",
        body: JSON.stringify({
          service_name: serviceName.trim(),
          description: description.trim(),
          price: Number(price),
          category_id: categoryId,
        }),
      });

      setServiceName("");
      setDescription("");
      setPrice("");
      setCategoryId("");

      await loadMyServices();
      setActiveSection("services");
    } catch (e2: any) {
      setError(e2?.message || "Failed to create service");
    } finally {
      setSaving(false);
    }
  }

  async function updateBookingStatus(
    id: string,
    status: "confirmed" | "rejected",
  ) {
    setError("");
    try {
      await apiFetch(`/api/bookings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadProviderBookings();
    } catch (e: any) {
      setError(e?.message || "Failed to update booking");
    }
  }

  function openEditServiceModal(s: Service) {
    setEditError("");
    setEditServiceId(s._id);
    setEditName(s.service_name || "");
    setEditDesc(s.description || "");
    setEditPrice(String(s.price ?? ""));
    setEditCategoryId(
      typeof s.category_id === "object" && s.category_id
        ? s.category_id._id
        : "",
    );
    setEditOpen(true);
  }

  function closeEditServiceModal() {
    setEditOpen(false);
    setEditSaving(false);
    setEditError("");
    setEditServiceId("");
    setEditName("");
    setEditDesc("");
    setEditPrice("");
    setEditCategoryId("");
  }

  async function saveEditedService() {
    setEditError("");
    if (!editServiceId) return;
    if (!editName.trim() || !editCategoryId || editPrice === "") {
      setEditError("Service Name, Category, and Price are required.");
      return;
    }

    setEditSaving(true);
    try {
      await apiFetch(`/api/services/my/${editServiceId}`, {
        method: "PATCH",
        body: JSON.stringify({
          service_name: editName.trim(),
          description: editDesc.trim(),
          price: Number(editPrice),
          category_id: editCategoryId,
        }),
      });
      await loadMyServices();
      closeEditServiceModal();
    } catch (e: any) {
      setEditError(e?.message || "Failed to update service");
    } finally {
      setEditSaving(false);
    }
  }

  async function toggleService(id: string) {
    setError("");
    try {
      await apiFetch(`/api/services/my/${id}/toggle`, { method: "PATCH" });
      await loadMyServices();
    } catch (e: any) {
      setError(e?.message || "Failed to toggle service");
    }
  }

  async function deleteService(id: string) {
    if (!confirm("Delete this service?")) return;
    setError("");
    try {
      await apiFetch(`/api/services/my/${id}`, { method: "DELETE" });
      await loadMyServices();
    } catch (e: any) {
      setError(e?.message || "Failed to delete service");
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F5F7FB", padding: 24 }}>
        <div
          style={{
            height: 18,
            width: 240,
            background: "#e5e7eb",
            borderRadius: 12,
          }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
            marginTop: 20,
          }}
        >
          {[1, 2, 3, 4].map((k) => (
            <div
              key={k}
              style={{
                height: 140,
                background: "#f3f4f6",
                borderRadius: 24,
                border: "1px solid #E5E7EB",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (needsProfile) {
    return (
      <ProviderOnboarding
        me={me}
        onSaved={async () => {
          await loadAll();
        }}
      />
    );
  }

  const recentRequests = bookings.slice(0, 3);

  const initials = (me?.full_name || "P")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const providerName = me?.full_name || "Provider";

  const providerNameFontSize =
    providerName.length > 24 ? 15 : providerName.length > 18 ? 17 : 20;

  return (
    <div style={{ minHeight: "100vh", background: "#F5F7FB" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "230px minmax(0,1fr)",
          minHeight: "100vh",
          width: "100%",
        }}
      >
        {/* Sidebar */}
        <aside
          style={{
            borderRight: "1px solid #E5E7EB",
            background: "white",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                padding: "22px 20px",
                borderBottom: "1px solid #E5E7EB",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: "#3156D3",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 900,
                  }}
                >
                  F
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: "#111827",
                    }}
                  >
                    Fixora
                  </div>
                  <div style={{ fontSize: 13, color: "#6B7280" }}>
                    Provider Portal
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                margin: 16,
                borderRadius: 24,
                border: "1px solid #E5E7EB",
                background: "#F7F8FC",
                padding: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: "50%",
                    background: "#3156D3",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>

                <div
                  style={{
                    minWidth: 0,
                    flex: 1,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 900,
                      color: "#111827",
                      lineHeight: 1.15,
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                      fontSize: providerNameFontSize,
                      maxWidth: "100%",
                    }}
                  >
                    {providerName}
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                      color: "#6B7280",
                      lineHeight: 1.4,
                      wordBreak: "break-word",
                    }}
                  >
                    Service Professional
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{ padding: "0 16px 16px 16px", display: "grid", gap: 8 }}
            >
              <SidebarButton
                active={activeSection === "dashboard"}
                label="Dashboard"
                onClick={() => setActiveSection("dashboard")}
              />
              <SidebarButton
                active={activeSection === "requests"}
                label="Job Requests"
                onClick={() => {
                  setActiveSection("requests");
                  void loadProviderBookings();
                }}
              />
              <SidebarButton
                active={activeSection === "earnings"}
                label="Earnings"
                onClick={() => setActiveSection("earnings")}
              />
              <SidebarButton
                active={activeSection === "profile"}
                label="Profile"
                onClick={() => setActiveSection("profile")}
              />
              <SidebarButton
                active={activeSection === "services"}
                label="My Services"
                onClick={() => {
                  setActiveSection("services");
                  void loadMyServices();
                }}
              />
              <SidebarButton
                active={activeSection === "add"}
                label="Add Service"
                onClick={() => setActiveSection("add")}
              />
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <button
              style={{
                width: "100%",
                border: "none",
                background: "transparent",
                textAlign: "left",
                borderRadius: 18,
                padding: "14px 16px",
                fontWeight: 800,
                fontSize: 16,
                color: "#6B7280",
                cursor: "pointer",
              }}
            >
              Settings
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ minWidth: 0, padding: 24 }}>
          {/* Error */}
          {error ? (
            <div
              style={{
                marginBottom: 18,
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#991B1B",
                padding: 14,
                borderRadius: 14,
              }}
            >
              {error}
            </div>
          ) : null}

          {/* Dashboard */}
          {activeSection === "dashboard" ? (
            <>
              <div style={{ marginBottom: 18 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 34,
                    lineHeight: 1.1,
                    fontWeight: 900,
                    color: "#111827",
                  }}
                >
                  Dashboard
                </h1>
                <div style={{ marginTop: 8, fontSize: 15, color: "#6B7280" }}>
                  Overview of your activity and performance
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0,1fr))",
                  gap: 20,
                }}
              >
                <StatCard
                  title="Today's Earnings"
                  value={`$${todaysEarnings}`}
                  accent="#7BC96F"
                />
                <StatCard
                  title="This Week"
                  value={`$${thisWeekEarnings}`}
                  accent="#6C8CE8"
                />
                <StatCard
                  title="This Month"
                  value={`$${thisMonthEarnings}`}
                  accent="#9B59E9"
                />
                <StatCard
                  title="Total Earnings"
                  value={`$${totalEarnings}`}
                  accent="#E9A63B"
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 20,
                  marginTop: 20,
                }}
              >
                <div
                  style={{
                    minHeight: 330,
                    background: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: 24,
                    padding: 20,
                    boxShadow: "0 2px 10px rgba(16,24,40,0.04)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: "#111827",
                      marginBottom: 18,
                    }}
                  >
                    Earnings Trend
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart
                      data={monthLabels.map((month, i) => ({
                        month,
                        earnings: monthlySeries[i],
                      }))}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="earningsGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3F62E6"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3F62E6"
                            stopOpacity={0.01}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 13, fill: "#6B7280" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip content={<CustomEarningsTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="earnings"
                        stroke="#3F62E6"
                        strokeWidth={3}
                        fill="url(#earningsGradient)"
                        dot={{
                          fill: "#3F62E6",
                          r: 4,
                          strokeWidth: 2,
                          stroke: "white",
                        }}
                        activeDot={{
                          r: 7,
                          fill: "#3F62E6",
                          stroke: "white",
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div
                  style={{
                    minHeight: 330,
                    background: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: 24,
                    padding: 20,
                    boxShadow: "0 2px 10px rgba(16,24,40,0.04)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: "#111827",
                      marginBottom: 18,
                    }}
                  >
                    Weekly Activity
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={[
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                        "Sun",
                      ].map((day, i) => ({
                        day,
                        activity: weeklySeries[i],
                      }))}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      barSize={28}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#F3F4F6"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 13, fill: "#6B7280" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#6B7280" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomEarningsTooltip />} />
                      <Bar
                        dataKey="activity"
                        fill="#3F62E6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div
                style={{
                  marginTop: 20,
                  background: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: 24,
                  padding: 20,
                  boxShadow: "0 2px 10px rgba(16,24,40,0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 18,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: "#111827",
                      }}
                    >
                      Pending Job Requests
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "#6B7280",
                        marginTop: 4,
                      }}
                    >
                      Pending bookings can be accepted, rejected, completed, or
                      rescheduled.
                    </div>
                  </div>

                  <button
                    onClick={() => void loadProviderBookings()}
                    style={btnOutline}
                  >
                    Refresh
                  </button>
                </div>

                {recentRequests.length === 0 ? (
                  <div style={{ color: "#6B7280" }}>No bookings yet.</div>
                ) : (
                  <div style={{ display: "grid", gap: 16 }}>
                    {recentRequests.map((b) => {
                      const customer =
                        typeof b.customer_id === "object" && b.customer_id
                          ? b.customer_id.full_name || b.customer_id.email
                          : "Customer";

                      const service =
                        typeof b.service_id === "object" && b.service_id
                          ? b.service_id.service_name
                          : "Service";

                      const price =
                        typeof b.service_id === "object" && b.service_id?.price
                          ? `$${b.service_id.price}`
                          : "$0";

                      return (
                        <div
                          key={b._id}
                          style={{
                            border: "1px solid #E5E7EB",
                            borderRadius: 20,
                            padding: 18,
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 16,
                            alignItems: "flex-start",
                          }}
                        >
                          <div style={{ display: "flex", gap: 14 }}>
                            <div
                              style={{
                                width: 52,
                                height: 52,
                                borderRadius: "50%",
                                background: "#3156D3",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 900,
                                fontSize: 18,
                              }}
                            >
                              {(customer || "C")
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>

                            <div>
                              <div
                                style={{
                                  fontWeight: 900,
                                  fontSize: 18,
                                  color: "#111827",
                                }}
                              >
                                {customer}
                              </div>
                              <div
                                style={{
                                  color: "#6B7280",
                                  marginTop: 4,
                                  fontSize: 15,
                                }}
                              >
                                {service}
                              </div>
                              <div
                                style={{
                                  marginTop: 10,
                                  display: "flex",
                                  gap: 14,
                                  flexWrap: "wrap",
                                  color: "#6B7280",
                                  fontSize: 14,
                                }}
                              >
                                <span>{b.date || "—"}</span>
                                <span>{b.time || "—"}</span>
                                <span>{b.address || "—"}</span>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  gap: 10,
                                  marginTop: 16,
                                  flexWrap: "wrap",
                                }}
                              >
                                {b.status === "pending" ? (
                                  <>
                                    <button
                                      onClick={() =>
                                        updateBookingStatus(b._id, "confirmed")
                                      }
                                      style={{
                                        ...btnSuccessWide,
                                        minWidth: 180,
                                      }}
                                    >
                                      Accept Job
                                    </button>
                                    <button
                                      onClick={() =>
                                        updateBookingStatus(b._id, "rejected")
                                      }
                                      style={{
                                        ...btnOutlineWide,
                                        minWidth: 180,
                                      }}
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : null}

                                {b.status === "confirmed" ? (
                                  <>
                                    <button
                                      onClick={() => completeBooking(b._id)}
                                      style={{
                                        ...btnSuccessWide,
                                        minWidth: 180,
                                      }}
                                    >
                                      Complete Work
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRescheduleBookingId(b._id);
                                        setResDate("");
                                        setResTime("");
                                        setResReason("");
                                        setShowReschedule(true);
                                      }}
                                      style={{
                                        ...btnOutlineWide,
                                        minWidth: 180,
                                      }}
                                    >
                                      Reschedule
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: "right", minWidth: 90 }}>
                            <div
                              style={{
                                fontSize: 20,
                                fontWeight: 900,
                                color: "#16A34A",
                              }}
                            >
                              {price}
                            </div>
                            <div style={{ marginTop: 10 }}>
                              <StatusPill status={b.status} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : null}

          {/* Requests */}
          {activeSection === "requests" ? (
            <div
              style={{
                background: "white",
                border: "1px solid #E5E7EB",
                borderRadius: 24,
                padding: 20,
                boxShadow: "0 2px 10px rgba(16,24,40,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 18,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 30,
                      fontWeight: 900,
                      color: "#111827",
                    }}
                  >
                    Job Requests
                  </div>
                  <div style={{ marginTop: 4, color: "#6B7280" }}>
                    Manage your provider bookings and requests
                  </div>
                </div>

                <button
                  onClick={() => void loadProviderBookings()}
                  style={btnOutline}
                >
                  Refresh
                </button>
              </div>

              {bookingLoading ? (
                <div style={{ color: "#6B7280" }}>Loading...</div>
              ) : bookings.length === 0 ? (
                <div style={{ color: "#6B7280" }}>No bookings yet.</div>
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  {bookings.map((b) => {
                    const customer =
                      typeof b.customer_id === "object" && b.customer_id
                        ? b.customer_id.full_name || b.customer_id.email
                        : "—";

                    const service =
                      typeof b.service_id === "object" && b.service_id
                        ? b.service_id.service_name
                        : "—";

                    const amount =
                      typeof b.service_id === "object" && b.service_id?.price
                        ? `$${b.service_id.price}`
                        : "$0";

                    return (
                      <div
                        key={b._id}
                        style={{
                          border: "1px solid #E5E7EB",
                          borderRadius: 22,
                          padding: 18,
                          background: "#fff",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 16,
                            alignItems: "flex-start",
                          }}
                        >
                          <div style={{ display: "flex", gap: 14, flex: 1 }}>
                            <div
                              style={{
                                width: 54,
                                height: 54,
                                borderRadius: "50%",
                                background: "#3156D3",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 900,
                                fontSize: 18,
                                flexShrink: 0,
                              }}
                            >
                              {(customer || "C")
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>

                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: 10,
                                  alignItems: "flex-start",
                                  flexWrap: "wrap",
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      fontSize: 18,
                                      fontWeight: 900,
                                      color: "#111827",
                                    }}
                                  >
                                    {customer}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 15,
                                      color: "#6B7280",
                                      marginTop: 3,
                                    }}
                                  >
                                    {service}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    fontSize: 20,
                                    fontWeight: 900,
                                    color: "#16A34A",
                                  }}
                                >
                                  {amount}
                                </div>
                              </div>

                              <div
                                style={{
                                  marginTop: 10,
                                  display: "flex",
                                  gap: 16,
                                  flexWrap: "wrap",
                                  fontSize: 14,
                                  color: "#6B7280",
                                }}
                              >
                                <span>{b.date || "—"}</span>
                                <span>{b.time || "—"}</span>
                                <span>{b.address || "—"}</span>
                              </div>

                              <div style={{ marginTop: 12 }}>
                                <StatusPill status={b.status} />
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  gap: 10,
                                  flexWrap: "wrap",
                                  marginTop: 16,
                                }}
                              >
                                {b.status === "pending" ? (
                                  <>
                                    <button
                                      onClick={() =>
                                        updateBookingStatus(b._id, "confirmed")
                                      }
                                      style={{
                                        ...btnSuccessWide,
                                        minWidth: 180,
                                      }}
                                    >
                                      Accept Job
                                    </button>
                                    <button
                                      onClick={() =>
                                        updateBookingStatus(b._id, "rejected")
                                      }
                                      style={{
                                        ...btnOutlineWide,
                                        minWidth: 180,
                                      }}
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : null}

                                {b.status === "confirmed" ? (
                                  <>
                                    <button
                                      onClick={() => completeBooking(b._id)}
                                      style={{
                                        ...btnSuccessWide,
                                        minWidth: 180,
                                      }}
                                    >
                                      Complete Work
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRescheduleBookingId(b._id);
                                        setResDate("");
                                        setResTime("");
                                        setResReason("");
                                        setShowReschedule(true);
                                      }}
                                      style={{
                                        ...btnOutlineWide,
                                        minWidth: 180,
                                      }}
                                    >
                                      Reschedule
                                    </button>
                                  </>
                                ) : null}

                                {b.status === "reschedule_requested" ? (
                                  b.reschedule?.requested_by === "customer" ? (
                                    <>
                                      <button
                                        onClick={() => acceptReschedule(b._id)}
                                        className={btnPrimarySmall}
                                      >
                                        Accept Reschedule
                                      </button>
                                      <button
                                        onClick={() => rejectReschedule(b._id)}
                                        style={btnOutlineSmall}
                                      >
                                        Reject Reschedule
                                      </button>
                                    </>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: 12,
                                        color: "#6D28D9",
                                        fontWeight: 800,
                                      }}
                                    >
                                      Waiting for customer approval
                                    </span>
                                  )
                                ) : null}

                                {b.reschedule?.decision === "rejected" ? (
                                  <div
                                    style={{
                                      marginTop: 10,
                                      background: "#FEF2F2",
                                      border: "1px solid #FECACA",
                                      color: "#991B1B",
                                      padding: "10px 12px",
                                      borderRadius: 12,
                                      fontSize: 13,
                                      lineHeight: 1.4,
                                      maxWidth: 520,
                                    }}
                                  >
                                    <div style={{ fontWeight: 900 }}>
                                      Customer rejected reschedule
                                    </div>

                                    {b.reschedule?.rejection_reason ? (
                                      <div style={{ marginTop: 4 }}>
                                        <b>Reason:</b>{" "}
                                        {b.reschedule.rejection_reason}
                                      </div>
                                    ) : null}

                                    {b.reschedule?.rejection_message ? (
                                      <div style={{ marginTop: 4 }}>
                                        <b>Note:</b>{" "}
                                        {b.reschedule.rejection_message}
                                      </div>
                                    ) : null}
                                  </div>
                                ) : null}

                                {getProviderRescheduleNote(b) ? (
                                  <span
                                    style={{
                                      fontSize: 12,
                                      color:
                                        getProviderRescheduleNote(b) ===
                                        "Customer rejected reschedule"
                                          ? "#B42318"
                                          : "#6D28D9",
                                      fontWeight: 800,
                                    }}
                                  >
                                    {getProviderRescheduleNote(b)}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {/* Earnings */}
          {activeSection === "earnings" ? (
            <div style={{ display: "grid", gap: 20 }}>
              <div
                style={{
                  background: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: 24,
                  padding: 20,
                  boxShadow: "0 2px 10px rgba(16,24,40,0.04)",
                }}
              >
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 900,
                    color: "#111827",
                  }}
                >
                  Earnings
                </div>
                <div style={{ marginTop: 4, color: "#6B7280" }}>
                  Track your earnings and payments
                </div>

                <div style={{ marginTop: 18 }}>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: "#111827",
                      marginBottom: 18,
                    }}
                  >
                    Monthly Earnings Overview
                  </div>

                  <div
                    style={{
                      height: 320,
                      borderRadius: 20,
                      border: "1px dashed #D1D5DB",
                      background:
                        "linear-gradient(180deg, rgba(59,130,246,0.05) 0%, rgba(59,130,246,0.01) 100%)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          top: `${60 + i * 52}px`,
                          borderTop: "1px dashed #E5E7EB",
                        }}
                      />
                    ))}

                    <svg
                      viewBox="0 0 800 320"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      <path
                        d={buildLinePath(monthlySeries, 800, 220, 40)}
                        fill="none"
                        stroke="#3F62E6"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    <div
                      style={{
                        position: "absolute",
                        left: 36,
                        right: 36,
                        bottom: 18,
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 14,
                        color: "#6B7280",
                      }}
                    >
                      {monthLabels.map((m) => (
                        <span key={m}>{m}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: 24,
                  padding: 20,
                  boxShadow: "0 2px 10px rgba(16,24,40,0.04)",
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#111827",
                    marginBottom: 14,
                  }}
                >
                  Recent Earnings
                </div>

                {completedRequests.length === 0 ? (
                  <div style={{ color: "#6B7280" }}>No completed jobs yet.</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr
                        style={{
                          background: "#F9FAFB",
                          color: "#6B7280",
                          fontSize: 13,
                        }}
                      >
                        <th style={th}>Date</th>
                        <th style={th}>Customer</th>
                        <th style={th}>Service</th>
                        <th style={th}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedRequests.map((b) => {
                        const customer =
                          typeof b.customer_id === "object" && b.customer_id
                            ? b.customer_id.full_name || b.customer_id.email
                            : "—";
                        const service =
                          typeof b.service_id === "object" && b.service_id
                            ? b.service_id.service_name
                            : "—";
                        const amount =
                          typeof b.service_id === "object" &&
                          b.service_id?.price
                            ? `$${b.service_id.price}`
                            : "$0";

                        return (
                          <tr
                            key={b._id}
                            style={{ borderTop: "1px solid #E5E7EB" }}
                          >
                            <td style={td}>{b.date || "—"}</td>
                            <td style={td}>{customer}</td>
                            <td style={td}>{service}</td>
                            <td
                              style={{
                                ...td,
                                color: "#16A34A",
                                fontWeight: 900,
                              }}
                            >
                              {amount}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : null}

          {/* Profile */}
          {activeSection === "profile" ? (
            <div
              style={{
                background: "white",
                border: "1px solid #E5E7EB",
                borderRadius: 24,
                padding: 24,
                boxShadow: "0 2px 10px rgba(16,24,40,0.04)",
              }}
            >
              <div style={{ maxWidth: 760, margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                  <div
                    style={{
                      width: 116,
                      height: 116,
                      borderRadius: "50%",
                      background: "#3156D3",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: 42,
                      margin: "0 auto",
                    }}
                  >
                    {initials}
                  </div>
                  <div
                    style={{
                      marginTop: 18,
                      fontSize: 36,
                      fontWeight: 900,
                      color: "#111827",
                    }}
                  >
                    {providerName}
                  </div>
                  <div style={{ marginTop: 8, color: "#6B7280", fontSize: 18 }}>
                    {me?.email || "—"}
                  </div>
                  <div
                    style={{
                      marginTop: 12,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#FFF7ED",
                      color: "#B45309",
                      padding: "8px 14px",
                      borderRadius: 999,
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    ★ 4.9 (127 reviews)
                  </div>
                </div>

                <div style={{ display: "grid", gap: 18 }}>
                  <div>
                    <label style={label}>Full Name</label>
                    <input
                      value={profileFullName}
                      onChange={(e) => setProfileFullName(e.target.value)}
                      style={input}
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label style={label}>Email</label>
                    <input
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      style={input}
                      placeholder="Enter email"
                      type="email"
                    />
                  </div>

                  <div>
                    <label style={label}>Phone</label>
                    <input
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      style={input}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label style={label}>Address</label>
                    <input
                      value={profileAddress}
                      onChange={(e) => setProfileAddress(e.target.value)}
                      style={input}
                      placeholder="address, city, state, zip"
                    />
                  </div>

                  {profileMsg ? (
                    <div
                      style={{
                        background: "#ECFDF3",
                        border: "1px solid #BBF7D0",
                        color: "#166534",
                        padding: 12,
                        borderRadius: 12,
                        fontWeight: 700,
                      }}
                    >
                      {profileMsg}
                    </div>
                  ) : null}

                  <button
                    onClick={saveProfile}
                    disabled={profileSaving}
                    style={{
                      ...btnPrimaryBig,
                      opacity: profileSaving ? 0.7 : 1,
                      cursor: profileSaving ? "not-allowed" : "pointer",
                    }}
                  >
                    {profileSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Services */}
          {activeSection === "services" ? (
            <div
              style={{
                background: "white",
                border: "1px solid #E5E7EB",
                borderRadius: 24,
                overflow: "hidden",
                boxShadow: "0 2px 10px rgba(16,24,40,0.04)",
              }}
            >
              <div
                style={{
                  padding: 20,
                  borderBottom: "1px solid #E5E7EB",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 30,
                      fontWeight: 900,
                      color: "#111827",
                    }}
                  >
                    My Services
                  </div>
                  <div style={{ marginTop: 4, color: "#6B7280" }}>
                    Edit, activate/deactivate, or delete services.
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setActiveSection("add")}
                    style={btnPrimary}
                  >
                    + Add Service
                  </button>
                  <button
                    onClick={() => void loadMyServices()}
                    style={btnOutline}
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {myServices.length === 0 ? (
                <div style={{ padding: 20, color: "#6B7280" }}>
                  No services yet. Go to “Add Service”.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        background: "#F9FAFB",
                        color: "#6B7280",
                        fontSize: 13,
                      }}
                    >
                      <th style={th}>Service</th>
                      <th style={th}>Category</th>
                      <th style={th}>Price</th>
                      <th style={th}>Status</th>
                      <th style={th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myServices.map((s) => {
                      const cat =
                        typeof s.category_id === "object" && s.category_id
                          ? s.category_id.category_name || s.category_id.name
                          : "—";

                      const active = !!s.is_active;

                      return (
                        <tr
                          key={s._id}
                          style={{ borderTop: "1px solid #E5E7EB" }}
                        >
                          <td style={td}>
                            <div style={{ fontWeight: 900, color: "#111827" }}>
                              {s.service_name}
                            </div>
                            <div
                              style={{
                                color: "#6B7280",
                                fontSize: 13,
                                marginTop: 4,
                              }}
                            >
                              {s.description || "—"}
                            </div>
                          </td>
                          <td style={td}>{cat || "—"}</td>
                          <td style={td}>${Number(s.price || 0).toFixed(2)}</td>
                          <td style={td}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "6px 10px",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 800,
                                background: active ? "#ECFDF3" : "#FEF2F2",
                                color: active ? "#027A48" : "#B42318",
                              }}
                            >
                              {active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td style={td}>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                onClick={() => openEditServiceModal(s)}
                                style={btnOutlineSmall}
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => toggleService(s._id)}
                                style={{
                                  ...btnOutlineSmall,
                                  borderColor: active ? "#FECACA" : "#BBF7D0",
                                  color: active ? "#B42318" : "#027A48",
                                }}
                              >
                                {active ? "Deactivate" : "Activate"}
                              </button>

                              <button
                                onClick={() => deleteService(s._id)}
                                style={{
                                  ...btnOutlineSmall,
                                  borderColor: "#FECACA",
                                  color: "#B42318",
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ) : null}

          {/* Add Service */}
          {activeSection === "add" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.8fr",
                gap: 20,
              }}
            >
              <div
                style={{
                  background: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: 24,
                  padding: 20,
                  boxShadow: "0 2px 10px rgba(16,24,40,0.04)",
                }}
              >
                <div
                  style={{ fontWeight: 900, fontSize: 28, color: "#111827" }}
                >
                  Add Service
                </div>
                <div style={{ color: "#6B7280", fontSize: 14, marginTop: 6 }}>
                  Add a new service customers can book.
                </div>

                <form
                  onSubmit={handleCreateService}
                  style={{ marginTop: 20, display: "grid", gap: 14 }}
                >
                  <div>
                    <label style={label}>Service Name</label>
                    <input
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      placeholder="e.g. Leak Repair, Deep Cleaning"
                      style={input}
                    />
                  </div>

                  <div>
                    <label style={label}>Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      style={input}
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.category_name || c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 14,
                    }}
                  >
                    <div>
                      <label style={label}>Price ($)</label>
                      <input
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        type="number"
                        min={0}
                        step={0.01}
                        style={input}
                      />
                    </div>
                    <div>
                      <label style={label}>Quick Tip</label>
                      <div
                        style={{
                          padding: "12px 12px",
                          border: "1px dashed #D1D5DB",
                          borderRadius: 14,
                          color: "#4B5563",
                          minHeight: 48,
                        }}
                      >
                        Use a clear name + honest price.
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={label}>Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      style={{ ...input, resize: "vertical" }}
                    />
                  </div>

                  <button type="submit" disabled={saving} style={btnPrimaryBig}>
                    {saving ? "Creating..." : "Create Service"}
                  </button>
                </form>
              </div>

              <div
                style={{
                  background: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: 24,
                  padding: 20,
                  boxShadow: "0 2px 10px rgba(16,24,40,0.04)",
                }}
              >
                <div
                  style={{ fontWeight: 900, fontSize: 18, color: "#111827" }}
                >
                  What happens next?
                </div>
                <ul
                  style={{
                    marginTop: 14,
                    color: "#4B5563",
                    lineHeight: 1.9,
                    paddingLeft: 18,
                  }}
                >
                  <li>Your service becomes visible to customers.</li>
                  <li>Customers can book you.</li>
                  <li>You’ll see bookings in “Job Requests”.</li>
                </ul>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {/* Reschedule Modal */}
      {showReschedule ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            style={{
              width: "min(560px, 100%)",
              background: "white",
              borderRadius: 18,
              border: "1px solid #E5E7EB",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: 18, borderBottom: "1px solid #E5E7EB" }}>
              <div style={{ fontWeight: 900, fontSize: 20, color: "#111827" }}>
                Request Reschedule
              </div>
              <div style={{ color: "#6B7280", marginTop: 4, fontSize: 13 }}>
                Customer must approve this request.
              </div>
            </div>

            <div style={{ padding: 18, display: "grid", gap: 12 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <div style={label}>New Date</div>
                  <input
                    value={resDate}
                    onChange={(e) => setResDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    style={input}
                  />
                </div>
                <div>
                  <div style={label}>New Time</div>
                  <input
                    value={resTime}
                    onChange={(e) => setResTime(e.target.value)}
                    placeholder="HH:mm"
                    style={input}
                  />
                </div>
              </div>

              <div>
                <div style={label}>Reason</div>
                <textarea
                  value={resReason}
                  onChange={(e) => setResReason(e.target.value)}
                  rows={4}
                  style={{ ...input, resize: "vertical" }}
                />
              </div>
            </div>

            <div
              style={{
                padding: 18,
                borderTop: "1px solid #E5E7EB",
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowReschedule(false)}
                style={btnOutline}
              >
                Cancel
              </button>
              <button
                onClick={() => void submitProviderReschedule()}
                style={btnPrimary}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit Service Modal */}
      {editOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: 16,
          }}
        >
          <div
            style={{
              width: "min(620px, 100%)",
              background: "white",
              borderRadius: 18,
              border: "1px solid #E5E7EB",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: 18,
                borderBottom: "1px solid #E5E7EB",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{ fontWeight: 900, fontSize: 20, color: "#111827" }}
                >
                  Edit Service
                </div>
                <div style={{ color: "#6B7280", marginTop: 4, fontSize: 13 }}>
                  Update service details, price, and category.
                </div>
              </div>
              <button
                onClick={closeEditServiceModal}
                style={btnOutlineSmall}
                disabled={editSaving}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 18 }}>
              {editError ? (
                <div
                  style={{
                    marginBottom: 12,
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    color: "#991B1B",
                    padding: 12,
                    borderRadius: 12,
                  }}
                >
                  {editError}
                </div>
              ) : null}

              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <label style={label}>Service Name</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={input}
                  />
                </div>

                <div>
                  <label style={label}>Category</label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    style={input}
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.category_name || c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div>
                    <label style={label}>Price ($)</label>
                    <input
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      type="number"
                      min={0}
                      step={0.01}
                      style={input}
                    />
                  </div>

                  <div>
                    <label style={label}>Note</label>
                    <div
                      style={{
                        padding: "12px 12px",
                        border: "1px dashed #D1D5DB",
                        borderRadius: 12,
                        color: "#4B5563",
                      }}
                    >
                      Keep price realistic.
                    </div>
                  </div>
                </div>

                <div>
                  <label style={label}>Description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={4}
                    style={{ ...input, resize: "vertical" }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                padding: 18,
                borderTop: "1px solid #E5E7EB",
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={closeEditServiceModal}
                style={btnOutline}
                disabled={editSaving}
              >
                Cancel
              </button>
              <button
                onClick={saveEditedService}
                style={btnPrimary}
                disabled={editSaving}
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ProviderDashboard;

function Field(props: { label: string; value: string }): JSX.Element {
  return (
    <div>
      <label style={label}>{props.label}</label>
      <input value={props.value} readOnly style={input} />
    </div>
  );
}

function buildLinePath(
  values: number[],
  width: number,
  maxHeight: number,
  top: number,
) {
  const max = Math.max(...values, 1);
  const leftPad = 40;
  const rightPad = 40;
  const usableWidth = width - leftPad - rightPad;
  const step =
    values.length > 1 ? usableWidth / (values.length - 1) : usableWidth;

  return values
    .map((v, i) => {
      const x = leftPad + i * step;
      const y = top + (maxHeight - (v / max) * maxHeight);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function buildAreaPath(
  values: number[],
  width: number,
  maxHeight: number,
  top: number,
) {
  const max = Math.max(...values, 1);
  const leftPad = 40;
  const rightPad = 40;
  const usableWidth = width - leftPad - rightPad;
  const step =
    values.length > 1 ? usableWidth / (values.length - 1) : usableWidth;

  const points = values.map((v, i) => {
    const x = leftPad + i * step;
    const y = top + (maxHeight - (v / max) * maxHeight);
    return { x, y };
  });

  if (!points.length) return "";

  return [
    `M ${points[0].x} ${top + maxHeight}`,
    ...points.map((p) => `L ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${top + maxHeight}`,
    "Z",
  ].join(" ");
}

const label: React.CSSProperties = {
  display: "block",
  fontWeight: 800,
  marginBottom: 6,
  color: "#374151",
  fontSize: 14,
};

const input: React.CSSProperties = {
  width: "100%",
  border: "1px solid #D1D5DB",
  borderRadius: 14,
  padding: "12px 14px",
  outline: "none",
  fontSize: 14,
  color: "#111827",
  background: "white",
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 16px",
  fontWeight: 800,
};

const td: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 16px",
  verticalAlign: "top",
  color: "#111827",
};

const btnOutline: React.CSSProperties = {
  border: "1px solid #D1D5DB",
  background: "white",
  padding: "10px 14px",
  borderRadius: 14,
  cursor: "pointer",
  fontWeight: 800,
  color: "#374151",
};

const btnPrimary: React.CSSProperties = {
  border: "none",
  background: "#2563EB",
  color: "white",
  padding: "12px 16px",
  borderRadius: 14,
  cursor: "pointer",
  fontWeight: 900,
};

const btnPrimaryBig: React.CSSProperties = {
  border: "none",
  background: "#2563EB",
  color: "white",
  padding: "14px 18px",
  borderRadius: 16,
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 16,
};

const btnOutlineSmall: React.CSSProperties = {
  border: "1px solid #D1D5DB",
  background: "white",
  padding: "8px 10px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 800,
  color: "#111827",
};

const btnSuccessWide: React.CSSProperties = {
  border: "none",
  background: "linear-gradient(90deg, #46B64D 0%, #379C42 100%)",
  color: "white",
  padding: "12px 18px",
  borderRadius: 14,
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 15,
};

const btnOutlineWide: React.CSSProperties = {
  border: "1px solid #D1D5DB",
  background: "white",
  color: "#374151",
  padding: "12px 18px",
  borderRadius: 14,
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 15,
};
