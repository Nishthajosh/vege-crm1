"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface CartItem {
  vegetableId: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
}

export default function CartPage() {
  const { user, loading: authLoading, isRetailer } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderName, setOrderName] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    if (!authLoading && !isRetailer) {
      router.push("/");
    }
  }, [authLoading, isRetailer, router]);

  useEffect(() => {
    // Set default date to today
    const today = new Date().toISOString().split("T")[0];
    setOrderDate(today);
    
    // Load cart from localStorage
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    setLoading(false);
  }, [isRetailer]);

  const updateQuantity = (vegetableId: string, delta: number) => {
    const newCart = cart
      .map((item) =>
        item.vegetableId === vegetableId
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
      .filter((item) => item.quantity > 0);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const removeItem = (vegetableId: string) => {
    const newCart = cart.filter((item) => item.vegetableId !== vegetableId);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const getTotalQuantity = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handlePlaceOrder = async () => {
    if (!orderName.trim()) {
      alert("Please enter your name");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    setPlacingOrder(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: orderDate,
          name: orderName,
          quantity: getTotalQuantity(),
          totalPrice: getTotalPrice(),
          items: cart.map((item) => ({
            vegetableId: item.vegetableId,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      if (response.ok) {
        // Clear cart
        setCart([]);
        localStorage.removeItem("cart");
        
        alert("Order placed successfully!");
        router.push("/retailer/vegetables");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to place order");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <Link
              href="/retailer/vegetables"
              className="text-indigo-600 hover:text-indigo-700"
            >
              Continue Shopping
            </Link>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Your cart is empty.</p>
              <Link
                href="/retailer/vegetables"
                className="text-indigo-600 hover:text-indigo-700"
              >
                Browse Vegetables
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      Cart Items
                    </h2>
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div
                          key={item.vegetableId}
                          className="flex items-center space-x-4 border-b pb-4 last:border-0 last:pb-0"
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              ${item.price.toFixed(2)} each
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.vegetableId, -1)}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                            >
                              -
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.vegetableId, 1)}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                            <button
                              onClick={() => removeItem(item.vegetableId)}
                              className="text-xs text-red-600 hover:text-red-700 mt-1"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white shadow rounded-lg sticky top-4">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      Order Summary
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          required
                          value={orderDate}
                          onChange={(e) => setOrderDate(e.target.value)}
                          className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Your Name
                        </label>
                        <input
                          type="text"
                          required
                          value={orderName}
                          onChange={(e) => setOrderName(e.target.value)}
                          placeholder="Enter your name"
                          className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Total Quantity</span>
                          <span>{getTotalQuantity()}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-gray-900">
                          <span>Total Price</span>
                          <span>${getTotalPrice().toFixed(2)}</span>
                        </div>
                      </div>

                      <button
                        onClick={handlePlaceOrder}
                        disabled={placingOrder || !orderName.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        {placingOrder ? "Placing Order..." : "Place Order"}
                      </button>
                    </div>
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
