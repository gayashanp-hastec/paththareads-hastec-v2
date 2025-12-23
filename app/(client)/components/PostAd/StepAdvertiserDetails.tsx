"use client";

import { useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import toast from "react-hot-toast";

interface StepAdvertiserDetailsProps {
  formData: any;
  updateFormData: (data: any) => void;
  onSubmitForReview?: () => void; //
}

export default function StepAdvertiserDetails({
  formData,
  updateFormData,
  onSubmitForReview,
}: StepAdvertiserDetailsProps) {
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  const [countryDialCode, setCountryDialCode] = useState(
    formData.countryCode || "+94"
  );

  const handleChange = (field: string, value: string) => {
    updateFormData({ [field]: value });
  };

  const phoneLengths: Record<string, number> = {
    "+94": 9, // Sri Lanka
    "+1": 10, // USA
    "+44": 10, // UK
    "+61": 9, // Australia
    "+65": 8, // Singapore
    "+81": 10, // Japan
    "+91": 10, // India
    "+971": 9, // UAE
  };

  const handlePhoneChange = (value: string, country: any) => {
    const dialCode = "+" + country.dialCode;
    setCountryDialCode(dialCode);
    handleChange("countryCode", dialCode);
    handleChange("advertiserPhone", value);

    const expectedLength = phoneLengths[dialCode] || 9;
    const digitsOnly = value.replace(/\D/g, "").replace(country.dialCode, "");

    setIsPhoneValid(digitsOnly.length === expectedLength);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Optionally validate before submitting
    if (!isPhoneValid) {
      toast.error("Please enter a valid phone number before submitting.");
      return;
    }

    // ✅ Trigger parent submit function
    onSubmitForReview?.();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <h2 className="text-2xl md:text-3xl font-bold text-center">
        Advertiser Details
      </h2>

      <div className="flex flex-col gap-6 md:w-2/3 mx-auto">
        {/* Name */}
        <div>
          <label className="block mb-2 font-medium">Name *</label>
          <input
            type="text"
            value={formData.advertiserName || ""}
            onChange={(e) => handleChange("advertiserName", e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-accent"
            placeholder="Enter your full name"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block mb-2 font-medium">Address *</label>
          <input
            type="text"
            value={formData.advertiserAddress || ""}
            onChange={(e) => handleChange("advertiserAddress", e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-accent"
            placeholder="Your permanent address"
          />
        </div>

        {/* Postal Address */}
        <div>
          <label className="block mb-2 font-medium">
            Postal Address (If same, keep blank)
          </label>
          <input
            type="text"
            value={formData.advertiserPostalAddress || ""}
            onChange={(e) =>
              handleChange("advertiserPostalAddress", e.target.value)
            }
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-accent"
            placeholder="Postal address (optional)"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block mb-2 font-medium">Phone No. *</label>
          <PhoneInput
            country={"lk"}
            value={formData.advertiserPhone || ""}
            onChange={handlePhoneChange}
            inputClass={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary-accent ${
              isPhoneValid ? "border-gray-300" : "border-red-500"
            }`}
            buttonStyle={{
              border: "none",
              backgroundColor: "transparent",
            }}
            dropdownClass="rounded-lg"
            inputProps={{
              name: "phone",
              required: true,
            }}
          />
          {!isPhoneValid ? (
            <p className="text-sm text-red-500 mt-1">
              Please enter a valid {countryDialCode} phone number.
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">
              Example: {countryDialCode} 712345678
            </p>
          )}
        </div>

        {/* NIC */}
        <div>
          <label className="block mb-2 font-medium">NIC *</label>
          <input
            type="text"
            maxLength={12}
            value={formData.advertiserNIC || ""}
            onChange={(e) => handleChange("advertiserNIC", e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-accent"
            placeholder="National ID number"
          />
        </div>

        {/* Email */}
        {/* <div>
          <label className="block mb-2 font-medium">Email Address *</label>
          <input
            type="email"
            value={formData.advertiserEmail || ""}
            onChange={(e) => handleChange("advertiserEmail", e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-accent"
            placeholder="example@email.com"
          />
        </div> */}
        <div>
          <label className="block mb-2 font-medium">Email Address *</label>
          <input
            type="email"
            value={formData.advertiserEmail || "pushpitha.info@gmail.com"}
            readOnly
            className="w-full border border-gray-300 rounded-lg p-3 
               focus:ring-2 focus:ring-primary-accent bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* ✅ Submit Button
        <div className="text-center mt-6">
          <button
            type="submit"
            className="px-6 py-3 bg-primary-accent text-white rounded-lg font-semibold hover:opacity-90 transition"
          >
            Submit for Review
          </button>
        </div> */}
      </div>
    </form>
  );
}
