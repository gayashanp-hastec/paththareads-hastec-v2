"use client";

import { useEffect } from "react";

interface StepSubmittedForReviewProps {
  referenceNumber: string;
  trackingLink?: string; // optional for safety
}

export default function StepSubmittedForReview({
  referenceNumber,
  trackingLink,
}: StepSubmittedForReviewProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const cleanedLink = trackingLink
    ? trackingLink.replace(/^(https?:\/\/)?[^/]+\/?/, "")
    : trackingLink;

  console.log(cleanedLink);
  console.log(trackingLink);

  return (
    <div className="text-center p-8 bg-gray-50 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-green-700 mb-4">
        🎉 Your ad has been submitted successfully!
      </h2>

      <p className="text-lg mb-4">
        You can now track its progress using your reference number below.
      </p>

      <div className="border border-gray-300 rounded-lg inline-block px-6 py-4 mb-4 bg-white">
        <p className="text-gray-600 font-medium">Reference Number:</p>
        <p className="text-2xl font-bold text-primary-dark">
          {referenceNumber}
        </p>
      </div>

      <p className="text-gray-700 text-lg">
        <span className="font-semibold">Status:</span> Pending
      </p>

      {/* ✅ Show this section only if trackingLink exists */}
      {trackingLink ? (
        <p className="text-gray-700 pt-5 break-all">
          <span className="font-semibold">
            Click on this link to track your progress:
          </span>
          <br />
          <a
            href={cleanedLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {cleanedLink}
          </a>
          <br />
          <span>This link has also been emailed to you.</span>
        </p>
      ) : (
        <p className="text-gray-500 italic pt-5">
          Tracking link will be available soon.
        </p>
      )}
    </div>
  );
}
