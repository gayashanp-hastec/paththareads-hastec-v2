"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import AdTypeModal from "../modals/AdTypeModal";
import newspaperData from "../../../../data/newspaper_data.json";

interface StepSelectAdTypeProps {
  formData: any;
  updateFormData: (data: any) => void;
}

interface PriceBreakdownItem {
  label: string;
  amount: number;
}

/**
 * Helper: normalize keys from your JSON into a stable "code" used in the form.
 * - "classified" => "classified"
 * - "photoClassified" => "photo_classified"
 * - "casual" => "casual"
 * - "deathNotice" => "death_notice"
 *
 * This allows older values like "photo_classified" to remain compatible.
 */
const normalizeKeyToCode = (key: string) => {
  if (!key) return key;
  switch (key.toLowerCase()) {
    case "classified":
      return "classified";
    case "photoclassified":
    case "photo_classified":
      return "photo_classified";
    case "casual":
      return "casual";
    case "deathnotice":
    case "death_notice":
      return "death_notice";
    default:
      // fallback: kebab/underscore transform
      return key.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
  }
};

/**
 * Reverse helper: find the typeofAd key in JSON given a normalized code
 */
const findTypeKeyByCode = (typeofAdObj: any, code: string) => {
  if (!typeofAdObj) return null;
  for (const k of Object.keys(typeofAdObj)) {
    if (normalizeKeyToCode(k) === code) return k;
    // also allow matching baseType if provided (e.g. baseType: "classified")
    const bt = typeofAdObj[k]?.baseType;
    if (bt && normalizeKeyToCode(bt) === code) return k;
  }
  return null;
};

