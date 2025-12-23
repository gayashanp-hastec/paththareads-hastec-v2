"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Menu, X } from "lucide-react";
import clsx from "clsx";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "How To", href: "/#how-to-section" },
    { name: "Ad Board", href: "/ad-board" },
    { name: "About Us", href: "/about-us" },
    { name: "Reviews", href: "/reviews" },
    { name: "Contact Us", href: "/contact-us" },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={clsx(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          "bg-[var(--color-primary)] text-white shadow-md",
          isScrolled ? "h-20" : "h-32 md:h-44"
        )}
      >
        <div className="mx-auto flex h-full max-w-7xl flex-col px-4 md:px-8">
          {/* ================= TOP BAR (DESKTOP ONLY) ================= */}
          {!isScrolled && (
            <div className="hidden items-center justify-end py-1 text-xs sm:flex">
              <a
                href="mailto:themedialink@gmail.com"
                className="flex items-center gap-2 opacity-90 hover:opacity-100"
              >
                <Mail size={14} />
                themedialink@gmail.com
              </a>
            </div>
          )}

          {/* ================= MAIN HEADER ================= */}
          <div className="flex flex-1 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/sample-logo-1.png"
                alt="Paththare Ads Logo"
                width={isScrolled ? 110 : 140}
                height={50}
                className="object-contain transition-all"
                priority
              />
            </Link>

            {/* Search (Desktop Only) */}
            {!isScrolled && (
              <div className="hidden flex-1 justify-center md:flex">
                <input
                  type="text"
                  placeholder="Search ads..."
                  className="w-full max-w-md rounded-full border border-white/40 bg-transparent px-4 py-2 text-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
              </div>
            )}

            {/* Actions (Desktop Only) */}
            {!isScrolled && (
              <div className="hidden items-center gap-3 md:flex">
                <Link
                  href="/post-ad"
                  className="rounded-full bg-orange-accent px-4 py-1.5 text-sm font-medium text-primary-dark transition hover:brightness-110"
                >
                  Post Your Ad
                </Link>

                {/*<button className="rounded-full px-4 py-1.5 text-sm transition hover:bg-white/10">
                  Register
                </button>

                <button className="specialBtn rounded-full px-4 py-1.5 text-sm">
                  Login
                </button>*/}
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center md:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* ================= NAVIGATION (DESKTOP) ================= */}
          <nav className="hidden justify-center md:flex">
            <ul className="flex gap-8 pb-3 text-base">
              {navLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="transition hover:text-[var(--color-text-highlight)]"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      {/* ================= MOBILE MENU ================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-20 z-40 flex flex-col items-center gap-4 bg-[#383A3D] py-6 shadow-md md:hidden">
          {navLinks.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg text-white opacity-90 transition hover:opacity-100"
            >
              {item.name}
            </Link>
          ))}

          <div className="mt-4 flex flex-col gap-3">
            <Link
              href="/post-ad"
              className="rounded-full bg-orange-accent px-6 py-2 text-center text-sm font-medium text-primary-dark"
            >
              Post Your Ad
            </Link>
            <button className="rounded-full border border-white/40 px-6 py-2 text-sm text-white">
              Login / Register
            </button>
          </div>
        </div>
      )}
    </>
  );
}
