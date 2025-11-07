'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface DemandData {
  vegetableName: string;
  totalOrders: number;
  totalQuantity: number;
  image?: string;
}

export default function DemandPage() {
  const [demandData, setDemandData] = useState<DemandData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDemandData();
  }, []);

  const fetchDemandData = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        const orders = data.orders || data || [];
        
        // Aggregate demand by vegetable
        const demandMap = new Map<string, DemandData>();
        
        orders.forEach((order: any) => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              const vegName = item.vegetable?.name || item.vegetableName || 'Unknown';
              const existing = demandMap.get(vegName) || {
                vegetableName: vegName,
                totalOrders: 0,
                totalQuantity: 0,
                image: item.vegetable?.image || item.image,
              };
              
              existing.totalOrders += 1;
              existing.totalQuantity += item.quantity;
              demandMap.set(vegName, existing);
            });
          }
        });
        
        // Convert to array and sort by total quantity
        const sortedDemand = Array.from(demandMap.values())
          .sort((a, b) => b.totalQuantity - a.totalQuantity);
        
        setDemandData(sortedDemand);
      }
    } catch (error) {
      console.error('Error fetching demand data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vegetable Demand</h1>
              <p className="mt-2 text-sm text-gray-600">
                See which vegetables are most in demand by retailers
              </p>
            </div>
            <Link
              href="/farmer/dashboard"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
            >
              ← Dashboard
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading demand data...</p>
            </div>
          ) : demandData.length === 0 ? (
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No demand data</h3>
              <p className="mt-1 text-sm text-gray-500">
                No orders have been placed yet. Check back later.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vegetable
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Quantity (kg)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {demandData.map((item, index) => (
                    <tr key={item.vegetableName} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-semibold ${
                              index === 0
                                ? 'bg-yellow-100 text-yellow-800'
                                : index === 1
                                ? 'bg-gray-100 text-gray-800'
                                : index === 2
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-50 text-gray-600'
                            }`}
                          >
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.vegetableName}
                              className="h-10 w-10 object-contain mr-3"
                            />
                          )}
                          <div className="text-sm font-medium text-gray-900">
                            {item.vegetableName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.totalOrders}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {item.totalQuantity} kg
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {demandData.length > 0 && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Demand Insights
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      The top 3 vegetables show the highest demand. Consider increasing
                      inventory for these items to maximize sales.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
