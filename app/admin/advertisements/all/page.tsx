"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { X } from "lucide-react";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Printer,
  Image as ImageIcon,
} from "lucide-react";

interface Advertisement {
  reference_number: string;

  newspaper_name: string;
  language?: string;
  id?: string;

  advertiser_name: string;
  advertiser_nic?: string;
  advertiser_phone?: string;
  advertiser_address?: string;

  ad_type: string;
  classified_category?: string;
  subcategory?: string;

  publish_date?: string | null;
  created_at: string;
  updated_at?: string | null;

  advertisement_text: string;
  special_notes?: string | null;

  background_color?: boolean | null;
  post_in_web?: boolean | null;
  upload_image?: string | null;
  uploaded_images?: string[] | null;

  price?: number | null;
  status: string;

  casual_ad?: {
    ad_size: string;
    no_of_columns: number;
    ad_height: number;
    color_option: string;
    has_artwork: boolean;
    need_artwork: boolean;
    no_of_boxes: number; // only exists in set 1
  } | null;

  classified_ad?: {
    is_publish_eng: boolean;
    is_publish_tam: boolean;
    is_priority: boolean;
    is_publish_sin: boolean;
    is_publish_sin_eng: boolean;
    is_publish_sin_tam: boolean;
    is_publish_eng_tam: boolean;
    is_co_paper: boolean;
    is_int_bw: boolean;
    is_int_fc: boolean;
    is_int_highlight?: boolean; // only exists in set 1
  } | null;

  payment?: {
    amount?: number | null;
    status?: string | null;
    payment_date?: string | null;
    verified_by?: string | null;
    remarks?: string | null;
    file_path: string | null;
    original_filename?: string | null;
    created_at: string;
  } | null;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [requestPriceChange, setRequestPriceChange] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [priceReason, setPriceReason] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 15;

  const [requestImageChange, setRequestImageChange] = useState(false);

