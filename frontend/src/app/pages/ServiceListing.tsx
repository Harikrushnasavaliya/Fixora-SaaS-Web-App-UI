import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { apiGet } from "../lib/api";

type Service = {
  _id: string;
  service_name: string;
  description?: string;
  price?: number;
  pricing_type?: string;
  rating_avg?: number;
  rating_count?: number;
  category_id?: { _id: string; category_name?: string; name?: string } | string;
  provider_id?: {
    _id: string;
    full_name?: string;
    email?: string;
    provider_profile?: { rating_avg?: number; rating_count?: number };
  };
};

export function ServiceListing() {
  const navigate = useNavigate();
  const { category: categoryParam } = useParams();
  const [searchParams] = useSearchParams();
  const categoryQuery = searchParams.get("category"); // from ?category=Plumbing
  const searchQuery = searchParams.get("search") || "";

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(999999);
  const [search, setSearch] = useState(searchQuery);

  const loadServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<{ services: Service[] } | Service[]>(
        "/api/services",
      );
      const list = Array.isArray(data)
        ? data
        : Array.isArray((data as any).services)
          ? (data as any).services
          : [];
      setServices(list);
    } catch (e: any) {
      setServices([]);
      setError(e?.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadServices();
  }, []);

  // Active category filter — from URL param or query string
  const activeCategory = categoryParam || categoryQuery || "";

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const rating = Number((s as any).rating_avg || 0);
      const price = Number(s.price || 0);

      // Category filter
      if (activeCategory) {
        const catName =
          typeof s.category_id === "object" && s.category_id
            ? (s.category_id as any).category_name ||
              (s.category_id as any).name ||
              ""
            : typeof s.category_id === "string"
              ? s.category_id
              : "";
        if (!catName.toLowerCase().includes(activeCategory.toLowerCase())) {
          return false;
        }
        console.log("category_id:", s.category_id);
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = s.service_name.toLowerCase().includes(q);
        const matchesProvider = (s.provider_id?.full_name || "")
          .toLowerCase()
          .includes(q);
        const matchesDesc = (s.description || "").toLowerCase().includes(q);
        if (!matchesName && !matchesProvider && !matchesDesc) return false;
      }

      return rating >= minRating && price <= maxPrice;
    });
  }, [services, minRating, maxPrice, search, activeCategory]);

  const initials = (name?: string) => {
    return (name || "P")
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const pageTitle = activeCategory
    ? `${activeCategory} Services`
    : search
      ? `Results for "${search}"`
      : "All Services";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
            <p className="text-gray-600 mt-1">
              {loading
                ? "Loading services..."
                : `${filtered.length} service${filtered.length === 1 ? "" : "s"} available`}
            </p>
          </div>
          <button
            onClick={loadServices}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Rating
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
              >
                <option value={0}>Any rating</option>
                <option value={3}>3+ stars</option>
                <option value={3.5}>3.5+ stars</option>
                <option value={4}>4+ stars</option>
                <option value={4.5}>4.5+ stars</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price ($)
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={
                  Number.isFinite(maxPrice) && maxPrice !== 999999
                    ? maxPrice
                    : ""
                }
                placeholder="Any price"
                onChange={(e) =>
                  setMaxPrice(e.target.value ? Number(e.target.value) : 999999)
                }
                min={0}
              />
            </div>

            <div className="flex items-end">
              <button
                className="w-full border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50"
                onClick={() => {
                  setMinRating(0);
                  setMaxPrice(999999);
                  setSearch("");
                }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Active category badge */}
        {activeCategory && (
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold">
              📂 {activeCategory}
              <button
                onClick={() => navigate("/services")}
                className="ml-1 text-blue-400 hover:text-blue-700 font-bold"
              >
                ✕
              </button>
            </span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {/* Services Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <div
                key={k}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 animate-pulse h-48"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-900 font-semibold text-lg">
              No services found
            </p>
            <p className="text-gray-500 mt-2">
              Try adjusting your filters or search term
            </p>
            <button
              onClick={() => {
                setMinRating(0);
                setMaxPrice(999999);
                setSearch("");
                navigate("/services");
              }}
              className="mt-4 px-6 py-2 rounded-xl bg-[#2563EB] text-white hover:bg-blue-700"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((s) => {
              const providerId = s.provider_id?._id;
              const providerName =
                s.provider_id?.full_name || s.provider_id?.email || "Provider";
              const rating = Number((s as any).rating_avg || 0);
              const ratingCount = Number((s as any).rating_count || 0);
              const price = Number(s.price || 0);

              return (
                <div
                  key={s._id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:border-[#2563EB] transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {s.service_name}
                      </h3>
                      {s.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {s.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-sm ${star <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500">
                        {rating > 0
                          ? `${rating.toFixed(1)} (${ratingCount})`
                          : "New"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold flex-shrink-0">
                        {initials(s.provider_id?.full_name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {providerName}
                        </div>
                        <div className="text-xs text-gray-500 font-semibold">
                          ${price}
                          {(s as any).pricing_type === "hourly"
                            ? "/hr"
                            : " fixed"}
                        </div>
                      </div>
                    </div>
                    <Link
                      to={providerId ? `/provider/${providerId}` : "/services"}
                      className="text-[#2563EB] font-medium hover:underline text-sm"
                    >
                      View
                    </Link>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      className="flex-1 px-4 py-2 rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 disabled:opacity-60 font-semibold"
                      disabled={!providerId}
                      onClick={() => {
                        if (providerId)
                          navigate(
                            `/provider/${providerId}?serviceId=${s._id}`,
                          );
                      }}
                    >
                      Book Now
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 font-semibold"
                      onClick={() => navigate("/customer/dashboard")}
                    >
                      My Bookings
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
