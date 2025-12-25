"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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
  const [newspapers, setNewspapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch newspapers from DB via API
  useEffect(() => {
    const fetchNewspapers = async () => {
      setLoading(true);
      const res = await fetch("/api/newspapers");
      const data = await res.json();
      setNewspapers(data);
      setLoading(false);
    };

    fetchNewspapers();
  }, []);

  // Filter newspapers by tab
  const filteredNewspapers = newspapers.filter((paper: any) => {
    const type = paper.type?.toLowerCase();
    return activeTab === "daily" ? type === "daily" : type === "sunday";
  });

  const handleSelectNewspaper = (paper: any) => {
    updateFormData({
      selectedNewspaper: {
        id: paper.id,
        name: paper.name,
        type: paper.type,
        name_sinhala: paper.name_sinhala,
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
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="relative flex aspect-[3/2] items-center justify-center 
                  overflow-hidden rounded-lg bg-[var(--color-orange-accent)] animate-pulse shadow-sm"
              />
            ))
          : filteredNewspapers.map((paper: any) => {
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
                  <div
                    className={`flex items-center justify-center w-full h-full p-4 text-center 
                      rounded-xl shadow-lg shadow-gray-400/20 font-bold text-gray-800 text-lg md:text-2xl lg:text-2xl
                      uppercase tracking-wide select-none transition-transform transform hover:scale-105
                    `}
                    style={{
                      background:
                        "linear-gradient(to bottom right, #fff, #fff, var(--color-primary))",
                    }}
                  >
                    {paper.name_sinhala}
                  </div>
                </button>
              );
            })}
      </div>
    </section>
  );
}
