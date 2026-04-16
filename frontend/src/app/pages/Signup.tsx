import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { Mail, Lock, User, Phone, Briefcase, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { apiPost } from "../lib/api";

type UserRole = "customer" | "provider" | "admin";

export function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [selectedRole, setSelectedRole] = useState<UserRole>("customer");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Phone validation
    if (formData.phone.length !== 10) {
      setErrors((prev) => ({
        ...prev,
        phone: "Phone must be exactly 10 digits",
      }));
      return;
    }

    // Password validation
    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;
    if (!strongPassword.test(formData.password)) {
      setErrors((prev) => ({
        ...prev,
        password:
          "Min 8 chars with uppercase, lowercase, number & special character",
      }));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
      return;
    }

    try {
      const payload = {
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: selectedRole,
      };
      const res = await apiPost<{ message: string }>(
        "/api/auth/register",
        payload,
      );
      alert(res.message || "Account created. Please verify email.");
      navigate("/login");
    } catch (err: any) {
      alert(err.message || "Register failed");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Phone: only allow digits, max 10
    if (name === "phone") {
      if (!/^\d*$/.test(value)) return; // block non-digits
      if (value.length > 10) return; // block more than 10
      setErrors((prev) => ({
        ...prev,
        phone:
          value.length > 0 && value.length < 10
            ? "Phone must be exactly 10 digits"
            : "",
      }));
    }

    // Password strength
    if (name === "password") {
      const strongPassword =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;
      setErrors((prev) => ({
        ...prev,
        password:
          value && !strongPassword.test(value)
            ? "Min 8 chars with uppercase, lowercase, number & special character"
            : "",
      }));
    }

    // Confirm password
    if (name === "confirmPassword") {
      setErrors((prev) => ({
        ...prev,
        confirmPassword:
          value !== formData.password ? "Passwords do not match" : "",
      }));
    }

    setFormData({ ...formData, [name]: value });
  };

  const roles = [
    {
      type: "customer" as UserRole,
      icon: User,
      title: "Customer",
      description: "Book home services",
      color: "#2563EB",
    },
    {
      type: "provider" as UserRole,
      icon: Briefcase,
      title: "Service Provider",
      description: "Offer your services",
      color: "#2563EB",
    },
    {
      type: "admin" as UserRole,
      icon: ShieldCheck,
      title: "Admin",
      description: "Manage platform",
      color: "#2563EB",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <span className="text-2xl font-semibold text-gray-900">Fixora</span>
          </Link>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl font-bold text-gray-900 mb-2"
          >
            Create an account
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-gray-600"
          >
            Join thousands of satisfied customers
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  maxLength={10}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent ${errors.phone ? "border-red-400" : "border-gray-300"}`}
                  required
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent ${errors.password ? "border-red-400" : "border-gray-300"}`}
                  required
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent ${errors.confirmPassword ? "border-red-400" : "border-gray-300"}`}
                  required
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Join as
              </label>
              <div className="flex justify-center">
                <div className="grid w-full max-w-sm grid-cols-2 gap-4">
                  {roles
                    .filter((r) => r.type !== "admin")
                    .map((r, index) => {
                      const Icon = r.icon;
                      const active = selectedRole === r.type;

                      return (
                        <motion.button
                          key={r.type}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.25,
                            delay: 0.1 + index * 0.05,
                          }}
                          type="button"
                          onClick={() => setSelectedRole(r.type)}
                          className={`p-5 rounded-xl border-2 transition-all text-center flex flex-col items-center justify-center
                ${active ? "border-[#2563EB] bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                        >
                          <Icon
                            size={26}
                            className={`${active ? "text-[#2563EB]" : "text-gray-400"} mb-2`}
                          />
                          <p
                            className={`text-sm font-semibold ${active ? "text-[#2563EB]" : "text-gray-700"}`}
                          >
                            {r.title}
                          </p>
                        </motion.button>
                      );
                    })}
                </div>
              </div>
            </div>
            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms-agreement"
                title="Agree to Terms of Service and Privacy Policy"
                className="mt-1 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
                required
              />
              <label
                htmlFor="terms-agreement"
                className="ml-2 text-sm text-gray-600"
              >
                I agree to the{" "}
                <a href="#" className="text-[#2563EB] hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-[#2563EB] hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-[#2563EB] text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Account
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-[#2563EB] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
