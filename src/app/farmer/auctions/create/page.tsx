'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';

interface Vegetable {
  id: string;
  name: string;
  price: number;
  image: string | null;
  description: string | null;
}

export default function CreateAuctionPage() {
  const { user, loading: authLoading, isFarmer } = useAuth();
  const router = useRouter();
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vegetableId: '',
    quantity: '',
    basePrice: '',
    endTime: '',
  });

  useEffect(() => {
    if (!authLoading && !isFarmer) {
      router.push('/');
    }
  }, [authLoading, isFarmer, router]);

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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Auction created successfully!');
        router.push('/farmer/auctions');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create auction');
      }
    } catch (error) {
      console.error('Error creating auction:', error);
      alert('Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isFarmer) {
    return null;
  }

  const selectedVeg = vegetables.find(v => v.id === formData.vegetableId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Create New Auction</h1>
            <p className="mt-2 text-sm text-gray-600">
              List your vegetables for auction and let retailers bid on them
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vegetable *
                </label>
                <select
                  required
                  value={formData.vegetableId}
                  onChange={(e) => setFormData({ ...formData, vegetableId: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select a vegetable</option>
                  {vegetables.map((veg) => (
                    <option key={veg.id} value={veg.id}>
                      {veg.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedVeg && selectedVeg.image && (
                <div className="flex justify-center">
                  <img
                    src={selectedVeg.image}
                    alt={selectedVeg.name}
                    className="w-32 h-32 object-contain"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity (kg) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="0.1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., 100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Base Price (₹ per kg) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., 45.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Auction End Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Select when the auction should end. Retailers can bid until this time.
                </p>
              </div>

              {formData.quantity && formData.basePrice && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Auction Summary</h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p><strong>Total Quantity:</strong> {formData.quantity} kg</p>
                    <p><strong>Base Price:</strong> ₹{parseFloat(formData.basePrice || '0').toFixed(2)} per kg</p>
                    <p><strong>Minimum Total:</strong> ₹{(parseFloat(formData.quantity || '0') * parseFloat(formData.basePrice || '0')).toFixed(2)}</p>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Auction...' : 'Create Auction'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/farmer/auctions')}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
