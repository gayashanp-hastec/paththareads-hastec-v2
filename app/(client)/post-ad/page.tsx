"use client";

import Image from "next/image";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import BreadcrumbSteps from "../components/BreadcrumbSteps";
import StepSelectNewspaper from "../components/PostAd/StepSelectNewspaper";
import StepSelectAdType from "../components/PostAd/StepSelectAdType";
import StepAdvertiserDetails from "../components/PostAd/StepAdvertiserDetails";
import StepSubmittedForReview from "../components/PostAd/StepSubmittedForReview";
import { checkProfanity } from "@/lib/profanity";
import { format } from "path";

// ---------------- Types ----------------
interface Newspaper {
  code: string;
  name: string;
  id: string;
  no_col_per_page: number;
  col_height: number;
  min_ad_height: number;
  tint_additional_charge: number;
  newspaper_serial_no: number;
  language: string;
  is_allow_language_combined: false;
  combine_eng_price: number;
  combine_tam_price: number;
  combine_sin_price: number;
  combine_sin_eng_price: number;
  combine_sin_tam_price: number;
  combine_eng_tam_price: number;
  allowed_weekdays: [];
  allowed_month_days: [];
}

interface AdType {
  id: number;
  newspaper_id: string;
  key: string;
  name: string;
  base_type: string;
  count_first_words: number;
  base_price: number;
  additional_word_price: number;
  priority_price: number;
  tint_color_price: number;
  co_paper_price: number;
  internet_bw_price: number;
  internet_fc_price: number;
  internet_highlight_price: number;
  is_allow_combined: boolean;
  max_words: number;
  img_url?: string;
  is_upload_image: boolean;
  extra_notes1?: string;
  extra_notes2?: string;
  categories: {
    category: string;
    subCategories: { name: string }[];
  }[];
}

interface FormData {
  selectedNewspaper: Newspaper | null;
  adType: string | null;
  adTypeObject?: AdType | null;
  uploading: boolean;
  classifiedCategory: string | null;
  subCategory?: string;
  publishDate: string;
  adText: string;
  backgroundColor: boolean;
  combinedAd: boolean;
  priorityPrice: boolean;

  specialNotes: string;
  deathCertificate: File | null;
  photoCategory: string | null;
  hasOwnArtwork: boolean;
  needArtwork: boolean;
  uploadedImage: File | null;
  uploadedImages: string[];
  sectionId: number;
  is_allow_language_combined: boolean;
  userLangCombineSelected: boolean;
  userLangCombineSelected_Tam: boolean;
  userLangCombineSelected_Eng: boolean;
  userLangCombineSelected_Sin: boolean;
  userLangCombineSelected_Sin_Eng: boolean;
  userLangCombineSelected_Sin_Tam: boolean;
  userLangCombineSelected_Eng_Tam: boolean;
  userCOPaper: boolean;
  userIntBW: boolean;
  userIntFC: boolean;
  userIntHighlight: boolean;
  tmagree: boolean;
  // fullpagead: boolean;
  // halfPageAdHR: boolean;
  // halfPageAdVR: boolean;
  noOfColumns: number;
  adHeight: number;
  colorOption: string;
  adSizeType: string;
  boxType: number;

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

  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [trackingLink, setTrackingLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    selectedNewspaper: null,
    adType: null,
    adTypeObject: null,
    uploading: false,
    classifiedCategory: null,
    publishDate: "",
    adText: "",
    backgroundColor: false,
    combinedAd: false,
    priorityPrice: false,
    specialNotes: "",
    deathCertificate: null,
    photoCategory: null,
    uploadedImage: null,
    uploadedImages: [],
    hasOwnArtwork: false,
    needArtwork: false,
    sectionId: 0,
    is_allow_language_combined: false,
    userLangCombineSelected: false,
    userLangCombineSelected_Eng: false,
    userLangCombineSelected_Tam: false,
    userLangCombineSelected_Sin: false,
    userLangCombineSelected_Sin_Eng: false,
    userLangCombineSelected_Sin_Tam: false,
    userLangCombineSelected_Eng_Tam: false,
    userCOPaper: false,
    userIntBW: false,
    userIntFC: false,
    userIntHighlight: false,
    tmagree: false,
    // fullpagead: false,
    // halfPageAdHR: false,
    // halfPageAdVR: false,
    noOfColumns: 1,
    adHeight: 0,
    colorOption: "",
    adSizeType: "",
    boxType: 0,
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
    !!formData.selectedNewspaper,
  );

  // ---------------- Step Validation ----------------
  const validateStep = async (): Promise<boolean> => {
    const adType_ = formData.adTypeObject;
    console.log(adType_?.is_upload_image);
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
          // console.log(formData.selectedNewspaper);
          toast.error("Publish date is required.");
          return false;
        }
        if (formData.adType !== "casual" && !formData.adText.trim()) {
          toast.error("Advertisement text cannot be empty.");
          return false;
        }
        if (
          formData.adType === "casual" &&
          !formData.hasOwnArtwork &&
          !formData.adText.trim() &&
          adType_?.max_words !== 0
        ) {
          toast.error("Advertisement text cannot be empty.");
          return false;
        }
        if (
          formData.adType === "casual" &&
          formData.needArtwork &&
          !formData.adText.trim()
        ) {
          toast.error("Advertisement text cannot be empty.");
          return false;
        }

