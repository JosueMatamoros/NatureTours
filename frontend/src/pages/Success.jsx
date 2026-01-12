import { useLocation, useParams, Link } from "react-router-dom";

export default function Success() {
  const { paymentId } = useParams();
  const location = useLocation();
  const state = location.state || null;

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Payment successful</h1>

        <p className="mt-2 text-gray-600">
          Your payment was completed and your booking is confirmed.
        </p>

        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-900">
            <span className="font-semibold">Payment ID:</span>{" "}
            <span className="font-mono">{paymentId}</span>
          </p>
        </div>

        {state && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-900">
              Debug info (state)
            </h2>
            <pre className="mt-2 overflow-auto rounded-xl bg-gray-50 p-4 text-xs text-gray-700">
              {JSON.stringify(state, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/"
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Back to home
          </Link>
          <Link
            to="/tours"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Browse tours
          </Link>
        </div>
      </div>
    </main>
  );
}
