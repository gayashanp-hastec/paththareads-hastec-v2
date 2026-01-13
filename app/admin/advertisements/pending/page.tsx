"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { X } from "lucide-react";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface AdminAdvertisementsPending {
  reference_number: string;
  newspaper_name: string;
  advertiser_name: string;

  ad_type: string;
  classified_category?: string;
  subcategory?: string;

  publish_date?: string;
  created_at: string;
  updated_at?: string;

  advertisement_text: string;
  special_notes?: string;

  background_color?: boolean;
  post_in_web?: boolean;

  upload_image?: string;
  price?: string;
  status: string;
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
  const [requestImageChange, setRequestImageChange] = useState(false);

  const ACTION_BTN_CLASS =
    "flex items-center justify-center gap-2 w-40 px-4 py-2.5 rounded-lg shadow text-sm font-medium transition";

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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
          ad.status.toLowerCase() === "resubmitted" ||
          ad.status.toLowerCase() === "updateimage"
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
        ad.status.toLowerCase().includes(search.toLowerCase()) ||
        ad.advertiser_name.toLowerCase().includes(search.toLowerCase())
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

  const totalPages = Math.ceil(filteredAds.length / ITEMS_PER_PAGE);

  const paginatedAds = filteredAds.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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

    // Refresh list after update
    const refreshed = await fetch("/api/ads");
    const data = await refreshed.json();
    const pendingAds = data.filter(
      (ad: AdminAdvertisementsPending) =>
        ad.status.toLowerCase() === "pending" ||
        ad.status.toLowerCase() === "resubmitted" ||
        ad.status.toLowerCase() === "updateimage"
    );
    setAds(pendingAds);
  };

  const isTextChanged = editedText.trim() !== originalText.trim();

  function InfoRow({ label, value }: { label: string; value?: string }) {
    if (!value) return null;
    return (
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-0.5 text-sm text-gray-800">{value}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 overflow-auto space-y-6">
        <h4 className="text-right font-semibold text-gray-600">
          Paththare Ads Admin
        </h4>

        <h2 className="text-2xl font-bold">Pending Advertisements</h2>

        {/* Filter controls */}
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by reference, name, paper, or status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border px-4 py-2 text-sm
               focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]
               sm:max-w-md"
          />

          <div className="flex flex-wrap gap-3">
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
              defaultValue="all"
              className="rounded-xl border px-4 py-2 text-sm"
            >
              <option value="all">Show All Statuses</option>
              <option value="pending">Pending</option>
              <option value="resubmitted">Resubmitted</option>
            </select>

            {/* Sort */}
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="rounded-xl border px-4 py-2 text-sm"
            >
              <option value="created_at">Sort by Date</option>
              <option value="newspaper_name">Sort by Newspaper</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white shadow rounded-lg mt-4">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Advertiser Name</th>
                <th className="px-4 py-3">Newspaper</th>
                {/* <th className="px-4 py-3">Advertiser ID</th> */}
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                paginatedAds.map((ad) => (
                  <tr
                    key={ad.reference_number}
                    onClick={() => openModal(ad)}
                    className="hover:bg-blue-50 cursor-pointer border-b"
                  >
                    <td className="px-4 py-2 font-mono">
                      {ad.reference_number}
                    </td>
                    <td className="px-4 py-2 font-mono">
                      {ad.advertiser_name}
                    </td>
                    <td className="px-4 py-2">{ad.newspaper_name}</td>
                    {/* <td className="px-4 py-2">{ad.advertiser_id}</td> */}
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

        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && selectedAd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100 animate-fadeIn">
              {/* Header */}
              <div className="flex items-start justify-between px-8 py-6 border-b bg-[var(--color-primary-dark)] text-white">
                <div>
                  <h3 className="text-xl font-semibold">
                    Ref:{" "}
                    <span className="font-mono">
                      {selectedAd.reference_number}
                    </span>
                  </h3>
                  <p className="mt-1 opacity-80">
                    Advertiser:{" "}
                    <span className="font-bold">
                      {selectedAd.advertiser_name}
                    </span>
                  </p>
                  <p className="mt-1 opacity-80">
                    Created at:{" "}
                    <span className="font-bold">
                      {new Date(selectedAd.created_at).toLocaleString()}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xm font-medium
          ${
            selectedAd.status === "Approved"
              ? "bg-green-500/20 text-green-300"
              : selectedAd.status === "Declined"
              ? "bg-red-500/20 text-red-300"
              : "bg-yellow-500/20 text-yellow-300"
          }
        `}
                  >
                    {selectedAd.status}
                  </span>

                  <button
                    onClick={closeModal}
                    className="text-white/70 hover:text-white transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
                {/* Left: Details */}
                <div className="lg:col-span-1 space-y-5 text-sm">
                  <InfoRow
                    label="Newspaper"
                    value={selectedAd.newspaper_name}
                  />
                  <InfoRow label="Category" value={selectedAd.ad_type} />
                  <InfoRow
                    label="Category"
                    value={selectedAd.classified_category}
                  />
                  <InfoRow label="Subcategory" value={selectedAd.subcategory} />
                  {selectedAd.publish_date && (
                    <>
                      <InfoRow
                        label="Date to be Published"
                        value={new Date(selectedAd.publish_date).toDateString()}
                      />
                    </>
                  )}
                  {selectedAd.special_notes && (
                    <div>
                      <p className="font-medium text-[var(--color-text-dark-highlight)]">
                        Special Notes
                      </p>
                      <p className="mt-1 text-gray-600 leading-relaxed">
                        {selectedAd.special_notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: Editable Text */}
                <div className="lg:col-span-2">
                  <p className="mb-2 text-sm font-medium text-[var(--color-text-dark-highlight)]">
                    Advertisement Content
                  </p>

                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full h-56 rounded-xl border border-gray-300 p-4 text-gray-800
                     focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"
                  />
                </div>
              </div>

              {/* Image */}
              {selectedAd.upload_image && (
                <div className="px-8 pb-4 flex items-center justify-between gap-4 border-t">
                  <a
                    href={selectedAd.upload_image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[var(--color-primary-dark)] hover:underline"
                  >
                    View Uploaded Image
                  </a>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={requestImageChange}
                      onChange={(e) => setRequestImageChange(e.target.checked)}
                    />
                    Request Image Change
                  </label>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 px-8 py-5 border-t bg-gray-50">
                <button
                  onClick={() => updateStatus("Declined")}
                  className={`${ACTION_BTN_CLASS} bg-red-600 text-white hover:bg-red-700`}
                >
                  <XCircle className="w-4 h-4" />
                  Decline
                </button>

                {(isTextChanged || requestImageChange) && (
                  <button
                    onClick={() =>
                      updateStatus(
                        requestImageChange ? "UpdateImage" : "Revision"
                      )
                    }
                    className={`${ACTION_BTN_CLASS} bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-accent)]`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Request Revision
                  </button>
                )}

                {!isTextChanged && !requestImageChange && (
                  <button
                    onClick={() => updateStatus("Approved")}
                    className={`${ACTION_BTN_CLASS} bg-green-600 text-white hover:bg-green-700`}
                  >
                    <CheckCircle className="w-4 h-4" />
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
