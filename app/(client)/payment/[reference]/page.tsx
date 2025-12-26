"use client";

import { useState, useEffect } from "react";
import React from "react"; //
import { useSearchParams } from "next/navigation";
import { Banknote, Globe } from "lucide-react";

interface Props {
  params: Promise<{ reference: string }>;
}

export default function PaymentPage({ params }: Props) {
  const { reference } = React.use(params); //

  const searchParams = useSearchParams();
  const token = searchParams.get("t") ?? "";

  const [activeTab, setActiveTab] = useState<"bank" | "online">("bank");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [price, setPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);

  useEffect(() => {
    if (!token) return;

    async function fetchPrice() {
      try {
        const res = await fetch(`/api/track?ref=${reference}&t=${token}`);
        const data = await res.json();

        if (!data.ok) {
          throw new Error(data.error || "Failed to fetch ad");
        }

        if (data.ad.status !== "Approved") {
          throw new Error("Ad not approved for payment");
        }

        setPrice(data.ad.price ?? 0);
      } catch (err) {
        console.error(err);
        alert("Unable to load payment details.");
      } finally {
        setLoadingPrice(false);
      }
    }

    fetchPrice();
  }, [reference, token]);

  const handleProceed = async () => {
    if (!file) {
      alert("Please upload your payment slip first.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // 1️⃣ Upload to Cloudinary
      const uploadResult = await uploadImageToCloudinary(
        file,
        setUploadProgress
      );

      const secureUrl = uploadResult.secure_url;

      // 2️⃣ Call your API with Cloudinary URL
      const response = await fetch(`/api/ads/${reference}/proceed-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: secureUrl,
          amount: price,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Payment submission failed");
      }

      // 3️⃣ Redirect
      window.location.href = `/ads/track/${reference}?t=${token}`;
    } catch (err) {
      console.error(err);
      alert("Failed to submit payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  async function uploadImageToCloudinary(
    file: File,
    onProgress?: (percent: number) => void
  ) {
    return new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
      );

      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`
      );

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error("Cloudinary upload failed"));
        }
      };

      xhr.onerror = () => reject(new Error("Upload error"));

      xhr.send(formData);
    });
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 md:px-12 py-16 md:py-24">
      <section className="max-w-2xl mx-auto text-center space-y-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">
          Payment Options
        </h1>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md space-y-6">
          <p className="text-left text-gray-700">
            <strong>Reference Number:</strong> {reference}
          </p>
          {!loadingPrice && price != null && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm text-green-700">Total Amount Payable</p>
              <p className="text-2xl font-bold text-green-800">
                LKR {price.toLocaleString()}
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex justify-center gap-6 border-b pb-2">
            <button
              onClick={() => setActiveTab("bank")}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition ${
                activeTab === "bank"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-blue-600"
              }`}
            >
              <Banknote className="w-4 h-4" />
              Bank Transfer
            </button>

            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 text-gray-400 cursor-not-allowed"
            >
              <Globe className="w-4 h-4" />
              Online (Coming Soon)
            </button>
          </div>

          {/* Content */}
          {activeTab === "bank" && (
            <div className="space-y-6 text-left">
              <div className="space-y-1">
                <p>
                  <strong>Account Number:</strong> 1234567890
                </p>
                <p>
                  <strong>Beneficiary:</strong> Link Media (Pvt) Ltd
                </p>
                <p>
                  <strong>Bank:</strong> Sampath Bank
                </p>
                <p>
                  <strong>Branch:</strong> Colombo Main Branch
                </p>
                <p>
                  <strong>SWIFT:</strong> BSAMLKLXXXX
                </p>
              </div>

              {/* Upload */}
              <div className="pt-4 border-t">
                <label className="block font-medium mb-2">
                  Upload Payment Slip
                </label>

                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) =>
                    setFile(e.target.files ? e.target.files[0] : null)
                  }
                  className="w-full border rounded-lg p-3"
                />
                {isSubmitting && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-1">
                      Uploading payment slip…
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {uploadProgress}%
                    </p>
                  </div>
                )}

                {file && (
                  <p className="text-sm text-gray-600 mt-2">
                    Uploaded: <strong>{file.name}</strong>
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                  <button
                    onClick={handleProceed}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-dark 
             disabled:opacity-60 disabled:cursor-not-allowed
             text-white rounded-lg transition"
                  >
                    {isSubmitting ? "Uploading..." : "Proceed"}
                  </button>

                  <button
                    onClick={() => window.history.back()}
                    className="px-5 py-2.5 bg-gray-300 hover:bg-gray-400 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "online" && (
            <div className="py-10 text-gray-500 text-center">
              Online payment options will be available soon.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
