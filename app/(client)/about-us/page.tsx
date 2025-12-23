// app/about-us/page.tsx
"use client";

export default function AboutUsPage() {
  return (
    <div className="font-raleway bg-white min-h-screen flex flex-col py-12">
      {/* Main Content Section */}
      <main className="flex-1 flex flex-col px-6 md:px-12 py-12 space-y-12">
        <section className="max-w-5xl mx-auto flex flex-col space-y-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center text-primary-dark">
            About Media Link
          </h1>

          <p className="text-gray-700 text-lg leading-relaxed text-center">
            Media Link was established in 2009 as an advertising and newspaper
            distributing agency located in Panadura town in Sri Lanka.
          </p>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-primary-accent">
              Our Services
            </h2>

            <ul className="list-disc list-inside space-y-3 text-gray-700 text-lg">
              <li>
                <strong>Print Media Advertising:</strong> Designing, scheduling,
                and publishing casual and classified ads for all newspapers
                published in Sri Lanka.
              </li>
              <li>
                <strong>Electronic Media Advertising:</strong> Innovative ad
                production, scheduling, and broadcasting ads in all radio and TV
                channels in Sri Lanka.
              </li>
              <li>
                <strong>Newspaper Selling and Distribution:</strong> Efficient
                distribution across the region.
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-primary-accent">
              Diversifying Business Segments
            </h2>

            <ul className="list-disc list-inside space-y-3 text-gray-700 text-lg">
              <li>
                <strong>ML Communication:</strong> Graphic designing,
                typesetting, laser/digital & offset printing, mug printing,
                photocopy, laminating, fax, binding, etc.
              </li>
              <li>
                <strong>The Book Bank:</strong> A solution for all school and
                office stationery, printed books, gift & sports items, school
                bags, etc.
              </li>
              <li>
                <strong>Book Link:</strong> Authorized dealers of Atlas Axillia
                Company (Pvt) Limited and wholesalers/distributors of all kinds
                of stationeries.
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
