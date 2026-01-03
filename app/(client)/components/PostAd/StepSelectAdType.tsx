"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AdGridCanvas from "../AdGridCanvas";

interface StepSelectAdTypeProps {
  formData: any;
  updateFormData: (data: any) => void;
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
  is_allow_combined: boolean;
  max_words: number;
  img_url?: string;
  is_upload_image: boolean;
  cs_col_bw_price: number;
  cs_col_bw_one_color_price: number;
  cs_col_bw_two_color_price: number;
  cs_col_full_color_price: number;
  cs_page_bw_price: number;
  cs_page_bw_one_color_price: number;
  cs_page_bw_two_color_price: number;
  cs_page_full_color_price: number;
  extra_notes1?: string;
  extra_notes2?: string;
  categories: {
    category: string;
    subCategories: { name: string }[];
  }[];
}

export default function StepSelectAdType({
  formData,
  updateFormData,
}: StepSelectAdTypeProps) {
  const [adTypes, setAdTypes] = useState<AdType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSize, setselectedSize] = useState<string>("");
  const [selectedColor, setselectedColor] = useState<number>(0);
  const [selectedAdType, setSelectedAdType] = useState<AdType | null>(null);
  const [wordCount, setWordCount] = useState<number>(
    formData.adText?.split(" ").filter(Boolean).length || 0
  );
  const [priceBreakdown, setPriceBreakdown] = useState<
    { label: string; amount: number }[]
  >([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([]);
  const [noOfColumnsPerPage, setNoOfColumnsPerPage] = useState<number>(0);
  const [minAdHeight, setminAdHeight] = useState<number>(0);
  const [maxColHeight, setmaxColHeight] = useState<number>(0);
  const [tintAdditionalCharge, settintAdditionalCharge] = useState<number>(0);
  const [newspaperDays, setnewspaperDays] = useState<string[]>([]);

  const selectedNewspaperId = formData.selectedNewspaper?.id;

  // Fetch ad types for selected newspaper
  useEffect(() => {
    if (!selectedNewspaperId) return;
    setLoading(true);
    fetch(`/api/ad-types/${selectedNewspaperId}`)
      .then((res) => res.json())
      .then((data: AdType[]) => setAdTypes(data))
      .catch((err) => console.error(err))
      .finally(() => {
        setLoading(false);
      });
  }, [selectedNewspaperId]);

  const handleAdTypeSelect = (adType: AdType) => {
    console.log("formData.no_col_per_page ", formData.no_col_per_page);
    console.log(
      "formData.selectedNewspaper.no_col_per_page ",
      formData.selectedNewspaper.no_col_per_page
    );
    setNoOfColumnsPerPage(formData.selectedNewspaper.no_col_per_page);
    setminAdHeight(formData.selectedNewspaper.min_ad_height);
    setmaxColHeight(formData.selectedNewspaper.col_height);
    settintAdditionalCharge(formData.selectedNewspaper.tint_additional_charge);
    setnewspaperDays(["tuesday", "thursday"]);
    // console.log(formData);
    setSelectedAdType(adType);
    updateFormData({
      adType: adType.key,
      adTypeObject: adType,
      adText: "",
      backgroundColor: false,
      combinedAd: false,
      uploadedImage: null,
      specialNotes: "",
      classifiedCategory: "",
      photoCategory: "",
      subCategory: "",
    });
    setWordCount(0);
    setSelectedCategory("");
    setSelectedSubCategory("");
    console.log(
      "final",
      noOfColumnsPerPage,
      minAdHeight,
      tintAdditionalCharge,
      maxColHeight
    );
  };

  // Word count & price calculation
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!selectedAdType) return;

    let inputText = e.target.value;

    // Count words without trimming spaces
    const words = inputText.split(/\s+/).filter(Boolean);

    // If priority ad, enforce leading 0
    if (formData.priorityPrice) {
      if (!inputText.startsWith("0")) {
        inputText = "0" + inputText.replace(/^0+/, "");
      }
    }

    if (words.length > selectedAdType.max_words) {
      // Limit the text to max_words
      const limitedWords = words.slice(0, selectedAdType.max_words);
      const newText = limitedWords.join(" ");

      setWordCount(limitedWords.length);
      updateFormData({ adText: newText });
    } else {
      // Normal typing
      setWordCount(words.length);
      updateFormData({ adText: inputText });
    }
  };

  useEffect(() => {
    if (!selectedAdType) return;

    let total = 0;
    const breakdown = [];

    // CASUAL AD PRICING
    if (selectedAdType.key === "casual") {
      let basePrice = 0;

      // FULL PAGE → color only
      if (formData.adSizeType === "full") {
        basePrice = 0;
        basePrice = selectedColor;
      }

      // CUSTOM SIZE → columns × height × color
      if (formData.adSizeType === "custom") {
        basePrice = 0;
        basePrice =
          (formData.noOfColumns || 1) * //line 1
          (formData.adHeight || minAdHeight) * //line 2
          (selectedColor || 0);
      }

      breakdown.push({ label: "Base Price", amount: basePrice });
      total += basePrice;
    } else {
      breakdown.push({
        label: "Base Price",
        amount: selectedAdType.base_price,
      });
      total += selectedAdType.base_price;
    }

    const extraWords = Math.max(
      0,
      wordCount - selectedAdType.count_first_words
    );
    if (extraWords > 0) {
      const extraPrice = extraWords * selectedAdType.additional_word_price;
      breakdown.push({
        label: `Extra Words (${extraWords} × ${selectedAdType.additional_word_price})`,
        amount: extraPrice,
      });
      total += extraPrice;
    }

    if (formData.backgroundColor) {
      breakdown.push({
        label: "Background Color",
        amount: selectedAdType.tint_color_price,
      });
      total += selectedAdType.tint_color_price;
    }

    if (formData.combinedAd) {
      breakdown.push({ label: "Post in Website", amount: 100 });
      total += 100;
    }

    if (formData.priorityPrice) {
      breakdown.push({
        label: "Priority Ad",
        amount: selectedAdType.priority_price,
      });
      total += selectedAdType.priority_price;
    }

    if (formData.priorityPrice) {
      if (!formData.adText?.startsWith("0")) {
        updateFormData({
          adText: `0${formData.adText || ""}`,
        });
      }
    } else {
      if (formData.adText?.startsWith("0")) {
        updateFormData({
          adText: formData.adText.slice(1),
        });
      }
    }

    setPriceBreakdown(breakdown);
    setTotalPrice(total);
    updateFormData({ totalPrice: total });
  }, [
    wordCount,

    formData.adSizeType,
    formData.noOfColumns,
    formData.adHeight,
    selectedColor,

    formData.backgroundColor,
    formData.combinedAd,
    formData.priorityPrice,
    selectedAdType,
  ]);

  useEffect(() => {
    if (!selectedCategory) {
      setSubCategoryOptions([]);
      return;
    }

    fetch(
      `/api/subcategories?categoryName=${encodeURIComponent(selectedCategory)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.subcategories) setSubCategoryOptions(data.subcategories);
        else setSubCategoryOptions([]);
      })
      .catch(() => setSubCategoryOptions([]));
  }, [selectedCategory]);

  const today = new Date().toISOString().split("T")[0];

  function AdTypeSkeleton() {
    return (
      <div className="border rounded-lg p-4 flex flex-col items-center animate-pulse">
        <div className="w-28 h-28 bg-gray-300 rounded mb-3" />
        <div className="h-4 w-24 bg-gray-300 rounded mb-2" />
        <div className="h-3 w-32 bg-gray-200 rounded" />
      </div>
    );
  }

  const adTypeImages: Record<string, string> = {
    classified: "/classified.png",
    photo_classified: "/photo-classified.png",
    casual: "/casual.png",
  };

  const getAdTypeImage = (adKey: string) => {
    return adTypeImages[adKey] || "/default_ad_icon.png";
  };

  async function uploadImageToCloudinary(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
    );

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      throw new Error("Cloudinary upload failed");
    }

    return res.json();
  }

  const DAY_MAP: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  function isAllowedDateByArray(date: Date, allowedDays: string[]) {
    if (!allowedDays || allowedDays.length === 0) return true;

    const allowedDayNumbers = allowedDays
      .map((d) => DAY_MAP[d.toLowerCase()])
      .filter((d) => d !== undefined);

    return allowedDayNumbers.includes(date.getDay());
  }

  useEffect(() => {
    if (selectedAdType?.key !== "casual") return;

    if (formData.adSizeType === "custom") {
      updateFormData({
        noOfColumns: formData.noOfColumns ?? 1,
        adHeight: formData.adHeight ?? minAdHeight,
      });
    }
  }, [formData.adSizeType, selectedAdType, minAdHeight]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center mb-2">Select Ad Type</h2>
      <h2
        style={{
          fontFamily: "var(--font-sinhala), sans-serif",
        }}
        className="text-center"
      >
        <span>(දැන්වීම් වර්ගය තෝරන්න)</span>
      </h2>

      {/* Ad Types Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {loading
          ? // show 6 skeletons
            Array.from({ length: 6 }).map((_, i) => <AdTypeSkeleton key={i} />)
          : (Array.isArray(adTypes) ? adTypes : []).map((ad) => (
              <div
                key={ad.key}
                className={`border rounded-lg p-4 flex flex-col items-center cursor-pointer transition ${
                  selectedAdType?.key === ad.key
                    ? "ring-2 ring-primary-accent"
                    : "hover:ring-2 hover:ring-primary-accent"
                }`}
                onClick={() => handleAdTypeSelect(ad)}
              >
                <div className="w-[120px] h-[120px] flex items-center justify-center mb-2 overflow-hidden">
                  <Image
                    src={getAdTypeImage(ad.key)}
                    alt={ad.name}
                    width={120}
                    height={120}
                    className="object-contain"
                  />
                </div>
                <h3 className="font-semibold text-center">{ad.name}</h3>
                {ad.extra_notes1 && (
                  <p className="text-xs text-gray-500 text-center">
                    {ad.extra_notes1}
                  </p>
                )}
                {ad.extra_notes2 && (
                  <p className="text-xs text-gray-500 text-center">
                    {ad.extra_notes2}
                  </p>
                )}
              </div>
            ))}
      </div>

      {selectedAdType && (
        <div className="space-y-4 md:w-2/3 mx-auto md:mt-8">
          {/* Publish Date */}
          <div className="w-full">
            <label className="block font-medium mb-1">
              Publish Date{" "}
              <span
                className="text-sm"
                style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
              >
                (දැන්වීම පළ කරන දිනය)
              </span>
              <span className="text-red-500">*</span>
            </label>

            {/* <DatePicker
              selected={
                formData.publishDate ? new Date(formData.publishDate) : null
              }
              onChange={(date: Date | null) =>
                updateFormData({
                  publishDate: date ? date.toISOString().split("T")[0] : "",
                })
              }
              filterDate={(date) => isAllowedDateByArray(date, newspaperDays)}
              minDate={new Date()}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select date"
              className="border border-gray-300 rounded-lg p-2 w-full
               focus:ring-2 focus:ring-primary-accent"
              calendarClassName="!text-sm"
            /> */}
            <input
              type="date"
              min={today}
              value={formData.publishDate || ""}
              onChange={(e) => updateFormData({ publishDate: e.target.value })}
              required
              className="border border-gray-300 rounded-lg p-2 w-full md:w-1/5 focus:ring-2 focus:ring-primary-accent"
            />
          </div>

          {/* Category Dropdown */}
          {(selectedAdType.key === "classified" ||
            selectedAdType.key === "photo_classified" ||
            selectedAdType.key === "casual") && (
            <div>
              <label className="block font-medium mb-1 md:mt-8">
                Category{" "}
                <span
                  className="text-sm"
                  style={{
                    fontFamily: "var(--font-sinhala), sans-serif",
                  }}
                >
                  (වර්ගීකරණය)
                </span>{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  updateFormData({ classifiedCategory: e.target.value });
                  setSelectedSubCategory("");
                  // console.log(formData.classifiedCategory);
                  // console.log("cat: ", selectedCategory);
                  // console.log("sub: ", selectedSubCategory);
                  // console.log("type: ", selectedAdType.key);
                }}
                className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-primary-accent"
              >
                <option value="">Select Category</option>
                {/* {selectedAdType.categories.map((cat) => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category}
                  </option>
                ))} */}
                <option value="Real Estate">Real Estate</option>
                <option value="Health & Beauty">Health & Beauty</option>
                <option value="Automobile">Automobile</option>
                <option value="Personal">Personal</option>
                <option value="Employment">Employment</option>
                <option value="General">General</option>
                <option value="Trade">Trade</option>
              </select>
            </div>
          )}

          {/* Subcategory Dropdown */}
          {selectedCategory && (
            <div className="md:mt-8">
              <label className="block font-medium mb-1">
                Sub Category{" "}
                <span
                  className="text-sm"
                  style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
                >
                  (දැන්වීම් ස්වභාවය)
                </span>{" "}
              </label>
              <select
                value={selectedSubCategory}
                onChange={(e) => {
                  setSelectedSubCategory(e.target.value);
                  updateFormData({ subCategory: e.target.value });
                }}
                className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-primary-accent"
              >
                <option value="">Select Subcategory</option>
                {subCategoryOptions.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Advertisement Text */}
          <div className="relative md:mt-8">
            <label className="block font-medium mb-1">
              Advertisement Text{" "}
              <span
                className="text-sm"
                style={{
                  fontFamily: "var(--font-sinhala), sans-serif",
                }}
              >
                (දැන්වීම් විස්තරය)
              </span>{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="absolute top-0 right-0 text-sm text-gray-500">
              {wordCount}/{selectedAdType.max_words} words
            </div>
            <textarea
              rows={5}
              placeholder="Type your advertisement here"
              value={formData.adText || ""}
              onChange={handleTextChange}
              required
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-primary-accent resize-none"
            />
            <p className="text-sm">
              To type in Sinhala, go to a{" "}
              <a
                href="https://ucsc.cmb.ac.lk/ltrl/services/feconverter/t1.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-800 hover:text-blue-600"
              >
                Sinhala typing tool
              </a>
              , type your advertisement, then copy and paste it here.{" "}
            </p>
            <p className="text-sm">
              <span
                className="text-xs"
                style={{
                  fontFamily: "var(--font-sinhala), sans-serif",
                }}
              >
                (සිංහලෙන් ටයිප් කිරීමට,{" "}
                <a
                  href="https://ucsc.cmb.ac.lk/ltrl/services/feconverter/t1.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-800 hover:text-blue-600"
                >
                  සිංහල ටයිපින්{" "}
                </a>
                මෙවලමට පිවිස ඔබේ දැන්වීම ටයිප් කර, පිටපත් කර මෙහි ඇතුළත් කරන්න.)
              </span>{" "}
            </p>
          </div>

          {/* Image Upload */}
          {selectedAdType.is_upload_image && (
            <div className="md:mt-8">
              <label className="block mb-2 font-medium">
                Upload Image{" "}
                <span
                  className="text-sm"
                  style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
                >
                  (ඡායාරූප ඇතුලත් කරන්න)
                </span>{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="file"
                accept="image/*"
                required
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  try {
                    updateFormData({ uploading: true });

                    const data = await uploadImageToCloudinary(file);

                    updateFormData({
                      uploadedImage: data.secure_url,
                      uploading: false,
                    });
                  } catch (error) {
                    console.error(error);
                    updateFormData({ uploading: false });
                    alert("Image upload failed. Please try again.");
                  }
                }}
                className="w-full border border-gray-300 rounded-lg p-3
               focus:ring-2 focus:ring-primary-accent
               file:mr-4 file:py-2 file:px-4
               file:rounded-full file:border-0
               file:bg-primary-accent file:text-white
               file:cursor-pointer
               hover:file:bg-primary-accent/90
               transition"
              />

              {/* Optional status text (non-breaking, visual only) */}
              {formData.uploading && (
                <p className="text-sm text-gray-500 mt-2">Uploading image…</p>
              )}

              {formData.uploadedImage && !formData.uploading && (
                <p className="text-sm text-green-600 mt-2">
                  Image uploaded successfully
                </p>
              )}

              {formData.uploadedImage && (
                <img
                  src={formData.uploadedImage}
                  alt="Uploaded preview"
                  className="mt-4 w-48 rounded-lg border"
                />
              )}

              {selectedAdType.extra_notes1 && (
                <p className="text-xs text-gray-500">
                  {selectedAdType.extra_notes1}
                </p>
              )}
            </div>
          )}

          {selectedAdType.key === "casual" && (
            <div className="mt-6 rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
              <h3 className="mb-1 font-normal text-[var(--color-primary-dark)] text-center">
                Advertisement Size
              </h3>
              <h3
                className="mb-2 font-normal text-[var(--color-primary-dark)] text-center text-sm"
                style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
              >
                (දැන්වීමේ ප්‍රමාණය)
              </h3>
              <div className="flex flex-col m-auto justify-center text-center mb-8">
                <p className="text-sm">
                  <button
                    onClick={() => setIsOpen(true)}
                    className="text-blue-800 hover:text-blue-600"
                  >
                    Learn more
                  </button>
                  &nbsp;about cost calculation for casual ads.
                </p>
              </div>

              {/* Casual advertisement fields */}
              <div className="flex flex-col md:flex-row gap-4">
                {[
                  {
                    key: "full",
                    label: "Full Page",
                    subLabel: "(මුළු පිටුවම)",
                  },
                  // {
                  //   key: "half_hr",
                  //   label: "Half Page (Horizontal)",
                  //   subLabel: "(භාග පිටුවක් (තිරස්))",
                  // },
                  // {
                  //   key: "half_vr",
                  //   label: "Half Page (Vertical)",
                  //   subLabel: "(භාග පිටුවක් (සිරස්))",
                  // },
                  {
                    key: "custom",
                    label: "Customize",
                    subLabel: "(ඔබගේ අවශ්‍යතාවය අනුව)",
                  },
                ].map((option) => (
                  <label
                    key={option.key}
                    className={`cursor-pointer flex flex-col items-center justify-center sm:w-full md:w-1/2 border rounded-md p-3 text-center transition ${
                      formData.adSizeType === option.key
                        ? "bg-[var(--color-primary-dark)] text-white border-[var(--color-primary)]"
                        : "bg-white text-[var(--color-primary-dark)] border-gray-300 hover:border-[var(--color-primary)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="adSizeType"
                      value={option.key}
                      className="hidden"
                      checked={formData.adSizeType === option.key}
                      onChange={() => {
                        updateFormData({
                          adSizeType: option.key,
                          // fullPageAd: option.key === "full",
                          // halfPageAdHR: option.key === "half_hr",
                          // halfPageAdVR: option.key === "half_vr",
                          colorOption: "",
                        });
                        setselectedSize(option.key);
                        toast.success(selectedSize);
                        setselectedColor(0);
                      }}
                    />
                    <span className="font-semibold text-sm">
                      {option.label}
                    </span>
                    <span
                      className="text-xs mt-1"
                      style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
                    >
                      {option.subLabel}
                    </span>
                  </label>
                ))}
              </div>

              {/* custom size fields */}
              {formData.adSizeType == "custom" && (
                <>
                  {/* No of Columns */}
                  <div className="mt-8">
                    <label className="block font-medium mb-2">
                      No. of Columns{" "}
                      <span
                        className="text-sm"
                        style={{
                          fontFamily: "var(--font-sinhala), sans-serif",
                        }}
                      >
                        (තීරු ගණන)
                      </span>{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {Array.from(
                        { length: noOfColumnsPerPage },
                        (_, i) => i + 1
                      ).map((num) => (
                        <label key={num} className="cursor-pointer">
                          <input
                            type="radio"
                            name="noOfColumns"
                            value={num}
                            checked={formData.noOfColumns === num}
                            onChange={() =>
                              updateFormData({ noOfColumns: num })
                            }
                            className="hidden"
                          />
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold transition ${
                              formData.noOfColumns === num
                                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                                : "border-gray-300 bg-white text-gray-700 hover:border-[var(--color-primary)]"
                            }`}
                          >
                            {num}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Ad Height */}
                  <div className="mt-8">
                    <label className="block font-medium mb-2">
                      Ad Height (cm){" "}
                      <span
                        className="text-sm"
                        style={{
                          fontFamily: "var(--font-sinhala), sans-serif",
                        }}
                      >
                        (උස සෙ.මී.)
                      </span>
                    </label>

                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={minAdHeight}
                        max={maxColHeight}
                        value={formData.adHeight}
                        onChange={(e) =>
                          updateFormData({
                            adHeight: Number(e.target.value),
                          })
                        }
                        className="flex-1 accent-[var(--color-primary)] cursor-pointer"
                      />

                      <input
                        type="number"
                        min={minAdHeight}
                        max={maxColHeight}
                        value={
                          formData.adHeight
                            ? formData.adHeight
                            : formData.selectedNewspaper.min_ad_height
                        }
                        onChange={(e) =>
                          updateFormData({
                            adHeight: Number(e.target.value),
                          })
                        }
                        className="w-20 h-10 rounded-md border border-gray-300 text-center text-sm font-semibold focus:border-[var(--color-primary)] focus:outline-none"
                      />
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                      Min: {minAdHeight} cm &nbsp;|&nbsp; Max: {maxColHeight} cm
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {/* <AdGridCanvas
            noOfColumnsPerPage={noOfColumnsPerPage}
            maxColHeight={maxColHeight}
          /> */}

          {selectedAdType.key === "casual" && (
            <div className="mt-6 rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
              <h3 className="mb-1 font-normal text-[var(--color-primary-dark)] text-center">
                Advertisement Color Options
              </h3>
              <h3
                className="mb-8 font-normal text-[var(--color-primary-dark)] text-center text-sm"
                style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
              >
                (දැන්වීමේ වර්ණ)
              </h3>

              <div className="flex flex-col md:flex-row gap-4">
                {[
                  {
                    key: "bw",
                    label: "Black & White",
                    subLabel: "(කළු සහ සුදු)",
                    price:
                      formData.adSizeType === "custom"
                        ? selectedAdType.cs_col_bw_price
                        : formData.adSizeType === "full"
                        ? selectedAdType.cs_page_bw_price
                        : 0,
                  },
                  {
                    key: "bw1",
                    label: "Black + 1 Color",
                    subLabel: "(කළු + වර්ණ 1ක්)",
                    price:
                      formData.adSizeType === "custom"
                        ? selectedAdType.cs_col_bw_one_color_price
                        : formData.adSizeType === "full"
                        ? selectedAdType.cs_page_bw_one_color_price
                        : 0,
                  },
                  {
                    key: "bw2",
                    label: "Black + 2 Colors",
                    subLabel: "(කළු + වර්ණ 2ක්)",
                    price:
                      formData.adSizeType === "custom"
                        ? selectedAdType.cs_col_bw_two_color_price
                        : formData.adSizeType === "full"
                        ? selectedAdType.cs_page_bw_two_color_price
                        : 0,
                  },
                  {
                    key: "full",
                    label: "Full Color",
                    subLabel: "(සම්පූර්ණයෙන් වර්ණ කර)",
                    price:
                      formData.adSizeType === "custom"
                        ? selectedAdType.cs_col_full_color_price
                        : formData.adSizeType === "full"
                        ? selectedAdType.cs_page_full_color_price
                        : 0,
                  },
                ].map((option) => (
                  <label
                    key={option.key}
                    className={`cursor-pointer flex flex-col items-center justify-center sm:w-full md:w-1/4 border rounded-md p-3 text-center transition ${
                      formData.colorOption === option.key
                        ? "bg-[var(--color-primary-dark)] text-white border-[var(--color-primary)]"
                        : "bg-white text-[var(--color-primary-dark)] border-gray-300 hover:border-[var(--color-primary)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="colorOption"
                      value={option.key}
                      className="hidden"
                      checked={formData.colorOption === option.key}
                      onChange={() => {
                        updateFormData({
                          colorOption: option.key,
                          // fullPageAd: option.key === "full",
                          // halfPageAdHR: option.key === "half_hr",
                          // halfPageAdVR: option.key === "half_vr",
                        });
                        setselectedColor(option.price);
                      }}
                    />
                    <span className="font-semibold text-sm">
                      {option.label}
                    </span>
                    <span
                      className="text-xs mt-1"
                      style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
                    >
                      {option.subLabel}
                    </span>
                    <span
                      className="text-xs mt-1"
                      style={{ fontFamily: "var(--font-sinhala), sans-serif" }}
                    >
                      {option.price}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Checkboxes */}
          <div className="flex flex-col md:flex-row gap-4 md:mt-8">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.priorityPrice}
                onChange={(e) =>
                  updateFormData({ priorityPrice: e.target.checked })
                }
              />

              <span>
                Priority{" "}
                <span
                  className="text-sm"
                  style={{
                    fontFamily: "var(--font-sinhala), sans-serif",
                  }}
                >
                  (ප්‍රමුඛ දැන්වීමකි)
                </span>{" "}
                {/* (LKR {selectedAdType.priority_price}) */}
              </span>
            </label>
            {selectedAdType.tint_color_price > 0 && (
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.backgroundColor}
                  onChange={(e) =>
                    updateFormData({ backgroundColor: e.target.checked })
                  }
                />
                <span>
                  Background Color{" "}
                  <span
                    className="text-sm"
                    style={{
                      fontFamily: "var(--font-sinhala), sans-serif",
                    }}
                  >
                    (පසුබිම වර්ණගන්වන්න)
                  </span>{" "}
                  {/* (LKR {selectedAdType.tint_color_price}) */}
                </span>
              </label>
            )}
            {selectedAdType.is_allow_combined && (
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.combinedAd}
                  onChange={(e) =>
                    updateFormData({ combinedAd: e.target.checked })
                  }
                />
                <span>
                  Post in Website{" "}
                  <span
                    className="text-sm"
                    style={{
                      fontFamily: "var(--font-sinhala), sans-serif",
                    }}
                  >
                    (වෙබ් අඩවියේ පළකරන්න)
                  </span>{" "}
                </span>
              </label>
            )}
          </div>

          {/* Special Notes */}
          <div className=" md:mt-8">
            <label className="block font-medium mb-1">
              Special Notes{" "}
              <span
                className="text-sm"
                style={{
                  fontFamily: "var(--font-sinhala), sans-serif",
                }}
              >
                (විශේෂ සටහන්)
              </span>{" "}
            </label>
            <textarea
              rows={2}
              value={formData.specialNotes}
              onChange={(e) => updateFormData({ specialNotes: e.target.value })}
              className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-primary-accent resize-none"
            />
          </div>

          {/* Pricing */}
          <div className="bg-gray-100 p-5 rounded-xl shadow-sm sm:max-w-md w-full mx-auto">
            <h3 className="text-lg font-semibold mb-3 text-[var(--color-primary-dark)]">
              Price
            </h3>

            <ul className="divide-y divide-gray-200">
              {priceBreakdown.map((item, i) => (
                <li
                  key={i}
                  className="flex justify-between py-2 text-sm text-[var(--color-text)]"
                >
                  <span>{item.label}</span>
                  <span className="font-medium">
                    LKR {item.amount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 pt-3 border-t border-gray-300 flex justify-between items-center">
              <span className="text-base font-semibold text-[var(--color-primary-dark)]">
                Total
              </span>
              <span className="text-base font-bold text-[var(--color-primary)]">
                LKR {totalPrice.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-[var(--color-primary-dark)] animate-fadeIn">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-[var(--color-primary)] font-bold text-2xl transition-colors"
            >
              &times;
            </button>

            <div className="p-6 space-y-5">
              <h2 className="text-xl md:text-2xl font-bold text-[var(--color-primary-dark)] text-center">
                Casual Advertisement Tips
              </h2>

              <ul className="list-disc list-inside text-sm md:text-base space-y-2 text-gray-700">
                <li>
                  <span className="font-semibold">Width:</span> measured in
                  columns; 1 column = 3.8 cm
                </li>
                <li>
                  <span className="font-semibold">Height:</span> measured in
                  centimeters
                </li>
                <li>
                  <span className="font-semibold">
                    Cost Calculation: (Width × Height × per Column Rate) + Tax
                  </span>
                </li>
              </ul>

              {/* Sample Image */}
              <div className="flex justify-center">
                <img
                  src="/casual-ad-sample.png"
                  alt="Sample ad layout"
                  className="max-w-full h-auto rounded-lg border border-[var(--color-primary-accent)] shadow-sm"
                />
              </div>

              {/* Optional Note */}
              <p className="text-xs text-gray-500 text-center">
                Tip: Use the grid and ad height sliders to customize your ad
                size precisely.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
