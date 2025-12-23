"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Plus } from "lucide-react";
import AddEditModal from "./AddEditModal";

interface NewspaperItem {
  id: string;
  name: string;
  type: string;
  noColPerPage: number;
  colWidth: number;
  colHeight: number;
  minAdHeight: number;
  tintAdditionalCharge: number;
}

export default function AdminNewspapers() {
  const [list, setList] = useState<NewspaperItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<NewspaperItem | null>(null);

  // Load data
  const loadData = async () => {
    const res = await fetch("/api/newspapers");
    const data = await res.json();
    setList(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const deleteItem = async (id: string) => {
    await fetch(`/api/newspapers/${id}`, { method: "DELETE" });
    loadData();
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Newspaper Management</h2>
          <button
            onClick={() => {
              setEditItem(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow"
          >
            <Plus className="w-5 h-5" /> Add Newspaper
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {list.map((paper) => (
            <div key={paper.id} className="bg-white rounded-2xl p-6 shadow">
              <h3 className="text-xl font-bold">{paper.name}</h3>
              <p className="text-gray-500 capitalize">Type: {paper.type}</p>

              <div className="text-sm mt-3 space-y-1">
                <p>
                  <strong>Columns:</strong> {paper.noColPerPage}
                </p>
                <p>
                  <strong>Size:</strong> {paper.colWidth} × {paper.colHeight}
                </p>
                <p>
                  <strong>Min Ad Height:</strong> {paper.minAdHeight} cm
                </p>
                <p>
                  <strong>Tint Charge:</strong> Rs. {paper.tintAdditionalCharge}
                </p>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setEditItem(paper);
                    setModalOpen(true);
                  }}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black py-2 rounded-lg"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteItem(paper.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {modalOpen && (
        <AddEditModal
          item={editItem}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
