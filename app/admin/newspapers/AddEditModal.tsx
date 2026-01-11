"use client";

import { Prisma } from "@prisma/client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const DEFAULT_AD_TYPE = {
  typeKey: "classified",
  name: "",
  baseType: "",
  countFirstWords: 0,
  basePrice: 0,
  additionalWordPrice: 0,
  taxAmount: 0,
  colorOptions: [],
  tintColorPrice: 0,
  priorityPrice: 0,
  isAllowCombined: false,
  maxWords: 0,
  categories: "",
  imgUrl: "",
  isUploadImage: false,
  extraNotes1: "",
  extraNotes2: "",
  csColBWPrice: 0,
  csColBWOneColorPrice: 0,
  csColBWTwoColorPrice: 0,
  csColFullColorPrice: 0,
  csPageBWPrice: 0,
  csPageBWOneColorPrice: 0,
  csPageBWTwoColorPrice: 0,
  csPageFullColorPrice: 0,
  sections: [],
};

const EMPTY_SECTION = {
  name: "",
  extraNotes: "",
  isAvailable: true,
  sizes: [],
};

const EMPTY_SIZE = {
  sizeType: "",
  width: 0,
  height: 0,
  colorOption: "",
  price: 0,
  isSaved: false,
  isAvailable: true,
};

const AD_TYPE_OPTIONS = [
  "classified",
  "photo_classified",
  "casual",
  "death_notice",
  "marriage",
];

