'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';

interface Auction {
  id: string;
  farmerId: string;
  vegetableId: string;
  quantity: number;
  basePrice: number;
  currentBid: number | null;
  highestBidderId: string | null;
  startTime: number;
  endTime: number;
  status: string;
  createdAt: number;
}

interface Vegetable {
  id: string;
  name: string;
  image: string | null;
}

interface AuctionWithVegetable extends Auction {
  vegetable?: Vegetable;
}

export default function FarmerAuctionsPage() {
  const { user, loading: authLoading, isFarmer } = useAuth();
  const router = useRouter();
  const [auctions, setAuctions] = useState<AuctionWithVegetable[]>([]);
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isFarmer) {
      router.push('/');
    }
  }, [authLoading, isFarmer, router]);

  useEffect(() => {
    if (isFarmer) {
      fetchData();
    }
  }, [isFarmer]);

  const fetchData = async () => {
    try {
      // Fetch vegetables first
      const vegResponse = await fetch('/api/vegetables');
      if (vegResponse.ok) {
        const vegData = await vegResponse.json();
        setVegetables(vegData);

        // Fetch auctions
        const auctionResponse = await fetch('/api/auctions/my-auctions');
        if (auctionResponse.ok) {
          const auctionData = await auctionResponse.json();
          
          // Enrich auctions with vegetable data
          const enriched = auctionData.map((auction: Auction) => ({
            ...auction,
            vegetable: vegData.find((v: Vegetable) => v.id === auction.vegetableId),
          }));
          
          setAuctions(enriched);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = endTime - now;
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (auction: Auction) => {
    if (auction.status === 'completed') return 'bg-gray-100 border-gray-300';
    
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = auction.endTime - now;
    
    if (timeLeft < 3600) return 'bg-red-50 border-red-300'; // < 1 hour
    if (timeLeft < 7200) return 'bg-yellow-50 border-yellow-300'; // < 2 hours
    return 'bg-green-50 border-green-300';
  };

  if (authLoading || loading) {
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

  const activeAuctions = auctions.filter(a => a.status === 'active');
  const completedAuctions = auctions.filter(a => a.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Auctions</h1>
            <Link
              href="/farmer/auctions/create"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              + Create New Auction
            </Link>
          </div>

          {/* Active Auctions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Active Auctions ({activeAuctions.length})
            </h2>
            
            {activeAuctions.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500 mb-4">No active auctions</p>
                <Link
                  href="/farmer/auctions/create"
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Create your first auction
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeAuctions.map((auction) => (
                  <div
                    key={auction.id}
                    className={`border-2 rounded-lg overflow-hidden shadow-md ${getStatusColor(auction)}`}
                  >
                    {auction.vegetable?.image && (
                      <div className="h-48 bg-white flex items-center justify-center p-4">
                        <img
                          src={auction.vegetable.image}
                          alt={auction.vegetable.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}
                    <div className="p-4 bg-white">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {auction.vegetable?.name || 'Unknown'}
                      </h3>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="text-gray-600">
                          <strong>Quantity:</strong> {auction.quantity} kg
                        </p>
                        <p className="text-gray-600">
                          <strong>Base Price:</strong> ₹{auction.basePrice.toFixed(2)}/kg
                        </p>
                        {auction.currentBid ? (
                          <p className="text-green-700 font-semibold">
                            <strong>Current Bid:</strong> ₹{auction.currentBid.toFixed(2)}/kg
                          </p>
                        ) : (
                          <p className="text-gray-500 italic">No bids yet</p>
                        )}
                        <p className="text-gray-700 font-medium">
                          <strong>Ends in:</strong> {getTimeRemaining(auction.endTime)}
                        </p>
                      </div>
                      <Link
                        href={`/farmer/auctions/${auction.id}`}
                        className="mt-4 block w-full bg-green-600 hover:bg-green-700 text-white text-center px-4 py-2 rounded-md text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Auctions */}
          {completedAuctions.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Completed Auctions ({completedAuctions.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedAuctions.map((auction) => (
                  <div
                    key={auction.id}
                    className="border-2 border-gray-300 rounded-lg overflow-hidden shadow-md bg-gray-50 opacity-75"
                  >
                    {auction.vegetable?.image && (
                      <div className="h-48 bg-white flex items-center justify-center p-4">
                        <img
                          src={auction.vegetable.image}
                          alt={auction.vegetable.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}
                    <div className="p-4 bg-white">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {auction.vegetable?.name || 'Unknown'}
                      </h3>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="text-gray-600">
                          <strong>Quantity:</strong> {auction.quantity} kg
                        </p>
                        <p className="text-gray-600">
                          <strong>Base Price:</strong> ₹{auction.basePrice.toFixed(2)}/kg
                        </p>
                        {auction.currentBid ? (
                          <p className="text-blue-700 font-semibold">
                            <strong>Final Price:</strong> ₹{auction.currentBid.toFixed(2)}/kg
                          </p>
                        ) : (
                          <p className="text-gray-500 italic">No bids received</p>
                        )}
                        <p className="text-gray-500">
                          <strong>Status:</strong> Completed
                        </p>
                      </div>
                      <Link
                        href={`/farmer/auctions/${auction.id}`}
                        className="mt-4 block w-full bg-gray-400 hover:bg-gray-500 text-white text-center px-4 py-2 rounded-md text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
