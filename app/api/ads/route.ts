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
    },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(ads);
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
