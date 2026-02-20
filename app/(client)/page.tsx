"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import NP1LankadeepaModal from "./components/modals/NP1LankadeepaModal";
import { ChevronUp } from "lucide-react";

interface PromoAd {
  id: number;
  ad_name?: string;
  ad_image?: string;
  ad_description?: string;
  is_active?: boolean;
  is_clickable?: boolean;
}

export default function HomePage() {
  const [showAll, setShowAll] = useState(false);
  const [activeTab, setActiveTab] = useState("daily");
  const [activeModal, setActiveModal] = useState<number | null>(null);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [promos, setPromos] = useState<PromoAd[]>([]);

  useEffect(() => {
    async function loadPromos() {
      const res = await fetch("/api/promo");
      const json = await res.json();

      const activePromos = json.data.filter(
        (p: PromoAd) => p.is_active && p.ad_image,
      );

      setPromos(activePromos);
    }

    loadPromos();
  }, []);

  const secondsPerSlide = 4; // adjust speed here

  const animationDuration =
    promos.length > 0 ? promos.length * secondsPerSlide : 20;

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
        className="relative flex min-h-[90vh] w-full items-center bg-white bg-no-repeat bg-cover"
        // style={{ backgroundImage: "url('/banner-4-maroon.png')" }}
      >
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-10 px-4 py-16 md:flex-row md:items-center md:px-6">
          {/* LEFT SIDE */}
          <div className="flex w-full md:w-[40%] flex-col gap-6 text-white">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl text-[var(--color-text)]">
              Advertise{" "}
              <span className="text-[var(--color-primary)]">Smarter</span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed md:text-lg text-[var(--color-text)]">
              Create and manage your ads effortlessly with{" "}
              <strong>Paththare Ads</strong>. Your campaign, your control.
            </p>

            <p className="max-w-xl text-base leading-relaxed md:text-lg text-[var(--color-text)]">
              <strong>Paththare Ads </strong>
              <span
                className="md:text-base"
                style={{
                  fontFamily: "var(--font-sinhala), sans-serif",
                }}
              >
                සමඟින් ඔබේ දැන්වීම් පහසුවෙන් නිර්මාණය කර කළමනාකරණය කරන්න
              </span>
            </p>

            <div className="flex flex-col gap-4 sm:flex-row justify-center md:justify-start md:mt-4">
              <Link
                href="/post-ad"
                className="specialBtn inline-flex items-center justify-center rounded-md px-12 py-4 text-base font-medium transition"
              >
                Post Ad Now
              </Link>
            </div>
          </div>

          {/* RIGHT SIDE – VERTICAL AUTO CAROUSEL */}
          <div className="flex w-full md:w-[60%] justify-end xs:justify-center">
            <div className="carousel-container relative h-[520px] w-full max-w-xl overflow-hidden rounded-2xl shadow-xl">
              <div
                className="carousel-track flex flex-col"
                style={{ animationDuration: `${animationDuration}s` }}
              >
                {[...promos, ...promos].map((promo, index) => (
                  <div key={index} className="p-2">
                    <div className="aspect-video overflow-hidden rounded-xl">
                      <img
                        src={promo.ad_image}
                        alt={promo.ad_name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Animation Styles */}
        <style jsx>{`
          .carousel-track {
            animation-name: scrollVertical;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }

          @keyframes scrollVertical {
            0% {
              transform: translateY(0%);
            }
            100% {
              transform: translateY(-50%);
            }
          }

          .carousel-container:hover .carousel-track {
            animation-play-state: paused;
          }
        `}</style>
      </section>

      {/* ================= HOW TO SECTION ================= */}
      {/* <section
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
            Paththare Ads{" "}
            <span
              className="md:text-xs"
              style={{
                fontFamily: "var(--font-sinhala), sans-serif",
              }}
            >
              සමඟ ඔබේ දැන්වීම නිර්මාණය කිරීමට, ඉදිරිපත් කිරීමට සහ ප්‍රකාශයට පත්
              කිරීමට මෙම සරල පියවර අනුගමනය කරන්න.
            </span>
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
              <div>
                <h3 className="text-lg font-semibold">
                  {
                    [
                      "Select Paper",
                      "Select Ad Type",
                      "Create Your Ad",
                      "Ad Approval",
                      "Payment Details",
                      "Ad Publish",
                    ][i]
                  }
                </h3>
                <h5
                  style={{
                    fontFamily: "var(--font-sinhala), sans-serif",
                  }}
                  className="text-sm font-semibold md:mt-1"
                >
                  {
                    [
                      "(පුවත්පත තෝරන්න)",
                      "(දැන්වීම් වර්ගය තෝරන්න)",
                      "(දැන්වීමේ විස්තර ඇතුල් කරන්න)",
                      "(අනුමැතිය ලබාගැනීම)",
                      "(ගෙවීම් විස්තර)",
                      "(දැන්වීම පළ කිරීම)",
                    ][i]
                  }
                </h5>
              </div>

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
      </section> */}

      {/* ================= NEWSPAPER TABS ================= */}
      {/* <section className="flex flex-col gap-8"> */}
      {/* Tabs */}
      {/* <div className="flex justify-center gap-4">
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
        </div> */}

      {/* Tiles */}
      {/* <div className="flex flex-wrap justify-center gap-4">
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
        </div> */}

      {/* {!showAll && (
          <div className="flex justify-center pt-6">
            <Link
              href="/post-ad"
              className="rounded-md bg-primary px-6 py-3 text-white transition hover:brightness-110"
            >
              Get Started
            </Link>
          </div>
        )} */}
      {/* </section> */}

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
