"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { X } from "lucide-react";

interface Advertisement {
  reference_number: string;
  newspaper_name: string;
  advertiser_id: number;
  ad_type: string;
  created_at: string;
  status: string;
  advertisement_text: string;
}

export default function AdminAdvertisements() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [filteredAds, setFilteredAds] = useState<Advertisement[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("created_at");
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
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
      setAds(data);
      setFilteredAds(data);
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
        : a[sortKey as keyof Advertisement] > b[sortKey as keyof Advertisement]
        ? 1
        : -1
    );
    setFilteredAds(updated);
  }, [search, ads, sortKey]);

  const openModal = (ad: Advertisement) => {
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

    const refreshed = await fetch("/api/ads");
    const data = await refreshed.json();
    setAds(data);
  };

  // Check if text changed
  const isTextChanged = editedText.trim() !== originalText.trim();
  const statusColorHandler = (status_: string) => {
    switch (status_) {
      case "Approved":
        return "text-green-600";
      case "Declined":
        return "text-gray-600";
      case "Resubmitted":
        return "text-blue-600";
      case "Revision":
        return "text-fuchsia-800";
      case "PaymentPending":
        return "text-amber-600";
      case "Pending":
        return "text-red-700 font-bold";
      case "Print":
        return "text-violet-950";
      default:
        return "text-black-900";
    }
  };

  return (
    <div className="flex min-h-screen text-violet-950 bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 overflow-auto space-y-6">
        <h4 className="text-right font-semibold text-gray-600">
          Paththare Ads Admin
        </h4>

        <h2 className="text-2xl font-bold">Advertisements</h2>

        {/* Filter controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Search by reference, paper, or status..."
            className="border rounded-lg px-4 py-2 w-full md:w-1/2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

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
            <option value="approved">Approved</option>
            <option value="paymentpending">Payment Pending</option>
            <option value="revision">Revision</option>
            <option value="declined">Declined</option>
            <option value="canelled">Cancelled</option>
            <option value="print">Sent to Print</option>
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
                    // onClick={() => {
                    //   if (ad.status.toLowerCase() === "pending") {
                    //     openModal(ad);
                    //   } else if (ad.status.toLowerCase() === "approved") {
                    //     alert("Already approved");
                    //   }
                    // }}
                    onClick={() => {
                      openModal(ad);
                    }}
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
                    <td
                      className={`px-4 py-2 font-semibold ${statusColorHandler(
                        ad.status
                      )}`}
                    >
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
              {/* Close button */}
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

              {["Pending", "Revision", "Resubmitted"].includes(
                selectedAd.status
              ) && (
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full border rounded-xl p-4 h-48 focus:ring-2 focus:ring-blue-300 outline-none text-gray-800 resize-none"
                />
              )}

              <div className="flex justify-end gap-3 mt-6">
                {["Pending", "Revision", "Resubmitted"].includes(
                  selectedAd.status
                ) && (
                  <button
                    onClick={() => updateStatus("Declined")}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg shadow transition"
                  >
                    Decline
                  </button>
                )}

                {["Pending", "Revision", "Resubmitted"].includes(
                  selectedAd.status
                ) &&
                  isTextChanged && (
                    <button
                      onClick={() => updateStatus("Revision")}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg shadow transition"
                    >
                      Resubmit
                    </button>
                  )}

                {["Pending", "Resubmitted"].includes(selectedAd.status) &&
                  !isTextChanged && (
                    <button
                      onClick={() => updateStatus("Approved")}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg shadow transition"
                    >
                      Approve
                    </button>
                  )}

                {["Pending", "Resubmitted"].includes(selectedAd.status) &&
                  !isTextChanged && (
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
