"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { X } from "lucide-react";

interface AdminAdvertisementsPending {
  reference_number: string;
  newspaper_name: string;
  advertiser_id: number;
  ad_type: string;
  created_at: string;
  status: string;
  advertisement_text: string;
}

export default function AdminAdvertisementsPending() {
  const [ads, setAds] = useState<AdminAdvertisementsPending[]>([]);
  const [filteredAds, setFilteredAds] = useState<AdminAdvertisementsPending[]>(
    []
  );
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("created_at");
  const [selectedAd, setSelectedAd] =
    useState<AdminAdvertisementsPending | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [originalText, setOriginalText] = useState("");

  // Fetch ads
  useEffect(() => {
    const fetchAds = async () => {
      setLoading(true);
      const res = await fetch("/api/ads");
      const data = await res.json();

      // ✅ Filter only Pending ads
      const pendingAds = data.filter(
        (ad: AdminAdvertisementsPending) =>
          ad.status.toLowerCase() === "pending" ||
          ad.status.toLowerCase() === "resubmitted"
      );

      setAds(pendingAds);
      setFilteredAds(pendingAds);
      setLoading(false);
    };
    fetchAds();
  }, []);

  // Filtering + sorting
  useEffect(() => {
    let updated = ads.filter(
      (ad) =>
        ad.reference_number.toLowerCase().includes(search.toLowerCase()) ||
        ad.newspaper_name.toLowerCase().includes(search.toLowerCase()) ||
        ad.status.toLowerCase().includes(search.toLowerCase())
    );
    updated.sort((a, b) =>
      sortKey === "created_at"
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : a[sortKey as keyof AdminAdvertisementsPending] >
          b[sortKey as keyof AdminAdvertisementsPending]
        ? 1
        : -1
    );
    setFilteredAds(updated);
  }, [search, ads, sortKey]);

  const openModal = (ad: AdminAdvertisementsPending) => {
    setSelectedAd(ad);
    setEditedText(ad.advertisement_text);
    setOriginalText(ad.advertisement_text);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedAd(null);
    setIsModalOpen(false);
  };

  const updateStatus = async (status: string) => {
    if (!selectedAd) return;

    const res = await fetch(`/api/ads/updateStatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference_number: selectedAd.reference_number,
        status,
        advertisement_text: editedText,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert("Failed to update ad: " + (result.error || "Unknown error"));
      return;
    }

    alert("Advertisement updated successfully!");
    closeModal();

    // Refresh list after update (still only show pending)
    const refreshed = await fetch("/api/ads");
    const data = await refreshed.json();
    const pendingAds = data.filter(
      (ad: AdminAdvertisementsPending) =>
        ad.status.toLowerCase() === "pending" ||
        ad.status.toLowerCase() === "resubmitted"
    );
    setAds(pendingAds);
  };

  const isTextChanged = editedText.trim() !== originalText.trim();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 overflow-auto space-y-6">
        <h4 className="text-right font-semibold text-gray-600">
          Paththare Ads Admin
        </h4>

        <h2 className="text-2xl font-bold">Pending Advertisements</h2>

        {/* Filter controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Search by reference, paper, or status..."
            className="border rounded-lg px-4 py-2 w-full md:w-1/2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {/* Status Filter */}
          <select
            onChange={(e) =>
              setFilteredAds(
                ads.filter((ad) =>
                  e.target.value === "all"
                    ? true
                    : ad.status.toLowerCase() === e.target.value.toLowerCase()
                )
              )
            }
            className="border rounded-lg px-3 py-2 w-full md:w-1/4"
            defaultValue="all"
          >
            <option value="all">Show All Statuses</option>
            <option value="pending">Pending</option>
            <option value="resubmitted">Resubmitted</option>
          </select>

          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="created_at">Sort by Date</option>
            <option value="newspaper_name">Sort by Newspaper</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white shadow rounded-lg mt-4">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Newspaper</th>
                <th className="px-4 py-3">Advertiser ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                filteredAds.map((ad) => (
                  <tr
                    key={ad.reference_number}
                    onClick={() => openModal(ad)}
                    className="hover:bg-blue-50 cursor-pointer border-b"
                  >
                    <td className="px-4 py-2 font-mono">
                      {ad.reference_number}
                    </td>
                    <td className="px-4 py-2">{ad.newspaper_name}</td>
                    <td className="px-4 py-2">{ad.advertiser_id}</td>
                    <td className="px-4 py-2">{ad.ad_type}</td>
                    <td className="px-4 py-2">
                      {new Date(ad.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 font-semibold text-gray-600">
                      {ad.status}
                    </td>
                  </tr>
                ))}
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    Loading...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {isModalOpen && selectedAd && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-4xl p-8 rounded-2xl shadow-2xl relative animate-fadeIn border border-gray-100">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-black transition"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-2xl font-semibold mb-6 text-gray-800">
                Advertisement Details
              </h3>

              <p className="mb-3 text-sm text-gray-600">
                Reference:{" "}
                <span className="font-mono text-gray-800">
                  {selectedAd.reference_number}
                </span>
              </p>

              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full border rounded-xl p-4 h-48 focus:ring-2 focus:ring-blue-300 outline-none text-gray-800 resize-none"
              />

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => updateStatus("Declined")}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg shadow transition"
                >
                  Decline
                </button>

                {isTextChanged && (
                  <button
                    onClick={() => updateStatus("Revision")}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg shadow transition"
                  >
                    Request Revision
                  </button>
                )}

                {!isTextChanged && (
                  <button
                    onClick={() => updateStatus("Approved")}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg shadow transition"
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
