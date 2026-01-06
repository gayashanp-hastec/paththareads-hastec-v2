import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // adjust path to your prisma instance

export async function GET() {
  const ads = await prisma.advertisements.findMany({
    select: {
      reference_number: true,
      newspaper_name: true,
      advertiser_id: true,
      ad_type: true,
      created_at: true,
      status: true,
      advertisement_text: true,
      upload_image: true,
      price: true,
      advertisers: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const formattedAds = ads.map((ad) => ({
    reference_number: ad.reference_number,
    newspaper_name: ad.newspaper_name,
    ad_type: ad.ad_type,
    created_at: ad.created_at,
    status: ad.status,
    advertisement_text: ad.advertisement_text,
    upload_image: ad.upload_image,
    advertiser_name: ad.advertisers?.name ?? "—",
  }));

  return NextResponse.json(formattedAds);
}

export async function PATCH(req: NextRequest) {
  const { reference_number, advertisement_text, status } = await req.json();

  const updatedAd = await prisma.advertisements.update({
    where: { reference_number },
    data: {
      advertisement_text,
      status,
    },
  });

  // Optional: add to status history
  await prisma.ad_status_history.create({
    data: {
      reference_number,
      status,
    },
  });

  return NextResponse.json(updatedAd);
}
