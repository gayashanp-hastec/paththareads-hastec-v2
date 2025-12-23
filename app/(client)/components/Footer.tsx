"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-12 w-full border-t border-gray-200 bg-white">
      {/* Links */}
      <nav
        aria-label="Footer navigation"
        className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-6 gap-y-3 px-6 py-6 text-sm text-gray-500"
      >
        <Link href="#" className="hover:text-gray-700 transition">
          Terms & Conditions
        </Link>
        <Link href="#" className="hover:text-gray-700 transition">
          Privacy Policy
        </Link>
        <Link href="#" className="hover:text-gray-700 transition">
          Cookies
        </Link>
        <Link href="/about-us" className="hover:text-gray-700 transition">
          About
        </Link>
      </nav>

      {/* Copyright */}
      <div className="px-6 pb-6 text-center">
        <p className="text-xs text-gray-400 leading-relaxed">
          © {new Date().getFullYear()} Paththare Ads · Developed by{" "}
          <a
            href="https://hastec.co/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gray-500 hover:text-gray-700 transition"
          >
            Hastec Innovations
          </a>
        </p>
      </div>
    </footer>
  );
}
