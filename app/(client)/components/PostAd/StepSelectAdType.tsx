"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

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
  // const [selectedAdType, setSelectedAdType] = useState<AdType | null>(null);
  const selectedAdType = formData.adTypeObject || null;
  const [wordCount, setWordCount] = useState<number>(
    formData.adText?.split(" ").filter(Boolean).length || 0
  );
  const [priceBreakdown, setPriceBreakdown] = useState<
    { label: string; amount: number }[]
  >([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // const [selectedCategory, setSelectedCategory] = useState<string>("");
  const selectedCategory = formData.classifiedCategory || "";
  // const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const selectedSubCategory = formData.subCategory || "";

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
    // setSelectedAdType(adType);
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
    // setSelectedCategory("");
    // setSelectedSubCategory("");
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

    let total = selectedAdType.base_price;
    const breakdown = [
      { label: "Base Price", amount: selectedAdType.base_price },
    ];

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
    formData.backgroundColor,
    formData.combinedAd,
    formData.priorityPrice,
    selectedAdType,
  ]);

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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">Select Ad Type</h2>

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
                <Image
                  src={getAdTypeImage(ad.key)}
                  alt={ad.name}
                  width={120}
                  height={120}
                  className="object-contain mb-2"
                />
                <h3 className="font-semibold text-center">{ad.name}</h3>
                {ad.extra_notes1 && (
                  <p className="text-xs text-gray-500 text-center">
                    {ad.extra_notes1}
                  </p>
                )}
              </div>
            ))}
      </div>

      {selectedAdType && (
        <div className="space-y-4 md:w-2/3 mx-auto">
          {/* Publish Date */}
          <div>
            <label className="block font-medium mb-1">
              Publish Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              min={today}
              value={formData.publishDate || ""}
              onChange={(e) => updateFormData({ publishDate: e.target.value })}
              required
              className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-primary-accent"
            />
          </div>

          {/* Category Dropdown */}
          {(selectedAdType.key === "classified" ||
            selectedAdType.key === "photo_classified" ||
            selectedAdType.key === "casual") && (
            <div>
              <label className="block font-medium mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  // setSelectedCategory(e.target.value);
                  updateFormData({ classifiedCategory: e.target.value });
                  // setSelectedSubCategory("");
                  console.log(formData.classifiedCategory);
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
            <div>
              <label className="block font-medium mb-1">Sub Category</label>
              <select
                value={formData.subCategory || ""}
                onChange={(e) => {
                  // setSelectedSubCategory(e.target.value);
                  updateFormData({ subCategory: e.target.value });
                  console.log(formData.subCategory);
                }}
                className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-primary-accent"
              >
                <option value="">Select Subcategory</option>
                {selectedAdType.categories
                  .find((cat) => cat.category === selectedCategory)
                  ?.subCategories.map((sub) => (
                    <option key={sub.name} value={sub.name}>
                      {sub.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Advertisement Text */}
          <div className="relative">
            <label className="block font-medium mb-1">Advertisement Text</label>
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
              To type in sinhala, go to{" "}
              <a
                href="https://ucsc.cmb.ac.lk/ltrl/services/feconverter/t1.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-800 hover:text-blue-600"
              >
                Sinhala typing
              </a>
              , type your advertisement, copy and then paste it here.
            </p>
          </div>

          {/* Image Upload */}
          {selectedAdType.is_upload_image && (
            <div>
              <label className="block font-medium mb-1">
                Upload Image <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const timestamp = Date.now();
                    const ext = file.name.split(".").pop();
                    const nameWithoutExt = file.name
                      .split(".")
                      .slice(0, -1)
                      .join(".");
                    const uniqueName = `${nameWithoutExt}_${timestamp}.${ext}`;
                    updateFormData({ uploadedImage: uniqueName });
                  }
                }}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary-accent"
              />
              {selectedAdType.extra_notes1 && (
                <p className="text-xs text-gray-500">
                  {selectedAdType.extra_notes1}
                </p>
              )}
            </div>
          )}

          {/* Checkboxes */}
          <div className="flex flex-col md:flex-row gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.priorityPrice}
                onChange={(e) =>
                  updateFormData({ priorityPrice: e.target.checked })
                }
              />

              <span>Priority (LKR {selectedAdType.priority_price})</span>
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
                  Background Color (LKR {selectedAdType.tint_color_price})
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
                <span>Post in Website</span>
              </label>
            )}
          </div>

          {/* Special Notes */}
          <div>
            <label className="block font-medium mb-1">Special Notes</label>
            <textarea
              rows={2}
              value={formData.specialNotes}
              onChange={(e) => updateFormData({ specialNotes: e.target.value })}
              className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-primary-accent resize-none"
            />
          </div>

          {/* Pricing */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Price:</h3>
            <ul className="list-disc pl-6">
              {priceBreakdown.map((item, i) => (
                <li key={i}>
                  {item.label}: LKR {item.amount.toLocaleString()}
                </li>
              ))}
            </ul>
            <p className="font-bold mt-2">
              Total: LKR {totalPrice.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
