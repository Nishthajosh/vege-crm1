'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import ImageUploader from '@/components/ImageUploader';

export default function AddVegetablePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    price: '',
    image: '',
    description: '',
  });

  const availableImages = [
    { path: '/vegetables/tomato.svg', name: 'Tomato' },
    { path: '/vegetables/potato.svg', name: 'Potato' },
    { path: '/vegetables/carrot.svg', name: 'Carrot' },
    { path: '/vegetables/onion.svg', name: 'Onion' },
    { path: '/vegetables/cabbage.svg', name: 'Cabbage' },
    { path: '/vegetables/cucumber.svg', name: 'Cucumber' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/vegetables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Redirect immediately without showing alert
        router.push('/farmer/vegetables');
        router.refresh(); // Force refresh to show updated data
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add vegetable');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error adding vegetable:', error);
      alert('Failed to add vegetable');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Vegetable</h1>
              <p className="mt-2 text-sm text-gray-600">Fill in the details to add a new vegetable to your inventory</p>
            </div>
            <Link
              href="/farmer/dashboard"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
            >
              ← Dashboard
            </Link>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vegetable Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., Tomato"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity (kg) *</label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="0.1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="e.g., 100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Price (₹ per kg) *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="e.g., 45.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Image *</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {availableImages.map((img) => (
                    <div
                      key={img.path}
                      onClick={() => setFormData({ ...formData, image: img.path })}
                      className={`cursor-pointer border-2 rounded-lg p-2 transition-all ${
                        formData.image === img.path
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <img src={img.path} alt={img.name} className="w-full h-16 object-contain" />
                      <p className="text-xs text-center mt-1">{img.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              {formData.image && (
                <div className="flex justify-center">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Selected Image:</p>
                    <img src={formData.image} alt="Selected" className="w-32 h-32 object-contain mx-auto" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Enter description (optional)"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:bg-gray-400"
                >
                  {loading ? 'Adding...' : 'Add Vegetable'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/farmer/vegetables')}
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
