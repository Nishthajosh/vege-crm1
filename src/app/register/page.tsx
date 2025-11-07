"use client";

import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-2xl rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary font-poppins">
               Vegetable CRM
            </h1>
            <p className="text-gray-600 mt-2">Registration</p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Registration Disabled</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>New user registration is currently disabled. Please contact the administrator to create an account.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link href="/login" className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 text-center transform hover:scale-105">
              Sign in to Existing Account
            </Link>
            <Link href="/" className="block w-full bg-white hover:bg-gray-50 text-green-600 font-semibold py-3 px-4 rounded-lg border-2 border-green-600 transition-all duration-200 text-center">
              Go to Homepage
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">Need an account? <span className="text-primary font-semibold">Contact your administrator</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
