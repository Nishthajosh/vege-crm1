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
  createdAt: string;
  isActive: boolean;
  orders: Order[];
  totalSpent: number;
  orderCount: number;
  currentBids: number;
}

export default function RetailersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "broker") {
      router.replace("/");
    }
  }, [loading, router, user]);

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
          createdAt: user.createdAt || new Date().toISOString(),
          isActive: user.isActive !== false,
          orders: [],
          totalSpent: 0,
          orderCount: 0,
          currentBids: 0 // TODO: Calculate from bids table when implemented
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

  const handleViewDetails = (retailer: Retailer) => {
    setSelectedRetailer(retailer);
    setShowDetailsModal(true);
  };

  const handleToggleStatus = async (retailerId: string, currentStatus: boolean) => {
    // TODO: Implement API call to toggle retailer status
    setRetailers(prev => prev.map(r => 
      r.id === retailerId ? { ...r, isActive: !currentStatus } : r
    ));
  };

  const filteredRetailers = retailers.filter(retailer => {
    if (filterStatus === 'active') return retailer.isActive;
    if (filterStatus === 'inactive') return !retailer.isActive;
    return true;
  });

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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">All Retailers</h1>
            
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filterStatus === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({retailers.length})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filterStatus === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active ({retailers.filter(r => r.isActive).length})
              </button>
              <button
                onClick={() => setFilterStatus('inactive')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filterStatus === 'inactive'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inactive ({retailers.filter(r => !r.isActive).length})
              </button>
            </div>
          </div>

          {filteredRetailers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No retailers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Purchases
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRetailers.map((retailer) => (
                    <tr key={retailer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        #{retailer.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{retailer.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{retailer.email}</div>
                        <div className="text-xs text-gray-500">{retailer.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₹{retailer.totalSpent.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{retailer.orderCount} orders</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(retailer.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          retailer.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {retailer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleViewDetails(retailer)}
                          className="text-primary hover:text-primary/80 font-medium"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleToggleStatus(retailer.id, retailer.isActive)}
                          className={`font-medium ${
                            retailer.isActive
                              ? 'text-red-600 hover:text-red-800'
                              : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {retailer.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedRetailer && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white my-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Retailer Details - {selectedRetailer.name}
                </h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedRetailer(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Retailer Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Retailer ID</p>
                  <p className="text-sm font-medium">#{selectedRetailer.id.slice(0, 12)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedRetailer.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedRetailer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm font-medium">{selectedRetailer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-sm font-medium">{selectedRetailer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registered On</p>
                  <p className="text-sm font-medium">{new Date(selectedRetailer.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-sm font-medium">{selectedRetailer.orderCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-sm font-medium text-primary">₹{selectedRetailer.totalSpent.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Bids</p>
                  <p className="text-sm font-medium">{selectedRetailer.currentBids}</p>
                </div>
              </div>

              {/* Order History */}
              <div className="border-t pt-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Order History</h4>
                {selectedRetailer.orders.length > 0 ? (
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
                        {selectedRetailer.orders.map((order) => (
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
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No orders placed yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
