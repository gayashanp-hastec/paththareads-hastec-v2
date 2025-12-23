"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isAdMenuOpen, setIsAdMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending ads count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await fetch("/api/ads");
        const data = await res.json();
        const count = data.filter(
          (ad: any) => ad.status.toLowerCase() === "pending"
        ).length;
        setPendingCount(count);
      } catch (error) {
        console.error("Failed to fetch pending ads count:", error);
      }
    };

    fetchPendingCount();

    // Optional: refresh every 30s
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { name: "Dashboard", href: "/admin" },
    {
      name: "Advertisements",
      href: "/admin/advertisements",
      subItems: [
        { name: "Pending", href: "/admin/advertisements/pending" },
        { name: "Approved", href: "/admin/advertisements/approved" },
        { name: "All", href: "/admin/advertisements/all" },
      ],
    },
    { name: "Newspapers", href: "/admin/newspapers" },
    { name: "Users", href: "/admin" },
    { name: "Reports", href: "/admin" },
  ];

  // Auto-open the submenu if current route matches any subpage
  useEffect(() => {
    if (pathname.startsWith("/admin/advertisements")) {
      setIsAdMenuOpen(true);
    }
  }, [pathname]);

  return (
    <aside className="w-64 h-screen p-6 flex flex-col bg-[var(--color-primary)] text-white">
      {/* Sidebar Header */}
      <div className="flex justify-center items-center">
        <Image
          src="/sample-logo-1.png"
          alt="Paththare Ads Logo"
          width={150}
          height={60}
          className="object-contain"
        />
      </div>
      <h2 className="text-2xl font-extrabold text-center mb-6">Admin</h2>

      {/* Menu */}
      <ul className="flex flex-col gap-3">
        {menuItems.map((item) => (
          <li key={item.name}>
            {item.subItems ? (
              <>
                {/* Main parent menu button */}
                <button
                  onClick={() => setIsAdMenuOpen((prev) => !prev)}
                  className={`w-full flex justify-between items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    pathname.startsWith("/admin/advertisements")
                      ? ""
                      : "hover:bg-[var(--color-primary-dark)]"
                  }`}
                >
                  {item.name}
                  {isAdMenuOpen ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>

                {/* Submenu */}
                <ul
                  className={`pl-6 mt-1 flex flex-col gap-1 overflow-hidden transition-all duration-300 ease-in-out ${
                    isAdMenuOpen ? "max-h-40" : "max-h-0"
                  }`}
                >
                  {item.subItems.map((sub) => (
                    <li key={sub.name}>
                      <Link
                        href={sub.href}
                        className={`flex justify-between items-center px-3 py-2 rounded-md text-sm transition-colors ${
                          pathname === sub.href
                            ? " text-white"
                            : "text-gray-300 hover:bg-[var(--color-primary-dark)]"
                        }`}
                      >
                        {sub.name}

                        {/* Badge for Pending */}
                        {sub.name === "Pending" && (
                          <span
                            className={`ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform transition-all duration-300 ease-in-out ${
                              pendingCount > 0
                                ? "opacity-100 scale-100"
                                : "opacity-0 scale-0"
                            }`}
                          >
                            {pendingCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <Link
                href={item.href}
                className={`block px-4 py-2 rounded-lg font-medium transition-colors hover:bg-[var(--color-primary-dark)]`}
              >
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="mt-auto text-sm text-primary-dark pt-6 border-t border-gray-700 text-center">
        &copy; {new Date().getFullYear()} Paththare Ads
        <br />
        Powered By Hastec
      </div>
    </aside>
  );
}
