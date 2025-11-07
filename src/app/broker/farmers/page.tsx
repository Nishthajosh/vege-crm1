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
  description: string | null;
  image: string | null;
}

interface Farmer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  isActive: boolean;
  vegetables: Vegetable[];
  totalVegetables: number;
}

export default function FarmersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

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
          createdAt: user.createdAt || new Date().toISOString(),
          isActive: user.isActive !== false, // Default to active
          vegetables: [],
          totalVegetables: 0
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
            unit: veggie.unit,
            description: veggie.description,
            image: veggie.image
          });
          farmer.totalVegetables++;
        }
      });
      
      setFarmers(Array.from(farmersMap.values()));
    } catch (error) {
      console.error('Error fetching farmers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setShowDetailsModal(true);
  };

  const handleToggleStatus = async (farmerId: string, currentStatus: boolean) => {
    // TODO: Implement API call to toggle farmer status
    setFarmers(prev => prev.map(f => 
      f.id === farmerId ? { ...f, isActive: !currentStatus } : f
    ));
  };

  const handleRemoveFarmer = async (farmerId: string) => {
    if (confirm('Are you sure you want to remove this farmer?')) {
      // TODO: Implement API call to remove farmer
      setFarmers(prev => prev.filter(f => f.id !== farmerId));
    }
  };

  const filteredFarmers = farmers.filter(farmer => {
    if (filterStatus === 'active') return farmer.isActive;
    if (filterStatus === 'inactive') return !farmer.isActive;
    return true;
  });

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
            <h1 className="text-2xl font-bold text-gray-900">All Farmers</h1>
            
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
                All ({farmers.length})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filterStatus === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active ({farmers.filter(f => f.isActive).length})
              </button>
              <button
                onClick={() => setFilterStatus('inactive')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filterStatus === 'inactive'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inactive ({farmers.filter(f => !f.isActive).length})
              </button>
            </div>
          </div>

          {filteredFarmers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No farmers found</p>
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
                      Products
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
                  {filteredFarmers.map((farmer) => (
                    <tr key={farmer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        #{farmer.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{farmer.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{farmer.email}</div>
                        <div className="text-xs text-gray-500">{farmer.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {farmer.totalVegetables} vegetables
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(farmer.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          farmer.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {farmer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleViewDetails(farmer)}
                          className="text-primary hover:text-primary/80 font-medium"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleToggleStatus(farmer.id, farmer.isActive)}
                          className={`font-medium ${
                            farmer.isActive
                              ? 'text-red-600 hover:text-red-800'
                              : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {farmer.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleRemoveFarmer(farmer.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Remove
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
        {showDetailsModal && selectedFarmer && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white my-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Farmer Details - {selectedFarmer.name}
                </h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedFarmer(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Farmer Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Farmer ID</p>
                  <p className="text-sm font-medium">#{selectedFarmer.id.slice(0, 12)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedFarmer.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedFarmer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm font-medium">{selectedFarmer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-sm font-medium">{selectedFarmer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registered On</p>
                  <p className="text-sm font-medium">{new Date(selectedFarmer.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Products</p>
                  <p className="text-sm font-medium">{selectedFarmer.totalVegetables} vegetables</p>
                </div>
              </div>

              {/* Vegetables List */}
              <div className="border-t pt-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">All Vegetables Posted</h4>
                {selectedFarmer.vegetables.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedFarmer.vegetables.map((veggie) => (
                      <div key={veggie.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          {veggie.image && (
                            <img
                              src={veggie.image}
                              alt={veggie.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900">{veggie.name}</h5>
                            {veggie.description && (
                              <p className="text-xs text-gray-500 mt-1">{veggie.description}</p>
                            )}
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-sm font-medium text-primary">
                                ₹{veggie.price}/{veggie.unit}
                              </span>
                              <span className="text-sm text-gray-600">
                                Stock: {veggie.quantity} {veggie.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No vegetables posted yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
