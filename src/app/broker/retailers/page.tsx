'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';

interface Order {
  id: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  itemCount: number;
}

interface Retailer {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: Order[];
  totalSpent: number;
  orderCount: number;
}

export default function RetailersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'broker')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === 'broker') {
      fetchRetailers();
    }
  }, [user]);

  const fetchRetailers = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all users with role=retailer
      const usersRes = await fetch('/api/signup?role=retailer');
      const usersData = await usersRes.json();
      
      // Fetch all orders
      const ordersRes = await fetch('/api/orders');
      const ordersData = await ordersRes.json();
      
      // Group orders by retailer
      const retailersMap = new Map<string, Retailer>();
      
      usersData.users?.forEach((user: any) => {
        retailersMap.set(user.id, {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || 'N/A',
          orders: [],
          totalSpent: 0,
          orderCount: 0
        });
      });
      
      ordersData.orders?.forEach((order: any) => {
        if (retailersMap.has(order.retailerId)) {
          const retailer = retailersMap.get(order.retailerId)!;
          retailer.orders.push({
            id: order.id,
            totalPrice: order.totalPrice || order.totalAmount || 0,
            status: order.status,
            createdAt: order.createdAt,
            itemCount: order.items?.length || 0
          });
          retailer.totalSpent += order.totalPrice || order.totalAmount || 0;
          retailer.orderCount++;
        }
      });
      
      setRetailers(Array.from(retailersMap.values()));
    } catch (error) {
      console.error('Error fetching retailers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">All Retailers</h1>

          {retailers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No retailers found</p>
            </div>
          ) : (
            <div className="space-y-8">
              {retailers.map((retailer) => (
                <div key={retailer.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">{retailer.name}</h2>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {retailer.email}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Phone:</span> {retailer.phone}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Total Orders:</span> {retailer.orderCount}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Total Spent:</span> ₹{retailer.totalSpent.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {retailer.orders.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Order History:</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order ID
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Items
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {retailer.orders.map((order) => (
                              <tr key={order.id}>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  #{order.id.slice(0, 8)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {order.itemCount} items
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  ₹{order.totalPrice.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                                    {order.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No orders placed</p>
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