  const ACTION_BTN_CLASS =
    "flex items-center justify-center gap-2 w-40 px-4 py-2.5 rounded-lg shadow text-sm font-medium transition";

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
        ad.status.toLowerCase().includes(search.toLowerCase()),
    );
    updated.sort((a, b) => {
      if (sortKey === "created_at") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      const aValue = String(a[sortKey as keyof Advertisement] ?? "");
      const bValue = String(b[sortKey as keyof Advertisement] ?? "");

      return aValue.localeCompare(bValue);
    });

    setFilteredAds(updated);
  }, [search, ads, sortKey]);

  const totalPages = Math.ceil(filteredAds.length / ITEMS_PER_PAGE);

  const paginatedAds = filteredAds.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

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

  function InfoRow({ label, value }: { label: string; value?: string }) {
    if (!value) return null;
    return (
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-0.5 text-sm text-gray-800">{value}</p>
      </div>
    );
  }

  const formatDateYMD = (dateStr: string) => {
    const [year, month, day] = dateStr.split("T")[0].split("-");
    return `${year}-${month}-${day}`;
  };

  const formatColorType = (value: string): string => {
    switch (value?.toLowerCase()) {
      case "full":
        return "F/C";
      case "bw":
        return "BW";
      case "bw1":
        return "BW+1 color";
      case "bw2":
        return "BW+2 colors";
      default:
        return value; // fallback (safe)
    }
  };

  const handlePrint = async () => {
    console.log(selectedAd);
    if (!selectedAd) return;

    // Trim + split by ONE OR MORE SPACES
    const words = selectedAd.advertisement_text.trim().split(/\s+/); // space-separated words

    const wordCount = words.length;

    const res = await fetch("/api/ads/print", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        /* ---------------- Core identifiers ---------------- */
        reference_number: selectedAd.reference_number,
        newspaper_name: selectedAd.newspaper_name,
        language: selectedAd.language,

        newspaper_id: selectedAd.newspaper_name
          ?.trim()
          .toUpperCase()
          .replace(/\s+/g, "_"),

        /* ---------------- Advertiser details ---------------- */
        advertiser_name: selectedAd.advertiser_name,
        advertiser_nic: selectedAd.advertiser_nic ?? null,
        advertiser_phone: selectedAd.advertiser_phone ?? null,
        advertiser_address: selectedAd.advertiser_address ?? null,

        /* ---------------- Ad classification ---------------- */
        ad_type: selectedAd.ad_type,
        category: selectedAd.classified_category ?? null,
        subcategory: selectedAd.subcategory ?? null,

        /* ---------------- Dates ---------------- */
        publish_date: formatDateYMD(
          selectedAd.publish_date ? selectedAd.publish_date : "",
        ),
        created_at: selectedAd.created_at,
        updated_at: selectedAd.updated_at ?? null,

        /* ---------------- Text & content ---------------- */
        advertisement_text: selectedAd.advertisement_text,
        advertisement_words: words,
        word_count: wordCount,
        special_notes: selectedAd.special_notes ?? null,

        /* ---------------- Flags ---------------- */
        background_color: selectedAd.background_color ?? null,
        post_in_web: selectedAd.post_in_web ?? null,

        /* ---------------- Media ---------------- */
        upload_image: selectedAd.upload_image ?? null,

        /* ---------------- Pricing & status ---------------- */
        price: selectedAd.price ?? null,
        status: selectedAd.status,

        /* ---------------- Casual Ad ---------------- */
        casual_ad: selectedAd.casual_ad
          ? {
              ad_size: selectedAd.casual_ad.ad_size,
              no_of_columns: selectedAd.casual_ad.no_of_columns,
              ad_height: selectedAd.casual_ad.ad_height,
              color_option: selectedAd.casual_ad.color_option,
              has_artwork: selectedAd.casual_ad.has_artwork,
              need_artwork: selectedAd.casual_ad.need_artwork,
              no_of_boxes: selectedAd.casual_ad.no_of_boxes,
            }
          : null,

        /* ---------------- Classified Ad ---------------- */
        classified_ad: selectedAd.classified_ad
          ? {
              is_publish_eng: selectedAd.classified_ad.is_publish_eng,
              is_publish_tam: selectedAd.classified_ad.is_publish_tam,
              is_priority: selectedAd.classified_ad.is_priority,
              is_publish_sin: selectedAd.classified_ad.is_publish_sin,
              is_publish_sin_eng: selectedAd.classified_ad.is_publish_sin_eng,
              is_publish_sin_tam: selectedAd.classified_ad.is_publish_sin_tam,
              is_publish_eng_tam: selectedAd.classified_ad.is_publish_eng_tam,
              is_co_paper: selectedAd.classified_ad.is_co_paper,
              is_int_bw: selectedAd.classified_ad.is_int_bw,
              is_int_fc: selectedAd.classified_ad.is_int_fc,
              is_int_highlight: selectedAd.classified_ad.is_int_highlight,
            }
          : null,
      }),
    });

    const blob = await res.blob();
    if (res.status !== 400) {
      updateStatus("Sent to Print");
    }
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const formatPublishDate = (dateStr: string) => {
    const date = new Date(dateStr);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    const weekday = date.toLocaleDateString("en-US", {
      weekday: "long",
    });

    return `${day}.${month}.${year} (${weekday})`;
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
                      : ad.status.toLowerCase() ===
                        e.target.value.toLowerCase(),
                  ),
                )
              }
              defaultValue="all"
              className="rounded-xl border px-4 py-2 text-sm"
            >
              <option value="all">Show All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="resubmitted">Resubmitted</option>
              <option value="print">Print</option>
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
                    // onClick={() => {
                    //   if (ad.status.toLowerCase() === "pending") {
                    //     openModal(ad);
                    //   } else if (ad.status.toLowerCase() === "approved") {
                    //     alert("Already approved");
                    //   }
                    // }}
                    onClick={() => {
                      console.log(selectedAd);
                      openModal(ad);
                    }}
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
                    <td
                      className={`px-4 py-2 font-semibold ${statusColorHandler(
                        ad.status,
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
              <div className="flex items-start justify-between px-8 py-6 border-b bg-(--color-primary-dark) text-white">
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
                    className={`rounded-full px-3 py-1 text-xm font-medium ${
                      selectedAd.status === "Approved"
                        ? "bg-green-500/20 text-green-300"
                        : selectedAd.status === "Declined"
                          ? "bg-red-500/20 text-red-300"
                          : "bg-yellow-500/20 text-yellow-300"
                    }`}
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
              <div className="flex max-h-[60vh] flex-col bg-white rounded-2xl shadow-xl">
                {/* SCROLLABLE CONTENT */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                  {selectedAd && (
                    <>
                      {/* CONTENT */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
                        {/* LEFT: DETAILS */}
                        <div className="lg:col-span-1 space-y-4 text-sm">
                          <div>
                            <InfoRow
                              label="Newspaper"
                              value={selectedAd.newspaper_name}
                            />

                            <div className="flex flex-wrap gap-2 mt-2">
                              {selectedAd.classified_ad?.is_publish_sin && (
                                <span className="rounded-full px-3 py-1 text-xs font-medium bg-amber-900/20 text-amber-700">
                                  Sinhala
                                </span>
                              )}

                              {selectedAd.classified_ad?.is_publish_eng && (
                                <span className="rounded-full px-3 py-1 text-xs font-medium bg-blue-500/20 text-blue-500">
                                  English
                                </span>
                              )}

                              {selectedAd.classified_ad?.is_publish_tam && (
                                <span className="rounded-full px-3 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-600">
                                  Tamil
                                </span>
                              )}

                              {selectedAd.classified_ad?.is_publish_sin_eng && (
                                <span className="rounded-full px-3 py-1 text-xs font-medium bg-purple-500/20 text-purple-600">
                                  Sinhala & English
                                </span>
                              )}

                              {selectedAd.classified_ad?.is_publish_sin_tam && (
                                <span className="rounded-full px-3 py-1 text-xs font-medium bg-green-500/20 text-green-600">
                                  Sinhala & Tamil
                                </span>
                              )}

                              {selectedAd.classified_ad?.is_publish_eng_tam && (
                                <span className="rounded-full px-3 py-1 text-xs font-medium bg-pink-500/20 text-pink-600">
                                  English & Tamil
                                </span>
                              )}
                            </div>
                          </div>

                          {selectedAd.publish_date && (
                            <InfoRow
                              label="Date to be Published"
                              value={formatPublishDate(selectedAd.publish_date)}
                            />
                          )}

                          <InfoRow label="Ad Type" value={selectedAd.ad_type} />
                          <InfoRow
                            label="Category"
                            value={selectedAd.classified_category}
                          />
                          <InfoRow
                            label="Subcategory"
                            value={selectedAd.subcategory}
                          />

                          {selectedAd.casual_ad && (
                            <>
                              <span
                                className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                                  selectedAd.casual_ad.no_of_boxes > 0
                                    ? "bg-green-500/20 text-green-600"
                                    : "bg-yellow-500/20 text-yellow-700"
                                }`}
                              >
                                {selectedAd.casual_ad.no_of_boxes > 0 &&
                                selectedAd.casual_ad.ad_size === ""
                                  ? "Box Ad"
                                  : "Column Ad"}
                              </span>

                              <InfoRow
                                label="Ad Size"
                                value={selectedAd.casual_ad.ad_size}
                              />

                              {selectedAd.casual_ad.ad_size.toLowerCase() ===
                                "custom" && (
                                <>
                                  <InfoRow
                                    label="No of Columns"
                                    value={selectedAd.casual_ad.no_of_columns.toString()}
                                  />
                                  <InfoRow
                                    label="Ad Height (cm)"
                                    value={selectedAd.casual_ad.ad_height.toString()}
                                  />
                                </>
                              )}

                              <InfoRow
                                label="Color Option"
                                value={selectedAd.casual_ad.color_option}
                              />

                              {(selectedAd.casual_ad.has_artwork ||
                                selectedAd.casual_ad.need_artwork) && (
                                <span
                                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                                    selectedAd.casual_ad.has_artwork
                                      ? "bg-green-500/20 text-green-600"
                                      : "bg-red-500/20 text-red-600"
                                  }`}
                                >
                                  {selectedAd.casual_ad.has_artwork
                                    ? "Has Artwork"
                                    : "Need Artwork"}
                                </span>
                              )}
                            </>
                          )}

                          {selectedAd.price && (
                            <InfoRow
                              label="Price"
                              value={String(selectedAd.price)}
                            />
                          )}

                          {selectedAd.payment &&
                            selectedAd.status === "PaymentPending" && (
                              <button
                                key={selectedAd.payment.file_path}
                                type="button"
                                onClick={() =>
                                  setPreviewImage(selectedAd.payment.file_path)
                                }
                                className="rounded-xl p-2 bg-amber-300"
                              >
                                View Payment Receipt
                              </button>
                            )}

                          {selectedAd.classified_ad?.is_priority && (
                            <span className="inline-block rounded-full px-3 py-1 text-xs font-medium bg-red-500/20 text-red-500">
                              Priority
                            </span>
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

                        {/* RIGHT: AD CONTENT */}
                        <div className="lg:col-span-2">
                          <p className="mb-2 text-sm font-medium text-[var(--color-text-dark-highlight)]">
                            Advertisement Content
                          </p>

                          <textarea
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            readOnly={[
                              "Print",
                              "Approved",
                              "Declined",
                              "Cancelled",
                              "PaymentPending",
                            ].includes(selectedAd.status || "")}
                            className={`w-full h-56 rounded-xl border p-4 text-gray-800 resize-none focus:ring-2 focus:ring-[var(--color-primary)] outline-none ${
                              [
                                "Print",
                                "Approved",
                                "Declined",
                                "Cancelled",
                                "PaymentPending",
                              ].includes(selectedAd.status || "")
                                ? "bg-gray-100 cursor-not-allowed"
                                : ""
                            }`}
                          />
                        </div>
                      </div>

                      {/* IMAGES */}
                      {selectedAd.uploaded_images &&
                        selectedAd.uploaded_images?.length > 0 && (
                          <div className="px-8 py-4 border-t space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                              {selectedAd.uploaded_images.map((url, index) => (
                                <button
                                  key={url}
                                  type="button"
                                  onClick={() => setPreviewImage(url)}
                                  className="group"
                                >
                                  <img
                                    src={url}
                                    alt={`Uploaded image ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg border group-hover:opacity-90 transition"
                                  />
                                  <p className="mt-1 text-xs text-center text-gray-500">
                                    Click to preview
                                  </p>
                                </button>
                              ))}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">
                                {selectedAd.uploaded_images.length} image(s)
                                uploaded
                              </span>

                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={requestImageChange}
                                  onChange={(e) =>
                                    setRequestImageChange(e.target.checked)
                                  }
                                />
                                Request Image Change
                              </label>
                            </div>
                          </div>
                        )}

                      {/* PRICE CHANGE */}
                      <div className="px-8 py-4 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium">
                              <input
                                type="checkbox"
                                checked={requestPriceChange}
                                onChange={(e) =>
                                  setRequestPriceChange(e.target.checked)
                                }
                                className="accent-[var(--color-primary)]"
                              />
                              Request Price Change
                            </label>
                            <p className="mt-2 text-xs text-gray-500">
                              Request a revision to the advertisement price.
                            </p>
                          </div>

                          {requestPriceChange && (
                            <div className="md:col-span-2 space-y-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                              <div>
                                <p className="text-sm font-medium">New Price</p>
                                <input
                                  type="number"
                                  value={newPrice}
                                  onChange={(e) => setNewPrice(e.target.value)}
                                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                                />
                              </div>

                              <div>
                                <p className="text-sm font-medium">
                                  Reason for Price Change
                                </p>
                                <textarea
                                  value={priceReason}
                                  onChange={(e) =>
                                    setPriceReason(e.target.value)
                                  }
                                  rows={3}
                                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-yellow-400"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              {/* Footer Actions */}
              <div className="border-t bg-gray-50 px-8 py-6">
                {/* Read-only text when finalized */}
                {/* {[
                  "Approved",
                  "Cancelled",
                  "Declined",
                  "PaymentPending",
                ].includes(selectedAd.status) && (
                  <textarea
                    value={editedText}
                    readOnly
                    className="mb-4 w-full h-40 rounded-xl border p-4 text-gray-800 resize-none bg-gray-100"
                  />
                )} */}

                {/* Image section */}
                {/* {selectedAd?.upload_image && (
                  <div className="mb-4 flex items-center justify-between">
                    <a
                      href={selectedAd.upload_image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-[var(--color-primary)]
                   px-4 py-2 text-sm font-medium text-[var(--color-primary-dark)]
                   hover:bg-[var(--color-primary-accent)] hover:text-white transition"
                    >
                      <ImageIcon className="w-4 h-4" />
                      View Image
                    </a>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={requestImageChange}
                        onChange={(e) =>
                          setRequestImageChange(e.target.checked)
                        }
                      />
                      Request Image Change
                    </label>
                  </div>
                )} */}

                {/* Action buttons */}
                <div className="flex flex-wrap justify-end gap-3">
                  {[
                    "Pending",
                    "Revision",
                    "Resubmitted",
                    "UpdateImage",
                  ].includes(selectedAd.status) && (
                    <button
                      onClick={() => updateStatus("Declined")}
                      className={`${ACTION_BTN_CLASS} bg-red-600 text-white hover:bg-red-700`}
                    >
                      <XCircle className="w-4 h-4" />
                      Decline
                    </button>
                  )}

                  {[
                    "Pending",
                    "Revision",
                    "Resubmitted",
                    "UpdateImage",
                  ].includes(selectedAd.status) &&
                    (isTextChanged || requestImageChange) && (
                      <button
                        onClick={() => updateStatus("Revision")}
                        className={`${ACTION_BTN_CLASS} bg-blue-600 text-white hover:bg-blue-700`}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Resubmit
                      </button>
                    )}

                  {["Pending", "Resubmitted", "UpdateImage"].includes(
                    selectedAd.status,
                  ) &&
                    !isTextChanged &&
                    !requestImageChange && (
                      <button
                        onClick={() => updateStatus("Approved")}
                        className={`${ACTION_BTN_CLASS} bg-green-600 text-white hover:bg-green-700`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                    )}

                  {/* {["Approved"].includes(selectedAd.status) && (
                    <button
                      onClick={async () => {
                        if (!selectedAd) return;

                        const res = await fetch("/api/ads/print", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            advertisement_text: editedText,
                            reference_number: selectedAd.reference_number,
                          }),
                        });

                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        window.open(url, "_blank");
                      }}
                      className={`${ACTION_BTN_CLASS} bg-[var(--color-primary-dark)] text-white hover:bg-[var(--color-primary)]`}
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                  )} */}
                  {["PaymentPending"].includes(selectedAd.status) && (
                    <button
                      onClick={handlePrint}
                      className={`${ACTION_BTN_CLASS} bg-[var(--color-primary-dark)] text-white hover:bg-[var(--color-primary)]`}
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {previewImage && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute -top-10 right-0 text-white text-sm hover:underline"
              >
                Close ✕
              </button>

              <img
                src={previewImage}
                alt="Image preview"
                className="w-full max-h-[80vh] object-contain rounded-lg shadow-lg bg-white"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