        if (formData.adType === "casual") {
          if (
            formData.boxType === 0 &&
            (formData.adSizeType === "" || formData.colorOption === "")
          ) {
            toast.error("Please select size and color!");
            return false;
          }
        }
        if (
          formData.hasOwnArtwork &&
          formData.adType === "casual" &&
          adType_?.is_upload_image &&
          formData.uploadedImages.length === 0
        ) {
          toast.error("Please upload an image!");
          return false;
        }
        if (formData.adSizeType === "custom" && formData.noOfColumns === 0) {
          toast.error("Please select a column size!");
          return false;
        }

        const hasProfanity = await checkProfanity(formData.adText);
        if (hasProfanity) {
          toast.error("Advertisement text contains inappropriate words.");
          return false;
        }
        // if (formData.adType === "classified" && !formData.classifiedCategory) {
        //   toast.error("Please select a classified category.");
        //   return false;
        // }
        if (
          formData.adType !== "casual" &&
          adType_?.is_upload_image &&
          !formData.uploadedImage &&
          formData.uploadedImages.length === 0
        ) {
          toast.error("Please upload an image!");
          return false;
        }
        console.log("on ad type select: ", formData);
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
        if (
          formData.advertiserNIC.trim().length !== 12 &&
          formData.advertiserNIC.trim().length !== 10
        ) {
          toast.error("NIC must only be 10 or 12 characters long.");
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
        if (!formData.tmagree) {
          toast.error("Please accept the Terms & Conditions to continue.");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  // ---------------- Step Navigation ----------------
  const nextStep = async () => {
    const isValid = await validateStep();
    console.log("at payload", formData.sectionId);
    if (!isValid) return;
    if (currentStep < 3) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  // ---------------- Submit For Review ----------------
  const handleSubmitForReview = async () => {
    const isValid = await validateStep();
    if (!isValid) return;

    setIsSubmitting(true);

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
          newspaper_name: formData.selectedNewspaper?.id,
          ad_type: formData.adType || "",
          classified_category: formData.classifiedCategory || null,
          subcategory: formData.subCategory || null,
          publish_date: formData.publishDate,
          advertisement_text: formData.adText,
          background_color: formData.backgroundColor,
          post_in_web: formData.combinedAd,
          upload_image: formData.uploadedImage || null,
          uploaded_images: formData.uploadedImages,
          special_notes: formData.specialNotes,
          price: formData.totalPrice || 0,
          newspaper_serial_no: formData.selectedNewspaper?.newspaper_serial_no,
          ad_size: formData.adSizeType,
          no_of_columns: formData.noOfColumns,
          ad_height: formData.adHeight,
          color_option: formData.colorOption,
          no_boxes: formData.boxType,
          has_artwork: formData.hasOwnArtwork,
          need_artwork: formData.needArtwork,
          is_publish_eng: formData.userLangCombineSelected_Eng,
          is_publish_tam: formData.userLangCombineSelected_Tam,
          is_publish_sin: formData.userLangCombineSelected_Sin,
          is_publish_sin_eng: formData.userLangCombineSelected_Sin_Eng,
          is_publish_sin_tam: formData.userLangCombineSelected_Sin_Tam,
          is_publish_eng_tam: formData.userLangCombineSelected_Eng_Tam,
          is_co_paper: formData.userCOPaper,
          is_int_bw: formData.userIntBW,
          is_int_fc: formData.userIntFC,
          is_int_higlight: formData.userIntHighlight,
          section_id: formData.sectionId,
          is_priority: formData.priorityPrice,
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
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Push a dummy state to trap back button
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      // Show modal instead of navigating back
      setShowBackConfirm(true);
      // Push state again to prevent actual back
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);

    // Tab close / refresh
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const confirmLeave = () => {
    setShowBackConfirm(false);
    // Actually go back now
    window.history.go(-1);
  };

  const stayHere = () => {
    setShowBackConfirm(false);
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
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                isSubmitting
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              } text-white`}
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit for Review"
              )}
            </button>
          ) : null}
        </div>
      </main>
      {/* Back button confirmation modal */}
      {showBackConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-primary-dark p-6 w-80 text-white shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Hold On!</h2>
            <p className="mb-6 text-sm">
              You have unsaved changes. Are you sure you want to leave this
              page?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBackConfirm(false)}
                className="rounded-full bg-button px-4 py-1.5 text-sm font-medium transition hover:bg-(--color-button-hover) text-white"
              >
                Stay
              </button>
              <button
                onClick={confirmLeave}
                className="rounded-full bg-orange-accent px-4 py-1.5 text-sm font-medium text-(--color-primary-dark) transition hover:brightness-110"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
