import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiGet } from "../lib/api";

type Service = {
  _id: string;
  service_name: string;
  description?: string;
  price?: number;
  rating_avg?: number;
  category_id?: { _id: string; name?: string } | string;
  provider_id?: {
    _id: string;
    full_name?: string;
    email?: string;
    phone?: string;
    profile_image?: string;
    provider_profile?: {
      rating_avg?: number;
      rating_count?: number;
    };
  };
};

type ServicesResponse = { services: Service[] } | Service[];

export function ServiceListing() {
  const navigate = useNavigate();
  const { category } = useParams();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [minRating, setMinRating] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(999999);

  const loadServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const path = category
        ? `/api/services/${encodeURIComponent(category)}`
        : "/api/services";

      const data = await apiGet<ServicesResponse>(path);

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
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const r = Number((s as any).rating_avg || 0);
      const p = Number(s.price || 0);
      return r >= minRating && p <= maxPrice;
    });
  }, [services, minRating, maxPrice]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {category ? `Services: ${category}` : "All Services"}
            </h1>
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

        <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
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
                Max Price
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={Number.isFinite(maxPrice) ? maxPrice : 0}
                onChange={(e) => setMaxPrice(Number(e.target.value || 0))}
                min={0}
              />
            </div>

            <div className="flex items-end">
              <button
                className="w-full border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50"
                onClick={() => {
                  setMinRating(0);
                  setMaxPrice(999999);
                }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {!loading && filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <p className="text-gray-900 font-semibold">No services found.</p>
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
                <div key={s._id} className="bg-white rounded-2xl shadow-md p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {s.service_name}
                      </h3>
                      {s.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                          {s.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
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
                        <div className="text-xs text-gray-500">
                          ${Number.isFinite(price) ? price : 0}
                          {(s as any).pricing_type === "hourly"
                            ? "/hr"
                            : " fixed"}
                        </div>
                      </div>
                    </div>

                    <Link
                      to={providerId ? `/provider/${providerId}` : "/services"}
                      className="text-[#2563EB] font-medium hover:underline"
                    >
                      View
                    </Link>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      className="flex-1 px-4 py-2 rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 disabled:opacity-60"
                      disabled={!providerId}
                      onClick={() => {
                        if (!providerId) return;
                        navigate(`/provider/${providerId}?serviceId=${s._id}`);
                      }}
                    >
                      Book Now
                    </button>

                    <button
                      className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
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
