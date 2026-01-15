import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const ads = await prisma.advertisements.findMany({
    select: {
      reference_number: true,
      advertiser_id: true,
      newspaper_name: true,
      newspaper_serial_no: true,

      ad_type: true,
      classified_category: true,
      subcategory: true,

      publish_date: true,
      created_at: true,
      updated_at: true,

      advertisement_text: true,
      background_color: true,
      post_in_web: true,
      upload_image: true,
      special_notes: true,

      price: true,
      status: true,

      advertisers: {
        select: {
          name: true,
        },
      },

      newspapers: {
        select: {
          name: true,
        },
      },

      casual_ads: {
        select: {
          ad_size: true,
          no_of_columns: true,
          ad_height: true,
          color_option: true,
          has_artwork: true,
          need_artwork: true,
        },
      },

      classified_ads: {
        select: {
          is_publish_eng: true,
          is_publish_tam: true,
          is_priority: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  const formattedAds = ads.map((ad) => ({
    reference_number: ad.reference_number,

    newspaper_name: ad.newspapers?.name ?? ad.newspaper_name ?? "—",

    ad_type: ad.ad_type,
    classified_category: ad.classified_category,
    subcategory: ad.subcategory,

    publish_date: ad.publish_date,
    created_at: ad.created_at,
    updated_at: ad.updated_at,

    advertisement_text: ad.advertisement_text,
    background_color: ad.background_color,
    post_in_web: ad.post_in_web,
    upload_image: ad.upload_image,
    special_notes: ad.special_notes,

    price: ad.price,
    status: ad.status,

    advertiser_name: ad.advertisers?.name ?? "—",

    casual_ad: ad.casual_ads
      ? {
          ad_size: ad.casual_ads.ad_size,
          no_of_columns: ad.casual_ads.no_of_columns,
          ad_height: ad.casual_ads.ad_height,
          color_option: ad.casual_ads.color_option,
          has_artwork: ad.casual_ads.has_artwork,
          need_artwork: ad.casual_ads.need_artwork,
        }
      : null,

    classified_ad:
      ad.classified_ads.length > 0
        ? {
            is_publish_eng: ad.classified_ads[0].is_publish_eng,
            is_publish_tam: ad.classified_ads[0].is_publish_tam,
            is_priority: ad.classified_ads[0].is_priority,
          }
        : null,
  }));

  return NextResponse.json(formattedAds);
}

export async function PATCH(req: NextRequest) {
  const {
    reference_number,
    advertisement_text,
    status,
    special_notes,
    post_in_web,
  } = await req.json();

  const updatedAd = await prisma.advertisements.update({
    where: { reference_number },
    data: {
      advertisement_text,
      status,
      special_notes,
      post_in_web,
      updated_at: new Date(),
    },
  });

  await prisma.ad_status_history.create({
    data: {
      reference_number,
      status,
    },
  });

  return NextResponse.json(updatedAd);
}
