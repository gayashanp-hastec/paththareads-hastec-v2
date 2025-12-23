"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import newspaperData from "../../../data/newspaper_data.json"; // adjust path

type AdData = {
  reference_number: string;
  status: string;
  created_at: string;
  advertisement_text: string;
  attempts: number;
  review_history: any[];
};

export default function TrackAdClient({ reference }: { reference: string }) {
  const search = useSearchParams();
  const token = search?.get("t") ?? "";
  const [ad, setAd] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state for edits
  const [editableText, setEditableText] = useState("");
  const [isEdited, setIsEdited] = useState(false);
  const [maxWords, setMaxWords] = useState<number | null>(null);
  const [expiry, setExpiry] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Missing token in URL.");
      return;
    }
    fetchAd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, token]);

  async function fetchAd() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/track?ref=${reference}&t=${token}`);
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Unable to fetch ad");
        setLoading(false);
        return;
      }
      const addata = data.ad;
      setAd(addata);
      setEditableText(addata.advertisement_text || "");
      setIsEdited(false);

      // set attempts and expiry: expiry = 7 days from latest updated_at in review_history or ad created_at
      let latestDate = addata.created_at
        ? new Date(addata.created_at)
        : new Date();
      if (addata.review_history && addata.review_history.length) {
        const d = new Date(
          addata.review_history[0].updated_at ??
            addata.review_history[0].created_at
        );
        if (d > latestDate) latestDate = d;
      }
      const exp = new Date(latestDate);
      exp.setDate(exp.getDate() + 7);
      setExpiry(exp.toISOString().slice(0, 10));

      // get newspaper config to obtain maxWords
      // we expect review_history to contain which newspaper code and typeofAd; fallback example keys:
      let maybeNewspaper = addata.review_history?.[0]?.newspaper_code ?? null;
      let maybeType = addata.review_history?.[0]?.typeofAd ?? null;

      // Try to read from ad (if you stored newspaper_name/key and ad_type)
      // If you keep mapping differently, adapt here:
      try {
        // sample attempt: newspaper key == ad.ad_type or ad.newspaper_name lowercased key
        // you might store the newspaper code in ad somewhere; adapt if needed
        const keys = Object.keys(newspaperData as any);
        // naive fallback: pick first config and typeofAd from ad.ad_type
        if (addata.ad_type && keys.includes(addata.ad_type)) {
          const conf = (newspaperData as any)[addata.ad_type];
          const t = (conf?.typeofAd && Object.keys(conf.typeofAd)[0]) || null;
          setMaxWords(t ? conf.typeofAd[t].maxWords : null);
        } else {
          // fallback: use first entry classified maxWords
          const first = (newspaperData as any)[keys[0]];
          setMaxWords(first.typeofAd?.classified?.maxWords ?? null);
        }
      } catch (e) {
        setMaxWords(null);
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  }

  function countWords(s: string) {
    if (!s) return 0;
    return s.trim().split(/\s+/).filter(Boolean).length;
  }

  function onTextChange(v: string) {
    setEditableText(v);
    setIsEdited(v.trim() !== (ad?.advertisement_text ?? "").trim());
  }

  async function handleResubmit() {
    if (!isEdited) return alert("Edit the text before resubmitting.");
    const res = await fetch(`/api/ads/${reference}/resubmit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newText: editableText }),
    });
    const data = await res.json();
    if (data.ok) {
      alert("Resubmitted successfully.");
      fetchAd();
    } else alert(data.error || "Failed");
  }

  async function handleConfirm() {
    if (isEdited)
      return alert(
        "Cannot confirm while you edited text. Use Resubmit or revert."
      );
    const res = await fetch(`/api/ads/${reference}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (data.ok) {
      alert("Confirmed and approved. Thank you!");
      fetchAd();
    } else alert(data.error || "Failed to confirm");
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this ad?")) return;
    const res = await fetch(`/api/ads/${reference}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (data.ok) {
      alert("Ad cancelled successfully.");
      fetchAd();
    } else {
      alert(data.error || "Failed to cancel ad.");
    }
  }

  async function handlePayment() {
    // const res = await fetch(`/api/ads/${reference}/proceed-payment`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ token }),
    // });
    // const data = await res.json();
    // if (data.ok) {
    // alert("Payment initiated successfully. Redirecting soon...");
    // Example: navigate to /payment/[reference]
    window.location.href = `/payment/${reference}?t=${token}`;
    // } else {
    //   alert(data.error || "Failed to proceed with payment.");
    // }
  }

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!ad) return <div className="p-8">No ad found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 py-10 my-12 bg-white rounded-2xl shadow-lg border border-gray-100 transition-all">
      {/* Title */}
      <h1 className="text-3xl font-bold text-center mb-12 text-gray-800">
        Advertisement Progress Tracker
      </h1>
      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-6 text-gray-700">
        <p>
          <strong>Reference:</strong> {ad.reference_number}
        </p>
        <p>
          <strong>Status:</strong>
          <span
            className={`ml-2 px-2 py-0.5 rounded-full text-normal ${
              ad.status === "Approved"
                ? "bg-green-100 text-green-700"
                : ad.status === "Pending"
                ? "bg-yellow-100 text-yellow-700"
                : ad.status === "Cancelled"
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {ad.status}
          </span>
        </p>
        <p>
          <strong>Posted:</strong> {new Date(ad.created_at).toLocaleString()}
        </p>
        <p>
          <strong>Attempts:</strong> {ad.attempts}
        </p>
        <p className="sm:col-span-2">
          <strong>Resubmit Expiry (7 days):</strong> {expiry}
        </p>
      </div>
      {/* Textarea */}
      <div className="mb-6">
        <div className="flex justify-between">
          <label className="font-semibold text-gray-800 block mb-2">
            Revised Text
          </label>
          {maxWords && (
            <div
              className={`text-sm mt-1 ${
                countWords(editableText) > maxWords
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {countWords(editableText)} / {maxWords} words
            </div>
          )}
        </div>
        <textarea
          className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl p-3 text-gray-800 transition-all resize-y min-h-[180px]"
          value={editableText}
          disabled={!["Pending", "Revision", "Resubmitted"].includes(ad.status)}
          onChange={(e) => onTextChange(e.target.value)}
          rows={8}
          placeholder="Edit your advertisement text here..."
        />

        <div>
          <p id="placeholder_" className="text-sm text-center">
            (You can edit your advertisement here. Note that if you edit the
            advertisement, then it must be resubmitted to get approved)
          </p>
        </div>
      </div>
      {/* Admin Revision */}
      {ad.review_history?.[0]?.requested_revision_text && (
        <div className="mb-6 border-l-4 border-blue-500 bg-blue-50 p-4 rounded-lg">
          <p className="font-semibold text-blue-900 mb-2">
            Requested revision from admin:
          </p>
          <p className="text-gray-800 whitespace-pre-wrap mb-3">
            {ad.review_history[0].requested_revision_text}
          </p>
          <button
            onClick={() => {
              setEditableText(ad.review_history[0].requested_revision_text);
              setIsEdited(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Apply Admin Suggestion
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-3 mt-8">
        {["Pending", "Revision", "Resubmitted"].includes(ad.status) && (
          <button
            onClick={handleResubmit}
            disabled={!isEdited}
            className={`px-5 py-2.5 rounded-lg text-sm sm:text-base font-medium transition-all ${
              isEdited
                ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Resubmit
          </button>
        )}

        {["Revision"].includes(ad.status) && (
          <button
            onClick={handleConfirm}
            disabled={isEdited}
            title={isEdited ? "Revert edits to enable Confirm" : ""}
            className={`px-5 py-2.5 rounded-lg text-sm sm:text-base font-medium transition-all ${
              !isEdited
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Confirm
          </button>
        )}

        {["Revision", "Pending", "Approved", "Resubmitted"].includes(
          ad.status
        ) && (
          <button
            onClick={handleCancel}
            disabled={ad.status === "Cancelled"}
            className={`px-5 py-2.5 rounded-lg text-sm sm:text-base font-medium transition-all ${
              ad.status === "Cancelled"
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white shadow-sm"
            }`}
          >
            Cancel Ad
          </button>
        )}

        {ad.status === "Approved" && (
          <button
            onClick={handlePayment}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm sm:text-base font-medium transition-all shadow-sm"
          >
            Proceed to Payment
          </button>
        )}

        {/* 🆕 Close Button */}
        {[
          "Revision",
          "Pending",
          "Approved",
          "Resubmitted",
          "Cancelled",
          "Print",
          "PaymentPending",
        ].includes(ad.status) && (
          <button
            onClick={() => window.close()}
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm sm:text-base font-medium transition-all shadow-sm"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
