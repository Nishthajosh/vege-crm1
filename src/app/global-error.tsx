"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-white shadow-2xl rounded-2xl p-8">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Critical Error
              </h1>
              <p className="text-gray-600 mb-6">
                A critical error has occurred. Please try refreshing the page.
              </p>

              <div className="space-y-4">
                <button
                  onClick={reset}
                  className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                >
                  🔄 Try Again
                </button>
                <a
                  href="/"
                  className="block w-full bg-white hover:bg-gray-50 text-green-600 font-semibold py-3 px-6 rounded-lg border-2 border-green-600 transition-all duration-200"
                >
                  🏠 Go to Homepage
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
