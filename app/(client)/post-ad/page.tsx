"use client";

import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";

import BreadcrumbSteps from "../components/BreadcrumbSteps";
import StepSelectNewspaper from "../components/PostAd/StepSelectNewspaper";
import StepSelectAdType from "../components/PostAd/StepSelectAdType";
import StepAdvertiserDetails from "../components/PostAd/StepAdvertiserDetails";
import StepSubmittedForReview from "../components/PostAd/StepSubmittedForReview";

// ---------------- Types ----------------
interface Newspaper {
  code: string;
  name: string;
}

interface FormData {
  selectedNewspaper: Newspaper | null;
  adType: string | null;
  classifiedCategory: string | null;
  publishDate: string;
  adText: string;
  backgroundColor: boolean;
  combinedAd: boolean;
  specialNotes: string;
  deathCertificate: File | null;
  photoCategory: string | null;
  uploadedImage: File | null;
  vehicleModel: string;
  vehicleType: string;
  vehicleYear: string;
  totalPrice: number | null;

  advertiserName: string;
  advertiserAddress: string;
  advertiserPostalAddress: string;
  advertiserPhone: string;
  advertiserNIC: string;
  advertiserEmail: string;
}

// ---------------- Component ----------------
export default function PostAdPage() {
  const steps = [
    "Select Newspaper",
    "Select Ad Type",
    "Advertiser Details",
    "On Review",
  ];

  const [currentStep, setCurrentStep] = useState(1);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [trackingLink, setTrackingLink] = useState("");

  const [formData, setFormData] = useState<FormData>({
    selectedNewspaper: null,
    adType: null,
    classifiedCategory: null,
    publishDate: "",
    adText: "",
    backgroundColor: false,
    combinedAd: false,
    specialNotes: "",
    deathCertificate: null,
    photoCategory: null,
    uploadedImage: null,
    vehicleModel: "",
    vehicleType: "",
    vehicleYear: "",
    totalPrice: null,

    advertiserName: "",
    advertiserAddress: "",
    advertiserPostalAddress: "",
    advertiserPhone: "",
    advertiserNIC: "",
    advertiserEmail: "pushpitha.info@gmail.com",
  });

  const updateFormData = (newData: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const [isNextEnabled, setIsNextEnabled] = useState(
    !!formData.selectedNewspaper
  );

  // ---------------- Step Validation ----------------
  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.selectedNewspaper) {
          toast.error("Please select a newspaper before proceeding.");
          return false;
        }
        return true;
      case 2:
        if (!formData.adType) {
          toast.error("Please select an ad type.");
          return false;
        }
        if (!formData.publishDate) {
          toast.error("Publish date is required.");
          return false;
        }
        if (!formData.adText.trim()) {
          toast.error("Advertisement text cannot be empty.");
          return false;
        }
        if (formData.adType === "classified" && !formData.classifiedCategory) {
          toast.error("Please select a classified category.");
          return false;
        }
        if (formData.adType === "photo_classified" && !formData.uploadedImage) {
          toast.error("Please upload an image for photo classified ads.");
          return false;
        }
        return true;
      case 3:
        if (!formData.advertiserName.trim()) {
          toast.error("Advertiser name is required.");
          return false;
        }
        if (!formData.advertiserAddress.trim()) {
          toast.error("Advertiser address is required.");
          return false;
        }
        if (!formData.advertiserPhone.trim()) {
          toast.error("Phone number is required.");
          return false;
        }
        if (!/^\d+$/.test(formData.advertiserPhone.trim())) {
          toast.error("Phone number must contain only digits.");
          return false;
        }
        if (!formData.advertiserNIC.trim()) {
          toast.error("NIC is required.");
          return false;
        }
        if (formData.advertiserNIC.trim().length > 12) {
          toast.error("NIC cannot exceed 12 characters.");
          return false;
        }
        if (!formData.advertiserEmail.trim()) {
          toast.error("Email address is required.");
          return false;
        }
        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.advertiserEmail.trim())
        ) {
          toast.error("Invalid email format.");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  // ---------------- Step Navigation ----------------
  const nextStep = () => {
    if (!validateStep()) return;
    if (currentStep < 3) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  // ---------------- Submit For Review ----------------
  const handleSubmitForReview = async () => {
    if (!validateStep()) return;

    // Runtime check for selectedNewspaper
    if (!formData.selectedNewspaper) {
      toast.error("Please select a newspaper.");
      return;
    }

    try {
      const payload = {
        advertiser: {
          name: formData.advertiserName.trim(),
          nic: formData.advertiserNIC.trim(),
          phone: formData.advertiserPhone.trim(),
          email: formData.advertiserEmail.trim(),
          address: formData.advertiserAddress.trim(),
        },
        advertisement: {
          newspaper_name: formData.selectedNewspaper.code,
          ad_type: formData.adType || "",
          classified_category: formData.classifiedCategory || null,
          subcategory: formData.photoCategory || null,
          publish_date: formData.publishDate,
          advertisement_text: formData.adText,
          background_color: formData.backgroundColor,
          post_in_web: formData.combinedAd,
          upload_image: formData.uploadedImage || null,
          special_notes: formData.specialNotes,
          price: formData.totalPrice || 0,
        },
      };

      const res = await fetch("/api/submit-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        toast.error("Failed to submit. Try again later.");
        return;
      }

      const result = await res.json();
      setReferenceNumber(result.reference_number || "");
      setTrackingLink(result.tracking_link || "");
      toast.success("Advertisement submitted for review!");
      setCurrentStep(4);
    } catch (err: any) {
      console.error(err);
      toast.error("Server error while submitting.");
    }
  };

  // ---------------- Render Step ----------------
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepSelectNewspaper
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            setIsNextEnabled={setIsNextEnabled}
          />
        );
      case 2:
        return (
          <StepSelectAdType
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 3:
        return (
          <StepAdvertiserDetails
            formData={formData}
            updateFormData={updateFormData}
            onSubmitForReview={handleSubmitForReview}
          />
        );
      case 4:
        return (
          <StepSubmittedForReview
            referenceNumber={referenceNumber}
            trackingLink={trackingLink}
          />
        );
      default:
        return null;
    }
  };

  // ---------------- Render ----------------
  return (
    <div className="font-raleway bg-white min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col mx-auto w-full md:w-3/4 px-6 py-12 space-y-12">
        <BreadcrumbSteps steps={steps} currentStep={currentStep} />
        <div className="mt-1">{renderStep()}</div>

        <div className="flex justify-between mt-10">
          {currentStep !== steps.length ? (
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-2 rounded-lg border font-medium transition ${
                currentStep === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-primary-dark border-primary-dark hover:bg-primary-accent hover:text-white"
              }`}
            >
              ← Back
            </button>
          ) : (
            <div className="flex-1 flex justify-end">
              <button
                onClick={() => (window.location.href = "/")}
                className="px-6 py-2 rounded-lg font-medium transition text-primary cursor-pointer border border-primary hover:bg-primary-accent hover:text-white"
              >
                Close
              </button>
            </div>
          )}

          {currentStep < 3 ? (
            <button
              onClick={nextStep}
              disabled={currentStep === 1 && !isNextEnabled}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                currentStep === 1 && !isNextEnabled
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-500"
                  : "bg-primary text-white hover:bg-primary-dark"
              }`}
            >
              Next →
            </button>
          ) : currentStep === 3 ? (
            <button
              onClick={handleSubmitForReview}
              className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition"
            >
              Submit for Review
            </button>
          ) : null}
        </div>
      </main>
    </div>
  );
}
