"use client";

import { useRouter } from "next/navigation";

export default function NoAccessFallback() {
  const router = useRouter();

  return (
    <div className="flex flex-col justify-center items-center min-h-[300px] gap-4">
      <p className="text-red-600 font-semibold text-lg">
        You do not have access to this page.
      </p>

      <button
        onClick={() => router.push("/admin")}
        className="rounded-lg bg-[var(--color-primary)] px-5 py-2 text-white font-medium
                   hover:bg-[var(--color-primary-dark)] transition"
      >
        Go Back
      </button>
    </div>
  );
}
