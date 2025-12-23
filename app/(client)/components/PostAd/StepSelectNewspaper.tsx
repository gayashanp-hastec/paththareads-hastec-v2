// app/components/PostAd/StepSelectNewspaper.tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import newspaperData from "../../../../data/newspaper_data.json";

interface StepSelectNewspaperProps {
  formData: any;
  updateFormData: (data: any) => void;
  nextStep: () => void;
  setIsNextEnabled?: (enabled: boolean) => void;
}

export default function StepSelectNewspaper({
  formData,
  updateFormData,
  nextStep,
  setIsNextEnabled,
}: StepSelectNewspaperProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "sunday">("daily");

  // Convert JSON object → array
  const newspapers = Object.values(newspaperData as any);

  // Filter newspapers by tab
  const filteredNewspapers = newspapers.filter((paper: any) => {
    const type = paper.type?.toLowerCase();
    return activeTab === "daily" ? type === "daily" : type === "sunday";
  });

  const handleSelectNewspaper = (paper: any) => {
    updateFormData({
      selectedNewspaper: {
        id: paper.id, // ✅ ONLY ID is stored
        name: paper.name,
        type: paper.type,
      },
    });

    setIsNextEnabled?.(true);
  };

  // Restore state on back / refresh
  useEffect(() => {
    if (formData.selectedNewspaper?.id) {
      setIsNextEnabled?.(true);
    }
  }, [formData.selectedNewspaper, setIsNextEnabled]);

  return (
    <section className="flex flex-col gap-6">
      {/* ================= HEADING ================= */}
      <header className="px-4 text-center">
        <h2 className="text-2xl font-bold md:text-3xl">
          Select a newspaper to get started
        </h2>
        <p className="mt-1 text-gray-700">
          (ඔබේ දැන්වීම පළ කිරීම ආරම්භ කිරීමට පුවත්පතක් තෝරන්න)
        </p>
      </header>

      {/* ================= TABS ================= */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setActiveTab("daily")}
          className={`px-5 py-2 rounded-md text-sm font-medium transition
            ${
              activeTab === "daily"
                ? "bg-primary-accent text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          Daily Newspapers
        </button>

        <button
          onClick={() => setActiveTab("sunday")}
          className={`px-5 py-2 rounded-md text-sm font-medium transition
            ${
              activeTab === "sunday"
                ? "bg-primary-accent text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          Sunday Newspapers
        </button>
      </div>

      {/* ================= GRID ================= */}
      <div className="grid grid-cols-2 gap-4 px-4 sm:grid-cols-3 md:grid-cols-4">
        {filteredNewspapers.map((paper: any) => {
          const isSelected = formData.selectedNewspaper?.id === paper.id;

          return (
            <button
              key={paper.id}
              type="button"
              onClick={() => handleSelectNewspaper(paper)}
              aria-pressed={isSelected}
              className={`relative flex aspect-[3/2] items-center justify-center 
                overflow-hidden rounded-lg bg-white shadow-sm transition
                hover:scale-[1.03] focus:outline-none focus:ring-2 
                focus:ring-primary-accent
                ${isSelected ? "ring-4 ring-primary-accent" : ""}
              `}
            >
              <Image
                src={`/newspaper-images/${paper.newspaperimg}`}
                alt={paper.name}
                fill
                className="object-contain p-2"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
