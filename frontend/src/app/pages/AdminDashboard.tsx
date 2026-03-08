import { useState } from "react";
import { motion } from "motion/react";
import {
  DollarSign,
  Users,
  Briefcase,
  TrendingUp,
  Calendar,
  Search,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
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
  Legend,
} from "recharts";

export function AdminDashboard() {
  const [timeRange, setTimeRange] = useState("month");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - in real app, this would come from backend
  const stats = {
    totalRevenue: 284500,
    revenueGrowth: 12.5,
    totalBookings: 1284,
    bookingsGrowth: 8.3,
    activeProviders: 156,
    providersGrowth: 5.2,
    activeCustomers: 892,
    customersGrowth: 15.7,
    platformCommission: 42675, // 15% of total revenue
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

  const topProviders = [
    {
      id: 1,
      name: "John Martinez",
      service: "Plumbing",
      totalEarnings: 12450,
      completedJobs: 87,
      rating: 4.9,
      commission: 1867.5,
    },
    {
      id: 2,
      name: "Sarah Williams",
      service: "Electrical",
      totalEarnings: 10230,
      completedJobs: 72,
      rating: 4.8,
      commission: 1534.5,
    },
    {
      id: 3,
      name: "Mike Thompson",
      service: "Cleaning",
      totalEarnings: 9870,
      completedJobs: 95,
      rating: 4.9,
      commission: 1480.5,
    },
    {
      id: 4,
      name: "Emily Davis",
      service: "Handyman",
      totalEarnings: 8920,
      completedJobs: 68,
      rating: 4.7,
      commission: 1338,
    },
    {
      id: 5,
      name: "James Brown",
      service: "Plumbing",
      totalEarnings: 8450,
      completedJobs: 61,
      rating: 4.8,
      commission: 1267.5,
    },
  ];

  const recentTransactions = [
    {
      id: "TXN-2401",
      customer: "Alice Johnson",
      provider: "John Martinez",
      service: "Plumbing",
      amount: 150,
      commission: 22.5,
      date: "2026-02-28",
      status: "completed",
    },
    {
      id: "TXN-2402",
      customer: "Bob Smith",
      provider: "Sarah Williams",
      service: "Electrical",
      amount: 200,
      commission: 30,
      date: "2026-02-28",
      status: "completed",
    },
    {
      id: "TXN-2403",
      customer: "Carol White",
      provider: "Mike Thompson",
      service: "Cleaning",
      amount: 80,
      commission: 12,
      date: "2026-02-27",
      status: "completed",
    },
    {
      id: "TXN-2404",
      customer: "David Lee",
      provider: "Emily Davis",
      service: "Handyman",
      amount: 120,
      commission: 18,
      date: "2026-02-27",
      status: "completed",
    },
    {
      id: "TXN-2405",
      customer: "Emma Wilson",
      provider: "James Brown",
      service: "Plumbing",
      amount: 175,
      commission: 26.25,
      date: "2026-02-26",
      status: "pending",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

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
        {/* Stats Grid */}
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
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

          {/* Category Distribution */}
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

        {/* Bookings Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
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

        {/* Top Providers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white rounded-xl p-6 border border-gray-200 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Top Performing Providers
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Provider
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Service
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Jobs
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Rating
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Total Earnings
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Your Commission
                  </th>
                </tr>
              </thead>
              <tbody>
                {topProviders.map((provider, index) => (
                  <motion.tr
                    key={provider.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#2563EB] rounded-full flex items-center justify-center text-white font-semibold">
                          {provider.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span className="font-medium text-gray-900">
                          {provider.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {provider.service}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {provider.completedJobs}
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 text-gray-900">
                        ⭐ {provider.rating}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      ${provider.totalEarnings.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#2563EB]">
                      ${provider.commission.toLocaleString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Transaction ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Provider
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Service
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Commission
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {transaction.id}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {transaction.customer}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {transaction.provider}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {transaction.service}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      ${transaction.amount}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#2563EB]">
                      ${transaction.commission}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {transaction.date}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          transaction.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
