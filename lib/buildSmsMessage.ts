// lib/buildSmsMessage.ts

export function buildAdSubmitSMS({
  referenceNumber,
  trackingLink,
  to,
  status,
}: {
  referenceNumber: string;
  trackingLink: string;
  to: string;
  status: string;
}) {
  console.log("building : ", status)
  if (to === "user") {
    if (status === "pending") {
      return `Your Ad Submitted Successfully. Wait for admin to review it. Ref Number: ${referenceNumber}
Track: ${trackingLink}`;
    }
    if (status === "resubmit") {
      return `Your Ad ${referenceNumber} has been reviewed and requested to change some content. Please review them`;
    }
    if (status === "Approve" || status === "Approved" || status === "approve" || status === "approved") {
      return `Your Ad ${referenceNumber} has been approved. Please visit your tracking link to do the necessary payments`;
    }
  }
  if (to === "admin") {
    if (status === "pending") {
      return `New Advertisement! Ref: ${referenceNumber}; Log in to PaththareAds Admin Dashboard to review it.`;
    }
  }

}