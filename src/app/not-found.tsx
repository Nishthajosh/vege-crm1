import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white shadow-2xl rounded-2xl p-8">
          {/* 404 Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="text-8xl font-bold text-primary">404</div>
              <div className="absolute -top-4 -right-4 text-6xl">🥬</div>
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
          </p>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              href="/"
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              🏠 Go to Homepage
            </Link>
            <Link
              href="/login"
              className="block w-full bg-white hover:bg-gray-50 text-green-600 font-semibold py-3 px-6 rounded-lg border-2 border-green-600 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>

          {/* Additional Links */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Quick Links:</p>
            <div className="flex justify-center gap-4 text-sm">
              <Link href="/register" className="text-green-600 hover:text-green-700 hover:underline">
                Register
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/forgot-password" className="text-green-600 hover:text-green-700 hover:underline">
                Forgot Password
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
