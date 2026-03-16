import { useMemo, useState } from "react";

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

type Props = {
  open: boolean;
  bookingId: string | null;
  amount: number;
  currency?: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
};

type Method = "card_demo" | "apple_pay_demo" | "zelle_demo";

export default function PaymentModal(props: Props) {
  const { open, bookingId, amount, currency, onClose, onSuccess } = props;

  const [method, setMethod] = useState<Method>("card_demo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const displayAmount = useMemo(() => {
    const a = Number(amount || 0);
    return a.toFixed(2);
  }, [amount]);

  if (!open) return null;

  async function pay(simulate: "success" | "fail") {
    if (!bookingId) return;
    setError("");
    setLoading(true);

    try {
      const intent = await apiFetch<{
        payment_id: string;
        client_secret: string;
      }>("/api/payments/intent", {
        method: "POST",
        body: JSON.stringify({ booking_id: bookingId, method }),
      });

      await apiFetch<{ message: string }>("/api/payments/confirm", {
        method: "POST",
        body: JSON.stringify({
          payment_id: intent.payment_id,
          client_secret: intent.client_secret,
          simulate: simulate === "fail" ? "fail" : "success",
        }),
      });

      await onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Complete Payment (Demo)
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Amount:{" "}
              <b>
                {currency || "USD"} {displayAmount}
              </b>
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50"
            disabled={loading}
            type="button"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Payment Method
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as Method)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            disabled={loading}
          >
            <option value="card_demo">Card (Demo)</option>
            <option value="apple_pay_demo">Apple Pay (Demo)</option>
            <option value="zelle_demo">Zelle (Demo)</option>
          </select>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            This is demo-only. It will mark booking payment as <b>Paid</b>.
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 font-semibold disabled:opacity-60"
            type="button"
          >
            Cancel
          </button>

          <button
            onClick={() => pay("fail")}
            disabled={loading}
            className="px-5 py-3 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-semibold disabled:opacity-60"
            type="button"
          >
            {loading ? "..." : "Simulate Fail"}
          </button>

          <button
            onClick={() => pay("success")}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-[#2563EB] text-white hover:bg-blue-700 font-semibold disabled:opacity-60"
            type="button"
          >
            {loading ? "Processing..." : "Pay Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