export default function AddEditModal({ item, onClose, onSaved }: any) {
  const [form, setForm] = useState(
    item || {
      name: "",
      type: "Daily",
      name_sinhala: "",
      noColPerPage: 0,
      colWidth: 0,
      colHeight: 0,
      minAdHeight: 0,
      tintAdditionalCharge: 0,
      newspaperimg: "", // kept but unused
      is_lang_combine_allowed: false,
      combine_eng_price: 0,
      combine_tam_price: 0,
      combine_eng_tam_price: 0,
      // allowed_weekdays: [],
    }
  );

  const [typeError, setTypeError] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  const validate = () => {
    const newErrors: any = {};
    if (!form.name?.trim()) newErrors.name = "Newspaper name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [adTypes, setAdTypes] = useState<any[]>(() => {
    if (!item || !Array.isArray(item.ad_types)) return [];

    return item.ad_types.map((t: any) => ({
      typeKey: t.key,
      name: t.name,
      baseType: t.base_type,
      countFirstWords: t.count_first_words,
      basePrice: t.base_price,
      priorityPrice: t.priority_price,
      taxAmount: t.tax_amount_2,
      additionalWordPrice: t.additional_word_price,
      tintColorPrice: t.tint_color_price,
      isAllowCombined: t.is_allow_combined,
      maxWords: t.max_words,
      imgUrl: t.img_url || "",
      isUploadImage: t.is_upload_image,
      csColBWPrice: t.cs_col_bw_price,
      csColBWOneColorPrice: t.cs_col_bw_one_color_price,
      csColBWTwoColorPrice: t.cs_col_bw_two_color_price,
      csColFullColorPrice: t.cs_col_full_color_price,
      csPageBWPrice: t.cs_page_bw_price,
      csPageBWOneColorPrice: t.cs_page_bw_one_color_price,
      csPageBWTwoColorPrice: t.cs_page_bw_two_color_price,
      csPageFullColorPrice: t.cs_page_full_color_price,
      extraNotes1: t.extra_notes1 || "",
      extraNotes2: t.extra_notes2 || "",
      categories: "",
      colorOptions: [],
      sections: [],
    }));
  });

  const addNewAdType = () => {
    setAdTypes([...adTypes, { ...DEFAULT_AD_TYPE }]);
  };

  const updateAdType = (index: number, key: string, value: any) => {
    const updated = [...adTypes];
    updated[index][key] = value;
    setAdTypes(updated);
  };

  const addSection = (adTypeIndex: number) => {
    const updated = [...adTypes];

    if (!updated[adTypeIndex].sections) {
      updated[adTypeIndex].sections = [];
    }

    updated[adTypeIndex].sections.push({ ...EMPTY_SECTION });
    setAdTypes(updated);
  };

  const addSize = (adTypeIndex: number, sectionIndex: number) => {
    const updated = [...adTypes];
    updated[adTypeIndex].sections[sectionIndex].sizes.push({ ...EMPTY_SIZE });
    setAdTypes(updated);
  };

  const updateSize = (
    adTypeIndex: number,
    sectionIndex: number,
    sizeIndex: number,
    key: string,
    value: any
  ) => {
    const updated = [...adTypes];
    updated[adTypeIndex].sections[sectionIndex].sizes[sizeIndex][key] = value;
    setAdTypes(updated);
  };

  // ISO weekday numbers
  const WEEKDAYS = [
    { id: 1, label: "Mon", full: "Monday" },
    { id: 2, label: "Tue", full: "Tuesday" },
    { id: 3, label: "Wed", full: "Wednesday" },
    { id: 4, label: "Thu", full: "Thursday" },
    { id: 5, label: "Fri", full: "Friday" },
    { id: 6, label: "Sat", full: "Saturday" },
    { id: 7, label: "Sun", full: "Sunday" },
  ];

  const [allowed_weekdays, setallowed_weekdays] = useState<number[]>([]);

  /* --------------------------------------------------
     IMAGE UPLOAD (COMMENTED FOR NOW)
  -------------------------------------------------- */

  /*
  const handleNewspaperImage = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const ext = file.name.split(".").pop();
    const fileName = `${form.type
      .replace(/\s+/g, "")
      .toLowerCase()}${randomNum}.${ext}`;

    const formData = new FormData();
    formData.append("file", new File([file], fileName));

    try {
      const res = await fetch("/api/uploadNewspaperImage", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.fileName) setForm({ ...form, newspaperimg: data.fileName });
    } catch (err) {
      console.error(err);
    }
  };
  */

  /* ---------------- SAVE ---------------- */
  const save = async () => {
    if (!validate()) return;

    if (adTypes.length === 0) {
      setTypeError(true);
      toast.error("At least one ad type must be added");
      return;
    }

    setTypeError(false);

    const payload = {
      id: item?.id || form.name.replace(/\s+/g, "_").toUpperCase(),
      name: form.name,
      name_sinhala: form.name_sinhala,
      type: form.type,
      no_col_per_page: Number(form.noColPerPage),
      col_width: Number(form.colWidth),
      col_height: Number(form.colHeight),
      min_ad_height: Number(form.minAdHeight),
      tint_additional_charge: Number(form.tintAdditionalCharge),
      newspaper_img: null, // image upload disabled
      is_lang_combine_allowed: Boolean(form.is_lang_combine_allowed),
      combine_eng_price: Number(form.combine_eng_price),
      combine_tam_price: Number(form.combine_tam_price),
      combine_eng_tam_price: Number(form.combine_eng_tam_price),
      allowed_weekdays,
      ad_types: adTypes.map((t) => ({
        key: t.typeKey,
        name: t.name,
        base_type: t.baseType,
        count_first_words: Number(t.countFirstWords),
        base_price: Number(t.basePrice),
        additional_word_price: Number(t.additionalWordPrice),
        tint_color_price: Number(t.tintColorPrice),
        is_allow_combined: Boolean(t.isAllowCombined),
        max_words: Number(t.maxWords),
        img_url: t.imgUrl || null,
        priority_price: Number(t.priorityPrice),
        tax_amount_2: Number(t.taxAmount),
        is_upload_image: Boolean(t.isUploadImage),
        cs_col_bw_price: Number(t.csColBWPrice),
        cs_col_bw_one_color_price: Number(t.csColBWOneColorPrice),
        cs_col_bw_two_color_price: Number(t.csColBWTwoColorPrice),
        cs_col_full_color_price: Number(t.csColFullColorPrice),
        cs_page_bw_price: Number(t.csPageBWPrice),
        cs_page_bw_one_color_price: Number(t.csPageBWOneColorPrice),
        cs_page_bw_two_color_price: Number(t.csPageBWTwoColorPrice),
        cs_page_full_color_price: Number(t.csPageFullColorPrice),
        extra_notes1: t.extraNotes1 || null,
        extra_notes2: t.extraNotes2 || null,
        sections: t.sections.map((s: any) => ({
          name: s.name,
          extra_notes: s.extraNotes,
          is_available: s.isAvailable,
          sizes: s.sizes.map((z: any) => ({
            size_type: z.sizeType,
            width: z.width,
            height: z.height,
            color_option: z.colorOption,
            price: z.price,
            is_available: z.isAvailable,
          })),
        })),
      })),
    };

    try {
      const res = await fetch(
        item?.id ? `/api/newspapers/${item.id}` : "/api/newspapers",
        {
          method: item?.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save newspaper");
      }

      toast.success(
        item?.id
          ? "Newspaper updated successfully"
          : "Newspaper created successfully"
      );
      onSaved();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    }
  };

  useEffect(() => {
    if (!item?.id) return;

    const loadForEdit = async () => {
      try {
        const res = await fetch(`/api/newspapers/${item.id}`);
        if (!res.ok) throw new Error("Failed to load newspaper");

        const data = await res.json();

        // 1️⃣ Populate newspaper form
        setForm({
          name: data.name,
          name_sinhala: data.name_sinhala,
          type: data.type,
          noColPerPage: data.no_col_per_page,
          colWidth: data.col_width,
          colHeight: data.col_height,
          minAdHeight: data.min_ad_height,
          tintAdditionalCharge: data.tint_additional_charge,
          newspaperimg: data.newspaper_img || "",
          is_lang_combine_allowed: data.is_lang_combine_allowed,
          combine_eng_price: data.combine_eng_price,
          combine_tam_price: data.combine_tam_price,
          combine_eng_tam_price: data.combine_eng_tam_price,
          allowed_weekdays: data.allowed_weekdays || [],
        });

        // 2️⃣ Populate ad types with sections + sizes
        if (Array.isArray(data.ad_types)) {
          setAdTypes(
            data.ad_types.map((t: any) => ({
              typeKey: t.key,
              name: t.name,
              baseType: t.base_type,
              countFirstWords: t.count_first_words,
              basePrice: t.base_price,
              additionalWordPrice: t.additional_word_price,
              tintColorPrice: t.tint_color_price,
              priorityPrice: t.priority_price ?? 0,
              taxAmount: t.tax_amount_2 ?? 0.0,
              isAllowCombined: t.is_allow_combined,
              maxWords: t.max_words,
              imgUrl: t.img_url || "",
              isUploadImage: t.is_upload_image,
              csColBWPrice: t.cs_col_bw_price,
              csColBWOneColorPrice: t.cs_col_bw_one_color_price,
              csColBWTwoColorPrice: t.cs_col_bw_two_color_price,
              csColFullColorPrice: t.cs_col_full_color_price,
              csPageBWPrice: t.cs_page_bw_price,
              csPageBWOneColorPrice: t.cs_page_bw_one_color_price,
              csPageBWTwoColorPrice: t.cs_page_bw_two_color_price,
              csPageFullColorPrice: t.cs_page_full_color_price,
              extraNotes1: t.extra_notes1 || "",
              extraNotes2: t.extra_notes2 || "",
              categories: "",
              colorOptions: [],
              sections: Array.isArray(t.ad_sections)
                ? t.ad_sections.map((sec: any) => ({
                    name: sec.name,
                    extraNotes: sec.extra_notes || "",
                    isAvailable: sec.is_available,
                    sizes: Array.isArray(sec.ad_section_sizes)
                      ? sec.ad_section_sizes.map((sz: any) => ({
                          sizeType: sz.size_type,
                          width: sz.width,
                          height: sz.height,
                          colorOption: sz.color_option,
                          price: sz.price,
                          isSaved: true, // mark existing sizes as saved
                          isAvailable: sz.is_available,
                        }))
                      : [],
                  }))
                : [],
            }))
          );
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load newspaper data");
      }
    };

    loadForEdit();
  }, [item?.id]);

  useEffect(() => {
    if (form.type === "Daily") setallowed_weekdays([1, 2, 3, 4, 5, 6, 7]);
    if (form.type === "Sunday") setallowed_weekdays([7]);
    if (form.type === "Weekly") setallowed_weekdays([1]); // default Monday
  }, [form.type]);

  // components/NewspaperSkeleton.tsx
  function NewspaperSkeleton() {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Newspaper Name */}
        <div className="h-6 w-3/5 bg-gray-300 rounded"></div>
        {/* Sinhala Name */}
        <div className="h-6 w-2/5 bg-gray-300 rounded"></div>
        {/* Type / Columns */}
        <div className="h-6 w-1/3 bg-gray-300 rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border border-gray-300 rounded-lg p-4 flex flex-col items-center"
            >
              {/* Ad image placeholder */}
              <div className="w-[120px] h-[120px] bg-gray-300 rounded mb-2"></div>
              {/* Ad name */}
              <div className="h-4 w-2/3 bg-gray-300 rounded mb-1"></div>
              {/* Extra notes */}
              <div className="h-3 w-1/2 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 w-1/3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Form fields */}
        <div className="space-y-4 md:w-2/3 mx-auto md:mt-8">
          <div className="h-6 w-1/3 bg-gray-300 rounded"></div>
          <div className="h-10 w-full bg-gray-200 rounded"></div>
          <div className="h-6 w-1/3 bg-gray-300 rounded mt-4"></div>
          <div className="h-10 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <>
      {!adTypes ? (
        <NewspaperSkeleton />
      ) : (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 p-6 md:p-10">
          <div className="w-full max-w-[1200px] space-y-8 rounded-2xl bg-white p-6 md:p-8 shadow-2xl">
            {/* Header */}
            <div className="border-b pb-4 flex items-start justify-between gap-4">
              {/* Title + subtitle */}
              <div>
                <h2 className="text-2xl font-semibold text-[var(--color-primary-dark)]">
                  {item ? "Edit Newspaper" : "Add Newspaper"}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-highlight)]">
                  Configure newspaper properties and advertisement types
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-200 transition"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Newspaper Details */}
            <div className="rounded-2xl border bg-[var(--color-orange-accent)]/10 p-5">
              <h3 className="mb-4 text-lg font-semibold text-[var(--color-primary-dark)]">
                Newspaper Details
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)]">
                    Newspaper Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none ${
                      errors.name
                        ? "border-red-500 animate-shake"
                        : "border-gray-300"
                    }`}
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      setErrors({ ...errors, name: undefined });
                    }}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Sinhala Name */}
                <div>
                  <label className="flex items-center justify-between text-sm font-medium text-[var(--color-text)]">
                    <span>Newspaper Name (Sinhala)</span>

                    <span className="text-sm border-1 rounded py-.05 px-2 border-[var(--color-primary-accent)]">
                      <a
                        href="https://ucsc.cmb.ac.lk/ltrl/services/feconverter/t1.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Click here to use Sinhala typing tool"
                        className="text-blue-800 hover:text-blue-600 whitespace-nowrap"
                      >
                        සිං
                      </a>
                    </span>
                  </label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    value={form.name_sinhala}
                    onChange={(e) =>
                      setForm({ ...form, name_sinhala: e.target.value })
                    }
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)]">
                    Type
                  </label>
                  <select
                    disabled={!!item}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:bg-gray-100"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option>Daily</option>
                    <option>Sunday</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Publishing Days
                  </label>

                  <div className="grid grid-cols-7 gap-2">
                    {WEEKDAYS.map((day) => {
                      const isSelected = allowed_weekdays.includes(day.id);

                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => {
                            setallowed_weekdays((prev) =>
                              isSelected
                                ? prev.filter((d) => d !== day.id)
                                : [...prev, day.id].sort()
                            );
                          }}
                          className={`
            h-8 rounded-lg border text-sm font-medium transition-all
            flex flex-col items-center justify-center
            ${
              isSelected
                ? "bg-[var(--color-primary-dark)] text-white border-[var(--color-primary)]"
                : "bg-white text-[var(--color-primary-dark)] border-gray-300 hover:border-[var(--color-primary-accent)]"
            }
          `}
                        >
                          <span>{day.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-2 text-xs text-[var(--color-text-highlight)]">
                    Only future dates matching these days will be selectable
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                {/* Metrics */}
                {[
                  ["Columns per Page", "noColPerPage"],
                  ["Column Width (cm)", "colWidth"],
                  ["Column Height (cm)", "colHeight"],
                  ["Minimum Ad Height (cm)", "minAdHeight"],
                  ["Tint Additional Charge", "tintAdditionalCharge"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-text">
                      {label}
                    </label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      value={(form as any)[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: Number(e.target.value) })
                      }
                    />
                  </div>
                ))}
              </div>
              {/* Allow Combined Languages */}
              <div className="mt-8 mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
                  <input
                    type="checkbox"
                    checked={form.is_lang_combine_allowed}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        is_lang_combine_allowed: e.target.checked,
                        ...(e.target.checked
                          ? {}
                          : {
                              combine_eng_price: 0,
                              combine_tam_price: 0,
                              combine_eng_tam_price: 0,
                            }),
                      })
                    }
                    className="h-4 w-4 accent-[var(--color-primary)] cursor-pointer"
                  />
                  Allow Combined Languages
                </label>
              </div>
              {form.is_lang_combine_allowed && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {[
                    ["English Paper Price", "combine_eng_price"],
                    ["Tamil Paper Price", "combine_tam_price"],
                    ["English & Tamil Both Price", "combine_eng_tam_price"],
                  ].map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-[var(--color-text)]">
                        {label}
                      </label>
                      <input
                        type="number"
                        min={0}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        value={(form as any)[key]}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            [key]: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Type Error */}
            {typeError && (
              <p className="text-center text-sm font-medium text-red-600">
                At least one type should be added!
              </p>
            )}

            {/* Types of Ads */}
            <div className="rounded-2xl border bg-gray-50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--color-primary-dark)]">
                  Types of Ads
                </h3>
                <button
                  onClick={addNewAdType}
                  className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)]"
                >
                  Add New Type
                </button>
              </div>

              {adTypes.length === 0 && (
                <p className="text-sm text-gray-500">No ad types added yet.</p>
              )}

              {adTypes.map((t, index) => {
                const DEFAULT_PRICE_FIELDS = [
                  ["First Word Count", "countFirstWords"],
                  ["Base Price", "basePrice"],
                  ["Additional Word Price", "additionalWordPrice"],
                  ["Tint Color Price", "tintColorPrice"],
                ];

                const CASUAL_PRICE_FIELDS = [
                  // ["B&W Price (Per Column)", "csColBWPrice"],
                  // ["B&W + 1 Color (Per Column)", "csColBWOneColorPrice"],
                  // ["B&W + 2 Colors (Per Column)", "csColBWTwoColorPrice"],
                  // ["Full Color (Per Column)", "csColFullColorPrice"],

                  // ["B&W Price (Full Page)", "csPageBWPrice"],
                  // ["B&W + 1 Color (Full Page)", "csPageBWOneColorPrice"],
                  // ["B&W + 2 Colors (Full Page)", "csPageBWTwoColorPrice"],
                  // ["Full Color (Full Page)", "csPageFullColorPrice"],
                  ["Tax Amount (Vat %)", "taxAmount"],
                ];

                const priceFields =
                  t.typeKey === "casual"
                    ? CASUAL_PRICE_FIELDS
                    : DEFAULT_PRICE_FIELDS;

                return (
                  <div
                    key={index}
                    className="mb-5 rounded-xl border bg-white p-4 shadow-sm"
                  >
                    <h4 className="mb-3 text-sm font-semibold text-[var(--color-primary-dark)]">
                      Ad Type #{index + 1}
                    </h4>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4 my-4">
                      {/* Type Selector */}
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-text)]">
                          Select Type Key
                        </label>
                        <select
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          value={t.typeKey}
                          onChange={(e) => {
                            updateAdType(index, "typeKey", e.target.value);
                          }}
                        >
                          {AD_TYPE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Static Fields */}
                      {[
                        ["Display Name", "name", "text"],
                        ["Base Type", "baseType", "text"],
                        ["Max Words", "maxWords", "number"],
                        // ["Priority Price", "priorityPrice", "number"],
                        // ["Tax", "taxAmount", "number"],
                      ].map(([label, key, type]) => (
                        <div key={key as string}>
                          <label className="block text-sm font-medium text-[var(--color-text)]">
                            {label}
                          </label>
                          <input
                            type={type as string}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            value={(t as any)[key] ?? ""}
                            onChange={(e) =>
                              updateAdType(
                                index,
                                key,
                                type === "number"
                                  ? Number(e.target.value)
                                  : e.target.value
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      {/* CONDITIONAL PRICE FIELDS */}
                      {priceFields.map(([label, key]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-[var(--color-text)]">
                            {label}
                          </label>
                          <input
                            type="number"
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            value={(t as any)[key] ?? ""}
                            onChange={(e) =>
                              updateAdType(index, key, Number(e.target.value))
                            }
                          />
                        </div>
                      ))}
                    </div>

                    {t.typeKey === "casual" && (
                      <>
                        {/* AD SIZES TABLE */}
                        <div className="mt-6 space-y-6">
                          <div className="w-full flex justify-center">
                            <button
                              type="button"
                              onClick={() => addSection(index)}
                              className="rounded-md bg-primary-dark px-4 py-2 text-sm text-gray-100"
                            >
                              Add New Section
                            </button>
                          </div>

                          {t.sections?.map((section: any, sIndex: number) => (
                            <div key={sIndex} className="rounded-lg border p-4">
                              {/* SECTION HEADER */}
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                <input
                                  type="text"
                                  placeholder="Section name (Main, Thaksalawa...)"
                                  className="rounded border px-3 py-2 text-sm"
                                  value={section.name}
                                  onChange={(e) => {
                                    const updated = [...adTypes];
                                    updated[index].sections[sIndex].name =
                                      e.target.value;
                                    setAdTypes(updated);
                                  }}
                                />

                                <input
                                  type="text"
                                  placeholder="Extra notes"
                                  className="md:col-span-2 rounded border px-3 py-2 text-sm"
                                  value={section.extraNotes}
                                  onChange={(e) => {
                                    const updated = [...adTypes];
                                    updated[index].sections[sIndex].extraNotes =
                                      e.target.value;
                                    setAdTypes(updated);
                                  }}
                                />

                                <div className="flex items-center gap-2">
                                  <label className="text-sm">Active</label>
                                  <input
                                    type="checkbox"
                                    checked={section.isAvailable ?? true}
                                    onChange={(e) => {
                                      const updated = [...adTypes];
                                      updated[index].sections[
                                        sIndex
                                      ].isAvailable = e.target.checked;
                                      setAdTypes(updated);
                                    }}
                                    className="h-5 w-5 accent-[var(--color-primary)]"
                                  />
                                </div>
                              </div>

                              {/* ADD SIZE */}
                              <div className="w-full flex justify-center mt-4">
                                <button
                                  type="button"
                                  onClick={() => addSize(index, sIndex)}
                                  className="mt-4 text-sm rounded-md border-primary border-1 px-4 py-2 text-primary-dark! hover:text-primary! !bg-transparent"
                                >
                                  Add New Size
                                </button>
                              </div>

                              {/* SIZES TABLE */}
                              <div className="mt-3 overflow-x-auto">
                                <table className="w-full border text-sm">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="border p-2">Size Type</th>
                                      <th className="border p-2">Width</th>
                                      <th className="border p-2">Height</th>
                                      <th className="border p-2">Color</th>
                                      <th className="border p-2">Price</th>
                                      <th className="border p-2">✔</th>
                                      <th className="border p-2">
                                        Active
                                      </th>{" "}
                                      {/* New column */}
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {section.sizes.map(
                                      (sz: any, zIndex: number) => (
                                        <tr
                                          key={zIndex}
                                          className={
                                            !sz.isAvailable ? "opacity-50" : ""
                                          }
                                        >
                                          <td className="border p-2">
                                            <select
                                              className="w-full rounded border px-2 py-1"
                                              value={sz.sizeType}
                                              onChange={(e) =>
                                                updateSize(
                                                  index,
                                                  sIndex,
                                                  zIndex,
                                                  "sizeType",
                                                  e.target.value
                                                )
                                              }
                                              disabled={!sz.isAvailable} // disable if inactive
                                            >
                                              <option value="">Select</option>
                                              <option>full_page</option>
                                              <option>half_page</option>
                                              <option>1/4_page</option>
                                              <option>solus_hr</option>
                                              <option>solus_vr</option>
                                              <option>strip_hr</option>
                                              <option>strip_vr</option>
                                              <option>custom</option>
                                            </select>
                                          </td>

                                          <td className="border p-2">
                                            <input
                                              type="number"
                                              className="w-full rounded border px-2 py-1"
                                              value={sz.width}
                                              onChange={(e) =>
                                                updateSize(
                                                  index,
                                                  sIndex,
                                                  zIndex,
                                                  "width",
                                                  Number(e.target.value)
                                                )
                                              }
                                              disabled={!sz.isAvailable}
                                            />
                                          </td>

                                          <td className="border p-2">
                                            <input
                                              type="number"
                                              className="w-full rounded border px-2 py-1"
                                              value={sz.height}
                                              onChange={(e) =>
                                                updateSize(
                                                  index,
                                                  sIndex,
                                                  zIndex,
                                                  "height",
                                                  Number(e.target.value)
                                                )
                                              }
                                              disabled={!sz.isAvailable}
                                            />
                                          </td>

                                          <td className="border p-2">
                                            <select
                                              className="w-full rounded border px-2 py-1"
                                              value={sz.colorOption}
                                              onChange={(e) =>
                                                updateSize(
                                                  index,
                                                  sIndex,
                                                  zIndex,
                                                  "colorOption",
                                                  e.target.value
                                                )
                                              }
                                              disabled={!sz.isAvailable}
                                            >
                                              <option value="">Select</option>
                                              <option>bw</option>
                                              <option>bw1</option>
                                              <option>bw2</option>
                                              <option>fc</option>
                                            </select>
                                          </td>

                                          <td className="border p-2">
                                            <input
                                              type="number"
                                              className="w-full rounded border px-2 py-1"
                                              value={sz.price}
                                              onChange={(e) =>
                                                updateSize(
                                                  index,
                                                  sIndex,
                                                  zIndex,
                                                  "price",
                                                  Number(e.target.value)
                                                )
                                              }
                                              disabled={!sz.isAvailable}
                                            />
                                          </td>

                                          <td className="border p-2 text-center">
                                            <input
                                              type="checkbox"
                                              checked={sz.isSaved}
                                              onChange={(e) =>
                                                updateSize(
                                                  index,
                                                  sIndex,
                                                  zIndex,
                                                  "isSaved",
                                                  e.target.checked
                                                )
                                              }
                                              disabled={!sz.isAvailable}
                                            />
                                          </td>

                                          {/* Active / Inactive toggle */}
                                          <td className="border p-2 text-center">
                                            <input
                                              type="checkbox"
                                              checked={sz.isAvailable ?? true}
                                              onChange={(e) => {
                                                const updated = [...adTypes];
                                                updated[index].sections[
                                                  sIndex
                                                ].sizes[zIndex].isAvailable =
                                                  e.target.checked;
                                                setAdTypes(updated);
                                              }}
                                              className="h-5 w-5 accent-[var(--color-primary)]"
                                            />
                                          </td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4 my-4">
                      {/* Toggles */}
                      <div className="flex items-center gap-2 md:col-span-4">
                        <div id="reqImg" className="flex items-center gap-1">
                          <input
                            className="h-5 w-5 accent-[var(--color-primary)]"
                            type="checkbox"
                            checked={t.isUploadImage}
                            onChange={(e) =>
                              updateAdType(
                                index,
                                "isUploadImage",
                                e.target.checked
                              )
                            }
                          />
                          <span className="text-sm">Require Image Upload</span>
                        </div>
                      </div>

                      {/* <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={t.isAllowCombined}
                          onChange={(e) =>
                            updateAdType(
                              index,
                              "isAllowCombined",
                              e.target.checked
                            )
                          }
                        />
                        <span className="text-sm">Allow Combined</span>
                      </div> */}

                      {/* Notes */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium">
                          Extra Notes 1
                        </label>
                        <textarea
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          value={t.extraNotes1 ?? ""}
                          onChange={(e) =>
                            updateAdType(index, "extraNotes1", e.target.value)
                          }
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium">
                          Extra Notes 2
                        </label>
                        <textarea
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          value={t.extraNotes2 ?? ""}
                          onChange={(e) =>
                            updateAdType(index, "extraNotes2", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {adTypes.length > 0 && (
                <div className="mb-4 flex justify-center items-center">
                  <button
                    onClick={addNewAdType}
                    className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)]"
                  >
                    Add Next Type
                  </button>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-5 py-2 text-sm transition hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="rounded-lg bg-[var(--color-primary-dark)] px-5 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary)]"
              >
                Save Newspaper
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
