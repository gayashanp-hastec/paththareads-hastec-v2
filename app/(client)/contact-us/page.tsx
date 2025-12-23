"use client";

export default function ContactUsPage() {
  return (
    <main className="flex-1 flex flex-col px-6 md:px-12 py-24 space-y-12">
      <section className="max-w-5xl mx-auto flex flex-col space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-primary-dark">
          Contact Us
        </h1>

        <p className="text-gray-700 text-lg leading-relaxed text-center">
          Reach out to Media Link and our business segments via the following
          contact information.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Media Link (Pvt) Limited */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-md flex flex-col space-y-2">
            <h2 className="text-2xl font-semibold text-primary-accent">
              Media Link (Pvt) Limited
            </h2>
            <p>467, Main Street,</p>
            <p>Panadura.</p>
            <p>Tel: 038 2240060</p>
            <p>Email: themedialink@gmail.com</p>
          </div>

          {/* ML Communication */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-md flex flex-col space-y-2">
            <h2 className="text-2xl font-semibold text-primary-accent">
              ML Communication
            </h2>
            <p>467/1, Main Street,</p>
            <p>Panadura.</p>
            <p>Tel: 038 2236358</p>
            <p>Email: medialink467@gmail.com</p>
          </div>

          {/* The Book Bank */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-md flex flex-col space-y-2">
            <h2 className="text-2xl font-semibold text-primary-accent">
              The Book Bank
            </h2>
            <p>467A, Main Street,</p>
            <p>Panadura.</p>
            <p>Tel: 038 2240060</p>
          </div>

          {/* Book Link */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-md flex flex-col space-y-2">
            <h2 className="text-2xl font-semibold text-primary-accent">
              Book Link
            </h2>
            <p>Station Road,</p>
            <p>Panadura.</p>
            <p>Tel: 038 2240060</p>
            <p>Email: booklink100@gmail.com</p>
          </div>
        </div>
      </section>
    </main>
  );
}