export default function StepSelectAdType({
  formData,
  updateFormData,
}: StepSelectAdTypeProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState<number>(
    formData.adText ? formData.adText.split(" ").filter(Boolean).length : 0
  );
  const [price, setPrice] = useState<number>(0);
  const [breakdown, setBreakdown] = useState<PriceBreakdownItem[]>([]);

  // const selectedNewsPaperCode = formData.selectedNewspaper?.code;
  const selectedNewsPaperCode = formData.selectedNewspaper.id;
  const activeTab = formData.selectedNewspaper?.tab?.toLowerCase() || "daily";
  const isSunday = activeTab === "sunday";

  console.log(formData.selectedNewspaper);
  console.log(selectedNewsPaperCode);

  // Build adTypes from JSON for the selected newspaper (one tile per child of typeofAd)
  const adTypesFromJson = useMemo(() => {
    if (!selectedNewsPaperCode) return [];
    const newspaper = (newspaperData as any)[selectedNewsPaperCode];
    if (!newspaper || !newspaper.typeofAd) return [];

    return Object.entries(newspaper.typeofAd).map(([key, obj]: any) => {
      const code = normalizeKeyToCode(key);
      // Provide a friendly display name: prefer the JSON name property if present
      const displayName = obj?.name || key;
      // Choose an image path by normalized code if you have assets; fallback to a generic.
      const image =
        code === "classified"
          ? "/classified.png"
          : code === "photo_classified"
          ? "/photo-classified.png"
          : code === "casual"
          ? "/casual.png"
          : code === "death_notice"
          ? "/death.png"
          : "/ad-default.png";

      const description =
        obj?.extraNotes1 ||
        obj?.extraNotes2 ||
        `${displayName} advertisement option.`;

      return {
        key,
        code,
        name: displayName,
        description,
        image,
        data: obj,
      };
    });
  }, [selectedNewsPaperCode]);

  // Current selected adType code (compatibility with prior codes)
  const selectedAdTypeCode: string | null = formData.adType || null;

  // Utility: get currently selected type data from JSON (object and normalized)
  const getSelectedAdTypeData = () => {
    if (!selectedNewsPaperCode || !selectedAdTypeCode) return null;
    const newspaper = (newspaperData as any)[selectedNewsPaperCode];
    if (!newspaper || !newspaper.typeofAd) return null;

    // First try to find by matching the normalized code against typeofAd keys/baseType
    const key = findTypeKeyByCode(newspaper.typeofAd, selectedAdTypeCode);
    if (key) {
      return { key, ...newspaper.typeofAd[key] };
    }

    // Backwards compatibility: if selected code is "classified" and the user selected a subcategory as "Death Notice"
    if (
      selectedAdTypeCode === "classified" &&
      formData.classifiedCategory === "Death Notice" &&
      newspaper.typeofAd.deathNotice
    ) {
      return { key: "deathNotice", ...newspaper.typeofAd.deathNotice };
    }

    return null;
  };

  // Handle ad text change with max word limit
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const words = e.target.value.split(" ").filter(Boolean);
    const selected = getSelectedAdTypeData();
    const maxWords = selected?.maxWords ?? 65;
    if (words.length <= maxWords) {
      updateFormData({ adText: e.target.value });
      setWordCount(words.length);
    } else {
      // if exceed, you can either prevent or trim — here we prevent adding beyond max
      const trimmed = words.slice(0, maxWords).join(" ");
      updateFormData({ adText: trimmed });
      setWordCount(maxWords);
    }
  };

  const handleDropdownChange = (field: string, value: any) => {
    updateFormData({ [field]: value });
  };

  // Price calculation: similar to your previous logic but using the selected JSON type data
  useEffect(() => {
    const typeData = getSelectedAdTypeData();
    if (!typeData) {
      setPrice(0);
      setBreakdown([]);
      return;
    }

    let total = Number(typeData.basePrice ?? 0);
    const breakdownArr: PriceBreakdownItem[] = [
      {
        label: `First ${typeData.countFirstWords} Words`,
        amount: Number(typeData.basePrice ?? 0),
      },
    ];

    if (formData.adText) {
      const extraWords = Math.max(
        0,
        wordCount - Number(typeData.countFirstWords ?? 0)
      );
      if (extraWords > 0) {
        const extraPrice =
          extraWords * Number(typeData.additionalWordPrice ?? 0);
        total += extraPrice;
        breakdownArr.push({
          label: `Extra Words (${extraWords} × ${typeData.additionalWordPrice})`,
          amount: extraPrice,
        });
      }
    }

    // background color charge only if tintColorPrice > 0 and checkbox selected
    if (formData.backgroundColor && Number(typeData.tintColorPrice ?? 0) > 0) {
      const tint = Number(typeData.tintColorPrice ?? 0);
      total += tint;
      breakdownArr.push({ label: `Background Color`, amount: tint });
    }

    setPrice(total);
    setBreakdown(breakdownArr);
  }, [
    formData.adText,
    formData.backgroundColor,
    selectedAdTypeCode,
    selectedNewsPaperCode,
    formData.classifiedCategory,
    wordCount,
  ]);

  // When user clicks a tile, store the normalized code in formData.adType
  const selectAdType = (code: string) => {
    updateFormData({ adType: code });
    // reset related fields that should change when switching ad type
    updateFormData({
      adText: "",
      backgroundColor: false,
      combinedAd: false,
      uploadedImage: null,
      photoCategory: "",
      vehicleModel: "",
      vehicleType: "",
      vehicleYear: "",
      classifiedCategory: "General",
      classifiedSubCategory: "",
      deathCertificate: null,
    });
    setWordCount(0);
  };

  return (
    <section className="flex flex-col gap-8">
      <h2 className="text-2xl md:text-3xl font-bold text-center">
        Select Ad Type
      </h2>

      {/* Tiles dynamically generated from JSON */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
        {adTypesFromJson.map((t) => (
          <div
            key={t.code}
            onClick={() => selectAdType(t.code)}
            className={`relative border rounded-2xl shadow-md overflow-hidden cursor-pointer 
              w-72 h-72 flex flex-col items-center justify-center p-4 transition 
              ${
                selectedAdTypeCode === t.code
                  ? "ring-4 ring-primary-accent scale-105"
                  : "hover:ring-2 hover:ring-primary-accent"
              }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveModal(t.code);
              }}
              className="absolute top-3 right-3 bg-primary-accent text-white text-sm px-3 py-1 rounded-lg hover:bg-primary-dark"
            >
              i
            </button>

            <Image
              src={t.image}
              alt={t.name}
              width={140}
              height={140}
              className="object-contain mb-4"
            />
            <h3 className="font-semibold text-lg text-center">{t.name}</h3>
            <p className="text-sm text-gray-600 text-center mt-2 px-2 line-clamp-3">
              {t.description}
            </p>
          </div>
        ))}
      </div>

      {/* If a type is selected, show the rest of the fields */}
      {selectedAdTypeCode && (
        <div className="mt-8 space-y-8 md:w-2/3 mx-auto pt-6">
          {/* Publish Date (mandatory) */}
          <div>
            <label className="block mb-2 font-medium">
              Publish Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={formData.publishDate || ""}
              onChange={(e) => updateFormData({ publishDate: e.target.value })}
              required
              className="border border-gray-300 rounded-lg p-2 w-full md:w-1/5 focus:ring-2 focus:ring-primary-accent"
            />
          </div>

          {/* load data for current type */}
          {(() => {
            const t = getSelectedAdTypeData();
            if (!t) return null;

            const categories: string[] = t.categories ?? [];
            const showCategoryDropdown = categories.length > 0;
            const showUpload = Boolean(t.isUploadImage);
            const extraNotes1: string = t.extraNotes1 ?? "";
            const tintColorPrice = Number(t.tintColorPrice ?? 0);
            const allowCombined = Boolean(t.isAllowCombined);

            return (
              <div className="space-y-6">
                {/* Category dropdown if categories exist */}
                {showCategoryDropdown && (
                  <div>
                    <label className="block mb-2 font-medium">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.selectedCategoryForAd || ""}
                      onChange={(e) =>
                        handleDropdownChange(
                          "selectedCategoryForAd",
                          e.target.value
                        )
                      }
                      className="w-full md:w-1/2 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary-accent"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c: string) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Image upload if required */}
                {showUpload && (
                  <div>
                    <label className="block mb-2 font-medium">
                      Upload Image <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        if (file) {
                          // Create unique name: original name without extension + timestamp + original extension
                          const timestamp = Date.now();
                          const fileParts = file.name.split(".");
                          const ext = fileParts.pop(); // get extension
                          const nameWithoutExt = fileParts.join(".");
                          const uniqueFileName = `${nameWithoutExt}_${timestamp}.${ext}`;

                          updateFormData({
                            uploadedImage: uniqueFileName,
                            // optionally store the actual File object too if needed for upload:
                            // uploadedFileObject: file,
                          });
                        } else {
                          updateFormData({
                            uploadedImage: "",
                            // uploadedFileObject: null,
                          });
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-accent
                         file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0
                         file:bg-primary-accent file:text-white file:cursor-pointer hover:file:bg-primary-accent/90"
                    />
                    {extraNotes1 && (
                      <p className="text-xs text-gray-500 mt-2">
                        {extraNotes1}
                      </p>
                    )}
                  </div>
                )}

                {/* If not upload, still show extraNotes1 if present */}
                {!showUpload && extraNotes1 && (
                  <p className="text-xs text-gray-500 mt-2">{extraNotes1}</p>
                )}

                {/* Ad Text (same logic as before) */}
                <div className="relative">
                  <label className="block mb-2 font-medium">
                    Type your advertisement{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="absolute top-0 right-0 text-sm text-gray-500">
                    {wordCount}/{t.maxWords ?? 65} words
                  </div>
                  <textarea
                    rows={5}
                    value={formData.adText || ""}
                    onChange={handleTextChange}
                    placeholder={`Max ${t.maxWords ?? 65} words`}
                    required
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-accent resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Only what you type here will be published.
                  </p>
                </div>

                {/* Optional extra UI for common ad types (kept simple) */}
                {/* Example: Vehicle inputs when selectedCategoryForAd === "Vehicles" */}
                {/* {formData.selectedCategoryForAd === "Automobile" && (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium">
                        Vehicle Model
                      </label>
                      <input
                        type="text"
                        value={formData.vehicleModel || ""}
                        onChange={(e) =>
                          updateFormData({ vehicleModel: e.target.value })
                        }
                        className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-primary-accent"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">
                        Vehicle Type
                      </label>
                      <input
                        type="text"
                        value={formData.vehicleType || ""}
                        onChange={(e) =>
                          updateFormData({ vehicleType: e.target.value })
                        }
                        className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-primary-accent"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">
                        Manufacture Year
                      </label>
                      <input
                        type="number"
                        value={formData.vehicleYear || ""}
                        onChange={(e) =>
                          updateFormData({ vehicleYear: e.target.value })
                        }
                        className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-primary-accent"
                      />
                    </div>
                  </div>
                )} */}

                {/* Checkboxes: Background color (only if tintColorPrice > 0) and Post in Website (only if isAllowCombined) */}
                <div className="flex flex-col md:flex-row gap-6">
                  {tintColorPrice > 0 && (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.backgroundColor)}
                        onChange={(e) =>
                          updateFormData({ backgroundColor: e.target.checked })
                        }
                        className="accent-primary-accent"
                      />
                      <span>
                        Background Color (LKR {tintColorPrice.toLocaleString()})
                      </span>
                    </label>
                  )}

                  {allowCombined && (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.combinedAd)}
                        onChange={(e) =>
                          updateFormData({ combinedAd: e.target.checked })
                        }
                        className="accent-primary-accent"
                      />
                      <span>Post in the Website</span>
                    </label>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Special Notes */}
          <div>
            <label className="block mb-2 font-medium">
              Special Notes (If applicable)
            </label>
            <textarea
              rows={1}
              value={formData.specialNotes || ""}
              onChange={(e) => updateFormData({ specialNotes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-accent resize-none"
            />
          </div>
        </div>
      )}

      {/* PRICE BREAKDOWN */}
      <div className="mt-4 space-y-8 md:w-2/3 mx-auto bg-[#dfece9] p-2">
        <ul className="list-none">
          {breakdown.map((item, index) => (
            <li key={index} className="text-gray-700">
              {item.label}: LKR {item.amount.toLocaleString()}
            </li>
          ))}
        </ul>
        <p className="font-bold text-l mt-2">
          Total Price: LKR {price.toLocaleString()}
        </p>
      </div>

      {/* MODAL */}
      {activeModal && (
        <AdTypeModal
          adType={activeModal}
          onClose={() => setActiveModal(null)}
        />
      )}
    </section>
  );
}
