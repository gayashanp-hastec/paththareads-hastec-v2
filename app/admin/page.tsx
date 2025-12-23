"use client";

import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Link from "next/link";
import { Newspaper, Users, BarChart3, Settings } from "lucide-react";

export default function AdminDashboard() {
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [loadingAds, setLoadingAds] = useState(true);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        setLoadingAds(true);
        const res = await fetch("/api/ads");
        const data = await res.json();
        const pending = data.filter(
          (ad: any) => ad.status?.toLowerCase() === "pending"
        ).length;
        setPendingCount(pending);
      } catch (error) {
        console.error("Error fetching pending ads:", error);
        setPendingCount(0);
      } finally {
        setLoadingAds(false);
      }
    };

    fetchPendingCount();
  }, []);

  const tiles = [
    { name: "Advertisements", icon: <Newspaper size={26} /> },
    { name: "Users", icon: <Users size={26} /> },
    { name: "Reports", icon: <BarChart3 size={26} /> },
    { name: "Settings", icon: <Settings size={26} /> },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-auto space-y-6">
        <h4 className="text-right font-semibold text-gray-600">
          Paththare Ads Admin
        </h4>

        <h2 className="text-2xl font-bold">Quick Links</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-4">
          {tiles.map((tile) => (
            <div
              key={tile.name}
              className={`relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 
              flex flex-col items-center justify-center hover:shadow-2xl hover:scale-[1.03] 
              transition-transform duration-300 cursor-pointer
              ${
                tile.name === "Advertisements" &&
                !loadingAds &&
                pendingCount !== null &&
                pendingCount > 0
                  ? "ring-2 ring-red-400"
                  : ""
              }`}
            >
              <div className="text-blue-600 mb-3">{tile.icon}</div>
              <span className="text-lg font-semibold text-gray-800">
                {tile.name}
              </span>

              {/* Skeleton shimmer for loading Ads */}
              {tile.name === "Advertisements" && loadingAds && (
                <div className="mt-5 w-full flex flex-col gap-3">
                  <div className="h-6 w-full rounded-lg bg-gray-300 relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-full w-1/2 bg-gray-100 opacity-50 animate-shimmer"></div>
                  </div>
                  <div className="h-6 w-full rounded-lg bg-gray-300 relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-full w-1/2 bg-gray-100 opacity-50 animate-shimmer"></div>
                  </div>
                </div>
              )}

              {/* Badge for pending ads */}
              {/* {tile.name === "Advertisements" &&
                !loadingAds &&
                pendingCount !== null &&
                pendingCount > 0 && (
                  <span className="absolute top-3 right-3 inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full shadow-md animate-pulse-slow">
                    {pendingCount}
                  </span>
                )} */}

              {/* Dynamic Buttons */}
              {tile.name === "Advertisements" && !loadingAds ? (
                pendingCount && pendingCount > 0 ? (
                  <div className="mt-5 w-full flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/admin/advertisements"
                      className="flex-1 text-center bg-blue-500 text-white rounded-xl py-2 hover:bg-blue-600 transition"
                    >
                      All Ads
                    </Link>
                    <Link
                      href="/admin/advertisements/pending"
                      className="flex-1 text-center bg-red-500 text-white rounded-xl py-2 hover:bg-red-600 transition"
                    >
                      Pending ({pendingCount})
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/admin/advertisements"
                    className="mt-5 w-full text-center bg-blue-500 text-white rounded-xl py-2 hover:bg-blue-600 transition"
                  >
                    Manage Ads
                  </Link>
                )
              ) : (
                tile.name !== "Advertisements" && (
                  <button className="mt-5 w-full bg-gray-900 text-white rounded-xl py-2 hover:bg-gray-800 transition">
                    View {tile.name}
                  </button>
                )
              )}
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold mt-8">Insights</h2>
        <div className="bg-white rounded-2xl shadow p-6 h-64 flex items-center justify-center text-gray-400">
          [Graphs coming soon]
        </div>
      </main>

      <style jsx>{`
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.02);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2.5s infinite;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
