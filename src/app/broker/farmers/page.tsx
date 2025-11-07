'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';

interface Vegetable {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

interface Farmer {
  id: string;
  name: string;
  email: string;
  phone: string;
  vegetables: Vegetable[];
}

export default function FarmersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'broker')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === 'broker') {
      fetchFarmers();
    }
  }, [user]);

  const fetchFarmers = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all users with role=farmer
      const usersRes = await fetch('/api/signup?role=farmer');
      const usersData = await usersRes.json();
      
      // Fetch all vegetables
      const veggiesRes = await fetch('/api/vegetables');
      const veggiesData = await veggiesRes.json();
      
      // Group vegetables by farmer
      const farmersMap = new Map<string, Farmer>();
      
      usersData.users?.forEach((user: any) => {
        farmersMap.set(user.id, {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || 'N/A',
          vegetables: []
        });
      });
      
      veggiesData.vegetables?.forEach((veggie: any) => {
        if (farmersMap.has(veggie.farmerId)) {
          const farmer = farmersMap.get(veggie.farmerId)!;
          farmer.vegetables.push({
            id: veggie.id,
            name: veggie.name,
            price: veggie.price,
            quantity: veggie.quantity,
            unit: veggie.unit
          });
        }
      });
      
      setFarmers(Array.from(farmersMap.values()));
    } catch (error) {
      console.error('Error fetching farmers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/broker/dashboard"
            className="inline-flex items-center text-primary hover:text-primary/80"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">All Farmers</h1>

          {farmers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No farmers found</p>
            </div>
          ) : (
            <div className="space-y-8">
              {farmers.map((farmer) => (
                <div key={farmer.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">{farmer.name}</h2>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {farmer.email}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Phone:</span> {farmer.phone}
                      </p>
                    </div>
                  </div>

                  {farmer.vegetables.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Vegetables:</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {farmer.vegetables.map((veggie) => (
                              <tr key={veggie.id}>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {veggie.name}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  ₹{veggie.price}/{veggie.unit}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {veggie.quantity} {veggie.unit}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No vegetables listed</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
