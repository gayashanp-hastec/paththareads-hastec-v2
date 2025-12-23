"use client";

import { useState } from "react";
import toast from "react-hot-toast";

const DEFAULT_AD_TYPE = {
  typeKey: "classified",
  name: "",
  baseType: "",
  countFirstWords: 0,
  basePrice: 0,
  additionalWordPrice: 0,
  colorOptions: [],
  tintColorPrice: 0,
  isAllowCombined: false,
  maxWords: 0,
  categories: "",
  imgUrl: "",
  isUploadImage: false,
  extraNotes1: "",
  extraNotes2: "",
};

const AD_TYPE_OPTIONS = [
  "classified",
  "photo_classified",
  "casual",
  "death_notice",
];

export default function AddEditModal({ item, onClose, onSaved }: any) {
  const [form, setForm] = useState(
    item || {
      name: "",
      type: "Daily",
      noColPerPage: 0,
      colWidth: 0,
      colHeight: 0,
      minAdHeight: 0,
      tintAdditionalCharge: 0,
      newspaperimg: "",
      typeofAd: {},
    }
  );

  const CATEGORY_SUGGESTIONS = [
    "Real Estate",
    "Automobile",
    "Employment",
    "Trade",
    "Health & Beauty",
    "Personal",
  ];

  const [typeError, setTypeError] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    // newspaperimg?: string;
  }>({});

  const validate = () => {
    const newErrors: any = {};

    if (!form.name?.trim()) {
      newErrors.name = "Newspaper name is required";
    }

    // if (!form.newspaperimg) {
    //   newErrors.newspaperimg = "Newspaper image is required";
    // }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const [adTypes, setAdTypes] = useState(
    item
      ? Object.entries(item.typeofAd).map(([key, value]: any) => ({
          typeKey: key,
          ...value,
          categories: value.categories?.join(", ") || "",
        }))
      : []
  );

  const [uploadingImage, setUploadingImage] = useState(false);

  const addNewAdType = () => {
    setAdTypes([...adTypes, { ...DEFAULT_AD_TYPE }]);
  };

  const updateAdType = (index: number, key: string, value: any) => {
    const updated = [...adTypes];
    updated[index][key] = value;
    setAdTypes(updated);
  };

  // ---------------- Handle newspaper image upload ----------------
  const handleNewspaperImage = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);

    // Generate unique filename
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const ext = file.name.split(".").pop();
    const fileName = `${form.type
      .replace(/\s+/g, "")
      .toLowerCase()}${randomNum}.${ext}`;

    // Upload to API
    const formData = new FormData();
    formData.append("file", new File([file], fileName));

    try {
      const res = await fetch("/api/uploadNewspaperImage", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.fileName) {
        setForm({ ...form, newspaperimg: data.fileName });
      }
    } catch (err) {
      console.error("Image upload failed", err);
    }

    setUploadingImage(false);
  };

  const save = async () => {
    if (!validate()) return;

    if (adTypes.length === 0) {
      setTypeError(true);
      console.log("type no!");
      toast.error("At least one type must be added!");
    } else {
      setTypeError(false);
      const formattedTypes: any = {};

      adTypes.forEach((t) => {
        formattedTypes[t.typeKey] = {
          name: t.name,
          baseType: t.baseType,
          countFirstWords: Number(t.countFirstWords),
          basePrice: Number(t.basePrice),
          additionalWordPrice: Number(t.additionalWordPrice),
          colorOptions: t.colorOptions,
          tintColorPrice: Number(t.tintColorPrice),
          isAllowCombined: Boolean(t.isAllowCombined),
          maxWords: Number(t.maxWords),
          categories: t.categories
            ? t.categories.split(",").map((c: string) => c.trim())
            : [],
          imgUrl: t.imgUrl,
          isUploadImage: Boolean(t.isUploadImage),
          extraNotes1: t.extraNotes1,
          extraNotes2: t.extraNotes2,
        };
      });

      const finalPayload = {
        ...form,
        typeofAd: formattedTypes,
      };

      const method = item ? "PUT" : "POST";
      const url = item ? `/api/newspapers/${item.id}` : "/api/newspapers";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      onSaved();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-start p-10 overflow-auto z-50">
      <div className="bg-white rounded-xl p-6 w-[900px] shadow-xl space-y-6">
        <h2 className="text-2xl font-bold">
          {item ? "Edit Newspaper" : "Add Newspaper"}
        </h2>

        {/* Newspaper Details */}
        <div className="border p-4 rounded-xl bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Newspaper Details</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">
                Newspaper Name
              </label>

              <input
                type="text"
                className={`w-full border p-2 rounded ${
                  errors.name ? "border-red-500 animate-shake" : ""
                }`}
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  setErrors({ ...errors, name: undefined });
                }}
              />

              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">Type</label>
              <select
                disabled={!!item}
                className="w-full border p-2 rounded"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option>Daily</option>
                <option>Sunday</option>
              </select>
            </div>

            {/* Newspaper Image Upload */}
            <div className="col-span-2">
              {/* <label className="block text-sm font-medium">
                Newspaper Image
              </label> */}

              {/* <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  handleNewspaperImage(e);
                  // setErrors({ ...errors, newspaperimg: undefined });
                }}
                className={`w-full border p-2 rounded ${
                  errors.newspaperimg ? "border-red-500 animate-shake" : ""
                }`}
              /> */}

              {/* {uploadingImage && (
                <p className="text-sm text-gray-500">Uploading...</p>
              )}

              {form.newspaperimg && (
                <p className="text-sm mt-1 text-green-600">
                  Uploaded: {form.newspaperimg}
                </p>
              )}

              {errors.newspaperimg && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.newspaperimg}
                </p>
              )} */}
            </div>

            {/* Other fields */}
            <div>
              <label className="block text-sm font-medium">
                Columns per Page
              </label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                value={form.noColPerPage}
                onChange={(e) =>
                  setForm({ ...form, noColPerPage: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Column Width (cm)
              </label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                value={form.colWidth}
                onChange={(e) =>
                  setForm({ ...form, colWidth: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Column Height (cm)
              </label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                value={form.colHeight}
                onChange={(e) =>
                  setForm({ ...form, colHeight: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Minimum Ad Height (cm)
              </label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                value={form.minAdHeight}
                onChange={(e) =>
                  setForm({ ...form, minAdHeight: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Tint Additional Charge
              </label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                value={form.tintAdditionalCharge}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tintAdditionalCharge: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-red-600 text-xl">
            {typeError ? "At least one type should be added!" : ""}
          </p>
        </div>

        {/* Types of Ads */}
        <div className="border p-4 rounded-xl bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Types of Ads</h3>
            <button
              onClick={addNewAdType}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              + Add Type
            </button>
          </div>

          {adTypes.length === 0 && (
            <p className="text-gray-600 text-sm">No ad types added yet.</p>
          )}

          {adTypes.map((t, index) => (
            <div key={index} className="border rounded-xl p-4 mb-4 bg-white">
              <h4 className="font-bold text-md mb-3">Ad Type #{index + 1}</h4>

              <div className="grid grid-cols-2 gap-4">
                {/* Select typeKey */}
                <div>
                  <label className="block text-sm font-medium">
                    Select Type Key
                  </label>
                  <select
                    className="w-full border p-2 rounded"
                    value={t.typeKey}
                    onChange={(e) =>
                      updateAdType(index, "typeKey", e.target.value)
                    }
                  >
                    {AD_TYPE_OPTIONS.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Display Name
                  </label>
                  <input
                    className="w-full border p-2 rounded"
                    value={t.name}
                    onChange={(e) =>
                      updateAdType(index, "name", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Base Type</label>
                  <input
                    className="w-full border p-2 rounded"
                    value={t.baseType}
                    onChange={(e) =>
                      updateAdType(index, "baseType", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    First Word Count
                  </label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded"
                    value={t.countFirstWords}
                    onChange={(e) =>
                      updateAdType(
                        index,
                        "countFirstWords",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Base Price
                  </label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded"
                    value={t.basePrice}
                    onChange={(e) =>
                      updateAdType(index, "basePrice", Number(e.target.value))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Additional Word Price
                  </label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded"
                    value={t.additionalWordPrice}
                    onChange={(e) =>
                      updateAdType(
                        index,
                        "additionalWordPrice",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>

                {/* COLOR OPTIONS */}
                {/* <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Color Options
                  </label>
                  <div className="flex gap-4">
                    {["blackWhite", "color"].map((color) => (
                      <label key={color} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={t.colorOptions.includes(color)}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...t.colorOptions, color]
                              : t.colorOptions.filter((c) => c !== color);
                            updateAdType(index, "colorOptions", updated);
                          }}
                        />
                        {color}
                      </label>
                    ))}
                  </div>
                </div> */}

                <div>
                  <label className="block text-sm font-medium">
                    Tint Color Price
                  </label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded"
                    value={t.tintColorPrice}
                    onChange={(e) =>
                      updateAdType(
                        index,
                        "tintColorPrice",
                        Number(e.target.value)
                      )
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Max Words</label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded"
                    value={t.maxWords}
                    onChange={(e) =>
                      updateAdType(index, "maxWords", Number(e.target.value))
                    }
                  />
                </div>

                {/* Categories */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium">
                    Categories (comma separated)
                  </label>

                  {/* Input */}
                  <input
                    key={t.categories} // 👈 forces animation & re-render if needed
                    className="w-full border p-2 rounded"
                    value={t.categories}
                    placeholder="e.g. Real Estate, Automobile"
                    onChange={(e) =>
                      updateAdType(index, "categories", e.target.value)
                    }
                  />

                  {/* Picker chips */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {CATEGORY_SUGGESTIONS.map((cat) => {
                      const selected = t.categories
                        .split(",")
                        .map((c: string) => c.trim())
                        .filter(Boolean);

                      const isSelected = selected.includes(cat);

                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            const updated = isSelected
                              ? selected.filter((c: string) => c !== cat)
                              : [...selected, cat];

                            updateAdType(
                              index,
                              "categories",
                              updated.join(", ")
                            );
                          }}
                          className={`px-3 py-1 rounded-full text-sm border transition
            ${
              isSelected
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }
          `}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Upload Image */}
                <div>
                  <label className="block text-sm font-medium">
                    Require Image Upload?
                  </label>
                  <input
                    type="checkbox"
                    checked={t.isUploadImage}
                    onChange={(e) =>
                      updateAdType(index, "isUploadImage", e.target.checked)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Allow Combined?
                  </label>
                  <input
                    type="checkbox"
                    checked={t.isAllowCombined}
                    onChange={(e) =>
                      updateAdType(index, "isAllowCombined", e.target.checked)
                    }
                  />
                </div>

                {/* Extra Notes */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium">
                    Extra Notes 1
                  </label>
                  <textarea
                    className="w-full border p-2 rounded"
                    value={t.extraNotes1}
                    onChange={(e) =>
                      updateAdType(index, "extraNotes1", e.target.value)
                    }
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium">
                    Extra Notes 2
                  </label>
                  <textarea
                    className="w-full border p-2 rounded"
                    value={t.extraNotes2}
                    onChange={(e) =>
                      updateAdType(index, "extraNotes2", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Save Newspaper
          </button>
        </div>
      </div>
    </div>
  );
}
