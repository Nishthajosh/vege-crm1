'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

interface OrderItem {
  vegetableId: string;
  vegetableName: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  id: string;
  userId: string;
  date: string;
  name: string;
  status: string;
  totalPrice: number;
  quantity: number;
  createdAt: number;
  items?: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
            <p className="mt-2 text-sm text-gray-600">View all your past orders</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
              <p className="mt-1 text-sm text-gray-500">Start shopping to see your orders here</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Order #{order.id}</h3>
                        <p className="text-sm text-gray-600 mt-1">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                        <p className="text-lg font-bold text-gray-900 mt-2">
                          ₹{order.totalPrice?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="px-6 py-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Order Items</h4>
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.vegetableName}
                                  className="h-12 w-12 object-contain mr-3"
                                />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {item.vegetableName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.quantity} kg × ₹{item.price}/kg
                                </p>
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              ₹{(item.quantity * item.price).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
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
