"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface Vegetable {
  id: string;
  name: string;
  price: number;
  image: string | null;
  description: string | null;
}

interface CartItem {
  vegetableId: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
}

export default function RetailerVegetablesPage() {
  const { user, loading: authLoading, isRetailer } = useAuth();
  const router = useRouter();
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVegetable, setSelectedVegetable] = useState<Vegetable | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [viewDetails, setViewDetails] = useState(false);

  useEffect(() => {
    if (!authLoading && !isRetailer) {
      router.push("/");
    }
  }, [authLoading, isRetailer, router]);

  useEffect(() => {
    fetchVegetables();
    // Load cart from localStorage
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [isRetailer]);

  useEffect(() => {
    // Save cart to localStorage
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const fetchVegetables = async () => {
    try {
      const response = await fetch("/api/vegetables");
      if (response.ok) {
        const data = await response.json();
        setVegetables(data);
      }
    } catch (error) {
      console.error("Error fetching vegetables:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (vegetable: Vegetable) => {
    const existingItem = cart.find((item) => item.vegetableId === vegetable.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.vegetableId === vegetable.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          vegetableId: vegetable.id,
          name: vegetable.name,
          price: vegetable.price,
          quantity: 1,
          image: vegetable.image,
        },
      ]);
    }
  };

  const updateQuantity = (vegetableId: string, delta: number) => {
    setCart(
      cart
        .map((item) =>
          item.vegetableId === vegetableId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
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

  if (!isRetailer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Available Vegetables</h1>
            <Link
              href="/retailer/cart"
              className="relative bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Cart
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vegetables.map((vegetable) => (
              <div
                key={vegetable.id}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                {vegetable.image && (
                  <img
                    src={vegetable.image}
                    alt={vegetable.name}
                    className="w-full h-48 object-cover cursor-pointer"
                    onClick={() => {
                      setSelectedVegetable(vegetable);
                      setViewDetails(true);
                    }}
                  />
                )}
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900">
                    {vegetable.name}
                  </h3>
                  <p className="text-2xl font-bold text-indigo-600 mt-2">
                    ${vegetable.price.toFixed(2)}
                  </p>
                  {vegetable.description && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {vegetable.description}
                    </p>
                  )}
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedVegetable(vegetable);
                        setViewDetails(true);
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => addToCart(vegetable)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {vegetables.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No vegetables available.</p>
            </div>
          )}
        </div>
      </div>

      {/* Vegetable Details Modal */}
      {viewDetails && selectedVegetable && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedVegetable.name}
                </h3>
                <p className="text-3xl font-bold text-indigo-600 mt-2">
                  ${selectedVegetable.price.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => {
                  setViewDetails(false);
                  setSelectedVegetable(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedVegetable.image && (
              <img
                src={selectedVegetable.image}
                alt={selectedVegetable.name}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
            )}

            {selectedVegetable.description && (
              <p className="text-gray-700 mb-4">{selectedVegetable.description}</p>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  addToCart(selectedVegetable);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Add to Cart
              </button>
              <Link
                href="/retailer/cart"
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium text-center"
              >
                Go to Cart
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
