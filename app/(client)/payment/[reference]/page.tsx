"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Banknote, Globe } from "lucide-react";

interface Props {
  params: { reference: string };
}

export default function PaymentPage({ params }: Props) {
  const searchParams = useSearchParams();
  const token = searchParams.get("t");
  const reference = params.reference;

  const [activeTab, setActiveTab] = useState<"bank" | "online">("bank");
  const [file, setFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProceed = async () => {
    if (!file) {
      alert("Please upload your payment slip first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("amount", "0");

      // ✅ must match folder name in /app/api/
      const response = await fetch(`/api/ads/${reference}/proceed-payment`, {
        method: "POST",
        body: formData, // do NOT set headers manually
      });

      const data = await response.json();

      if (data.success) {
        alert("Payment slip submitted successfully!");
        window.location.href = `http://localhost:3000/ads/track/${reference}?t=${token}`;
      } else {
        alert("Error: " + (data.message || data.error));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Unexpected error submitting payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col px-4 md:px-12 py-16 md:py-24 space-y-10 bg-gray-50 min-h-screen">
      <section className="flex flex-col gap-8 text-center">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">
          Payment Options
        </h1>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md space-y-6 max-w-2xl mx-auto w-full">
          <div className="text-left">
            <p className="text-gray-700">
              <strong>Reference Number:</strong> {reference}
            </p>
          </div>

          {/* --- Tab Headers --- */}
          <div className="flex justify-center gap-3 sm:gap-6 border-b border-gray-200 pb-2">
            <button
              onClick={() => setActiveTab("bank")}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm sm:text-base font-medium transition-all ${
                activeTab === "bank"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-blue-600"
              }`}
            >
              <Banknote className="w-4 h-4" /> Bank Transfer
            </button>

            <button
              disabled
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm sm:text-base font-medium transition-all cursor-not-allowed ${
                activeTab === "online"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-400"
              }`}
            >
              <Globe className="w-4 h-4" /> Online (Coming Soon)
            </button>
          </div>

          {/* --- Tab Content --- */}
          <div className="pt-4 text-left">
            {activeTab === "bank" && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <p>
                    <strong>Account Number:</strong> 1234567890
                  </p>
                  <p>
                    <strong>Beneficiary Name:</strong> Link Media (Pvt) Ltd
                  </p>
                  <p>
                    <strong>Bank Name:</strong> Sampath Bank
                  </p>
                  <p>
                    <strong>Branch Name:</strong> Colombo Main Branch
                  </p>
                  <p>
                    <strong>International Code (SWIFT):</strong> BSAMLKLXXXX
                  </p>
                </div>

                {/* Upload Slip */}
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-gray-700 font-medium mb-2">
                    Upload Payment Slip
                  </label>
                  <div className="flex flex-col">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) =>
                        setFile(e.target.files ? e.target.files[0] : null)
                      }
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-accent
                         file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0
                         file:bg-primary-accent file:text-white file:cursor-pointer hover:file:bg-primary-accent/90"
                    />
                    {file && (
                      <p className="text-sm text-gray-600 mt-2">
                        Uploaded: <strong>{file.name}</strong>
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row sm:justify-center gap-3 mt-12">
                      <button
                        onClick={handleProceed}
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-none px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-all"
                      >
                        {isSubmitting ? "Processing..." : "Proceed"}
                      </button>
                      <button className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-lg transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "online" && (
              <div className="text-gray-500 text-center py-10">
                Online payment options will be available soon.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
