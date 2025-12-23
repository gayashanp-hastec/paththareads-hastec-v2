import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reference_number, status, advertisement_text } = body;

    // Validate incoming data
    if (!reference_number || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Updating ad:", reference_number, status, advertisement_text);

    // Fetch the original ad to get the original text
    const originalAd = await prisma.advertisements.findUnique({
      where: { reference_number },
    });

    if (!originalAd) {
      return NextResponse.json(
        { error: "Advertisement not found" },
        { status: 404 }
      );
    }

    // Update the advertisement
    const updatedAd = await prisma.advertisements.update({
      where: { reference_number },
      data: {
        status,
        advertisement_text,
      },
    });

    // Create a history record
    await prisma.ad_status_history.create({
      data: {
        reference_number,
        status,
      },
    });

    // Create a review history record
    await prisma.ad_review_history.create({
      data: {
        reference_number,
        advertisement_text: originalAd.advertisement_text, // original text
        requested_revision_text:
          status === "Revision" ? advertisement_text : null, // only store if revision
        reviewed_by: "Admin", // you can replace with actual admin info if available
        status_now: status,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Advertisement ${reference_number} updated successfully`,
      ad: updatedAd,
    });
  } catch (error: any) {
    console.error("Error updating ad:", error);
    return NextResponse.json(
      { error: "Failed to update advertisement", details: error.message },
      { status: 500 }
    );
  }
}
