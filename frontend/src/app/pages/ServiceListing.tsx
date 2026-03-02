import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Star, MapPin, DollarSign, Filter, X } from "lucide-react";

// Mock data for service providers
const mockProviders = [
  {
    id: 1,
    name: "John Smith",
    service: "Plumbing",
    rating: 4.9,
    reviews: 127,
    experience: "8 years",
    distance: "2.3 km",
    startingPrice: 50,
    image: "JS",
    verified: true,
  },
  {
    id: 2,
    name: "Sarah Johnson",
    service: "Electrical",
    rating: 4.8,
    reviews: 98,
    experience: "6 years",
    distance: "3.1 km",
    startingPrice: 60,
    image: "SJ",
    verified: true,
  },
  {
    id: 3,
    name: "Michael Chen",
    service: "Cleaning",
    rating: 5.0,
    reviews: 215,
    experience: "10 years",
    distance: "1.8 km",
    startingPrice: 40,
    image: "MC",
    verified: true,
  },
  {
    id: 4,
    name: "Emily Davis",
    service: "Appliance Repair",
    rating: 4.7,
    reviews: 89,
    experience: "5 years",
    distance: "4.2 km",
    startingPrice: 55,
    image: "ED",
    verified: true,
  },
  {
    id: 5,
    name: "David Wilson",
    service: "Handyman",
    rating: 4.9,
    reviews: 156,
    experience: "12 years",
    distance: "2.9 km",
    startingPrice: 45,
    image: "DW",
    verified: true,
  },
  {
    id: 6,
    name: "Lisa Anderson",
    service: "Plumbing",
    rating: 4.6,
    reviews: 73,
    experience: "4 years",
    distance: "5.1 km",
    startingPrice: 48,
    image: "LA",
    verified: true,
  },
];

export function ServiceListing() {
  const { category } = useParams();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [minRating, setMinRating] = useState<number>(0);
  const [maxDistance, setMaxDistance] = useState<number>(10);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const filteredProviders = useMemo(() => {
    return mockProviders.filter((provider) => {
      // Category filter
      if (
        category &&
        provider.service.toLowerCase() !== category.toLowerCase()
      ) {
        return false;
      }

      // Price filter
      if (
        provider.startingPrice < priceRange[0] ||
        provider.startingPrice > priceRange[1]
      ) {
        return false;
      }

      // Rating filter
      if (provider.rating < minRating) {
        return false;
      }

      // Distance filter (distance is like "2.3 km")
      const dist = parseFloat(provider.distance);
      if (!Number.isNaN(dist) && dist > maxDistance) {
        return false;
      }

      return true;
    });
  }, [category, priceRange, minRating, maxDistance]);

  const resetFilters = () => {
    setPriceRange([0, 200]);
    setMinRating(0);
    setMaxDistance(10);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {category
              ? `${category.charAt(0).toUpperCase() + category.slice(1)} Services`
              : "All Services"}
          </h1>
          <p className="text-gray-600">
            {filteredProviders.length} service providers available
          </p>
        </div>

        <div className="flex gap-8">
          {/* Mobile Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="lg:hidden fixed bottom-6 right-6 bg-[#2563EB] text-white p-4 rounded-full shadow-lg z-50"
            aria-label="Toggle filters"
          >
            {showFilters ? <X size={24} /> : <Filter size={24} />}
          </button>

          {/* Filter Sidebar */}
          <aside
            className={`${
              showFilters ? "block" : "hidden"
            } lg:block fixed lg:sticky top-20 left-0 w-full lg:w-80 h-screen lg:h-fit bg-white rounded-2xl shadow-lg p-6 z-40 overflow-y-auto`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Filters</h2>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="text-gray-500 hover:text-gray-700 lg:hidden"
                aria-label="Close filters"
              >
                <X size={24} />
              </button>
            </div>

            {/* Price Range */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>

              <div className="mb-4">
                <label className="text-sm text-gray-600">
                  Min: ${priceRange[0]}
                </label>
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange([parseInt(e.target.value, 10), priceRange[1]])
                  }
                  className="w-full"
                  title="Minimum price"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">
                  Max: ${priceRange[1]}
                </label>
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], parseInt(e.target.value, 10)])
                  }
                  className="w-full"
                  title="Maximum price"
                />
              </div>
            </div>

            {/* Rating */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">
                Minimum Rating
              </h3>

              <div className="space-y-2">
                {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                  <label
                    key={rating}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === rating}
                      onChange={() => setMinRating(rating)}
                      className="text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span className="text-gray-700">{rating}+ stars</span>
                  </label>
                ))}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    checked={minRating === 0}
                    onChange={() => setMinRating(0)}
                    className="text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <span className="text-gray-700">Any rating</span>
                </label>
              </div>
            </div>

            {/* Distance */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Maximum Distance: {maxDistance} km
              </h3>
              <input
                type="range"
                min={1}
                max={20}
                value={maxDistance}
                onChange={(e) => setMaxDistance(parseInt(e.target.value, 10))}
                className="w-full"
                title="Maximum distance in kilometers"
              />
            </div>

            {/* Reset Filters */}
            <button
              type="button"
              onClick={resetFilters}
              className="w-full py-2 text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </aside>

          {/* Provider Cards Grid */}
          <div className="flex-1">
            <div className="grid sm:grid-cols-2 gap-6">
              {filteredProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow p-6"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-[#2563EB] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {provider.image}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {provider.name}
                        </h3>

                        {provider.verified && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-gray-600">
                        {provider.service}
                      </p>

                      <div className="flex items-center gap-1 mt-1">
                        <Star
                          size={14}
                          className="fill-yellow-400 text-yellow-400"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {provider.rating}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({provider.reviews} reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={16} className="text-gray-400" />
                      <span>{provider.distance} away</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign size={16} className="text-gray-400" />
                      <span>Starting from ${provider.startingPrice}/hr</span>
                    </div>

                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{provider.experience}</span>{" "}
                      experience
                    </div>
                  </div>

                  <Link
                    to={`/provider/${provider.id}`}
                    className="block w-full bg-[#2563EB] text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Profile &amp; Book
                  </Link>
                </div>
              ))}
            </div>

            {filteredProviders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">
                  No service providers found matching your filters.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 text-[#2563EB] hover:underline"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
