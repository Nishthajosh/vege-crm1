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
  quantity: number;
  unit: string;
  image: string | null;
  description: string | null;
}

export default function VegetablesPage() {
  const { user, loading: authLoading, isBroker } = useAuth();
  const router = useRouter();
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVegetable, setEditingVegetable] = useState<Vegetable | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
    unit: "kg",
    image: "",
    description: "",
  });

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!isBroker) {
      router.replace("/");
    }
  }, [authLoading, isBroker, router, user]);

  useEffect(() => {
    fetchVegetables();
  }, [isBroker]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingVegetable
        ? `/api/vegetables/${editingVegetable.id}`
        : "/api/vegetables";
      const method = editingVegetable ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingVegetable(null);
        setFormData({ name: "", price: "", quantity: "", unit: "kg", image: "", description: "" });
        fetchVegetables();
      }
    } catch (error) {
      console.error("Error saving vegetable:", error);
    }
  };

  const handleEdit = (vegetable: Vegetable) => {
    setEditingVegetable(vegetable);
    setFormData({
      name: vegetable.name,
      price: vegetable.price.toString(),
      quantity: vegetable.quantity?.toString() || "",
      unit: vegetable.unit || "kg",
      image: vegetable.image || "",
      description: vegetable.description || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vegetable?")) {
      return;
    }

    try {
      const response = await fetch(`/api/vegetables/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchVegetables();
      }
    } catch (error) {
      console.error("Error deleting vegetable:", error);
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

  if (!isBroker) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Manage Vegetables
              </h1>
              <Link
                href="/broker/dashboard"
                className="inline-flex items-center text-primary hover:text-primary/80 mt-2"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Dashboard
              </Link>
            </div>
            <button
              onClick={() => {
                setEditingVegetable(null);
                setFormData({ name: "", price: "", quantity: "", unit: "kg", image: "", description: "" });
                setShowModal(true);
              }}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-md text-sm font-medium"
            >
              + Add Product
            </button>
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
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900">
                    {vegetable.name}
                  </h3>
                  <p className="text-2xl font-bold text-primary mt-2">
                    ₹{vegetable.price.toFixed(2)}/{vegetable.unit}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Stock: {vegetable.quantity} {vegetable.unit}
                  </p>
                  {vegetable.description && (
                    <p className="text-sm text-gray-500 mt-2">
                      {vegetable.description}
                    </p>
                  )}
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => handleEdit(vegetable)}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(vegetable.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {vegetables.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No vegetables found. Add one to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-lg shadow-lg rounded-md bg-white my-10">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {editingVegetable ? "Edit Product" : "Add New Product"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vegetable Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                    placeholder="e.g., Tomato, Potato"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit *
                    </label>
                    <select
                      required
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="piece">piece</option>
                      <option value="dozen">dozen</option>
                      <option value="bunch">bunch</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity (in {formData.unit}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                    placeholder="Available stock"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                    rows={3}
                    placeholder="Brief description about the vegetable..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                    placeholder="/vegetables/tomato.svg"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Available: tomato.svg, potato.svg, carrot.svg, onion.svg, cabbage.svg, cucumber.svg
                  </p>
                  {formData.image && (
                    <div className="mt-2">
                      <img src={formData.image} alt="Preview" className="w-20 h-20 object-cover rounded border" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {editingVegetable ? "Update Product" : "Create Product"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingVegetable(null);
                    setFormData({ name: "", price: "", quantity: "", unit: "kg", image: "", description: "" });
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
