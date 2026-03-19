import React, { JSX, useEffect, useMemo, useState } from "react";
import ProviderOnboarding from "./ProviderOnboarding";

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
  };
};

type ApiMeResponse = { user: MeUser };
type ApiCategoriesResponse = { categories: Category[] } | Category[];
type ApiMyServicesResponse = { services: Service[] };

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
        padding: "6px 10px",
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

export function ProviderDashboard(): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeUser | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState<"requests" | "services" | "add">(
    "services",
  );

  // Create service form
  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);

  const [bookingLoading, setBookingLoading] = useState(false);

  // Provider -> reschedule modal (request)
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string>("");
  const [resDate, setResDate] = useState("");
  const [resTime, setResTime] = useState("");
  const [resReason, setResReason] = useState("");

  // ✅ Service Edit modal
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
      setActiveTab("add");
      return;
    }
    setActiveTab("requests");
  }, [me, needsProfile, needsFirstService]);

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
      setActiveTab("services");
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

  // ✅ Service actions
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
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <div
          style={{
            height: 16,
            width: 220,
            background: "#eee",
            borderRadius: 8,
          }}
        />
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
          }}
        >
          {[1, 2, 3, 4].map((k) => (
            <div
              key={k}
              style={{ height: 96, background: "#f2f2f2", borderRadius: 16 }}
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

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 34, letterSpacing: "-0.5px" }}>
            Provider Dashboard
          </h1>
          <div style={{ marginTop: 6, color: "#667085" }}>
            Hi, <b>{me?.full_name || "Provider"}</b> — manage your bookings &
            services.
          </div>
        </div>

        {needsFirstService ? (
          <div
            style={{
              background: "#EEF4FF",
              color: "#1D4ED8",
              border: "1px solid #D6E4FF",
              padding: "10px 12px",
              borderRadius: 12,
              fontSize: 13,
              maxWidth: 360,
              textAlign: "right",
            }}
          >
            <b>Step 1:</b> Add your first service to appear in “Find Services”.
          </div>
        ) : null}
      </div>

      {/* Error */}
      {error ? (
        <div
          style={{
            marginTop: 16,
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#991B1B",
            padding: 12,
            borderRadius: 12,
          }}
        >
          {error}
        </div>
      ) : null}

      {/* Stats */}
      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
        }}
      >
        <StatCard
          title="Job Requests"
          value={pendingRequests.length}
          subtitle="Pending bookings"
        />
        <StatCard
          title="My Services"
          value={myServices.length}
          subtitle="Active listings"
        />
        <StatCard
          title="Provider Status"
          value={(me?.provider_status || "draft") as string}
          subtitle="Verification state"
        />
        <StatCard
          title="Availability"
          value={me?.provider_profile?.is_available ? "ON" : "OFF"}
          subtitle="Jobs toggle"
        />
      </div>

      {/* Tabs */}
      <div
        style={{
          marginTop: 18,
          display: "flex",
          gap: 10,
          borderBottom: "1px solid #EAECF0",
        }}
      >
        <TabButton
          active={activeTab === "requests"}
          onClick={() => {
            setActiveTab("requests");
            void loadProviderBookings();
          }}
        >
          Job Requests
        </TabButton>

        <TabButton
          active={activeTab === "services"}
          onClick={() => {
            setActiveTab("services");
            void loadMyServices();
          }}
        >
          My Services
        </TabButton>

        {/* ✅ Always available (not only first service) */}
        <TabButton
          active={activeTab === "add"}
          onClick={() => setActiveTab("add")}
        >
          Add Service
        </TabButton>
      </div>

      {/* Requests */}
      {activeTab === "requests" ? (
        <div style={{ marginTop: 18 }}>
          <div
            style={{
              background: "white",
              border: "1px solid #EAECF0",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: 16,
                borderBottom: "1px solid #EAECF0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>Bookings</div>
                <div style={{ color: "#667085", fontSize: 13, marginTop: 4 }}>
                  Pending bookings can be accepted/rejected. Confirmed bookings
                  can be completed or rescheduled.
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
              <div style={{ padding: 18, color: "#667085" }}>Loading...</div>
            ) : bookings.length === 0 ? (
              <div style={{ padding: 18, color: "#667085" }}>
                No bookings yet.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      background: "#F9FAFB",
                      color: "#475467",
                      fontSize: 13,
                    }}
                  >
                    <th style={th}>Customer</th>
                    <th style={th}>Service</th>
                    <th style={th}>When</th>
                    <th style={th}>Address</th>
                    <th style={th}>Status</th>
                    <th style={th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const customer =
                      typeof b.customer_id === "object" && b.customer_id
                        ? b.customer_id.full_name || b.customer_id.email
                        : "—";

                    const service =
                      typeof b.service_id === "object" && b.service_id
                        ? b.service_id.service_name
                        : "—";

                    return (
                      <tr
                        key={b._id}
                        style={{ borderTop: "1px solid #EAECF0" }}
                      >
                        <td style={td}>{customer || "—"}</td>
                        <td style={td}>{service || "—"}</td>
                        <td style={td}>
                          <div style={{ fontWeight: 800 }}>{b.date || "—"}</div>
                          <div style={{ color: "#667085", fontSize: 13 }}>
                            {b.time || "—"}
                          </div>
                        </td>
                        <td style={td}>
                          <div style={{ maxWidth: 260, color: "#475467" }}>
                            {b.address || "—"}
                          </div>
                        </td>
                        <td style={td}>
                          <StatusPill status={b.status} />
                        </td>
                        <td style={td}>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            {b.status === "pending" ? (
                              <>
                                <button
                                  onClick={() =>
                                    updateBookingStatus(b._id, "confirmed")
                                  }
                                  style={btnPrimarySmall}
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() =>
                                    updateBookingStatus(b._id, "rejected")
                                  }
                                  style={btnOutlineSmall}
                                >
                                  Reject
                                </button>
                              </>
                            ) : null}

                            {b.status === "confirmed" ? (
                              <>
                                <button
                                  onClick={() => completeBooking(b._id)}
                                  style={btnPrimarySmall}
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
                                  style={btnOutlineSmall}
                                >
                                  Reschedule
                                </button>
                              </>
                            ) : null}

                            {b.status === "reschedule_requested" ? (
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#6D28D9",
                                  fontWeight: 800,
                                }}
                              >
                                Waiting customer decision
                              </span>
                            ) : null}
                          </div>
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

      {/* Services */}
      {activeTab === "services" ? (
        <div style={{ marginTop: 18 }}>
          <div
            style={{
              background: "white",
              border: "1px solid #EAECF0",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: 16,
                borderBottom: "1px solid #EAECF0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>Your Service Listings</div>
                <div style={{ color: "#667085", fontSize: 13, marginTop: 4 }}>
                  Edit, activate/deactivate, or delete services.
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setActiveTab("add")} style={btnPrimary}>
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
              <div style={{ padding: 18, color: "#667085" }}>
                No services yet. Go to “Add Service”.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      background: "#F9FAFB",
                      color: "#475467",
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
                        style={{ borderTop: "1px solid #EAECF0" }}
                      >
                        <td style={td}>
                          <div style={{ fontWeight: 700 }}>
                            {s.service_name}
                          </div>
                          <div
                            style={{
                              color: "#667085",
                              fontSize: 13,
                              marginTop: 2,
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
        </div>
      ) : null}

      {/* Add Service */}
      {activeTab === "add" ? (
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: 14,
          }}
        >
          <div
            style={{
              background: "white",
              border: "1px solid #EAECF0",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 18 }}>Add Service</div>
            <div style={{ color: "#667085", fontSize: 13, marginTop: 6 }}>
              Add a new service customers can book.
            </div>

            <form
              onSubmit={handleCreateService}
              style={{ marginTop: 16, display: "grid", gap: 12 }}
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
                  gap: 12,
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
                      border: "1px dashed #D0D5DD",
                      borderRadius: 12,
                      color: "#475467",
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
                  rows={4}
                  style={{ ...input, resize: "vertical" }}
                />
              </div>

              <button type="submit" disabled={saving} style={btnPrimary}>
                {saving ? "Creating..." : "Create Service"}
              </button>
            </form>
          </div>

          <div
            style={{
              background: "white",
              border: "1px solid #EAECF0",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 800 }}>What happens next?</div>
            <ul style={{ marginTop: 10, color: "#475467", lineHeight: 1.7 }}>
              <li>
                Your service becomes visible to customers (Find Services).
              </li>
              <li>Customers can book you.</li>
              <li>You’ll see bookings in “Job Requests”.</li>
            </ul>
          </div>
        </div>
      ) : null}

      {/* Provider Reschedule Modal */}
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
              borderRadius: 16,
              border: "1px solid #EAECF0",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: 16, borderBottom: "1px solid #EAECF0" }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>
                Request Reschedule
              </div>
              <div style={{ color: "#667085", marginTop: 4, fontSize: 13 }}>
                Customer must approve this request.
              </div>
            </div>

            <div style={{ padding: 16, display: "grid", gap: 12 }}>
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
                padding: 16,
                borderTop: "1px solid #EAECF0",
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

      {/* ✅ Edit Service Modal */}
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
              borderRadius: 16,
              border: "1px solid #EAECF0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: 16,
                borderBottom: "1px solid #EAECF0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>
                  Edit Service
                </div>
                <div style={{ color: "#667085", marginTop: 4, fontSize: 13 }}>
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

            <div style={{ padding: 16 }}>
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
                        border: "1px dashed #D0D5DD",
                        borderRadius: 12,
                        color: "#475467",
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
                padding: 16,
                borderTop: "1px solid #EAECF0",
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

function StatCard(props: {
  title: string;
  value: string | number;
  subtitle: string;
}): JSX.Element {
  const { title, value, subtitle } = props;
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #EAECF0",
        borderRadius: 16,
        padding: 14,
      }}
    >
      <div style={{ color: "#667085", fontSize: 13 }}>{title}</div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 900,
          marginTop: 6,
          textTransform: "capitalize",
        }}
      >
        {value}
      </div>
      <div style={{ color: "#98A2B3", fontSize: 12, marginTop: 6 }}>
        {subtitle}
      </div>
    </div>
  );
}

