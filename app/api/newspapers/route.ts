import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all newspapers
export async function GET() {
  const newspapers = await prisma.newspapers.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      newspaper_img: true,
      name_sinhala: true,
      no_col_per_page: true,
      col_height: true,
      min_ad_height: true,
      tint_additional_charge: true,
      newspaper_status: true,
      newspaper_serial_no: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // 🔁 Match frontend key names
  const formatted = newspapers.map((n) => ({
    id: n.id,
    name: n.name,
    type: n.type,
    newspaperimg: n.newspaper_img,
    name_sinhala: n.name_sinhala,
    no_col_per_page: n.no_col_per_page,
    col_height: n.col_height,
    min_ad_height: n.min_ad_height,
    tint_additional_charge: n.tint_additional_charge,
    newspaper_serial_no: n.newspaper_serial_no,
  }));

  return NextResponse.json(formatted);
}

//Create newspaper
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      id,
      name,
      type,
      no_col_per_page,
      col_width,
      col_height,
      min_ad_height,
      tint_additional_charge,
      newspaper_img,
      name_sinhala,
      ad_types = [], // optional
    } = body;

    /* ---------- Basic validation ---------- */
    if (
      !id ||
      !name ||
      !type ||
      no_col_per_page == null ||
      col_width == null ||
      col_height == null ||
      min_ad_height == null ||
      tint_additional_charge == null
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    /* ---------- Transaction ---------- */
    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Create newspaper
      const newspaper = await tx.newspapers.create({
        data: {
          id,
          name,
          type,
          no_col_per_page,
          col_width,
          col_height,
          min_ad_height,
          tint_additional_charge,
          newspaper_img,
          name_sinhala,
        },
      });

      // 2️⃣ Create ad types (if provided)
      if (ad_types.length > 0) {
        await tx.ad_types.createMany({
          data: ad_types.map((ad: any) => ({
            newspaper_id: id,
            key: ad.key,
            name: ad.name,
            base_type: ad.base_type,
            count_first_words: ad.count_first_words,
            base_price: ad.base_price,
            additional_word_price: ad.additional_word_price,
            tint_color_price: ad.tint_color_price,
            is_allow_combined: ad.is_allow_combined,
            max_words: ad.max_words,
            img_url: ad.img_url ?? null,
            cs_col_bw_price: ad.cs_col_bw_price,
            cs_col_bw_one_color_price: ad.cs_col_bw_one_color_price,
            cs_col_bw_two_color_price: ad.cs_col_bw_two_color_price,
            cs_col_full_color_price: ad.cs_col_full_color_price,
            cs_page_bw_price: ad.cs_page_bw_price,
            cs_page_bw_one_color_price: ad.cs_page_bw_one_color_price,
            cs_page_bw_two_color_price: ad.cs_page_bw_two_color_price,
            cs_page_full_color_price: ad.cs_page_full_color_price,
            is_upload_image: ad.is_upload_image,
            extra_notes1: ad.extra_notes1 ?? null,
            extra_notes2: ad.extra_notes2 ?? null,
            priority_price: ad.priority_price ?? null,
          })),
        });
      }

      return newspaper;
    });

    return NextResponse.json(
      { message: "Newspaper created successfully", data: result },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /newspapers error:", error);

    return NextResponse.json(
      {
        message: "Failed to create newspaper",
        error: error?.message,
      },
      { status: 500 }
    );
  }
}
