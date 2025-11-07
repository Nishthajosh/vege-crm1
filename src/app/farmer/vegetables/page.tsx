'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface Vegetable {
  id: number;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  description?: string;
  createdAt: string;
}

export default function VegetablesPage() {
  const router = useRouter();
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVegetables();
  }, []);

  const fetchVegetables = async () => {
    try {
      const response = await fetch('/api/vegetables');
      if (response.ok) {
        const data = await response.json();
        setVegetables(data);
      }
    } catch (error) {
      console.error('Error fetching vegetables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vegetable?')) return;

    try {
      const response = await fetch(`/api/vegetables/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Vegetable deleted successfully');
        fetchVegetables();
      } else {
        alert('Failed to delete vegetable');
      }
    } catch (error) {
      console.error('Error deleting vegetable:', error);
      alert('Failed to delete vegetable');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Vegetables</h1>
              <p className="mt-2 text-sm text-gray-600">Manage your vegetable inventory</p>
            </div>
            <Link
              href="/farmer/vegetables/add"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
            >
              + Add New Vegetable
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading vegetables...</p>
            </div>
          ) : vegetables.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No vegetables</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new vegetable.</p>
              <div className="mt-6">
                <Link
                  href="/farmer/vegetables/add"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  + Add New Vegetable
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vegetables.map((vegetable) => (
                <div key={vegetable.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6">
                    {vegetable.image && (
                      <div className="flex justify-center mb-4">
                        <img
                          src={vegetable.image}
                          alt={vegetable.name}
                          className="h-24 w-24 object-contain"
                        />
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 text-center">
                      {vegetable.name}
                    </h3>
                    {vegetable.description && (
                      <p className="mt-2 text-sm text-gray-600 text-center">
                        {vegetable.description}
                      </p>
                    )}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Quantity</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {vegetable.quantity} kg
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="text-lg font-semibold text-green-600">
                          ₹{vegetable.price}/kg
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-6 py-3 flex justify-between">
                    <button
                      onClick={() => router.push(`/farmer/vegetables/edit/${vegetable.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(vegetable.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