function TabButton(props: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}): JSX.Element {
  const { active, children, onClick } = props;
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        padding: "12px 8px",
        cursor: "pointer",
        fontWeight: 800,
        color: active ? "#101828" : "#667085",
        borderBottom: active ? "2px solid #2563EB" : "2px solid transparent",
      }}
    >
      {children}
    </button>
  );
}

const label: React.CSSProperties = {
  display: "block",
  fontWeight: 700,
  marginBottom: 6,
  color: "#344054",
};

const input: React.CSSProperties = {
  width: "100%",
  border: "1px solid #D0D5DD",
  borderRadius: 12,
  padding: "12px 12px",
  outline: "none",
  fontSize: 14,
};

const th: React.CSSProperties = { textAlign: "left", padding: "12px 16px" };

const td: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 16px",
  verticalAlign: "top",
};

const btnOutline: React.CSSProperties = {
  border: "1px solid #D0D5DD",
  background: "white",
  padding: "10px 12px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 700,
};

const btnPrimary: React.CSSProperties = {
  border: "none",
  background: "#2563EB",
  color: "white",
  padding: "12px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 900,
};

const btnOutlineSmall: React.CSSProperties = {
  border: "1px solid #D0D5DD",
  background: "white",
  padding: "8px 10px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 800,
  color: "#101828",
};

const btnPrimarySmall: React.CSSProperties = {
  border: "1px solid #2563EB",
  background: "#2563EB",
  color: "white",
  padding: "8px 10px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 900,
};
