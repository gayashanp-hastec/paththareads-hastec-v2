"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import NP1LankadeepaModal from "./components/modals/NP1LankadeepaModal";
import { ChevronUp } from "lucide-react";

export default function HomePage() {
  const [showAll, setShowAll] = useState(false);
  const [activeTab, setActiveTab] = useState("daily");
  const [activeModal, setActiveModal] = useState<number | null>(null);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const newspaperTiles = [
    "/np1.png",
    "/np2.png",
    "/np3.png",
    "/np4.png",
    "/np1.png",
    "/newspaper6.png",
    "/newspaper7.png",
    "/newspaper8.png",
    "/newspaper9.png",
    "/newspaper10.png",
    "/newspaper11.png",
    "/newspaper12.png",
    "/newspaper13.png",
  ];
  const newspaperSundayTiles = [
    "/nps1.png",
    "/nps2.png",
    "/np3.png",
    "/np4.png",
    "/np1.png",
    "/newspaper6.png",
    "/newspaper7.png",
    "/newspaper8.png",
    "/newspaper9.png",
    "/newspaper10.png",
    "/newspaper11.png",
    "/newspaper12.png",
    "/newspaper13.png",
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
      setShowTopBtn(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <main className="flex flex-1 flex-col gap-16 py-4">
      {/* ================= HERO / INTRO SECTION ================= */}
      <section
        className="relative flex min-h-[90vh] w-full items-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/banner-4-maroon.png')" }}
      >
        {/* Content Wrapper */}
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-16 md:flex-row md:items-center md:px-12">
          {/* Left: Text */}
          <div className="flex flex-1 flex-col gap-6 text-white">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl text-[var(--color-text)]">
              Advertise{" "}
              <span className="text-[var(--color-primary)]">Smarter</span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed md:text-lg text-[var(--color-text)]">
              Create and manage your ads effortlessly with{" "}
              <strong>Paththare Ads</strong>. Your campaign, your control.
            </p>

            <p className="max-w-xl text-base leading-relaxed md:text-lg text-[var(--color-text)]">
              <strong>Paththare Ads</strong> සමඟින් ඔබේ දැන්වීම් පහසුවෙන්
              නිර්මාණය කර කළමනාකරණය කරන්න
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/post-ad"
                className="specialBtn inline-flex items-center justify-center rounded-md px-8 py-3 text-base font-medium transition hover:brightness-110"
              >
                Post Ad
              </Link>

              <Link
                href="/#how-to-section"
                className="inline-flex items-center justify-center rounded-md border border-primary px-8 py-3 text-base font-medium text-primary transition hover:bg-primary-accent hover:text-white"
              >
                How To
              </Link>
            </div>
          </div>

          {/* Right: Reserved Visual Space */}
          <div className="hidden flex-1 md:block" />
        </div>
      </section>

      {/* ================= HOW TO SECTION ================= */}
      <section
        id="how-to-section"
        className="mx-auto flex w-full max-w-7xl flex-col gap-10 rounded-lg bg-gray-50 px-6 py-14 md:px-12"
      >
        <header className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            How to Post Your Ad
          </h2>
          <p className="max-w-2xl text-base text-gray-700 md:text-lg">
            Follow these simple steps to create, submit, and publish your ad
            with Paththare Ads.
          </p>
          <p className="max-w-2xl text-sm text-gray-500">
            Paththare Ads සමඟ ඔබේ දැන්වීම නිර්මාණය කිරීමට, ඉදිරිපත් කිරීමට සහ
            ප්‍රකාශයට පත් කිරීමට මෙම සරල පියවර අනුගමනය කරන්න.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-4 rounded-lg bg-white p-6 text-center shadow-sm transition hover:shadow-md"
            >
              <span className="text-3xl font-bold text-primary-accent">
                {i + 1}
              </span>

              <h3 className="text-lg font-semibold">
                {
                  [
                    "Select Your Paper",
                    "Select Ad Type",
                    "Create Your Ad",
                    "Ad Approval",
                    "Payment Details",
                    "Ad Publish",
                  ][i]
                }
              </h3>

              <p className="text-sm leading-relaxed text-gray-600">
                {
                  [
                    "First, select your preferred newspaper from the list.",
                    "Choose your ad type: Classified, Photo Classified, or Casual.",
                    "Enter your ad details and submit any required documents.",
                    "Paththare Ads will notify you via email when your ad is approved.",
                    "Submit your payment via Ezy Cash, MCash, or bank deposit.",
                    "We’ll send your ad details directly to the newspaper once payment is settled.",
                  ][i]
                }
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Link
            href="/post-ad"
            className="rounded-md bg-primary px-6 py-3 text-white transition hover:brightness-110"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* ================= NEWSPAPER TABS ================= */}
      <section className="flex flex-col gap-8">
        {/* Tabs */}
        <div className="flex justify-center gap-4">
          {["daily", "sunday"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`rounded-md px-6 py-2 text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-primary text-white shadow"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab === "daily" ? "Daily Newspapers" : "Sunday Newspapers"}
            </button>
          ))}
        </div>

        {/* Tiles */}
        <div className="flex flex-wrap justify-center gap-4">
          {(activeTab === "daily" ? newspaperTiles : newspaperSundayTiles)
            .slice(0, showAll ? undefined : 5)
            .map((tile, idx) => (
              <button
                key={idx}
                onClick={() => setActiveModal(idx)}
                className="flex h-24 w-44 items-center justify-center overflow-hidden rounded-lg shadow transition hover:scale-105 md:h-36 md:w-72"
              >
                <Image
                  src={tile}
                  alt={`Newspaper ${idx + 1}`}
                  width={300}
                  height={150}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
        </div>

        {!showAll && (
          <div className="flex justify-center pt-6">
            <Link
              href="/post-ad"
              className="rounded-md bg-primary px-6 py-3 text-white transition hover:brightness-110"
            >
              Get Started
            </Link>
          </div>
        )}
      </section>

      {/* ================= MODAL ================= */}
      <NP1LankadeepaModal
        isOpen={activeModal === 0}
        onClose={() => setActiveModal(null)}
      />

      {/* ================= BACK TO TOP ================= */}
      {showTopBtn && (
        <button
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-50 rounded-full bg-[#1E2021] p-3 text-[#fdca90] shadow-lg transition hover:bg-[#2a2c2d]"
        >
          <ChevronUp size={22} />
        </button>
      )}
    </main>
  );
}
