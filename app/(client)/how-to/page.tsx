"use client";

import Link from "next/link";

export default function HowToPostAdPage() {
  const steps = [
    {
      title: "Select Paper",
      sinhala: "(පුවත්පත තෝරන්න)",
      desc: "First, select your preferred newspaper from the list.",
    },
    {
      title: "Select Ad Type",
      sinhala: "(දැන්වීම් වර්ගය තෝරන්න)",
      desc: "Choose your ad type: Classified, Photo Classified, or Casual.",
    },
    {
      title: "Create Your Ad",
      sinhala: "(දැන්වීමේ විස්තර ඇතුල් කරන්න)",
      desc: "Enter your ad details and submit any required documents.",
    },
    {
      title: "Ad Approval",
      sinhala: "(අනුමැතිය ලබාගැනීම)",
      desc: "Paththare Ads will notify you via email when your ad is approved.",
    },
    {
      title: "Payment Details",
      sinhala: "(ගෙවීම් විස්තර)",
      desc: "Submit your payment via Ezy Cash, MCash, or bank deposit.",
    },
    {
      title: "Ad Publish",
      sinhala: "(දැන්වීම පළ කිරීම)",
      desc: "We’ll send your ad details directly to the newspaper once payment is settled.",
    },
  ];

  return (
    <main className="flex-1 flex flex-col px-6 md:px-12 py-24 space-y-12">
      <section className="max-w-6xl mx-auto flex flex-col space-y-10">
        {/* Heading */}
        <header className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-dark">
            How to Post Your Ad
          </h1>

          <p className="max-w-2xl text-gray-700 text-lg leading-relaxed">
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

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div
              key={i}
              className="bg-gray-50 p-6 rounded-lg shadow-md flex flex-col items-center text-center space-y-3 transition hover:shadow-lg"
            >
              <span className="text-3xl font-bold text-primary-accent">
                {i + 1}
              </span>

              <h3 className="text-lg font-semibold">{step.title}</h3>

              <h5
                className="text-sm font-semibold"
                style={{
                  fontFamily: "var(--font-sinhala), sans-serif",
                }}
              >
                {step.sinhala}
              </h5>

              <p className="text-sm text-gray-600 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center pt-6">
          <Link
            href="/post-ad"
            className="rounded-md bg-primary px-8 py-3 text-white font-medium transition hover:brightness-110"
          >
            Get Started
          </Link>
        </div>
      </section>
    </main>
  );
}
