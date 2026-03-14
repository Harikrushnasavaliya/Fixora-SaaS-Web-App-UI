import { useState } from "react";
import { apiPost } from "../lib/api";

export function ProviderDashboard() {
  const [service_name, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [category_id, setCategoryId] = useState("");

  const createService = async () => {
    const data = await apiPost("/api/services", {
      service_name,
      description,
      price,
      category_id,
    });

    alert("✅ Service created!");
    setServiceName("");
    setDescription("");
    setPrice(0);
    setCategoryId("");
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Provider Dashboard</h1>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-3">Add New Service</h2>

        <input
          className="border p-2 w-full mb-2"
          placeholder="Service name"
          value={service_name}
          onChange={(e) => setServiceName(e.target.value)}
        />

        <textarea
          className="border p-2 w-full mb-2"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-2"
          placeholder="Price"
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />

        <input
          className="border p-2 w-full mb-3"
          placeholder="Category ID (ObjectId)"
          value={category_id}
          onChange={(e) => setCategoryId(e.target.value)}
        />

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={createService}
        >
          Create Service
        </button>
      </div>
    </div>
  );
}
