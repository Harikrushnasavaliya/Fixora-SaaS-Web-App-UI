// frontend/src/app/pages/PaymentModal.tsx
import { useEffect, useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "../lib/stripe";
import PaymentReceiptModal from "../pages/PaymentReceiptModal";

const API_BASE =
  ((import.meta as any).env?.VITE_API_BASE as string) ||
  "http://localhost:5001";

type Props = {
  open: boolean;
  bookingId: string | null;
  amount: number;
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
};

/**
 * Inner form using Stripe hooks - must be inside <Elements>
 */
function StripeCheckoutForm({
  onSuccess,
  onClose,
  paymentId,
  amount,
  currency,
}: {
  onSuccess: (receiptData: any) => void;
  onClose: () => void;
  paymentId: string;
  amount: number;
  currency: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/customer/dashboard`,
      },
    });

    if (stripeError) {
      setError(stripeError.message || "Payment failed");
      setLoading(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      try {
        const res = await fetch(`${API_BASE}/api/payments/confirm`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_id: paymentId,
            stripe_intent_id: paymentIntent.id,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Confirmation failed");

        // Pass receipt data back
        onSuccess({
          paymentId: String(paymentId).slice(-8).toUpperCase(),
          bookingId: data.booking_id
            ? String(data.booking_id).slice(-8).toUpperCase()
            : "—",
          serviceName: data.service_name || "—",
          providerName: data.provider_name || "—",
          customerEmail: data.customer_email || "",
          amount,
          bookingDate: data.booking_date || "",
          bookingTime: data.booking_time || "",
        });
      } catch (err: any) {
        setError(err.message || "Confirmation failed");
      } finally {
        setLoading(false);
      }
    } else {
      setError("Payment did not complete");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-gray-200 p-4 bg-white">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
        <div className="text-xs font-bold text-blue-700 mb-1">🧪 TEST MODE</div>
        <div className="text-sm text-blue-800">
          Use test card:{" "}
          <code className="bg-white px-2 py-0.5 rounded font-mono text-xs">
            4242 4242 4242 4242
          </code>
        </div>
        <div className="text-xs text-blue-700 mt-1">
          Any future date, any CVC, any ZIP
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-xl border border-gray-200 px-5 py-3 font-semibold hover:bg-gray-50 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="rounded-xl bg-[#2563EB] px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading
            ? "Processing..."
            : `Pay ${currency.toUpperCase()} $${amount.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}

/**
 * Main modal - creates Payment Intent then renders Elements
 */
export default function PaymentModal({
  open,
  bookingId,
  amount,
  currency,
  onClose,
  onSuccess,
}: Props) {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [paymentId, setPaymentId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => {
    if (!open || !bookingId) {
      setClientSecret("");
      setPaymentId("");
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/payments/intent`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking_id: bookingId,
            method: "card",
          }),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Failed to create payment");
        if (cancelled) return;
        setClientSecret(data.client_secret);
        setPaymentId(data.payment_id);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load payment");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, bookingId]);

  if (!open && !receiptData) return null;

  const stripePromise = getStripe();

  // Show receipt modal after payment success
  if (receiptData) {
    return (
      <PaymentReceiptModal
        open={true}
        onClose={() => {
          setReceiptData(null);
          onSuccess(); // refresh dashboard
        }}
        receipt={receiptData}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Complete Payment
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Secure payment powered by Stripe
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-1 hover:bg-gray-50"
          >
            ✕
          </button>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount</span>
            <span className="font-bold text-gray-900">
              {currency.toUpperCase()} ${amount.toFixed(2)}
            </span>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8 text-gray-500">
            Loading payment form...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
            ⚠️ {error}
            <button onClick={onClose} className="ml-3 underline font-semibold">
              Close
            </button>
          </div>
        )}

        {clientSecret && !loading && !error && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#2563EB",
                  borderRadius: "12px",
                },
              },
            }}
          >
            <StripeCheckoutForm
              onSuccess={(data) => setReceiptData(data)}
              onClose={onClose}
              paymentId={paymentId}
              amount={amount}
              currency={currency}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
